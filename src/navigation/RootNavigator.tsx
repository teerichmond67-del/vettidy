import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { PetDetailTabNavigator } from '../screens/pet/PetDetailTabNavigator';
import { PetFormScreen } from '../screens/pet/PetFormScreen';
import { VaccinationFormScreen } from '../screens/pet/VaccinationFormScreen';
import { MedicationDetailScreen } from '../screens/pet/MedicationDetailScreen';
import { MedicationFormScreen } from '../screens/pet/MedicationFormScreen';
import { WeightEntryFormScreen } from '../screens/pet/WeightEntryFormScreen';
import { PaywallScreen } from '../screens/paywall/PaywallScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { ChangePasswordScreen } from '../screens/settings/ChangePasswordScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

type RootNavigatorProps = {
  isSignedIn: boolean;
  isPasswordRecovery: boolean;
};

export function RootNavigator({ isSignedIn, isPasswordRecovery }: RootNavigatorProps) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isPasswordRecovery ? (
        // A password-recovery deep link sets a real session, which would
        // otherwise drop the user straight into Main. Intercept it here so
        // they must set a new password first.
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      ) : isSignedIn ? (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen
            name="PetDetail"
            component={PetDetailTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PetForm"
            component={PetFormScreen}
            options={{ presentation: 'modal', headerShown: true, title: 'Add Pet' }}
          />
          <Stack.Screen
            name="VaccinationForm"
            component={VaccinationFormScreen}
            options={{ presentation: 'modal', headerShown: true, title: 'Add Vaccination' }}
          />
          <Stack.Screen
            name="MedicationDetail"
            component={MedicationDetailScreen}
            options={{ headerShown: true, title: 'Medication' }}
          />
          <Stack.Screen
            name="MedicationForm"
            component={MedicationFormScreen}
            options={{ presentation: 'modal', headerShown: true, title: 'Add Medication' }}
          />
          <Stack.Screen
            name="WeightEntryForm"
            component={WeightEntryFormScreen}
            options={{ presentation: 'modal', headerShown: true, title: 'Log Weight' }}
          />
          <Stack.Screen
            name="Paywall"
            component={PaywallScreen}
            options={{ presentation: 'modal', headerShown: true, title: 'Go Premium' }}
          />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{ presentation: 'modal', headerShown: true, title: 'Change Password' }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
