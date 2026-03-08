import axios from 'axios';

const GOOGLE_API_KEY = 'AIzaSyD8F89IMJWc8Sn18ueBxUozeVqut2vG-pM';

export const getPlaceDetails = async (placeId: string) => {
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id: placeId,
          key: GOOGLE_API_KEY,
        },
      },
    );

    const location = response.data.result.geometry.location;

    return {
      latitude: location.lat,
      longitude: location.lng,
    };
  } catch (error) {
    console.log('Place details error:', error);
    return null;
  }
};
