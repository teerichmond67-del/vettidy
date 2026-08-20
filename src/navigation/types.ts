export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  Onboarding: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Pack: undefined;
  Settings: undefined;
};

export type PetDetailTabParamList = {
  Overview: { petId: string };
  Documents: { petId: string };
  Vaccinations: { petId: string };
  Medications: { petId: string };
  Weight: { petId: string };
};

export type PaywallTrigger = 'pack_invite' | 'add_medication' | 'weight_tab' | 'export_pdf';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  PetDetail: { petId: string };
  Paywall: { trigger: PaywallTrigger };
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
