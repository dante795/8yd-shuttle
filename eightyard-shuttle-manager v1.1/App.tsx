import React, { useState, useEffect } from 'react';
import { Bus, LogIn, LogOut, ShieldCheck, Smartphone, Loader2, RefreshCw } from 'lucide-react';
import { Button } from './components/Button';
import { LoginModal } from './components/LoginModal';
import { ParentView } from './components/ParentView';
import { AdminView } from './components/AdminView';
import { SmartShuttleInfo } from './components/SmartShuttleInfo';
import { INITIAL_STUDENTS, DEFAULT_CLASS_TIMES, GOOGLE_SCRIPT_URL } from './constants';
import { Student } from './types';
import { googleSheetService } from './services/googleSheetService';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  // App State
  const [students, setStudents] = useState<Student[]>([]);
  const [classTimes, setClassTimes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Navigation State
  const [showSmartShuttle, setShowSmartShuttle] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('PASTE_YOUR')) {
      // Fallback if no URL configured
      setStudents(INITIAL_STUDENTS);
      setClassTimes(DEFAULT_CLASS_TIMES);
      setIsLoading(false);
      return;
    }

    const data = await googleSheetService.getData();
    if (data) {
      setStudents(data.students);
      setClassTimes(data.classTimes);
    } else {
      // Fallback on error
      setStudents(INITIAL_STUDENTS);
      setClassTimes(DEFAULT_CLASS_TIMES);
    }
    setIsLoading(false);
  };

  const handleManualRefresh = () => {
    loadData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3 md:h-16 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-indigo-700 cursor-pointer" onClick={() => setShowSmartShuttle(false)}>
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <Bus size={20} className="md:w-6 md:h-6" />
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight">Eightyard Shuttle</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {!showSmartShuttle && (
              isLoggedIn ? (
                <div className="flex items-center gap-2 md:gap-4">
                  <span className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    <ShieldCheck size={14} className="text-green-600" />
                    관리자 모드
                  </span>
                  {isSyncing && (
                     <span className="text-xs text-indigo-500 flex items-center gap-1">
                       <RefreshCw size={12} className="animate-spin" /> 저장 중...
                     </span>
                  )}
                  <Button variant="ghost" onClick={() => setIsLoggedIn(false)} className="text-xs md:text-sm px-2 md:px-4">
                    <LogOut size={16} className="mr-1 md:mr-2" />
                    <span className="hidden md:inline">로그아웃</span>
                    <span className="md:hidden">나가기</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                   <Button variant="ghost" onClick={handleManualRefresh} className="text-slate-400 p-2">
                     <RefreshCw size={18} />
                   </Button>
                  <Button variant="secondary" onClick={() => setIsLoginModalOpen(true)} className="text-xs md:text-sm px-3 md:px-4">
                    <LogIn size={16} className="mr-1 md:mr-2" />
                    관리자 로그인
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        {showSmartShuttle ? (
          <SmartShuttleInfo onBack={() => setShowSmartShuttle(false)} />
        ) : (
          <>
            <div className="mb-6 md:mb-8 text-center max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 md:mb-3">
                {isLoggedIn ? '셔틀 관리 대시보드' : '학원 셔틀 운행표'}
              </h2>
              <p className="text-sm md:text-base text-slate-500 leading-relaxed px-4">
                {isLoggedIn 
                  ? '학생들의 승/하차 정보를 관리하고 노선을 최적화하세요.' 
                  : '요일을 선택하여 클래스별 셔틀 승/하차 시간을 확인하세요.'}
              </p>
            </div>

            {isLoggedIn ? (
              <AdminView 
                students={students} 
                setStudents={setStudents}
                classTimes={classTimes}
                setClassTimes={setClassTimes}
                onSyncStart={() => setIsSyncing(true)}
                onSyncEnd={() => setIsSyncing(false)}
              />
            ) : (
              <ParentView 
                students={students}
                classTimes={classTimes}
              />
            )}

            <div className="mt-12 md:mt-16 flex justify-center px-4">
              <Button 
                onClick={() => setShowSmartShuttle(true)}
                variant="secondary"
                className="w-full md:w-auto text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-6 py-3 shadow-sm flex items-center justify-center"
              >
                <Smartphone size={20} className="mr-2" />
                [스마트 셔틀 위치 확인 알아보기]
              </Button>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} Eightyard Academy. All rights reserved.</p>
          <p className="mt-1">문의: 02-1234-5678</p>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLogin={() => setIsLoggedIn(true)} 
      />
    </div>
  );
}

export default App;