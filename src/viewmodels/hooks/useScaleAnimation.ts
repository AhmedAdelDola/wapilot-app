import { GestureResponderEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export const useScaleAnimation = () => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlers = {
    onPressIn: () => { scale.value = withSpring(0.95); },
    onPressOut: () => { scale.value = withSpring(1); },
  };

  return { handlers, animatedStyle };
};
