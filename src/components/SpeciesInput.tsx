import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SPECIES_SUGGESTIONS } from '../constants/speciesSuggestions';

type SpeciesInputProps = {
  value: string;
  onChangeText: (text: string) => void;
};

export function SpeciesInput({ value, onChangeText }: SpeciesInputProps) {
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return SPECIES_SUGGESTIONS;
    return SPECIES_SUGGESTIONS.filter((species) => species.toLowerCase().includes(query));
  }, [value]);

  const showSuggestions = focused && suggestions.length > 0;

  return (
    <View>
      <TextInput
        style={styles.input}
        placeholder="e.g. Dog, Axolotl, Bearded Dragon"
        accessibilityLabel="Species"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        autoCapitalize="words"
      />
      {showSuggestions ? (
        <View style={styles.suggestionList}>
          {suggestions.map((species) => (
            <Pressable
              key={species}
              style={styles.suggestionRow}
              onPress={() => {
                onChangeText(species);
                setFocused(false);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.suggestionText}>{species}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  suggestionList: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 160,
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 15,
  },
});
