import { strict as assert } from 'node:assert';
import { buildLocalAnalysis, buildLocalUnderstanding } from './localAnalysis';

const defaults = {
  goal: '',
  options: ['', ''],
  criteria: [],
  constraints: { timeframe: '', budget: '', energyOrPersonal: '' },
};

// 1. Directly expressed emotions are kept verbatim and do not trigger extra questions.
const emotionalCase = {
  ...defaults,
  dilemma: '이직 제안을 받았어요. 실패할까 봐 무섭고 지금도 지쳐 있어요.',
  feelings: '두렵고 지쳤어요',
  primaryConcern: '실패 후 후회',
  desiredChange: '건강하게 일하기',
};
const emotionalUnderstanding = buildLocalUnderstanding(emotionalCase);
assert.equal(emotionalUnderstanding.emotionalCues, emotionalCase.feelings);
assert.equal(emotionalUnderstanding.needsFollowUp, false);
const emotionalResult = buildLocalAnalysis(emotionalCase, { status: 'mostly_correct' }, [], false, 0);
assert.equal(emotionalResult.emotionAnalysis.emotionalCues, emotionalCase.feelings);
assert.equal(emotionalResult.optionsComparison.length, 0);

// 2. Many facts with no explicit emotion or desired outcome prompts only for the main concern.
const factHeavyCase = {
  ...defaults,
  dilemma: '현재 회사에서 5년 근무했습니다. 연봉은 6천이고 출퇴근은 1시간입니다. 새 제안은 연봉 7천입니다.',
  options: ['현 직장에 남기', '이직하기'],
};
const factUnderstanding = buildLocalUnderstanding(factHeavyCase);
assert.equal(factUnderstanding.needsFollowUp, true);
assert.match(factUnderstanding.followUpQuestion || '', /피하고 싶은 결과/);
assert.equal(factUnderstanding.emotionalCues, '감정은 직접 입력되지 않아 아직 확인되지 않았습니다.');

// 3. Clear feelings, concern, and goal skip questions; comparison remains optional and unscored.
const clearCase = {
  ...defaults,
  dilemma: '대학원 진학을 고민 중입니다.',
  feelings: '기대되지만 걱정돼요',
  primaryConcern: '학비 부담',
  desiredChange: '전문성을 높이고 싶어요',
  goal: '재직 중 학업을 지속하고 싶어요',
  options: ['진학', '취업'],
};
assert.equal(buildLocalUnderstanding(clearCase).needsFollowUp, false);
const clearResult = buildLocalAnalysis(clearCase, { status: 'mostly_correct' }, [], true, 0);
assert.equal(clearResult.optionsComparison.length, 2);
assert.equal(clearResult.sevenDayPlan.length, 7);
assert.equal(clearResult.optionsComparison[0].scoreDisplay.includes('점'), false);
assert.equal(buildLocalAnalysis(clearCase, { status: 'mostly_correct' }, [], false, 0).optionsComparison.length, 0);

console.log('Local analysis scenarios passed: direct emotions, unclear goals, clear inputs.');
