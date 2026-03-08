import React, { useState, useRef } from 'react';
import {
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import axios from 'axios';
import { searchPlaces } from '../services/places';
import { getPlaceDetails } from '../services/placeDetails';

export default function DestinationSearch({ onLocationSelected }: any) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelToken = useRef<any>(null);

  const handleSearch = (text: string) => {
    setQuery(text);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (cancelToken.current) {
      cancelToken.current.cancel('New request started');
    }

    if (text.length < 3) {
      setResults([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        setLoading(true);

        cancelToken.current = axios.CancelToken.source();

        console.log('🔎 Searching:', text);

        const places = await searchPlaces(text, cancelToken?.current.token);

        console.log('📍 Results:', places.length);

        setResults(places);
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('❌ Request cancelled');
        } else {
          console.log('🚨 Search error:', error);
        }
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const selectLocation = async (placeId: string) => {
    try {
      console.log('📍 PLACE ID:', placeId);

      const coords = await getPlaceDetails(placeId);

      console.log('📍 COORDS:', coords);

      if (coords) {
        onLocationSelected(coords);
      }

      setResults([]);
      setQuery('');
    } catch (error) {
      console.log('🚨 Place details error:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <TextInput
        style={styles.input}
        placeholder="Where to?"
        value={query}
        onChangeText={handleSearch}
      />

      {loading && <ActivityIndicator style={{ marginVertical: 10 }} />}

      <FlatList
        data={results}
        keyboardShouldPersistTaps="handled"
        keyExtractor={item => item.place_id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => selectLocation(item.place_id)}
            style={styles.item}
          >
            <Text style={styles.title}>
              {item.structured_formatting.main_text}
            </Text>

            <Text style={styles.subtitle}>
              {item.structured_formatting.secondary_text}
            </Text>
          </TouchableOpacity>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 5,
  },

  input: {
    padding: 14,
    fontSize: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  item: {
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
  },

  subtitle: {
    fontSize: 14,
    color: '#777',
  },
});
