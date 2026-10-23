import { AnalysisResult, DecisionInputs, FollowUpQnA, UnderstandingResult, UserConfirmation } from '../types';
import { nextFollowUp, resolveReflection, sentences, shortQuote, UNKNOWN } from './reflectionContext';
import { makeSevenDayPlan } from './planBuilder';

export function buildLocalUnderstanding(inputs: DecisionInputs, answers: FollowUpQnA[] = []): UnderstandingResult {
  const context = resolveReflection(inputs, answers);
  const next = nextFollowUp(inputs, answers);
  return {
    summary: context.summary, emotionalCues: context.feelings, emotionalEvidence: context.emotionalEvidence,
    primaryConcerns: context.concern, desiredOutcome: context.desired, innerConflict: context.innerConflict,
    unverifiedInterpretations: '입력에서 찾은 표현을 로컬 규칙으로 정리했습니다. 문맥을 잘못 읽었거나 놓친 부분은 수정해 주세요.',
    confirmationPrompt: '이 정리가 지금의 고민과 대체로 맞나요?',
    needsFollowUp: Boolean(next), followUpQuestion: next?.question, followUpReason: next?.reason, followUpField: next?.field,
  };
}

export function buildLocalAnalysis(inputs: DecisionInputs, confirmation: UserConfirmation, followUps: FollowUpQnA[], includeComparison: boolean, durationSeconds: number): AnalysisResult {
  const context = resolveReflection(inputs, followUps, confirmation);
  const { inputs: effective, concern, desired, feelings } = context;
  const options = effective.options.map((name, index) => ({ name: name.trim(), notes: effective.optionNotes?.[index]?.trim() || '', index })).filter((option) => option.name);
  const compare = includeComparison && options.length >= 2;
  const unverified = [concern === UNKNOWN ? '가장 부담스러운 점' : '', desired === UNKNOWN ? '바라는 변화' : ''].filter(Boolean);
  if (compare) for (const option of options) if (!option.notes) unverified.push(`“${option.name}”의 구체적인 조건`);
  const currentSituation = confirmation.correctedInputs || confirmation.status === 'partially_different' ? context.summary : effective.dilemma;
  const reported = [...new Set([...sentences(currentSituation), feelings, concern, desired].filter((item) => item && item !== UNKNOWN))];
  const confirmed = confirmation.status === 'mostly_correct' || confirmation.status === 'partially_different';
  const plan = makeSevenDayPlan(context);
  return {
    problemAnalysis: { coreDilemma: context.summary, background: currentSituation, tradeoff: context.innerConflict },
    emotionAnalysis: {
      summary: context.summary, emotionalCues: feelings, primaryConcerns: concern, desiredChange: desired,
      innerConflict: context.innerConflict, unverifiedInterpretations: context.emotionalEvidence,
      directlyExpressed: reported.join('\n'), inferredContext: '사용자의 표현만 정리했습니다. 심리 상태를 진단하거나 감정 강도를 점수화하지 않습니다.',
      questionsToAsk: [],
    },
    factDistinction: { verifiedFacts: [], userReported: reported, userConfirmedFacts: confirmed ? reported : [], aiInferences: [], unverifiedItems: unverified },
    coreConflict: { conflictDescription: context.innerConflict, competingValues: context.innerConflict !== UNKNOWN ? '글에 함께 나타난 바람과 걱정입니다. 가치의 우열은 정하지 않았습니다.' : UNKNOWN, reflectionPoint: concern !== UNKNOWN ? `“${shortQuote(concern, 100)}”를 확인할 수 있는 근거는 무엇일까요?` : '아직 모르는 조건 한 가지를 확인할 수 있는 곳을 찾아보세요.' },
    appliedCriteria: effective.criteria.map((criterion) => ({ name: criterion.name, reason: '사용자가 직접 추가한 판단 기준입니다.', source: '사용자 지정', importance: criterion.importance === 'high' ? '매우 중요' : '보통' })),
    optionsComparison: compare ? options.map((option) => ({
      id: `local-option-${option.index + 1}`, name: option.name, summary: option.notes || '구체적인 조건이 아직 입력되지 않았습니다.',
      scoreDisplay: '조건 확인', scoreMeaning: '점수와 순위를 부여하지 않습니다.',
      scoreReasoning: desired !== UNKNOWN ? `“${shortQuote(desired, 120)}”에 맞는 조건인지 확인해 보세요.` : '어떤 결과를 원하는지 정해지면 필요한 조건을 좁힐 수 있습니다.',
      pros: [], cons: [], mainRisk: option.notes ? '입력한 조건의 출처와 실제 적용 여부는 별도로 확인해야 합니다.' : '이 대안의 실제 조건이 아직 확인되지 않았습니다.',
      criteriaFit: effective.criteria.map((criterion) => ({ criterion: criterion.name, weight: criterion.importance === 'high' ? '매우 중요' : '보통', rating: '추가 확인 필요', basis: `“${criterion.name}”에 대한 근거를 입력한 조건과 대조해 주세요.` })),
      suitableCondition: desired !== UNKNOWN ? desired : UNKNOWN, cautionCondition: concern !== UNKNOWN ? concern : UNKNOWN,
    })) : [],
    finalRecommendation: { summary: '목표와 조건을 확인하며 판단할 수 있습니다.', reason: '작성한 조건만 나란히 보여 드립니다. 유리함이나 추천 순위를 임의로 정하지 않습니다.', biggestRisk: concern, conditionsForChange: '새로운 조건이 확인되거나 중요하게 생각하는 것이 달라지면 다시 살펴보세요.' },
    sevenDayPlan: plan.days, planNote: plan.note, analysisDuration: durationSeconds,
    limitations: [
      '사용자가 설명한 내용을 바탕으로 한 로컬 정리이며 외부 사실을 검증하지 않습니다.',
      ...(confirmation.status === 'unsure' ? ['이 정리가 맞는지 아직 확인되지 않았습니다. 해석을 확정하지 않았습니다.'] : []),
      ...(unverified.length ? ['미확인 항목이 남아 있어 다음 행동은 판단 근거를 모으는 데 초점을 둡니다.'] : []),
    ],
  };
}
