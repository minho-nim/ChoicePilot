import {
  AnalysisResult,
  DecisionInputs,
  FollowUpQnA,
  UnderstandingResult,
  UserConfirmation,
} from '../types';

const UNKNOWN = '아직 확인되지 않음';

export function buildLocalUnderstanding(inputs: DecisionInputs): UnderstandingResult {
  const situation = inputs.dilemma.trim();
  const summary = `상황: ${situation} ${inputs.goal.trim() ? `바라는 변화: ${inputs.goal.trim()}` : '바라는 변화는 아직 입력되지 않았습니다.'}`;
  const missing = !inputs.primaryConcern?.trim()
    ? { question: '이 상황에서 가장 피하고 싶은 결과는 무엇인가요?', reason: '핵심 걱정을 사용자가 직접 정리할 수 있도록 묻습니다.' }
    : !inputs.desiredChange?.trim()
      ? { question: '이 상황이 어떤 방향으로 바뀌면 좋겠나요?', reason: '바라는 변화가 아직 입력되지 않았습니다.' }
      : !inputs.feelings?.trim()
        ? { question: '이 고민을 생각할 때 어떤 감정이 가장 먼저 드나요?', reason: '감정은 추측하지 않고 사용자의 표현을 확인합니다.' }
        : null;

  return {
    summary,
    emotionalCues: inputs.feelings?.trim() || '감정은 직접 입력되지 않아 아직 확인되지 않았습니다.',
    primaryConcerns: inputs.primaryConcern?.trim() || UNKNOWN,
    desiredOutcome: inputs.desiredChange?.trim() || inputs.goal?.trim() || UNKNOWN,
    innerConflict: UNKNOWN,
    unverifiedInterpretations: 'AI 추론을 사용하지 않습니다. 입력하지 않은 내용은 확인되지 않은 정보로 둡니다.',
    confirmationPrompt: `제가 정리한 상황은 다음과 같습니다: ${summary} 맞지 않거나 덧붙이고 싶은 점이 있나요?`,
    needsFollowUp: Boolean(missing),
    followUpQuestion: missing?.question,
    followUpReason: missing?.reason,
  };
}

function makeSevenDayPlan(inputs: DecisionInputs, followUps: FollowUpQnA[], userCorrection?: string) {
  const answerFor = (word: string) => followUps.find((item) => item.question.includes(word))?.answer.trim();
  const target = userCorrection?.trim() || inputs.primaryConcern?.trim() || answerFor('피하고') || inputs.desiredChange?.trim() || answerFor('바뀌') || '아직 확인되지 않은 조건';
  return [
    ['현재 정보 적기', '고민에서 직접 확인한 사실과 아직 모르는 점을 각각 3개 이내로 적습니다.'],
    ['걱정 구체화', `가장 큰 걱정인 “${target}”이 실제로 일어날 조건을 한 가지 적습니다.`],
    ['필요한 정보 하나 찾기', '결정에 영향을 줄 정보 한 가지를 공식 자료나 관련자에게 확인합니다.'],
    ['작은 확인 행동', '부담이 적은 방식으로 선택지 하나를 짧게 경험하거나 담당자에게 질문합니다.'],
    ['중요 기준 정리', '이 결정에서 양보하기 어려운 조건을 최대 두 가지 적습니다.'],
    ['선택지 다시 보기', '새로 확인한 정보를 반영해 각 선택지의 이점과 부담을 한 줄씩 적습니다.'],
    ['다음 단계 정하기', '결정을 내리거나, 추가 확인이 필요하다면 다음 확인 행동과 날짜를 정합니다.'],
  ].map(([title, task], index) => ({
    day: index + 1,
    dayTitle: `${index + 1}일차: ${title}`,
    task,
    estimatedMinutes: '10~20분',
    completionCriteria: index === 0 ? '사실과 미확인 정보가 각각 한 가지 이상 적혀 있습니다.' : '오늘 정한 행동이나 기록을 완료했습니다.',
  }));
}

export function buildLocalAnalysis(
  inputs: DecisionInputs,
  confirmation: UserConfirmation,
  followUps: FollowUpQnA[],
  includeComparison: boolean,
  durationSeconds: number,
): AnalysisResult {
  const answerFor = (word: string) => followUps.find((item) => item.question.includes(word))?.answer.trim();
  const concern = inputs.primaryConcern?.trim() || answerFor('피하고') || UNKNOWN;
  const desired = inputs.desiredChange?.trim() || answerFor('바뀌') || inputs.goal?.trim() || UNKNOWN;
  const expressedFeelings = inputs.feelings?.trim() || answerFor('감정') || UNKNOWN;
  const correction = confirmation.status === 'partially_different' ? confirmation.userCorrection?.trim() : '';
  const options = inputs.options.map((value) => value.trim()).filter(Boolean);
  const comparisonRequested = includeComparison && options.length >= 2;
  const confirmed = confirmation.status === 'mostly_correct'
    ? [inputs.dilemma.trim(), expressedFeelings, concern, desired].filter((value) => value !== UNKNOWN)
    : correction ? [correction] : [];
  const optionResults = comparisonRequested ? options.map((name, index) => ({
    id: `local-option-${index + 1}`,
    name,
    summary: '선택지의 실제 조건은 사용자 확인이 필요합니다.',
    scoreDisplay: '정성적 참고',
    scoreMeaning: '수치 점수는 사용하지 않습니다.',
    scoreReasoning: `사용자가 적은 판단 기준: ${inputs.criteria.map((criterion) => criterion.name).join(', ') || UNKNOWN}. 대안의 구체 조건은 아직 확인되지 않았습니다.`,
    pros: ['현재 입력만으로 확인된 장점은 없습니다.'],
    cons: ['실제 비용과 부담을 추가로 확인해야 합니다.'],
    mainRisk: '확인되지 않은 조건을 사실로 가정할 위험이 있습니다.',
    criteriaFit: inputs.criteria.map((criterion) => ({ criterion: criterion.name, weight: criterion.importance === 'high' ? '매우 중요' : '보통', rating: '추가 확인 필요' as const, basis: '선택지별 구체 정보가 입력되지 않았습니다.' })),
    suitableCondition: '사용자의 중요 조건을 충족하는지 확인한 뒤 판단할 수 있습니다.',
    cautionCondition: '핵심 조건이나 비용이 확인되지 않았다면 결정을 미루고 정보를 확보하세요.',
  })) : [];

  return {
    problemAnalysis: {
      coreDilemma: correction || `${inputs.dilemma.trim()}${desired !== UNKNOWN ? ` 바라는 변화는 ${desired}입니다.` : ''}`,
      background: `사용자가 입력한 상황: ${inputs.dilemma.trim()}`,
      tradeoff: concern !== UNKNOWN && desired !== UNKNOWN ? `피하고 싶은 결과(${concern})와 바라는 변화(${desired})를 함께 고려해야 합니다.` : '핵심 걱정 또는 바라는 변화가 아직 충분히 확인되지 않았습니다.',
    },
    emotionAnalysis: {
      summary: inputs.dilemma.trim(),
      emotionalCues: expressedFeelings,
      primaryConcerns: concern,
      desiredChange: desired,
      innerConflict: UNKNOWN,
      unverifiedInterpretations: 'AI 추론을 하지 않았습니다. 사용자가 입력하거나 확인하지 않은 내용은 미확인으로 둡니다.',
      directlyExpressed: [inputs.dilemma.trim(), expressedFeelings !== UNKNOWN ? expressedFeelings : '', concern !== UNKNOWN ? concern : '', desired !== UNKNOWN ? desired : '', correction].filter(Boolean).join('\n'),
      inferredContext: '추론하지 않음',
      questionsToAsk: ['현재 확인된 사실과 아직 확인되지 않은 정보는 무엇인가요?'],
    },
    factDistinction: {
      verifiedFacts: inputs.dilemma.trim().split(/[\n.!?。]+/).map((part) => part.trim()).filter(Boolean),
      userConfirmedFacts: confirmed,
      aiInferences: ['AI 추론을 사용하지 않았습니다.'],
      unverifiedItems: [desired !== UNKNOWN ? '' : '바라는 결과', expressedFeelings !== UNKNOWN ? '' : '감정', concern !== UNKNOWN ? '' : '핵심 걱정', '선택지별 실제 조건'].filter(Boolean),
    },
    coreConflict: {
      conflictDescription: '서로 충돌하는 욕구나 가치가 있는지는 아직 확인되지 않았습니다.',
      competingValues: UNKNOWN,
      reflectionPoint: '결정 전에 확인하면 후회 가능성을 가장 줄여줄 정보는 무엇인가요?',
    },
    appliedCriteria: inputs.criteria.map((criterion) => ({ name: criterion.name, reason: '사용자가 직접 추가한 판단 기준입니다.', source: '사용자 지정' as const, importance: criterion.importance === 'high' ? '매우 중요' : '보통' })),
    optionsComparison: optionResults,
    finalRecommendation: {
      summary: comparisonRequested ? '이 결과는 선택을 대신 권하지 않습니다. 확인된 조건을 기준으로 사용자가 직접 판단하세요.' : '선택지 비교를 요청하지 않아 추천하지 않습니다.',
      reason: '사용자가 제공하거나 확인한 정보만 사용하며, 미확인 조건은 결론의 근거로 삼지 않습니다.',
      biggestRisk: '정보가 부족한 상태에서 한 선택지를 성급히 확정하는 것입니다.',
      conditionsForChange: '선택지별 조건과 사용자의 우선 기준을 확인하면 판단 근거가 달라질 수 있습니다.',
    },
    sevenDayPlan: makeSevenDayPlan(inputs, followUps, correction),
    analysisDuration: durationSeconds,
  };
}
