import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  PermissionsAndroid,
  Text,
  Easing,
  Image,
  Animated,
  TouchableOpacity,
} from 'react-native';

import MapView, { Marker, Polyline, AnimatedRegion } from 'react-native-maps';
import { getRhumbLineBearing } from 'geolib';

import { reverseGeocode } from '../services/geocoding';
import DestinationSearch from '../components/DestinationSearch';
import { getRoute } from '../services/directions';
import Geolocation from '@react-native-community/geolocation';
import { socket } from '../socket/socket';

const DriverMarker = React.memo(() => {
  return (
    <Image
      source={require('../assets/auto2_2d.png')}
      style={styles.driverImage}
      resizeMode="contain"
    />
  );
});

export default function RidePreviewScreen() {
  const [pickupAddress, setPickupAddress] = useState('Fetching location');
  const [destination, setDestination] = useState<any>(null);
  const [pickupLocked, setPickupLocked] = useState(false);
  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [pickupConfirmed, setPickupConfirmed] = useState(false);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [searchingDriver, setSearchingDriver] = useState(false);
  const [driverAssigned, setDriverAssigned] = useState(false);
  const [pickup, setPickup] = useState<any>(null);
  const [drivers, setDrivers] = useState<Record<string, any>>({});
  const driverAnimations = useRef<Record<string, AnimatedRegion>>({});
  const previousDrivers = useRef<Record<string, any>>({});
  const [vehicleType, setVehicleType] = useState('auto');
  const [passengerCount, setPassengerCount] = useState(1);
  const [assignedDriver, setAssignedDriver] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [rideStatus, setRideStatus] = useState<
    | 'idle'
    | 'searching'
    | 'accepted'
    | 'driver_to_pickup'
    | 'arrived'
    | 'started'
    | 'completed'
  >('idle');

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

  const driverLocation = useRef(
    new AnimatedRegion({
      latitude: 18.4343,
      longitude: 73.1318,
      latitudeDelta: 0,
      longitudeDelta: 0,
    }),
  ).current;

  useEffect(() => {
    const CUSTOMER_ID = '69a5678915baca003e367be0';

    const connectHandler = () => {
      console.log('🟢 SOCKET CONNECTED:', socket.id);

      socket.emit('register-customer', CUSTOMER_ID);

      socket.emit('join-map-room');
    };

    socket.on('connect', connectHandler);

    return () => {
      socket.off('connect', connectHandler);
    };
  }, []);

  useEffect(() => {
    if (routeCoords.length === 0) return;

    let i = 0;

    const interval = setInterval(() => {
      setAnimatedRoute(routeCoords);

      i++;

      if (i >= routeCoords.length) {
        clearInterval(interval);
      }
    }, 8);

    return () => clearInterval(interval);
  }, [routeCoords]);

  useEffect(() => {
    const handler = (driverList: any[]) => {
      setDrivers(prevDrivers => {
        const updated = { ...prevDrivers };

        driverList.forEach(driver => {
          const id = driver.id || driver.driverId;

          const latitude = Number(driver.latitude ?? driver.lat);
          const longitude = Number(driver.longitude ?? driver.lng);

          const newCoords = { latitude, longitude };

          const prevCoords = previousDrivers.current[id];

          if (
            prevCoords &&
            prevCoords.latitude === latitude &&
            prevCoords.longitude === longitude
          ) {
            return;
          }

          let heading = 0;

          if (prevCoords) {
            const rawHeading = getRhumbLineBearing(prevCoords, newCoords);
            heading = (rawHeading + 360) % 360;
          }

          previousDrivers.current[id] = newCoords;

          if (!driverAnimations.current[id]) {
            driverAnimations.current[id] = new AnimatedRegion({
              latitude,
              longitude,
              latitudeDelta: 0,
              longitudeDelta: 0,
            });
          } else {
            (driverAnimations.current[id] as any)
              .timing({
                latitude,
                longitude,
                duration: 1500,
                useNativeDriver: false,
              })
              .start();
          }

          updated[id] = {
            id,
            heading,
            coordinate: driverAnimations.current[id],
          };
        });

        return updated;
      });
    };

    socket.on('nearbyDrivers', handler);

    return () => {
      socket.off('nearbyDrivers', handler);
    };
  }, []);

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

  useEffect(() => {
    const handler = (data: any) => {
      console.log('Driver GPS:', data);

      const lat = data.lat;
      const lng = data.lng;

      (driverLocation as any)
        .timing({
          latitude: lat,
          longitude: lng,
          duration: 1200,
          useNativeDriver: false,
        })
        .start();

      // update route progress
      setRouteCoords(prev => {
        if (!prev.length) return prev;

        let closestIndex = 0;
        let minDist = Infinity;

        prev.forEach((point, index) => {
          const dist =
            Math.pow(point.latitude - lat, 2) +
            Math.pow(point.longitude - lng, 2);

          if (dist < minDist) {
            minDist = dist;
            closestIndex = index;
          }
        });

        return prev.slice(closestIndex);
      });
    };

    socket.on('driver-location', handler);

    return () => {
      socket.off('driver-location', handler);
    };
  }, []);

  useEffect(() => {
    const handler = (ride: any) => {
      console.log('Driver accepted:', ride);

      setDriverAssigned(true);
      setSearchingDriver(false);
      setRideStatus('accepted');

      mapRef.current?.fitToCoordinates(
        [
          {
            latitude: pickup.latitude,
            longitude: pickup.longitude,
          },
          {
            latitude: destination.latitude,
            longitude: destination.longitude,
          },
        ],
        {
          edgePadding: { top: 200, right: 100, bottom: 200, left: 100 },
          animated: true,
        },
      );
    };

    socket.on('ride-accepted', handler);

    return () => {
      socket.off('ride-accepted', handler);
    };
  }, [pickup, destination]);

  useEffect(() => {
    socket.on('ride-arrived', ride => {
      console.log('Driver arrived');
    });
  }, []);

  useEffect(() => {
    socket.on('ride-started', ride => {
      console.log('Ride started');
    });
  }, []);

  useEffect(() => {
    socket.on('ride-completed', ride => {
      console.log('Ride finished');

      setDriverAssigned(false);
    });
  }, []);

  const getUserLocation = () => {
    Geolocation.getCurrentPosition(
      async position => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setPickup(coords);

        // reverse geocode current location
        const address = await reverseGeocode(coords.latitude, coords.longitude);

        setPickupAddress(address);

        setRouteCoords([]);
        setDistance(0);
        setDuration(0);
        setDestination(null);
        setPickupConfirmed(false);
        setPickupLocked(false);
        setSearchingDriver(false);

        // move map to user
        mapRef.current?.animateToRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      },
      error => {
        console.log('🚨 GEOLOCATION ERROR:', error.code, error.message);
      },
      {
        enableHighAccuracy: true,
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

      setRouteCoords([]);
      setDistance(0);
      setDuration(0);
      setDestination(null);
      setSearchingDriver(false);

      setPickup(coords);

      const address = await reverseGeocode(region.latitude, region.longitude);
      setPickupAddress(address);
    }, 600);
  };

  const handleDestination = async (coords: any) => {
    setPickupConfirmed(true);
    setPickupLocked(true);
    setDestination(coords);

    console.log('Destination Selected');

    if (!pickup) return;

    const route = await getRoute(pickup, coords);

    if (route) {
      const correctedRoute = [pickup, ...route.coordinates, coords];

      setRouteCoords(correctedRoute);
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
    }
  };

  const requestRide = async () => {
    try {
      setRideStatus('searching');

      const response = await fetch('http://10.0.2.2:5000/api/ride/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: '69a5678915baca003e367be0',

          pickupLatitude: pickup.latitude,
          pickupLongitude: pickup.longitude,

          dropLatitude: destination.latitude,
          dropLongitude: destination.longitude,

          vehicleType,
          passengerCount,
          rideType: 'private',
        }),
      });

      const data = await response.json();

      console.log('Ride created:', data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View style={styles.container}>
      <View pointerEvents="box-none" style={styles.searchCard}>
        <DestinationSearch
          placeholder={pickupAddress || "Fetching current location..."}
          onLocationSelected={coords => {
            setPickup(coords);

            mapRef.current?.animateToRegion({
              latitude: coords.latitude,
              longitude: coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }}
        />

        <DestinationSearch
          placeholder="Where to?"
          onLocationSelected={handleDestination}
        />
      </View>
      <MapView
        ref={mapRef}
        style={styles.map}
        loadingEnabled
        provider="google"
        moveOnMarkerPress={false}
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
        {pickupConfirmed && pickup && (
          <Marker coordinate={pickup} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.markerWrapper}>
              <View style={styles.pickupMarker}>
                <View style={styles.pickupMarkerInner} />
              </View>
            </View>
          </Marker>
        )}

        {destination && (
          <Marker coordinate={destination} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.markerWrapper}>
              <View style={styles.destinationMarker}>
                <View style={styles.destinationMarkerInner} />
              </View>
            </View>
          </Marker>
        )}

        {routeCoords.length > 0 && (
          <>
            <Polyline
              coordinates={routeCoords}
              strokeWidth={6}
              strokeColor="#e0e0e0"
            ></Polyline>
            <Polyline
              coordinates={animatedRoute}
              strokeWidth={6}
              strokeColor="#000"
              lineCap="round"
              lineJoin="round"
            />
          </>
        )}

        {!driverAssigned &&
          Object.values(drivers).map((driver: any) => (
            <Marker.Animated
              key={driver.id}
              coordinate={driver.coordinate}
              rotation={driver.heading}
              anchor={{ x: 0.5, y: 0.5 }}
              flat
            >
              <DriverMarker />
            </Marker.Animated>
          ))}
        {driverAssigned && (
          <Marker.Animated
            coordinate={driverLocation as any}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
          >
            <DriverMarker />
          </Marker.Animated>
        )}
      </MapView>

      {destination && !searchingDriver && !driverAssigned && (
        <View style={styles.bookingPanel}>
          <Text style={styles.panelTitle}>Choose Ride</Text>

          {/* VEHICLE TYPE */}

          <View style={styles.vehicleRow}>
            <TouchableOpacity
              style={[
                styles.vehicleButton,
                vehicleType === 'auto' && styles.vehicleActive,
              ]}
              onPress={() => setVehicleType('auto')}
            >
              <Text>Auto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.vehicleButton,
                vehicleType === 'bike' && styles.vehicleActive,
              ]}
              onPress={() => setVehicleType('bike')}
            >
              <Text>Bike</Text>
            </TouchableOpacity>
          </View>

          {/* PASSENGER COUNT */}

          <View style={styles.passengerRow}>
            <Text>Passengers</Text>

            <View style={styles.counter}>
              <TouchableOpacity
                onPress={() =>
                  setPassengerCount(Math.max(1, passengerCount - 1))
                }
              >
                <Text style={styles.counterBtn}>-</Text>
              </TouchableOpacity>

              <Text style={styles.counterValue}>{passengerCount}</Text>

              <TouchableOpacity
                onPress={() =>
                  setPassengerCount(Math.min(4, passengerCount + 1))
                }
              >
                <Text style={styles.counterBtn}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* BOOK BUTTON */}

          <TouchableOpacity style={styles.bookRideButton} onPress={requestRide}>
            <Text style={styles.bookRideText}>Book Ride</Text>
          </TouchableOpacity>
        </View>
      )}

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

      {!pickupConfirmed && (
        <View style={styles.addressBox}>
          <Text style={styles.addressText}>{pickupAddress}</Text>
        </View>
      )}

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

      {rideStatus === 'searching' && (
        <View style={styles.searchBox}>
          <Text style={styles.searchText}>Searching for drivers...</Text>
        </View>
      )}

      {rideStatus === 'accepted' && (
        <View style={styles.driverAssignedBox}>
          <Text style={styles.driverAssignedText}>Driver assigned 🚗</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  driverImage: {
    width: 55,
    height: 55,
  },

  searchCard: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 14,
    elevation: 6,
    zIndex: 1000,
  },

  bookingPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
  },

  panelTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },

  vehicleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },

  vehicleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#eee',
    alignItems: 'center',
  },

  vehicleActive: {
    backgroundColor: '#FFC107',
  },

  passengerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },

  counterBtn: {
    fontSize: 22,
    fontWeight: '600',
  },

  counterValue: {
    fontSize: 18,
  },

  bookRideContainer: {
    position: 'absolute',
    bottom: 220,
    left: 20,
    right: 20,
  },

  bookRideButton: {
    backgroundColor: '#FFC107',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },

  bookRideText: {
    fontSize: 18,
    fontWeight: '700',
  },

  driverAssignedBox: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    elevation: 5,
  },

  driverAssignedText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  markerWrapper: {
    alignItems: 'center',
  },

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
