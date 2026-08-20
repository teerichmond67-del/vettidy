import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // isConnected can briefly be null while the OS is still resolving
      // status — treat that as "assume online" rather than flashing the
      // offline banner on every app launch.
      setIsConnected(state.isConnected !== false);
    });

    return unsubscribe;
  }, []);

  return { isConnected };
}
