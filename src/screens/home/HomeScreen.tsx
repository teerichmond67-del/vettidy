import { useCallback } from 'react';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, type CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useMyPackRole } from '../../hooks/useMyPackRole';
import { usePack } from '../../hooks/usePack';
import { usePets } from '../../hooks/usePets';
import { useRealtimeRefetch } from '../../hooks/useRealtimeRefetch';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import type { Pet } from '../../types/pet';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const { packId, loading: loadingPack, error: packError } = usePack();
  const { pets, loading: loadingPets, error: petsError, refetch } = usePets(packId);
  const { isSitter } = useMyPackRole(packId);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  useRealtimeRefetch('pets', packId ? `pack_id=eq.${packId}` : null, refetch);

  const loading = loadingPack || loadingPets;
  const error = packError ?? petsError;

  if (loading && pets.length === 0 && !error) {
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

  const activePets = pets.filter((pet) => pet.status === 'active');
  const deceasedPets = pets.filter((pet) => pet.status === 'deceased');

  const sections = [
    ...(activePets.length > 0 ? [{ title: 'Your Pets', data: activePets }] : []),
    ...(deceasedPets.length > 0 ? [{ title: 'In Memory', data: deceasedPets }] : []),
  ];

  return (
    <View style={styles.container}>
      {pets.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No pets yet</Text>
          <Text style={styles.emptySubtitle}>Add your first pet to get started</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(pet) => pet.id}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item: pet }: { item: Pet }) => (
            <Pressable
              style={styles.petRow}
              onPress={() => navigation.navigate('PetDetail', { petId: pet.id })}
            >
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petSpecies}>{pet.species}</Text>
            </Pressable>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {!isSitter ? (
        <Pressable style={styles.addButton} onPress={() => navigation.navigate('PetForm', {})}>
          <Text style={styles.addButtonText}>+ Add Pet</Text>
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
    fontSize: 20,
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
  listContent: {
    paddingBottom: 96,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  petRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
  },
  petSpecies: {
    fontSize: 14,
    color: '#888',
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
