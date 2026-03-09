import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  title: string;
  duration?: number;
}

export default function RouteLabel({ title, duration }: Props) {
  return (
    <View style={styles.container}>
      {duration && (
        <View style={styles.durationBox}>
          <Text style={styles.durationText}>{duration} min</Text>
        </View>
      )}

      <View style={styles.labelBox}>
        <Text numberOfLines={1} style={styles.labelText}>
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  durationBox: {
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 6,
  },

  durationText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  labelBox: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    elevation: 5,
    maxWidth: 200,
  },

  labelText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
