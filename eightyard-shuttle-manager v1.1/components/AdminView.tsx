import React, { useState } from 'react';
import { Student, DayOfWeek, DailySchedule } from '../types';
import { DAYS_OF_WEEK, NO_BUS } from '../constants';
import { Plus, Trash2, Edit2, X, Sparkles, Settings, BusFront, AlertTriangle, ArrowUp, ArrowDown, Bus, MapPin, Save } from 'lucide-react';
import { Button } from './Button';
import { optimizeRouteSuggestions } from '../services/geminiService';
import { googleSheetService } from '../services/googleSheetService';

interface AdminViewProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  classTimes: string[];
  setClassTimes: React.Dispatch<React.SetStateAction<string[]>>;
  onSyncStart: () => void;
  onSyncEnd: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ 
  students, 
  setStudents, 
  classTimes, 
  setClassTimes,
  onSyncStart,
  onSyncEnd
}) => {
  const [view, setView] = useState<'students' | 'settings'>('students');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // --- New Student Form State ---
  const [newName, setNewName] = useState('');
  const [newPickupBus, setNewPickupBus] = useState('1호차');
  const [newDropoffBus, setNewDropoffBus] = useState('1호차');
  const [newClassTime, setNewClassTime] = useState(classTimes[0] || '');
  
  // Default values to apply to selected days
  const [defaultSchedule, setDefaultSchedule] = useState<DailySchedule>({
    classTime: '', // Will be set from newClassTime on creation
    pickupBus: '', // Will be set
    dropoffBus: '', // Will be set
    pickupLocation: '',
    dropoffLocation: '학원 정문',
    pickupTime: '14:00',
    dropoffTime: '15:00'
  });
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);

  // Helper function to save changes to cloud
  const syncToCloud = async (newStudents: Student[], newClassTimes: string[]) => {
    onSyncStart();
    await googleSheetService.saveData(newStudents, newClassTimes);
    onSyncEnd();
  };

  // --- Student Management ---
  
  const handleAddStudent = () => {
    // If bus is used, location is required. If NO_BUS, location can be empty.
    const isPickupValid = newPickupBus === NO_BUS || !!defaultSchedule.pickupLocation;
    
    if (!newName || !isPickupValid || selectedDays.length === 0) return;
    
    const schedules: Partial<Record<DayOfWeek, DailySchedule>> = {};
    selectedDays.forEach(day => {
      schedules[day] = { 
        ...defaultSchedule,
        classTime: newClassTime,
        pickupBus: newPickupBus,
        dropoffBus: newDropoffBus
      };
    });
    
    const student: Student = {
      id: Date.now().toString(),
      name: newName,
      schedules: schedules
    };
    
    const updatedStudents = [...students, student];
    setStudents(updatedStudents);
    syncToCloud(updatedStudents, classTimes);
    
    // Reset Form
    setNewName('');
    setSelectedDays([]);
    setDefaultSchedule({
      classTime: '',
      pickupBus: '',
      dropoffBus: '',
      pickupLocation: '',
      dropoffLocation: '학원 정문',
      pickupTime: '14:00',
      dropoffTime: '15:00'
    });
  };

  const confirmDeleteStudent = () => {
    if (deleteConfirmationId) {
      const updatedStudents = students.filter(s => s.id !== deleteConfirmationId);
      setStudents(updatedStudents);
      syncToCloud(updatedStudents, classTimes);
      setDeleteConfirmationId(null);
    }
  };

  const handleUpdateStudent = (id: string, updated: Student) => {
    const updatedStudents = students.map(s => s.id === id ? updated : s);
    setStudents(updatedStudents);
    syncToCloud(updatedStudents, classTimes);
    setEditingStudentId(null);
  };

  const toggleNewStudentDay = (day: DayOfWeek) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // --- AI Optimization ---
  
  const handleOptimize = async () => {
    const classTime = prompt("자동 정렬할 클래스 시간을 입력하세요 (예: 2:30)");
    if (!classTime || !classTimes.includes(classTime)) {
      alert("유효한 클래스 시간이 아닙니다.");
      return;
    }
    const day = prompt("요일을 입력하세요 (예: 월)");
    if (!day || !DAYS_OF_WEEK.includes(day as DayOfWeek)) return;

    const busId = prompt("최적화할 호차를 입력하세요 (예: 1호차)");
    if (!busId || !['1호차', '2호차'].includes(busId)) return;

    setOptimizing(true);
    // Find students who have a schedule for this day, matching class time, AND matching PICKUP bus
    const targetStudents = students.filter(s => {
      const sch = s.schedules[day as DayOfWeek];
      return sch && sch.classTime === classTime && sch.pickupBus === busId;
    });
    
    if (targetStudents.length === 0) {
      alert("해당 조건의 학생이 없습니다.");
      setOptimizing(false);
      return;
    }

    const suggestions = await optimizeRouteSuggestions(targetStudents, classTime, day, busId);
    
    if (suggestions.length > 0) {
      const updatedStudents = students.map(s => {
        const suggestion = suggestions.find(sugg => sugg.studentId === s.id);
        if (suggestion && s.schedules[day as DayOfWeek]) {
          return {
            ...s,
            schedules: {
              ...s.schedules,
              [day as DayOfWeek]: {
                ...s.schedules[day as DayOfWeek]!,
                pickupTime: suggestion.suggestedPickupTime
              }
            }
          };
        }
        return s;
      });
      setStudents(updatedStudents);
      syncToCloud(updatedStudents, classTimes);
      alert("AI가 승차 시간을 최적화하여 업데이트했습니다.");
    } else {
      alert("AI 최적화에 실패했거나 변경 사항이 없습니다.");
    }
    setOptimizing(false);
  };

  // --- Class Time Management ---

  const [inputClassTime, setInputClassTime] = useState('');
  const handleAddClassTime = () => {
    if (inputClassTime && !classTimes.includes(inputClassTime)) {
      // Don't sort automatically, append to end to respect custom order
      const updatedClassTimes = [...classTimes, inputClassTime];
      setClassTimes(updatedClassTimes);
      syncToCloud(students, updatedClassTimes);
      setInputClassTime('');
    }
  };
  const handleDeleteClassTime = (time: string) => {
    if (confirm(`'${time}' 클래스를 삭제하시겠습니까?`)) {
      const updatedClassTimes = classTimes.filter(t => t !== time);
      setClassTimes(updatedClassTimes);
      syncToCloud(students, updatedClassTimes);
    }
  };
  
  const moveClassTime = (index: number, direction: 'up' | 'down') => {
    const newTimes = [...classTimes];
    if (direction === 'up' && index > 0) {
      [newTimes[index - 1], newTimes[index]] = [newTimes[index], newTimes[index - 1]];
    } else if (direction === 'down' && index < newTimes.length - 1) {
      [newTimes[index + 1], newTimes[index]] = [newTimes[index], newTimes[index + 1]];
    }
    setClassTimes(newTimes);
    syncToCloud(students, newTimes);
  };

  // Common input styles: White background, black text
  const inputStyle = "border border-slate-300 p-2 rounded bg-white text-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full";
  const selectStyle = "border border-slate-300 p-2 rounded bg-white text-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="border-b border-slate-200 p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-slate-50 rounded-t-xl">
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            variant={view === 'students' ? 'primary' : 'ghost'} 
            onClick={() => setView('students')}
            className="flex-1 md:flex-none justify-center"
          >
            학생 관리
          </Button>
          <Button 
            variant={view === 'settings' ? 'primary' : 'ghost'} 
            onClick={() => setView('settings')}
            className="flex-1 md:flex-none justify-center"
          >
            <Settings size={18} className="mr-1" /> 설정
          </Button>
        </div>
        
        {view === 'students' && (
           <Button variant="secondary" onClick={handleOptimize} isLoading={optimizing} className="w-full md:w-auto text-indigo-600 border-indigo-200 bg-indigo-50 justify-center">
             <Sparkles size={16} className="mr-2" />
             AI 시간 자동 정렬
           </Button>
        )}
      </div>

      <div className="p-4 md:p-6">
        {view === 'settings' && (
          <div className="max-w-xl mx-auto md:mx-0">
            <h3 className="text-lg font-bold mb-4">클래스 시간 및 순서 관리</h3>
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="예: 6:30" 
                className={`${inputStyle} flex-1`}
                value={inputClassTime}
                onChange={e => setInputClassTime(e.target.value)}
              />
              <Button onClick={handleAddClassTime}>추가</Button>
            </div>
            <ul className="space-y-2">
              {classTimes.map((time, idx) => (
                <li key={time} className="flex justify-between items-center p-3 bg-slate-50 rounded border">
                  <span className="font-mono font-bold">{time}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1 mr-2">
                      <button 
                        onClick={() => moveClassTime(idx, 'up')} 
                        disabled={idx === 0}
                        className="text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button 
                        onClick={() => moveClassTime(idx, 'down')} 
                        disabled={idx === classTimes.length - 1}
                        className="text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                    <button onClick={() => handleDeleteClassTime(time)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {view === 'students' && (
          <>
            {/* Add Student Form */}
            <div className="mb-8 p-4 md:p-5 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Plus size={20} /> 학생 등록
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                 <div>
                   <label className="block text-xs text-slate-500 mb-1 ml-1">이름</label>
                   <input
                    placeholder="이름"
                    className={`${inputStyle}`}
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                  />
                 </div>
                 <div>
                   <label className="block text-xs text-slate-500 mb-1 ml-1">기본 클래스</label>
                   <select 
                     className={`${selectStyle}`}
                     value={newClassTime}
                     onChange={e => setNewClassTime(e.target.value)}
                   >
                     {classTimes.map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                </div>
                 <div>
                   <label className="block text-xs text-slate-500 mb-1 ml-1">기본 승차</label>
                   <select 
                    className={`${selectStyle}`}
                    value={newPickupBus}
                    onChange={e => setNewPickupBus(e.target.value)}
                  >
                    <option value="1호차">1호차</option>
                    <option value="2호차">2호차</option>
                    <option value={NO_BUS}>{NO_BUS}</option>
                  </select>
                </div>
                <div>
                   <label className="block text-xs text-slate-500 mb-1 ml-1">기본 하차</label>
                   <select 
                    className={`${selectStyle}`}
                    value={newDropoffBus}
                    onChange={e => setNewDropoffBus(e.target.value)}
                  >
                    <option value="1호차">1호차</option>
                    <option value="2호차">2호차</option>
                    <option value={NO_BUS}>{NO_BUS}</option>
                  </select>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-slate-200 mb-4">
                <h4 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">공통 일정 설정</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div className={newPickupBus === NO_BUS ? 'opacity-50 pointer-events-none' : ''}>
                    <input
                      placeholder="승차 위치"
                      className={inputStyle}
                      value={defaultSchedule.pickupLocation}
                      onChange={e => setDefaultSchedule({...defaultSchedule, pickupLocation: e.target.value})}
                    />
                  </div>
                  <div className={newDropoffBus === NO_BUS ? 'opacity-50 pointer-events-none' : ''}>
                    <input
                      placeholder="하차 위치"
                      className={inputStyle}
                      value={defaultSchedule.dropoffLocation}
                      onChange={e => setDefaultSchedule({...defaultSchedule, dropoffLocation: e.target.value})}
                    />
                  </div>
                  <div className={`flex items-center gap-2 ${newPickupBus === NO_BUS ? 'opacity-50 pointer-events-none' : ''}`}>
                    <span className="text-xs text-slate-500 whitespace-nowrap">승차</span>
                    <input
                      type="time"
                      className={`${inputStyle}`}
                      value={defaultSchedule.pickupTime}
                      onChange={e => setDefaultSchedule({...defaultSchedule, pickupTime: e.target.value})}
                    />
                  </div>
                   <div className={`flex items-center gap-2 ${newDropoffBus === NO_BUS ? 'opacity-50 pointer-events-none' : ''}`}>
                    <span className="text-xs text-slate-500 whitespace-nowrap">하차</span>
                    <input
                      type="time"
                      className={`${inputStyle}`}
                      value={defaultSchedule.dropoffTime}
                      onChange={e => setDefaultSchedule({...defaultSchedule, dropoffTime: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-slate-700 flex items-center mr-2">요일 선택:</span>
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day}
                      onClick={() => toggleNewStudentDay(day)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        selectedDays.includes(day)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleAddStudent} disabled={!newName || selectedDays.length === 0} className="w-full">
                등록하기
              </Button>
            </div>

            {/* Student List Container */}
            <div className="bg-white rounded-lg">
              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-100">
                {students.map(student => {
                  const activeDays = DAYS_OF_WEEK.filter(d => student.schedules[d]);
                  return (
                    <div key={student.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-slate-900 text-lg">{student.name}</div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingStudentId(student.id)} className="text-indigo-600 hover:text-indigo-800 p-1 bg-indigo-50 rounded">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => setDeleteConfirmationId(student.id)} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                         {activeDays.length > 0 ? (
                           <div className="space-y-3">
                             {activeDays.map(d => {
                               const sch = student.schedules[d];
                               const busInfo = sch?.pickupBus === sch?.dropoffBus 
                                ? sch?.pickupBus 
                                : `${sch?.pickupBus}/${sch?.dropoffBus}`;
                               return (
                                 <div key={d} className="border-l-2 border-indigo-300 pl-3">
                                   <div className="flex items-center flex-wrap gap-2 mb-1">
                                      <span className="font-bold text-indigo-700">{d}요일</span>
                                      <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-mono font-bold">{sch?.classTime}</span>
                                      <span className={`px-1.5 py-0.5 rounded font-semibold flex items-center ${busInfo?.includes('1호차') ? 'text-blue-700 bg-blue-100' : busInfo?.includes('2호차') ? 'text-orange-700 bg-orange-100' : 'text-slate-600 bg-slate-200'}`}>
                                        <BusFront size={10} className="mr-1"/>
                                        {busInfo}
                                      </span>
                                   </div>
                                   <div className="text-slate-600 leading-snug break-keep">
                                    {sch?.pickupBus === NO_BUS ? '개별 등원' : `${sch?.pickupLocation} (${sch?.pickupTime})`}
                                    <div className="my-0.5 border-t border-slate-200 border-dashed w-12"></div>
                                    {sch?.dropoffBus === NO_BUS ? '개별 하원' : sch?.dropoffLocation}
                                   </div>
                                 </div>
                               );
                             })}
                           </div>
                         ) : (
                           <span className="text-slate-400">일정 없음</span>
                         )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 text-slate-600 uppercase">
                    <tr>
                      <th className="p-3 w-32">이름</th>
                      <th className="p-3">요일별 일정 및 정보</th>
                      <th className="p-3 text-right w-28">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map(student => {
                      const activeDays = DAYS_OF_WEEK.filter(d => student.schedules[d]);
                      return (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="p-3 font-medium align-top">
                            <div className="flex items-center gap-2">
                              {student.name}
                            </div>
                          </td>
                          <td className="p-3 text-xs text-slate-500">
                             {activeDays.length > 0 ? (
                               <div className="flex flex-wrap gap-y-3">
                                 {activeDays.map(d => {
                                   const sch = student.schedules[d];
                                   const busInfo = sch?.pickupBus === sch?.dropoffBus 
                                    ? sch?.pickupBus 
                                    : `${sch?.pickupBus}/${sch?.dropoffBus}`;
                                   return (
                                     <div key={d} className="mr-4 mb-1 border-l-2 border-indigo-200 pl-2">
                                       <div className="flex items-center gap-2 mb-0.5">
                                          <span className="font-bold text-indigo-700">{d}요일</span>
                                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono">{sch?.classTime}</span>
                                          <span className={`px-1.5 py-0.5 rounded font-semibold ${busInfo?.includes('1호차') ? 'text-blue-700 bg-blue-50' : busInfo?.includes('2호차') ? 'text-orange-700 bg-orange-50' : 'text-slate-600 bg-slate-100'}`}>
                                            <BusFront size={10} className="inline mr-1"/>
                                            {busInfo}
                                          </span>
                                       </div>
                                       <div className="text-slate-600 leading-tight">
                                        {sch?.pickupBus === NO_BUS ? '개별 등원' : `${sch?.pickupLocation} (${sch?.pickupTime})`}
                                        <br className="md:hidden" />
                                        <span className="hidden md:inline"> / </span>
                                        {sch?.dropoffBus === NO_BUS ? '개별 하원' : sch?.dropoffLocation}
                                       </div>
                                     </div>
                                   );
                                 })}
                               </div>
                             ) : (
                               <span className="text-slate-400">일정 없음</span>
                             )}
                          </td>
                          <td className="p-3 text-right align-top">
                            <button onClick={() => setEditingStudentId(student.id)} className="text-indigo-600 hover:text-indigo-800 mr-3 p-1">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => setDeleteConfirmationId(student.id)} className="text-red-500 hover:text-red-700 p-1">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {students.length === 0 && (
                <div className="text-center py-8 text-slate-400 border-t border-slate-100">등록된 학생이 없습니다.</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Edit Student Modal */}
      {editingStudentId && (
        <EditStudentModal
          student={students.find(s => s.id === editingStudentId)!}
          classTimes={classTimes}
          onSave={(updated) => handleUpdateStudent(editingStudentId, updated)}
          onClose={() => setEditingStudentId(null)}
          inputStyle={inputStyle}
          selectStyle={selectStyle}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
             <div className="flex flex-col items-center text-center mb-6">
                <div className="bg-red-100 p-3 rounded-full text-red-600 mb-4">
                   <AlertTriangle size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">학생 삭제 확인</h3>
                <p className="text-slate-500 mt-2">
                  정말로 해당 학생을 삭제하시겠습니까?<br/>
                  이 작업은 되돌릴 수 없습니다.
                </p>
             </div>
             <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setDeleteConfirmationId(null)} className="flex-1">취소</Button>
                <Button variant="danger" onClick={confirmDeleteStudent} className="flex-1">삭제</Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EditStudentModal: React.FC<{
  student: Student;
  classTimes: string[];
  onSave: (student: Student) => void;
  onClose: () => void;
  inputStyle: string;
  selectStyle: string;
}> = ({ student, classTimes, onSave, onClose, inputStyle, selectStyle }) => {
  const [name, setName] = useState(student.name);
  const [schedules, setSchedules] = useState(JSON.parse(JSON.stringify(student.schedules))); // Deep copy
  const [activeTab, setActiveTab] = useState<DayOfWeek>('월');

  const currentSchedule = schedules[activeTab];

  const handleSave = () => {
    onSave({
      ...student,
      name,
      schedules
    });
  };

  const toggleSchedule = (enable: boolean) => {
    const newSchedules = { ...schedules };
    if (enable) {
      if (!newSchedules[activeTab]) {
        // Default new schedule
        newSchedules[activeTab] = {
            classTime: classTimes[0] || '',
            pickupBus: '1호차',
            dropoffBus: '1호차',
            pickupLocation: '',
            dropoffLocation: '학원 정문',
            pickupTime: '14:00',
            dropoffTime: '15:00'
        };
      }
    } else {
      delete newSchedules[activeTab];
    }
    setSchedules(newSchedules);
  };

  const updateSchedule = (field: keyof DailySchedule, value: string) => {
    if (!schedules[activeTab]) return;
    setSchedules({
      ...schedules,
      [activeTab]: {
        ...schedules[activeTab]!,
        [field]: value
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
            <Edit2 size={20} /> 학생 정보 수정
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">학생 이름</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div>
             <label className="block text-sm font-semibold text-slate-700 mb-3">요일별 스케줄 관리</label>
             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day}
                    onClick={() => setActiveTab(day)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      activeTab === day
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {day}
                    {schedules[day] && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-green-400 inline-block align-top mt-0.5" />}
                  </button>
                ))}
             </div>

             <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-bold text-lg text-slate-800">{activeTab}요일 일정</h4>
                  <div className="flex items-center gap-3">
                     <span className="text-sm text-slate-600">이 요일에 등원함</span>
                     <button
                        onClick={() => toggleSchedule(!currentSchedule)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${currentSchedule ? 'bg-indigo-600' : 'bg-slate-300'}`}
                     >
                       <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${currentSchedule ? 'left-7' : 'left-1'}`} />
                     </button>
                  </div>
                </div>

                {currentSchedule ? (
                   <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">클래스 시간</label>
                        <select
                          value={currentSchedule.classTime}
                          onChange={(e) => updateSchedule('classTime', e.target.value)}
                          className={selectStyle}
                        >
                          {classTimes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-3 p-4 bg-white rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2 text-indigo-700 font-bold border-b border-slate-100 pb-2 mb-2">
                              <Bus size={16} /> 등원 (Pickup)
                            </div>
                            <div>
                               <label className="block text-xs text-slate-500 mb-1">이용 차량</label>
                               <select
                                  value={currentSchedule.pickupBus}
                                  onChange={(e) => updateSchedule('pickupBus', e.target.value)}
                                  className={selectStyle}
                                >
                                  <option value="1호차">1호차</option>
                                  <option value="2호차">2호차</option>
                                  <option value={NO_BUS}>{NO_BUS}</option>
                                </select>
                            </div>
                             {currentSchedule.pickupBus !== NO_BUS && (
                                <>
                                  <div>
                                      <label className="block text-xs text-slate-500 mb-1">탑승 장소</label>
                                      <input
                                        value={currentSchedule.pickupLocation}
                                        onChange={(e) => updateSchedule('pickupLocation', e.target.value)}
                                        className={inputStyle}
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs text-slate-500 mb-1">탑승 시간</label>
                                      <input
                                        type="time"
                                        value={currentSchedule.pickupTime}
                                        onChange={(e) => updateSchedule('pickupTime', e.target.value)}
                                        className={inputStyle}
                                      />
                                  </div>
                                </>
                             )}
                         </div>

                         <div className="space-y-3 p-4 bg-white rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2 text-orange-700 font-bold border-b border-slate-100 pb-2 mb-2">
                              <MapPin size={16} /> 하원 (Dropoff)
                            </div>
                             <div>
                               <label className="block text-xs text-slate-500 mb-1">이용 차량</label>
                               <select
                                  value={currentSchedule.dropoffBus}
                                  onChange={(e) => updateSchedule('dropoffBus', e.target.value)}
                                  className={selectStyle}
                                >
                                  <option value="1호차">1호차</option>
                                  <option value="2호차">2호차</option>
                                  <option value={NO_BUS}>{NO_BUS}</option>
                                </select>
                            </div>
                            {currentSchedule.dropoffBus !== NO_BUS && (
                                <>
                                  <div>
                                      <label className="block text-xs text-slate-500 mb-1">하차 장소</label>
                                      <input
                                        value={currentSchedule.dropoffLocation}
                                        onChange={(e) => updateSchedule('dropoffLocation', e.target.value)}
                                        className={inputStyle}
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs text-slate-500 mb-1">하차 시간</label>
                                      <input
                                        type="time"
                                        value={currentSchedule.dropoffTime}
                                        onChange={(e) => updateSchedule('dropoffTime', e.target.value)}
                                        className={inputStyle}
                                      />
                                  </div>
                                </>
                             )}
                         </div>
                      </div>
                   </div>
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    <p>해당 요일에는 수업 일정이 없습니다.</p>
                    <Button variant="secondary" onClick={() => toggleSchedule(true)} className="mt-4">
                       <Plus size={16} className="mr-2" /> 일정 추가하기
                    </Button>
                  </div>
                )}
             </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end rounded-b-xl sticky bottom-0 z-10">
           <Button variant="ghost" onClick={onClose}>취소</Button>
           <Button onClick={handleSave}>변경사항 저장</Button>
        </div>
      </div>
    </div>
  );
};