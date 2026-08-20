import * as Linking from 'expo-linking';
import type { LinkingOptions } from '@react-navigation/native';

import type { RootStackParamList } from './types';

// Universal Links (https://vettidy.com/...) aren't wired up yet - that needs
// an Apple Team ID and the app's Android signing fingerprint to generate
// apple-app-site-association / assetlinks.json, neither of which exist until
// the EAS/Apple Developer steps in docs/store/submission-checklist.md are
// done. Once they are, add 'https://vettidy.com' to prefixes below.
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Main: {
        screens: {
          Pack: 'invite/:inviteCode',
        },
      },
    },
  },
};
