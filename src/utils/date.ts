const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Date -> "YYYY-MM-DD" (로컬 기준, UTC 변환으로 인한 날짜 밀림 방지) */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** "6월 16일 월요일" */
export function formatKorean(d: Date): string {
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAYS[d.getDay()]}요일`;
}

/** 최근 n일의 날짜 키 (오래된 것 -> 오늘 순) */
export function lastNDateKeys(n: number): string[] {
  const today = new Date();
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    keys.push(toDateKey(addDays(today, -i)));
  }
  return keys;
}

/** "YYYY-MM-DD" -> 요일 한 글자 ("월") */
export function weekdayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}
