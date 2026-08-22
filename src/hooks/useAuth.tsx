import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type OAuthProvider = 'apple' | 'google';

type AuthResult = { error: string | null };

type SignUpResult = AuthResult & { needsEmailConfirmation: boolean };

type AuthContextValue = {
  session: Session | null;
  initializing: boolean;
  isPasswordRecovery: boolean;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (email: string, password: string) => Promise<SignUpResult>;
  signInWithApple: () => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  sendPasswordResetEmail: (email: string) => Promise<AuthResult>;
  updatePasswordAfterRecovery: (newPassword: string) => Promise<AuthResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Path segment of the deep link Supabase's reset-password email points at
// (see sendPasswordResetEmail's redirectTo). Kept separate from the OAuth
// callback path so the two flows can't be confused for one another.
const RESET_PASSWORD_PATH = 'reset-password';

// The reset-password email link carries the recovery session as
// access_token/refresh_token in the URL, exactly like the OAuth callback
// above - so it's parsed the same way (expo-auth-session handles both
// '?' and '#'-delimited params; expo-linking's own parser does not).
async function tryEstablishRecoverySession(url: string): Promise<boolean> {
  const { path } = Linking.parse(url);
  if (path !== RESET_PASSWORD_PATH) return false;

  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode || !params.access_token || !params.refresh_token) return false;

  const { error } = await supabase.auth.setSession({
    access_token: params.access_token,
    refresh_token: params.refresh_token,
  });

  return !error;
}

async function signInWithOAuthProvider(provider: OAuthProvider): Promise<AuthResult> {
  const redirectTo = Linking.createURL('/auth-callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });

  if (error) {
    return { error: error.message };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== 'success' || !result.url) {
    return {
      error: result.type === 'cancel' ? null : 'Sign-in was interrupted. Please try again.',
    };
  }

  const { params, errorCode } = QueryParams.getQueryParams(result.url);

  if (errorCode) {
    return { error: params.error_description ?? errorCode };
  }

  const { access_token, refresh_token } = params;

  if (!access_token || !refresh_token) {
    return { error: 'Sign-in did not return a valid session. Please try again.' };
  }

  const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });

  return { error: sessionError?.message ?? null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleUrl = (url: string) => {
      tryEstablishRecoverySession(url).then((matched) => {
        if (matched) setIsPasswordRecovery(true);
      });
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      initializing,
      isPasswordRecovery,
      signInWithEmail: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      signUpWithEmail: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        return {
          error: error?.message ?? null,
          needsEmailConfirmation: !error && !data.session,
        };
      },
      signInWithApple: () => signInWithOAuthProvider('apple'),
      signInWithGoogle: () => signInWithOAuthProvider('google'),
      sendPasswordResetEmail: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: Linking.createURL(`/${RESET_PASSWORD_PATH}`),
        });
        return { error: error?.message ?? null };
      },
      updatePasswordAfterRecovery: async (newPassword) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (!error) setIsPasswordRecovery(false);
        return { error: error?.message ?? null };
      },
      changePassword: async (currentPassword, newPassword) => {
        const email = session?.user.email;
        if (!email) return { error: 'No signed-in account found.' };

        // Supabase's updateUser doesn't verify the caller's current password
        // on its own (a valid session is enough) - re-authenticate first so
        // changing the password still requires knowing the old one.
        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        });
        if (reauthError) return { error: 'Current password is incorrect.' };

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        return { error: error?.message ?? null };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, initializing, isPasswordRecovery],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
