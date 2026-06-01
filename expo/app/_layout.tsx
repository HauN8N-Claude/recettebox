import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";

import { useOnboardingStore } from "@/stores/onboardingStore";
import { useAuthStore } from "@/stores/authStore";
import { usePendingImportStore } from "@/stores/pendingImportStore";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from "@expo-google-fonts/fraunces";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  Caveat_400Regular,
  Caveat_500Medium,
  Caveat_600SemiBold,
} from "@expo-google-fonts/caveat";
import { Platform, View } from "react-native";

import { Colors } from "@/constants/theme";
import { ErrorBoundary } from "@/components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

// DEV — Étape 1 visuelle de l'écran "révélation post-import".
// Quand `true` : au démarrage de l'app, on saute login/onboarding et on route
// direct vers /recipe/reveal/preview pour juger le rendu sur Expo Go.
// Basculer sur `false` pour revenir au flow normal de l'app.
const DEV_PREVIEW_REVEAL = false;

// Silence a known react-native-web warning where some internal Animated.View
// components leak the RN-only `collapsable` prop down to the DOM. It is
// harmless but noisy in dev. We filter only this specific message.
if (Platform.OS === "web" && typeof console !== "undefined") {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const first = args[0];
    if (
      typeof first === "string" &&
      first.includes("non-boolean attribute") &&
      args.some((a) => a === "collapsable")
    ) {
      return;
    }
    originalError(...(args as []));
  };
}

const queryClient = new QueryClient();

function RootGate() {
  const isOnboarded = useOnboardingStore((s) => s.isOnboarded);
  const session = useAuthStore((s) => s.session);
  const ready = useAuthStore((s) => s.ready);
  const pendingImportUrl = usePendingImportStore((s) => s.url);
  const clearPendingImport = usePendingImportStore((s) => s.clearPendingImport);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;

    // ASO capture escape — laisser passer les routes /.../preview (écrans d'aperçu démo)
    // pour pouvoir générer les screenshots App Store sans completer onboarding+auth.
    // Inoffensif en prod : aucun vrai id n'a la valeur littérale "preview".
    if (segments[segments.length - 1] === "preview") return;

    if (DEV_PREVIEW_REVEAL) {
      // `useSegments()` renvoie le pattern de route (`[id]`), pas l'URL réelle.
      // On laisse passer la branche /recipe/* (révélation, aha, fiche) ET /paywall
      // pour pouvoir valider l'enchaînement visuel des écrans en mode preview.
      const allowed = segments[0] === "recipe" || segments[0] === "paywall";
      if (!allowed) {
        router.replace("/recipe/reveal/preview");
      }
      return;
    }

    const first = segments[0];
    const inAuth = first === "auth";
    const inOnboarding = first === "onboarding";
    const inImport = first === "import";

    // N2.1 — l'écran `import` (deep link Share Extension) gère lui-même son auth :
    // s'il n'y a pas de session, il mémorise l'URL et redirige vers l'auth. On ne
    // le redirige donc jamais d'ici, sinon on perdrait l'URL partagée.
    if (inImport) return;

    if (session) {
      // Un import partagé attendait la connexion : on le reprend une fois connecté.
      if (pendingImportUrl) {
        clearPendingImport();
        router.replace(`/import?url=${encodeURIComponent(pendingImportUrl)}`);
        return;
      }
      if (inAuth || inOnboarding) {
        router.replace("/(tabs)");
      }
      return;
    }

    if (isOnboarded) {
      if (!inAuth) {
        router.replace("/auth/login");
      }
      return;
    }

    if (!inOnboarding) {
      router.replace("/onboarding");
    }
  }, [ready, session, isOnboarded, segments, router, pendingImportUrl, clearPendingImport]);

  return null;
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Retour",
        contentStyle: { backgroundColor: Colors.creme },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen name="auth" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen name="legal" options={{ headerShown: false }} />
      <Stack.Screen
        name="recipe/[id]"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="recipe/reveal/[id]"
        options={{
          headerShown: false,
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="recipe/aha/[id]"
        options={{
          headerShown: false,
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="paywall"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="cooking/[id]"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="import"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="import/processing/[jobId]"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Caveat_400Regular,
    Caveat_500Medium,
    Caveat_600SemiBold,
  });
  const initAuth = useAuthStore((s) => s.init);
  const authReady = useAuthStore((s) => s.ready);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (fontsLoaded && authReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, authReady]);

  if (!fontsLoaded || !authReady) {
    return <View style={{ flex: 1, backgroundColor: Colors.creme }} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.creme }}>
        <StatusBar style="dark" />
        <ErrorBoundary>
          <RootGate />
          <RootLayoutNav />
        </ErrorBoundary>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
