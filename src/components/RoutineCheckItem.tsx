import { Pressable, Text, View } from 'react-native';
import { Routine } from '../types';
import { streakLabel } from '../utils/kind';

interface Props {
  routine: Routine;
  completed: boolean;
  streak: number;
  onToggle: () => void;
  onOpen?: () => void;
}

export function RoutineCheckItem({ routine, completed, streak, onToggle, onOpen }: Props) {
  return (
    <View className="mb-3 flex-row items-center rounded-2xl bg-white p-4 dark:bg-gray-800">
      <Pressable onPress={onOpen} className="flex-1 flex-row items-center active:opacity-60">
        <Text className="text-2xl">{routine.icon}</Text>
        <View className="ml-3 flex-1">
          <Text className="text-base font-semibold text-gray-900 dark:text-white">
            {routine.title}
          </Text>
          <Text className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {routine.category}
            {streak > 0 ? `  ·  ${streakLabel(routine, streak)}` : ''}
            {routine.reminderTime ? `  ·  🔔 ${routine.reminderTime}` : ''}
          </Text>
        </View>
      </Pressable>
      <Pressable onPress={onToggle} hitSlop={8} className="pl-3 active:opacity-60">
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
    </View>
  );
}
