import Constants from 'expo-constants';
import { RecordEntry, Routine } from '../types';
import { routineRates, todayProgress } from '../utils/stats';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  anthropicApiKey?: string;
  anthropicModel?: string;
};

const API_KEY = extra.anthropicApiKey ?? '';
const MODEL = extra.anthropicModel || 'claude-haiku-4-5';
const API_URL = 'https://api.anthropic.com/v1/messages';

/** .env 에 API 키가 설정되어 있는지 */
export function isConfigured(): boolean {
  return API_KEY.length > 0;
}

const SYSTEM_PROMPT = [
  '너는 친근하고 긍정적인 습관 코치야.',
  '사용자의 최근 7일 루틴 달성 데이터를 보고 한국어로 따뜻하게 격려해 줘.',
  '가장 개선이 필요한 루틴 1~2개를 골라 시간대 변경, 난이도 조절 등',
  '구체적이고 바로 실천 가능한 조언을 제시해.',
  '전체 3~4문장, 적절한 이모지를 사용하고, 잘 지킨 부분은 칭찬도 곁들여 줘.',
].join(' ');

function buildUserMessage(routines: Routine[], records: RecordEntry[]): string {
  const rates = routineRates(routines, records, 7);
  const { done, total } = todayProgress(routines, records);

  if (rates.length === 0) {
    return '아직 등록된 루틴이 없어요. 습관 형성을 시작하는 사람에게 따뜻한 첫 조언을 해줘.';
  }

  const lines = rates
    .map(
      (r) =>
        `- ${r.routine.icon} ${r.routine.title} (${r.routine.category}): 최근 7일 중 ${r.done}/${r.total}일 달성 (${Math.round(
          r.rate * 100,
        )}%)`,
    )
    .join('\n');

  return [
    `오늘 진행: ${done}/${total} 완료`,
    '',
    '최근 7일 루틴별 달성 현황:',
    lines,
    '',
    '이 데이터를 바탕으로 조언해 줘.',
  ].join('\n');
}

/**
 * Claude API 를 호출해 맞춤 조언 텍스트를 반환한다.
 * v1: 클라이언트에서 직접 호출 (공개 배포 전 프록시 전환 예정).
 */
export async function getAdvice(routines: Routine[], records: RecordEntry[]): Promise<string> {
  if (!isConfigured()) {
    throw new Error('API 키가 설정되지 않았어요. .env 파일에 ANTHROPIC_API_KEY 를 추가해 주세요.');
  }

  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserMessage(routines, records) }],
      }),
    });
  } catch (e) {
    throw new Error('네트워크 오류로 AI 조언을 가져오지 못했어요. 연결을 확인해 주세요.');
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    if (res.status === 401) throw new Error('API 키가 올바르지 않아요. 키를 다시 확인해 주세요.');
    if (res.status === 429) throw new Error('요청이 많아요. 잠시 후 다시 시도해 주세요.');
    throw new Error(`AI 호출 실패 (${res.status})${detail ? `: ${detail.slice(0, 150)}` : ''}`);
  }

  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = data.content?.find((c) => c.type === 'text')?.text;
  return text?.trim() || '조언을 생성하지 못했어요. 다시 시도해 주세요.';
}
