import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CelebrationOverlay } from '../../src/components/CelebrationOverlay';
import { HomeHeader } from '../../src/components/HomeHeader';
import { ProgressBar } from '../../src/components/ProgressBar';
import { RoutineCheckItem } from '../../src/components/RoutineCheckItem';
import { SectionLabel } from '../../src/components/SectionLabel';
import { useApp } from '../../src/store/AppContext';
import { activeRoutines, dueTodayRoutines, todayProgress } from '../../src/utils/stats';

export default function HomeScreen() {
  const { routines, records, toggleToday, isDoneToday, getStreak } = useApp();
  const active = activeRoutines(routines);
  const due = dueTodayRoutines(routines);
  const { done, total, ratio } = todayProgress(routines, records);

  const [celebrate, setCelebrate] = useState(false);

  // 축하는 "홈에서 사용자가 마지막 남은 루틴을 직접 체크"할 때만 띄운다.
  // (상세 화면 토글이나 루틴 삭제로 인한 done===total 에는 반응하지 않음)
  const handleToggle = (id: string) => {
    const wasDone = isDoneToday(id);
    toggleToday(id);
    if (!wasDone) {
      const remaining = due.filter((x) => x.id !== id && !isDoneToday(x.id)).length;
      if (remaining === 0) setCelebrate(true);
    }
  };

  const motivation =
    total === 0
      ? '오늘은 예정된 루틴이 없어요.'
      : done === total
        ? '오늘 루틴을 모두 끝냈어요! 🎉'
        : `${total - done}개 남았어요. 조금만 더 화이팅! 💪`;

  const buildDue = due.filter((r) => r.kind !== 'avoid');
  const avoidDue = due.filter((r) => r.kind === 'avoid');
  const showGroups = buildDue.length > 0 && avoidDue.length > 0;

  const renderItem = (r: (typeof due)[number]) => (
    <RoutineCheckItem
      key={r.id}
      routine={r}
      completed={isDoneToday(r.id)}
      streak={getStreak(r.id)}
      onToggle={() => handleToggle(r.id)}
      onOpen={() => router.push(`/routine/${r.id}`)}
    />
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50 dark:bg-gray-950">
      <HomeHeader />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {/* 오늘 요약 카드 */}
        <View className="mb-5 rounded-3xl bg-white p-5 dark:bg-gray-800">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-gray-700 dark:text-gray-200">
              오늘의 루틴
            </Text>
            <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {done}/{total} 완료
            </Text>
          </View>
          <View className="mt-3">
            <ProgressBar ratio={ratio} />
          </View>
          <Text className="mt-3 text-xs text-gray-400 dark:text-gray-500">{motivation}</Text>
        </View>

        {active.length === 0 ? (
          <View className="mt-12 items-center">
            <Text className="text-4xl">🌱</Text>
            <Text className="mt-3 text-center text-gray-400 dark:text-gray-500">
              아직 루틴이 없어요.{'\n'}'루틴' 탭에서 새 습관을 추가해 보세요!
            </Text>
          </View>
        ) : due.length === 0 ? (
          <View className="mt-12 items-center">
            <Text className="text-4xl">☕</Text>
            <Text className="mt-3 text-center text-gray-400 dark:text-gray-500">
              오늘은 예정된 루틴이 없어요.{'\n'}푹 쉬어가는 것도 습관의 일부예요!
            </Text>
          </View>
        ) : (
          <>
            {showGroups && <SectionLabel text="✅ 실천" />}
            {buildDue.map(renderItem)}
            {showGroups && <SectionLabel text="🛡️ 유지" />}
            {avoidDue.map(renderItem)}
          </>
        )}
      </ScrollView>

      <CelebrationOverlay visible={celebrate} onHide={() => setCelebrate(false)} />
    </SafeAreaView>
  );
}
