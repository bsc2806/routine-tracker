import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useApp } from '../../src/store/AppContext';
import {
  bestWorst,
  routineRates,
  weeklyData,
} from '../../src/utils/stats';

export default function StatsScreen() {
  const { routines, records } = useApp();
  const week = weeklyData(routines, records);
  const rates = routineRates(routines, records, 7);
  const { best, worst } = bestWorst(rates);

  const weekAvg =
    week.length > 0 ? Math.round((week.reduce((s, d) => s + d.ratio, 0) / week.length) * 100) : 0;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScreenHeader title="통계" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {/* 주간 달성률 막대 그래프 */}
        <View className="rounded-2xl bg-white p-5 dark:bg-gray-800">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-base font-semibold text-gray-900 dark:text-white">
              주간 달성률
            </Text>
            <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              평균 {weekAvg}%
            </Text>
          </View>
          <View className="h-36 flex-row items-end justify-between">
            {week.map((d) => (
              <View key={d.key} className="flex-1 items-center">
                <View className="mb-1.5 h-24 w-6 justify-end overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <View
                    className="w-full rounded-full bg-emerald-500"
                    style={{ height: `${Math.max(4, Math.round(d.ratio * 100))}%` }}
                  />
                </View>
                <Text className="text-[11px] text-gray-400 dark:text-gray-500">{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 하이라이트 */}
        {best && worst && (
          <View className="mt-4 flex-row gap-3">
            <View className="flex-1 rounded-2xl bg-white p-4 dark:bg-gray-800">
              <Text className="text-xs text-gray-500 dark:text-gray-400">🏆 가장 잘 지킨</Text>
              <Text className="mt-1 text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                {best.routine.icon} {best.routine.title}
              </Text>
              <Text className="mt-0.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {Math.round(best.rate * 100)}%
              </Text>
            </View>
            <View className="flex-1 rounded-2xl bg-white p-4 dark:bg-gray-800">
              <Text className="text-xs text-gray-500 dark:text-gray-400">⚠️ 가장 놓친</Text>
              <Text className="mt-1 text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                {worst.routine.icon} {worst.routine.title}
              </Text>
              <Text className="mt-0.5 text-sm font-semibold text-orange-500">
                {Math.round(worst.rate * 100)}%
              </Text>
            </View>
          </View>
        )}

        {/* 루틴별 달성률 */}
        <Text className="mb-3 mt-6 text-base font-semibold text-gray-900 dark:text-white">
          루틴별 달성률 (최근 7일)
        </Text>
        {rates.length === 0 ? (
          <Text className="mt-4 text-center text-gray-400 dark:text-gray-500">
            데이터가 없어요. 루틴을 추가하고 체크해 보세요!
          </Text>
        ) : (
          rates.map((r) => {
            const pct = Math.round(r.rate * 100);
            return (
              <View key={r.routine.id} className="mb-4">
                <View className="mb-1.5 flex-row justify-between">
                  <Text className="text-sm text-gray-700 dark:text-gray-300">
                    {r.routine.icon} {r.routine.title}
                  </Text>
                  <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {r.done}/{r.total}일 · {pct}%
                  </Text>
                </View>
                <View className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <View
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.max(2, pct)}%` }}
                  />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
