import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Liste de courses globale = uniquement les recettes que l'utilisateur a
 * explicitement VALIDÉES (bouton « Ajouter à mes courses » sur l'écran
 * Préparer mes courses). L'onglet Courses agrège les ingrédients de ces
 * recettes-là, pas de toute la bibliothèque.
 *
 * - recipeIds      : recettes validées, dans l'ordre d'ajout.
 * - boughtByRecipe : état « pris / acheté » (barré) dans l'onglet Courses,
 *                    indépendant du « j'ai déjà ça » de l'écran par recette.
 */
type ShoppingListState = {
  recipeIds: string[];
  boughtByRecipe: Record<string, Record<number, boolean>>;
  addRecipe: (recipeId: string) => void;
  removeRecipe: (recipeId: string) => void;
  clear: () => void;
  toggleBought: (recipeId: string, idx: number) => void;
};

export const useShoppingListStore = create<ShoppingListState>()(
  persist(
    (set) => ({
      recipeIds: [],
      boughtByRecipe: {},
      addRecipe: (recipeId) =>
        set((state) =>
          state.recipeIds.includes(recipeId)
            ? state
            : { recipeIds: [...state.recipeIds, recipeId] },
        ),
      removeRecipe: (recipeId) =>
        set((state) => {
          const nextBought = { ...state.boughtByRecipe };
          delete nextBought[recipeId];
          return {
            recipeIds: state.recipeIds.filter((id) => id !== recipeId),
            boughtByRecipe: nextBought,
          };
        }),
      clear: () => set({ recipeIds: [], boughtByRecipe: {} }),
      toggleBought: (recipeId, idx) =>
        set((state) => {
          const current = state.boughtByRecipe[recipeId] ?? {};
          return {
            boughtByRecipe: {
              ...state.boughtByRecipe,
              [recipeId]: { ...current, [idx]: !current[idx] },
            },
          };
        }),
    }),
    {
      name: "recettebox.shopping-list.v1",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useShoppingListStore;
