import axios from 'axios';

const GOOGLE_MAPS_API_KEY = 'AIzaSyD8F89IMJWc8Sn18ueBxUozeVqut2vG-pM';

export const reverseGeocode = async (latitude: number, longitude: number) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          latlng: `${latitude},${longitude}`,
          key: GOOGLE_MAPS_API_KEY,
        },
      },
    );

    if (response.data.results.length > 0) {
      return response.data.results[0].formatted_address;
    }

    return 'Unknown location';
  } catch (error) {
    console.log('Geocoding error:', error);
    return 'Unable to fetch address';
  }
};
