import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useApp } from '../../src/store/AppContext';
import { Mood, MOODS } from '../../src/types';
import { formatKorean, fromDateKey, toDateKey, todayKey } from '../../src/utils/date';

export default function DiaryScreen() {
  const { diary, getDiary, upsertDiary, deleteDiary } = useApp();
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [mood, setMood] = useState<Mood | undefined>(undefined);
  const [text, setText] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const selectDate = (date: string) => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    setSelectedDate(date);
  };

  const onChangeDate = (event: DateTimePickerEvent, picked?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (event.type === 'set' && picked) setSelectedDate(toDateKey(picked));
  };

  // 선택한 날짜의 저장된 내용 불러오기
  useEffect(() => {
    const entry = getDiary(selectedDate);
    setMood(entry?.mood);
    setText(entry?.text ?? '');
    setSavedFlash(false);
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const isToday = selectedDate === todayKey();
  const exists = getDiary(selectedDate) != null;
  const canSave = mood != null || text.trim().length > 0;

  const handleSave = () => {
    upsertDiary(selectedDate, { mood, text });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const confirmDelete = () => {
    Alert.alert('일기 삭제', `${formatKorean(fromDateKey(selectedDate))} 일기를 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          deleteDiary(selectedDate);
          setMood(undefined);
          setText('');
          setSavedFlash(false);
        },
      },
    ]);
  };

  const past = [...diary].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScreenHeader title="일기" />
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {/* 날짜 (탭하면 지난 날짜 선택) */}
        <View className="mb-5 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => setShowPicker(true)}
              className="flex-row items-center active:opacity-60"
            >
              <Ionicons name="calendar-outline" size={16} color="#10b981" />
              <Text className="ml-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                {formatKorean(fromDateKey(selectedDate))}
                {isToday ? ' · 오늘' : ''}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#9ca3af" style={{ marginLeft: 2 }} />
            </Pressable>
            {exists && (
              <View className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 dark:bg-emerald-500/10">
                <Text className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  작성됨
                </Text>
              </View>
            )}
          </View>
          {!isToday && (
            <Pressable
              onPress={() => setSelectedDate(todayKey())}
              className="rounded-full bg-white px-3 py-1 active:opacity-70 dark:bg-gray-800"
            >
              <Text className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                오늘로
              </Text>
            </Pressable>
          )}
        </View>

        {showPicker && (
          <DateTimePicker
            value={fromDateKey(selectedDate)}
            mode="date"
            maximumDate={new Date()}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={onChangeDate}
          />
        )}

        {/* 기분 */}
        <View className="rounded-2xl bg-white p-5 dark:bg-gray-800">
          <Text className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            오늘 기분은 어때요?
          </Text>
          <View className="flex-row justify-between">
            {MOODS.map((m) => {
              const selected = mood === m.value;
              return (
                <Pressable
                  key={m.value}
                  onPress={() => setMood(selected ? undefined : m.value)}
                  className="items-center"
                >
                  <View
                    className={`h-12 w-12 items-center justify-center rounded-full border-2 ${
                      selected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                        : 'border-transparent bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    <Text className="text-2xl">{m.emoji}</Text>
                  </View>
                  <Text
                    className={`mt-1 text-[10px] ${
                      selected ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
                    }`}
                  >
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 본문 */}
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="오늘 하루를 기록해 보세요."
            placeholderTextColor="#9ca3af"
            multiline
            textAlignVertical="top"
            className="mt-5 min-h-[120px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base leading-6 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />

          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            className={`mt-4 items-center rounded-xl py-3 active:opacity-80 ${
              savedFlash ? 'bg-emerald-600' : canSave ? 'bg-emerald-500' : 'bg-emerald-500/40'
            }`}
          >
            <Text className="text-base font-semibold text-white">
              {savedFlash ? '저장됨 ✓' : '저장'}
            </Text>
          </Pressable>

          {exists && (
            <Pressable onPress={confirmDelete} className="mt-2 items-center py-2 active:opacity-60">
              <Text className="text-sm font-medium text-red-500">이 날 일기 삭제</Text>
            </Pressable>
          )}
        </View>

        {/* 지난 기록 */}
        <Text className="mb-3 mt-7 text-base font-semibold text-gray-900 dark:text-white">
          지난 기록
        </Text>
        {past.length === 0 ? (
          <Text className="mt-2 text-center text-gray-400 dark:text-gray-500">
            아직 작성한 일기가 없어요.
          </Text>
        ) : (
          past.map((e) => {
            const moodEmoji = MOODS.find((m) => m.value === e.mood)?.emoji;
            return (
              <Pressable
                key={e.date}
                onPress={() => selectDate(e.date)}
                className={`mb-2 flex-row items-center rounded-2xl bg-white p-4 active:opacity-70 dark:bg-gray-800 ${
                  e.date === selectedDate ? 'border border-emerald-500' : ''
                }`}
              >
                <Text className="text-2xl">{moodEmoji ?? '📝'}</Text>
                <View className="ml-3 flex-1">
                  <Text className="text-xs text-gray-400 dark:text-gray-500">
                    {formatKorean(fromDateKey(e.date))}
                  </Text>
                  {e.text.length > 0 && (
                    <Text
                      className="mt-0.5 text-sm text-gray-700 dark:text-gray-200"
                      numberOfLines={1}
                    >
                      {e.text}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
