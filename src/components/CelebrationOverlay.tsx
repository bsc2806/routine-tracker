import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

interface Props {
  visible: boolean;
  onHide: () => void;
}

/** 전체 루틴 완료 시 잠깐 떠올랐다 사라지는 축하 오버레이 (순수 RN Animated) */
export function CelebrationOverlay({ visible, onHide }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (!visible) return;
    opacity.setValue(0);
    scale.setValue(0.8);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]),
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
  }, [visible, opacity, scale, onHide]);

  if (!visible) return null;

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <View className="flex-1 items-center justify-center bg-black/30">
        <Animated.View style={{ transform: [{ scale }] }}>
          <View className="items-center rounded-3xl bg-white px-8 py-6 dark:bg-gray-800">
            <Text className="mb-2 text-5xl">🎉</Text>
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              오늘 루틴 완료!
            </Text>
            <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              멋져요, 내일도 화이팅! 💪
            </Text>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}
