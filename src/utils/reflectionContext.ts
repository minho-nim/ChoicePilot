import { DecisionInputs, FollowUpQnA, ReflectionField, UserConfirmation } from '../types';

export const UNKNOWN = '아직 확인되지 않음';
export const MAX_FOLLOW_UPS = 3;
const uncertainAnswer = /^(?:아직\s*)?(?:잘\s*)?모르겠|^아직\s*(?:잘\s*)?모르|^없(?:어요|습니다)?[.!\s]*$/;

export const sentences = (text: string) => text.split(/(?<=[.!?。])\s+|\n+/).map((part) => part.trim()).filter(Boolean);
export const shortQuote = (text: string, max = 260) => text.length > max ? `${text.slice(0, max)}…` : text;

export function answerField(answer: FollowUpQnA): ReflectionField | undefined {
  return answer.field || (/피하고|부담|어렵게/.test(answer.question) ? 'primaryConcern'
    : /바뀌|바라|원하/.test(answer.question) ? 'desiredChange'
    : /감정|마음/.test(answer.question) ? 'feelings' : undefined);
}

export function effectiveInputs(inputs: DecisionInputs, answers: FollowUpQnA[], confirmation?: UserConfirmation): DecisionInputs {
  if (confirmation?.correctedInputs) return { ...inputs, ...confirmation.correctedInputs };
  if (confirmation?.status === 'partially_different') {
    if (confirmation.userCorrection?.trim()) {
      // A legacy free-text correction replaces the old interpretation instead of mixing both versions.
      return { ...inputs, dilemma: confirmation.userCorrection.trim(), goal: '', feelings: '', primaryConcern: '', desiredChange: '' };
    }
  }
  const effective = { ...inputs };
  for (const answer of answers) {
    const field = answerField(answer);
    if (field && !answer.skipped && answer.answer.trim() && !uncertainAnswer.test(answer.answer.trim())) {
      effective[field] = answer.answer.trim();
    }
  }
  return effective;
}

export function resolveReflection(inputs: DecisionInputs, answers: FollowUpQnA[] = [], confirmation?: UserConfirmation) {
  const effective = effectiveInputs(inputs, answers, confirmation);
  const parts = sentences(effective.dilemma);
  const sources = [effective.dilemma, effective.feelings || '', effective.primaryConcern || '', effective.desiredChange || '', effective.goal];
  const clauses = sources.flatMap(sentences).flatMap((part) => part.split(/[,，]|하지만\s*|그런데\s*|반면에?\s*/)).map((part) => part.trim()).filter(Boolean);
  const someoneElse = (part: string) => /(?:(?:친구|동료|상사|가족|배우자)(?:가|는|이|도)|그는|그녀는|그 사람이).{0,30}/.test(part) && !/저는|제가|나는|내가/.test(part);
  const findQuote = (pattern: RegExp) => clauses.find((part) => pattern.test(part) && !someoneElse(part)) || '';
  const emotionQuote = findQuote(/불안|걱정되|망설|두렵|무섭|지쳤|지쳐|설레|기대되|답답|속상|서운|긴장|기쁘|슬프|걱정돼/);
  // Do not attribute someone else's stated emotions to the person writing.
  const corrected = confirmation?.correctedInputs;
  const hasCorrection = (field: string) => Boolean(corrected && Object.hasOwn(corrected, field));
  const feelings = effective.feelings?.trim() || (!hasCorrection('feelings') ? emotionQuote : '') || UNKNOWN;
  const worryQuote = findQuote(/걱정|부담|우려|피하고|후회|놓칠까|실패할까|잃을까/);
  const bareWorry = /^(?:(?:요즘|그냥|조금|너무|정말|계속|많이|저는|나는)\s*)*(?:걱정|부담|우려|후회)(?:돼|되|스러|가|이|요|해|워|어|습니다|어요|됩니다|돼요|니다|져|지|않|없|만|좀|고|서|하|네|\s|[.!?])*$/;
  const concern = effective.primaryConcern?.trim() || (!hasCorrection('primaryConcern') && !bareWorry.test(worryQuote) ? worryQuote : '') || UNKNOWN;
  const desired = effective.desiredChange?.trim() || effective.goal.trim() || (!hasCorrection('desiredChange') && !hasCorrection('goal') ? findQuote(/싶|원하는|원해|원합니다|바라는|바라요|목표|좋겠/) : '') || UNKNOWN;
  const conflictQuote = parts.find((part) => /하지만|반면|싶지만|한편|사이에서/.test(part));
  return {
    inputs: effective,
    summary: corrected && effective.dilemma === inputs.dilemma
      ? shortQuote([concern !== UNKNOWN ? `가장 부담스러운 점: ${concern}` : '', desired !== UNKNOWN ? `바라는 변화: ${desired}` : ''].filter(Boolean).join(' / ') || effective.dilemma, 440)
      : shortQuote(parts.slice(0, 3).join(' '), 440),
    feelings, concern, desired,
    innerConflict: conflictQuote && !(corrected && effective.dilemma === inputs.dilemma) ? shortQuote(conflictQuote) : UNKNOWN,
    emotionalEvidence: effective.feelings?.trim() ? '사용자가 감정 항목에 직접 적은 표현입니다.'
      : feelings !== UNKNOWN ? `글의 표현을 그대로 옮겼습니다: “${shortQuote(emotionQuote)}”. 본인의 마음과 다른 부분은 수정할 수 있습니다.`
      : '본인의 감정이라고 확인할 수 있는 표현이 충분하지 않습니다.',
  };
}

export function nextFollowUp(inputs: DecisionInputs, answers: FollowUpQnA[] = []) {
  if (answers.length >= MAX_FOLLOW_UPS) return null;
  const context = resolveReflection(inputs, answers);
  if (context.concern !== UNKNOWN && context.desired !== UNKNOWN) return null;
  const asked = new Set(answers.map(answerField));
  if (context.concern === UNKNOWN && !asked.has('primaryConcern')) return {
    field: 'primaryConcern' as const,
    question: inputs.options.filter((option) => option.trim()).length >= 2
      ? '지금 선택을 가장 어렵게 만드는 한 가지는 무엇인가요?'
      : '이 상황에서 가장 부담스러운 한 가지는 무엇인가요?',
    reason: '글에서 핵심 걱정을 충분히 확인하지 못했습니다.',
  };
  if (context.desired === UNKNOWN && !asked.has('desiredChange')) return {
    field: 'desiredChange' as const, question: '어떤 상황으로 바뀌면 좋겠나요?',
    reason: '원하는 방향을 확인하면 다음 행동을 더 구체적으로 정할 수 있습니다.',
  };
  if (context.feelings === UNKNOWN && !asked.has('feelings')) return {
    field: 'feelings' as const, question: '이 고민을 생각하면 어떤 마음이 드나요?',
    reason: '마음을 임의로 추측하지 않고 직접 표현할 기회를 드립니다.',
  };
  return null;
}
