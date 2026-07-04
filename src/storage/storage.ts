import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecordEntry, Routine, Settings, WeeklyReport } from '../types';

const KEYS = {
  routines: '@routines',
  records: '@records',
  settings: '@settings',
  weeklyReport: '@weeklyReport',
  achievementsCelebrated: '@achievementsCelebrated',
  earnedBadges: '@earnedBadges',
} as const;

const DEFAULT_SETTINGS: Settings = { theme: 'system', seeded: false };

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (e) {
    console.warn(`[storage] ${key} 읽기 실패`, e);
    return fallback;
  }
}

async function writeJSON<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[storage] ${key} 저장 실패`, e);
  }
}

export const loadRoutines = () => readJSON<Routine[]>(KEYS.routines, []);
export const saveRoutines = (r: Routine[]) => writeJSON(KEYS.routines, r);

export const loadRecords = () => readJSON<RecordEntry[]>(KEYS.records, []);
export const saveRecords = (r: RecordEntry[]) => writeJSON(KEYS.records, r);

export const loadSettings = () => readJSON<Settings>(KEYS.settings, DEFAULT_SETTINGS);
export const saveSettings = (s: Settings) => writeJSON(KEYS.settings, s);

export const loadWeeklyReport = () => readJSON<WeeklyReport | null>(KEYS.weeklyReport, null);
export const saveWeeklyReport = (r: WeeklyReport) => writeJSON(KEYS.weeklyReport, r);

export const loadAchievementsCelebrated = () =>
  readJSON<boolean>(KEYS.achievementsCelebrated, false);
export const saveAchievementsCelebrated = (v: boolean) =>
  writeJSON(KEYS.achievementsCelebrated, v);

// null = 아직 한 번도 기록 안 됨(최초 실행) → 토스트 없이 기준선만 저장
export const loadEarnedBadges = () => readJSON<string[] | null>(KEYS.earnedBadges, null);
export const saveEarnedBadges = (ids: string[]) => writeJSON(KEYS.earnedBadges, ids);
