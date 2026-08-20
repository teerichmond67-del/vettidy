import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import { enqueueUpload } from '../lib/uploadQueue';

type PickedFile = {
  uri: string;
  fileName: string;
  mimeType: string;
};

type UploadDocumentModalProps = {
  visible: boolean;
  onClose: () => void;
  packId: string;
  petId: string;
  uploadedBy: string;
};

export function UploadDocumentModal({
  visible,
  onClose,
  packId,
  petId,
  uploadedBy,
}: UploadDocumentModalProps) {
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setPickedFile(null);
    setTitle('');
    setSaving(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access needed', 'Enable camera access in Settings to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setPickedFile({
      uri: asset.uri,
      fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? 'image/jpeg',
    });
  };

  const handleChoosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Photo library access needed',
        'Enable photo access in Settings to choose an image.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setPickedFile({
      uri: asset.uri,
      fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? 'image/jpeg',
    });
  };

  const handleChooseFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ multiple: false });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setPickedFile({
      uri: asset.uri,
      fileName: asset.name,
      mimeType: asset.mimeType ?? 'application/octet-stream',
    });
  };

  const handleUpload = async () => {
    if (!pickedFile) return;

    setSaving(true);

    try {
      await enqueueUpload({
        packId,
        petId,
        uploadedBy,
        title: title.trim() || null,
        fileName: pickedFile.fileName,
        mimeType: pickedFile.mimeType,
        sourceUri: pickedFile.uri,
      });
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save this file for upload.';
      Alert.alert('Something went wrong', message);
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Upload Document</Text>

        {!pickedFile ? (
          <View style={styles.pickerButtons}>
            <Pressable style={styles.pickerButton} onPress={handleTakePhoto}>
              <Text style={styles.pickerButtonText}>Take Photo</Text>
            </Pressable>
            <Pressable style={styles.pickerButton} onPress={handleChoosePhoto}>
              <Text style={styles.pickerButtonText}>Choose Photo</Text>
            </Pressable>
            <Pressable style={styles.pickerButton} onPress={handleChooseFile}>
              <Text style={styles.pickerButtonText}>Choose File</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.fileName}>{pickedFile.fileName}</Text>

            <Text style={styles.label}>Title (optional)</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Rabies certificate"
              accessibilityLabel="Document title"
              editable={!saving}
            />

            <Pressable
              style={[styles.uploadButton, saving && styles.uploadButtonDisabled]}
              onPress={handleUpload}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.uploadButtonText}>Upload</Text>
              )}
            </Pressable>

            <Pressable onPress={() => setPickedFile(null)} disabled={saving}>
              <Text style={styles.backLink}>Choose a different file</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  pickerButtons: {
    gap: 12,
    marginTop: 24,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  form: {
    gap: 8,
    marginTop: 16,
  },
  fileName: {
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  uploadButton: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  backLink: {
    textAlign: 'center',
    marginTop: 12,
    color: '#555',
  },
});
