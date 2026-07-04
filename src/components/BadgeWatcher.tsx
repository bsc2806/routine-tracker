import { useEffect, useRef } from 'react';
import { loadEarnedBadges, saveEarnedBadges } from '../storage/storage';
import { useApp } from '../store/AppContext';
import { computeBadges } from '../utils/achievements';
import { useToast } from './ToastProvider';

/**
 * 데이터 변화를 감시해 '새로 획득한' 배지가 생기면 토스트를 띄운다.
 * - 최초 실행(저장 기록 없음)에는 토스트 없이 현재 상태를 기준선으로 저장
 * - 이미 획득한 배지는 다시 띄우지 않음(저장된 집합과 비교)
 */
export function BadgeWatcher() {
  const { routines, records } = useApp();
  const { showBadgeToast } = useToast();
  const known = useRef<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const badges = computeBadges(routines, records);
      const earnedIds = badges.filter((b) => b.earned).map((b) => b.id);

      if (known.current === null) {
        const stored = await loadEarnedBadges();
        if (cancelled) return;
        if (stored === null) {
          // 최초: 기준선만 저장하고 종료
          known.current = new Set(earnedIds);
          await saveEarnedBadges(earnedIds);
          return;
        }
        known.current = new Set(stored);
      }

      const newly = earnedIds.filter((id) => !known.current!.has(id));
      newly.forEach((id) => {
        const badge = badges.find((b) => b.id === id);
        if (badge) showBadgeToast(badge);
      });

      known.current = new Set(earnedIds);
      await saveEarnedBadges(earnedIds);
    })();

    return () => {
      cancelled = true;
    };
  }, [routines, records, showBadgeToast]);

  return null;
}
