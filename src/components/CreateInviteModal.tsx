import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';

import { createPackInvite } from '../lib/packApi';
import type { PackRole } from '../types/pack';

type CreateInviteModalProps = {
  visible: boolean;
  onClose: () => void;
  packId: string;
  createdBy: string;
  onCreated: () => void;
};

const ROLE_OPTIONS: { label: string; value: 'caregiver' | 'sitter_view_only'; hint: string }[] = [
  { label: 'Caregiver', value: 'caregiver', hint: 'Full access to pets, documents, and records' },
  {
    label: 'Sitter — View Only',
    value: 'sitter_view_only',
    hint: 'Can view everything, change nothing',
  },
];

export function CreateInviteModal({
  visible,
  onClose,
  packId,
  createdBy,
  onCreated,
}: CreateInviteModalProps) {
  const [role, setRole] = useState<PackRole>('caregiver');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (role !== 'caregiver' && role !== 'sitter_view_only') return;

    setCreating(true);
    setError(null);

    const result = await createPackInvite(packId, createdBy, role);

    setCreating(false);

    if (result.error || !result.data) {
      setError(result.error ?? 'Could not create an invite.');
      return;
    }

    const link = Linking.createURL(`/invite/${result.data.code}`);

    onCreated();
    onClose();

    try {
      await Share.share({
        message: `Join our pet's care team on VetTidy! Open this link (or enter the code ${result.data.code} under Join a Pack): ${link}`,
      });
    } catch {
      // The invite itself was already created successfully — the code is
      // visible under Pending Invites either way, so a share-sheet failure
      // (or the user dismissing it) isn't worth surfacing as an error.
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Invite a Caregiver</Text>

        <View style={styles.roleList}>
          {ROLE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.roleRow, role === option.value && styles.roleRowSelected]}
              onPress={() => setRole(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: role === option.value }}
              accessibilityLabel={`${option.label}. ${option.hint}`}
            >
              <Text style={styles.roleLabel}>{option.label}</Text>
              <Text style={styles.roleHint}>{option.hint}</Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.createButton, creating && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create & Share Invite</Text>
          )}
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  roleList: {
    gap: 12,
  },
  roleRow: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 14,
  },
  roleRowSelected: {
    borderColor: '#111',
    backgroundColor: '#f7f7f7',
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  roleHint: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  error: {
    color: '#c00',
    marginTop: 16,
    textAlign: 'center',
  },
  createButton: {
    marginTop: 24,
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#888',
  },
});
