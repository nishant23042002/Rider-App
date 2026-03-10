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
  View,
} from 'react-native';

import axios from 'axios';
import { searchPlaces } from '../../services/places';
import { getPlaceDetails } from '../../services/placeDetails';

type Props = {
  placeholder?: string;
  defaultValue?: string;
  onLocationSelected: (coords: {
    latitude: number;
    longitude: number;
    description?: string;
  }) => void;
};

export default function DestinationSearch({
  placeholder = 'Where to?',
  defaultValue,
  onLocationSelected,
}: Props) {
  const [query, setQuery] = useState(defaultValue ||'');
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

        const places = await searchPlaces(text, cancelToken.current.token);

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

  const selectLocation = async (placeId: string, description: string) => {
    try {
      console.log('📍 PLACE ID:', placeId);

      const coords = await getPlaceDetails(placeId);

      console.log('📍 COORDS:', coords);

      if (coords) {
        onLocationSelected({
          latitude: coords.latitude,
          longitude: coords.longitude,
          description,
        });
      }

      setResults([]);
      setQuery(description);
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
        placeholder={placeholder}
        value={query}
        onChangeText={handleSearch}
      />

      {loading && <ActivityIndicator style={{ marginVertical: 10 }} />}

      {results.length > 0 && (
        <View style={styles.resultsBox}>
          <FlatList
            data={results}
            keyboardShouldPersistTaps="always"
            keyExtractor={item => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() =>{
                  console.log("Item Presseed")
                  selectLocation(
                    item.place_id,
                    item.description || item.structured_formatting.main_text,
                  )}
                }
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
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
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

  resultsBox: {
    maxHeight: 300,
    backgroundColor: 'white',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    elevation: 10,
    zIndex: 9999
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
