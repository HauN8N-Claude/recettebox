import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type CheckedState = {
  checkedByRecipe: Record<string, Record<number, boolean>>;
  toggleCheck: (recipeId: string, idx: number) => void;
};

export const useCheckedIngredientsStore = create<CheckedState>()(
  persist(
    (set) => ({
      checkedByRecipe: {},
      toggleCheck: (recipeId, idx) =>
        set((state) => {
          const current = state.checkedByRecipe[recipeId] ?? {};
          return {
            checkedByRecipe: {
              ...state.checkedByRecipe,
              [recipeId]: { ...current, [idx]: !current[idx] },
            },
          };
        }),
    }),
    {
      name: "recettebox.checked-ingredients.v1",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useCheckedIngredientsStore;
