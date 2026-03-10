import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  vehicleType: string;
  passengerCount: number;
  setVehicleType: (v: string) => void;
  setPassengerCount: (n: number) => void;
  requestRide: () => void;
}

const BookingPanel = ({
  vehicleType,
  passengerCount,
  setVehicleType,
  setPassengerCount,
  requestRide,
}: Props) => {
  console.log('📦 Booking Panel Render');

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Choose Ride</Text>

      {/* VEHICLES */}

      <View style={styles.vehicleRow}>
        <TouchableOpacity
          style={[
            styles.vehicleButton,
            vehicleType === 'auto' && styles.vehicleActive,
          ]}
          onPress={() => setVehicleType('auto')}
        >
          <Text>Auto</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.vehicleButton,
            vehicleType === 'bike' && styles.vehicleActive,
          ]}
          onPress={() => setVehicleType('bike')}
        >
          <Text>Bike</Text>
        </TouchableOpacity>
      </View>

      {/* PASSENGERS */}

      <View style={styles.passengerRow}>
        <Text>Passengers</Text>

        <View style={styles.counter}>
          <TouchableOpacity
            onPress={() => setPassengerCount(Math.max(1, passengerCount - 1))}
          >
            <Text style={styles.counterBtn}>-</Text>
          </TouchableOpacity>

          <Text>{passengerCount}</Text>

          <TouchableOpacity
            onPress={() => setPassengerCount(Math.min(4, passengerCount + 1))}
          >
            <Text style={styles.counterBtn}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.bookButton} onPress={requestRide}>
        <Text style={styles.bookText}>Book Ride</Text>
      </TouchableOpacity>
    </View>
  );
}

export default React.memo(BookingPanel);

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },

  vehicleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },

  vehicleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#eee',
    alignItems: 'center',
  },

  vehicleActive: {
    backgroundColor: '#FFC107',
  },

  passengerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  counter: {
    flexDirection: 'row',
    gap: 15,
  },

  counterBtn: {
    fontSize: 22,
    fontWeight: '600',
  },

  bookButton: {
    backgroundColor: '#FFC107',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },

  bookText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
