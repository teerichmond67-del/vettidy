import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { PackProvider } from './src/hooks/usePack';
import { EntitlementProvider } from './src/hooks/useEntitlement';
import { RootNavigator } from './src/navigation/RootNavigator';
import { OfflineBanner } from './src/components/OfflineBanner';
import { initUploadQueue } from './src/lib/uploadQueue';
import { configureNotifications } from './src/lib/notifications';
import { initPurchases } from './src/lib/purchases';

initUploadQueue();
configureNotifications();
initPurchases();

function AppContent() {
  const { session, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <RootNavigator isSignedIn={!!session} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PackProvider>
          <EntitlementProvider>
            <View style={styles.root}>
              <NavigationContainer>
                <AppContent />
              </NavigationContainer>
              <OfflineBanner />
            </View>
            <StatusBar style="auto" />
          </EntitlementProvider>
        </PackProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
