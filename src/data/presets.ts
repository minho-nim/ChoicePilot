import { DecisionInputs } from '../types';

export interface PresetScenario {
  id: string;
  badge: string;
  title: string;
  summary: string;
  data: DecisionInputs;
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'career-change',
    badge: '이직과 잔류',
    title: '성장 스타트업 이직 vs 현재 회사 잔류',
    summary: '안정적인 현재 환경과 새로운 도전 및 보상 기회 사이에서의 갈등',
    data: {
      dilemma: '5년 차 개발자로 현재 회사에서 3년째 근무 중입니다. 환경은 안정적이지만 최근 기술 스택 도입이 더뎌 성장이 정체된 느낌을 받습니다. 최근 시리즈 B 투자를 마친 스타트업에서 팀 리드 자리와 연봉 25% 인상, 스톡옵션 제안을 받았습니다. 다만 스타트업의 야근 강도와 경영 안정성이 우려됩니다.',
      goal: '3년 내 기술 리더십 역량을 기르고, 가계 소득을 높이면서도 주 2회 이상 가족과 저녁을 먹을 수 있는 일상을 유지하는 것',
      options: [
        '시리즈 B 스타트업 이직 (팀 리드, 연봉 25% 인상, 높은 책임과 불확실성)',
        '현재 회사 잔류 후 사내 신규 프로젝트 TF로 부서 이동 신청',
        '이번 제안은 정중히 거절하고 6개월간 역량을 보완해 다른 기업 지원'
      ],
      criteria: [
        { id: 'c1', name: '기술 역량 및 리더십 경험', importance: 'high' },
        { id: 'c2', name: '기본급 및 보상 수준', importance: 'high' },
        { id: 'c3', name: '퇴근 후 가족과의 시간', importance: 'high' },
        { id: 'c4', name: '회사의 재무 및 고용 안정성', importance: 'medium' }
      ],
      constraints: {
        timeframe: '오퍼 수락 여부 답변 마감까지 10일 남음',
        budget: '비상 생활비 6개월분 보유 중',
        energyOrPersonal: '어린 자녀가 있어 주 2회 이상 정시 퇴근 필요'
      }
    }
  },
  {
    id: 'side-project',
    badge: '창업과 승진',
    title: '퇴근 후 사이드 프로젝트 vs 사내 승진 준비',
    summary: '독립적인 서비스 런칭 도전과 회사 내 승진 평가 사이의 시간 배분',
    data: {
      dilemma: '직접 기획한 업무 자동화 웹 서비스를 만들어 부수입을 얻고 장기적으로 독립하고 싶습니다. 하지만 이번 분기 회사에서 승진 심사가 예정되어 있어 두 가지를 동시에 하려다 평가와 건강을 모두 놓칠까 봐 걱정입니다.',
      goal: '회사에서 안정적인 평가를 유지하면서 6개월 내 사이드 프로젝트의 시장 반응(초기 사용자 50명)을 검증하는 것',
      options: [
        '평일 밤과 주말을 활용해 2개월 안에 최소 기능 서비스(MVP) 출시',
        '이번 분기에는 회사 승진에 집중해 기본급을 올리고 프로젝트는 내년에 시작',
        '마음 맞는 동료 1명과 역할을 나누어 프로젝트 개발 부담 줄이기'
      ],
      criteria: [
        { id: 'c1', name: '시장 반응 검증 속도', importance: 'high' },
        { id: 'c2', name: '건강 유지 및 수면 시간 확보', importance: 'high' },
        { id: 'c3', name: '현재 직장에서의 인사 평가', importance: 'medium' }
      ],
      constraints: {
        timeframe: '3개월 내 방향성 결정 및 프로토타입 완성',
        budget: '서버비 등 초기 지출 월 30만원 한도',
        energyOrPersonal: '평일 퇴근 후 하루 최대 2시간, 주말 하루 5시간 가용'
      }
    }
  },
  {
    id: 'housing',
    badge: '주거와 자산',
    title: '전세 보증금 증액 재계약 vs 대출을 통한 매매',
    summary: '보증금 인상 요구 앞에서 매매로 내 집을 마련할지, 현금을 지키며 전세를 유지할지 고민',
    data: {
      dilemma: '전세 계약 만기가 다가오면서 집주인이 보증금 3,000만원 증액을 요구했습니다. 정부 정책대출을 활용해 출퇴근 가능한 아파트를 매매할지, 아니면 무리하지 않고 전세 보증금을 올려준 뒤 시장을 더 지켜볼지 고민입니다.',
      goal: '5년 동안 잦은 이사 없이 안정적으로 거주하면서 가계 월 지출에 무리가 가지 않는 선에서 자산을 지키는 것',
      options: [
        '보증금 3,000만원 증액 후 2년 전세 재계약',
        '정책 모기지 대출을 활용해 출퇴근 45분 거리 구축 아파트 매매',
        '반전세로 전환해 목돈을 일부 회수하고 안전 자산에 예치'
      ],
      criteria: [
        { id: 'c1', name: '주거 안정성 (이사 걱정 없는 거주 기간)', importance: 'high' },
        { id: 'c2', name: '매월 원리금 상환액 등 고정 지출 부담', importance: 'high' },
        { id: 'c3', name: '갑작스러운 위기 시 비상 현금 유동성', importance: 'medium' }
      ],
      constraints: {
        timeframe: '만기 40일 전까지 집주인에게 재계약 여부 확정 통보 필요',
        budget: '자기자본 2억 2천만원, 월 대출 상환액 최대 120만원 상한',
        energyOrPersonal: '출퇴근 편도 50분을 넘기면 체력 부담이 큼'
      }
    }
  }
];
