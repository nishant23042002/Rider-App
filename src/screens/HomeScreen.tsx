import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, PermissionsAndroid, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { reverseGeocode } from '../services/geocoding';
import DestinationSearch from '../components/DestinationSearch';
import { Polyline } from 'react-native-maps';
import { getRoute } from '../services/directions';
import Geolocation from '@react-native-community/geolocation';
import { Animated } from 'react-native';

const PickupSelector = () => (
  <View style={styles.selectorContainer}>
    <View style={styles.selectorPin} />
    <View style={styles.selectorShadow} />
  </View>
);

export default function HomeScreen() {
  const [pickupAddress, setPickupAddress] = useState('Fetching location');
  const [destination, setDestination] = useState(null);
  const [pickupLocked, setPickupLocked] = useState(false)
  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [pickupConfirmed, setPickupConfirmed] = useState(false);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [searchingDriver, setSearchingDriver] = useState(false);
  const [pickup, setPickup] = useState<any>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const pinAnim = useRef(new Animated.Value(0)).current;

  const requestLocationPermission = useCallback(async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'App needs access to your location',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      console.log('LOCATION PERMISSION:', granted);

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        getUserLocation();
      }
    } catch (err) {
      console.log('Permission error:', err);
    }
  }, []);

  useEffect(() => {
    requestLocationPermission();
  }, [requestLocationPermission]);

  const getUserLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        console.log('📍 USER LOCATION:', coords);

        setPickup(coords);
      },

      error => {
        console.log('🚨 GEOLOCATION ERROR:', error.code, error.message);
      },

      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  };

  const handleRegionChangeComplete = (region: any) => {
    Animated.sequence([
      Animated.timing(pinAnim, {
        toValue: -15,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(pinAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      const coords = {
        latitude: region.latitude,
        longitude: region.longitude,
      };

      console.log('📍 FINAL PICKUP:', coords);

      setPickup(coords);

      const address = await reverseGeocode(region.latitude, region.longitude);

      console.log('🏠 PICKUP ADDRESS:', address);

      setPickupAddress(address);
    }, 600); // wait 600ms after user stops moving map
  };

  const handleDestination = async (coords: any) => {
    console.log('🎯 DESTINATION SELECTED:', coords);
    setPickupConfirmed(true);
    setPickupLocked(true)
    setDestination(coords);
    setSearchingDriver(true);

    if (!pickup) return;

    console.log('📡 REQUESTING ROUTE...');
    console.log('Pickup:', pickup);
    console.log('Destination:', coords);

    const route = await getRoute(pickup, coords);

    if (route) {
      console.log('✅ ROUTE RECEIVED');

      console.log('📏 Distance (meters):', route.distance);
      console.log('⏱ Duration (seconds):', route.duration);

      console.log('🗺 Polyline points:', route.coordinates.length);

      setRouteCoords(route.coordinates);
      setDistance(route.distance);
      setDuration(route.duration);

      mapRef.current?.fitToCoordinates([pickup, coords], {
        edgePadding: {
          top: 120,
          right: 80,
          bottom: 300,
          left: 80,
        },
        animated: true,
      });
    } else {
      console.log('❌ ROUTE FAILED');
    }
  };

  const dots = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(dots, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ).start();
  }, [dots]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
        showsMyLocationButton={true}
        initialRegion={{
          latitude: 18.4343,
          longitude: 73.1318,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onRegionChangeComplete={region => {
          if (!pickup) return;
          if(pickupLocked) return;
          handleRegionChangeComplete(region);
        }}
      >
        {/* PICKUP MARKER AFTER CONFIRM */}
        {pickupConfirmed && pickup && (
          <Marker coordinate={pickup}>
            <View style={styles.pickupMarker} />
          </Marker>
        )}

        {/* DESTINATION MARKER */}
        {destination && (
          <Marker coordinate={destination}>
            <View style={styles.destinationMarker} />
          </Marker>
        )}

        {/* ROUTE */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={6}
            strokeColor="#000"
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>

      {/* CENTER PICKUP SELECTOR */}
      {!pickupConfirmed && (
        <Animated.View
          style={[styles.pin, { transform: [{ translateY: pinAnim }] }]}
        >
          <PickupSelector />
        </Animated.View>
      )}

      <DestinationSearch onLocationSelected={handleDestination} />

      <View style={styles.addressBox}>
        <Text style={styles.addressText}>{pickupAddress}</Text>
      </View>

      {distance > 0 && (
        <View style={styles.rideInfoBox}>
          <Text style={styles.rideInfoText}>
            Distance: {(distance / 1000).toFixed(2)} km
          </Text>

          <Text style={styles.rideInfoText}>
            ETA: {Math.ceil(duration / 60)} min
          </Text>
        </View>
      )}

      {searchingDriver && (
        <View style={styles.searchBox}>
          <Text style={styles.searchText}>Searching for drivers...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  pin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -25,
    marginTop: -50,
  },

  pickupMarker: {
    width: 16,
    height: 16,
    backgroundColor: '#000',
    borderWidth: 3,
    borderColor: '#fff',
  },

  destinationMarker: {
    width: 16,
    height: 16,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#000',
  },

  selectorContainer: {
    alignItems: 'center',
  },

  selectorPin: {
    width: 14,
    height: 28,
    backgroundColor: '#000',
    borderRadius: 7,
  },

  selectorShadow: {
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginTop: 2,
  },

  addressBox: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    elevation: 5,
  },

  addressText: {
    fontSize: 16,
    fontWeight: '500',
  },

  rideInfoBox: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    elevation: 5,
  },

  rideInfoText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },

  searchBox: {
    position: 'absolute',
    bottom: 210,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    elevation: 5,
  },

  searchText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
