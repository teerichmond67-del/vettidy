import { useCallback } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useMyPackRole } from '../../hooks/useMyPackRole';
import { usePack } from '../../hooks/usePack';
import { useVaccinations } from '../../hooks/useVaccinations';
import { cancelVaccinationReminders } from '../../lib/notifications';
import { deleteVaccination } from '../../lib/vaccinationsApi';
import type { PetDetailTabParamList, RootStackParamList } from '../../navigation/types';
import type { Vaccination } from '../../types/vaccination';

type Props = BottomTabScreenProps<PetDetailTabParamList, 'Vaccinations'>;

function isOverdue(vaccination: Vaccination): boolean {
  if (!vaccination.next_due_date) return false;
  const today = new Date().toISOString().slice(0, 10);
  return vaccination.next_due_date < today;
}

export function VaccinationsTab({ route, navigation }: Props) {
  const petId = route.params.petId;
  const { vaccinations, loading, error, refetch } = useVaccinations(petId);
  const rootNavigation = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  const { packId } = usePack();
  const { isSitter } = useMyPackRole(packId);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleDelete = (vaccination: Vaccination) => {
    Alert.alert(
      'Delete Vaccination',
      `Delete "${vaccination.vaccine_name}"? Its reminders will be cancelled too.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await cancelVaccinationReminders(vaccination.id);
            const result = await deleteVaccination(vaccination.id);
            if (result.error) {
              Alert.alert('Something went wrong', result.error);
            } else {
              refetch();
            }
          },
        },
      ],
    );
  };

  if (loading && vaccinations.length === 0) {
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
      {vaccinations.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No vaccinations yet</Text>
          <Text style={styles.emptySubtitle}>
            Add one to start tracking due dates and reminders
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {vaccinations.map((vaccination) => {
            const overdue = isOverdue(vaccination);
            return (
              <Pressable
                key={vaccination.id}
                style={styles.row}
                disabled={isSitter}
                onPress={() =>
                  rootNavigation?.navigate('VaccinationForm', {
                    petId,
                    vaccinationId: vaccination.id,
                  })
                }
              >
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>{vaccination.vaccine_name}</Text>
                  {overdue ? (
                    <View style={styles.overdueBadge}>
                      <Text style={styles.overdueBadgeText}>Overdue</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.rowSubtitle}>
                  {vaccination.next_due_date
                    ? `Next due ${vaccination.next_due_date}`
                    : 'No due date set'}
                </Text>
                {vaccination.administering_vet ? (
                  <Text style={styles.rowMeta}>{vaccination.administering_vet}</Text>
                ) : null}
                {!isSitter ? (
                  <Pressable onPress={() => handleDelete(vaccination)} hitSlop={16}>
                    <Text style={styles.deleteLink}>Delete</Text>
                  </Pressable>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}

      {!isSitter ? (
        <Pressable
          style={styles.addButton}
          onPress={() => rootNavigation?.navigate('VaccinationForm', { petId })}
        >
          <Text style={styles.addButtonText}>+ Add Vaccination</Text>
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
  overdueBadge: {
    backgroundColor: '#fde2e2',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  overdueBadgeText: {
    color: '#c00',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteLink: {
    color: '#c00',
    fontSize: 13,
    marginTop: 4,
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
