import React from 'react';
import { View, Animated, StyleSheet } from 'react-native';

type Props = {
  pinPosition: Animated.Value;
  shadowOpacity: Animated.AnimatedInterpolation<number>;
  pickupConfirmed: boolean;
};

const CenterPickupPin = ({
  pinPosition,
  shadowOpacity,
  pickupConfirmed,
}: Props) => {
  if (pickupConfirmed) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pinContainer,
        { transform: [{ translateY: pinPosition }] },
      ]}
    >
      <View style={styles.pinHead}>
        <View style={styles.pinInner} />
      </View>

      <View style={styles.pinLine} />

      <Animated.View style={[styles.shadow, { opacity: shadowOpacity }]} />
    </Animated.View>
  );
};

export default React.memo(CenterPickupPin);

const styles = StyleSheet.create({
  pinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    alignItems: 'center',
    transform: [{ translateX: -9 }, { translateY: -20 }],
  },

  pinHead: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#65cf08',
    justifyContent: 'center',
    alignItems: 'center',
  },

  pinInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },

  pinLine: {
    width: 3,
    height: 20,
    backgroundColor: '#000',
  },

  shadow: {
    width: 6,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000000e2',
    marginTop: 4,
    marginLeft: 0.5,
  },
});
