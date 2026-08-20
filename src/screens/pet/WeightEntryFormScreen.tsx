import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useWeightEntry } from '../../hooks/useWeightEntry';
import { createWeightEntry, updateWeightEntry } from '../../lib/weightEntriesApi';
import type { RootStackParamList } from '../../navigation/types';
import type { WeightUnit } from '../../types/weightEntry';

type Props = NativeStackScreenProps<RootStackParamList, 'WeightEntryForm'>;

const UNIT_OPTIONS: { label: string; value: WeightUnit }[] = [
  { label: 'kg', value: 'kg' },
  { label: 'lb', value: 'lb' },
];

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function WeightEntryFormScreen({ route, navigation }: Props) {
  const { petId, weightEntryId } = route.params;
  const isEditing = !!weightEntryId;

  const {
    weightEntry,
    loading: loadingEntry,
    error: loadError,
    refetch: refetchEntry,
  } = useWeightEntry(weightEntryId);

  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState<WeightUnit>('kg');
  const [recordedAt, setRecordedAt] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Weight Entry' : 'Log Weight' });
  }, [isEditing, navigation]);

  useEffect(() => {
    refetchEntry();
  }, [refetchEntry]);

  useEffect(() => {
    if (!weightEntry) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prefilling the form once edit-mode data arrives
    setWeight(String(weightEntry.weight));
    setUnit(weightEntry.unit);
    setRecordedAt(new Date(weightEntry.recorded_at));
  }, [weightEntry]);

  const handleSave = async () => {
    const parsedWeight = Number(weight);

    if (!weight.trim() || Number.isNaN(parsedWeight) || parsedWeight <= 0) {
      setError('Enter a valid weight.');
      return;
    }

    setError(null);
    setSaving(true);

    const input = {
      weight: parsedWeight,
      unit,
      recorded_at: formatDate(recordedAt),
    };

    const result =
      isEditing && weightEntryId
        ? await updateWeightEntry(weightEntryId, input)
        : await createWeightEntry(petId, input);

    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    navigation.goBack();
  };

  if (isEditing && loadingEntry) {
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
        <Pressable style={styles.retryButton} onPress={refetchEntry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Weight</Text>
      <TextInput
        style={styles.input}
        value={weight}
        onChangeText={setWeight}
        placeholder="e.g. 12.5"
        accessibilityLabel="Weight"
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Unit</Text>
      <View style={styles.segmentRow}>
        {UNIT_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[styles.segment, unit === option.value && styles.segmentSelected]}
            onPress={() => setUnit(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: unit === option.value }}
          >
            <Text style={[styles.segmentText, unit === option.value && styles.segmentTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Date</Text>
      <Pressable
        style={styles.input}
        onPress={() => setShowDatePicker(true)}
        accessibilityRole="button"
        accessibilityLabel={`Date, ${formatDate(recordedAt)}`}
      >
        <Text>{formatDate(recordedAt)}</Text>
      </Pressable>
      {showDatePicker ? (
        <DateTimePicker
          value={recordedAt}
          mode="date"
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (event.type === 'set' && selectedDate) {
              setRecordedAt(selectedDate);
            }
          }}
        />
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>{isEditing ? 'Save Changes' : 'Log Weight'}</Text>
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
