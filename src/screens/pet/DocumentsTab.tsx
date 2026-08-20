import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { UploadDocumentModal } from '../../components/UploadDocumentModal';
import { useAuth } from '../../hooks/useAuth';
import { useDocuments } from '../../hooks/useDocuments';
import { useMyPackRole } from '../../hooks/useMyPackRole';
import { usePack } from '../../hooks/usePack';
import { useUploadQueue } from '../../hooks/useUploadQueue';
import { deleteDocumentRecord, getSignedDocumentUrl } from '../../lib/documentsApi';
import { findQueueItemByDocumentId, removeFromQueue, retryUpload } from '../../lib/uploadQueue';
import type { PetDetailTabParamList } from '../../navigation/types';
import type { DocumentRecord, UploadStatus } from '../../types/document';

type Props = BottomTabScreenProps<PetDetailTabParamList, 'Documents'>;

type DisplayRow = {
  key: string;
  title: string;
  status: UploadStatus;
  createdAt: string;
  document: DocumentRecord | null;
  localQueueId: string | null;
};

function statusStyle(status: UploadStatus) {
  if (status === 'synced') return { badge: styles.badgeSynced, text: styles.badgeTextSynced };
  if (status === 'failed') return { badge: styles.badgeFailed, text: styles.badgeTextFailed };
  return { badge: styles.badgePending, text: styles.badgeTextPending };
}

function statusLabel(status: UploadStatus) {
  if (status === 'synced') return 'Synced';
  if (status === 'failed') return 'Failed';
  return 'Pending';
}

export function DocumentsTab({ route }: Props) {
  const petId = route.params.petId;
  const { session } = useAuth();
  const { packId } = usePack();
  const { documents, loading, error, refetch } = useDocuments(petId);
  const localQueue = useUploadQueue(petId);
  const { isSitter } = useMyPackRole(packId);

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const rows: DisplayRow[] = useMemo(() => {
    const documentRows: DisplayRow[] = documents.map((doc) => ({
      key: doc.id,
      title: doc.title ?? doc.file_path.split('/').pop() ?? 'Document',
      status: doc.upload_status,
      createdAt: doc.created_at,
      document: doc,
      localQueueId: null,
    }));

    const localOnlyRows: DisplayRow[] = localQueue
      .filter((item) => !item.documentId)
      .map((item) => ({
        key: `local-${item.id}`,
        title: item.title ?? item.fileName,
        status: item.status === 'uploading' ? 'pending' : (item.status as UploadStatus),
        createdAt: item.createdAt,
        document: null,
        localQueueId: item.id,
      }));

    return [...localOnlyRows, ...documentRows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [documents, localQueue]);

  const handleRetry = (row: DisplayRow) => {
    if (row.localQueueId) {
      retryUpload(row.localQueueId);
      return;
    }

    if (!row.document) return;

    const queueItem = findQueueItemByDocumentId(row.document.id);
    if (queueItem) {
      retryUpload(queueItem.id);
      return;
    }

    Alert.alert(
      'File no longer available',
      'This file is no longer on this device, so it can’t be retried. Delete it and upload again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDelete(row),
        },
      ],
    );
  };

  const handleDelete = (row: DisplayRow) => {
    Alert.alert('Delete Document', `Delete "${row.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (row.localQueueId) {
            await removeFromQueue(row.localQueueId);
            return;
          }

          if (!row.document) return;

          const queueItem = findQueueItemByDocumentId(row.document.id);
          if (queueItem) {
            await removeFromQueue(queueItem.id);
          }

          const result = await deleteDocumentRecord(row.document.id, row.document.file_path);
          if (result.error) {
            Alert.alert('Something went wrong', result.error);
          } else {
            refetch();
          }
        },
      },
    ]);
  };

  const handleView = async (row: DisplayRow) => {
    if (!row.document || row.status !== 'synced') return;

    const { url, error: signedUrlError } = await getSignedDocumentUrl(row.document.file_path);

    if (signedUrlError || !url) {
      Alert.alert('Something went wrong', signedUrlError ?? 'Could not open this document.');
      return;
    }

    const isImage = row.document.file_type?.startsWith('image/');

    if (isImage) {
      setPreviewUrl(url);
      return;
    }

    try {
      const fileName = row.document.file_path.split('/').pop() ?? 'document';
      const destination = new File(new Directory(Paths.cache), fileName);
      const downloaded = await File.downloadFileAsync(url, destination, { idempotent: true });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloaded.uri);
      } else {
        Alert.alert('Downloaded', `Saved to ${downloaded.uri}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not download this document.';
      Alert.alert('Something went wrong', message);
    }
  };

  if (loading && documents.length === 0 && localQueue.length === 0) {
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
      {rows.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No documents yet</Text>
          <Text style={styles.emptySubtitle}>Upload receipts, records, or vet notes</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(row) => row.key}
          contentContainerStyle={styles.list}
          renderItem={({ item: row }) => {
            const { badge, text } = statusStyle(row.status);
            return (
              <Pressable
                style={styles.row}
                onPress={() => handleView(row)}
                disabled={row.status !== 'synced'}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>{row.title}</Text>
                  <View style={[styles.badge, badge]}>
                    <Text style={[styles.badgeText, text]}>{statusLabel(row.status)}</Text>
                  </View>
                </View>
                {!isSitter ? (
                  <View style={styles.rowActions}>
                    {row.status === 'failed' ? (
                      <Pressable onPress={() => handleRetry(row)} hitSlop={16}>
                        <Text style={styles.actionLink}>Retry</Text>
                      </Pressable>
                    ) : null}
                    <Pressable onPress={() => handleDelete(row)} hitSlop={16}>
                      <Text style={styles.deleteLink}>Delete</Text>
                    </Pressable>
                  </View>
                ) : null}
              </Pressable>
            );
          }}
        />
      )}

      {!isSitter ? (
        <Pressable style={styles.addButton} onPress={() => setUploadModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Upload Document</Text>
        </Pressable>
      ) : null}

      {!isSitter && packId && session ? (
        <UploadDocumentModal
          visible={uploadModalVisible}
          onClose={() => setUploadModalVisible(false)}
          packId={packId}
          petId={petId}
          uploadedBy={session.user.id}
        />
      ) : null}

      <Modal
        visible={!!previewUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewUrl(null)}
      >
        <Pressable
          style={styles.previewBackdrop}
          onPress={() => setPreviewUrl(null)}
          accessibilityRole="button"
          accessibilityLabel="Close preview"
        >
          {previewUrl ? (
            <Image source={{ uri: previewUrl }} style={styles.previewImage} resizeMode="contain" />
          ) : null}
        </Pressable>
      </Modal>
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
    gap: 6,
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
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgePending: {
    backgroundColor: '#fff4d6',
  },
  badgeTextPending: {
    color: '#946200',
  },
  badgeSynced: {
    backgroundColor: '#dcf5e3',
  },
  badgeTextSynced: {
    color: '#1b7a3d',
  },
  badgeFailed: {
    backgroundColor: '#fde2e2',
  },
  badgeTextFailed: {
    color: '#c00',
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
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '80%',
  },
});
