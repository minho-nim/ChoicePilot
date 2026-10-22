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
    });
    setNewOptionText('');
    setValidationError(null);
  };

  // Remove an option
  const handleRemoveOption = (index: number) => {
    const updated = inputs.options.filter((_, i) => i !== index);
    onChange({ ...inputs, options: updated });
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
    onNext();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Intro section */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="max-w-3xl space-y-3">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            고민을 정리하고 스스로 판단할 근거를 찾아보세요
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            상황과 마음을 먼저 살펴보고, 필요한 경우 선택지 비교를 덧붙여 판단 근거를 차분히 정리합니다.
          </p>

          {/* Preset Buttons for Quick Try */}
          <div className="pt-2">
            <span className="block text-xs font-semibold text-slate-500 mb-2">
              예시 시나리오 불러오기:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
          </div>
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
            <label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>1. 어떤 고민을 하고 계신가요?</span>
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-slate-500">
              상황과 망설여지는 이유를 적어주세요
            </span>
          </div>
          <textarea
            rows={4}
            value={inputs.dilemma}
            onChange={(e) => onChange({ ...inputs, dilemma: e.target.value })}
            placeholder="예: 5년 차 개발자로 현재 직장에 3년째 근무 중입니다. 안정적이지만 신규 기술 도입이 더뎌 성장이 정체된 느낌입니다. 최근 스타트업에서 팀 리드 자리와 연봉 인상 제안을 받았는데, 스타트업의 불확실성과 야근이 걱정됩니다."
            className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-all text-sm leading-relaxed placeholder:text-slate-400 outline-none"
          />
        </div>

        {/* Section 2: 달성 목표 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900">
              2. 이 결정을 통해 이루고자 하는 목표는 무엇인가요?
            </label>
            <span className="text-xs text-slate-500">성공 기준 (선택)</span>
          </div>
          <input
            type="text"
            value={inputs.goal}
            onChange={(e) => onChange({ ...inputs, goal: e.target.value })}
            placeholder="예: 3년 내 기술 리더로서의 실질적 역량을 키우고, 주 2회 이상 가족과 저녁을 먹을 수 있는 일상 유지"
            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-all text-sm placeholder:text-slate-400 outline-none"
          />
        </div>

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
            <textarea rows={2} value={inputs.desiredChange || ''} onChange={(e) => onChange({ ...inputs, desiredChange: e.target.value })} placeholder="예: 성장하면서도 일상의 여유를 유지하고 싶어요" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-normal outline-none focus:bg-white" />
          </label>
        </div>

        {/* Section 3: 선택지 목록 (선택 사항) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>3. 검토 중인 대안 (선택지)</span>
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
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200"
              >
                <span className="w-5 h-5 rounded bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleEditOption(idx, e.target.value)}
                  placeholder={`선택지 ${idx + 1} 내용 입력`}
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
            <span><strong>선택지 비교와 추천도 함께 받고 싶어요.</strong><br />선택지를 두 개 이상 입력한 경우에만 보조 비교를 제공합니다.</span>
          </label>
        </div>

        {/* Section 4: 판단 기준 관리 기능 (기본 선택 없음, 개별 삭제, 중요도 토글, 기준 없이도 진행 가능) */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div>
            <label className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>4. 중요하게 고려할 판단 기준 (선택)</span>
              <span className="text-xs font-normal text-slate-500">
                {inputs.criteria.length}개 설정됨
              </span>
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              원하는 기준을 직접 추가해보세요. 기준이 없어도 기본 관점으로 분석할 수 있습니다.
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
                등록된 판단 기준이 없습니다. 기준을 추가하면 분석이 더욱 정교해지며, 기준 없이도 분석을 계속 진행할 수 있습니다.
              </span>
            </div>
          )}
        </div>

        {/* Section 5: 제약조건 */}
        <div className="space-y-2.5 pt-3 border-t border-slate-100">
          <div>
            <label className="text-sm font-bold text-slate-900">
              5. 현실적인 제약조건 (선택)
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

        {/* Submit Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            * 입력하신 내용은 브라우저 세션에서만 임시로 사용됩니다.
          </span>
          <button
            type="button"
            onClick={handleProceed}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <span>다음: 목표 및 제약조건 확인</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
