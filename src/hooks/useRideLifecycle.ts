import { useEffect } from 'react';
import { socket } from '../socket/socket';

export function useRideLifecycle(
  pickup: any,
  destination: any,
  mapRef: any,
  setRideStatus: any,
  resetRoute: () => void,
  resetUI: () => void,
) {
  useEffect(() => {
    const acceptedHandler = (ride: any) => {
      console.log('🚗 Driver accepted ride:', ride);

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

    const arrivedHandler = () => {
      console.log('📍 Driver arrived at pickup');
    };

    const startedHandler = () => {
      console.log('🟢 Ride started');
    };

    const completedHandler = () => {
      console.log('✅ Ride completed');

      resetRoute();
      resetUI();
      setRideStatus('idle');
    };

    socket.on('ride-accepted', acceptedHandler);
    socket.on('ride-arrived', arrivedHandler);
    socket.on('ride-started', startedHandler);
    socket.on('ride-completed', completedHandler);

    return () => {
      socket.off('ride-accepted', acceptedHandler);
      socket.off('ride-arrived', arrivedHandler);
      socket.off('ride-started', startedHandler);
      socket.off('ride-completed', completedHandler);
    };
  }, [pickup, destination, mapRef, setRideStatus, resetRoute, resetUI]);
}
