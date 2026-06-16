import { Routine, RecordEntry } from '../types';
import { addDays, lastNDateKeys, toDateKey, todayKey, weekdayLabel } from './date';

function completedKey(routineId: string, date: string): string {
  return `${routineId}|${date}`;
}

/** 완료된 기록을 빠르게 조회하기 위한 Set */
function completedSet(records: RecordEntry[]): Set<string> {
  return new Set(
    records.filter((r) => r.completed).map((r) => completedKey(r.routineId, r.date)),
  );
}

export function activeRoutines(routines: Routine[]): Routine[] {
  return routines.filter((r) => !r.archived);
}

/** 오늘 해당 루틴이 완료되었는지 */
export function isCompletedToday(records: RecordEntry[], routineId: string): boolean {
  const today = todayKey();
  return records.some((r) => r.routineId === routineId && r.date === today && r.completed);
}

/**
 * 연속 달성 스트릭. 오늘부터 거꾸로 연속 완료한 날 수.
 * 오늘 아직 체크 안 했으면 어제까지 기준으로 계산 (스트릭 유지).
 */
export function getStreak(records: RecordEntry[], routineId: string): number {
  const done = completedSet(records);
  let cursor = new Date();
  if (!done.has(completedKey(routineId, toDateKey(cursor)))) {
    cursor = addDays(cursor, -1);
  }
  let streak = 0;
  while (done.has(completedKey(routineId, toDateKey(cursor)))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export interface TodayProgress {
  done: number;
  total: number;
  ratio: number;
}

export function todayProgress(routines: Routine[], records: RecordEntry[]): TodayProgress {
  const active = activeRoutines(routines);
  const today = todayKey();
  const done = active.filter((r) => isCompletedTodayFor(records, r.id, today)).length;
  const total = active.length;
  return { done, total, ratio: total ? done / total : 0 };
}

function isCompletedTodayFor(records: RecordEntry[], routineId: string, today: string): boolean {
  return records.some((r) => r.routineId === routineId && r.date === today && r.completed);
}

export interface DayBar {
  key: string;
  label: string;
  done: number;
  total: number;
  ratio: number;
}

/** 최근 7일 일별 달성률 (막대 그래프용) */
export function weeklyData(routines: Routine[], records: RecordEntry[]): DayBar[] {
  const active = activeRoutines(routines);
  const done = completedSet(records);
  return lastNDateKeys(7).map((key) => {
    const total = active.filter((r) => r.createdAt.slice(0, 10) <= key).length;
    const completed = active.filter((r) => done.has(completedKey(r.id, key))).length;
    return {
      key,
      label: weekdayLabel(key),
      done: completed,
      total,
      ratio: total ? completed / total : 0,
    };
  });
}

export interface RoutineRate {
  routine: Routine;
  done: number;
  total: number;
  rate: number;
}

/** 루틴별 최근 N일 달성률 (루틴 생성일 이후 날짜만 분모에 포함) */
export function routineRates(
  routines: Routine[],
  records: RecordEntry[],
  days = 7,
): RoutineRate[] {
  const keys = lastNDateKeys(days);
  const active = activeRoutines(routines);
  const done = completedSet(records);
  return active.map((routine) => {
    const validDays = keys.filter((k) => routine.createdAt.slice(0, 10) <= k);
    const total = validDays.length || 1;
    const completed = validDays.filter((k) => done.has(completedKey(routine.id, k))).length;
    return { routine, done: completed, total, rate: completed / total };
  });
}

export interface BestWorst {
  best: RoutineRate | null;
  worst: RoutineRate | null;
}

export function bestWorst(rates: RoutineRate[]): BestWorst {
  if (rates.length === 0) return { best: null, worst: null };
  const sorted = [...rates].sort((a, b) => b.rate - a.rate);
  return { best: sorted[0], worst: sorted[sorted.length - 1] };
}
