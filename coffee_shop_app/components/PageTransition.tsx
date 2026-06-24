import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * PageTransition - Hiệu ứng chuyển trang chuyên nghiệp
 * Fade-in + slide-up nhẹ trong 300ms, giống các web app thực tế.
 */
const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const progress = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    }, [progress])
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(progress.value, [0, 1], [0, 1]),
      transform: [
        {
          translateY: interpolate(progress.value, [0, 1], [18, 0]),
        },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.inner, animatedStyle]}>
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
});

export default PageTransition;
