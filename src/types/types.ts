export type Ride = {
  _id: string;
  customer: string;
  driver: string;
  status: string;

  pickupLocation: {
    type: 'Point';
    coordinates: [number, number];
  };

  dropLocation: {
    type: 'Point';
    coordinates: [number, number];
  };

  estimatedFare: number;
  estimatedDistanceKm: number;
  passengerCount: number;
  rideType: string;
};

export type RootStackParamList = {
  Home: undefined;
  RideRequest: undefined;
  MapPickup: undefined;

  RideConfirm: {
    pickup: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
    distance: number;
    duration: number;
  };

  RidePreview: undefined;

  SearchingDriver: {
    rideId: string;
  };

  DriverTracking: {
    ride: Ride;
  };
};
