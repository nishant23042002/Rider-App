import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  PermissionsAndroid,
  Text,
  Easing,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { reverseGeocode } from '../services/geocoding';
import DestinationSearch from '../components/DestinationSearch';
import { Polyline } from 'react-native-maps';
import { getRoute } from '../services/directions';
import Geolocation from '@react-native-community/geolocation';
import { Animated } from 'react-native';
import io from 'socket.io-client';
import MaterialIcons from '@react-native-vector-icons/material-icons';

const socket = io('http://10.0.2.2:5000');

const DriverMarker = () => (
  <View style={styles.driverMarker}>
    <MaterialIcons name="directions-car" size={22} color="#fff" />
  </View>
);

export default function HomeScreen() {
  const [pickupAddress, setPickupAddress] = useState('Fetching location');
  const [destination, setDestination] = useState(null);
  const [pickupLocked, setPickupLocked] = useState(false);
  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [pickupConfirmed, setPickupConfirmed] = useState(false);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [searchingDriver, setSearchingDriver] = useState(false);
  const [pickup, setPickup] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);

  const mapRef = useRef<MapView | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinPosition = useRef(new Animated.Value(0)).current;
  const isMoving = useRef(false);
  const [animatedRoute, setAnimatedRoute] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  const shadowOpacity = pinPosition.interpolate({
    inputRange: [-18, 0],
    outputRange: [1, 0],
  });

  useEffect(() => {
    socket.on('connect', () => {
      console.log('🟢 SOCKET CONNECTED:', socket.id);
    });
  }, []);

  useEffect(() => {
    if (routeCoords.length === 0) return;

    let i = 0;

    const interval = setInterval(() => {
      setAnimatedRoute(routeCoords.slice(0, i));

      i++;

      if (i >= routeCoords.length) {
        clearInterval(interval);
      }
    }, 8); // smaller = faster drawing

    return () => clearInterval(interval);
  }, [routeCoords]);

  useEffect(() => {
    const handler = (driverList: any) => {
      console.log('🚗 Drivers received:', driverList);
      setDrivers(driverList);
    };

    socket.on('nearbyDrivers', handler);

    return () => {
      socket.off('nearbyDrivers', handler);
    };
  }, []);

  useEffect(() => {
    console.log('Drivers state:', drivers);
  }, [drivers]);

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
        setRouteCoords([]);
        setDistance(0);
        setDuration(0);
        setDestination(null);
        setPickupConfirmed(false);
        setPickupLocked(false);
        setSearchingDriver(false);
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
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      const coords = {
        latitude: region.latitude,
        longitude: region.longitude,
      };

      console.log('📍 FINAL PICKUP:', coords);

      setRouteCoords([]);
      setDistance(0);
      setDuration(0);
      setDestination(null);
      setSearchingDriver(false);

      setPickup(coords);

      const address = await reverseGeocode(region.latitude, region.longitude);

      console.log('🏠 PICKUP ADDRESS:', address);

      setPickupAddress(address);
    }, 600); // wait 600ms after user stops moving map
  };

  const handleDestination = async (coords: any) => {
    console.log('🎯 DESTINATION SELECTED:', coords);
    setPickupConfirmed(true);
    setPickupLocked(true);
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

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation
        showsMyLocationButton
        initialRegion={{
          latitude: 18.4343,
          longitude: 73.1318,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onRegionChange={() => {
          if (!isMoving.current) {
            isMoving.current = true;
            liftPin();
          }
        }}
        onRegionChangeComplete={region => {
          if (isMoving.current) {
            isMoving.current = false;
            dropPin();
          }

          if (!pickup) return;
          if (pickupLocked) return;

          handleRegionChangeComplete(region);
        }}
      >
        {/* PICKUP MARKER AFTER CONFIRM */}
        {pickupConfirmed && pickup && (
          <Marker coordinate={pickup}>
            <View style={styles.pickupMarker}>
              <View style={styles.pickupMarkerInner} />
            </View>
          </Marker>
        )}

        {/* DESTINATION MARKER */}
        {destination && (
          <Marker coordinate={destination}>
            <View style={styles.destinationMarker}>
              <View style={styles.destinationMarkerInner} />
            </View>
          </Marker>
        )}

        {/* ROUTE */}
        {routeCoords.length > 0 && (
          <>
            <Polyline
              coordinates={routeCoords}
              strokeWidth={6}
              strokeColor="#e0e0e0"
            />
            <Polyline
              coordinates={animatedRoute}
              strokeWidth={6}
              strokeColor="#000"
              lineCap="round"
              lineJoin="round"
            />
          </>
        )}

        {drivers.map(driver => (
          <Marker
            key={driver.id || driver.driverId}
            coordinate={{
              latitude: driver.latitude ?? driver.lat,
              longitude: driver.longitude ?? driver.lng,
            }}
            tracksViewChanges={false}
          >
            <DriverMarker />
          </Marker>
        ))}
      </MapView>

      {/* CENTER PICKUP SELECTOR */}
      {!pickupConfirmed && (
        <Animated.View
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
  container: { flex: 1 },

  map: { flex: 1 },

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

  pickupMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  pickupMarkerInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },

  destinationMarker: {
    width: 16,
    height: 16,
    backgroundColor: '#f90404',
    justifyContent: 'center',
    alignItems: 'center',
  },

  destinationMarkerInner: {
    width: 5,
    height: 5,
    backgroundColor: '#fff',
  },

  driverMarker: {
    backgroundColor: '#000',
    padding: 6,
    borderRadius: 20,
    elevation: 4,
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
    bottom: 100,
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
    bottom: 190,
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
