import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type SeenRecipesState = {
  seenIds: string[];
  markAsSeen: (id: string) => void;
};

const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000;

export const useSeenRecipesStore = create<SeenRecipesState>()(
  persist(
    (set, get) => ({
      seenIds: [],
      markAsSeen: (id) => {
        if (!id || get().seenIds.includes(id)) return;
        set((state) => ({ seenIds: [...state.seenIds, id] }));
      },
    }),
    {
      name: "recettebox.seen-recipes.v1",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function isRecipeNew(
  recipe: { id: string; importedAt: string },
  seenIds: string[]
): boolean {
  if (seenIds.includes(recipe.id)) return false;
  const importedAt = new Date(recipe.importedAt);
  if (Number.isNaN(importedAt.getTime())) return false;
  return Date.now() - importedAt.getTime() < RECENT_WINDOW_MS;
}

export default useSeenRecipesStore;
