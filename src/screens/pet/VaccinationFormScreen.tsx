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

import { DocumentLinkPicker } from '../../components/DocumentLinkPicker';
import { useDocuments } from '../../hooks/useDocuments';
import { usePet } from '../../hooks/usePet';
import { useVaccination } from '../../hooks/useVaccination';
import { scheduleVaccinationReminders } from '../../lib/notifications';
import { createVaccination, updateVaccination } from '../../lib/vaccinationsApi';
import type { RootStackParamList } from '../../navigation/types';
import type { DocumentRecord } from '../../types/document';

type Props = NativeStackScreenProps<RootStackParamList, 'VaccinationForm'>;

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

type DatePickerTarget = 'administered' | 'due' | null;

export function VaccinationFormScreen({ route, navigation }: Props) {
  const { petId, vaccinationId } = route.params;
  const isEditing = !!vaccinationId;

  const { pet, refetch: refetchPet } = usePet(petId);
  const {
    vaccination,
    loading: loadingVaccination,
    error: loadError,
    refetch: refetchVaccination,
  } = useVaccination(vaccinationId);
  const { documents, refetch: refetchDocuments } = useDocuments(petId);

  const [vaccineName, setVaccineName] = useState('');
  const [dateAdministered, setDateAdministered] = useState<Date | null>(null);
  const [nextDueDate, setNextDueDate] = useState<Date | null>(null);
  const [administeringVet, setAdministeringVet] = useState('');
  const [linkedDocument, setLinkedDocument] = useState<DocumentRecord | null>(null);
  const [linkedDocumentId, setLinkedDocumentId] = useState<string | null>(null);
  const [datePickerTarget, setDatePickerTarget] = useState<DatePickerTarget>(null);
  const [documentPickerVisible, setDocumentPickerVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Vaccination' : 'Add Vaccination' });
  }, [isEditing, navigation]);

  useEffect(() => {
    refetchPet();
    refetchVaccination();
    refetchDocuments();
  }, [refetchPet, refetchVaccination, refetchDocuments]);

  useEffect(() => {
    if (!vaccination) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prefilling the form once edit-mode data arrives
    setVaccineName(vaccination.vaccine_name);
    setDateAdministered(
      vaccination.date_administered ? new Date(vaccination.date_administered) : null,
    );
    setNextDueDate(vaccination.next_due_date ? new Date(vaccination.next_due_date) : null);
    setAdministeringVet(vaccination.administering_vet ?? '');
    setLinkedDocumentId(vaccination.document_id);
  }, [vaccination]);

  const handleSave = async () => {
    if (!vaccineName.trim()) {
      setError('Vaccine name is required.');
      return;
    }

    setError(null);
    setSaving(true);

    const input = {
      vaccine_name: vaccineName.trim(),
      date_administered: dateAdministered ? formatDate(dateAdministered) : null,
      next_due_date: nextDueDate ? formatDate(nextDueDate) : null,
      administering_vet: administeringVet.trim() || null,
      document_id: linkedDocumentId,
    };

    const result =
      isEditing && vaccinationId
        ? await updateVaccination(vaccinationId, input)
        : await createVaccination(petId, input);

    setSaving(false);

    if (result.error || !result.data) {
      setError(result.error ?? 'Could not save this vaccination.');
      return;
    }

    await scheduleVaccinationReminders({
      vaccinationId: result.data.id,
      petId,
      petName: pet?.name ?? 'Your pet',
      vaccineName: result.data.vaccine_name,
      nextDueDate: result.data.next_due_date,
    });

    navigation.goBack();
  };

  if (isEditing && loadingVaccination) {
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
        <Pressable style={styles.retryButton} onPress={refetchVaccination}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Vaccine Name</Text>
      <TextInput
        style={styles.input}
        value={vaccineName}
        onChangeText={setVaccineName}
        placeholder="e.g. Rabies"
        accessibilityLabel="Vaccine name"
      />

      <Text style={styles.label}>Date Administered</Text>
      <Pressable
        style={styles.input}
        onPress={() => setDatePickerTarget('administered')}
        accessibilityRole="button"
        accessibilityLabel={`Date administered, ${dateAdministered ? formatDate(dateAdministered) : 'not set'}`}
      >
        <Text>{dateAdministered ? formatDate(dateAdministered) : 'Not set'}</Text>
      </Pressable>

      <Text style={styles.label}>Next Due Date</Text>
      <Pressable
        style={styles.input}
        onPress={() => setDatePickerTarget('due')}
        accessibilityRole="button"
        accessibilityLabel={`Next due date, ${nextDueDate ? formatDate(nextDueDate) : 'not set'}`}
      >
        <Text>{nextDueDate ? formatDate(nextDueDate) : 'Not set'}</Text>
      </Pressable>

      {nextDueDate ? (
        <Text style={styles.hint}>
          You&apos;ll get a reminder 7 days and 1 day before this date.
        </Text>
      ) : null}

      {datePickerTarget ? (
        <DateTimePicker
          value={
            (datePickerTarget === 'administered' ? dateAdministered : nextDueDate) ?? new Date()
          }
          mode="date"
          onChange={(event, selectedDate) => {
            const target = datePickerTarget;
            setDatePickerTarget(Platform.OS === 'ios' ? target : null);
            if (event.type === 'set' && selectedDate) {
              if (target === 'administered') setDateAdministered(selectedDate);
              else if (target === 'due') setNextDueDate(selectedDate);
            }
          }}
        />
      ) : null}

      <Text style={styles.label}>Administering Vet</Text>
      <TextInput
        style={styles.input}
        value={administeringVet}
        onChangeText={setAdministeringVet}
        placeholder="Optional"
        accessibilityLabel="Administering vet"
      />

      <Text style={styles.label}>Linked Document</Text>
      {linkedDocumentId ? (
        <View style={styles.linkedDocumentRow}>
          <Text style={styles.linkedDocumentText}>
            {linkedDocument?.title ??
              documents.find((doc) => doc.id === linkedDocumentId)?.title ??
              'Linked document'}
          </Text>
          <Pressable
            onPress={() => {
              setLinkedDocumentId(null);
              setLinkedDocument(null);
            }}
          >
            <Text style={styles.removeLink}>Remove</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.input} onPress={() => setDocumentPickerVisible(true)}>
          <Text style={styles.linkButtonText}>+ Link a document (optional)</Text>
        </Pressable>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Save Changes' : 'Add Vaccination'}
          </Text>
        )}
      </Pressable>

      <DocumentLinkPicker
        visible={documentPickerVisible}
        petId={petId}
        onClose={() => setDocumentPickerVisible(false)}
        onSelect={(document) => {
          setLinkedDocumentId(document.id);
          setLinkedDocument(document);
        }}
      />
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
  hint: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  linkedDocumentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
  },
  linkedDocumentText: {
    fontSize: 15,
    flexShrink: 1,
  },
  removeLink: {
    color: '#c00',
    fontSize: 13,
  },
  linkButtonText: {
    color: '#111',
    fontWeight: '600',
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
