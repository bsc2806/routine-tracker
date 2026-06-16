import { Pressable, Text, View } from 'react-native';
import { Routine } from '../types';

interface Props {
  routine: Routine;
  completed: boolean;
  streak: number;
  onToggle: () => void;
}

export function RoutineCheckItem({ routine, completed, streak, onToggle }: Props) {
  return (
    <Pressable
      onPress={onToggle}
      className="mb-3 flex-row items-center rounded-2xl bg-white p-4 active:opacity-70 dark:bg-gray-800"
    >
      <Text className="text-2xl">{routine.icon}</Text>
      <View className="ml-3 flex-1">
        <Text className="text-base font-semibold text-gray-900 dark:text-white">
          {routine.title}
        </Text>
        <Text className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {routine.category}
          {streak > 0 ? `  ·  🔥 ${streak}일 연속` : ''}
          {routine.reminderTime ? `  ·  🔔 ${routine.reminderTime}` : ''}
        </Text>
      </View>
      <View
        className={`h-7 w-7 items-center justify-center rounded-full border-2 ${
          completed
            ? 'border-emerald-500 bg-emerald-500'
            : 'border-gray-300 dark:border-gray-600'
        }`}
      >
        {completed && <Text className="text-sm font-bold text-white">✓</Text>}
      </View>
    </Pressable>
  );
}
