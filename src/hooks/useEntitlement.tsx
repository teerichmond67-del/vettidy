import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import Purchases, {
  type CustomerInfo,
  type CustomerInfoUpdateListener,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

import { usePack } from './usePack';
import {
  PREMIUM_ENTITLEMENT_ID,
  identifyPurchasesAccount,
  isPurchasesConfigured,
  resetPurchasesAccount,
} from '../lib/purchases';

type PurchaseResult = { error: string | null; cancelled: boolean };

type EntitlementContextValue = {
  isPremium: boolean;
  loading: boolean;
  offering: PurchasesOffering | null;
  purchasesEnabled: boolean;
  purchasePackage: (pkg: PurchasesPackage) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<{ error: string | null }>;
};

const EntitlementContext = createContext<EntitlementContextValue | undefined>(undefined);

function hasPremiumEntitlement(customerInfo: CustomerInfo): boolean {
  return !!customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];
}

function isCancelledPurchaseError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null || !('code' in err)) return false;
  return (
    (err as { code: unknown }).code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
  );
}

export function EntitlementProvider({ children }: { children: ReactNode }) {
  const { packId } = usePack();
  const purchasesEnabled = isPurchasesConfigured();

  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(purchasesEnabled);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);

  useEffect(() => {
    if (!purchasesEnabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reflects config state, not derived from props
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      if (packId) {
        await identifyPurchasesAccount(packId);
      } else {
        await resetPurchasesAccount();
      }

      if (cancelled) return;
      setLoading(true);

      try {
        const [customerInfo, offerings] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings(),
        ]);

        if (cancelled) return;

        setIsPremium(hasPremiumEntitlement(customerInfo));
        setOffering(offerings.current);
      } catch (err) {
        if (!cancelled) {
          console.warn('Failed to load entitlement info', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [packId, purchasesEnabled]);

  useEffect(() => {
    if (!purchasesEnabled) return;

    const listener: CustomerInfoUpdateListener = (customerInfo) => {
      setIsPremium(hasPremiumEntitlement(customerInfo));
    };

    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [purchasesEnabled]);

  const value = useMemo<EntitlementContextValue>(
    () => ({
      isPremium,
      loading,
      offering,
      purchasesEnabled,
      purchasePackage: async (pkg) => {
        try {
          const { customerInfo } = await Purchases.purchasePackage(pkg);
          setIsPremium(hasPremiumEntitlement(customerInfo));
          return { error: null, cancelled: false };
        } catch (err) {
          if (isCancelledPurchaseError(err)) {
            return { error: null, cancelled: true };
          }
          const message = err instanceof Error ? err.message : 'Purchase failed. Please try again.';
          return { error: message, cancelled: false };
        }
      },
      restorePurchases: async () => {
        try {
          const customerInfo = await Purchases.restorePurchases();
          setIsPremium(hasPremiumEntitlement(customerInfo));
          return { error: null };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Could not restore purchases.';
          return { error: message };
        }
      },
    }),
    [isPremium, loading, offering, purchasesEnabled],
  );

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}

export function useEntitlement() {
  const context = useContext(EntitlementContext);
  if (!context) {
    throw new Error('useEntitlement must be used within an EntitlementProvider');
  }
  return context;
}
