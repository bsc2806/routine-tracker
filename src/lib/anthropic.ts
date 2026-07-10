import Constants from 'expo-constants';
import { DiaryEntry, Mood, MOODS, RecordEntry, Routine } from '../types';
import { lastNDateKeys, weekdayLabel } from '../utils/date';
import { bestWorst, routineRates, todayProgress, weeklyData } from '../utils/stats';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  proxyUrl?: string;
  proxyToken?: string;
};

const PROXY_URL = extra.proxyUrl ?? '';
const PROXY_TOKEN = extra.proxyToken ?? '';

/** 프록시 URL 이 설정되어 있는지 */
export function isConfigured(): boolean {
  return PROXY_URL.length > 0;
}

type Mode = 'advice' | 'weekly';

/**
 * AI 프록시(Cloudflare Worker) 호출.
 * 시스템 프롬프트와 API 키는 서버에 있으므로, 앱은 데이터 요약과 mode 만 보낸다.
 */
async function callProxy(mode: Mode, summary: string): Promise<string> {
  if (!isConfigured()) {
    throw new Error('AI 기능을 아직 사용할 수 없어요. 잠시 후 다시 시도해 주세요.');
  }

  let res: Response;
  try {
    res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode, summary, token: PROXY_TOKEN }),
    });
  } catch {
    throw new Error('네트워크가 불안정한 것 같아요. 연결을 확인한 뒤 다시 시도해 주세요.');
  }

  if (!res.ok) {
    // 요청 과다만 별도 안내, 그 외(인증·결제·서버 오류 등 내부 사유)는 일반 문구로
    if (res.status === 429) {
      throw new Error('지금은 요청이 많아요. 잠시 후 다시 시도해 주세요.');
    }
    throw new Error('AI 기능을 잠시 사용할 수 없어요. 잠시 후 다시 시도해 주세요.');
  }

  const data = (await res.json()) as { text?: string };
  return data.text?.trim() ?? '';
}

/** 최근 7일 데이터 요약 (맞춤 조언용) */
function buildAdviceSummary(routines: Routine[], records: RecordEntry[]): string {
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

  return [`오늘 진행: ${done}/${total} 완료`, '', '최근 7일 루틴별 달성 현황:', lines].join('\n');
}

/** 최근 7일 기분 요약 (있을 때만) */
function buildMoodSummary(diary: DiaryEntry[]): string[] {
  const keys = lastNDateKeys(7);
  const moodByDate = new Map(diary.map((d) => [d.date, d.mood]));
  const days = keys.filter((k) => moodByDate.get(k) != null);
  if (days.length === 0) return [];

  const moodLine = days
    .map((k) => `${weekdayLabel(k)}(${MOODS.find((m) => m.value === moodByDate.get(k))?.emoji})`)
    .join(' ');
  const vals = days.map((k) => moodByDate.get(k)) as Mood[];
  const avg = (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1);

  return [
    '',
    `최근 7일 기분: ${moodLine}`,
    `평균 기분: ${avg}/5`,
    '기분과 루틴 달성률의 관계도 자연스럽게 짚어 줘.',
  ];
}

/** 주간 리포트용 데이터 요약 */
function buildWeeklySummary(
  routines: Routine[],
  records: RecordEntry[],
  diary: DiaryEntry[],
): string {
  const rates = routineRates(routines, records, 7);
  const week = weeklyData(routines, records);
  const { best, worst } = bestWorst(rates);
  const weekAvg = week.length
    ? Math.round((week.reduce((s, d) => s + d.ratio, 0) / week.length) * 100)
    : 0;

  if (rates.length === 0) {
    return '아직 등록된 루틴이 없어요. 습관을 막 시작하려는 사람을 위한 따뜻한 첫 주간 리포트를 작성해 줘.';
  }

  const perRoutine = rates
    .map(
      (r) =>
        `- ${r.routine.icon} ${r.routine.title}(${r.routine.category}): ${r.done}/${r.total}일 (${Math.round(
          r.rate * 100,
        )}%)`,
    )
    .join('\n');

  return [
    `이번 주 전체 평균 달성률: ${weekAvg}%`,
    best ? `가장 잘 지킨 루틴: ${best.routine.title} (${Math.round(best.rate * 100)}%)` : '',
    worst ? `가장 놓친 루틴: ${worst.routine.title} (${Math.round(worst.rate * 100)}%)` : '',
    '',
    '루틴별 최근 7일 달성:',
    perRoutine,
    ...buildMoodSummary(diary),
  ]
    .filter(Boolean)
    .join('\n');
}

/** 최근 7일 데이터를 분석한 맞춤 조언 */
export async function getAdvice(routines: Routine[], records: RecordEntry[]): Promise<string> {
  const text = await callProxy('advice', buildAdviceSummary(routines, records));
  return text || '조언을 생성하지 못했어요. 다시 시도해 주세요.';
}

/** 이번 주 요약 + 다음 주 목표 제안 리포트 (기분 데이터 있으면 함께 분석) */
export async function getWeeklyReport(
  routines: Routine[],
  records: RecordEntry[],
  diary: DiaryEntry[] = [],
): Promise<string> {
  const text = await callProxy('weekly', buildWeeklySummary(routines, records, diary));
  return text || '리포트를 생성하지 못했어요. 다시 시도해 주세요.';
}
