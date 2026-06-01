import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Check } from "lucide-react-native";

import { Colors, Radius } from "@/constants/theme";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  description?: string;
  leading?: React.ReactNode;
};

export function MultiOptionCard({ label, selected, onPress, description, leading }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  // Pop animation indépendante du scale de press : se déclenche quand l'option
  // passe de non-sélectionnée à sélectionnée. Empilée via transform stacking.
  const popScale = useRef(new Animated.Value(1)).current;
  const prevSelected = useRef(selected);

  useEffect(() => {
    if (selected && !prevSelected.current) {
      Animated.sequence([
        Animated.spring(popScale, {
          toValue: 1.04,
          useNativeDriver: true,
          speed: 40,
          bounciness: 8,
        }),
        Animated.spring(popScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 30,
          bounciness: 6,
        }),
      ]).start();
    }
    prevSelected.current = selected;
  }, [selected, popScale]);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPressIn={() => {
        Animated.spring(scale, {
          toValue: 0.98,
          useNativeDriver: true,
          speed: 40,
          bounciness: 0,
        }).start();
      }}
      onPressOut={() => {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 30,
          bounciness: 6,
        }).start();
      }}
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPress();
      }}
    >
      <Animated.View
        style={[
          styles.card,
          selected ? styles.cardActive : styles.cardInactive,
          { transform: [{ scale }, { scale: popScale }] },
        ]}
      >
        <View
          style={[
            styles.checkbox,
            selected ? styles.checkboxOn : styles.checkboxOff,
          ]}
        >
          {selected ? <Check size={14} color={Colors.creme} strokeWidth={3} /> : null}
        </View>
        {leading ? <View style={styles.leading}>{leading}</View> : null}
        <View style={styles.textCol}>
          <Text style={[styles.label, selected && styles.labelActive]}>{label}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: Radius.cta,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  cardInactive: {
    backgroundColor: Colors.cremeDeep,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  cardActive: {
    backgroundColor: Colors.creme,
    borderWidth: 2,
    borderColor: Colors.terracotta,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOff: {
    borderWidth: 2,
    borderColor: Colors.cacao,
    backgroundColor: "transparent",
  },
  checkboxOn: {
    backgroundColor: Colors.terracotta,
    borderWidth: 2,
    borderColor: Colors.terracotta,
  },
  leading: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: Colors.cremeDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.encre,
  },
  labelActive: {
    fontFamily: "Inter_600SemiBold",
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.cacao,
  },
});

export default MultiOptionCard;
