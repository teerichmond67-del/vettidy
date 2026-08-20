import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';
import type { PetDetailTabParamList } from '../../navigation/types';

type Props = BottomTabScreenProps<PetDetailTabParamList, 'Overview'>;

export function OverviewTab({ route }: Props) {
  return (
    <ScreenPlaceholder
      title="Overview"
      subtitle={`Photo, basic info, and upcoming reminders for pet ${route.params.petId}`}
    />
  );
}
