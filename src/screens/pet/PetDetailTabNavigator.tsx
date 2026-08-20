import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';

import { usePaywallGate } from '../../hooks/usePaywallGate';
import type {
  PaywallTrigger,
  PetDetailTabParamList,
  RootStackParamList,
} from '../../navigation/types';
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
  const guardPremium = usePaywallGate();

  const premiumTabListener = (trigger: PaywallTrigger) => ({
    tabPress: (e: { preventDefault: () => void }) => {
      if (guardPremium(trigger)) {
        e.preventDefault();
      }
    },
  });

  return (
    <Tab.Navigator initialRouteName="Overview" screenOptions={{ headerShown: true }}>
      <Tab.Screen name="Overview" component={OverviewTab} initialParams={{ petId }} />
      <Tab.Screen name="Documents" component={DocumentsTab} initialParams={{ petId }} />
      <Tab.Screen name="Vaccinations" component={VaccinationsTab} initialParams={{ petId }} />
      <Tab.Screen
        name="Medications"
        component={MedicationsTab}
        initialParams={{ petId }}
        listeners={() => premiumTabListener('add_medication')}
      />
      <Tab.Screen
        name="Weight"
        component={WeightTab}
        initialParams={{ petId }}
        listeners={() => premiumTabListener('weight_tab')}
      />
    </Tab.Navigator>
  );
}
