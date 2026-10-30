import { create } from "zustand";

/**
 * Mémorise un lien partagé reçu AVANT connexion.
 *
 * Cas (gap #8) : l'utilisateur partage un Reel vers RecetteBox mais n'est pas
 * encore connecté → on garde le lien ici, on le laisse se connecter / s'inscrire,
 * puis on reprend l'import tout seul une fois la session active.
 * En mémoire uniquement (suffit tant que l'app reste ouverte pendant l'auth).
 */
type PendingImportState = {
  url: string | null;
  setUrl: (url: string) => void;
  clear: () => void;
};

export const usePendingImportStore = create<PendingImportState>((set) => ({
  url: null,
  setUrl: (url) => set({ url }),
  clear: () => set({ url: null }),
}));

export default usePendingImportStore;
