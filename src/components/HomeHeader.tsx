import { Text, View } from 'react-native';
import { formatKorean } from '../utils/date';
import { HeaderSettingsButton } from './ScreenHeader';

function greeting(d: Date): string {
  const h = d.getHours();
  if (h < 5) return '편안한 밤이에요'; // 0~4시
  if (h < 12) return '좋은 아침이에요'; // 5~11시
  if (h < 18) return '좋은 오후예요'; // 12~17시
  return '좋은 저녁이에요'; // 18~23시
}

/** 홈 전용 개인화 헤더: 인사말 + 날짜 + 공통 우상단 액션 */
export function HomeHeader() {
  const now = new Date();
  return (
    <View className="flex-row items-start justify-between px-5 pb-3 pt-2">
      <View className="flex-1">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting(now)} 👋
        </Text>
        <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">{formatKorean(now)}</Text>
      </View>
      <HeaderSettingsButton />
    </View>
  );
}
