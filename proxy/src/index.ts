/**
 * 루틴 트래커 AI 프록시 (Cloudflare Worker)
 *
 * 앱이 Claude API 를 직접 호출하지 않도록 중계한다.
 * - 키(ANTHROPIC_API_KEY)는 이 서버의 시크릿으로만 존재 → 앱 빌드에 노출되지 않음
 * - 시스템 프롬프트(persona/형식)는 서버에서 고정 → 범용 Claude 악용 방지
 * - 앱은 { mode, summary, token } 만 전송
 */

export interface Env {
  ANTHROPIC_API_KEY: string;
  APP_SHARED_SECRET: string;
  ANTHROPIC_MODEL?: string;
}

type Mode = 'advice' | 'weekly';

const SYSTEM_PROMPTS: Record<Mode, string> = {
  advice: [
    '너는 친근하고 긍정적인 습관 코치야.',
    '사용자의 최근 7일 루틴 달성 데이터를 보고 한국어로 따뜻하게 격려해 줘.',
    '가장 개선이 필요한 루틴 1~2개를 골라 시간대 변경, 난이도 조절 등',
    '구체적이고 바로 실천 가능한 조언을 제시해.',
    '전체 3~4문장, 적절한 이모지를 사용하고, 잘 지킨 부분은 칭찬도 곁들여 줘.',
  ].join(' '),
  weekly: [
    '너는 따뜻하고 긍정적인 습관 코치야.',
    '사용자의 한 주 루틴 데이터를 바탕으로 한국어 주간 리포트를 작성해.',
    '아래 형식을 정확히 지켜:',
    '📊 이번 주 요약: 2~3문장',
    '👍 잘한 점: 1~2가지 (불릿 "- ")',
    '🎯 다음 주 목표: 구체적이고 실천 가능한 3가지 (불릿 "- ")',
    '과장 없이 격려 중심으로, 이모지는 섹션 제목에만 사용.',
  ].join('\n'),
};

const MAX_TOKENS: Record<Mode, number> = { advice: 512, weekly: 700 };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

    let body: { mode?: string; summary?: string; token?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: 'invalid json' }, 400);
    }

    const { mode, summary, token } = body ?? {};

    // 1차 방어: 공유 시크릿 검증
    if (!env.APP_SHARED_SECRET || token !== env.APP_SHARED_SECRET) {
      return json({ error: 'unauthorized' }, 401);
    }
    if (mode !== 'advice' && mode !== 'weekly') {
      return json({ error: 'invalid mode' }, 400);
    }
    if (typeof summary !== 'string' || summary.length === 0 || summary.length > 4000) {
      return json({ error: 'invalid summary' }, 400);
    }

    let upstream: Response;
    try {
      upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: env.ANTHROPIC_MODEL || 'claude-haiku-4-5',
          max_tokens: MAX_TOKENS[mode],
          system: SYSTEM_PROMPTS[mode],
          messages: [{ role: 'user', content: summary }],
        }),
      });
    } catch {
      return json({ error: 'network' }, 502);
    }

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      return json({ error: 'upstream', status: upstream.status, detail: detail.slice(0, 200) }, 502);
    }

    const data = (await upstream.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = data.content?.find((c) => c.type === 'text')?.text?.trim() ?? '';
    return json({ text });
  },
};
