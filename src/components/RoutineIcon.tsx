import { Text, View } from 'react-native';
import { Category, Routine } from '../types';

/** 카테고리별 은은한 틴트 (라이트/다크 모두 자연스러운 반투명) */
const CATEGORY_TINT: Record<Category, string> = {
  건강: 'rgba(16,185,129,0.16)', // emerald
  학습: 'rgba(59,130,246,0.16)', // blue
  자기계발: 'rgba(139,92,246,0.16)', // violet
  생활: 'rgba(245,158,11,0.16)', // amber
  재테크: 'rgba(236,72,153,0.16)', // pink
};

/** 이모지를 카테고리 색 둥근 타일에 담아 보여주는 아이콘 */
export function RoutineIcon({ routine, size = 44 }: { routine: Routine; size?: number }) {
  return (
    <View
      className="items-center justify-center rounded-2xl"
      style={{ width: size, height: size, backgroundColor: CATEGORY_TINT[routine.category] }}
    >
      <Text style={{ fontSize: Math.round(size * 0.5) }}>{routine.icon}</Text>
    </View>
  );
}
