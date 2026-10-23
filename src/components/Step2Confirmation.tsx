import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, MessageCircleQuestion, CheckCircle2 } from 'lucide-react';
import { DecisionInputs, FollowUpQnA, UserConfirmation } from '../types';
import { buildLocalUnderstanding } from '../utils/localAnalysis';
import { MAX_FOLLOW_UPS, resolveReflection, UNKNOWN } from '../utils/reflectionContext';

interface Step2ConfirmationProps {
  inputs: DecisionInputs;
  followUps: FollowUpQnA[];
  onFollowUpsChange: (answers: FollowUpQnA[]) => void;
  confirmation: UserConfirmation | null;
  onConfirmationChange: (value: UserConfirmation | null) => void;
  onBack: () => void;
  onStartAnalysis: (confirmation: UserConfirmation, followUps: FollowUpQnA[]) => void;
  isAnalyzing: boolean;
  error: string | null;
}

export function Step2Confirmation({ inputs, followUps, onFollowUpsChange, confirmation, onConfirmationChange, onBack, onStartAnalysis, isAnalyzing, error }: Step2ConfirmationProps) {
  const [answer, setAnswer] = useState('');
  const [stopQuestions, setStopQuestions] = useState(Boolean(confirmation));
  const understanding = buildLocalUnderstanding(inputs, followUps);
  const context = resolveReflection(inputs, followUps, confirmation || undefined);
  const showQuestion = !stopQuestions && !confirmation && understanding.needsFollowUp;

  const submitAnswer = (skipped = false) => {
    if (!understanding.followUpQuestion || !understanding.followUpField || (!skipped && !answer.trim())) return;
    onFollowUpsChange([...followUps, {
      field: understanding.followUpField, question: understanding.followUpQuestion,
      answer: skipped ? '' : answer.trim(), skipped,
    }]);
    setAnswer('');
    onConfirmationChange(null);
  };

  const chooseConfirmation = (status: UserConfirmation['status']) => {
    if (status === 'partially_different') {
      const current = resolveReflection(inputs, followUps);
      onConfirmationChange({ status, correctedInputs: confirmation?.correctedInputs || {
        dilemma: inputs.dilemma, goal: '',
        feelings: current.feelings === UNKNOWN ? '' : current.feelings,
        primaryConcern: current.concern === UNKNOWN ? '' : current.concern,
        desiredChange: current.desired === UNKNOWN ? '' : current.desired,
      } });
    } else onConfirmationChange({ status, correctedInputs: confirmation?.correctedInputs });
  };
  const editCorrection = (field: 'dilemma' | 'feelings' | 'primaryConcern' | 'desiredChange', value: string) => {
    onConfirmationChange({ ...confirmation!, status: 'partially_different', correctedInputs: { ...confirmation?.correctedInputs, [field]: value } });
  };
  const canSubmit = Boolean(confirmation) && (!confirmation?.correctedInputs || Boolean(confirmation.correctedInputs.dilemma?.trim()));

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-indigo-700">2단계 · 필요한 내용 확인</p>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{showQuestion ? '한 가지만 더 여쭤볼게요' : '이렇게 정리해 보았어요'}</h1>
        <p className="text-sm text-slate-600">{showQuestion ? '이미 적어 주신 내용은 다시 묻지 않고, 필요한 질문만 최대 세 번 확인합니다.' : '글에서 찾은 표현을 옮겼습니다. 다른 부분은 직접 고칠 수 있어요.'}</p>
      </div>

      {showQuestion ? (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-xs">
          <p className="text-xs text-slate-500 flex items-center gap-2"><MessageCircleQuestion className="w-4 h-4" />질문 {followUps.length + 1} / 최대 {MAX_FOLLOW_UPS}</p>
          <label className="block space-y-3">
            <span className="block font-semibold text-lg text-slate-900">{understanding.followUpQuestion}</span>
            <textarea rows={3} value={answer} onChange={(event) => setAnswer(event.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-indigo-400" placeholder="짧게 적어도 괜찮아요." />
          </label>
          <p className="text-xs text-slate-500">{understanding.followUpReason}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => submitAnswer()} disabled={!answer.trim()} className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-40">답변 반영하기</button>
            <button type="button" onClick={() => submitAnswer(true)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700">잘 모르겠어요</button>
            <button type="button" onClick={() => {
              if (answer.trim()) submitAnswer();
              setStopQuestions(true);
            }} className="px-4 py-2.5 rounded-xl text-sm text-indigo-700">지금까지 내용으로 정리</button>
          </div>
        </section>
      ) : (
        <>
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <div><h2 className="text-sm font-semibold text-slate-500">현재 상황</h2><p className="mt-2 text-sm leading-relaxed text-slate-900 whitespace-pre-wrap">{context.summary}</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><h2 className="text-sm font-semibold text-slate-500">가장 부담스러운 점</h2><p className="mt-1 text-sm text-slate-800">{context.concern}</p></div>
              <div><h2 className="text-sm font-semibold text-slate-500">바라는 변화</h2><p className="mt-1 text-sm text-slate-800">{context.desired}</p></div>
            </div>
            <div className="border-t border-slate-100 pt-4"><h2 className="text-sm font-semibold text-slate-500">마음을 나타낸 표현</h2><p className="mt-1 text-sm text-slate-800">{context.feelings}</p><p className="mt-2 text-xs leading-relaxed text-slate-500">{context.emotionalEvidence}</p></div>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-sm text-slate-900">이 정리가 지금의 고민과 대체로 맞나요?</h2>
            <div className="flex flex-wrap gap-2">
              {([['mostly_correct', '대체로 맞아요'], ['partially_different', '일부 달라요'], ['unsure', '잘 모르겠어요']] as const).map(([status, label]) => (
                <button key={status} type="button" aria-pressed={confirmation?.status === status} onClick={() => chooseConfirmation(status)} className={`px-4 py-2.5 rounded-xl text-sm border transition-colors ${confirmation?.status === status ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold' : 'bg-white border-slate-200 text-slate-700'}`}>{label}</button>
              ))}
            </div>
            {confirmation?.status === 'partially_different' && (
              <div className="p-5 bg-white rounded-xl border border-indigo-200 space-y-4">
                <p className="text-xs text-slate-600">바꾼 내용으로 결과와 계획을 다시 구성합니다. 확인되지 않은 항목은 비워두어도 됩니다.</p>
                {([['dilemma', '현재 상황'], ['feelings', '느끼는 감정'], ['primaryConcern', '가장 부담스러운 점'], ['desiredChange', '바라는 변화']] as const).map(([field, label]) => (
                  <label key={field} className="block space-y-1.5 text-sm font-medium text-slate-700">{label}
                    <textarea rows={field === 'dilemma' ? 3 : 2} value={confirmation.correctedInputs?.[field] || ''} onChange={(event) => editCorrection(field, event.target.value)} className="block w-full p-3 rounded-lg border border-slate-200 text-sm font-normal outline-none focus:border-indigo-400" />
                  </label>
                ))}
              </div>
            )}
            {confirmation?.status === 'unsure' && <p className="text-xs text-slate-500">지금의 정리를 확정하지 않고, 확인이 필요한 내용으로 남겨둘게요.</p>}
          </section>
        </>
      )}

      {followUps.length > 0 && <details className="rounded-xl border border-slate-200 bg-white p-4 text-sm"><summary className="cursor-pointer text-slate-600">지금까지의 답변 ({followUps.length})</summary><dl className="mt-3 space-y-3">{followUps.map((item, index) => <div key={index}><dt className="text-xs text-slate-500">{item.question}</dt><dd className="mt-1 text-slate-800">{item.skipped ? '잘 모르겠어요 · 미확인으로 남김' : item.answer}</dd></div>)}</dl></details>}
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700"><ArrowLeft className="w-4 h-4" />고민 수정하기</button>
        {!showQuestion && <button type="button" disabled={!canSubmit || isAnalyzing} onClick={() => confirmation && onStartAnalysis(confirmation, followUps)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-40"><CheckCircle2 className="w-4 h-4" />{isAnalyzing ? '정리 중…' : '이 내용으로 정리하기'}<ArrowRight className="w-4 h-4" /></button>}
      </div>
    </div>
  );
}
