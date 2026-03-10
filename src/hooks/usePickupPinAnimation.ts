import { useRef } from 'react';
import { Animated, Easing } from 'react-native';

export function usePickupPinAnimation() {
  const pinPosition = useRef(new Animated.Value(0)).current;
  const isMoving = useRef(false);

  const shadowOpacity = pinPosition.interpolate({
    inputRange: [-18, 0],
    outputRange: [1, 0],
  });

  const liftPin = () => {
    Animated.timing(pinPosition, {
      toValue: -18,
      duration: 120,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const dropPin = () => {
    Animated.timing(pinPosition, {
      toValue: 0,
      duration: 120,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  return { pinPosition, shadowOpacity, liftPin, dropPin, isMoving };
}
