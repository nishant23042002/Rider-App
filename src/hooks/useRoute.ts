import { useState } from 'react';
import { getRoute } from '../services/directions';

type LatLng = {
  latitude: number;
  longitude: number;
};

export function useRoute() {
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [travelledCoords, setTravelledCoords] = useState<LatLng[]>([]);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const buildRoute = async (pickup: LatLng, destination: LatLng) => {
    const route = await getRoute(pickup, destination);

    if (!route) return;

    const coords = [pickup, ...route.coordinates, destination];

    setRouteCoords(coords);
    setTravelledCoords([]);
    setDistance(route.distance);
    setDuration(route.duration);
  };

  const resetRoute = () => {
    setRouteCoords([]);
    setTravelledCoords([]);
    setDistance(0);
    setDuration(0);
  };

  return {
    routeCoords,
    travelledCoords,
    setRouteCoords,
    setTravelledCoords,
    distance,
    duration,
    buildRoute,
    resetRoute,
  };
}
