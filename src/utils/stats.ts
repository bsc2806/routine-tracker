import { Routine, RecordEntry } from '../types';
import { addDays, lastNDateKeys, toDateKey, todayKey, weekdayLabel } from './date';
import { isDueOn, isDueToday } from './schedule';

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

/** 오늘 수행 예정인(=due) 활성 루틴만 */
export function dueTodayRoutines(routines: Routine[]): Routine[] {
  return activeRoutines(routines).filter((r) => isDueToday(r));
}

/** 오늘 해당 루틴이 완료되었는지 */
export function isCompletedToday(records: RecordEntry[], routineId: string): boolean {
  const today = todayKey();
  return records.some((r) => r.routineId === routineId && r.date === today && r.completed);
}

function existsOn(routine: Routine, dateKey: string): boolean {
  return routine.createdAt.slice(0, 10) <= dateKey;
}

/**
 * 연속 달성 스트릭. 수행 예정일(due day)만 기준으로 계산한다.
 * 비예정일(쉬는 날)은 건너뛰며 스트릭을 끊지 않는다.
 * 오늘이 예정일인데 아직 체크 안 했으면 직전 예정일 기준으로 유지(grace).
 */
export function getStreak(records: RecordEntry[], routine: Routine): number {
  const done = completedSet(records);
  let cursor = new Date();

  if (isDueToday(routine) && !done.has(completedKey(routine.id, toDateKey(cursor)))) {
    cursor = addDays(cursor, -1);
  }

  let streak = 0;
  // 생성일 이전까지만 거슬러 올라감 (안전 상한 366일)
  for (let i = 0; i < 366; i++) {
    const key = toDateKey(cursor);
    if (!existsOn(routine, key)) break;
    if (isDueOn(routine, key)) {
      if (done.has(completedKey(routine.id, key))) streak += 1;
      else break;
    }
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export interface TodayProgress {
  done: number;
  total: number;
  ratio: number;
}

/** 오늘 예정 루틴 기준 진행률 */
export function todayProgress(routines: Routine[], records: RecordEntry[]): TodayProgress {
  const due = dueTodayRoutines(routines);
  const today = todayKey();
  const completed = completedSet(records);
  const done = due.filter((r) => completed.has(completedKey(r.id, today))).length;
  return { done, total: due.length, ratio: due.length ? done / due.length : 0 };
}

export interface DayBar {
  key: string;
  label: string;
  done: number;
  total: number;
  ratio: number;
}

/** 최근 7일 일별 달성률 (각 날짜의 예정 루틴 기준) */
export function weeklyData(routines: Routine[], records: RecordEntry[]): DayBar[] {
  const active = activeRoutines(routines);
  const done = completedSet(records);
  return lastNDateKeys(7).map((key) => {
    const dueRoutines = active.filter((r) => existsOn(r, key) && isDueOn(r, key));
    const completed = dueRoutines.filter((r) => done.has(completedKey(r.id, key))).length;
    const total = dueRoutines.length;
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

/** 루틴별 최근 N일 달성률 (생성 이후 & 예정일만 분모에 포함) */
export function routineRates(
  routines: Routine[],
  records: RecordEntry[],
  days = 7,
): RoutineRate[] {
  const keys = lastNDateKeys(days);
  const active = activeRoutines(routines);
  const done = completedSet(records);
  return active.map((routine) => {
    const validDays = keys.filter((k) => existsOn(routine, k) && isDueOn(routine, k));
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
