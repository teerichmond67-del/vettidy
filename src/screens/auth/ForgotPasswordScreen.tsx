import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/types';
import { authStyles as styles } from './authStyles';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { sendPasswordResetEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setError(null);
    setSending(true);
    const { error: sendError } = await sendPasswordResetEmail(email.trim());
    setSending(false);
    if (sendError) {
      setError(sendError);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>
          If an account exists for {email}, we sent a link to reset the password.
        </Text>
        <Pressable onPress={() => navigation.navigate('SignIn')}>
          <Text style={styles.link}>Back to Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>
        Enter the account email and we&apos;ll send a link to reset the password.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        accessibilityLabel="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={!sending}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.button, styles.primaryButton]}
        onPress={handleSend}
        disabled={sending || !email}
      >
        {sending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Send Reset Link</Text>
        )}
      </Pressable>

      <Pressable onPress={() => navigation.navigate('SignIn')} disabled={sending}>
        <Text style={styles.link}>Back to Sign In</Text>
      </Pressable>
    </View>
  );
}
