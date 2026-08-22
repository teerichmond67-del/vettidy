import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../../hooks/useAuth';
import type { RootStackParamList } from '../../navigation/types';

const MIN_PASSWORD_LENGTH = 8;

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

export function ChangePasswordScreen({ navigation }: Props) {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setError(null);
    setSaving(true);
    const { error: changeError } = await changePassword(currentPassword, newPassword);
    setSaving(false);

    if (changeError) {
      setError(changeError);
    } else {
      navigation.goBack();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Current Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Current password"
        accessibilityLabel="Current Password"
        secureTextEntry
        autoComplete="password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        editable={!saving}
      />

      <Text style={styles.label}>New Password</Text>
      <TextInput
        style={styles.input}
        placeholder="New password"
        accessibilityLabel="New Password"
        secureTextEntry
        autoComplete="password-new"
        value={newPassword}
        onChangeText={setNewPassword}
        editable={!saving}
      />

      <Text style={styles.label}>Confirm New Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Confirm new password"
        accessibilityLabel="Confirm New Password"
        secureTextEntry
        autoComplete="password-new"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        editable={!saving}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={styles.button}
        onPress={handleSubmit}
        disabled={saving || !currentPassword || !newPassword || !confirmPassword}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Update Password</Text>
        )}
      </Pressable>
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
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  error: {
    color: '#c00',
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
