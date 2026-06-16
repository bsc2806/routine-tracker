import { addDays, toDateKey } from './date';

export interface CalCell {
  key: string; // "YYYY-MM-DD"
  day: number; // 1~31
  inMonth: boolean; // 이번 달 소속 여부
}

/** 해당 연·월(0-11)의 6주 x 7일 달력 그리드 (일요일 시작) */
export function monthMatrix(year: number, month: number): CalCell[][] {
  const first = new Date(year, month, 1);
  const gridStart = addDays(first, -first.getDay());
  const weeks: CalCell[][] = [];
  let cursor = gridStart;
  for (let w = 0; w < 6; w++) {
    const row: CalCell[] = [];
    for (let d = 0; d < 7; d++) {
      row.push({ key: toDateKey(cursor), day: cursor.getDate(), inMonth: cursor.getMonth() === month });
      cursor = addDays(cursor, 1);
    }
    weeks.push(row);
  }
  return weeks;
}

export function monthTitle(year: number, month: number): string {
  return `${year}년 ${month + 1}월`;
}
