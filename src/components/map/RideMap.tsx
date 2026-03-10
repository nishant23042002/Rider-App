import React from 'react';
import MapView, { Marker } from 'react-native-maps';
import PickupMarker from './PickupMarker';
import DestinationMarker from './DestinationMarker';
import DriverMarker from './DriverMarker';
import RoutePolyline from './RoutePolyline';

export default function RideMap({
  mapRef,
  pickup,
  destination,
  routeCoords,
  travelledCoords,
  pickupConfirmed,
  driverAssigned,
  driverLocation,
  driverMarkers,
  liftPin,
  dropPin,
  isMoving,
  handleRegionChangeComplete,
  pickupLocked,
}: any) {
  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      provider="google"
      loadingEnabled
      initialRegion={{
        latitude: 18.4343,
        longitude: 73.1318,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      onRegionChange={() => {
        if (!isMoving.current) {
          isMoving.current = true;
          liftPin();
        }
      }}
      onRegionChangeComplete={region => {
        if (isMoving.current) {
          isMoving.current = false;
          dropPin();
        }

        if (!pickup) return;
        if (pickupLocked) return;

        handleRegionChangeComplete(region);
      }}
    >
      {pickupConfirmed && pickup && (
        <Marker coordinate={pickup}>
          <PickupMarker />
        </Marker>
      )}

      {destination && (
        <Marker coordinate={destination}>
          <DestinationMarker />
        </Marker>
      )}

      <RoutePolyline
        routeCoords={routeCoords}
        travelledCoords={travelledCoords}
      />

      {!driverAssigned && driverMarkers}

      {driverAssigned && (
        <Marker.Animated coordinate={driverLocation} flat>
          <DriverMarker />
        </Marker.Animated>
      )}
    </MapView>
  );
}
