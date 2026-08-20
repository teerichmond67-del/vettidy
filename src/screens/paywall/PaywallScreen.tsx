import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PurchasesPackage } from 'react-native-purchases';

import { useEntitlement } from '../../hooks/useEntitlement';
import type { RootStackParamList } from '../../navigation/types';

const TRIGGER_COPY: Record<string, string> = {
  pack_invite: 'Share pet care with your household — upgrade to Premium.',
  add_medication: 'Track medications and never worry about a double dose — upgrade to Premium.',
  weight_tab: 'See weight trends over time — upgrade to Premium.',
  export_pdf: 'Export a full pet record as a PDF — upgrade to Premium.',
};

const PREMIUM_FEATURES = [
  'Share pet care with caregivers, in real time',
  'Medication tracking with a shared dose log',
  'Weight tracking with trend charts',
  'One-tap PDF export of the full pet record',
];

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

export function PaywallScreen({ route, navigation }: Props) {
  const { isPremium, loading, offering, purchasesEnabled, purchasePackage, restorePurchases } =
    useEntitlement();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasingId(pkg.identifier);
    const result = await purchasePackage(pkg);
    setPurchasingId(null);

    if (result.cancelled) return;

    if (result.error) {
      Alert.alert('Purchase failed', result.error);
      return;
    }

    navigation.goBack();
  };

  const handleRestore = async () => {
    setRestoring(true);
    const result = await restorePurchases();
    setRestoring(false);

    if (result.error) {
      Alert.alert('Restore failed', result.error);
      return;
    }

    Alert.alert('Purchases restored', 'Your subscription status has been refreshed.');
  };

  if (isPremium) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>You&apos;re already Premium</Text>
        <Text style={styles.subtitle}>All premium features are unlocked on this account.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Go Premium</Text>
      <Text style={styles.subtitle}>{TRIGGER_COPY[route.params.trigger]}</Text>

      <View style={styles.featureList}>
        {PREMIUM_FEATURES.map((feature) => (
          <Text key={feature} style={styles.featureRow}>
            • {feature}
          </Text>
        ))}
      </View>

      {!purchasesEnabled ? (
        <Text style={styles.notice}>
          Subscriptions aren&apos;t set up for this build yet. Check back once they&apos;re
          configured.
        </Text>
      ) : loading ? (
        <ActivityIndicator size="large" style={styles.loadingIndicator} />
      ) : !offering || offering.availablePackages.length === 0 ? (
        <Text style={styles.notice}>No subscription plans are available right now.</Text>
      ) : (
        <View style={styles.packageList}>
          {offering.availablePackages.map((pkg) => (
            <Pressable
              key={pkg.identifier}
              style={styles.packageButton}
              onPress={() => handlePurchase(pkg)}
              disabled={purchasingId !== null}
            >
              {purchasingId === pkg.identifier ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.packageTitle}>{pkg.product.title}</Text>
                  <Text style={styles.packagePrice}>{pkg.product.priceString}</Text>
                </>
              )}
            </Pressable>
          ))}
        </View>
      )}

      {purchasesEnabled ? (
        <Pressable onPress={handleRestore} disabled={restoring} style={styles.restoreButton}>
          {restoring ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          )}
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    gap: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginTop: 4,
  },
  featureList: {
    marginTop: 24,
    gap: 8,
  },
  featureRow: {
    fontSize: 15,
  },
  notice: {
    marginTop: 24,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  loadingIndicator: {
    marginTop: 24,
  },
  packageList: {
    marginTop: 24,
    gap: 12,
  },
  packageButton: {
    backgroundColor: '#111',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  packageTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  packagePrice: {
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
    opacity: 0.85,
  },
  restoreButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: '#555',
    fontSize: 14,
  },
});
