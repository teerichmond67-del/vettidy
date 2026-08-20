import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';
import type { RootStackParamList } from '../../navigation/types';

const TRIGGER_COPY: Record<string, string> = {
  pack_invite: 'Share pet care with your household — upgrade to Premium.',
  add_medication: 'Track medications and never worry about a double dose — upgrade to Premium.',
  weight_tab: 'See weight trends over time — upgrade to Premium.',
  export_pdf: 'Export a full pet record as a PDF — upgrade to Premium.',
};

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

export function PaywallScreen({ route }: Props) {
  return <ScreenPlaceholder title="Go Premium" subtitle={TRIGGER_COPY[route.params.trigger]} />;
}
