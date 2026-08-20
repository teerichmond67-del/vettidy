import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useMedications } from '../../hooks/useMedications';
import { useMyPackRole } from '../../hooks/useMyPackRole';
import { usePack } from '../../hooks/usePack';
import { useRealtimeRefetch } from '../../hooks/useRealtimeRefetch';
import type { PetDetailTabParamList, RootStackParamList } from '../../navigation/types';
import { parseScheduleTimes } from '../../lib/notifications';

type Props = BottomTabScreenProps<PetDetailTabParamList, 'Medications'>;

export function MedicationsTab({ route, navigation }: Props) {
  const petId = route.params.petId;
  const { medications, loading, error, refetch } = useMedications(petId);
  const rootNavigation = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  const { packId } = usePack();
  const { isSitter } = useMyPackRole(packId);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  useRealtimeRefetch('medications', `pet_id=eq.${petId}`, refetch);

  if (loading && medications.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {medications.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No medications yet</Text>
          <Text style={styles.emptySubtitle}>Add one to track doses and reminders</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {medications.map((medication) => {
            const times = parseScheduleTimes(medication.schedule_rule);
            return (
              <Pressable
                key={medication.id}
                style={styles.row}
                onPress={() =>
                  rootNavigation?.navigate('MedicationDetail', {
                    petId,
                    medicationId: medication.id,
                  })
                }
              >
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>{medication.name}</Text>
                  {!medication.active ? (
                    <View style={styles.inactiveBadge}>
                      <Text style={styles.inactiveBadgeText}>Inactive</Text>
                    </View>
                  ) : null}
                </View>
                {medication.dosage ? (
                  <Text style={styles.rowSubtitle}>{medication.dosage}</Text>
                ) : null}
                <Text style={styles.rowMeta}>
                  {times.length > 0 ? times.join(', ') : 'No schedule set'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {!isSitter ? (
        <Pressable
          style={styles.addButton}
          onPress={() => rootNavigation?.navigate('MedicationForm', { petId })}
        >
          <Text style={styles.addButtonText}>+ Add Medication</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
  list: {
    paddingBottom: 96,
  },
  row: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 4,
  },
  rowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  rowSubtitle: {
    fontSize: 14,
    color: '#555',
  },
  rowMeta: {
    fontSize: 13,
    color: '#888',
  },
  inactiveBadge: {
    backgroundColor: '#eee',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  inactiveBadgeText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#111',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
