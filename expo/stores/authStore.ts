import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { registerPushTokenForUser } from "@/lib/pushNotifications";
import {
  hydrateOnboardingFromProfile,
  resyncIfNeeded,
} from "@/lib/api/profile";
import { BYPASS_AUTH, BYPASS_USER } from "@/constants/devFlags";

/**
 * Construit une fausse session + user pour le mode BYPASS_AUTH.
 * Pas de vrai JWT — les requêtes Supabase échoueront silencieusement (RLS),
 * mais ça suffit pour que RootGate envoie l'user sur les tabs et que les
 * écrans qui lisent user_metadata.first_name (ex: profile.tsx) affichent
 * quelque chose.
 */
function buildFakeAuthState(): { session: Session; user: User } {
  const fakeUser = {
    id: BYPASS_USER.id,
    email: BYPASS_USER.email,
    app_metadata: {},
    user_metadata: { first_name: BYPASS_USER.first_name },
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as unknown as User;

  const fakeSession = {
    access_token: "dev-fake-token",
    refresh_token: "dev-fake-refresh",
    expires_in: 3600 * 24 * 365,
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
    token_type: "bearer",
    user: fakeUser,
  } as unknown as Session;

  return { session: fakeSession, user: fakeUser };
}

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

    // ⚠️ DEV BYPASS — cf. constants/devFlags.ts. Injecte une fausse session
    // au boot pour skip Login/Onboarding et atterrir direct sur les tabs.
    // À désactiver avant tout build EAS.
    if (BYPASS_AUTH) {
      const fake = buildFakeAuthState();
      set({
        session: fake.session,
        user: fake.user,
        ready: true,
      });
      console.warn(
        "[authStore] ⚠️ BYPASS_AUTH activé (constants/devFlags.ts). Fake user injecté, requêtes Supabase échoueront. NE PAS BUILD AVEC CE FLAG.",
      );
      return;
    }

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
