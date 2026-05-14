import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AnalyticsConsentState = {
  consent: boolean | null;
  decidedAt: string | null;
  setConsent: (value: boolean) => void;
  reset: () => void;
};

export const useAnalyticsConsentStore = create<AnalyticsConsentState>()(
  persist(
    (set) => ({
      consent: null,
      decidedAt: null,
      setConsent: (value) =>
        set({ consent: value, decidedAt: new Date().toISOString() }),
      reset: () => set({ consent: null, decidedAt: null }),
    }),
    {
      name: "recettebox.analytics-consent.v1",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function hasDecidedAnalyticsConsent(state: {
  consent: boolean | null;
}): boolean {
  return state.consent !== null;
}

export default useAnalyticsConsentStore;
