import { useColorScheme } from 'nativewind';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ActivityIndicator, View } from 'react-native';
import {
  loadRecords,
  loadRoutines,
  loadSettings,
  saveRecords,
  saveRoutines,
  saveSettings,
} from '../storage/storage';
import { Category, RecordEntry, Routine, Settings, ThemeMode } from '../types';
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
}

interface AppContextValue {
  routines: Routine[];
  records: RecordEntry[];
  settings: Settings;
  addRoutine: (input: NewRoutineInput) => void;
  updateRoutine: (id: string, patch: Partial<NewRoutineInput>) => void;
  deleteRoutine: (id: string) => void;
  toggleToday: (routineId: string) => void;
  isDoneToday: (routineId: string) => boolean;
  getStreak: (routineId: string) => number;
  setTheme: (theme: ThemeMode) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { setColorScheme } = useColorScheme();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [settings, setSettings] = useState<Settings>({ theme: 'system', seeded: false });
  const [loaded, setLoaded] = useState(false);

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

  const addRoutine = useCallback((input: NewRoutineInput) => {
    setRoutines((prev) => {
      const next = [...prev, makeRoutine(input.title, input.category, input.icon)];
      saveRoutines(next);
      return next;
    });
  }, []);

  const updateRoutine = useCallback((id: string, patch: Partial<NewRoutineInput>) => {
    setRoutines((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...patch } : r));
      saveRoutines(next);
      return next;
    });
  }, []);

  // 삭제는 아카이브(통계 보존)
  const deleteRoutine = useCallback((id: string) => {
    setRoutines((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, archived: true } : r));
      saveRoutines(next);
      return next;
    });
  }, []);

  const toggleToday = useCallback((routineId: string) => {
    const date = todayKey();
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

  const setTheme = useCallback((theme: ThemeMode) => {
    setSettings((prev) => {
      const next = { ...prev, theme };
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
    (routineId: string) => calcStreak(records, routineId),
    [records],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      routines,
      records,
      settings,
      addRoutine,
      updateRoutine,
      deleteRoutine,
      toggleToday,
      isDoneToday,
      getStreak,
      setTheme,
    }),
    [
      routines,
      records,
      settings,
      addRoutine,
      updateRoutine,
      deleteRoutine,
      toggleToday,
      isDoneToday,
      getStreak,
      setTheme,
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
