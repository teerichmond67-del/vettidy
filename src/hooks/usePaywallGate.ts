import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useEntitlement } from './useEntitlement';
import type { PaywallTrigger, RootStackParamList } from '../navigation/types';

/**
 * Returns a guard function: call it with a trigger when a free user taps a
 * premium action. If they're not premium, it routes to the Paywall (with
 * the matching contextual message) and reports that the action was blocked.
 */
export function usePaywallGate() {
  const { isPremium } = useEntitlement();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (trigger: PaywallTrigger): boolean => {
    if (isPremium) return false;
    navigation.navigate('Paywall', { trigger });
    return true;
  };
}
