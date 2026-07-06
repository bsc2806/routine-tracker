import { RecordEntry, Routine } from '../types';
import {
  addDays,
  fromDateKey,
  lastNDateKeys,
  toDateKey,
  todayKey,
  weekStartKey,
  weekdayLabel,
} from '../utils/date';
import { isDueOn, isDueToday, scheduleLabel, weekdayOf } from '../utils/schedule';
import {
  activeRoutines,
  bestWorst,
  dueTodayRoutines,
  getLongestStreak,
  getStreak,
  isCompletedToday,
  rateForRoutine,
  routineRates,
  todayProgress,
  weeklyData,
} from '../utils/stats';
import { computeBadges, computeRecords, currentTitle, earnedCount, Badge } from '../utils/achievements';
import { isAvoid, streakCardLabel, streakEmoji, streakLabel } from '../utils/kind';

// ---- 헬퍼: 오늘 기준 상대 날짜로 픽스처 생성 ----
const dayKey = (offset: number) => toDateKey(addDays(new Date(), offset));

function makeRoutine(over: Partial<Routine> & { id: string }): Routine {
  return {
    title: over.id,
    category: '건강',
    icon: '💪',
    createdAt: `${dayKey(-400)}T00:00:00.000Z`,
    ...over,
  };
}

function rec(routineId: string, offset: number, completed = true): RecordEntry {
  return { routineId, date: dayKey(offset), completed };
}

// =========================================================================
describe('date', () => {
  test('toDateKey/ fromDateKey 왕복', () => {
    const d = new Date(2026, 5, 16); // 2026-06-16
    expect(toDateKey(d)).toBe('2026-06-16');
    expect(toDateKey(fromDateKey('2026-06-16'))).toBe('2026-06-16');
  });

  test('addDays', () => {
    expect(toDateKey(addDays(new Date(2026, 0, 1), 1))).toBe('2026-01-02');
    expect(toDateKey(addDays(new Date(2026, 0, 1), -1))).toBe('2025-12-31');
  });

  test('lastNDateKeys 는 오래된→오늘 순 7개', () => {
    const keys = lastNDateKeys(7);
    expect(keys).toHaveLength(7);
    expect(keys[6]).toBe(todayKey());
    expect(keys[0]).toBe(dayKey(-6));
  });

  test('weekdayLabel', () => {
    expect(weekdayLabel('2026-06-16')).toBe('화'); // 화요일
  });

  test('weekStartKey 는 월요일', () => {
    expect(weekdayOf(weekStartKey())).toBe(1);
  });
});

// =========================================================================
describe('schedule', () => {
  const daily = makeRoutine({ id: 'd' });
  const wToday = weekdayOf(todayKey());
  const weeklyToday = makeRoutine({ id: 'w', schedule: { type: 'weekly', days: [wToday] } });
  const weeklyOther = makeRoutine({
    id: 'wo',
    schedule: { type: 'weekly', days: [(wToday + 1) % 7] },
  });

  test('daily 은 매일 예정', () => {
    expect(isDueOn(daily, todayKey())).toBe(true);
    expect(isDueOn(daily, dayKey(-3))).toBe(true);
    expect(isDueToday(daily)).toBe(true);
  });

  test('weekly 는 지정 요일에만 예정', () => {
    expect(isDueToday(weeklyToday)).toBe(true);
    expect(isDueToday(weeklyOther)).toBe(false);
  });

  test('scheduleLabel', () => {
    expect(scheduleLabel(daily)).toBe('매일');
    expect(scheduleLabel(makeRoutine({ id: 'a', schedule: { type: 'weekly', days: [0, 1, 2, 3, 4, 5, 6] } }))).toBe('매일');
    expect(scheduleLabel(makeRoutine({ id: 'b', schedule: { type: 'weekly', days: [1, 2, 3, 4, 5] } }))).toBe('평일');
    expect(scheduleLabel(makeRoutine({ id: 'c', schedule: { type: 'weekly', days: [0, 6] } }))).toBe('주말');
    expect(scheduleLabel(makeRoutine({ id: 'e', schedule: { type: 'weekly', days: [1, 3, 5] } }))).toBe('월·수·금');
  });
});

// =========================================================================
describe('stats: streak', () => {
  test('오늘 포함 연속 완료 시 스트릭', () => {
    const r = makeRoutine({ id: 'r' });
    const records = [rec('r', 0), rec('r', -1), rec('r', -2)];
    expect(getStreak(records, r)).toBe(3);
  });

  test('오늘 미체크여도 어제까지 연속이면 유지(grace)', () => {
    const r = makeRoutine({ id: 'r' });
    const records = [rec('r', -1), rec('r', -2), rec('r', -3)];
    expect(getStreak(records, r)).toBe(3);
  });

  test('중간에 빠지면 끊김', () => {
    const r = makeRoutine({ id: 'r' });
    const records = [rec('r', 0), rec('r', -1), rec('r', -3)];
    expect(getStreak(records, r)).toBe(2);
  });

  test('weekly: 쉬는 날은 건너뛰고 끊기지 않음', () => {
    const wToday = weekdayOf(todayKey());
    const r = makeRoutine({ id: 'r', schedule: { type: 'weekly', days: [wToday] } });
    const records = [rec('r', 0), rec('r', -7)]; // 같은 요일 2회
    expect(getStreak(records, r)).toBe(2);
  });

  test('getLongestStreak: 역대 최장 연속', () => {
    const r = makeRoutine({ id: 'r' });
    const records = [rec('r', -5), rec('r', -4), rec('r', -3), rec('r', -1), rec('r', 0)];
    expect(getLongestStreak(records, r)).toBe(3);
  });
});

// =========================================================================
describe('stats: progress & rates', () => {
  const r1 = makeRoutine({ id: 'r1' });
  const r2 = makeRoutine({ id: 'r2' });
  const routines = [r1, r2];

  test('todayProgress', () => {
    const records = [rec('r1', 0)];
    expect(todayProgress(routines, records)).toEqual({ done: 1, total: 2, ratio: 0.5 });
  });

  test('isCompletedToday', () => {
    expect(isCompletedToday([rec('r1', 0)], 'r1')).toBe(true);
    expect(isCompletedToday([rec('r1', -1)], 'r1')).toBe(false);
  });

  test('routineRates: 최근 7일 중 완료 비율', () => {
    const records = [rec('r1', 0), rec('r1', -1), rec('r1', -2)];
    const rates = routineRates([r1], records, 7);
    expect(rates[0].done).toBe(3);
    expect(rates[0].total).toBe(7);
  });

  test('weeklyData 는 7일', () => {
    expect(weeklyData(routines, [])).toHaveLength(7);
  });

  test('bestWorst', () => {
    const records = [rec('r1', 0), rec('r1', -1)]; // r1 잘함, r2 못함
    const { best, worst } = bestWorst(routineRates(routines, records, 7));
    expect(best?.routine.id).toBe('r1');
    expect(worst?.routine.id).toBe('r2');
  });

  test('rateForRoutine 30일', () => {
    const records = [rec('r1', 0), rec('r1', -10)];
    const rate = rateForRoutine(records, r1, 30);
    expect(rate.done).toBe(2);
    expect(rate.total).toBe(30);
  });

  test('archived 제외 / due today 필터', () => {
    const archived = makeRoutine({ id: 'a', archived: true });
    const wOther = makeRoutine({
      id: 'wo',
      schedule: { type: 'weekly', days: [(weekdayOf(todayKey()) + 1) % 7] },
    });
    const all = [r1, archived, wOther];
    expect(activeRoutines(all).map((r) => r.id)).toEqual(['r1', 'wo']);
    expect(dueTodayRoutines(all).map((r) => r.id)).toEqual(['r1']); // wo는 오늘 예정 아님
  });
});

// =========================================================================
describe('achievements', () => {
  const r = makeRoutine({ id: 'r' });

  test('기록 없으면 첫 걸음 미획득', () => {
    const badges = computeBadges([r], []);
    expect(badges.find((b) => b.id === 'first')?.earned).toBe(false);
  });

  test('1회 완료 시 첫 걸음 획득', () => {
    const badges = computeBadges([r], [rec('r', 0)]);
    expect(badges.find((b) => b.id === 'first')?.earned).toBe(true);
  });

  test('7일 연속 → streak3·streak7 획득, streak14 미획득', () => {
    const records = [0, -1, -2, -3, -4, -5, -6].map((o) => rec('r', o));
    const badges = computeBadges([r], records);
    const byId = (id: string) => badges.find((b) => b.id === id)?.earned;
    expect(byId('streak3')).toBe(true);
    expect(byId('streak7')).toBe(true);
    expect(byId('streak14')).toBe(false);
  });

  test('오늘 전부 완료 → 완벽한 하루', () => {
    const badges = computeBadges([r], [rec('r', 0)]);
    expect(badges.find((b) => b.id === 'perfect1')?.earned).toBe(true);
  });

  test('earnedCount / computeRecords', () => {
    const records = [rec('r', 0), rec('r', -1)];
    const badges = computeBadges([r], records);
    expect(earnedCount(badges)).toBeGreaterThanOrEqual(2); // first + streak?
    const rc = computeRecords([r], records);
    expect(rc.totalDone).toBe(2);
    expect(rc.bestStreak).toBe(2);
    expect(rc.perfectDays).toBe(2);
  });

  test('currentTitle 단계', () => {
    const mk = (earned: boolean): Badge => ({ id: 'x', icon: '', title: '', desc: '', current: 0, target: 1, earned });
    const withEarned = (k: number, n = 11) =>
      Array.from({ length: n }, (_, i) => mk(i < k));
    expect(currentTitle(withEarned(0))).toBe('새싹');
    expect(currentTitle(withEarned(1))).toBe('입문자');
    expect(currentTitle(withEarned(3))).toBe('수련생');
    expect(currentTitle(withEarned(6))).toBe('숙련자');
    expect(currentTitle(withEarned(9))).toBe('고수');
    expect(currentTitle(withEarned(11))).toBe('습관의 달인');
  });
});

// =========================================================================
describe('kind (실천형/유지형)', () => {
  const build = makeRoutine({ id: 'b', kind: 'build' });
  const avoid = makeRoutine({ id: 'a', kind: 'avoid' });

  test('isAvoid', () => {
    expect(isAvoid(build)).toBe(false);
    expect(isAvoid(avoid)).toBe(true);
  });

  test('streakLabel 분기', () => {
    expect(streakLabel(build, 3)).toBe('🔥 3일 연속');
    expect(streakLabel(avoid, 3)).toBe('🛡️ 3일째 유지');
    expect(streakLabel(build, 0)).toBe('');
  });

  test('streakCardLabel / streakEmoji', () => {
    expect(streakCardLabel(build)).toBe('현재 스트릭');
    expect(streakCardLabel(avoid)).toBe('유지 일수');
    expect(streakEmoji(build)).toBe('🔥');
    expect(streakEmoji(avoid)).toBe('🛡️');
  });
});

// =========================================================================
describe('기능 시나리오: 운동(실천)+금연(유지) 하루 흐름', () => {
  test('오늘 둘 다 완료 + 운동 어제도', () => {
    const workout = makeRoutine({ id: 'workout', title: '운동', kind: 'build' });
    const noSmoke = makeRoutine({ id: 'nosmoke', title: '금연', kind: 'avoid' });
    const routines = [workout, noSmoke];
    const records = [rec('workout', 0), rec('workout', -1), rec('nosmoke', 0)];

    expect(todayProgress(routines, records)).toEqual({ done: 2, total: 2, ratio: 1 });
    expect(getStreak(records, workout)).toBe(2);
    expect(getStreak(records, noSmoke)).toBe(1);
    expect(computeBadges(routines, records).find((b) => b.id === 'first')?.earned).toBe(true);
    expect(streakLabel(noSmoke, 1)).toBe('🛡️ 1일째 유지');
  });
});
