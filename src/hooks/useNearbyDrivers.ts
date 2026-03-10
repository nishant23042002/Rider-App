import { useEffect, useRef, useState } from 'react';
import { AnimatedRegion } from 'react-native-maps';
import { socket } from '../socket/socket';
import { getRhumbLineBearing } from 'geolib';

export function useNearbyDrivers() {
  const [drivers, setDrivers] = useState<Record<string, any>>({});

  const driverAnimations = useRef<Record<string, AnimatedRegion>>({});
  const previousDrivers = useRef<Record<string, any>>({});

  useEffect(() => {
    const handler = (driverList: any[]) => {
      setDrivers(prev => {
        const updated = { ...prev };

        driverList.forEach(driver => {
          const id = driver.id || driver.driverId;

          const latitude = Number(driver.latitude ?? driver.lat);
          const longitude = Number(driver.longitude ?? driver.lng);

          const newCoords = { latitude, longitude };
          const prevCoords = previousDrivers.current[id];

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

  return drivers;
}
