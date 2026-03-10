import React from 'react';
import { Image, StyleSheet } from 'react-native';

/**
 * Renders the driver vehicle icon on map
 * Memoized for performance to prevent unnecessary re-renders
 */
const DriverMarker = React.memo(() => {
  console.log('🚗 Driver marker rendered');

  return (
    <Image
      source={require('../../assets/auto2_2d.png')}
      style={styles.image}
      resizeMode="contain"
    />
  );
});

export default DriverMarker;

const styles = StyleSheet.create({
  image: {
    width: 55,
    height: 55,
  },
});
