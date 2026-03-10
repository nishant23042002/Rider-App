import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import RideMap from '../components/map/RideMap';
import DestinationSearch from '../components/search/DestinationSearch';
import BookingPanel from '../components/booking/BookingPanel';
import CenterPickupPin from '../components/map/CenterPickupPin';
import DriverMarker from '../components/map/DriverMarker';

import { usePickupPinAnimation } from '../hooks/usePickupPinAnimation';
import { useRoute } from '../hooks/useRoute';
import { useUserLocation } from '../hooks/useUserLocation';
import { useNearbyDrivers } from '../hooks/useNearbyDrivers';
import { useRideSocket } from '../hooks/useRideSocket';
import { useRideLifecycle } from '../hooks/useRideLifecycle';
import { useDriverTracking } from '../hooks/useDriveTracking';
import { reverseGeocode } from '../services/geocoding';
import { requestRideAPI } from '../services/rideService';

export default function RidePreviewScreen() {
  const mapRef = useRef<MapView | null>(null);

  const [destination, setDestination] = useState<any>(null);
  const [pickupLocked, setPickupLocked] = useState(false);
  const [pickupConfirmed, setPickupConfirmed] = useState(false);

  const [vehicleType, setVehicleType] = useState('auto');
  const [passengerCount, setPassengerCount] = useState(1);

  const [rideStatus, setRideStatus] = useState<
    'idle' | 'searching' | 'accepted'
  >('idle');

  useRideSocket('69a5678915baca003e367be0');

  const { pinPosition, shadowOpacity, liftPin, dropPin, isMoving } =
    usePickupPinAnimation();

  const {
    routeCoords,
    travelledCoords,
    setTravelledCoords,
    setRouteCoords,
    distance,
    duration,
    buildRoute,
    resetRoute,
  } = useRoute();

  const {
    pickup,
    setPickup,
    pickupAddress,
    setPickupAddress,
    getUserLocation,
  } = useUserLocation({
    mapRef,
    setDestination,
    setPickupConfirmed,
    setPickupLocked,
  });

  const resetUI = () => {
    setDestination(null);
    setPickupConfirmed(false);
    setPickupLocked(false);
  };
  const driverLocation = useDriverTracking(
    routeCoords,
    setRouteCoords,
    setTravelledCoords,
    rideStatus,
  );
  const drivers = useNearbyDrivers();

  useRideLifecycle(
    pickup,
    destination,
    mapRef,
    setRideStatus,
    resetRoute,
    resetUI,
  );

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  const handleRegionChangeComplete = useCallback(
    async (region: any) => {
      const coords = {
        latitude: region.latitude,
        longitude: region.longitude,
      };

      setDestination(null);
      setPickup(coords);

      const address = await reverseGeocode(region.latitude, region.longitude);

      setPickupAddress(address);
    },
    [setPickup, setPickupAddress, setDestination],
  );

  const handleDestination = useCallback(
    async (coords: any) => {
      setPickupConfirmed(true);
      setPickupLocked(true);
      setDestination(coords);

      if (!pickup) return;

      await buildRoute(pickup, coords);

      mapRef.current?.fitToCoordinates([pickup, coords], {
        edgePadding: { top: 120, right: 80, bottom: 300, left: 80 },
        animated: true,
      });
    },
    [pickup, buildRoute],
  );

  const requestRide = useCallback(async () => {
    if (!pickup || !destination) return;

    setRideStatus('searching');

    const ride = await requestRideAPI({
      pickup,
      destination,
      vehicleType,
      passengerCount,
    });

    console.log('Ride created', ride);
  }, [pickup, destination, vehicleType, passengerCount]);

  const driverMarkers = useMemo(() => {
    if (rideStatus !== 'idle') return null;

    return Object.values(drivers).map((driver: any) => (
      <Marker.Animated
        key={driver.id}
        coordinate={driver.coordinate}
        rotation={driver.heading}
        anchor={{ x: 0.5, y: 0.5 }}
        flat
      >
        <DriverMarker />
      </Marker.Animated>
    ));
  }, [drivers, rideStatus]);

  return (
    <View style={styles.container}>
      <View style={styles.searchCard}>
        <DestinationSearch
          placeholder={pickupAddress || 'Fetching current location...'}
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

      <RideMap
        mapRef={mapRef}
        pickup={pickup}
        destination={destination}
        routeCoords={routeCoords}
        travelledCoords={travelledCoords}
        pickupConfirmed={pickupConfirmed}
        driverAssigned={rideStatus === 'accepted'}
        driverLocation={driverLocation}
        driverMarkers={driverMarkers}
        liftPin={liftPin}
        dropPin={dropPin}
        isMoving={isMoving}
        handleRegionChangeComplete={handleRegionChangeComplete}
        pickupLocked={pickupLocked}
      />

      {destination && rideStatus !== 'searching' && (
        <BookingPanel
          vehicleType={vehicleType}
          passengerCount={passengerCount}
          setVehicleType={setVehicleType}
          setPassengerCount={setPassengerCount}
          requestRide={requestRide}
        />
      )}

      <CenterPickupPin
        pinPosition={pinPosition}
        shadowOpacity={shadowOpacity}
        pickupConfirmed={pickupConfirmed}
      />

      {distance > 0 && rideStatus !== 'accepted' && (
        <View style={styles.rideInfoBox}>
          <Text>Distance: {(distance / 1000).toFixed(2)} km</Text>
          <Text>ETA: {Math.ceil(duration / 60)} min</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  rideInfoBox: {
    position: 'absolute',
    bottom: 230,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    elevation: 5,
  },
});
