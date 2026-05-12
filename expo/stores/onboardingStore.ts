import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type OnboardingAnswers = {
  // Séquence 1
  q1_cookingDuration: "debute" | "debrouille" | "jaime" | "weekends" | null;
  q2_motivation: "ranger" | "cuisiner" | "inspiration" | "lancer" | null;

  // Séquence 2
  q3_sources: ("instagram" | "tiktok" | "pinterest" | "web" | "manuscript")[];
  q4_sources: ("tiktok" | "instagram" | "pinterest")[];
  q4_totalRecipes: number;
  q4_weeklySaved: "few" | "ten" | "many" | "countless" | null;
  q5_cookedRecipes: number;
  q5_cooked_ratio: "almost_all" | "half" | "few" | "none" | null;

  // Séquence 3
  q6_frequency: "jamais" | "1-2" | "3-5" | "tousJours" | null;
  q7_slot: "semaine" | "weekend" | "recevoir" | "depend" | null;
  q8_restrictions: string[];
  q9_household: "seul" | "duo" | "famille" | "plus" | null;
  q9_challenge: string | null;

  // Séquence 4
  q10_objectives: string[];
  q11_frictions: string[];
  q12_sundayMood: string | null;

  // Séquence 5
  q14_firstName: string;
  q3_sources_demo: ("social" | "web" | "manuscript")[];
  q15_pastedUrl: string;

  // Séquence 5 — démo conditionnelle
  selectedSources: ("A" | "B" | "C")[];
  currentDemoTrack: "A" | "B" | "C" | null;

  // Mémoire court-terme normalisée pour l'Acte 1 (utilisée par l'écran profil & au-delà)
  platforms: string[];
  savesPerWeek: "1-3" | "4-10" | "11-20" | "20+" | null;
  cookedRatio: "toutes" | "moitie" | "quelques" | "aucune" | null;
  blockers: string[];
  userProfile: string | null;
  cookingTime: "express" | "semaine" | "confort" | "afond" | null;

  // Acte 2 — exclusions alimentaires
  allergies: (
    | "aucune"
    | "fruits-a-coque"
    | "arachides"
    | "lactose"
    | "oeufs"
    | "poisson-crustaces"
    | "soja"
  )[];
  customExclusions: string[];

  // Méta
  isOnboarded: boolean;
};

type OnboardingActions = {
  setAnswer: <K extends keyof OnboardingAnswers>(
    key: K,
    value: OnboardingAnswers[K]
  ) => void;
  toggleSource: (track: "A" | "B" | "C") => void;
  setCurrentDemoTrack: (track: "A" | "B" | "C" | null) => void;
  reset: () => void;
  finish: () => void;
};

const initialAnswers: OnboardingAnswers = {
  q1_cookingDuration: null,
  q2_motivation: null,
  q3_sources: [],
  q4_sources: [],
  q4_totalRecipes: 0,
  q4_weeklySaved: null,
  q5_cookedRecipes: 0,
  q5_cooked_ratio: null,
  q6_frequency: null,
  q7_slot: null,
  q8_restrictions: [],
  q9_household: null,
  q9_challenge: null,
  q10_objectives: [],
  q11_frictions: [],
  q12_sundayMood: null,
  q14_firstName: "",
  q3_sources_demo: [],
  q15_pastedUrl: "",
  selectedSources: [],
  currentDemoTrack: null,
  platforms: [],
  savesPerWeek: null,
  cookedRatio: null,
  blockers: [],
  userProfile: null,
  cookingTime: null,
  allergies: [],
  customExclusions: [],
  isOnboarded: false,
};

export const useOnboardingStore = create<OnboardingAnswers & OnboardingActions>()(
  persist(
    (set) => ({
      ...initialAnswers,
      setAnswer: (key, value) => set({ [key]: value } as Partial<OnboardingAnswers>),
      toggleSource: (track) =>
        set((state) => ({
          selectedSources: state.selectedSources.includes(track)
            ? state.selectedSources.filter((t) => t !== track)
            : [...state.selectedSources, track],
        })),
      setCurrentDemoTrack: (track) => set({ currentDemoTrack: track }),
      reset: () => set({ ...initialAnswers }),
      finish: () => set({ isOnboarded: true }),
    }),
    {
      name: "recettebox.onboarding.v1",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useOnboardingStore;
