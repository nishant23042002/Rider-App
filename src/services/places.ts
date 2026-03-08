import axios from 'axios';

const GOOGLE_API_KEY = 'AIzaSyD8F89IMJWc8Sn18ueBxUozeVqut2vG-pM';

export const searchPlaces = async (input: string, cancelToken?: any) => {
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/autocomplete/json',
      {
        params: {
          input,
          key: GOOGLE_API_KEY,
          components: 'country:in',
        },
        cancelToken
      },
    );

    return response.data.predictions;
  } catch (error) {
    console.log('Places API error:', error);
    return [];
  }
};
