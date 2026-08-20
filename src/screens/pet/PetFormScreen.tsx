import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { SpeciesInput } from '../../components/SpeciesInput';
import { usePack } from '../../hooks/usePack';
import { usePet } from '../../hooks/usePet';
import { createPet, updatePet } from '../../lib/petsApi';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PetForm'>;

const SEX_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Unknown', value: 'unknown' },
];

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function PetFormScreen({ route, navigation }: Props) {
  const petId = route.params?.petId;
  const isEditing = !!petId;

  const { packId } = usePack();
  const { pet, loading: loadingPet, error: loadError, refetch: refetchPet } = usePet(petId);

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState<string | null>(null);
  const [birthdate, setBirthdate] = useState<Date | null>(null);
  const [isEstimatedAge, setIsEstimatedAge] = useState(false);
  const [microchipId, setMicrochipId] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Pet' : 'Add Pet' });
  }, [isEditing, navigation]);

  useEffect(() => {
    refetchPet();
  }, [refetchPet]);

  useEffect(() => {
    if (!pet) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prefilling the form once edit-mode data arrives
    setName(pet.name);
    setSpecies(pet.species);
    setBreed(pet.breed ?? '');
    setSex(pet.sex);
    setBirthdate(pet.birthdate ? new Date(pet.birthdate) : null);
    setIsEstimatedAge(pet.is_estimated_age);
    setMicrochipId(pet.microchip_id ?? '');
  }, [pet]);

  const handleSave = async () => {
    if (!name.trim() || !species.trim()) {
      setError('Name and species are required.');
      return;
    }

    if (!isEditing && !packId) {
      setError('No pack found for this account yet. Please try again in a moment.');
      return;
    }

    setError(null);
    setSaving(true);

    const input = {
      name: name.trim(),
      species: species.trim(),
      breed: breed.trim() || null,
      sex,
      birthdate: birthdate ? formatDate(birthdate) : null,
      is_estimated_age: isEstimatedAge,
      microchip_id: microchipId.trim() || null,
    };

    const result =
      isEditing && petId ? await updatePet(petId, input) : await createPet(packId as string, input);

    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    navigation.goBack();
  };

  if (isEditing && loadingPet) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isEditing && loadError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{loadError}</Text>
        <Pressable style={styles.retryButton} onPress={refetchPet}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Pet's name"
        accessibilityLabel="Pet's name"
      />

      <Text style={styles.label}>Species</Text>
      <SpeciesInput value={species} onChangeText={setSpecies} />

      <Text style={styles.label}>Breed</Text>
      <TextInput
        style={styles.input}
        value={breed}
        onChangeText={setBreed}
        placeholder="Optional"
        accessibilityLabel="Breed"
      />

      <Text style={styles.label}>Sex</Text>
      <View style={styles.segmentRow}>
        {SEX_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[styles.segment, sex === option.value && styles.segmentSelected]}
            onPress={() => setSex(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: sex === option.value }}
          >
            <Text style={[styles.segmentText, sex === option.value && styles.segmentTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Birthdate</Text>
      <Pressable
        style={styles.input}
        onPress={() => setShowDatePicker(true)}
        accessibilityRole="button"
        accessibilityLabel={`Birthdate, ${birthdate ? formatDate(birthdate) : 'not set'}`}
      >
        <Text>{birthdate ? formatDate(birthdate) : 'Not set'}</Text>
      </Pressable>
      {showDatePicker ? (
        <DateTimePicker
          value={birthdate ?? new Date()}
          mode="date"
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (event.type === 'set' && selectedDate) {
              setBirthdate(selectedDate);
            }
          }}
        />
      ) : null}

      <View style={styles.switchRow}>
        <Text style={styles.label}>This is an estimated birthdate</Text>
        <Switch value={isEstimatedAge} onValueChange={setIsEstimatedAge} />
      </View>

      <Text style={styles.label}>Microchip ID</Text>
      <TextInput
        style={styles.input}
        value={microchipId}
        onChangeText={setMicrochipId}
        placeholder="Optional"
        accessibilityLabel="Microchip ID"
        autoCapitalize="characters"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>{isEditing ? 'Save Changes' : 'Add Pet'}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    gap: 6,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  errorText: {
    color: '#c00',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    justifyContent: 'center',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentSelected: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  segmentText: {
    color: '#333',
  },
  segmentTextSelected: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  error: {
    color: '#c00',
    marginTop: 12,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
