import React from 'react';
import { View, StyleSheet } from 'react-native';

const PickupMarker = React.memo(() => {
  console.log('📍 Pickup Marker Rendered');

  return (
    <View style={styles.wrapper}>
      <View style={styles.marker}>
        <View style={styles.inner} />
      </View>
    </View>
  );
});

export default PickupMarker;


const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },

  marker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  inner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
});
