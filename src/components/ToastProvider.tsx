import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '../utils/achievements';

interface ToastContextValue {
  showBadgeToast: (badge: Badge) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [queue, setQueue] = useState<Badge[]>([]);
  const [current, setCurrent] = useState<Badge | null>(null);
  const translateY = useRef(new Animated.Value(-140)).current;

  const showBadgeToast = useCallback((badge: Badge) => {
    setQueue((q) => [...q, badge]);
  }, []);

  // 큐에서 하나씩 꺼내 표시
  useEffect(() => {
    if (current || queue.length === 0) return;
    setCurrent(queue[0]);
    setQueue((q) => q.slice(1));
  }, [queue, current]);

  // 등장 → 유지 → 퇴장 애니메이션
  useEffect(() => {
    if (!current) return;
    translateY.setValue(-140);
    Animated.sequence([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
      Animated.delay(2200),
      Animated.timing(translateY, {
        toValue: -160,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setCurrent(null);
    });
  }, [current, translateY]);

  return (
    <ToastContext.Provider value={{ showBadgeToast }}>
      {children}
      {current && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: insets.top + 8,
            left: 0,
            right: 0,
            transform: [{ translateY }],
          }}
        >
          <View className="mx-4 flex-row items-center rounded-2xl bg-gray-900/95 px-4 py-3 dark:bg-gray-800">
            <Text className="text-2xl">{current.icon}</Text>
            <View className="ml-3 flex-1">
              <Text className="text-xs font-medium text-emerald-400">🏅 새 배지 획득!</Text>
              <Text className="text-sm font-bold text-white">{current.title}</Text>
            </View>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}
