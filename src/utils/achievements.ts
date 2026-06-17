import { RecordEntry, Routine } from '../types';
import { isDueOn } from './schedule';
import { getLongestStreak } from './stats';

export interface Badge {
  id: string;
  icon: string;
  title: string;
  desc: string;
  /** 진행도 (target 로 클램프됨) */
  current: number;
  target: number;
  earned: boolean;
}

function totalCompletions(records: RecordEntry[]): number {
  return records.filter((r) => r.completed).length;
}

/** 모든 루틴 통틀어 역대 최장 연속 달성 */
function maxLongestStreak(routines: Routine[], records: RecordEntry[]): number {
  return routines.reduce((max, r) => Math.max(max, getLongestStreak(records, r)), 0);
}

/** 그날 예정 루틴을 전부 완료한 "완벽한 하루"의 수 */
function perfectDayCount(routines: Routine[], records: RecordEntry[]): number {
  const active = routines.filter((r) => !r.archived);
  const completed = new Set(
    records.filter((r) => r.completed).map((r) => `${r.routineId}|${r.date}`),
  );
  const dates = [...new Set(records.filter((r) => r.completed).map((r) => r.date))];
  let count = 0;
  for (const date of dates) {
    const due = active.filter((r) => r.createdAt.slice(0, 10) <= date && isDueOn(r, date));
    if (due.length > 0 && due.every((r) => completed.has(`${r.id}|${date}`))) count += 1;
  }
  return count;
}

/** 현재 데이터 기준 배지 목록과 진행도를 계산 */
export function computeBadges(routines: Routine[], records: RecordEntry[]): Badge[] {
  const total = totalCompletions(records);
  const streak = maxLongestStreak(routines, records);
  const perfect = perfectDayCount(routines, records);

  const defs: Omit<Badge, 'earned'>[] = [
    { id: 'first', icon: '🌱', title: '첫 걸음', desc: '첫 루틴 완료', current: total, target: 1 },
    { id: 'streak3', icon: '🔥', title: '작심삼일 탈출', desc: '3일 연속', current: streak, target: 3 },
    { id: 'streak7', icon: '🔥', title: '일주일 연속', desc: '7일 연속', current: streak, target: 7 },
    { id: 'streak14', icon: '🔥', title: '2주 연속', desc: '14일 연속', current: streak, target: 14 },
    { id: 'streak30', icon: '🏆', title: '한 달 연속', desc: '30일 연속', current: streak, target: 30 },
    { id: 'streak100', icon: '💯', title: '백일의 약속', desc: '100일 연속', current: streak, target: 100 },
    { id: 'perfect1', icon: '🌟', title: '완벽한 하루', desc: '하루 전부 완료', current: perfect, target: 1 },
    { id: 'perfect7', icon: '✨', title: '완벽한 7일', desc: '완벽한 하루 7번', current: perfect, target: 7 },
    { id: 'total50', icon: '✅', title: '꾸준함의 시작', desc: '누적 50회', current: total, target: 50 },
    { id: 'total100', icon: '🎖️', title: '백 번의 실천', desc: '누적 100회', current: total, target: 100 },
    { id: 'total365', icon: '👑', title: '습관의 달인', desc: '누적 365회', current: total, target: 365 },
  ];

  return defs.map((d) => ({
    ...d,
    earned: d.current >= d.target,
    current: Math.min(d.current, d.target),
  }));
}

export function earnedCount(badges: Badge[]): number {
  return badges.filter((b) => b.earned).length;
}

/** 획득 배지 수에 따른 칭호 */
export function currentTitle(badges: Badge[]): string {
  const e = earnedCount(badges);
  const total = badges.length;
  if (e >= total) return '습관의 달인';
  if (e >= 9) return '고수';
  if (e >= 6) return '숙련자';
  if (e >= 3) return '수련생';
  if (e >= 1) return '입문자';
  return '새싹';
}

export interface Records {
  bestStreak: number;
  totalDone: number;
  perfectDays: number;
}

/** 자기 기록(루틴 무관 meta 지표) — '기록 경신' 섹션용 */
export function computeRecords(routines: Routine[], records: RecordEntry[]): Records {
  return {
    bestStreak: maxLongestStreak(routines, records),
    totalDone: totalCompletions(records),
    perfectDays: perfectDayCount(routines, records),
  };
}
