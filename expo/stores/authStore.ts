import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { registerPushTokenForUser } from "@/lib/pushNotifications";
import {
  hydrateOnboardingFromProfile,
  resyncIfNeeded,
} from "@/lib/api/profile";

type AuthState = {
  session: Session | null;
  user: User | null;
  ready: boolean;
  _initialized: boolean;
  init: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  ready: false,
  _initialized: false,
  init: () => {
    if (get()._initialized) return;
    set({ _initialized: true });

    supabase.auth
      .getSession()
      .then(({ data }) => {
        set({
          session: data.session,
          user: data.session?.user ?? null,
          ready: true,
        });
        // Si l'utilisateur est déjà connecté au boot, tenter d'enregistrer
        // un push token (réinstall, nouveau device, etc.). Best-effort.
        if (data.session?.user?.id) {
          registerPushTokenForUser(data.session.user.id).catch(() => {});
          // B6.3 : tentative d'hydratation du profil onboarding depuis la BD
          // (cas réinstall / changement de device) + rejeu du sync si B6.2
          // avait foiré au signup. Fire-and-forget, ne bloque pas le boot.
          hydrateOnboardingFromProfile().catch(() => {});
          resyncIfNeeded().catch(() => {});
        }
      })
      .catch(() => {
        set({ ready: true });
      });

    supabase.auth.onAuthStateChange((event, session) => {
      set({
        session,
        user: session?.user ?? null,
        ready: true,
      });
      // À chaque nouvelle connexion (login ou signup), enregistrer un push token
      // pour ce device. Best-effort, ne bloque pas l'auth si ça plante.
      if (event === "SIGNED_IN" && session?.user?.id) {
        registerPushTokenForUser(session.user.id).catch(() => {});
        // B6.3 : même logique que dans init(), pour le cas login (pas le signup
        // qui appelle déjà syncOnboardingProfile en direct via signup.tsx).
        hydrateOnboardingFromProfile().catch(() => {});
        resyncIfNeeded().catch(() => {});
      }
    });
  },
}));

export default useAuthStore;
