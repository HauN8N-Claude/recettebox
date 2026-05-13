import { Stack } from "expo-router";
import React from "react";

import { Colors } from "@/constants/theme";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.creme },
        animation: "slide_from_right",
        gestureEnabled: false,
      }}
    />
  );
}
