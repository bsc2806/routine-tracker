import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CelebrationOverlay } from '../../src/components/CelebrationOverlay';
import { ProgressBar } from '../../src/components/ProgressBar';
import { RoutineCheckItem } from '../../src/components/RoutineCheckItem';
import { useApp } from '../../src/store/AppContext';
import { formatKorean } from '../../src/utils/date';
import { activeRoutines, dueTodayRoutines, todayProgress } from '../../src/utils/stats';

export default function HomeScreen() {
  const { routines, records, toggleToday, isDoneToday, getStreak } = useApp();
  const active = activeRoutines(routines);
  const due = dueTodayRoutines(routines);
  const { done, total, ratio } = todayProgress(routines, records);

  const [celebrate, setCelebrate] = useState(false);
  const prevDone = useRef(done);
  useEffect(() => {
    if (total > 0 && done === total && prevDone.current < total) {
      setCelebrate(true);
    }
    prevDone.current = done;
  }, [done, total]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text className="text-sm text-gray-500 dark:text-gray-400">
          {formatKorean(new Date())}
        </Text>
        <Text className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
          오늘의 루틴
        </Text>

        <View className="mb-6 mt-5">
          <View className="mb-2 flex-row justify-between">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">완료율</Text>
            <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {done}/{total} 완료
            </Text>
          </View>
          <ProgressBar ratio={ratio} />
        </View>

        {active.length === 0 ? (
          <View className="mt-16 items-center">
            <Text className="text-4xl">🌱</Text>
            <Text className="mt-3 text-center text-gray-400 dark:text-gray-500">
              아직 루틴이 없어요.{'\n'}'루틴' 탭에서 새 습관을 추가해 보세요!
            </Text>
          </View>
        ) : due.length === 0 ? (
          <View className="mt-16 items-center">
            <Text className="text-4xl">☕</Text>
            <Text className="mt-3 text-center text-gray-400 dark:text-gray-500">
              오늘은 예정된 루틴이 없어요.{'\n'}푹 쉬어가는 것도 습관의 일부예요!
            </Text>
          </View>
        ) : (
          due.map((r) => (
            <RoutineCheckItem
              key={r.id}
              routine={r}
              completed={isDoneToday(r.id)}
              streak={getStreak(r.id)}
              onToggle={() => toggleToday(r.id)}
            />
          ))
        )}
      </ScrollView>

      <CelebrationOverlay visible={celebrate} onHide={() => setCelebrate(false)} />
    </SafeAreaView>
  );
}
