import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";

import { useOnboardingStore } from "@/stores/onboardingStore";
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

SplashScreen.preventAutoHideAsync();

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

function OnboardingGate() {
  const isOnboarded = useOnboardingStore((s) => s.isOnboarded);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const first = segments[0];
    const inOnboarding = first === "onboarding";
    if (!isOnboarded && !inOnboarding) {
      router.replace("/onboarding");
    } else if (isOnboarded && inOnboarding) {
      router.replace("/(tabs)");
    }
  }, [isOnboarded, segments, router]);

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
      <Stack.Screen
        name="recipe/[id]"
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
          presentation: "transparentModal",
          animation: "fade",
          contentStyle: { backgroundColor: "transparent" },
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

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: Colors.creme }} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.creme }}>
        <StatusBar style="dark" />
        <OnboardingGate />
        <RootLayoutNav />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
