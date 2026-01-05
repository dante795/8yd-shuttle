import { Student } from '../types';
import { GOOGLE_SCRIPT_URL } from '../constants';

interface DataPayload {
  students: Student[];
  classTimes: string[];
}

export const googleSheetService = {
  // Fetch data from Google Sheet
  getData: async (): Promise<DataPayload | null> => {
    if (!GOOGLE_SCRIPT_URL) {
      console.warn("Google Script URL is not configured");
      return null;
    }

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      return null;
    }
  },

  // Save data to Google Sheet
  saveData: async (students: Student[], classTimes: string[]): Promise<boolean> => {
    if (!GOOGLE_SCRIPT_URL) return false;

    try {
      // We use 'no-cors' mode for Google Apps Script usually, but to get response we use standard POST.
      // However, standard POST to GAS requires handling CORS redirects.
      // For simplicity in this setup, we use text/plain to avoid preflight OPTIONS check issues on simple GAS webapps
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ students, classTimes }),
      });

      const result = await response.json();
      return result.status === 'success';
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  }
};