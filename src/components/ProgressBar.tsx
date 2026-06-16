import { View } from 'react-native';

interface Props {
  ratio: number; // 0 ~ 1
}

export function ProgressBar({ ratio }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  return (
    <View className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
      <View className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
    </View>
  );
}
