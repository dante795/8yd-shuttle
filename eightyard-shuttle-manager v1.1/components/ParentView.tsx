import React, { useState } from 'react';
import { Student, DayOfWeek } from '../types';
import { DAYS_OF_WEEK, NO_BUS } from '../constants';
import { MapPin, Clock, Bus, BusFront } from 'lucide-react';

interface ParentViewProps {
  students: Student[];
  classTimes: string[];
}

export const ParentView: React.FC<ParentViewProps> = ({ students, classTimes }) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('월');

  // Filter students who use the bus (either for pickup or dropoff)
  const getStudentsByClassAndBus = (time: string, busId: string) => {
    return students
      .filter(s => {
        const schedule = s.schedules[selectedDay];
        if (!schedule || schedule.classTime !== time) return false;
        
        // Include if either pickup OR dropoff is on this bus
        return schedule.pickupBus === busId || schedule.dropoffBus === busId;
      })
      .sort((a, b) => {
        // Sort logic: prioritize pickup time if on this bus, otherwise dropoff time
        const schA = a.schedules[selectedDay]!;
        const schB = b.schedules[selectedDay]!;
        
        const timeA = schA.pickupBus === busId ? schA.pickupTime : schA.dropoffTime;
        const timeB = schB.pickupBus === busId ? schB.pickupTime : schB.dropoffTime;
        
        return (timeA || '00:00').localeCompare(timeB || '00:00');
      });
  };

  const hasAnyStudentsForDay = (time: string) => {
    return students.some(s => s.schedules[selectedDay]?.classTime === time);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Day Selection Tabs */}
      <div className="flex bg-white rounded-xl shadow-sm p-1 mb-6 md:mb-8 overflow-x-auto scrollbar-hide">
        {DAYS_OF_WEEK.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`flex-1 py-3 px-4 md:px-6 rounded-lg text-sm font-semibold transition-all whitespace-nowrap min-w-[60px] md:min-w-[80px] ${
              selectedDay === day
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="space-y-8 md:space-y-12">
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">
            {selectedDay}요일 셔틀 운행표
          </h2>
          <p className="text-sm md:text-base text-slate-500 mt-1">
            각 클래스별 등/하원 시간을 확인해주세요
          </p>
        </div>

        {classTimes.map(time => {
          if (!hasAnyStudentsForDay(time)) return null;
          
          const bus1Students = getStudentsByClassAndBus(time, '1호차');
          const bus2Students = getStudentsByClassAndBus(time, '2호차');

          return (
            <div key={time} className="space-y-4 md:space-y-6">
               <div className="flex items-center gap-3 border-b pb-2 border-slate-200 sticky top-0 bg-slate-50 z-10 py-2">
                  <div className="bg-indigo-600 text-white p-2 rounded-lg">
                    <Clock size={18} className="md:w-5 md:h-5" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-800">{time} 클래스</h3>
               </div>

              {/* 1호차 */}
              {bus1Students.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-blue-50 px-4 md:px-6 py-3 border-b border-blue-100 flex items-center gap-2">
                    <BusFront size={18} className="text-blue-600" />
                    <h4 className="font-bold text-blue-800">1호차 노선</h4>
                  </div>
                  <ShuttleTable students={bus1Students} day={selectedDay} currentBusId="1호차" />
                </div>
              )}

              {/* 2호차 */}
              {bus2Students.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-orange-50 px-4 md:px-6 py-3 border-b border-orange-100 flex items-center gap-2">
                    <BusFront size={18} className="text-orange-600" />
                    <h4 className="font-bold text-orange-800">2호차 노선</h4>
                  </div>
                  <ShuttleTable students={bus2Students} day={selectedDay} currentBusId="2호차" />
                </div>
              )}
            </div>
          );
        })}

        {classTimes.every(time => !hasAnyStudentsForDay(time)) && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
            <p className="text-slate-400">해당 요일에는 운행 일정이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ShuttleTable: React.FC<{ students: Student[], day: DayOfWeek, currentBusId: string }> = ({ students, day, currentBusId }) => {
  return (
    <>
      {/* Mobile Card View (Visible on small screens) */}
      <div className="md:hidden">
        <div className="divide-y divide-slate-100">
          {students.map((student, idx) => {
            const schedule = student.schedules[day];
            if (!schedule) return null;

            const isPickupOnThisBus = schedule.pickupBus === currentBusId;
            const isDropoffOnThisBus = schedule.dropoffBus === currentBusId;

            return (
              <div key={student.id} className="p-4 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-slate-900 text-base">
                    {student.name}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Pickup Info */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                      <Bus size={12} className="text-indigo-500" /> 승차
                    </div>
                    {isPickupOnThisBus ? (
                      <div className="flex flex-col">
                        <span className="font-bold text-indigo-600 text-base mb-0.5">{schedule.pickupTime}</span>
                        <span className="text-sm text-slate-700 break-keep leading-snug">{schedule.pickupLocation}</span>
                      </div>
                    ) : (
                      schedule.pickupBus === NO_BUS && isDropoffOnThisBus ? (
                        <span className="text-slate-400 text-xs font-medium bg-white border border-slate-200 px-2 py-1 rounded inline-block">
                          개별 등원
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium bg-white border border-slate-200 px-2 py-1 rounded inline-block">
                          {schedule.pickupBus} 탑승
                        </span>
                      )
                    )}
                  </div>

                  {/* Dropoff Info */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                      <MapPin size={12} className="text-orange-500" /> 하차
                    </div>
                    {isDropoffOnThisBus ? (
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 text-base mb-0.5">{schedule.dropoffTime}</span>
                        <span className="text-sm text-slate-700 break-keep leading-snug">{schedule.dropoffLocation}</span>
                      </div>
                    ) : (
                       schedule.dropoffBus === NO_BUS && isPickupOnThisBus ? (
                         <span className="text-slate-400 text-xs font-medium bg-white border border-slate-200 px-2 py-1 rounded inline-block">
                           개별 하원
                         </span>
                       ) : (
                        <span className="text-slate-400 text-xs font-medium bg-white border border-slate-200 px-2 py-1 rounded inline-block">
                           {schedule.dropoffBus} 탑승
                        </span>
                       )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Table View (Visible on medium screens and up) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">순서</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">학생 이름</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <Bus size={14} /> 승차 (Pickup)
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <MapPin size={14} /> 하차 (Dropoff)
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student, idx) => {
              const schedule = student.schedules[day];
              if (!schedule) return null;

              const isPickupOnThisBus = schedule.pickupBus === currentBusId;
              const isDropoffOnThisBus = schedule.dropoffBus === currentBusId;

              return (
                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="bg-slate-200 text-slate-600 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                    {student.name}
                  </td>
                  <td className="px-6 py-4">
                    {isPickupOnThisBus ? (
                      <div className="flex flex-col">
                        <span className="font-bold text-indigo-600 text-lg">{schedule.pickupTime}</span>
                        <span className="text-sm text-slate-500 break-words">{schedule.pickupLocation}</span>
                      </div>
                    ) : (
                      schedule.pickupBus === NO_BUS && isDropoffOnThisBus ? (
                         <span className="text-slate-400 text-sm font-medium bg-slate-100 px-2 py-1 rounded">
                           개별 등원
                         </span>
                      ) : (
                       <span className="text-slate-400 text-sm font-medium bg-slate-100 px-2 py-1 rounded">
                         {schedule.pickupBus} 탑승
                       </span>
                      )
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isDropoffOnThisBus ? (
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 text-lg">{schedule.dropoffTime}</span>
                        <span className="text-sm text-slate-500 break-words">{schedule.dropoffLocation}</span>
                      </div>
                    ) : (
                       schedule.dropoffBus === NO_BUS && isPickupOnThisBus ? (
                         <span className="text-slate-400 text-sm font-medium bg-slate-100 px-2 py-1 rounded">
                           개별 하원
                         </span>
                       ) : (
                        <span className="text-slate-400 text-sm font-medium bg-slate-100 px-2 py-1 rounded">
                           {schedule.dropoffBus} 탑승
                        </span>
                       )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};
