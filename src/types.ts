export type Category = '건강' | '학습' | '자기계발' | '생활' | '재테크';

export const CATEGORIES: Category[] = ['건강', '학습', '자기계발', '생활', '재테크'];

export const ICON_OPTIONS = [
  '💪', '💧', '📚', '🏃', '🧘', '🥗',
  '😴', '✍️', '🎯', '🌱', '☀️', '🎨',
  '🧹', '💊', '🦷', '🎸', '💰', '🙏',
  '🚭', '🚫', '🍺', '📵',
];

export type ScheduleType = 'daily' | 'weekly';

export interface Schedule {
  type: ScheduleType;
  /** weekly 일 때 반복할 요일 (0=일 ~ 6=토) */
  days?: number[];
}

/** build=실천형(할 일) / avoid=유지형(금주·금연 등 안 하기) */
export type RoutineKind = 'build' | 'avoid';

export interface Routine {
  id: string;
  title: string;
  category: Category;
  icon: string;
  /** 루틴 유형. 없으면 실천형(build)으로 간주(v1 호환) */
  kind?: RoutineKind;
  /** ISO 문자열 (생성 시각) */
  createdAt: string;
  /** 삭제 대신 보관 — 통계 보존용 */
  archived?: boolean;
  /** 반복 주기. 없으면 매일로 간주(v1 호환) */
  schedule?: Schedule;
  /** 매일 알림 시각 "HH:mm" (없으면 알림 없음) */
  reminderTime?: string;
  /** 예약된 로컬 알림 식별자들 (취소/재예약용) */
  notificationIds?: string[];
}

export interface RecordEntry {
  routineId: string;
  /** "YYYY-MM-DD" (로컬 기준) */
  date: string;
  completed: boolean;
}

export type Mood = 1 | 2 | 3 | 4 | 5;

export interface MoodOption {
  value: Mood;
  emoji: string;
  label: string;
}

export const MOODS: MoodOption[] = [
  { value: 5, emoji: '😀', label: '아주 좋음' },
  { value: 4, emoji: '🙂', label: '좋음' },
  { value: 3, emoji: '😐', label: '보통' },
  { value: 2, emoji: '😔', label: '별로' },
  { value: 1, emoji: '😣', label: '힘듦' },
];

export interface DiaryEntry {
  /** "YYYY-MM-DD" (하루 1개) */
  date: string;
  mood?: Mood;
  text: string;
  updatedAt: string;
}

export interface WeeklyReport {
  /** 해당 주 월요일 키 — 새 주가 되면 재생성 */
  weekStart: string;
  text: string;
  generatedAt: string;
  /** 이번 주 생성 횟수 (비용 통제용, 새 주가 되면 리셋) */
  generations: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Settings {
  theme: ThemeMode;
  /** 샘플 루틴 1회 생성 여부 */
  seeded: boolean;
  /** AI 기능(데이터 전송) 동의 여부 */
  aiConsent?: boolean;
}
