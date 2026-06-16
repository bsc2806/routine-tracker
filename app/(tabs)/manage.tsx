import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoutineFormModal } from '../../src/components/RoutineFormModal';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { NewRoutineInput, useApp } from '../../src/store/AppContext';
import { Routine } from '../../src/types';
import { activeRoutines } from '../../src/utils/stats';
import { scheduleLabel } from '../../src/utils/schedule';

export default function ManageScreen() {
  const { routines, addRoutine, updateRoutine, deleteRoutine } = useApp();
  const active = activeRoutines(routines);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Routine | null>(null);

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

  const confirmDelete = (routine: Routine) => {
    Alert.alert('루틴 삭제', `'${routine.title}' 루틴을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteRoutine(routine.id) },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScreenHeader title="루틴 관리" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        {active.length === 0 ? (
          <Text className="mt-16 text-center text-gray-400 dark:text-gray-500">
            등록된 루틴이 없어요. 아래 버튼으로 추가해 보세요!
          </Text>
        ) : (
          active.map((routine) => (
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
              <Pressable
                onPress={() => openEdit(routine)}
                className="mr-1 p-2 active:opacity-60"
                hitSlop={6}
              >
                <Ionicons name="create-outline" size={20} color="#6b7280" />
              </Pressable>
              <Pressable
                onPress={() => confirmDelete(routine)}
                className="p-2 active:opacity-60"
                hitSlop={6}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </Pressable>
            </View>
          ))
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
      />
    </SafeAreaView>
  );
}
