import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CATEGORIES, Category, ICON_OPTIONS, Routine } from '../types';
import { NewRoutineInput } from '../store/AppContext';

interface Props {
  visible: boolean;
  /** 수정 대상 (없으면 새로 추가) */
  editing?: Routine | null;
  onClose: () => void;
  onSubmit: (input: NewRoutineInput) => void;
}

export function RoutineFormModal({ visible, editing, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('건강');
  const [icon, setIcon] = useState<string>(ICON_OPTIONS[0]);

  useEffect(() => {
    if (visible) {
      setTitle(editing?.title ?? '');
      setCategory(editing?.category ?? '건강');
      setIcon(editing?.icon ?? ICON_OPTIONS[0]);
    }
  }, [visible, editing]);

  const canSubmit = title.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ title: title.trim(), category, icon });
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
              onChangeText={setTitle}
              placeholder="예: 아침 스트레칭"
              placeholderTextColor="#9ca3af"
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />

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
