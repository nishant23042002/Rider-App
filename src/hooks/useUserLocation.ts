import { useState, useCallback } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { reverseGeocode } from '../services/geocoding';

type Props = {
  mapRef: any;

  setDestination: React.Dispatch<any>;
  setPickupConfirmed: React.Dispatch<boolean>;
  setPickupLocked: React.Dispatch<boolean>;
};

export function useUserLocation({
  mapRef,
  setDestination,
  setPickupConfirmed,
  setPickupLocked,
}: Props) {
  const [pickup, setPickup] = useState<any>(null);
  const [pickupAddress, setPickupAddress] = useState('Fetching location');

  const getUserLocation = useCallback(() => {
    Geolocation.getCurrentPosition(
      async position => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setPickup(coords);

        const address = await reverseGeocode(coords.latitude, coords.longitude);

        setPickupAddress(address);

        setDestination(null);
        setPickupConfirmed(false);
        setPickupLocked(false);

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
  }, [
    mapRef,
    setDestination,
    setPickupConfirmed,
    setPickupLocked
  ]);

  return {
    pickup,
    setPickup,
    pickupAddress,
    setPickupAddress,
    getUserLocation,
  };
}
