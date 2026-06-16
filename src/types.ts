export type Category = '건강' | '학습' | '자기계발' | '생활';

export const CATEGORIES: Category[] = ['건강', '학습', '자기계발', '생활'];

export const ICON_OPTIONS = [
  '💪', '💧', '📚', '🏃', '🧘', '🥗',
  '😴', '✍️', '🎯', '🌱', '☀️', '🎨',
  '🧹', '💊', '🦷', '🎸', '💰', '🙏',
];

export interface Routine {
  id: string;
  title: string;
  category: Category;
  icon: string;
  /** ISO 문자열 (생성 시각) */
  createdAt: string;
  /** 삭제 대신 보관 — 통계 보존용 */
  archived?: boolean;
}

export interface RecordEntry {
  routineId: string;
  /** "YYYY-MM-DD" (로컬 기준) */
  date: string;
  completed: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Settings {
  theme: ThemeMode;
  /** 샘플 루틴 1회 생성 여부 */
  seeded: boolean;
}
