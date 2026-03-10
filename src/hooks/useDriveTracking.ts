import { useEffect, useRef } from 'react';
import { AnimatedRegion } from 'react-native-maps';
import { socket } from '../socket/socket';

type LatLng = {
  latitude: number;
  longitude: number;
};

export function useDriverTracking(
  routeCoords: LatLng[],
  setRouteCoords: React.Dispatch<React.SetStateAction<LatLng[]>>,
  setTravelledCoords: React.Dispatch<React.SetStateAction<LatLng[]>>,
  rideStatus: string,
) {
  const driverLocation = useRef(
    new AnimatedRegion({
      latitude: 18.4343,
      longitude: 73.1318,
      latitudeDelta: 0,
      longitudeDelta: 0,
    }),
  ).current;

  useEffect(() => {
    if (rideStatus !== 'accepted') return;

    const handler = (data: any) => {
      const lat = Number(data.lat);
      const lng = Number(data.lng);

      (driverLocation as any)
        .timing({
          latitude: lat,
          longitude: lng,
          duration: 1200,
          useNativeDriver: false,
        })
        .start();

      if (!routeCoords.length) return;

      let closestIndex = 0;
      let minDist = Infinity;

      routeCoords.forEach((point, index) => {
        const dist =
          Math.pow(point.latitude - lat, 2) +
          Math.pow(point.longitude - lng, 2);

        if (dist < minDist) {
          minDist = dist;
          closestIndex = index;
        }
      });

      const travelled = routeCoords.slice(0, closestIndex + 1);
      const remaining = routeCoords.slice(closestIndex);

      setTravelledCoords(travelled);
      setRouteCoords(remaining);
    };

    socket.on('driver-location', handler);

    return () => {
      socket.off('driver-location', handler);
    };
  }, [rideStatus, routeCoords, driverLocation, setRouteCoords, setTravelledCoords]);

  return driverLocation;
}
