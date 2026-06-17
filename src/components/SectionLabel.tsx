import { Text } from 'react-native';

/** 목록 그룹 구분용 작은 라벨 */
export function SectionLabel({ text }: { text: string }) {
  return (
    <Text className="mb-2 mt-1 text-xs font-semibold text-gray-400 dark:text-gray-500">
      {text}
    </Text>
  );
}
