import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  Info,
  HeartHandshake,
  Sliders,
  Calendar,
  Sparkles,
  Clock,
  Compass,
  Scale,
  CheckSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AnalysisResult } from '../types';

interface Step3ComparisonProps {
  result: AnalysisResult;
  onNext: () => void;
  onBackToInputs: () => void;
  showOptionComparison?: boolean;
}

export const Step3Comparison: React.FC<Step3ComparisonProps> = ({
  result,
  onNext,
  onBackToInputs,
  showOptionComparison = false,
}) => {
  const {
    problemAnalysis,
    emotionAnalysis,
    factDistinction,
    coreConflict,
    appliedCriteria = [],
    optionsComparison = [],
    finalRecommendation,
    sevenDayPlan = [],
    analysisDuration,
  } = result;

  // Toggle for secondary options comparison (Section 5: 선택지 비교와 추천은 보조 기능)
  const [showOptionsDetails, setShowOptionsDetails] = useState(false);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Top Header & Duration Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              3단계: 고민 정리 및 판단 지원
            </span>
            {analysisDuration !== undefined && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  analysisDuration <= 30
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>
                  로컬 정리 처리: {analysisDuration < 0.01 ? '0.01초 미만' : `${analysisDuration.toFixed(2)}초`}
                </span>
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            지금의 고민을 한눈에
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            작성한 내용을 바탕으로 정리했습니다. 이 정리가 최종 결정을 뜻하지는 않습니다.
          </p>
        </div>

        <button
          type="button"
          onClick={onNext}
          className="self-start sm:self-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
        >
          <span>원하면 7일 계획 보기</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {result.limitations?.filter((item) => item.includes('확정하지')).map((item) => <p key={item} className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{item}</p>)}
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-xs">
          <h3 className="text-xs font-semibold text-slate-500">지금의 핵심 고민</h3>
          <p className="text-sm leading-relaxed text-slate-900 whitespace-pre-wrap">{problemAnalysis.coreDilemma}</p>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-xs">
          <h3 className="text-xs font-semibold text-slate-500">중요하게 생각하는 것</h3>
          <p className="text-sm leading-relaxed text-slate-900">바라는 변화: {emotionAnalysis.desiredChange}</p>
          {appliedCriteria.length > 0 && <ul className="space-y-1 text-sm text-slate-700">{appliedCriteria.map((item) => <li key={item.name}>· {item.name} ({item.importance})</li>)}</ul>}
          {emotionAnalysis.primaryConcerns !== '아직 확인되지 않음' && <p className="text-xs leading-relaxed text-slate-500">부담스러운 점: {emotionAnalysis.primaryConcerns}</p>}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-xs">
          <h3 className="text-xs font-semibold text-slate-500">아직 모르는 것</h3>
          {factDistinction.unverifiedItems.length ? <ul className="space-y-1 text-sm text-slate-800">{factDistinction.unverifiedItems.map((item) => <li key={item}>· {item}</li>)}</ul> : <p className="text-sm leading-relaxed text-slate-700">정리에 필요한 핵심 항목은 적혀 있습니다. 설명한 내용의 실제 조건은 별도로 확인할 수 있습니다.</p>}
        </section>
        <section className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 space-y-2">
          <h3 className="text-xs font-semibold text-indigo-700">지금 할 수 있는 작은 행동 하나</h3>
          <p className="text-sm leading-relaxed text-slate-900">{sevenDayPlan[0]?.task}</p>
          <p className="text-xs text-slate-600">완료 기준: {sevenDayPlan[0]?.completionCriteria}</p>
        </section>
      </div>

      <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">상세 정리 펼쳐보기</summary>
        <div className="mt-4 space-y-4">
        {result.limitations?.map((item) => <p key={item} className="text-xs text-slate-500 leading-relaxed">{item}</p>)}
      {/* 1. 현재 상황과 핵심 고민 요약 */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
              1
            </span>
            <FileText className="w-4 h-4 text-slate-700" />
            <span>현재 상황과 핵심 고민</span>
          </h3>
          <span className="text-xs text-slate-500">상황 구조화</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-xs font-bold text-slate-700 block">
              핵심이 되는 고민
            </span>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
              {problemAnalysis.coreDilemma}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-xs font-bold text-slate-700 block">
              고민이 생긴 이유 및 배경
            </span>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
              {problemAnalysis.background}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-xs font-bold text-slate-700 block">
              선택에 따른 주요 절충점
            </span>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
              {problemAnalysis.tradeoff}
            </p>
          </div>
        </div>
      </section>

      {/* 2. 감정 분석 모듈 (질문자의 마음과 핵심 우려) */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
              2
            </span>
            <HeartHandshake className="w-4 h-4 text-indigo-600" />
            <span>감정 분석 및 핵심 걱정 (마음 점검)</span>
          </h3>
          <span className="text-[11px] text-slate-500">
            * 심리 진단이 아닌, 스스로의 우려를 명확히 마주하기 위한 정리입니다.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {/* 감정 단서 */}
            <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1.5">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-600" />
                텍스트에서 드러난 감정 단서와 근거
              </span>
              <p className="text-xs sm:text-sm text-indigo-900 leading-relaxed">
                {emotionAnalysis?.emotionalCues || '명확한 감정 단서를 확인하기 어려움'}
              </p>
            </div>

            {/* 피하고 싶은 핵심 걱정 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-xs font-bold text-slate-800 block">
                가장 걱정하는 결과 (피하고 싶은 부담)
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {emotionAnalysis?.primaryConcerns || '특별히 강조된 손실 우려는 명시되지 않음'}
              </p>
            </div>

            {/* 바라는 변화 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-xs font-bold text-slate-800 block">
                바라는 변화나 결과
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {emotionAnalysis?.desiredChange || '구체적인 변화 목표 미정'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* 직접 표현 vs AI 추론 분리 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                직접 입력한 내용과 미확인 정보
              </span>
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="p-2 rounded bg-white border border-slate-200/70">
                  <span className="text-slate-500 font-semibold block text-[11px]">
                    사용자가 직접 표현한 내용:
                  </span>
                  <p className="text-slate-800 mt-0.5">
                    {emotionAnalysis?.directlyExpressed || '직접 언급된 감정 표현 없음'}
                  </p>
                </div>
                <div className="p-2 rounded bg-white border border-slate-200/70">
                  <span className="text-slate-500 font-semibold block text-[11px]">
                    추론 여부:
                  </span>
                  <p className="text-slate-800 mt-0.5">
                    {emotionAnalysis?.inferredContext || '상황에 기초한 합리적 추정'}
                  </p>
                </div>
              </div>
            </div>

            {/* 확인이 필요한 해석 */}
            {emotionAnalysis?.unverifiedInterpretations && (
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 space-y-1">
                <span className="font-bold text-amber-900 block text-[11px] flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                  확인이 필요한 미확정 해석:
                </span>
                <p className="leading-relaxed">
                  {emotionAnalysis.unverifiedInterpretations}
                </p>
              </div>
            )}

            {/* 스스로에게 던져볼 질문 */}
            {emotionAnalysis?.questionsToAsk && emotionAnalysis.questionsToAsk.length > 0 && (
              <div className="p-3.5 rounded-xl bg-indigo-50/40 border border-indigo-200 space-y-1 text-xs">
                <span className="font-bold text-indigo-950 block text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  스스로에게 던져볼 질문:
                </span>
                <ul className="space-y-1 text-indigo-900">
                  {emotionAnalysis.questionsToAsk.map((q, qIdx) => (
                    <li key={qIdx} className="leading-relaxed flex items-start gap-1">
                      <span className="text-indigo-500 font-bold">•</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. 선택을 어렵게 만드는 핵심 갈등 (Section 5 요구사항) */}
      {coreConflict && coreConflict.conflictDescription !== '아직 확인되지 않음' && (
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
                3
              </span>
              <Scale className="w-4 h-4 text-slate-700" />
              <span>선택을 어렵게 만드는 핵심 갈등</span>
            </h3>
            <span className="text-xs text-slate-500">충돌하는 가치 분석</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-800 block text-[11px]">
                갈등 구조 요약
              </span>
              <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                {coreConflict.conflictDescription}
              </p>
              <div className="pt-2 text-indigo-900 font-semibold">
                충돌하는 가치: {coreConflict.competingValues}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1.5 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="font-bold text-indigo-950 block text-[11px] flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                  스스로 결정을 내리기 위한 핵심 성찰 질문
                </span>
                <p className="text-indigo-950 font-medium leading-relaxed text-xs sm:text-sm">
                  "{coreConflict.reflectionPoint}"
                </p>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                * 이 질문에 대한 본인만의 답을 내릴 때, 결정의 실마리가 풀릴 수 있습니다.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 4. 감정과 사실의 명확한 구분 (Fact Distinction) */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
              4
            </span>
            <span>감정과 사실의 구분 (Fact vs Interpretation)</span>
          </h3>
          <span className="text-xs text-slate-500">
            * 검증되지 않은 외부 사실을 단정하지 않습니다
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* 사용자가 직접 말한 사실 */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-800 block text-[11px]">
              사용자가 직접 입력한 내용
            </span>
            <ul className="space-y-1 text-slate-700">
              {factDistinction?.userReported?.map((fact, idx) => (
                <li key={idx} className="leading-relaxed flex items-start gap-1">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 사용자 확인/수정 거친 사실 */}
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
            <span className="font-bold text-emerald-950 block text-[11px] flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
              사용자가 확인·수정한 정리
            </span>
            <ul className="space-y-1 text-emerald-900">
              {factDistinction?.userConfirmedFacts?.length ? factDistinction.userConfirmedFacts.map((fact, idx) => (
                <li key={idx} className="leading-relaxed flex items-start gap-1">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{fact}</span>
                </li>
              )) : <li className="text-emerald-800">사용자가 별도로 확인한 내용은 없습니다.</li>}
            </ul>
          </div>

          {/* 분석에서 사용한 해석과 전제 */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-800 block text-[11px]">
              정리 방식
            </span>
            <ul className="space-y-1 text-slate-700">
              {(factDistinction?.aiInferences?.length ? factDistinction.aiInferences : ['사용자의 표현을 로컬 규칙으로 정리했습니다. 외부 사실을 검증하거나 심리 상태를 진단하지 않습니다.']).map((item, idx) => (
                <li key={idx} className="leading-relaxed flex items-start gap-1">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 아직 확인되지 않은 정보 */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
            <span className="font-bold text-amber-950 block text-[11px] flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              아직 확인되지 않은 정보
            </span>
            <ul className="space-y-1 text-amber-950">
              {factDistinction?.unverifiedItems?.map((item, idx) => (
                <li key={idx} className="leading-relaxed flex items-start gap-1">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 5. 적용한 판단 기준 및 가치 */}
      {appliedCriteria.length > 0 && (
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
                5
              </span>
              <Sliders className="w-4 h-4 text-slate-700" />
              <span>적용한 판단 기준 ({appliedCriteria.length}개)</span>
            </h3>
            <span className="text-xs text-slate-500">
              사용자 지정 기준 우선 + 고민별 보완
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {appliedCriteria.map((c, cIdx) => (
              <div
                key={cIdx}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 flex flex-col justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-bold text-slate-900">
                      {c.name}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                        c.source === '사용자 지정'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {c.source} {c.importance ? `(${c.importance})` : ''}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {c.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

        </div>
      </details>
      {/* 6. 선택지 비교 (사용자가 요청한 경우만 제공) */}
      {showOptionComparison && optionsComparison.length > 0 && (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
              6
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              요청한 선택지 조건 비교
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowOptionsDetails(!showOptionsDetails)}
            className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
          >
            <span>{showOptionsDetails ? '접어두기' : '대안 비교 펼쳐보기'}</span>
            {showOptionsDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <p className="text-xs text-slate-500">
          직접 적은 조건을 나란히 볼 수 있습니다. 장단점이나 추천 순위는 임의로 만들지 않습니다.
        </p>

        {showOptionsDetails && (
          <div className="space-y-4 animate-fadeIn">
            {/* Options grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {optionsComparison.map((opt, idx) => (
                <div
                  key={opt.id || idx}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-sm sm:text-base text-slate-900">
                          {opt.name}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 pl-6.5">{opt.summary}</p>
                    </div>

                  </div>

                  {/* Evidence and uncertainty */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs leading-relaxed space-y-1">
                    <div>
                      <span className="font-bold text-slate-900 mr-1 text-[11px]">비교 근거와 불확실성:</span>
                      <span className="text-slate-700">{opt.scoreReasoning}</span>
                    </div>
                  </div>

                  {/* Pros & Cons */}
                  {(opt.pros.length > 0 || opt.cons.length > 0) && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        실질적 이점
                      </span>
                      <ul className="space-y-1">
                        {opt.pros.map((p, pIdx) => (
                          <li key={pIdx} className="text-slate-700 leading-relaxed">
                            • {p}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        비용과 부담
                      </span>
                      <ul className="space-y-1">
                        {opt.cons.map((c, cIdx) => (
                          <li key={cIdx} className="text-slate-700 leading-relaxed">
                            • {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>}

                  {/* Main Risk */}
                  {opt.mainRisk && (
                    <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 text-xs text-rose-950 leading-relaxed">
                      <span className="font-bold text-rose-900 block text-[11px] mb-0.5 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        추가로 확인할 점:
                      </span>
                      {opt.mainRisk}
                    </div>
                  )}

                  {/* Conditions */}
                  <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-700 leading-relaxed">
                    <p>
                      <strong className="text-slate-900 font-semibold mr-1">
                        바라는 변화:
                      </strong>
                      {opt.suitableCondition}
                    </p>
                    <p>
                      <strong className="text-slate-900 font-semibold mr-1">
                        부담스러운 점:
                      </strong>
                      {opt.cautionCondition}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Provisional Recommendation Card */}
            {finalRecommendation && (
              <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-xs space-y-3">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-1">
                    판단에 참고하기
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-white leading-snug">
                    {finalRecommendation.summary}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2">
                    {finalRecommendation.reason}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1">
                    <span className="text-rose-400 font-bold block text-[11px] flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      주의할 위험:
                    </span>
                    <p className="text-slate-200 leading-relaxed">
                      {finalRecommendation.biggestRisk}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1">
                    <span className="text-amber-300 font-bold block text-[11px] flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" />
                      다시 살펴볼 때:
                    </span>
                    <p className="text-slate-200 leading-relaxed">
                      {finalRecommendation.conditionsForChange}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
      )}

      {/* Bottom Navigation Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
        <button
          type="button"
          onClick={onBackToInputs}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>입력 내용 수정하기</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
        >
          <span>7일 계획과 체크리스트 보기 (선택)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
