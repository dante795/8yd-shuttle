import React from 'react';
import { ArrowLeft, Smartphone, CheckCircle } from 'lucide-react';
import { Button } from './Button';

interface SmartShuttleInfoProps {
  onBack: () => void;
}

export const SmartShuttleInfo: React.FC<SmartShuttleInfoProps> = ({ onBack }) => {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 px-6 py-6 md:px-8 md:py-8 text-white">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3">
            <Smartphone size={24} className="md:w-7 md:h-7" />
            스마트 셔틀 위치 확인
          </h2>
          <p className="text-indigo-100 mt-2 text-base md:text-lg">iKare 앱을 통해 실시간 셔틀 위치를 확인하세요.</p>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mt-1 text-sm">1</div>
              <div>
                <h3 className="font-bold text-base md:text-lg text-slate-800 mb-1">앱 설치</h3>
                <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                  앱스토어 또는 플레이스토어에서 <span className="font-bold text-indigo-600">'iKare'</span> 어플리케이션을 검색하여 다운받아주세요.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
               <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mt-1 text-sm">2</div>
              <div>
                <h3 className="font-bold text-base md:text-lg text-slate-800 mb-1">회원가입</h3>
                <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                  앱을 실행한 후 <span className="font-semibold">학부모 회원 가입</span>을 진행해주세요.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
               <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mt-1 text-sm">3</div>
              <div>
                <h3 className="font-bold text-base md:text-lg text-slate-800 mb-1">가족 설정</h3>
                <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                  처음 가입이신 경우 <span className="font-semibold text-indigo-700">'새가족 생성'</span>을 선택해주세요.<br/>
                  이미 가입하신 가족 구성원이 계신 경우 <span className="font-semibold text-indigo-700">'가족 합류'</span>로 가입해주세요.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
               <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mt-1 text-sm">4</div>
              <div>
                <h3 className="font-bold text-base md:text-lg text-slate-800 mb-1">기관 코드 입력</h3>
                <p className="text-sm md:text-base text-slate-600 mb-3">
                  에잇야드 기관 코드를 입력하여 가입을 완료해주세요.
                </p>
                <div className="bg-slate-100 p-3 md:p-4 rounded-lg border border-slate-200 inline-block w-full md:w-auto text-center md:text-left">
                  <span className="text-xs md:text-sm text-slate-500 block mb-1">기관 코드</span>
                  <span className="font-mono font-bold text-slate-800 text-lg md:text-xl tracking-wider select-all">ae91cdda6a93a00f</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-start">
               <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mt-1 text-sm">5</div>
              <div>
                <h3 className="font-bold text-base md:text-lg text-slate-800 mb-1">도움말</h3>
                <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                  진행 중 어려움이 있으신 경우 매 화면 하단에 있는 <span className="font-semibold">상담사 연결</span>을 통해 편하게 진행하실 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex justify-center">
            <Button onClick={onBack} variant="primary" className="w-full md:w-auto py-3 px-8 text-base md:text-lg flex justify-center">
              <ArrowLeft size={20} />
              메인 화면으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};