import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CelebrationOverlay } from '../../src/components/CelebrationOverlay';
import { useApp } from '../../src/store/AppContext';
import { addDays, toDateKey, todayKey } from '../../src/utils/date';
import { monthMatrix, monthTitle } from '../../src/utils/calendar';
import { isAvoid, streakCardLabel, streakEmoji } from '../../src/utils/kind';
import { isDueOn, scheduleLabel, WEEKDAY_SHORT } from '../../src/utils/schedule';
import {
  dueTodayRoutines,
  getLongestStreak,
  getStreak,
  rateForRoutine,
} from '../../src/utils/stats';

/** 소급 완료(과거 기록 수정) 허용 범위: 오늘 포함 최근 7일 */
const EDIT_WINDOW_DAYS = 7;

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { routines, records, toggleOn } = useApp();
  const routine = routines.find((r) => r.id === id);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-11
  const [celebrate, setCelebrate] = useState(false);

  const doneSet = useMemo(
    () => new Set(records.filter((r) => r.completed).map((r) => `${r.routineId}|${r.date}`)),
    [records],
  );

  if (!routine) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Text className="text-gray-400">루틴을 찾을 수 없어요.</Text>
        <Pressable onPress={() => router.back()} className="mt-4 rounded-xl bg-emerald-500 px-5 py-2.5">
          <Text className="font-semibold text-white">뒤로</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const today = todayKey();
  const minEditKey = toDateKey(addDays(new Date(), -(EDIT_WINDOW_DAYS - 1)));
  const streak = getStreak(records, routine);
  const longest = getLongestStreak(records, routine);
  const rate = rateForRoutine(records, routine, 30);
  const weeks = monthMatrix(year, month);

  const handleToggleDay = (dateKey: string) => {
    const wasCompleted = doneSet.has(`${routine.id}|${dateKey}`);
    toggleOn(routine.id, dateKey);
    // 오늘 체크를 완료로 만들었고, 그로써 오늘 예정 루틴을 모두 끝냈다면 축하
    if (dateKey === today && !wasCompleted) {
      const remaining = dueTodayRoutines(routines).filter(
        (r) =>
          r.id !== routine.id &&
          !records.some((x) => x.routineId === r.id && x.date === today && x.completed),
      ).length;
      if (remaining === 0) setCelebrate(true);
    }
  };

  const goPrev = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  };
  const goNext = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50 dark:bg-gray-950">
      {/* 헤더 */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={8} className="p-1 active:opacity-60">
          <Ionicons name="chevron-back" size={26} color="#10b981" />
        </Pressable>
        <Text className="ml-1 text-lg font-bold text-gray-900 dark:text-white">루틴 상세</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 40 }}>
        {/* 루틴 정보 */}
        <View className="flex-row items-center rounded-2xl bg-white p-5 dark:bg-gray-800">
          <Text className="text-4xl">{routine.icon}</Text>
          <View className="ml-4 flex-1">
            <Text className="text-xl font-bold text-gray-900 dark:text-white">{routine.title}</Text>
            <Text className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {routine.category}  ·  {scheduleLabel(routine)}
              {routine.reminderTime ? `  ·  🔔 ${routine.reminderTime}` : ''}
            </Text>
          </View>
        </View>

        {/* 통계 요약 */}
        <View className="mt-4 flex-row gap-3">
          <StatCard
            label={streakCardLabel(routine)}
            value={`${streakEmoji(routine)} ${streak}`}
            unit="일"
          />
          <StatCard label={isAvoid(routine) ? '최장 유지' : '최장 스트릭'} value={`🏆 ${longest}`} unit="일" />
          <StatCard
            label={isAvoid(routine) ? '30일 유지율' : '30일 달성률'}
            value={`${Math.round(rate.rate * 100)}`}
            unit="%"
          />
        </View>

        {/* 달력 */}
        <View className="mt-4 rounded-2xl bg-white p-5 dark:bg-gray-800">
          <View className="mb-4 flex-row items-center justify-between">
            <Pressable onPress={goPrev} hitSlop={8} className="p-1 active:opacity-60">
              <Ionicons name="chevron-back" size={20} color="#9ca3af" />
            </Pressable>
            <Text className="text-base font-semibold text-gray-900 dark:text-white">
              {monthTitle(year, month)}
            </Text>
            <Pressable onPress={goNext} hitSlop={8} className="p-1 active:opacity-60">
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </Pressable>
          </View>

          {/* 요일 헤더 */}
          <View className="mb-1 flex-row">
            {WEEKDAY_SHORT.map((w, i) => (
              <Text
                key={w}
                className={`flex-1 text-center text-xs ${
                  i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
                }`}
              >
                {w}
              </Text>
            ))}
          </View>

          {/* 날짜 그리드 */}
          {weeks.map((week, wi) => (
            <View key={wi} className="flex-row">
              {week.map((cell) => {
                if (!cell.inMonth) {
                  return <View key={cell.key} className="flex-1 items-center py-1.5" />;
                }
                const due = isDueOn(routine, cell.key);
                const completed = doneSet.has(`${routine.id}|${cell.key}`);
                const existed = routine.createdAt.slice(0, 10) <= cell.key;
                const future = cell.key > today;
                const isToday = cell.key === today;
                // 소급 수정은 최근 7일 이내만 허용
                const interactive = due && existed && !future && cell.key >= minEditKey;

                let circle = 'border-2 border-transparent';
                let textColor = 'text-gray-300 dark:text-gray-600';
                if (completed) {
                  circle = 'bg-emerald-500';
                  textColor = 'text-white';
                } else if (due && existed && !future) {
                  circle = 'border-2 border-rose-300 dark:border-rose-500/50';
                  textColor = 'text-gray-600 dark:text-gray-300';
                } else if (due && future) {
                  circle = 'border border-dashed border-gray-300 dark:border-gray-600';
                  textColor = 'text-gray-400 dark:text-gray-500';
                }
                if (isToday && !completed) circle = `${circle} border-2 border-emerald-500`;

                return (
                  <Pressable
                    key={cell.key}
                    disabled={!interactive}
                    onPress={() => handleToggleDay(cell.key)}
                    className="flex-1 items-center py-1"
                  >
                    <View className={`h-9 w-9 items-center justify-center rounded-full ${circle}`}>
                      <Text className={`text-xs font-medium ${textColor}`}>{cell.day}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}

          {/* 범례 */}
          <View className="mt-4 flex-row flex-wrap gap-x-4 gap-y-1.5">
            <Legend swatch="bg-emerald-500" label={isAvoid(routine) ? '지킴' : '완료'} />
            <Legend swatch="border-2 border-rose-300" label={isAvoid(routine) ? '실패' : '놓침'} />
            <Legend swatch="border border-dashed border-gray-300" label="예정" />
            <Legend swatch="" label="쉬는 날" />
          </View>
          <Text className="mt-3 text-xs text-gray-400 dark:text-gray-500">
            최근 7일 이내의 기록만 눌러서 수정할 수 있어요.
          </Text>
        </View>
      </ScrollView>

      <CelebrationOverlay visible={celebrate} onHide={() => setCelebrate(false)} />
    </SafeAreaView>
  );
}

function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-white p-4 dark:bg-gray-800">
      <Text className="text-xs text-gray-500 dark:text-gray-400">{label}</Text>
      <Text className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
        {value}
        <Text className="text-xs font-normal text-gray-400"> {unit}</Text>
      </Text>
    </View>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <View className="flex-row items-center">
      <View className={`mr-1.5 h-4 w-4 rounded-full ${swatch || 'bg-gray-100 dark:bg-gray-700'}`} />
      <Text className="text-xs text-gray-500 dark:text-gray-400">{label}</Text>
    </View>
  );
}
