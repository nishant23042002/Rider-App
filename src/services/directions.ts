import axios from 'axios';
import polyline from '@mapbox/polyline';

const GOOGLE_API_KEY = 'AIzaSyD8F89IMJWc8Sn18ueBxUozeVqut2vG-pM';

export const getRoute = async (origin: any, destination: any) => {
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/directions/json',
      {
        params: {
          origin: `${origin.latitude},${origin.longitude}`,
          destination: `${destination.latitude},${destination.longitude}`,
          key: GOOGLE_API_KEY,
        },
      },
    );

    const route = response.data.routes[0];

    const points = polyline.decode(route.overview_polyline.points);

    const coordinates = points.map((point: any) => ({
      latitude: point[0],
      longitude: point[1],
    }));

    return {
      coordinates,
      distance: route.legs[0].distance.value,
      duration: route.legs[0].duration.value,
    };
  } catch (error) {
    console.log('Directions error:', error);
    return null;
  }
};
