import { Routine } from '../types';

export function isAvoid(routine: Routine): boolean {
  return routine.kind === 'avoid';
}

/** 스트릭 표시 문구 (실천형: 연속 / 유지형: 유지) */
export function streakLabel(routine: Routine, streak: number): string {
  if (streak <= 0) return '';
  return isAvoid(routine) ? `🛡️ ${streak}일째 유지` : `🔥 ${streak}일 연속`;
}

/** 스트릭 카드 라벨 */
export function streakCardLabel(routine: Routine): string {
  return isAvoid(routine) ? '유지 일수' : '현재 스트릭';
}

/** 스트릭 값 앞 이모지 */
export function streakEmoji(routine: Routine): string {
  return isAvoid(routine) ? '🛡️' : '🔥';
}
