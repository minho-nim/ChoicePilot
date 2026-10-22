import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Edit3,
  AlertTriangle,
  Loader2,
  RotateCcw,
  CheckCircle2,
  Clock,
  Info,
  HeartHandshake,
  Compass,
  MessageCircleQuestion,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import {
  DecisionInputs,
  UnderstandingResult,
  UserConfirmation,
  FollowUpQnA,
} from '../types';

interface Step2ConfirmationProps {
  inputs: DecisionInputs;
  onBack: () => void;
  onStartAnalysis: (
    confirmation: UserConfirmation,
    followUps: FollowUpQnA[]
  ) => void;
  isAnalyzing: boolean;
  error: string | null;
  understanding: UnderstandingResult | null;
  isLoadingUnderstanding: boolean;
  onRetryUnderstanding: () => void;
}

export const Step2Confirmation: React.FC<Step2ConfirmationProps> = ({
  inputs,
  onBack,
  onStartAnalysis,
  isAnalyzing,
  error,
  understanding,
  isLoadingUnderstanding,
  onRetryUnderstanding,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // User confirmation state
  const [confirmationStatus, setConfirmationStatus] = useState<
    'mostly_correct' | 'partially_different' | 'unsure' | null
  >(null);
  const [userCorrection, setUserCorrection] = useState('');

  // Follow-up answer state
  const [followUpAnswer, setFollowUpAnswer] = useState('');

  // Live stopwatch for either understanding loading or final analysis loading
  useEffect(() => {
    let interval: any;
    if (isAnalyzing || isLoadingUnderstanding) {
      setElapsedSeconds(0);
      const start = Date.now();
      interval = setInterval(() => {
        setElapsedSeconds(Number(((Date.now() - start) / 1000).toFixed(1)));
      }, 100);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing, isLoadingUnderstanding]);

  // Loading Screen for final synthesis
  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200 shadow-xs max-w-xl mx-auto my-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto shadow-xs">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 pt-1">
            고민 정리 및 7일 실행 계획 수립 중
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-semibold">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>경과 시간: {elapsedSeconds.toFixed(1)}초</span>
            <span className="text-slate-400">/ 목표 30초 이내</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2 text-xs text-slate-700">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <div className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
            <span>사용자 확인 내용 반영 및 종합 분석 진행 중</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            확인해주신 감정 맥락과 핵심 우려, 사실과 추정 분리, 그리고 판단 근거 확보를 위한 7일 과제를 한 번에 구성합니다.
          </p>
        </div>

        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-slate-900 rounded-full w-full animate-pulse" />
        </div>

        {elapsedSeconds >= 25 && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              결과를 정리하는 중 ({elapsedSeconds.toFixed(1)}초 경과)
            </span>
            <p className="text-[11px] text-amber-800 leading-snug">
              안정적인 결과 도출을 위해 대기 중입니다. 최대 40초를 초과하여 응답이 지연될 경우 무한 대기에 빠지지 않고 안전하게 재시도를 안내합니다.
            </p>
          </div>
        )}

        <div className="text-center text-[11px] text-slate-400">
          * 일방적 점수 매기기가 아닌, 사용자가 스스로 결정할 수 있도록 돕는 실행 계획을 도출합니다.
        </div>
      </div>
    );
  }

  // Loading Screen for understanding step
  if (isLoadingUnderstanding) {
    return (
      <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200 shadow-xs max-w-xl mx-auto my-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-xs">
            <HeartHandshake className="w-6 h-6 animate-pulse text-white" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 pt-1">
            질문자의 감정과 핵심 고민을 이해하는 중...
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            성급하게 결론을 내리기 전에, 사용자가 처한 상황과 드러난 감정 단서, 피하고 싶은 핵심 걱정을 조심스럽게 파악하고 있습니다.
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-semibold">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>경과 시간: {elapsedSeconds.toFixed(1)}초</span>
          </div>
        </div>

        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full w-full animate-pulse" />
        </div>
      </div>
    );
  }

  // Handle submit to final analysis
  const handleProceedToAnalysis = () => {
    if (!confirmationStatus || (confirmationStatus === 'partially_different' && !userCorrection.trim())) return;
    const confirmation: UserConfirmation = {
      status: confirmationStatus,
      userCorrection:
        confirmationStatus === 'partially_different' ? userCorrection.trim() : undefined,
    };

    const followUps: FollowUpQnA[] = [];
    if (understanding?.needsFollowUp && understanding.followUpQuestion && followUpAnswer.trim()) {
      followUps.push({
        question: understanding.followUpQuestion,
        answer: followUpAnswer.trim(),
      });
    }

    onStartAnalysis(confirmation, followUps);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Step Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
            2단계: 감정과 핵심 고민 이해
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            고민 내용 확인 및 보완
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          점수나 추천을 만들지 않습니다. 입력하신 상황과 감정이 제대로 정리됐는지 확인해주세요.
        </p>
      </div>

      {/* Error alert with retry */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 flex-1">
              <span className="font-bold block">분석 중 문제가 발생했습니다:</span>
              <p className="text-rose-800">{error}</p>
            </div>
          </div>
          <div className="pl-6 pt-1 flex items-center justify-between gap-2 border-t border-rose-200/60">
            <span className="text-[11px] text-rose-700">
              '다시 시도'를 누르시면 동일한 입력으로 즉시 재요청됩니다.
            </span>
            <button
              type="button"
              onClick={handleProceedToAnalysis}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>다시 시도</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. 입력 내용을 바탕으로 정리한 감정과 핵심 고민 */}
      {understanding && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>입력하신 상황과 감정 맥락</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              *단정이 아닌 조심스러운 관찰입니다
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
            {/* 상황 요약 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 md:col-span-2">
              <span className="font-bold text-slate-900 block text-[11px]">
                실제 상황 요약 (2~3문장)
              </span>
              <p className="text-slate-800 leading-relaxed text-xs sm:text-sm">
                {understanding.summary}
              </p>
            </div>

            {/* 드러난 감정 단서 */}
            <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1">
              <span className="font-bold text-indigo-950 block text-[11px] flex items-center gap-1">
                <HeartHandshake className="w-3.5 h-3.5 text-indigo-600" />
                텍스트에서 드러난 감정 단서
              </span>
              <p className="text-indigo-900 leading-relaxed">
                {understanding.emotionalCues}
              </p>
            </div>

            {/* 핵심 걱정 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block text-[11px]">
                가장 걱정하는 결과 (피하고 싶은 부담)
              </span>
              <p className="text-slate-700 leading-relaxed">
                {understanding.primaryConcerns}
              </p>
            </div>

            {/* 바라는 변화 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block text-[11px]">
                바라는 변화나 결과
              </span>
              <p className="text-slate-700 leading-relaxed">
                {understanding.desiredOutcome}
              </p>
            </div>

            {/* 내적 갈등 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block text-[11px]">
                충돌하는 욕구와 가치 (내적 갈등)
              </span>
              <p className="text-slate-700 leading-relaxed">
                {understanding.innerConflict || '뚜렷한 내적 갈등 없음'}
              </p>
            </div>
          </div>

          {understanding.unverifiedInterpretations && (
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 space-y-0.5">
              <span className="font-bold text-amber-900 block text-[11px] flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                확인이 필요한 AI 추론 해석:
              </span>
              <p className="leading-relaxed">
                {understanding.unverifiedInterpretations}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 2. 사용자 확인 단계 (Section 4 요구사항) */}
      {understanding && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              사용자 확인 단계 (필수)
            </span>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
              {understanding.confirmationPrompt}
            </h3>
            <p className="text-xs text-slate-500">
              정리한 내용이 맞는지 확인해주세요. 다르다면 직접 수정해 결과에 반영할 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setConfirmationStatus('mostly_correct')}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                confirmationStatus === 'mostly_correct'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>대체로 맞아요</span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmationStatus('partially_different')}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                confirmationStatus === 'partially_different'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>일부 달라요 (수정 입력)</span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmationStatus('unsure')}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                confirmationStatus === 'unsure'
                  ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>잘 모르겠어요</span>
            </button>
          </div>

          {/* Reveal text area if user selected '일부 달라요' */}
          {confirmationStatus === 'partially_different' && (
            <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-200 space-y-2 animate-fadeIn">
              <label className="text-xs font-bold text-indigo-950 block">
                어떤 부분이 다른지 수정할 내용을 편하게 적어주세요:
              </label>
              <textarea
                value={userCorrection}
                onChange={(e) => setUserCorrection(e.target.value)}
                placeholder="예: 사실 이직 실패보다 당장 퇴사 후 생활비 고갈이 더 걱정돼요. 번아웃이라기보다는 팀장과의 소통 문제가 핵심이에요."
                rows={3}
                className="w-full text-xs sm:text-sm p-3 rounded-lg border border-indigo-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
              <span className="text-[11px] text-indigo-700 block">
                * 이 수정 내용은 후속 종합 분석과 7일 계획에 최우선적으로 반영됩니다.
              </span>
            </div>
          )}
        </div>
      )}

      {/* 3. 적응형 후속 질문 (Section 3 요구사항) */}
      {understanding && understanding.needsFollowUp && understanding.followUpQuestion && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
              <MessageCircleQuestion className="w-4 h-4" />
              <span>더 정확한 정리를 위한 단 하나의 질문</span>
            </div>
            <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
              {understanding.followUpQuestion}
            </h4>
            {understanding.followUpReason && (
              <p className="text-xs text-slate-500">
                이유: {understanding.followUpReason}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={followUpAnswer}
              onChange={(e) => setFollowUpAnswer(e.target.value)}
              placeholder="생각나는 내용을 한 줄로 편하게 적어보세요 (선택사항)"
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setFollowUpAnswer('아직 잘 모르겠어요')}
                className="text-slate-500 hover:text-slate-800 text-[11px] underline"
              >
                '잘 모르겠어요'로 답하기
              </button>
              <span className="text-slate-400 text-[11px]">
                * 비워두고 '지금 바로 분석하기'를 눌러도 됩니다.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* When no follow-up is needed */}
      {understanding && !understanding.needsFollowUp && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            입력하신 고민과 목표, 기준이 이미 명확하여 추가 질문 없이 바로 종합 분석과 7일 계획을 진행할 수 있습니다.
          </span>
        </div>
      )}

      {/* Bottom Nav Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>처음 입력 내용 수정</span>
        </button>

        <button
          type="button"
          onClick={handleProceedToAnalysis}
          disabled={isAnalyzing || !confirmationStatus || (confirmationStatus === 'partially_different' && !userCorrection.trim())}
          className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-xs"
        >
          <span>지금 바로 분석하기</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
