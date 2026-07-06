import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { getAdvice, getWeeklyReport, isConfigured } from '../../src/lib/anthropic';
import { loadWeeklyReport, saveWeeklyReport } from '../../src/storage/storage';
import { useApp } from '../../src/store/AppContext';
import { WeeklyReport } from '../../src/types';
import { weekStartKey } from '../../src/utils/date';

/** 주간 리포트 재생성 비용 통제: 한 주에 최대 생성 횟수 */
const MAX_WEEKLY_GENERATIONS = 3;

export default function AdviceScreen() {
  const { routines, records, diary } = useApp();
  const configured = isConfigured();

  // 주간 리포트
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // 맞춤 조언
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);

  useEffect(() => {
    loadWeeklyReport().then(setReport);
  }, []);

  const isThisWeek = report?.weekStart === weekStartKey();
  const usedThisWeek = isThisWeek ? (report?.generations ?? 0) : 0;
  const remaining = MAX_WEEKLY_GENERATIONS - usedThisWeek;

  const generateReport = async () => {
    if (remaining <= 0) {
      setReportError(
        `이번 주 생성 횟수(${MAX_WEEKLY_GENERATIONS}회)를 모두 사용했어요. 다음 주에 다시 받을 수 있어요.`,
      );
      return;
    }
    setReportLoading(true);
    setReportError(null);
    try {
      const text = await getWeeklyReport(routines, records, diary);
      const next: WeeklyReport = {
        weekStart: weekStartKey(),
        text,
        generatedAt: new Date().toISOString(),
        generations: usedThisWeek + 1,
      };
      await saveWeeklyReport(next);
      setReport(next);
    } catch (e) {
      setReportError(e instanceof Error ? e.message : '알 수 없는 오류가 발생했어요.');
    } finally {
      setReportLoading(false);
    }
  };

  const requestAdvice = async () => {
    setAdviceLoading(true);
    setAdviceError(null);
    try {
      setAdvice(await getAdvice(routines, records));
    } catch (e) {
      setAdviceError(e instanceof Error ? e.message : '알 수 없는 오류가 발생했어요.');
    } finally {
      setAdviceLoading(false);
    }
  };

  const reportDate = report ? new Date(report.generatedAt) : null;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScreenHeader title="AI 조언" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {/* API 키 미설정 안내 */}
        {!configured && (
          <View className="mb-2 rounded-2xl bg-orange-50 p-4 dark:bg-orange-500/10">
            <Text className="text-sm font-medium text-orange-700 dark:text-orange-300">
              ⚠️ API 키가 설정되지 않았어요
            </Text>
            <Text className="mt-1 text-xs text-orange-600 dark:text-orange-400">
              .env 파일에 ANTHROPIC_API_KEY 를 추가한 뒤 앱을 다시 시작해 주세요.
            </Text>
          </View>
        )}

        {/* ===== 주간 리포트 ===== */}
        <Text className="mb-2 mt-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
          📊 주간 리포트
        </Text>
        <View className="rounded-2xl bg-white p-5 dark:bg-gray-800">
          {isThisWeek && report ? (
            <>
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-base font-bold text-gray-900 dark:text-white">
                  이번 주 리포트
                </Text>
                {reportDate && (
                  <Text className="text-xs text-gray-400">
                    {reportDate.getMonth() + 1}월 {reportDate.getDate()}일 생성
                  </Text>
                )}
              </View>
              <Text className="text-[15px] leading-7 text-gray-700 dark:text-gray-200">
                {report.text}
              </Text>
              <Pressable
                onPress={generateReport}
                disabled={reportLoading || !configured || remaining <= 0}
                className={`mt-4 flex-row items-center justify-center rounded-xl py-2.5 dark:bg-gray-700 ${
                  remaining <= 0 ? 'bg-gray-100/60 dark:bg-gray-700/50' : 'bg-gray-100 active:opacity-70'
                }`}
              >
                {reportLoading ? (
                  <ActivityIndicator color="#10b981" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={15} color="#6b7280" />
                    <Text className="ml-1.5 text-sm font-medium text-gray-600 dark:text-gray-300">
                      {remaining > 0 ? `다시 생성 (이번 주 ${remaining}회 남음)` : '이번 주 생성 횟수 소진'}
                    </Text>
                  </>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Text className="text-sm leading-6 text-gray-500 dark:text-gray-400">
                이번 주 한 주를 돌아보는 요약과 다음 주 목표를 AI가 정리해 드려요.
              </Text>
              <Pressable
                onPress={generateReport}
                disabled={reportLoading || !configured}
                className={`mt-4 flex-row items-center justify-center rounded-xl py-3 active:opacity-80 ${
                  reportLoading || !configured ? 'bg-emerald-500/40' : 'bg-emerald-500'
                }`}
              >
                {reportLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="document-text-outline" size={17} color="#ffffff" />
                    <Text className="ml-2 text-base font-semibold text-white">주간 리포트 생성</Text>
                  </>
                )}
              </Pressable>
            </>
          )}
          {reportError && (
            <Text className="mt-3 text-sm text-red-500 dark:text-red-400">{reportError}</Text>
          )}
        </View>

        {/* ===== 맞춤 조언 ===== */}
        <Text className="mb-2 mt-7 text-sm font-semibold text-gray-500 dark:text-gray-400">
          💬 맞춤 조언
        </Text>
        <View className="rounded-2xl bg-white p-5 dark:bg-gray-800">
          <Text className="text-sm leading-6 text-gray-500 dark:text-gray-400">
            최근 7일 데이터를 바탕으로 지금 가장 도움이 될 한마디를 받아보세요.
          </Text>
          <Pressable
            onPress={requestAdvice}
            disabled={adviceLoading || !configured}
            className={`mt-4 flex-row items-center justify-center rounded-xl py-3 active:opacity-80 ${
              adviceLoading || !configured ? 'bg-emerald-500/40' : 'bg-emerald-500'
            }`}
          >
            {adviceLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="sparkles" size={17} color="#ffffff" />
                <Text className="ml-2 text-base font-semibold text-white">AI 조언 받기</Text>
              </>
            )}
          </Pressable>

          {adviceError && (
            <Text className="mt-3 text-sm text-red-500 dark:text-red-400">{adviceError}</Text>
          )}
          {advice && !adviceLoading && (
            <View className="mt-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-700/40">
              <Text className="text-[15px] leading-6 text-gray-700 dark:text-gray-200">
                🤖 {advice}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
