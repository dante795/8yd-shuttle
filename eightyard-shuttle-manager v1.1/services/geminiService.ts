import { GoogleGenAI, Type } from "@google/genai";
import { Student, DayOfWeek } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const optimizeRouteSuggestions = async (
  students: Student[],
  classTime: string,
  day: string,
  targetBusId: string
): Promise<Array<{ studentId: string; suggestedPickupTime: string }>> => {
  try {
    const dayKey = day as DayOfWeek;
    
    // Filter students who:
    // 1. Have a schedule for this day
    // 2. Class time matches
    // 3. PICKUP bus matches the target bus (optimization is primarily for pickup sequence)
    const studentList = students
      .filter(s => {
        const sch = s.schedules[dayKey];
        return sch && sch.classTime === classTime && sch.pickupBus === targetBusId;
      })
      .map(s => ({
        id: s.id,
        location: s.schedules[dayKey]!.pickupLocation,
        currentPickupTime: s.schedules[dayKey]!.pickupTime
      }));

    if (studentList.length === 0) {
      return [];
    }

    const prompt = `
      I have a list of students taking the ${targetBusId} shuttle for a class starting at ${classTime} on ${day}.
      Please suggest a logical pickup order and specific pickup times (HH:mm format) for this bus route.
      Assume the bus needs to arrive at the academy by ${classTime}.
      Assume stops take about 5-10 minutes between each other.
      Return a JSON array containing the student ID and the new suggested pickup time.

      Students: ${JSON.stringify(studentList)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              studentId: { type: Type.STRING },
              suggestedPickupTime: { type: Type.STRING, description: "Format HH:mm" },
            },
            required: ["studentId", "suggestedPickupTime"],
          },
        },
      },
    });

    const jsonStr = response.text || "[]";
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("Gemini optimization failed:", error);
    return [];
  }
};
