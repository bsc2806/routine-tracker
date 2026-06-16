export type Category = '건강' | '학습' | '자기계발' | '생활' | '재테크';

export const CATEGORIES: Category[] = ['건강', '학습', '자기계발', '생활', '재테크'];

export const ICON_OPTIONS = [
  '💪', '💧', '📚', '🏃', '🧘', '🥗',
  '😴', '✍️', '🎯', '🌱', '☀️', '🎨',
  '🧹', '💊', '🦷', '🎸', '💰', '🙏',
];

export type ScheduleType = 'daily' | 'weekly';

export interface Schedule {
  type: ScheduleType;
  /** weekly 일 때 반복할 요일 (0=일 ~ 6=토) */
  days?: number[];
}

export interface Routine {
  id: string;
  title: string;
  category: Category;
  icon: string;
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

export interface WeeklyReport {
  /** 해당 주 월요일 키 — 새 주가 되면 재생성 */
  weekStart: string;
  text: string;
  generatedAt: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Settings {
  theme: ThemeMode;
  /** 샘플 루틴 1회 생성 여부 */
  seeded: boolean;
}
