import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useDocuments } from '../hooks/useDocuments';
import type { DocumentRecord } from '../types/document';

type DocumentLinkPickerProps = {
  visible: boolean;
  petId: string;
  onClose: () => void;
  onSelect: (document: DocumentRecord) => void;
};

export function DocumentLinkPicker({ visible, petId, onClose, onSelect }: DocumentLinkPickerProps) {
  const { documents, refetch } = useDocuments(petId);
  const syncedDocuments = documents.filter((doc) => doc.upload_status === 'synced');

  useEffect(() => {
    if (!visible) return;

    refetch();
  }, [visible, refetch]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Link a Document</Text>

        {syncedDocuments.length === 0 ? (
          <Text style={styles.emptyText}>
            No synced documents for this pet yet. Upload one from the Documents tab first.
          </Text>
        ) : (
          <View style={styles.list}>
            {syncedDocuments.map((doc) => (
              <Pressable
                key={doc.id}
                style={styles.row}
                onPress={() => {
                  onSelect(doc);
                  onClose();
                }}
              >
                <Text style={styles.rowText}>
                  {doc.title ?? doc.file_path.split('/').pop() ?? 'Document'}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

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
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 24,
  },
  list: {
    gap: 8,
  },
  row: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 14,
  },
  rowText: {
    fontSize: 15,
  },
  cancelButton: {
    marginTop: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#888',
  },
});
