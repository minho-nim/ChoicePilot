import React from 'react';
import { Compass, RotateCcw } from 'lucide-react';

interface HeaderProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  onReset: () => void;
  canNavigateToStep3: boolean;
  canNavigateToStep2: boolean;
  canNavigateToStep4: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onStepClick,
  onReset,
  canNavigateToStep3,
  canNavigateToStep2,
  canNavigateToStep4,
}) => {
  const steps = [
    { number: 1, label: '고민 나누기' },
    { number: 2, label: '질문·확인' },
    { number: 3, label: '고민 한눈에' },
    { number: 4, label: '7일 실행계획' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Compass className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  ChoicePilot
                </span>
                <span className="px-1.5 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                  고민 정리
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                마음과 고민을 정리하고, 다음 판단에 필요한 근거를 찾습니다
              </p>
            </div>
          </div>

          {/* Stepper Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
            {steps.map((s) => {
              const isActive = currentStep === s.number;
              const isPassed = currentStep > s.number;
              const isClickable =
                s.number === 1 ||
                (s.number === 2 && canNavigateToStep2) ||
                (s.number === 3 && canNavigateToStep3) ||
                (s.number === 4 && canNavigateToStep4);

              return (
                <button
                  key={s.number}
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(s.number)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : isPassed
                      ? 'text-slate-700 hover:text-slate-900'
                      : isClickable
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : isPassed
                        ? 'bg-slate-200 text-slate-800'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {s.number}
                  </span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Reset Action */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors border border-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>새로 시작</span>
            </button>
          </div>
        </div>

        {/* Mobile Step Bar */}
        <div className="md:hidden mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-900">
              {currentStep}단계: {steps[currentStep - 1]?.label}
            </span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                className={`w-6 h-1 rounded-full transition-all ${
                  step === currentStep
                    ? 'bg-slate-900'
                    : step < currentStep
                    ? 'bg-slate-400'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
