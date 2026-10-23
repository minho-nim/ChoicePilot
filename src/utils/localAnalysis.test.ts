import assert from 'node:assert/strict';
import test from 'node:test';
import { performance } from 'node:perf_hooks';
import { DecisionInputs, FollowUpQnA } from '../types';
import { buildLocalAnalysis, buildLocalUnderstanding } from './localAnalysis';
import { resolveReflection, UNKNOWN } from './reflectionContext';

const makeInputs = (values: Partial<DecisionInputs> = {}): DecisionInputs => ({
  dilemma: '', goal: '', options: ['', ''], criteria: [],
  constraints: { timeframe: '', budget: '', energyOrPersonal: '' }, ...values,
});
const confirmed = { status: 'mostly_correct' as const };
const direct = makeInputs({ dilemma: '이직 제안을 받았어요. 실패할까 봐 무섭고 지금도 지쳐 있어요.', feelings: '두렵고 지쳤어요', primaryConcern: '실패 후 후회', desiredChange: '건강하게 일하기' });
const facts = makeInputs({ dilemma: '현재 회사에서 5년 근무했습니다. 연봉은 6천이고 출퇴근은 1시간입니다. 새 제안은 연봉 7천입니다.', options: ['현 직장에 남기', '이직하기'] });
const clear = makeInputs({ dilemma: '영어를 공부하고 싶어요. 시험에 떨어질까 걱정돼요. 하루 5분부터 시작할 수 있어요.' });

test('직접 적은 감정을 우선하고 충분한 입력에는 질문하지 않는다', () => {
  const understanding = buildLocalUnderstanding(direct);
  assert.equal(understanding.emotionalCues, direct.feelings);
  assert.equal(understanding.needsFollowUp, false);
  const result = buildLocalAnalysis(direct, confirmed, [], false, 0);
  assert.equal(result.emotionAnalysis.emotionalCues, direct.feelings);
  assert.equal(result.optionsComparison.length, 0);
});

test('사실 위주 입력에는 필요한 질문을 하나씩 정하고 답변을 결과에 반영한다', () => {
  const first = buildLocalUnderstanding(facts);
  assert.equal(first.followUpField, 'primaryConcern');
  assert.equal(first.emotionalCues, UNKNOWN);
  const answers: FollowUpQnA[] = [{ field: first.followUpField, question: first.followUpQuestion!, answer: '야근으로 건강을 해치는 것' }];
  const second = buildLocalUnderstanding(facts, answers);
  assert.equal(second.followUpField, 'desiredChange');
  answers.push({ field: second.followUpField, question: second.followUpQuestion!, answer: '정해진 시간에 퇴근하기' });
  assert.equal(buildLocalUnderstanding(facts, answers).needsFollowUp, false);
  const result = buildLocalAnalysis(facts, confirmed, answers, false, 0);
  assert.equal(result.emotionAnalysis.primaryConcerns, answers[0].answer);
  assert.equal(result.emotionAnalysis.desiredChange, answers[1].answer);
});

test('본문에 적힌 감정·걱정·목표는 별도 입력란이 없어도 다시 묻지 않는다', () => {
  const understanding = buildLocalUnderstanding(clear);
  assert.equal(understanding.needsFollowUp, false);
  assert.match(understanding.desiredOutcome, /공부하고 싶어요/);
  assert.match(understanding.emotionalEvidence!, /글의 표현/);
  const result = buildLocalAnalysis(clear, confirmed, [], false, 0);
  assert.match(result.sevenDayPlan[0].task, /학습 자료/);
  assert.match(result.sevenDayPlan[0].estimatedMinutes, /5분/);
  assert.equal(new Set(result.sevenDayPlan.map((day) => day.task)).size, 7);
  assert.equal(new Set(result.sevenDayPlan.map((day) => day.completionCriteria)).size, 7);
});

test('모르겠다는 답변을 정보로 간주하지 않고 최대 세 질문 뒤 멈춘다', () => {
  const inputs = makeInputs({ dilemma: '어떻게 해야 할지 고민입니다.' });
  const answers: FollowUpQnA[] = [];
  for (let index = 0; index < 3; index++) {
    const next = buildLocalUnderstanding(inputs, answers);
    assert.equal(next.needsFollowUp, true);
    assert.ok(!answers.some((answer) => answer.field === next.followUpField));
    answers.push({ field: next.followUpField, question: next.followUpQuestion!, answer: '', skipped: true });
  }
  assert.equal(buildLocalUnderstanding(inputs, answers).needsFollowUp, false);
  const result = buildLocalAnalysis(inputs, { status: 'unsure' }, answers, false, 0);
  assert.equal(result.emotionAnalysis.primaryConcerns, UNKNOWN);
  assert.equal(result.emotionAnalysis.desiredChange, UNKNOWN);
  assert.equal(result.factDistinction.userConfirmedFacts.length, 0);
  assert.ok(result.limitations?.some((item) => item.includes('미확인')));
});

test('기존 goal이 있으면 바라는 변화를 중복 질문하지 않는다', () => {
  const inputs = makeInputs({ dilemma: '진학을 고민합니다.', goal: '전문성을 높이기', primaryConcern: '학비 부담' });
  assert.equal(buildLocalUnderstanding(inputs).needsFollowUp, false);
});

test('후속 답변 하나에 걱정과 목표를 함께 적으면 목표를 다시 묻지 않는다', () => {
  const first = buildLocalUnderstanding(facts);
  const answers: FollowUpQnA[] = [{ field: first.followUpField, question: first.followUpQuestion!, answer: '야근이 걱정돼요. 가족과 저녁을 먹고 싶어요.' }];
  const next = buildLocalUnderstanding(facts, answers);
  assert.equal(next.needsFollowUp, false);
  assert.match(next.desiredOutcome, /가족과 저녁/);
});

test('일부 수정은 감정·걱정·목표·요약·계획·확인 내용 전체에 반영된다', () => {
  const result = buildLocalAnalysis(direct, { status: 'partially_different', correctedInputs: {
    dilemma: '배우자와 대화가 어렵습니다.', goal: '', feelings: '답답해요', primaryConcern: '서로 오해하는 것', desiredChange: '차분히 대화하고 싶어요',
  } }, [], false, 0);
  assert.equal(result.emotionAnalysis.emotionalCues, '답답해요');
  assert.equal(result.emotionAnalysis.primaryConcerns, '서로 오해하는 것');
  assert.match(result.sevenDayPlan[0].task, /대화하고 싶어요/);
  assert.doesNotMatch(result.sevenDayPlan[0].task, /학습 자료/);
  assert.doesNotMatch(JSON.stringify(result), /실패 후 후회|건강하게 일하기|두렵고 지쳤어요/);
  assert.ok(result.factDistinction.userConfirmedFacts.includes('서로 오해하는 것'));
});

test('상황 원문을 유지하고 해석만 고쳐도 옛 걱정을 현재 요약으로 재사용하지 않는다', () => {
  const inputs = makeInputs({ dilemma: '이직하고 싶지만 돈을 잃을까 걱정돼요.', primaryConcern: '돈을 잃는 것', desiredChange: '성장하기' });
  const result = buildLocalAnalysis(inputs, { status: 'partially_different', correctedInputs: { dilemma: inputs.dilemma, goal: '', feelings: '', primaryConcern: '가족과 보낼 시간이 줄어드는 것', desiredChange: '가족과 시간 지키기' } }, [], false, 0);
  assert.doesNotMatch(result.problemAnalysis.coreDilemma, /돈을 잃/);
  assert.doesNotMatch(result.factDistinction.userReported!.join(' '), /돈을 잃/);
  assert.match(result.sevenDayPlan[1].task, /가족과 보낼 시간/);
  assert.equal(result.emotionAnalysis.emotionalCues, UNKNOWN);
  assert.equal(result.emotionAnalysis.innerConflict, UNKNOWN);
});

test('이전 형식의 자유 수정도 과거 해석과 섞이지 않는다', () => {
  const result = buildLocalAnalysis(direct, { status: 'partially_different', userCorrection: '영어를 공부하고 싶어요. 시험 비용이 부담돼요.' }, [], false, 0);
  assert.match(result.problemAnalysis.coreDilemma, /영어/);
  assert.doesNotMatch(JSON.stringify(result), /실패 후 후회|건강하게 일하기|두렵고 지쳤어요/);
});

test('수정 후 맞아요 또는 모르겠어요로 바꾸어도 수정한 내용은 유지된다', () => {
  const correctedInputs = { dilemma: '배우자와 대화하고 싶어요.', goal: '', feelings: '답답해요', primaryConcern: '시간이 맞지 않는 것', desiredChange: '함께 대화할 시간 정하기' };
  for (const status of ['mostly_correct', 'unsure'] as const) {
    const result = buildLocalAnalysis(direct, { status, correctedInputs }, [], false, 0);
    assert.match(result.problemAnalysis.coreDilemma, /배우자/);
    assert.equal(result.emotionAnalysis.primaryConcerns, correctedInputs.primaryConcern);
    assert.doesNotMatch(JSON.stringify(result), /실패 후 후회|건강하게 일하기/);
    if (status === 'unsure') assert.deepEqual(result.factDistinction.userConfirmedFacts, []);
  }
});

test('사용자의 예측이나 확인 버튼을 외부 검증된 사실로 바꾸지 않는다', () => {
  const inputs = makeInputs({ dilemma: '이직하면 무조건 실패할 거예요.' });
  const result = buildLocalAnalysis(inputs, confirmed, [], false, 0);
  assert.deepEqual(result.factDistinction.verifiedFacts, []);
  assert.ok(result.factDistinction.userReported?.includes(inputs.dilemma));
  const unsure = buildLocalAnalysis(direct, { status: 'unsure' }, [], false, 0);
  assert.deepEqual(unsure.factDistinction.userConfirmedFacts, []);
  assert.ok(unsure.limitations?.some((item) => item.includes('확정하지')));
});

test('다른 사람의 감정과 막연한 걱정을 사용자의 핵심 걱정으로 단정하지 않는다', () => {
  const context = resolveReflection(makeInputs({ dilemma: '동료가 불안하다고 해요. 저는 자격증을 준비하고 싶어요.' }));
  assert.equal(context.feelings, UNKNOWN);
  assert.equal(context.concern, UNKNOWN);
  assert.equal(buildLocalUnderstanding(makeInputs({ dilemma: '요즘 걱정돼요. 공부하고 싶어요.' })).followUpField, 'primaryConcern');
});

test('선택지 조건은 요청했을 때만 제공하며 빈 선택지의 메모가 섞이지 않는다', () => {
  const inputs = makeInputs({ ...direct, options: ['', '이직', '잔류'], optionNotes: ['사용하지 않는 메모', '연봉 7천, 공고에 기재', '연봉 6천'], criteria: [{ id: 'time', name: '가족과 시간', importance: 'high' }] });
  assert.equal(buildLocalAnalysis(inputs, confirmed, [], false, 0).optionsComparison.length, 0);
  const result = buildLocalAnalysis(inputs, confirmed, [], true, 0);
  assert.equal(result.optionsComparison.length, 2);
  assert.equal(result.optionsComparison[0].summary, '연봉 7천, 공고에 기재');
  assert.equal(result.optionsComparison[0].pros.length, 0);
  assert.equal(result.optionsComparison[0].criteriaFit[0].rating, '추가 확인 필요');
});

test('기한이 짧으면 7일차까지 결정을 미루게 하지 않고 일상 표현을 기한으로 오해하지 않는다', () => {
  const urgent = makeInputs({ ...direct, constraints: { timeframe: '3일 이내 회신', budget: '', energyOrPersonal: '하루 5분' } });
  const result = buildLocalAnalysis(urgent, confirmed, [], false, 0);
  assert.match(result.sevenDayPlan[2].dayTitle, /기한/);
  assert.match(result.sevenDayPlan[3].dayTitle, /응답 이후/);
  assert.equal(result.sevenDayPlan.length, 7);
  const ordinary = buildLocalAnalysis(makeInputs({ dilemma: '오늘 영어를 공부하고 싶어요. 시험 비용이 부담돼요.' }), confirmed, [], false, 0);
  assert.match(ordinary.sevenDayPlan[0].dayTitle, /작게 시작/);
});

for (const [name, inputs] of [['감정 직접 표현', direct], ['사실 위주', facts], ['본문에 목표 명시', clear]] as const) {
  const start = performance.now();
  buildLocalUnderstanding(inputs);
  buildLocalAnalysis(inputs, confirmed, [], false, 0);
  console.log(`${name}: 로컬 정리 ${(performance.now() - start).toFixed(3)}ms (UI·읽는 시간 제외)`);
}
