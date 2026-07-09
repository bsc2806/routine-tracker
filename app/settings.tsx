import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { exportBackup, pickBackup } from '../src/lib/backup';
import { useApp } from '../src/store/AppContext';
import { ThemeMode } from '../src/types';

const THEME_OPTIONS: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'system', label: '시스템', icon: 'phone-portrait' },
  { key: 'light', label: '라이트', icon: 'sunny' },
  { key: 'dark', label: '다크', icon: 'moon' },
];

export default function SettingsScreen() {
  const { routines, records, settings, setTheme, setAiConsent, importData, resetData } = useApp();
  const [busy, setBusy] = useState<null | 'export' | 'import'>(null);

  const handleExport = async () => {
    try {
      setBusy('export');
      await exportBackup(routines, records);
    } catch (e) {
      Alert.alert('내보내기 실패', e instanceof Error ? e.message : '오류가 발생했어요.');
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async () => {
    try {
      setBusy('import');
      const data = await pickBackup();
      if (!data) return;
      Alert.alert(
        '데이터 복원',
        `루틴 ${data.routines.length}개, 기록 ${data.records.length}건을 불러옵니다.\n현재 데이터는 덮어써집니다. 계속할까요?`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '복원',
            style: 'destructive',
            onPress: async () => {
              await importData(data.routines, data.records);
              Alert.alert('완료', '데이터를 복원했어요.');
            },
          },
        ],
      );
    } catch (e) {
      Alert.alert('가져오기 실패', e instanceof Error ? e.message : '오류가 발생했어요.');
    } finally {
      setBusy(null);
    }
  };

  const handleReset = () => {
    Alert.alert('데이터 초기화', '모든 루틴과 기록을 지우고 처음 상태(샘플 3개)로 되돌릴까요?', [
      { text: '취소', style: 'cancel' },
      { text: '초기화', style: 'destructive', onPress: () => resetData() },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={8} className="p-1 active:opacity-60">
          <Ionicons name="chevron-back" size={26} color="#10b981" />
        </Pressable>
        <Text className="ml-1 text-lg font-bold text-gray-900 dark:text-white">설정</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4 }}>
        {/* 테마 */}
        <Text className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">화면 테마</Text>
        <View className="mb-6 flex-row gap-2">
          {THEME_OPTIONS.map((opt) => {
            const selected = settings.theme === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setTheme(opt.key)}
                className={`flex-1 items-center rounded-2xl py-4 ${
                  selected ? 'bg-emerald-500' : 'bg-white dark:bg-gray-800'
                }`}
              >
                <Ionicons
                  name={opt.icon}
                  size={20}
                  color={selected ? '#ffffff' : '#9ca3af'}
                />
                <Text
                  className={`mt-1.5 text-sm font-medium ${
                    selected ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 데이터 관리 */}
        <Text className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          데이터 관리
        </Text>
        <View className="overflow-hidden rounded-2xl bg-white dark:bg-gray-800">
          <Row
            icon="cloud-upload-outline"
            title="데이터 내보내기"
            subtitle="루틴·기록을 JSON 파일로 백업"
            onPress={handleExport}
            busy={busy === 'export'}
          />
          <Divider />
          <Row
            icon="cloud-download-outline"
            title="데이터 가져오기"
            subtitle="백업 파일에서 복원 (덮어쓰기)"
            onPress={handleImport}
            busy={busy === 'import'}
          />
          <Divider />
          <Row
            icon="trash-outline"
            title="데이터 초기화"
            subtitle="처음 상태로 되돌리기"
            onPress={handleReset}
            danger
          />
        </View>

        <Text className="mt-4 px-1 text-xs leading-5 text-gray-400 dark:text-gray-500">
          이 앱은 데이터를 기기에만 저장해요(서버 없음). 기기를 바꾸거나 앱을 지우면 데이터가
          사라지니, 가끔 내보내기로 백업해 두는 걸 권장해요.
        </Text>

        {/* AI */}
        <Text className="mb-2 mt-6 text-sm font-medium text-gray-500 dark:text-gray-400">AI</Text>
        <View className="flex-row items-center justify-between rounded-2xl bg-white p-4 dark:bg-gray-800">
          <View className="flex-1 pr-3">
            <Text className="text-base text-gray-900 dark:text-white">AI 데이터 전송 동의</Text>
            <Text className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              조언·리포트를 위해 루틴·기분 요약을 AI로 전송 (일기 본문 제외)
            </Text>
          </View>
          <Switch
            value={!!settings.aiConsent}
            onValueChange={setAiConsent}
            trackColor={{ false: '#d1d5db', true: '#10b981' }}
            thumbColor="#ffffff"
          />
        </View>

        {/* 앱 정보 */}
        <Text className="mb-2 mt-6 text-sm font-medium text-gray-500 dark:text-gray-400">정보</Text>
        <View className="flex-row items-center justify-between rounded-2xl bg-white p-4 dark:bg-gray-800">
          <Text className="text-base text-gray-700 dark:text-gray-200">버전</Text>
          <Text className="text-base text-gray-400">1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  icon,
  title,
  subtitle,
  onPress,
  busy,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  busy?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      className="flex-row items-center p-4 active:bg-gray-50 dark:active:bg-gray-700/40"
    >
      <Ionicons name={icon} size={22} color={danger ? '#ef4444' : '#10b981'} />
      <View className="ml-3 flex-1">
        <Text
          className={`text-base font-medium ${
            danger ? 'text-red-500' : 'text-gray-900 dark:text-white'
          }`}
        >
          {title}
        </Text>
        <Text className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{subtitle}</Text>
      </View>
      {busy ? (
        <ActivityIndicator color="#10b981" />
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
      )}
    </Pressable>
  );
}

function Divider() {
  return <View className="ml-12 h-px bg-gray-100 dark:bg-gray-700" />;
}
