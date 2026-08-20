import { useCallback } from 'react';
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
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { WeightTrendChart } from '../../components/WeightTrendChart';
import { useMyPackRole } from '../../hooks/useMyPackRole';
import { usePack } from '../../hooks/usePack';
import { useRealtimeRefetch } from '../../hooks/useRealtimeRefetch';
import { useWeightEntries } from '../../hooks/useWeightEntries';
import { deleteWeightEntry } from '../../lib/weightEntriesApi';
import type { PetDetailTabParamList, RootStackParamList } from '../../navigation/types';
import type { WeightEntry } from '../../types/weightEntry';

type Props = BottomTabScreenProps<PetDetailTabParamList, 'Weight'>;

export function WeightTab({ route, navigation }: Props) {
  const petId = route.params.petId;
  const { weightEntries, loading, error, refetch } = useWeightEntries(petId);
  const rootNavigation = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  const { packId } = usePack();
  const { isSitter } = useMyPackRole(packId);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  useRealtimeRefetch('weight_entries', `pet_id=eq.${petId}`, refetch);

  const handleDelete = (entry: WeightEntry) => {
    Alert.alert(
      'Delete Entry',
      `Delete the ${entry.weight} ${entry.unit} entry from ${entry.recorded_at}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteWeightEntry(entry.id);
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

  if (loading && weightEntries.length === 0) {
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

  const displayUnit = weightEntries[weightEntries.length - 1]?.unit ?? 'kg';
  const reversedEntries = [...weightEntries].reverse();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {weightEntries.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No weight entries yet</Text>
          <Text style={styles.emptySubtitle}>Log a weight to start tracking trends</Text>
        </View>
      ) : (
        <>
          <WeightTrendChart entries={weightEntries} displayUnit={displayUnit} />

          <Text style={styles.sectionHeader}>History</Text>
          {reversedEntries.map((entry) => (
            <View key={entry.id} style={styles.row}>
              <View>
                <Text style={styles.rowValue}>
                  {entry.weight} {entry.unit}
                </Text>
                <Text style={styles.rowDate}>{entry.recorded_at}</Text>
              </View>
              {!isSitter ? (
                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() =>
                      rootNavigation?.navigate('WeightEntryForm', {
                        petId,
                        weightEntryId: entry.id,
                      })
                    }
                    hitSlop={16}
                  >
                    <Text style={styles.actionLink}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(entry)} hitSlop={16}>
                    <Text style={styles.deleteLink}>Delete</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
        </>
      )}

      {!isSitter ? (
        <Pressable
          style={styles.addButton}
          onPress={() => rootNavigation?.navigate('WeightEntryForm', { petId })}
        >
          <Text style={styles.addButtonText}>+ Log Weight</Text>
        </Pressable>
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
    paddingBottom: 96,
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
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowDate: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionLink: {
    color: '#111',
    fontWeight: '600',
    fontSize: 13,
  },
  deleteLink: {
    color: '#c00',
    fontSize: 13,
  },
  addButton: {
    marginTop: 28,
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
