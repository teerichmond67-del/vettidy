import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/types';
import { authStyles as styles } from './authStyles';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

type LoadingState = 'email' | 'apple' | 'google' | null;

export function SignInScreen({ navigation }: Props) {
  const { signInWithEmail, signInWithApple, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<LoadingState>(null);

  const handleEmailSignIn = async () => {
    setError(null);
    setLoading('email');
    const { error: signInError } = await signInWithEmail(email.trim(), password);
    setLoading(null);
    if (signInError) setError(signInError);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

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
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
        editable={!disabled}
      />

      <Pressable onPress={() => navigation.navigate('ForgotPassword')} disabled={disabled}>
        <Text style={styles.link}>Forgot password?</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.button, styles.primaryButton]}
        onPress={handleEmailSignIn}
        disabled={disabled || !email || !password}
      >
        {loading === 'email' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Sign In</Text>
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

      <Pressable onPress={() => navigation.navigate('SignUp')} disabled={disabled}>
        <Text style={styles.link}>Don&apos;t have an account? Sign Up</Text>
      </Pressable>
    </View>
  );
}
