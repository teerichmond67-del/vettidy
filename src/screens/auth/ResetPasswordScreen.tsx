import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { useAuth } from '../../hooks/useAuth';
import { authStyles as styles } from './authStyles';

const MIN_PASSWORD_LENGTH = 8;

export function ResetPasswordScreen() {
  const { updatePasswordAfterRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setSaving(true);
    const { error: updateError } = await updatePasswordAfterRecovery(password);
    setSaving(false);
    if (updateError) setError(updateError);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set a New Password</Text>
      <Text style={styles.subtitle}>Choose a new password for the account.</Text>

      <TextInput
        style={styles.input}
        placeholder="New Password"
        accessibilityLabel="New Password"
        secureTextEntry
        autoComplete="password-new"
        value={password}
        onChangeText={setPassword}
        editable={!saving}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        accessibilityLabel="Confirm New Password"
        secureTextEntry
        autoComplete="password-new"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        editable={!saving}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.button, styles.primaryButton]}
        onPress={handleSubmit}
        disabled={saving || !password || !confirmPassword}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Set New Password</Text>
        )}
      </Pressable>
    </View>
  );
}
