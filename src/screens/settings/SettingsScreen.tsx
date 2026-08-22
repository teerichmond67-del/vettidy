import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../../hooks/useAuth';
import { useMyPackRole } from '../../hooks/useMyPackRole';
import { usePack } from '../../hooks/usePack';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';

type Props = BottomTabScreenProps<MainTabParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const { session, signOut } = useAuth();
  const { packId } = usePack();
  const { isSitter } = useMyPackRole(packId);
  const rootNavigation = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

  // Spec.md §9: sitter_view_only members must not see the Settings/billing
  // screen. They still need a way to sign out of their own device, so this
  // is a minimal sign-out-only view rather than the full Settings screen.
  if (isSitter) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Account</Text>
        {session?.user.email ? <Text style={styles.email}>{session.user.email}</Text> : null}
        <Pressable
          style={styles.changePasswordButton}
          onPress={() => rootNavigation?.navigate('ChangePassword')}
        >
          <Text style={styles.changePasswordText}>Change Password</Text>
        </Pressable>
        <Pressable style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      {session?.user.email ? <Text style={styles.email}>{session.user.email}</Text> : null}
      <Text style={styles.subtitle}>
        Subscription management and notification preferences go here
      </Text>
      <Pressable
        style={styles.changePasswordButton}
        onPress={() => rootNavigation?.navigate('ChangePassword')}
      >
        <Text style={styles.changePasswordText}>Change Password</Text>
      </Pressable>
      <Pressable style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  email: {
    fontSize: 14,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  changePasswordButton: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  changePasswordText: {
    fontWeight: '600',
  },
  signOutButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#c00',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  signOutText: {
    color: '#c00',
    fontWeight: '600',
  },
});
