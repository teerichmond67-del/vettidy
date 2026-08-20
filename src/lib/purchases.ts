import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

export const PREMIUM_ENTITLEMENT_ID = 'premium';

function getApiKey(): string | null {
  const key =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS
      : process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;

  return key && key.length > 0 ? key : null;
}

let configured = false;

export function isPurchasesConfigured(): boolean {
  return configured;
}

export function initPurchases(): void {
  if (configured) return;

  const apiKey = getApiKey();

  if (!apiKey) {
    console.warn(
      'RevenueCat API key is not set (EXPO_PUBLIC_REVENUECAT_API_KEY_IOS / EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID) — premium purchases are disabled until it is configured.',
    );
    return;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.WARN);
  }

  Purchases.configure({ apiKey });
  configured = true;
}

/**
 * Identifies the RevenueCat "customer" as the pack, not the individual
 * user. Pack sharing is meant to give every member of a household premium
 * features once the owner subscribes — using the shared pack id as the
 * RevenueCat appUserID means every member's device resolves to the same
 * customer/entitlement status, with no custom cross-user logic needed.
 */
export async function identifyPurchasesAccount(packId: string): Promise<void> {
  if (!configured) return;
  await Purchases.logIn(packId);
}

export async function resetPurchasesAccount(): Promise<void> {
  if (!configured) return;
  await Purchases.logOut();
}
