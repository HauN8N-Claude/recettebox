import { Tabs } from "expo-router";
import { BookOpen, Calendar, Home, ShoppingCart } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

import { Colors } from "@/constants/theme";

export default function TabLayout() {
  const handleTabPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  return (
    <Tabs
      screenListeners={{
        tabPress: handleTabPress,
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.terracotta,
        tabBarInactiveTintColor: Colors.cacao,
        tabBarStyle: {
          backgroundColor: Colors.creme,
          borderTopColor: Colors.rule,
          borderTopWidth: 1,
          height: 84,
          paddingTop: 10,
          paddingBottom: Platform.OS === "ios" ? 28 : 16,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 11,
          marginTop: 4,
          letterSpacing: 0.2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        sceneStyle: { backgroundColor: Colors.creme },
        animation: "fade",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, focused }) => (
            <Home
              color={color}
              size={22}
              strokeWidth={focused ? 2.2 : 1.8}
              opacity={focused ? 1 : 0.55}
            />
          ),
          tabBarLabelStyle: {
            fontFamily: "Inter_600SemiBold",
            fontSize: 11,
            marginTop: 4,
          },
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Bibliothèque",
          tabBarIcon: ({ color, focused }) => (
            <BookOpen
              color={color}
              size={22}
              strokeWidth={focused ? 2.2 : 1.8}
              opacity={focused ? 1 : 0.55}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "Plan",
          tabBarIcon: ({ color, focused }) => (
            <Calendar
              color={color}
              size={22}
              strokeWidth={focused ? 2.2 : 1.8}
              opacity={focused ? 1 : 0.55}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: "Courses",
          tabBarIcon: ({ color, focused }) => (
            <ShoppingCart
              color={color}
              size={22}
              strokeWidth={focused ? 2.2 : 1.8}
              opacity={focused ? 1 : 0.55}
            />
          ),
        }}
      />
      {/* Profil masqué de la tab bar — accessible via l'avatar en haut à droite de l'accueil */}
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
