import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CATEGORIES, Category, ICON_OPTIONS, Routine, RoutineKind, ScheduleType } from '../types';
import { NewRoutineInput } from '../store/AppContext';
import { WEEKDAY_SHORT } from '../utils/schedule';

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Date -> "HH:mm" */
function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "HH:mm" -> Date (오늘 날짜 기준), 없으면 오전 9시 */
function toTimeDate(time?: string): Date {
  const d = new Date();
  if (time) {
    const [h, m] = time.split(':').map(Number);
    d.setHours(h, m, 0, 0);
  } else {
    d.setHours(9, 0, 0, 0);
  }
  return d;
}

interface Props {
  visible: boolean;
  /** 수정 대상 (없으면 새로 추가) */
  editing?: Routine | null;
  onClose: () => void;
  onSubmit: (input: NewRoutineInput) => void;
  /** 이름 검증 — 문제가 있으면 메시지, 없으면 null */
  validateName?: (name: string, editingId?: string) => string | null;
}

export function RoutineFormModal({ visible, editing, onClose, onSubmit, validateName }: Props) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<RoutineKind>('build');
  const [category, setCategory] = useState<Category>('건강');
  const [icon, setIcon] = useState<string>(ICON_OPTIONS[0]);
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [days, setDays] = useState<number[]>([]);
  const [reminderOn, setReminderOn] = useState(false);
  const [time, setTime] = useState<Date>(toTimeDate());
  const [showPicker, setShowPicker] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setTitle(editing?.title ?? '');
      setKind(editing?.kind ?? 'build');
      setCategory(editing?.category ?? '건강');
      setIcon(editing?.icon ?? ICON_OPTIONS[0]);
      setScheduleType(editing?.schedule?.type ?? 'daily');
      setDays(editing?.schedule?.days ?? []);
      setReminderOn(!!editing?.reminderTime);
      setTime(toTimeDate(editing?.reminderTime));
      setShowPicker(false);
      setNameError(null);
    }
  }, [visible, editing]);

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  // 특정 요일 모드인데 요일을 하나도 안 골랐으면 저장 불가
  const canSubmit =
    title.trim().length > 0 && (scheduleType === 'daily' || days.length > 0);

  const onChangeTime = (event: DateTimePickerEvent, selected?: Date) => {
    // 안드로이드는 선택 즉시 닫힘, iOS 는 인라인 유지
    setShowPicker(Platform.OS === 'ios');
    if (event.type === 'set' && selected) setTime(selected);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const err = validateName?.(title.trim(), editing?.id) ?? null;
    if (err) {
      setNameError(err);
      return;
    }
    onSubmit({
      title: title.trim(),
      kind,
      category,
      icon,
      schedule:
        scheduleType === 'weekly'
          ? { type: 'weekly', days: [...days].sort((a, b) => a - b) }
          : { type: 'daily' },
      reminderTime: reminderOn ? formatTime(time) : undefined,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[88%] rounded-t-3xl bg-white p-6 dark:bg-gray-900">
          <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-gray-300 dark:bg-gray-700" />
          <Text className="mb-5 text-xl font-bold text-gray-900 dark:text-white">
            {editing ? '루틴 수정' : '새 루틴 추가'}
          </Text>

          <ScrollView keyboardShouldPersistTaps="handled">
            {/* 제목 */}
            <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              제목
            </Text>
            <TextInput
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (nameError) setNameError(null);
              }}
              placeholder="예: 아침 스트레칭"
              placeholderTextColor="#9ca3af"
              className={`rounded-xl border bg-gray-50 px-4 py-3 text-base text-gray-900 dark:bg-gray-800 dark:text-white ${
                nameError ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
              }`}
            />
            {nameError && <Text className="mt-1.5 text-xs text-red-500">{nameError}</Text>}

            {/* 유형 */}
            <Text className="mb-2 mt-5 text-sm font-medium text-gray-700 dark:text-gray-300">
              유형
            </Text>
            <View className="flex-row gap-2">
              {(
                [
                  { key: 'build', label: '실천형', desc: '할 일을 하기' },
                  { key: 'avoid', label: '유지형', desc: '안 하기 (금주·금연)' },
                ] as const
              ).map((opt) => {
                const selected = kind === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setKind(opt.key)}
                    className={`flex-1 rounded-xl border-2 p-3 ${
                      selected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                        : 'border-transparent bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        selected
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {opt.label}
                    </Text>
                    <Text className="mt-0.5 text-[11px] text-gray-400">{opt.desc}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* 카테고리 */}
            <Text className="mb-2 mt-5 text-sm font-medium text-gray-700 dark:text-gray-300">
              카테고리
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const selected = c === category;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c)}
                    className={`rounded-full px-4 py-2 ${
                      selected ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selected ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* 아이콘 */}
            <Text className="mb-2 mt-5 text-sm font-medium text-gray-700 dark:text-gray-300">
              아이콘
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {ICON_OPTIONS.map((em) => {
                const selected = em === icon;
                return (
                  <Pressable
                    key={em}
                    onPress={() => setIcon(em)}
                    className={`h-12 w-12 items-center justify-center rounded-xl border-2 ${
                      selected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                        : 'border-transparent bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <Text className="text-2xl">{em}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* 반복 주기 */}
            <Text className="mb-2 mt-5 text-sm font-medium text-gray-700 dark:text-gray-300">
              반복
            </Text>
            <View className="flex-row gap-2">
              {(
                [
                  { key: 'daily', label: '매일' },
                  { key: 'weekly', label: '특정 요일' },
                ] as const
              ).map((opt) => {
                const selected = scheduleType === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setScheduleType(opt.key)}
                    className={`flex-1 items-center rounded-xl py-2.5 ${
                      selected ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selected ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {scheduleType === 'weekly' && (
              <View className="mt-3 flex-row justify-between">
                {WEEKDAY_SHORT.map((label, idx) => {
                  const selected = days.includes(idx);
                  const isSun = idx === 0;
                  const isSat = idx === 6;
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => toggleDay(idx)}
                      className={`h-10 w-10 items-center justify-center rounded-full ${
                        selected ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          selected
                            ? 'text-white'
                            : isSun
                              ? 'text-red-400'
                              : isSat
                                ? 'text-blue-400'
                                : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* 리마인더 알림 */}
            <View className="mt-6 flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  🔔 리마인더 알림
                </Text>
                <Text className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                  매일 정해진 시간에 알림을 받아요
                </Text>
              </View>
              <Switch
                value={reminderOn}
                onValueChange={setReminderOn}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor="#ffffff"
              />
            </View>

            {reminderOn && (
              <Pressable
                onPress={() => setShowPicker(true)}
                className="mt-3 flex-row items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 active:opacity-70 dark:border-gray-700 dark:bg-gray-800"
              >
                <Text className="text-sm text-gray-500 dark:text-gray-400">알림 시각</Text>
                <Text className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatTime(time)}
                </Text>
              </Pressable>
            )}

            {reminderOn && showPicker && (
              <DateTimePicker
                value={time}
                mode="time"
                is24Hour
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onChangeTime}
              />
            )}
          </ScrollView>

          {/* 액션 */}
          <View className="mt-6 flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 items-center rounded-xl bg-gray-100 py-3.5 active:opacity-70 dark:bg-gray-800"
            >
              <Text className="text-base font-semibold text-gray-700 dark:text-gray-300">
                취소
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              className={`flex-1 items-center rounded-xl py-3.5 active:opacity-70 ${
                canSubmit ? 'bg-emerald-500' : 'bg-emerald-500/40'
              }`}
            >
              <Text className="text-base font-semibold text-white">
                {editing ? '저장' : '추가'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
