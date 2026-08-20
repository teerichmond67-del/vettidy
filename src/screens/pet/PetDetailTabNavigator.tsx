import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';

import type { PetDetailTabParamList, RootStackParamList } from '../../navigation/types';
import { OverviewTab } from './OverviewTab';
import { DocumentsTab } from './DocumentsTab';
import { VaccinationsTab } from './VaccinationsTab';
import { MedicationsTab } from './MedicationsTab';
import { WeightTab } from './WeightTab';

const Tab = createBottomTabNavigator<PetDetailTabParamList>();

type Props = {
  route: RouteProp<RootStackParamList, 'PetDetail'>;
};

export function PetDetailTabNavigator({ route }: Props) {
  const { petId } = route.params;

  return (
    <Tab.Navigator initialRouteName="Overview" screenOptions={{ headerShown: true }}>
      <Tab.Screen name="Overview" component={OverviewTab} initialParams={{ petId }} />
      <Tab.Screen name="Documents" component={DocumentsTab} initialParams={{ petId }} />
      <Tab.Screen name="Vaccinations" component={VaccinationsTab} initialParams={{ petId }} />
      <Tab.Screen name="Medications" component={MedicationsTab} initialParams={{ petId }} />
      <Tab.Screen name="Weight" component={WeightTab} initialParams={{ petId }} />
    </Tab.Navigator>
  );
}
