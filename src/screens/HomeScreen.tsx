import React, { useEffect } from 'react';
import { View, StyleSheet, PermissionsAndroid } from 'react-native';
import MapView from 'react-native-maps';
import MaterialIcons from '@react-native-vector-icons/material-icons';

export default function HomeScreen() {
  useEffect(() => {
    requestLocationPermission();
  }, []);

  async function requestLocationPermission() {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    console.log('LOCATION PERMISSION:', granted);
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        showsUserLocation={true}
        followsUserLocation={true}
        showsMyLocationButton={true}
        initialRegion={{
          latitude: 18.4396,
          longitude: 73.1185,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onRegionChangeComplete={region => {
          console.log('Pickup:', region.latitude, region.longitude);
        }}
      />

      <View style={styles.pin}>
        <MaterialIcons name="location-pin" size={40} color="black" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  map: { flex: 1 },

  pin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -25,
    marginTop: -50,
  },
});
