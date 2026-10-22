import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Copy,
  ArrowLeft,
  RotateCcw,
  Check,
  Clock,
  ImageIcon,
  Loader2,
  Download,
  AlertCircle
} from 'lucide-react';
import { AnalysisResult } from '../types';
import { exportPlanAsBlob } from '../utils/planImageRenderer';

interface Step4ExecutionPlanProps {
  result: AnalysisResult;
  onBackToComparison: () => void;
  onReset: () => void;
  completedTasks: Record<number, boolean>;
  onToggleTask: (day: number) => void;
}

interface ActionFeedback {
  type: 'success' | 'download' | 'error';
  message: string;
}

export const Step4ExecutionPlan: React.FC<Step4ExecutionPlanProps> = ({
  result,
  onBackToComparison,
  onReset,
  completedTasks,
  onToggleTask,
}) => {
  const { sevenDayPlan, problemAnalysis, finalRecommendation } = result;
  const hasRequestedComparison = (result.optionsComparison?.length ?? 0) >= 2;

  // Action states
  const [copiedText, setCopiedText] = useState(false);
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Calculate completion percentage
  const totalDays = sevenDayPlan.length;
  const completedCount = sevenDayPlan.filter((d) => completedTasks[d.day]).length;
  const progressPercent = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;

  // 1. Text Copy to Clipboard
  const handleCopyTextPlan = () => {
    const text = `[ChoicePilot] 앞으로 7일 동안 해볼 일

■ 고민: ${problemAnalysis.coreDilemma}
${hasRequestedComparison ? `■ 선택지 비교 참고: ${finalRecommendation.summary}\n■ 근거: ${finalRecommendation.reason}` : '■ 이번 결과는 선택지 추천 없이 판단 근거를 정리합니다.'}

■ 7일 실행 계획
${sevenDayPlan
  .map(
    (d) => `[Day ${d.day}] ${d.dayTitle} (예상: ${d.estimatedMinutes})
- 할 일: [${completedTasks[d.day] ? '완료' : '미완료'}] ${d.task}
- 완료 기준: ${d.completionCriteria}`
  )
  .join('\n\n')}

전체 달성률: ${completedCount}/${totalDays}일 완료 (${progressPercent}%)
작성 출처: ChoicePilot 의사결정 코칭`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => {
          setCopiedText(true);
          setFeedback({ type: 'success', message: '계획 텍스트가 클립보드에 복사되었습니다.' });
          setTimeout(() => {
            setCopiedText(false);
            setFeedback(null);
          }, 3000);
        },
        () => {
          fallbackTextCopy(text);
        }
      );
    } else {
      fallbackTextCopy(text);
    }
  };

  const fallbackTextCopy = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedText(true);
      setFeedback({ type: 'success', message: '계획 텍스트가 클립보드에 복사되었습니다.' });
      setTimeout(() => {
        setCopiedText(false);
        setFeedback(null);
      }, 3000);
    } catch (e: any) {
      setFeedback({ type: 'error', message: `텍스트 복사 실패: ${e?.message || '권한 제한'}` });
    }
  };

  // 2. High-Res Image Copy with PNG Download Fallback
  const handleCopyAsImage = async () => {
    if (isProcessingImage) return;

    setIsProcessingImage(true);
    setFeedback(null);

    try {
      const blob = await exportPlanAsBlob(result, completedTasks);

      let clipboardSuccess = false;

      // Attempt clipboard image writing
      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          clipboardSuccess = true;
          setFeedback({
            type: 'success',
            message: '실행계획 이미지가 클립보드에 복사되었습니다. (Ctrl+V로 붙여넣을 수 있습니다)',
          });
        } catch (clipErr: any) {
          console.warn('Clipboard write restricted by browser:', clipErr);
        }
      }

      // If clipboard writing wasn't permitted or supported, download PNG directly
      if (!clipboardSuccess) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const dateStr = new Date().toISOString().slice(0, 10);
        link.href = url;
        link.download = `ChoicePilot_7일실행계획_${dateStr}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setFeedback({
          type: 'download',
          message: '브라우저 환경 제한으로 클립보드 복사 대신 PNG 파일로 다운로드되었습니다.',
        });
      }
    } catch (err: any) {
      console.error('Image generation error:', err);
      setFeedback({
        type: 'error',
        message: `이미지 변환 중 오류가 발생했습니다: ${err.message || '렌더링 실패'}`,
      });
    } finally {
      setIsProcessingImage(false);
    }
  };

  return (
    <div className="space-y-6 pb-14 max-w-4xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold text-slate-500">4단계 실행 로드맵</span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            앞으로 7일 동안 해볼 일
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            하루에 10~20분 내로 실천할 수 있는 핵심 행동 1개씩만 간결하게 구성했습니다.
          </p>
        </div>

        {/* Buttons: 계획 복사, 이미지로 복사 */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* 1. 계획 텍스트 복사 */}
          <button
            type="button"
            onClick={handleCopyTextPlan}
            title="텍스트 형태로 클립보드에 복사"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
          >
            {copiedText ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">텍스트 복사됨</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>계획 복사</span>
              </>
            )}
          </button>

          {/* 2. 이미지로 복사 (PNG 변환 & 복사 / 다운로드) */}
          <button
            type="button"
            onClick={handleCopyAsImage}
            disabled={isProcessingImage}
            title="실행계획을 고해상도 이미지로 변환하여 복사 (미지원 시 PNG 다운로드)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors disabled:opacity-50"
          >
            {isProcessingImage ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                <span>이미지 처리 중...</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>이미지로 복사</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Action feedback toast/banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : feedback.type === 'download'
              ? 'bg-sky-50 text-sky-900 border border-sky-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
            {feedback.type === 'download' && <Download className="w-4 h-4 text-sky-600 shrink-0" />}
            {feedback.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[11px] font-semibold underline ml-3 shrink-0"
          >
            닫기
          </button>
        </div>
      )}

      {/* Main Execution Plan Area */}
      <div className="space-y-4">
        {/* Recommendation Summary Box */}
        {hasRequestedComparison && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-xs text-slate-500 font-semibold block">선택지 비교 참고</span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">{finalRecommendation.summary}</h3>
            <p className="text-xs text-slate-600 leading-relaxed"><strong>근거:</strong> {finalRecommendation.reason}</p>
          </div>
        )}

        {/* Progress Card */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="space-y-0.5">
            <span className="text-xs text-slate-500 block">7일 실행 진행률</span>
            <div className="text-sm font-bold text-slate-900">
              총 {totalDays}일 중 {completedCount}일 완료 ({progressPercent}%)
            </div>
          </div>

          <div className="w-full sm:w-56 space-y-1">
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>Day 1</span>
              <span>Day 7 완수</span>
            </div>
          </div>
        </div>

        {/* 7-Day Timeline Cards (하루 1개의 핵심 행동 + 완료 기준) */}
        <div className="space-y-3">
          {sevenDayPlan.map((dayPlan) => {
            const checked = Boolean(completedTasks[dayPlan.day]);

            return (
              <div
                key={dayPlan.day}
                className={`p-4 rounded-xl border transition-colors ${
                  checked
                    ? 'border-emerald-300 bg-emerald-50/15'
                    : 'border-slate-200 bg-white shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Interactive Checkbox */}
                  <button
                    type="button"
                    onClick={() => onToggleTask(dayPlan.day)}
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-slate-900 transition-colors"
                    title={checked ? '완료 취소' : '과제 완료'}
                  >
                    {checked ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300" />
                    )}
                  </button>

                  <div className="flex-1 space-y-2">
                    {/* Day Title and Time */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                            checked
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 text-white'
                          }`}
                        >
                          D{dayPlan.day}
                        </span>
                        <h4
                          className={`text-sm font-bold ${
                            checked ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {dayPlan.dayTitle}
                        </h4>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 shrink-0">
                        <Clock className="w-3 h-3" />
                        {dayPlan.estimatedMinutes}
                      </span>
                    </div>

                    {/* 할 일 (Task) */}
                    <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium pl-8">
                      {dayPlan.task}
                    </div>

                    {/* 완료 기준 (Completion Criteria) */}
                    <div className="ml-8 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <span className="text-[10px] text-slate-500 font-bold block mb-0.5">
                        완료 기준
                      </span>
                      <p className="text-[11px] text-slate-700 leading-snug">
                        {dayPlan.completionCriteria}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation & Reset Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onBackToComparison}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>선택지 비교 화면으로</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>새로 시작</span>
        </button>
      </div>
    </div>
  );
};
