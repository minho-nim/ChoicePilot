import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isDev = process.env.NODE_ENV !== 'production';

app.use(express.json({ limit: '2mb' }));

// Shared Gemini client setup
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Robust JSON repair helper for truncated responses
function repairTruncatedJson(str: string): any {
  let inString = false;
  let isEscaped = false;
  const stack: ('{' | '[')[] = [];

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (ch === '\\') {
        isEscaped = true;
      } else if (ch === '"') {
        inString = false;
      }
    } else {
      if (ch === '"') {
        inString = true;
      } else if (ch === '{' || ch === '[') {
        stack.push(ch);
      } else if (ch === '}') {
        if (stack[stack.length - 1] === '{') stack.pop();
      } else if (ch === ']') {
        if (stack[stack.length - 1] === '[') stack.pop();
      }
    }
  }

  let repaired = str;
  // If response ended while inside an unclosed string
  if (inString) {
    if (repaired.endsWith('\\')) repaired = repaired.slice(0, -1);
    repaired += '"';
  }

  // Remove trailing dangling commas or incomplete keys/values
  repaired = repaired.replace(/,\s*$/g, '');
  repaired = repaired.replace(/,\s*"[^"]*"\s*$/g, '');
  repaired = repaired.replace(/:\s*$/g, ': null');
  repaired = repaired.replace(/\{\s*"[^"]*"\s*$/g, '{');

  // Close remaining open brackets and braces in LIFO order
  while (stack.length > 0) {
    const open = stack.pop();
    if (open === '{') repaired += '}';
    else if (open === '[') repaired += ']';
  }

  return JSON.parse(repaired);
}

// Resilient JSON Parser with diagnostic logging and truncation repair
function safeParseAndRepairJson(rawText: string | undefined | null, endpointName: string): any {
  if (!rawText || rawText.trim().length === 0) {
    throw new Error(`[${endpointName}] AI 모델 응답이 비어 있습니다. (길이: 0)`);
  }

  let cleaned = rawText.trim();

  // 1. Remove markdown fences like ```json ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // 2. Extract substring between outermost braces if there is extraneous text
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  } else if (firstBrace !== -1 && lastBrace === -1) {
    cleaned = cleaned.slice(firstBrace);
  }

  // 3. Try standard JSON.parse first
  try {
    return JSON.parse(cleaned);
  } catch (initialErr: any) {
    // 4. If initial parse fails, attempt truncation repair
    try {
      const repairedObj = repairTruncatedJson(cleaned);
      console.warn(`[${endpointName}] Truncated JSON successfully repaired! Original len: ${rawText.length}`);
      return repairedObj;
    } catch (repairErr: any) {
      // 5. Diagnostic reporting: find error position, extract context snippet
      const posMatch = initialErr.message.match(/position\s+(\d+)/i);
      const pos = posMatch ? parseInt(posMatch[1], 10) : -1;

      let snippet = '';
      if (pos >= 0 && pos < cleaned.length) {
        const start = Math.max(0, pos - 30);
        const end = Math.min(cleaned.length, pos + 30);
        snippet = cleaned.slice(start, end).replace(/[\r\n]+/g, ' ');
      } else {
        snippet = cleaned.slice(0, 80).replace(/[\r\n]+/g, ' ');
      }

      // Sanitize: do not log keys, emails or secrets
      const safeSnippet = snippet.replace(/[a-zA-Z0-9_\-\.]{25,}/g, '[REDACTED]');

      console.error(
        `[${endpointName} JSON Parse Failure] Error: ${initialErr.message} at pos ${pos}. Context snippet: "...${safeSnippet}..." (Total len: ${rawText.length})`
      );

      throw new Error(
        `AI 응답의 JSON 형식이 올바르지 않습니다 (${initialErr.message}). 다시 시도해주세요.`
      );
    }
  }
}

// Resilient API Caller with automatic 1-time retry for transient 503/429 spikes
async function callGeminiWithRetry(params: {
  model: string;
  contents: string;
  config: any;
  timeoutMs?: number;
}) {
  const ai = getGeminiClient();
  const timeoutMs = params.timeoutMs || 42000;

  const runCall = () =>
    ai.models.generateContent({
      model: params.model,
      contents: params.contents,
      config: params.config,
    });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () =>
        reject(
          new Error('AI 분석 처리 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.')
        ),
      timeoutMs
    );
  });

  try {
    return await Promise.race([runCall(), timeoutPromise]);
  } catch (err: any) {
    const isTransient =
      err.message?.includes('503') ||
      err.message?.includes('high demand') ||
      err.message?.includes('UNAVAILABLE') ||
      err.message?.includes('429');

    if (isTransient) {
      console.warn('[AI Call] Transient error received, retrying once after 1.5s...', err.message);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return await Promise.race([runCall(), timeoutPromise]);
    }
    throw err;
  }
}

// POST /api/understand - 1단계 감정 및 핵심 고민 이해 (적응형 질문 & 확인 생성)
app.post('/api/understand', async (req, res) => {
  const startTime = Date.now();
  console.log(`[AI Understand] Request received at ${new Date().toISOString()}`);

  try {
    const { dilemma, goal, options, criteria, constraints } = req.body;

    if (!dilemma || typeof dilemma !== 'string' || dilemma.trim().length === 0) {
      return res.status(400).json({ error: '고민 내용을 입력해주세요.' });
    }

    const formattedOptions = Array.isArray(options) && options.length > 0
      ? options.filter((o) => o && o.trim().length > 0).join(', ')
      : '명시된 대안 없음';

    const formattedCriteria = Array.isArray(criteria) && criteria.length > 0
      ? criteria.map((c: any) => c.name).join(', ')
      : '명시된 기준 없음';

    const prompt = `당신은 질문자의 감정과 핵심 고민을 이해하고 정리하여, 사용자가 스스로 판단할 수 있도록 돕는 실용적 의사결정 카운슬러입니다.
사용자가 입력한 내용을 분석하여 첫 단계로 공감적 이해와 핵심 요약, 그리고 필요한 경우에만 1개의 후속 질문을 도출하세요.

[사용자 입력]
- 고민 내용: ${dilemma}
- 달성 목표: ${goal || '명시되지 않음'}
- 고려 중인 대안: ${formattedOptions}
- 중시하는 기준: ${formattedCriteria}
- 제약 조건: ${constraints ? `${constraints.timeframe || ''} ${constraints.budget || ''} ${constraints.energyOrPersonal || ''}`.trim() : '없음'}

[핵심 분석 원칙]
1. 단정 금지: 감정을 확정적 사실처럼 단정('~한 상태입니다')하지 마세요. 대신 '입력 내용에서는 ~가 드러나는 것으로 보입니다. 맞나요?'처럼 표현하세요.
2. 점수화 금지: 감정의 강도를 임의로 수치화하거나 심리 진단을 하지 마세요.
3. 근거 없는 항목은 억지로 채우지 말고 '아직 확인되지 않음'으로 표기하세요.
4. 사용자 확인 질문(confirmationPrompt): "제가 이해한 핵심은 [요약]입니다. 이 해석이 맞나요?" 형식으로 1문장 작성하세요.
5. 적응형 후속 질문(followUpQuestion):
   - 사용자가 제공한 정보만으로 이미 감정과 목표, 대안이 충분히 명확하다면 needsFollowUp=false로 두고 질문을 생략하세요.
   - 감정 해석이 불확실하거나, 가장 걱정하는 결과(핵심 우려)나 바라는 결과가 불명확한 경우에만 가장 중요한 핵심 질문 딱 1개만 제시하세요.
   - 질문은 짧고 자연스러운 한국어로 단 1개의 질문만 작성하세요.`;

    const response = await callGeminiWithRetry({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        temperature: 0.1,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: '사용자가 설명한 상황 요약 (2~3문장)' },
            emotionalCues: { type: Type.STRING, description: '텍스트에서 드러난 감정 단서와 근거 (단정하지 않는 어조)' },
            primaryConcerns: { type: Type.STRING, description: '피하고 싶어 하는 핵심 우려나 부담' },
            desiredOutcome: { type: Type.STRING, description: '바라는 변화나 결과' },
            innerConflict: { type: Type.STRING, description: '서로 충돌하는 욕구와 가치 (없으면 뚜렷한 내적 갈등 없음)' },
            unverifiedInterpretations: { type: Type.STRING, description: '확인이 필요한 해석 (AI 추론 내용)' },
            confirmationPrompt: { type: Type.STRING, description: '사용자 확인용 질문 (제가 이해한 핵심은 ~입니다. 이 해석이 맞나요?)' },
            needsFollowUp: { type: Type.BOOLEAN, description: '추가 확인 질문이 꼭 필요한지 여부' },
            followUpQuestion: { type: Type.STRING, description: '핵심 후속 질문 1개 (필요한 경우에만)' },
            followUpReason: { type: Type.STRING, description: '이 질문이 필요한 이유' },
          },
          required: [
            'summary',
            'emotionalCues',
            'primaryConcerns',
            'desiredOutcome',
            'innerConflict',
            'unverifiedInterpretations',
            'confirmationPrompt',
            'needsFollowUp',
          ],
        },
      },
    });

    const parsedData = safeParseAndRepairJson(response.text, 'Understand');
    const duration = Date.now() - startTime;
    console.log(`[AI Understand] Completed in ${duration}ms`);

    return res.json(parsedData);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[AI Understand] Failed after ${duration}ms:`, error);
    return res.status(500).json({
      error: error.message || '고민 내용을 이해하는 중 일시적인 오류가 발생했습니다. 다시 시도해주세요.',
    });
  }
});

// POST /api/analyze - 종합 고민 정리 및 선택지 분석, 7일 실행 계획 도출
app.post('/api/analyze', async (req, res) => {
  const startTime = Date.now();
  console.log(`[AI Analyze] Request received at ${new Date().toISOString()}`);

  try {
    const { dilemma, goal, options, criteria, constraints, userConfirmation, followUpAnswers, includeOptionComparison } = req.body;

    if (!dilemma || typeof dilemma !== 'string' || !dilemma.trim()) {
      return res.status(400).json({
        error: '고민 내용을 입력해주세요.',
      });
    }

    const formattedCriteria = Array.isArray(criteria) && criteria.length > 0
      ? criteria.map((c: any) => `- ${c.name} (중요도: ${c.importance === 'high' ? '매우 중요' : '보통'})`).join('\n')
      : '사용자가 지정한 별도 기준 없음';

    const formattedConstraints = constraints
      ? `결정 기한: ${constraints.timeframe || '미정'}\n비용/예산: ${constraints.budget || '미정'}\n개인 여건/체력: ${constraints.energyOrPersonal || '미정'}`
      : '제약사항 없음';

    const formattedOptions = (Array.isArray(options) ? options as string[] : [])
      .filter((opt) => opt && opt.trim().length > 0)
      .map((opt, idx) => `선택지 ${idx + 1}: ${opt.trim()}`)
      .join('\n');

    let confirmationContext = '사용자 확인 단계: 기본 진행';
    if (userConfirmation) {
      if (userConfirmation.status === 'mostly_correct') {
        confirmationContext = '사용자 확인 결과: AI의 초기 이해가 대체로 맞다고 확인함.';
      } else if (userConfirmation.status === 'partially_different') {
        confirmationContext = `사용자 확인 및 수정 사항: "AI의 해석과 일부 다르며, 실제는 [${userConfirmation.userCorrection || '별도 입력 없음'}]임". 이 수정 내용을 최우선으로 반영하세요.`;
      } else if (userConfirmation.status === 'unsure') {
        confirmationContext = '사용자 확인 결과: 아직 본인 스스로도 확신하기 어려운 상태임. 불확실성을 충분히 열어두고 분석할 것.';
      }
    }

    let followUpContext = '추가 후속 응답 없음';
    if (Array.isArray(followUpAnswers) && followUpAnswers.length > 0) {
      followUpContext = followUpAnswers
        .map((qa: any, idx: number) => `Q${idx + 1}: ${qa.question}\nA: ${qa.answer}`)
        .join('\n');
    }

    const prompt = `당신은 질문자의 감정과 핵심 고민을 이해하고 정리하여, 사용자가 스스로 판단할 수 있도록 돕는 실용적 의사결정 파트너입니다.
대안을 일방적으로 강요하거나 점수를 매겨 결정해주는 대신, 본인의 감정과 상황, 충돌하는 가치를 명확히 마주하고 작은 행동을 통해 판단 근거를 얻을 수 있도록 정리하세요.
모든 항목은 1~2문장의 단문으로 간결하고 명확하게 작성하세요.

[사용자 입력]
- 고민 내용: ${dilemma}
- 달성 목표: ${goal || '명시된 목표 없음'}
- 검토 대안:
${formattedOptions}
- 사용자 지정 기준:
${formattedCriteria}
- 제약 조건:
${formattedConstraints}

[사용자 확인 및 추가 문답 정보]
- ${confirmationContext}
- 추가 문답 내용:
${followUpContext}

[작성 지침]
1. 고민 요약 및 감정 분석:
   - 상황 요약(2~3문장), 드러난 감정 단서와 구체적 해석 근거, 피하고 싶은 결과(핵심 걱정), 바라는 변화, 충돌하는 욕구/가치(내적 갈등)를 정리하세요.
   - 사용자가 직접 표현한 사실과 AI의 조심스러운 해석을 분리하세요. 단정적 심리 진단은 하지 마세요.

2. 사실과 감정/추정의 명확한 구분:
   - 직접 말한 사실(verifiedFacts), 사용자 확인을 거친 사실(userConfirmedFacts), AI의 분석용 전제(aiInferences), 아직 확인되지 않은 정보(unverifiedItems)로 엄격히 구분하세요.

3. 선택을 어렵게 만드는 핵심 갈등:
   - 충돌하는 가치(competingValues)와 스스로 판단해볼 수 있는 핵심 성찰 질문(reflectionPoint)을 제시하세요.

4. 선택지 비교는 사용자가 명시적으로 요청했고 선택지가 2개 이상일 때만 수행하세요 (요청: ${includeOptionComparison === true ? '예' : '아니요'}).
   - 비교를 요청하지 않았거나 선택지가 2개 미만이면 optionsComparison은 빈 배열로 반환하세요.
   - 점수로 평가하지 마세요. comparison 점수 필드에는 '수치 점수 미사용'을 적으세요.
   - 사용자가 비교를 요청한 경우에도 장단점과 확인할 조건만 정리하고 단일 선택을 강요하지 마세요. 최종 추천은 중립적으로 제시하고 불확실성을 표시하세요.

5. 7일 실행 계획:
   - 감정을 억누르거나 없애는 것이 아니라, 정보를 확인하고 우려를 구체화하며 작은 행동을 통해 "판단 근거를 확보"하는 것을 목표로 하세요.
   - 하루 1개의 구체적 행동(10~20분 소요)과 1문장 완료 기준을 간결히 작성하세요.`;

    const response = await callGeminiWithRetry({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        temperature: 0.2,
        maxOutputTokens: 4096, // Increased to 4096 to prevent token truncation at position 5801
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problemAnalysis: {
              type: Type.OBJECT,
              properties: {
                coreDilemma: { type: Type.STRING, description: '가장 핵심이 되는 고민 (1~2문장)' },
                background: { type: Type.STRING, description: '고민이 생긴 배경 (1문장)' },
                tradeoff: { type: Type.STRING, description: '선택에 따른 주요 절충점 (1문장)' },
              },
              required: ['coreDilemma', 'background', 'tradeoff'],
            },
            emotionAnalysis: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING, description: '사용자 상황 정리 (2~3문장)' },
                emotionalCues: { type: Type.STRING, description: '텍스트에서 드러난 감정과 해석 근거' },
                primaryConcerns: { type: Type.STRING, description: '피하고 싶어 하는 결과나 부담' },
                desiredChange: { type: Type.STRING, description: '얻고 싶어 하는 결과나 변화' },
                innerConflict: { type: Type.STRING, description: '서로 충돌하는 욕구와 가치' },
                unverifiedInterpretations: { type: Type.STRING, description: '확인이 필요한 AI 추론 내용' },
                directlyExpressed: { type: Type.STRING, description: '사용자가 직접 표현한 내용' },
                inferredContext: { type: Type.STRING, description: 'AI의 맥락적 추론' },
                questionsToAsk: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '스스로 점검해볼 질문 1~2개',
                },
              },
              required: [
                'summary',
                'emotionalCues',
                'primaryConcerns',
                'desiredChange',
                'innerConflict',
                'unverifiedInterpretations',
                'directlyExpressed',
                'inferredContext',
                'questionsToAsk',
              ],
            },
            factDistinction: {
              type: Type.OBJECT,
              properties: {
                verifiedFacts: { type: Type.ARRAY, items: { type: Type.STRING } },
                userConfirmedFacts: { type: Type.ARRAY, items: { type: Type.STRING } },
                aiInferences: { type: Type.ARRAY, items: { type: Type.STRING } },
                unverifiedItems: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['verifiedFacts', 'userConfirmedFacts', 'aiInferences', 'unverifiedItems'],
            },
            coreConflict: {
              type: Type.OBJECT,
              properties: {
                conflictDescription: { type: Type.STRING, description: '선택을 어렵게 만드는 핵심 갈등' },
                competingValues: { type: Type.STRING, description: '충돌하는 가치 (예: 안정 vs 성장)' },
                reflectionPoint: { type: Type.STRING, description: '판단을 돕는 핵심 성찰 질문' },
              },
              required: ['conflictDescription', 'competingValues', 'reflectionPoint'],
            },
            appliedCriteria: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  source: { type: Type.STRING },
                  importance: { type: Type.STRING },
                },
                required: ['name', 'reason', 'source', 'importance'],
              },
            },
            optionsComparison: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  scoreDisplay: { type: Type.STRING, description: '수치 점수 금지. 수치 없이 정성적 참고 정보만 작성' },
                  scoreMeaning: { type: Type.STRING },
                  scoreReasoning: { type: Type.STRING },
                  pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                  cons: { type: Type.ARRAY, items: { type: Type.STRING } },
                  mainRisk: { type: Type.STRING },
                  criteriaFit: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        criterion: { type: Type.STRING },
                        weight: { type: Type.STRING },
                        rating: { type: Type.STRING },
                        basis: { type: Type.STRING },
                      },
                      required: ['criterion', 'weight', 'rating', 'basis'],
                    },
                  },
                  suitableCondition: { type: Type.STRING },
                  cautionCondition: { type: Type.STRING },
                },
                required: [
                  'id',
                  'name',
                  'summary',
                  'scoreDisplay',
                  'scoreMeaning',
                  'scoreReasoning',
                  'pros',
                  'cons',
                  'mainRisk',
                  'criteriaFit',
                  'suitableCondition',
                  'cautionCondition',
                ],
              },
            },
            finalRecommendation: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING, description: '잠정 추천 방향 및 대안' },
                reason: { type: Type.STRING, description: '추천 이유 및 고려 배경' },
                biggestRisk: { type: Type.STRING, description: '주의해야 할 주요 위험' },
                conditionsForChange: { type: Type.STRING, description: '추천이 달라질 수 있는 핵심 조건' },
              },
              required: ['summary', 'reason', 'biggestRisk', 'conditionsForChange'],
            },
            sevenDayPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.INTEGER },
                  dayTitle: { type: Type.STRING },
                  task: { type: Type.STRING },
                  estimatedMinutes: { type: Type.STRING },
                  completionCriteria: { type: Type.STRING },
                },
                required: ['day', 'dayTitle', 'task', 'estimatedMinutes', 'completionCriteria'],
              },
            },
          },
          required: [
            'problemAnalysis',
            'emotionAnalysis',
            'factDistinction',
            'coreConflict',
            'appliedCriteria',
            'optionsComparison',
            'finalRecommendation',
            'sevenDayPlan',
          ],
        },
      },
    });

    if (response.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
      console.warn('[AI Analyze] Warning: Gemini candidate reached MAX_TOKENS');
    }

    const parsedData = safeParseAndRepairJson(response.text, 'Analyze');
    if (includeOptionComparison !== true || formattedOptions.split('\n').filter(Boolean).length < 2) {
      parsedData.optionsComparison = [];
    }
    const duration = Date.now() - startTime;
    const durationSeconds = Number((duration / 1000).toFixed(1));
    console.log(`[AI Analyze] Completed in ${duration}ms (${durationSeconds}s)`);

    parsedData.analysisDuration = durationSeconds;
    // Maintain backward compatibility for canvas exporter
    parsedData.factualVsAssumptions = {
      verifiedFacts: parsedData.factDistinction.verifiedFacts,
      assumptions: parsedData.factDistinction.aiInferences,
      needsVerification: parsedData.factDistinction.unverifiedItems,
    };

    return res.json(parsedData);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[AI Analyze] Failed after ${duration}ms:`, error);
    return res.status(500).json({
      error: error.message || '의사결정 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`ChoicePilot server running on http://0.0.0.0:${port}`);
  });
}

startServer();
