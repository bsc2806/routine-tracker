import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

/**
 * 전 화면 공통 우상단 액션. 현재는 설정 진입.
 * 추후 로그인/프로필이 생기면 이 버튼을 아바타로 교체하면 됨.
 */
export function HeaderSettingsButton() {
  return (
    <Pressable
      onPress={() => router.push('/settings')}
      hitSlop={8}
      className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-70 dark:bg-gray-800"
    >
      <Ionicons name="settings-outline" size={20} color="#6b7280" />
    </Pressable>
  );
}

/** 화면별 큰 타이틀 + 공통 우상단 액션 슬롯 */
export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white">{title}</Text>
      {right ?? <HeaderSettingsButton />}
    </View>
  );
}
