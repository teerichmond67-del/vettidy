import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useMyPackRole } from '../../hooks/useMyPackRole';
import { usePack } from '../../hooks/usePack';
import { usePaywallGate } from '../../hooks/usePaywallGate';
import { usePet } from '../../hooks/usePet';
import { deletePet, getSignedPetPhotoUrl, setPetStatus } from '../../lib/petsApi';
import { exportPetRecordPdf } from '../../lib/pdfExport';
import type { PetDetailTabParamList, RootStackParamList } from '../../navigation/types';
import type { Pet } from '../../types/pet';

type Props = BottomTabScreenProps<PetDetailTabParamList, 'Overview'>;

function formatBirthdate(pet: Pet) {
  if (!pet.birthdate) return 'Not set';
  return pet.is_estimated_age ? `${pet.birthdate} (estimated)` : pet.birthdate;
}

export function OverviewTab({ route, navigation }: Props) {
  const petId = route.params.petId;
  const { pet, loading, error, refetch } = usePet(petId);
  const rootNavigation = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  const guardPremium = usePaywallGate();
  const { packId } = usePack();
  const { isSitter } = useMyPackRole(packId);
  const [exporting, setExporting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pet?.photo_path) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing a stale photo when the pet has none (or changed)
      setPhotoUrl(null);
      return;
    }

    getSignedPetPhotoUrl(pet.photo_path).then((result) => {
      if (result.url) setPhotoUrl(result.url);
    });
  }, [pet?.photo_path]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleMarkDeceased = () => {
    Alert.alert(
      'Mark as Deceased',
      `Move ${pet?.name} to In Memory? Their records stay intact, and this can be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Deceased',
          style: 'destructive',
          onPress: async () => {
            const result = await setPetStatus(petId, 'deceased');
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

  const handleReactivate = async () => {
    const result = await setPetStatus(petId, 'active');
    if (result.error) {
      Alert.alert('Something went wrong', result.error);
    } else {
      refetch();
    }
  };

  const handleExportPdf = async () => {
    if (guardPremium('export_pdf')) return;

    setExporting(true);
    const result = await exportPetRecordPdf(petId);
    setExporting(false);

    if (result.error) {
      Alert.alert('Could not export PDF', result.error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Pet',
      `This permanently deletes ${pet?.name}'s profile and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deletePet(petId);
            if (result.error) {
              Alert.alert('Something went wrong', result.error);
            } else {
              rootNavigation?.goBack();
            }
          },
        },
      ],
    );
  };

  if (loading && !pet) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !pet) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Pet not found.'}</Text>
        <Pressable style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {photoUrl ? <Image source={{ uri: photoUrl }} style={styles.photo} /> : null}

      <Text style={styles.name}>{pet.name}</Text>
      <Text style={styles.species}>{pet.species}</Text>

      {pet.status === 'deceased' ? <Text style={styles.memorialBadge}>In Memory</Text> : null}

      <View style={styles.infoBlock}>
        <InfoRow label="Breed" value={pet.breed ?? 'Not set'} />
        <InfoRow label="Sex" value={pet.sex ?? 'Not set'} />
        <InfoRow label="Birthdate" value={formatBirthdate(pet)} />
        <InfoRow label="Microchip ID" value={pet.microchip_id ?? 'Not set'} />
      </View>

      {!isSitter ? (
        <Pressable
          style={styles.editButton}
          onPress={() => rootNavigation?.navigate('PetForm', { petId: pet.id })}
        >
          <Text style={styles.editButtonText}>Edit Pet</Text>
        </Pressable>
      ) : null}

      {!isSitter ? (
        pet.status === 'active' ? (
          <Pressable style={styles.secondaryButton} onPress={handleMarkDeceased}>
            <Text style={styles.secondaryButtonText}>Mark as Deceased</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.secondaryButton} onPress={handleReactivate}>
            <Text style={styles.secondaryButtonText}>Restore to Active</Text>
          </Pressable>
        )
      ) : null}

      <Pressable style={styles.secondaryButton} onPress={handleExportPdf} disabled={exporting}>
        {exporting ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.secondaryButtonText}>Export PDF</Text>
        )}
      </Pressable>

      {!isSitter ? (
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Pet</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    gap: 4,
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
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
    fontSize: 26,
    fontWeight: '700',
  },
  species: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  memorialBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#eee',
    color: '#555',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoBlock: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    marginTop: 24,
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
  secondaryButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  deleteButton: {
    marginTop: 12,
    marginBottom: 40,
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
