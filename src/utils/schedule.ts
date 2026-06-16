import { Routine } from '../types';
import { todayKey } from './date';

export const WEEKDAY_SHORT = ['일', '월', '화', '수', '목', '금', '토'];

/** "YYYY-MM-DD" -> 요일 인덱스 (0=일 ~ 6=토) */
export function weekdayOf(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

/** 해당 날짜에 이 루틴을 수행해야 하는가? (schedule 없으면 매일) */
export function isDueOn(routine: Routine, dateKey: string): boolean {
  const sched = routine.schedule;
  if (!sched || sched.type === 'daily') return true;
  return (sched.days ?? []).includes(weekdayOf(dateKey));
}

export function isDueToday(routine: Routine): boolean {
  return isDueOn(routine, todayKey());
}

/** 반복 주기 한글 라벨: "매일" / "평일" / "주말" / "월·수·금" */
export function scheduleLabel(routine: Routine): string {
  const sched = routine.schedule;
  if (!sched || sched.type === 'daily') return '매일';
  const days = [...(sched.days ?? [])].sort((a, b) => a - b);
  if (days.length === 0) return '매일';
  if (days.length === 7) return '매일';
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return '평일';
  if (days.length === 2 && days.includes(0) && days.includes(6)) return '주말';
  return days.map((d) => WEEKDAY_SHORT[d]).join('·');
}
