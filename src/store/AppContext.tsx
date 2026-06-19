import { useColorScheme } from 'nativewind';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ActivityIndicator, View } from 'react-native';
import {
  cancelAllReminders,
  cancelReminders,
  ensurePermission,
  scheduleRoutineReminder,
} from '../lib/notifications';
import {
  loadRecords,
  loadRoutines,
  loadSettings,
  saveRecords,
  saveRoutines,
  saveSettings,
} from '../storage/storage';
import {
  Category,
  RecordEntry,
  Routine,
  RoutineKind,
  Schedule,
  Settings,
  ThemeMode,
} from '../types';
import { todayKey } from '../utils/date';
import { getStreak as calcStreak } from '../utils/stats';

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeRoutine(title: string, category: Category, icon: string): Routine {
  return { id: uid(), title, category, icon, createdAt: new Date().toISOString() };
}

/** 첫 실행 시 자동 생성되는 샘플 루틴 3개 */
function sampleRoutines(): Routine[] {
  return [
    makeRoutine('운동', '건강', '💪'),
    makeRoutine('물 2L 마시기', '건강', '💧'),
    makeRoutine('독서 20분', '자기계발', '📚'),
  ];
}

export interface NewRoutineInput {
  title: string;
  category: Category;
  icon: string;
  /** 루틴 유형 (없으면 실천형) */
  kind?: RoutineKind;
  /** 반복 주기 (없으면 매일) */
  schedule?: Schedule;
  /** 매일 알림 시각 "HH:mm" (없으면 알림 끔) */
  reminderTime?: string;
}

interface AppContextValue {
  routines: Routine[];
  records: RecordEntry[];
  settings: Settings;
  addRoutine: (input: NewRoutineInput) => Promise<void>;
  updateRoutine: (id: string, patch: NewRoutineInput) => Promise<void>;
  /** 보관 — 목록에서 숨기되 기록·통계는 보존 */
  deleteRoutine: (id: string) => Promise<void>;
  /** 완전 삭제 — 루틴과 모든 기록을 영구 삭제 */
  purgeRoutine: (id: string) => Promise<void>;
  /** 보관 해제 — 보관함의 루틴을 되살림 */
  restoreRoutine: (id: string) => Promise<void>;
  toggleToday: (routineId: string) => void;
  toggleOn: (routineId: string, dateKey: string) => void;
  isDoneToday: (routineId: string) => boolean;
  getStreak: (routineId: string) => number;
  setTheme: (theme: ThemeMode) => void;
  /** 백업 복원: 기존 데이터를 덮어쓰고 알림 재예약 */
  importData: (routines: Routine[], records: RecordEntry[]) => Promise<void>;
  /** 전체 초기화: 샘플 3개로 되돌리고 기록 삭제 */
  resetData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { setColorScheme } = useColorScheme();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [settings, setSettings] = useState<Settings>({ theme: 'system', seeded: false });
  const [loaded, setLoaded] = useState(false);

  // 비동기 콜백에서 최신 routines 를 읽기 위한 ref
  const routinesRef = useRef<Routine[]>(routines);
  useEffect(() => {
    routinesRef.current = routines;
  }, [routines]);

  // 최초 로드 + 샘플 시드
  useEffect(() => {
    (async () => {
      const [r, rec, s] = await Promise.all([loadRoutines(), loadRecords(), loadSettings()]);
      let initialRoutines = r;
      let initialSettings = s;
      if (!s.seeded) {
        initialRoutines = sampleRoutines();
        initialSettings = { ...s, seeded: true };
        await saveRoutines(initialRoutines);
        await saveSettings(initialSettings);
      }
      setRoutines(initialRoutines);
      setRecords(rec);
      setSettings(initialSettings);
      setLoaded(true);
    })();
  }, []);

  // 테마 적용
  useEffect(() => {
    setColorScheme(settings.theme);
  }, [settings.theme, setColorScheme]);

  const addRoutine = useCallback(async (input: NewRoutineInput) => {
    const routine = makeRoutine(input.title, input.category, input.icon);
    routine.kind = input.kind;
    routine.schedule = input.schedule;
    routine.reminderTime = input.reminderTime;
    if (input.reminderTime && (await ensurePermission())) {
      routine.notificationIds = await scheduleRoutineReminder(routine);
    }
    setRoutines((prev) => {
      const next = [...prev, routine];
      saveRoutines(next);
      return next;
    });
  }, []);

  const updateRoutine = useCallback(async (id: string, patch: NewRoutineInput) => {
    const existing = routinesRef.current.find((r) => r.id === id);
    // 기존 알림 모두 취소 후 변경된 주기·시각으로 재예약
    await cancelReminders(existing?.notificationIds);
    const merged: Routine = {
      ...(existing as Routine),
      ...patch,
      schedule: patch.schedule,
      reminderTime: patch.reminderTime,
      notificationIds: undefined,
    };
    let notificationIds: string[] | undefined;
    if (patch.reminderTime && (await ensurePermission())) {
      notificationIds = await scheduleRoutineReminder(merged);
    }
    setRoutines((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...merged, notificationIds } : r));
      saveRoutines(next);
      return next;
    });
  }, []);

  // 보관(아카이브) — 통계·기록 보존 + 예약된 알림 취소
  const deleteRoutine = useCallback(async (id: string) => {
    const existing = routinesRef.current.find((r) => r.id === id);
    await cancelReminders(existing?.notificationIds);
    setRoutines((prev) => {
      const next = prev.map((r) =>
        r.id === id ? { ...r, archived: true, notificationIds: undefined } : r,
      );
      saveRoutines(next);
      return next;
    });
  }, []);

  // 완전 삭제 — 루틴과 그 기록을 영구 삭제 + 알림 취소
  const purgeRoutine = useCallback(async (id: string) => {
    const existing = routinesRef.current.find((r) => r.id === id);
    await cancelReminders(existing?.notificationIds);
    setRoutines((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveRoutines(next);
      return next;
    });
    setRecords((prev) => {
      const next = prev.filter((r) => r.routineId !== id);
      saveRecords(next);
      return next;
    });
  }, []);

  // 보관 해제 — 되살리면서 알림(있으면) 재예약
  const restoreRoutine = useCallback(async (id: string) => {
    const existing = routinesRef.current.find((r) => r.id === id);
    let notificationIds: string[] | undefined;
    if (existing?.reminderTime && (await ensurePermission())) {
      notificationIds = await scheduleRoutineReminder({ ...existing, archived: false });
    }
    setRoutines((prev) => {
      const next = prev.map((r) =>
        r.id === id ? { ...r, archived: false, notificationIds } : r,
      );
      saveRoutines(next);
      return next;
    });
  }, []);

  const toggleOn = useCallback((routineId: string, date: string) => {
    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.routineId === routineId && r.date === date);
      let next: RecordEntry[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = { ...next[idx], completed: !next[idx].completed };
      } else {
        next = [...prev, { routineId, date, completed: true }];
      }
      saveRecords(next);
      return next;
    });
  }, []);

  const toggleToday = useCallback(
    (routineId: string) => toggleOn(routineId, todayKey()),
    [toggleOn],
  );

  const setTheme = useCallback((theme: ThemeMode) => {
    setSettings((prev) => {
      const next = { ...prev, theme };
      saveSettings(next);
      return next;
    });
  }, []);

  const importData = useCallback(async (newRoutines: Routine[], newRecords: RecordEntry[]) => {
    // 기존 예약 알림 전부 취소 후, 가져온 루틴에 맞춰 재예약
    await cancelAllReminders();
    const rescheduled: Routine[] = [];
    for (const r of newRoutines) {
      let notificationIds: string[] | undefined;
      if (!r.archived && r.reminderTime && (await ensurePermission())) {
        notificationIds = await scheduleRoutineReminder(r);
      }
      rescheduled.push({ ...r, notificationIds });
    }
    setRoutines(rescheduled);
    saveRoutines(rescheduled);
    setRecords(newRecords);
    saveRecords(newRecords);
  }, []);

  const resetData = useCallback(async () => {
    await cancelAllReminders();
    const fresh = sampleRoutines();
    setRoutines(fresh);
    saveRoutines(fresh);
    setRecords([]);
    saveRecords([]);
    setSettings((prev) => {
      const next = { ...prev, seeded: true };
      saveSettings(next);
      return next;
    });
  }, []);

  const isDoneToday = useCallback(
    (routineId: string) => {
      const date = todayKey();
      return records.some((r) => r.routineId === routineId && r.date === date && r.completed);
    },
    [records],
  );

  const getStreak = useCallback(
    (routineId: string) => {
      const routine = routines.find((r) => r.id === routineId);
      return routine ? calcStreak(records, routine) : 0;
    },
    [records, routines],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      routines,
      records,
      settings,
      addRoutine,
      updateRoutine,
      deleteRoutine,
      purgeRoutine,
      restoreRoutine,
      toggleToday,
      toggleOn,
      isDoneToday,
      getStreak,
      setTheme,
      importData,
      resetData,
    }),
    [
      routines,
      records,
      settings,
      addRoutine,
      updateRoutine,
      deleteRoutine,
      purgeRoutine,
      restoreRoutine,
      toggleToday,
      toggleOn,
      isDoneToday,
      getStreak,
      setTheme,
      importData,
      resetData,
    ],
  );

  if (!loaded) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
