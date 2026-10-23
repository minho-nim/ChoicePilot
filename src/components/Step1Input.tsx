import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ArrowRight,
  Calendar,
  Wallet,
  Clock,
  AlertCircle,
  Info
} from 'lucide-react';
import { DecisionInputs, DecisionCriterion } from '../types';
import { PRESET_SCENARIOS, PresetScenario } from '../data/presets';

interface Step1InputProps {
  inputs: DecisionInputs;
  onChange: (inputs: DecisionInputs) => void;
  includeOptionComparison: boolean;
  onIncludeOptionComparisonChange: (value: boolean) => void;
  onNext: () => void;
  onLoadPreset: (preset: PresetScenario) => void;
}

const CRITERIA_INSPIRATIONS = [
  '커리어 성장 & 역량',
  '기본급 및 보상',
  '워라밸 & 개인 시간',
  '건강 및 스트레스',
  '고용 및 조직 안정성',
  '가족 및 주변 관계',
  '현금 유동성'
];

export const Step1Input: React.FC<Step1InputProps> = ({
  inputs,
  onChange,
  includeOptionComparison,
  onIncludeOptionComparisonChange,
  onNext,
  onLoadPreset,
}) => {
  const [newOptionText, setNewOptionText] = useState('');
  const [customCriterion, setCustomCriterion] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Add an option
  const handleAddOption = () => {
    if (!newOptionText.trim()) return;
    onChange({
      ...inputs,
      options: [...inputs.options, newOptionText.trim()],
      optionNotes: [...inputs.options.map((_, index) => inputs.optionNotes?.[index] || ''), ''],
    });
    setNewOptionText('');
    setValidationError(null);
  };

  // Remove an option
  const handleRemoveOption = (index: number) => {
    const updated = inputs.options.filter((_, i) => i !== index);
    onChange({ ...inputs, options: updated, optionNotes: inputs.options.map((_, i) => inputs.optionNotes?.[i] || '').filter((_, i) => i !== index) });
  };

  // Edit an option
  const handleEditOption = (index: number, val: string) => {
    const updated = [...inputs.options];
    updated[index] = val;
    onChange({ ...inputs, options: updated });
  };

  // Add custom criterion
  const handleAddCriterion = (criterionName?: string) => {
    const nameToAdd = (criterionName || customCriterion).trim();
    if (!nameToAdd) return;

    if (inputs.criteria.some((c) => c.name === nameToAdd)) {
      setCustomCriterion('');
      return;
    }

    const newCrit: DecisionCriterion = {
      id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: nameToAdd,
      importance: 'high',
    };

    onChange({
      ...inputs,
      criteria: [...inputs.criteria, newCrit],
    });
    setCustomCriterion('');
  };

  // Remove individual criterion
  const handleRemoveCriterion = (id: string) => {
    onChange({
      ...inputs,
      criteria: inputs.criteria.filter((c) => c.id !== id),
    });
  };

  // Change importance of a criterion ('매우 중요' vs '보통')
  const handleChangeImportance = (
    id: string,
    importance: 'high' | 'medium'
  ) => {
    onChange({
      ...inputs,
      criteria: inputs.criteria.map((c) =>
        c.id === id ? { ...c, importance } : c
      ),
    });
  };

  // Proceed to Step 2
  const handleProceed = () => {
    if (!inputs.dilemma.trim()) {
      setValidationError('현재 마주하고 있는 고민 내용을 입력해주세요.');
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    setValidationError(null);
    if (includeOptionComparison && inputs.options.filter((option) => option.trim()).length < 2) {
      setValidationError('조건을 비교하려면 선택지를 두 개 이상 적어주세요. 고민 정리만 원하면 비교 선택을 해제할 수 있어요.');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Intro section */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="max-w-3xl space-y-3">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            지금 어떤 고민이 있나요?
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            정리되지 않은 이야기여도 괜찮아요. 한 번 적어 주시면 필요한 내용만 하나씩 확인할게요.
          </p>

          {/* Preset Buttons for Quick Try */}
          <details className="pt-2">
            <summary className="cursor-pointer text-xs font-semibold text-slate-500">예시로 살펴보기</summary>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3">
              {PRESET_SCENARIOS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onLoadPreset(preset)}
                  className="text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  <span className="block text-[11px] font-semibold text-indigo-700 mb-0.5">
                    {preset.badge}
                  </span>
                  <span className="block text-xs font-medium text-slate-800 line-clamp-1">
                    {preset.title}
                  </span>
                </button>
              ))}
            </div>
          </details>
        </div>
      </section>

      {/* Validation Error Alert */}
      {validationError && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm font-medium">{validationError}</div>
        </div>
      )}

      {/* Main Input Form */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-7">
        {/* Section 1: 고민 내용 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="dilemma" className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>나의 고민</span>
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-slate-500">
              상황과 망설여지는 이유를 적어주세요
            </span>
          </div>
          <textarea
            id="dilemma"
            rows={5}
            value={inputs.dilemma}
            onChange={(e) => onChange({ ...inputs, dilemma: e.target.value })}
            placeholder="예: 새로운 일을 배우고 싶은데 퇴근하면 지쳐요. 무리해서 그만둘까 걱정되지만, 하루 20분이라도 시작하고 싶어요."
            className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-all text-sm leading-relaxed placeholder:text-slate-400 outline-none"
          />
        </div>

        <details className="rounded-xl border border-slate-200 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">마음·선택지·조건을 더 적고 싶어요 (선택)</summary>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
          <label className="space-y-1.5 text-xs font-semibold text-slate-800">
            지금 느끼는 감정 (선택)
            <textarea rows={2} value={inputs.feelings || ''} onChange={(e) => onChange({ ...inputs, feelings: e.target.value })} placeholder="예: 기대되지만 걱정돼요" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-normal outline-none focus:bg-white" />
          </label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-800">
            가장 피하고 싶은 일 (선택)
            <textarea rows={2} value={inputs.primaryConcern || ''} onChange={(e) => onChange({ ...inputs, primaryConcern: e.target.value })} placeholder="예: 선택 후 후회하거나 생활이 불안정해지는 것" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-normal outline-none focus:bg-white" />
          </label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-800">
            바라는 변화 (선택)
            <textarea rows={2} value={inputs.desiredChange || inputs.goal} onChange={(e) => onChange({ ...inputs, desiredChange: e.target.value, goal: '' })} placeholder="예: 성장하면서도 일상의 여유를 유지하고 싶어요" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-normal outline-none focus:bg-white" />
          </label>
        </div>

        {/* Section 3: 선택지 목록 (선택 사항) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>검토 중인 선택지</span>
                <span className="text-slate-400">(선택)</span>
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                비교하고 싶은 대안을 직접 입력해주세요.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              현재 {inputs.options.filter((option) => option.trim()).length}개 입력됨
            </span>
          </div>

          {/* Existing options list */}
          <div className="space-y-2">
            {inputs.options.map((opt, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200"
              >
                <span className="w-5 h-5 rounded bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleEditOption(idx, e.target.value)}
                  placeholder={`선택지 ${idx + 1} 내용 입력`}
                  aria-label={`선택지 ${idx + 1}`}
                  className="flex-1 bg-transparent text-sm text-slate-800 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveOption(idx)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  title="선택지 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <textarea
                  rows={2}
                  aria-label={`선택지 ${idx + 1}의 조건`}
                  value={inputs.optionNotes?.[idx] || ''}
                  onChange={(e) => onChange({ ...inputs, optionNotes: inputs.options.map((_, index) => index === idx ? e.target.value : inputs.optionNotes?.[index] || '') })}
                  placeholder="이 선택지에 대해 알고 있는 조건이나 출처 (선택)"
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none focus:border-slate-400"
                />
              </div>
            ))}
          </div>

          {/* Add option input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newOptionText}
              onChange={(e) => setNewOptionText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddOption();
                }
              }}
              placeholder="새로운 선택지 추가 입력 (예: 현재 회사 잔류 후 타 부서 이동)"
              className="flex-1 p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-400"
            />
            <button
              type="button"
              onClick={handleAddOption}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>선택지 추가</span>
            </button>
          </div>

          {inputs.options.length < 2 && (
            <p className="text-xs text-amber-700 font-medium">
              선택지를 비워도 고민 정리와 7일 계획을 진행할 수 있습니다.
            </p>
          )}

          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 cursor-pointer">
            <input type="checkbox" checked={includeOptionComparison} onChange={(e) => onIncludeOptionComparisonChange(e.target.checked)} className="mt-0.5 accent-indigo-700" />
            <span><strong>선택지 조건 비교도 보고 싶어요.</strong><br />직접 적은 조건을 나란히 봅니다. 점수나 순위는 정하지 않습니다.</span>
          </label>
        </div>

        {/* Section 4: 판단 기준 관리 기능 (기본 선택 없음, 개별 삭제, 중요도 토글, 기준 없이도 진행 가능) */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div>
            <label className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>중요하게 고려할 판단 기준 (선택)</span>
              <span className="text-xs font-normal text-slate-500">
                {inputs.criteria.length}개 설정됨
              </span>
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              중요하게 생각하는 조건이 있다면 적어주세요.
            </p>
          </div>

          {/* Custom criterion input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customCriterion}
              onChange={(e) => setCustomCriterion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCriterion();
                }
              }}
              placeholder="판단 기준 직접 추가 (예: 출퇴근 거리, 기본급 보상, 기술 성장 등)"
              className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-slate-400"
            />
            <button
              type="button"
              onClick={() => handleAddCriterion()}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition-colors shrink-0"
            >
              기준 추가
            </button>
          </div>

          {/* Optional inspiration chips for quick addition */}
          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 block">
              참고할 만한 예시 기준 (클릭 시 추가):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {CRITERIA_INSPIRATIONS.map((name) => {
                const isAlreadyAdded = inputs.criteria.some((c) => c.name === name);
                return (
                  <button
                    key={name}
                    type="button"
                    disabled={isAlreadyAdded}
                    onClick={() => handleAddCriterion(name)}
                    className={`px-2 py-1 rounded-lg text-xs transition-colors border ${
                      isAlreadyAdded
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    + {name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active criteria list with individual deletion and importance toggle */}
          {inputs.criteria.length > 0 ? (
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-slate-700 block">
                등록된 기준 목록:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {inputs.criteria.map((crit) => (
                  <div
                    key={crit.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <span className="text-xs font-medium text-slate-800 truncate mr-2">
                      {crit.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Importance toggle: 매우 중요 vs 보통 */}
                      <div className="flex items-center bg-white p-0.5 rounded border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleChangeImportance(crit.id, 'high')}
                          className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                            crit.importance === 'high'
                              ? 'bg-slate-900 text-white font-semibold'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          매우 중요
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChangeImportance(crit.id, 'medium')}
                          className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                            crit.importance === 'medium'
                              ? 'bg-slate-900 text-white font-semibold'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          보통
                        </button>
                      </div>

                      {/* Individual delete button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveCriterion(crit.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="기준 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-start gap-2 text-xs text-slate-500">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                기준을 적지 않아도 고민을 정리할 수 있습니다.
              </span>
            </div>
          )}
        </div>

        {/* Section 5: 제약조건 */}
        <div className="space-y-2.5 pt-3 border-t border-slate-100">
          <div>
            <label className="text-sm font-bold text-slate-900">
              현실적인 제약조건 (선택)
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              기한이나 예산 등 현실적인 한계를 적어주시면 무리 없는 계획을 제안합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 결정 기한 */}
            <div className="space-y-1 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> 결정 기한
              </span>
              <input
                type="text"
                value={inputs.constraints.timeframe}
                onChange={(e) =>
                  onChange({
                    ...inputs,
                    constraints: {
                      ...inputs.constraints,
                      timeframe: e.target.value,
                    },
                  })
                }
                placeholder="예: 10일 이내 회신"
                className="w-full bg-white p-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-slate-400"
              />
            </div>

            {/* 예산 한도 */}
            <div className="space-y-1 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-slate-500" /> 가용 예산 / 비용
              </span>
              <input
                type="text"
                value={inputs.constraints.budget}
                onChange={(e) =>
                  onChange({
                    ...inputs,
                    constraints: {
                      ...inputs.constraints,
                      budget: e.target.value,
                    },
                  })
                }
                placeholder="예: 비상금 6개월분 보유"
                className="w-full bg-white p-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-slate-400"
              />
            </div>

            {/* 체력 및 개인 여건 */}
            <div className="space-y-1 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> 개인 여건 / 가용 시간
              </span>
              <input
                type="text"
                value={inputs.constraints.energyOrPersonal}
                onChange={(e) =>
                  onChange({
                    ...inputs,
                    constraints: {
                      ...inputs.constraints,
                      energyOrPersonal: e.target.value,
                    },
                  })
                }
                placeholder="예: 평일 저녁 1~2시간 가용"
                className="w-full bg-white p-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-slate-400"
              />
            </div>
          </div>
        </div>

        </details>

        {/* Submit Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            글은 외부 AI에 전송하지 않고 이 브라우저에서 정리합니다.
          </span>
          <button
            type="button"
            onClick={handleProceed}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <span>고민 정리 시작하기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
