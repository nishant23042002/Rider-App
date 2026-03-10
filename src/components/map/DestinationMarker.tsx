import React from 'react';
import { View, StyleSheet } from 'react-native';

const DestinationMarker = React.memo(() => {
  console.log('📍 Destination Marker Rendered');

  return (
    <View style={styles.wrapper}>
      <View style={styles.marker}>
        <View style={styles.inner} />
      </View>
    </View>
  );
});

export default DestinationMarker

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },

  marker: {
    width: 16,
    height: 16,
    backgroundColor: '#f90404',
    justifyContent: 'center',
    alignItems: 'center',
  },

  inner: {
    width: 5,
    height: 5,
    backgroundColor: '#fff',
  },
});
