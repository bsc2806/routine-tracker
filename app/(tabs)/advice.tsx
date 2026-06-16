import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAdvice, isConfigured } from '../../src/lib/anthropic';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useApp } from '../../src/store/AppContext';

export default function AdviceScreen() {
  const { routines, records } = useApp();
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const configured = isConfigured();

  const handlePress = async () => {
    setLoading(true);
    setError(null);
    try {
      const text = await getAdvice(routines, records);
      setAdvice(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScreenHeader title="AI 조언" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text className="text-sm text-gray-500 dark:text-gray-400">
          최근 7일 루틴 데이터를 분석해 맞춤 조언을 드려요.
        </Text>

        {/* API 키 미설정 안내 */}
        {!configured && (
          <View className="mt-5 rounded-2xl bg-orange-50 p-4 dark:bg-orange-500/10">
            <Text className="text-sm font-medium text-orange-700 dark:text-orange-300">
              ⚠️ API 키가 설정되지 않았어요
            </Text>
            <Text className="mt-1 text-xs text-orange-600 dark:text-orange-400">
              .env 파일에 ANTHROPIC_API_KEY 를 추가한 뒤 앱을 다시 시작해 주세요.
            </Text>
          </View>
        )}

        {/* 조언 받기 버튼 */}
        <Pressable
          onPress={handlePress}
          disabled={loading || !configured}
          className={`mt-6 flex-row items-center justify-center rounded-2xl py-4 active:opacity-80 ${
            loading || !configured ? 'bg-emerald-500/40' : 'bg-emerald-500'
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="sparkles" size={18} color="#ffffff" />
              <Text className="ml-2 text-base font-semibold text-white">AI 조언 받기</Text>
            </>
          )}
        </Pressable>

        {loading && (
          <Text className="mt-4 text-center text-sm text-gray-400 dark:text-gray-500">
            루틴 데이터를 분석하는 중이에요...
          </Text>
        )}

        {/* 에러 */}
        {error && !loading && (
          <View className="mt-5 rounded-2xl bg-red-50 p-4 dark:bg-red-500/10">
            <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>
          </View>
        )}

        {/* 조언 결과 */}
        {advice && !loading && (
          <View className="mt-5 rounded-2xl bg-white p-5 dark:bg-gray-800">
            <View className="mb-3 flex-row items-center">
              <Text className="text-xl">🤖</Text>
              <Text className="ml-2 text-base font-semibold text-gray-900 dark:text-white">
                코치의 조언
              </Text>
            </View>
            <Text className="text-[15px] leading-6 text-gray-700 dark:text-gray-200">
              {advice}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
