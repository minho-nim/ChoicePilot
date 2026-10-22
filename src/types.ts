export interface DecisionCriterion {
  id: string;
  name: string;
  importance: 'high' | 'medium';
}

export interface DecisionInputs {
  dilemma: string;
  goal: string;
  feelings?: string;
  primaryConcern?: string;
  desiredChange?: string;
  options: string[];
  criteria: DecisionCriterion[];
  constraints: {
    timeframe: string;
    budget: string;
    energyOrPersonal: string;
  };
}

export interface UnderstandingResult {
  summary: string; // 고민 요약 (2~3문장)
  emotionalCues: string; // 감정 단서와 근거 ("~로 보입니다")
  primaryConcerns: string; // 피하고 싶어 하는 핵심 우려/부담
  desiredOutcome: string; // 바라는 변화나 결과
  innerConflict: string; // 서로 충돌하는 욕구와 가치
  unverifiedInterpretations: string; // 확인이 필요한 해석
  confirmationPrompt: string; // 사용자 확인 질문 (예: "제가 이해한 핵심은 ... 이 해석이 맞나요?")
  needsFollowUp: boolean; // 추가 확인 질문 필요 여부
  followUpQuestion?: string; // 핵심 후속 질문 1개
  followUpReason?: string; // 질문 이유
}

export interface FollowUpQnA {
  question: string;
  answer: string;
}

export interface UserConfirmation {
  status: 'mostly_correct' | 'partially_different' | 'unsure';
  userCorrection?: string;
}

export interface CriteriaFitItem {
  criterion: string;
  weight: string; // '매우 중요' | '보통'
  rating: '유리함' | '불리함' | '추가 확인 필요';
  basis: string; // 구체적 산정 근거
}

export interface OptionAnalysis {
  id: string;
  name: string;
  summary: string;
  scoreDisplay: string; // 이전 결과 호환 필드. 수치 점수는 사용하지 않음
  scoreMeaning: string; // 이전 결과 호환 필드
  scoreReasoning: string; // 비교 근거와 미확인 정보
  pros: string[];
  cons: string[];
  mainRisk: string; // 주요 위험
  criteriaFit: CriteriaFitItem[];
  suitableCondition: string; // 이 선택이 유리한 조건
  cautionCondition: string; // 신중해야 할 조건
}

export interface DayPlan {
  day: number;
  dayTitle: string; // 예: "1일차: 핵심 조건 점검"
  task: string; // 하루 1개의 핵심 행동 (10~20분 내 시작 가능, 판단 근거 확보 우선)
  estimatedMinutes: string; // 예: "15분"
  completionCriteria: string; // 확인 가능한 행동이나 산출물
}

export interface EmotionAnalysisModule {
  summary: string; // 사용자가 설명한 상황 2~3문장 정리
  emotionalCues: string; // 텍스트에서 드러나는 감정과 해석 근거 (단정하지 않는 어조)
  primaryConcerns: string; // 피하고 싶어 하는 결과나 부담
  desiredChange: string; // 얻고 싶어 하는 결과나 변화
  innerConflict: string; // 서로 충돌하는 욕구/가치 (없으면 '뚜렷한 내적 갈등 없음')
  unverifiedInterpretations: string; // AI가 추론했으나 아직 확실하지 않은 내용
  directlyExpressed: string; // 사용자가 직접 표현한 사실/감정
  inferredContext: string; // AI의 조심스러운 맥락적 추론
  questionsToAsk: string[]; // 스스로 점검해볼 질문 1~2개
}

export interface FactDistinction {
  verifiedFacts: string[]; // 사용자가 직접 말한 사실
  userConfirmedFacts: string[]; // 사용자 확인/수정을 거친 내용
  aiInferences: string[]; // AI의 해석 및 분석용 전제
  unverifiedItems: string[]; // 아직 확인되지 않은 정보
}

export interface CoreConflictAnalysis {
  conflictDescription: string; // 선택을 어렵게 만드는 핵심 갈등
  competingValues: string; // 서로 충돌하는 가치 (예: 현재의 안정성 vs 미래의 성장)
  reflectionPoint: string; // 스스로 판단을 돕는 핵심 성찰 질문
}

export interface AppliedCriterion {
  name: string;
  reason: string;
  source: '사용자 지정' | '기본 기준 추가';
  importance?: string;
}

export interface AnalysisResult {
  problemAnalysis: {
    coreDilemma: string; // 가장 핵심이 되는 고민
    background: string; // 고민이 생긴 배경과 이유
    tradeoff: string; // 선택에 따른 주요 절충점
  };
  emotionAnalysis: EmotionAnalysisModule;
  factDistinction: FactDistinction;
  coreConflict: CoreConflictAnalysis;
  appliedCriteria: AppliedCriterion[];
  optionsComparison: OptionAnalysis[];
  finalRecommendation: {
    summary: string; // 우선 추천과 핵심 근거 (보조적 안내)
    reason: string; // 추천 이유
    biggestRisk: string; // 가장 큰 위험
    conditionsForChange: string; // 추천을 바꿀 수 있는 핵심 조건
  };
  sevenDayPlan: DayPlan[];
  analysisDuration?: number; // 소요 시간 (초)
  factualVsAssumptions?: {
    verifiedFacts: string[];
    assumptions: string[];
    needsVerification: string[];
  };
}
