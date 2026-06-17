import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  visible: boolean;
  onHide: () => void;
  emoji?: string;
  title?: string;
  subtitle?: string;
  /** 자동으로 사라지지 않고 탭하면 닫힘 */
  manualDismiss?: boolean;
}

/** 축하 오버레이 (순수 RN Animated). 기본 문구는 '오늘 루틴 완료'. */
export function CelebrationOverlay({
  visible,
  onHide,
  emoji = '🎉',
  title = '오늘 루틴 완료!',
  subtitle = '멋져요, 내일도 화이팅! 💪',
  manualDismiss = false,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (!visible) return;
    opacity.setValue(0);
    scale.setValue(0.8);
    const enter = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]);
    if (manualDismiss) {
      enter.start();
      return;
    }
    Animated.sequence([
      enter,
      Animated.delay(1400),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 350,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onHide();
    });
  }, [visible, opacity, scale, onHide, manualDismiss]);

  const dismiss = () => {
    Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(
      ({ finished }) => {
        if (finished) onHide();
      },
    );
  };

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents={manualDismiss ? 'auto' : 'none'}
      style={[StyleSheet.absoluteFill, { opacity }]}
    >
      <Pressable
        disabled={!manualDismiss}
        onPress={dismiss}
        className="flex-1 items-center justify-center bg-black/30"
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <View className="items-center rounded-3xl bg-white px-8 py-6 dark:bg-gray-800">
            <Text className="mb-2 text-5xl">{emoji}</Text>
            <Text className="text-center text-lg font-bold text-gray-900 dark:text-white">
              {title}
            </Text>
            <Text className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </Text>
            {manualDismiss && (
              <Text className="mt-3 text-xs text-gray-400">탭하여 닫기</Text>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
