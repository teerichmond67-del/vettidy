import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  const isSignedIn = false;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator isSignedIn={isSignedIn} />
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
