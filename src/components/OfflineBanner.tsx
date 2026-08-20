import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function OfflineBanner() {
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  if (isConnected) return null;

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + 6 }]}
      accessibilityRole="alert"
      accessibilityLabel="You're offline. Some changes will sync automatically once you reconnect."
    >
      <Text style={styles.text}>You&apos;re offline — changes will sync when you reconnect</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#946200',
    paddingBottom: 8,
    paddingHorizontal: 16,
    zIndex: 100,
    elevation: 100,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
