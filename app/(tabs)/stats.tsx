import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CelebrationOverlay } from '../../src/components/CelebrationOverlay';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { SectionLabel } from '../../src/components/SectionLabel';
import {
  loadAchievementsCelebrated,
  saveAchievementsCelebrated,
} from '../../src/storage/storage';
import { useApp } from '../../src/store/AppContext';
import { Badge, computeBadges, computeRecords, earnedCount } from '../../src/utils/achievements';
import {
  bestWorst,
  RoutineRate,
  routineRates,
  weeklyData,
} from '../../src/utils/stats';

export default function StatsScreen() {
  const { routines, records } = useApp();
  const week = weeklyData(routines, records);
  const rates = routineRates(routines, records, 7);
  const { best, worst } = bestWorst(rates);
  const badges = computeBadges(routines, records);
  const earned = earnedCount(badges);
  const myRecords = computeRecords(routines, records);
  const allEarned = badges.length > 0 && earned === badges.length;

  // 전체 성취 달성 시 1회성 '명예의 전당' 세리머니
  const [ceremony, setCeremony] = useState(false);
  useEffect(() => {
    (async () => {
      const celebrated = await loadAchievementsCelebrated();
      if (allEarned && !celebrated) {
        setCeremony(true);
        await saveAchievementsCelebrated(true);
      } else if (!allEarned && celebrated) {
        // 데이터 초기화 등으로 미완성이 되면 다음 완성 때 다시 축하
        await saveAchievementsCelebrated(false);
      }
    })();
  }, [allEarned]);
  const buildRates = rates.filter((r) => r.routine.kind !== 'avoid');
  const avoidRates = rates.filter((r) => r.routine.kind === 'avoid');
  const showRateGroups = buildRates.length > 0 && avoidRates.length > 0;

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
          <>
            {showRateGroups && <SectionLabel text="✅ 실천형" />}
            {buildRates.map((r) => (
              <RateBar key={r.routine.id} rate={r} />
            ))}
            {showRateGroups && <SectionLabel text="🛡️ 유지형" />}
            {avoidRates.map((r) => (
              <RateBar key={r.routine.id} rate={r} />
            ))}
          </>
        )}

        {/* 성취 배지 */}
        <View className="mb-3 mt-7 flex-row items-center justify-between">
          <Text className="text-base font-semibold text-gray-900 dark:text-white">🏅 성취</Text>
          <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {earned}/{badges.length}
          </Text>
        </View>
        <View className="flex-row flex-wrap justify-between">
          {badges.map((b) => (
            <BadgeCell key={b.id} badge={b} />
          ))}
        </View>

        {/* 기록 경신 (자기 기록) */}
        <Text className="mb-3 mt-7 text-base font-semibold text-gray-900 dark:text-white">
          🏆 기록 경신
        </Text>
        <View className="flex-row gap-3">
          <RecordCard label="최장 연속" value={myRecords.bestStreak} unit="일" />
          <RecordCard label="누적 완료" value={myRecords.totalDone} unit="회" />
          <RecordCard label="완벽한 하루" value={myRecords.perfectDays} unit="일" />
        </View>
        <Text className="mt-2 px-1 text-xs text-gray-400 dark:text-gray-500">
          내 최고 기록에 도전해 보세요. 천장 없이 계속 갱신돼요.
        </Text>
      </ScrollView>

      <CelebrationOverlay
        visible={ceremony}
        onHide={() => setCeremony(false)}
        emoji="👑"
        title="명예의 전당 입성!"
        subtitle={'모든 성취를 달성했어요.\n배지는 표식일 뿐, 당신은 이미 습관을 만들었어요.'}
        manualDismiss
      />
    </SafeAreaView>
  );
}

function RecordCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <View className="flex-1 items-center rounded-2xl bg-white p-4 dark:bg-gray-800">
      <Text className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
        {value}
        <Text className="text-xs font-normal text-gray-400"> {unit}</Text>
      </Text>
      <Text className="mt-1 text-xs text-gray-500 dark:text-gray-400">{label}</Text>
    </View>
  );
}

function RateBar({ rate }: { rate: RoutineRate }) {
  const pct = Math.round(rate.rate * 100);
  return (
    <View className="mb-4">
      <View className="mb-1.5 flex-row justify-between">
        <Text className="text-sm text-gray-700 dark:text-gray-300">
          {rate.routine.icon} {rate.routine.title}
        </Text>
        <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          {rate.done}/{rate.total}일 · {pct}%
        </Text>
      </View>
      <View className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <View className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(2, pct)}%` }} />
      </View>
    </View>
  );
}

function BadgeCell({ badge }: { badge: Badge }) {
  const pct = Math.round((badge.current / badge.target) * 100);
  return (
    <View className="mb-3 w-[31%] items-center rounded-2xl bg-white p-3 dark:bg-gray-800">
      <Text className={`text-3xl ${badge.earned ? '' : 'opacity-25'}`}>{badge.icon}</Text>
      <Text
        className={`mt-1 text-center text-xs font-semibold ${
          badge.earned ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
        }`}
        numberOfLines={1}
      >
        {badge.title}
      </Text>
      {badge.earned ? (
        <Text className="mt-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
          획득 ✓
        </Text>
      ) : (
        <View className="mt-1.5 w-full">
          <View className="h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <View className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
          </View>
          <Text className="mt-1 text-center text-[10px] text-gray-400">
            {badge.current}/{badge.target}
          </Text>
        </View>
      )}
    </View>
  );
}
