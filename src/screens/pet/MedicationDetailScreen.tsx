import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../../hooks/useAuth';
import { useDoseLogs } from '../../hooks/useDoseLogs';
import { useMedication } from '../../hooks/useMedication';
import { useMyPackRole } from '../../hooks/useMyPackRole';
import { usePack } from '../../hooks/usePack';
import { useRealtimeRefetch } from '../../hooks/useRealtimeRefetch';
import { createDoseLog } from '../../lib/doseLogsApi';
import { deleteMedication } from '../../lib/medicationsApi';
import { cancelMedicationReminders, parseScheduleTimes } from '../../lib/notifications';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MedicationDetail'>;

function formatLoggedAt(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString();
}

export function MedicationDetailScreen({ route, navigation }: Props) {
  const { petId, medicationId } = route.params;
  const { session } = useAuth();
  const {
    medication,
    loading: loadingMedication,
    error: medicationError,
    refetch: refetchMedication,
  } = useMedication(medicationId);
  const {
    doseLogs,
    loading: loadingDoseLogs,
    error: doseLogsError,
    refetch: refetchDoseLogs,
  } = useDoseLogs(medicationId);
  const { packId } = usePack();
  const { isSitter } = useMyPackRole(packId);
  const [logging, setLogging] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetchMedication();
      refetchDoseLogs();
    }, [refetchMedication, refetchDoseLogs]),
  );

  useRealtimeRefetch('dose_logs', `medication_id=eq.${medicationId}`, refetchDoseLogs);

  const handleLogDose = async (status: 'given' | 'skipped') => {
    if (!session) return;

    setLogging(true);
    const result = await createDoseLog(medicationId, session.user.id, status);
    setLogging(false);

    if (result.error) {
      Alert.alert('Something went wrong', result.error);
    } else {
      refetchDoseLogs();
    }
  };

  const handleEdit = () => {
    navigation.navigate('MedicationForm', { petId, medicationId });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Medication',
      `Delete "${medication?.name}"? Its dose history and reminders will be removed too.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await cancelMedicationReminders(medicationId);
            const result = await deleteMedication(medicationId);
            if (result.error) {
              Alert.alert('Something went wrong', result.error);
            } else {
              navigation.goBack();
            }
          },
        },
      ],
    );
  };

  if (loadingMedication && !medication) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!medication) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{medicationError ?? 'Medication not found.'}</Text>
        <Pressable style={styles.retryButton} onPress={refetchMedication}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const times = parseScheduleTimes(medication.schedule_rule);
  const lastDose = doseLogs[0] ?? null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{medication.name}</Text>
      {medication.dosage ? <Text style={styles.dosage}>{medication.dosage}</Text> : null}
      <Text style={styles.schedule}>
        {times.length > 0 ? `Daily at ${times.join(', ')}` : 'No schedule set'}
      </Text>
      {!medication.active ? (
        <Text style={styles.inactiveNote}>This medication is inactive.</Text>
      ) : null}

      {lastDose ? (
        <View style={styles.lastDoseCard}>
          <Text style={styles.lastDoseLabel}>Last dose</Text>
          <Text style={styles.lastDoseStatus}>
            {lastDose.status === 'given' ? 'Given' : 'Skipped'} by{' '}
            {lastDose.logged_by_email ?? 'a caregiver'}
          </Text>
          <Text style={styles.lastDoseTime}>{formatLoggedAt(lastDose.logged_at)}</Text>
        </View>
      ) : (
        <View style={styles.lastDoseCard}>
          <Text style={styles.lastDoseLabel}>No doses logged yet</Text>
        </View>
      )}

      {!isSitter ? (
        <View style={styles.doseButtonRow}>
          <Pressable
            style={[styles.doseButton, styles.givenButton]}
            onPress={() => handleLogDose('given')}
            disabled={logging}
          >
            {logging ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.doseButtonText}>Mark as Given</Text>
            )}
          </Pressable>
          <Pressable
            style={[styles.doseButton, styles.skippedButton]}
            onPress={() => handleLogDose('skipped')}
            disabled={logging}
          >
            <Text style={styles.doseButtonTextDark}>Mark as Skipped</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.sectionHeader}>Dose History</Text>
      {loadingDoseLogs && doseLogs.length === 0 ? (
        <ActivityIndicator />
      ) : doseLogsError ? (
        <Text style={styles.errorText}>{doseLogsError}</Text>
      ) : doseLogs.length === 0 ? (
        <Text style={styles.emptyHistory}>No history yet.</Text>
      ) : (
        doseLogs.map((log) => (
          <View key={log.id} style={styles.historyRow}>
            <Text style={styles.historyStatus}>{log.status === 'given' ? 'Given' : 'Skipped'}</Text>
            <Text style={styles.historyMeta}>
              {log.logged_by_email ?? 'Unknown'} · {formatLoggedAt(log.logged_at)}
            </Text>
          </View>
        ))
      )}

      {!isSitter ? (
        <>
          <Pressable style={styles.editButton} onPress={handleEdit}>
            <Text style={styles.editButtonText}>Edit Medication</Text>
          </Pressable>
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Medication</Text>
          </Pressable>
        </>
      ) : null}
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
    paddingBottom: 60,
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
  name: {
    fontSize: 24,
    fontWeight: '700',
  },
  dosage: {
    fontSize: 15,
    color: '#555',
    marginTop: 2,
  },
  schedule: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  inactiveNote: {
    fontSize: 13,
    color: '#c00',
    marginTop: 4,
  },
  lastDoseCard: {
    marginTop: 20,
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    padding: 16,
  },
  lastDoseLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
  },
  lastDoseStatus: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 4,
  },
  lastDoseTime: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  doseButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  doseButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  givenButton: {
    backgroundColor: '#111',
  },
  skippedButton: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
  doseButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  doseButtonTextDark: {
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    marginTop: 28,
    marginBottom: 8,
  },
  emptyHistory: {
    fontSize: 14,
    color: '#888',
  },
  historyRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyStatus: {
    fontSize: 15,
    fontWeight: '600',
  },
  historyMeta: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  editButton: {
    marginTop: 28,
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#c00',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#c00',
    fontWeight: '600',
    fontSize: 16,
  },
});
