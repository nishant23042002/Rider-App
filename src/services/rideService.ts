export async function requestRideAPI({
  pickup,
  destination,
  vehicleType,
  passengerCount,
}: any) {
  const response = await fetch('http://10.0.2.2:5000/api/ride/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId: '69a5678915baca003e367be0',

      pickupLatitude: pickup.latitude,
      pickupLongitude: pickup.longitude,

      dropLatitude: destination.latitude,
      dropLongitude: destination.longitude,

      vehicleType,
      passengerCount,
      rideType: 'private',
    }),
  });

  return response.json();
}
