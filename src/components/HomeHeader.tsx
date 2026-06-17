import { Text, View } from 'react-native';
import { useApp } from '../store/AppContext';
import { computeBadges, currentTitle } from '../utils/achievements';
import { formatKorean } from '../utils/date';
import { HeaderSettingsButton } from './ScreenHeader';

function greeting(d: Date): string {
  const h = d.getHours();
  if (h < 5) return '편안한 밤이에요'; // 0~4시
  if (h < 12) return '좋은 아침이에요'; // 5~11시
  if (h < 18) return '좋은 오후예요'; // 12~17시
  return '좋은 저녁이에요'; // 18~23시
}

/** 홈 전용 개인화 헤더: 인사말 + 날짜 + 칭호 + 공통 우상단 액션 */
export function HomeHeader() {
  const { routines, records } = useApp();
  const now = new Date();
  const title = currentTitle(computeBadges(routines, records));

  return (
    <View className="flex-row items-start justify-between px-5 pb-3 pt-2">
      <View className="flex-1">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting(now)} 👋
        </Text>
        <View className="mt-1 flex-row items-center">
          <Text className="text-sm text-gray-500 dark:text-gray-400">{formatKorean(now)}</Text>
          <View className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 dark:bg-emerald-500/10">
            <Text className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              🏅 {title}
            </Text>
          </View>
        </View>
      </View>
      <HeaderSettingsButton />
    </View>
  );
}
