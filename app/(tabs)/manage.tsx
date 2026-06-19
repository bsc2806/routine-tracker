import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoutineFormModal } from '../../src/components/RoutineFormModal';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { SectionLabel } from '../../src/components/SectionLabel';
import { NewRoutineInput, useApp } from '../../src/store/AppContext';
import { Routine } from '../../src/types';
import { activeRoutines } from '../../src/utils/stats';
import { scheduleLabel } from '../../src/utils/schedule';

export default function ManageScreen() {
  const { routines, records, addRoutine, updateRoutine, deleteRoutine, purgeRoutine, restoreRoutine } =
    useApp();
  const active = activeRoutines(routines);
  const archived = routines.filter((r) => r.archived);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Routine | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setModalVisible(true);
  };

  const openEdit = (routine: Routine) => {
    setEditing(routine);
    setModalVisible(true);
  };

  const handleSubmit = (input: NewRoutineInput) => {
    if (editing) updateRoutine(editing.id, input);
    else addRoutine(input);
  };

  const norm = (s: string) => s.trim().toLowerCase();

  // 이름 중복 검증 (활성 + 보관함 전체 대상)
  const validateName = (name: string, editingId?: string): string | null => {
    const n = norm(name);
    const dup = routines.find((r) => r.id !== editingId && norm(r.title) === n);
    if (!dup) return null;
    return dup.archived
      ? '보관함에 같은 이름의 루틴이 있어요. 보관함에서 복원해 주세요.'
      : '이미 같은 이름의 루틴이 있어요.';
  };

  const onRestore = (routine: Routine) => {
    const dup = active.find((r) => norm(r.title) === norm(routine.title));
    if (dup) {
      Alert.alert(
        '복원할 수 없어요',
        `'${routine.title}'와(과) 같은 이름의 루틴이 이미 목록에 있어요.\n기존 루틴 이름을 바꾼 뒤 다시 시도해 주세요.`,
      );
      return;
    }
    restoreRoutine(routine.id);
  };

  const confirmPurge = (routine: Routine, count: number) => {
    Alert.alert(
      '정말 영구 삭제할까요?',
      `'${routine.title}'와(과) ${count}일의 기록이 완전히 사라져요.\n이 작업은 되돌릴 수 없어요.`,
      [
        { text: '취소', style: 'cancel' },
        { text: '영구 삭제', style: 'destructive', onPress: () => purgeRoutine(routine.id) },
      ],
    );
  };

  const confirmDelete = (routine: Routine) => {
    const count = records.filter((r) => r.routineId === routine.id && r.completed).length;

    // 기록이 없으면 그냥 보관
    if (count === 0) {
      Alert.alert('루틴 삭제', `'${routine.title}' 루틴을 삭제할까요?`, [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => deleteRoutine(routine.id) },
      ]);
      return;
    }

    // 기록이 있으면 보관 / 완전 삭제 선택
    Alert.alert(
      `'${routine.title}' 삭제`,
      `이 루틴에 ${count}일의 기록이 있어요.\n\n· 보관: 목록에서 숨기고 기록·통계는 보존해요.\n· 완전 삭제: 루틴과 ${count}일의 기록을 영구히 지워요 (되돌릴 수 없음).`,
      [
        { text: '취소', style: 'cancel' },
        { text: '보관', onPress: () => deleteRoutine(routine.id) },
        { text: '완전 삭제', style: 'destructive', onPress: () => confirmPurge(routine, count) },
      ],
    );
  };

  const buildList = active.filter((r) => r.kind !== 'avoid');
  const avoidList = active.filter((r) => r.kind === 'avoid');
  const showGroups = buildList.length > 0 && avoidList.length > 0;

  const renderRow = (routine: Routine) => (
    <View
      key={routine.id}
      className="mb-3 flex-row items-center rounded-2xl bg-white p-4 dark:bg-gray-800"
    >
      <Pressable
        onPress={() => router.push(`/routine/${routine.id}`)}
        className="flex-1 flex-row items-center active:opacity-60"
      >
        <Text className="text-2xl">{routine.icon}</Text>
        <View className="ml-3 flex-1">
          <Text className="text-base font-semibold text-gray-900 dark:text-white">
            {routine.title}
          </Text>
          <Text className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {routine.category}
            {`  ·  ${scheduleLabel(routine)}`}
            {routine.reminderTime ? `  ·  🔔 ${routine.reminderTime}` : ''}
          </Text>
        </View>
      </Pressable>
      <Pressable onPress={() => openEdit(routine)} className="mr-1 p-2 active:opacity-60" hitSlop={6}>
        <Ionicons name="create-outline" size={20} color="#6b7280" />
      </Pressable>
      <Pressable onPress={() => confirmDelete(routine)} className="p-2 active:opacity-60" hitSlop={6}>
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScreenHeader title="루틴 관리" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        {active.length === 0 ? (
          <Text className="mt-16 text-center text-gray-400 dark:text-gray-500">
            등록된 루틴이 없어요. 아래 버튼으로 추가해 보세요!
          </Text>
        ) : (
          <>
            {showGroups && <SectionLabel text="✅ 실천형" />}
            {buildList.map(renderRow)}
            {showGroups && <SectionLabel text="🛡️ 유지형" />}
            {avoidList.map(renderRow)}
          </>
        )}

        {/* 보관함 */}
        {archived.length > 0 && (
          <View className="mt-6">
            <Pressable
              onPress={() => setShowArchived((v) => !v)}
              className="flex-row items-center justify-between py-2 active:opacity-60"
            >
              <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                🗂️ 보관함 ({archived.length})
              </Text>
              <Ionicons
                name={showArchived ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#9ca3af"
              />
            </Pressable>
            {showArchived &&
              archived.map((routine) => (
                <View
                  key={routine.id}
                  className="mb-2 flex-row items-center rounded-2xl bg-gray-100 p-3 dark:bg-gray-800/60"
                >
                  <Text className="text-xl opacity-70">{routine.icon}</Text>
                  <Text
                    className="ml-3 flex-1 text-sm text-gray-600 dark:text-gray-300"
                    numberOfLines={1}
                  >
                    {routine.title}
                  </Text>
                  <Pressable
                    onPress={() => onRestore(routine)}
                    className="mr-2 rounded-full bg-emerald-500 px-3 py-1.5 active:opacity-70"
                  >
                    <Text className="text-xs font-semibold text-white">복원</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      confirmPurge(
                        routine,
                        records.filter((r) => r.routineId === routine.id && r.completed).length,
                      )
                    }
                    hitSlop={6}
                    className="p-1.5 active:opacity-60"
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </Pressable>
                </View>
              ))}
          </View>
        )}
      </ScrollView>

      {/* 추가 FAB */}
      <Pressable
        onPress={openAdd}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-lg active:opacity-80"
      >
        <Ionicons name="add" size={30} color="#ffffff" />
      </Pressable>

      <RoutineFormModal
        visible={modalVisible}
        editing={editing}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        validateName={validateName}
      />
    </SafeAreaView>
  );
}
