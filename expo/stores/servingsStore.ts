import { create } from "zustand";

type ServingsState = {
  servingsByRecipe: Record<string, number>;
  setServings: (recipeId: string, servings: number) => void;
};

export const useServingsStore = create<ServingsState>()((set) => ({
  servingsByRecipe: {},
  setServings: (recipeId, servings) =>
    set((state) => ({
      servingsByRecipe: { ...state.servingsByRecipe, [recipeId]: servings },
    })),
}));

export default useServingsStore;
