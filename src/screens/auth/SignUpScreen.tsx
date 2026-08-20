import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/types';
import { authStyles as styles } from './authStyles';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

type LoadingState = 'email' | 'apple' | 'google' | null;

export function SignUpScreen({ navigation }: Props) {
  const { signUpWithEmail, signInWithApple, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [loading, setLoading] = useState<LoadingState>(null);

  const handleEmailSignUp = async () => {
    setError(null);
    setLoading('email');
    const { error: signUpError, needsEmailConfirmation } = await signUpWithEmail(
      email.trim(),
      password,
    );
    setLoading(null);
    if (signUpError) {
      setError(signUpError);
    } else if (needsEmailConfirmation) {
      setConfirmationSent(true);
    }
  };

  const handleOAuth = async (provider: 'apple' | 'google') => {
    setError(null);
    setLoading(provider);
    const { error: oauthError } =
      provider === 'apple' ? await signInWithApple() : await signInWithGoogle();
    setLoading(null);
    if (oauthError) setError(oauthError);
  };

  const disabled = loading !== null;

  if (confirmationSent) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>
          We sent a confirmation link to {email}. Follow it to finish creating your account.
        </Text>
        <Pressable onPress={() => navigation.navigate('SignIn')}>
          <Text style={styles.link}>Back to Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Your Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        accessibilityLabel="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={!disabled}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        accessibilityLabel="Password"
        secureTextEntry
        autoComplete="password-new"
        value={password}
        onChangeText={setPassword}
        editable={!disabled}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.button, styles.primaryButton]}
        onPress={handleEmailSignUp}
        disabled={disabled || !email || !password}
      >
        {loading === 'email' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Sign Up</Text>
        )}
      </Pressable>

      <Pressable
        style={[styles.button, styles.secondaryButton]}
        onPress={() => handleOAuth('apple')}
        disabled={disabled}
      >
        {loading === 'apple' ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.secondaryButtonText}>Continue with Apple</Text>
        )}
      </Pressable>

      <Pressable
        style={[styles.button, styles.secondaryButton]}
        onPress={() => handleOAuth('google')}
        disabled={disabled}
      >
        {loading === 'google' ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.secondaryButtonText}>Continue with Google</Text>
        )}
      </Pressable>

      <Pressable onPress={() => navigation.navigate('SignIn')} disabled={disabled}>
        <Text style={styles.link}>Already have an account? Sign In</Text>
      </Pressable>
    </View>
  );
}
