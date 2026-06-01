/**
 * Mémorise l'URL partagée via la Share Extension quand l'utilisateur n'est pas
 * encore connecté au moment du partage (cas rare : app installée mais session
 * absente). Après login/onboarding, `RootGate` consomme l'URL en attente et
 * rouvre `/import?url=…` pour reprendre l'import là où on l'avait laissé.
 *
 * Volontairement en mémoire (non persisté) pour la V1.0 : si l'app est tuée
 * pendant le login, on perd l'URL — acceptable (l'utilisateur re-partage).
 * Persistance AsyncStorage → V1.0.1 si besoin.
 */
import { create } from "zustand";

type PendingImportState = {
  url: string | null;
  setPendingImport: (url: string) => void;
  clearPendingImport: () => void;
};

export const usePendingImportStore = create<PendingImportState>((set) => ({
  url: null,
  setPendingImport: (url) => set({ url }),
  clearPendingImport: () => set({ url: null }),
}));

export default usePendingImportStore;
