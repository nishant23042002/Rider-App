import React from 'react';
import { Polyline } from 'react-native-maps';

type LatLng = {
  latitude: number;
  longitude: number;
};

type Props = {
  routeCoords: LatLng[];
  travelledCoords: LatLng[];
};

function RoutePolyline({ routeCoords, travelledCoords }: Props) {
  return (
    <>
      {/* Full Route */}
      {routeCoords && routeCoords.length > 1 && (
        <Polyline
          coordinates={routeCoords}
          strokeWidth={5}
          strokeColor="#000"
          lineJoin="round"
          lineCap="round"
        />
      )}

      {/* Travelled Path */}
      {travelledCoords && travelledCoords.length > 1 && (
        <Polyline
          coordinates={travelledCoords}
          strokeWidth={6}
          strokeColor="#1E90FF"
          lineJoin="round"
          lineCap="round"
        />
      )}
    </>
  );
}

export default React.memo(RoutePolyline);
