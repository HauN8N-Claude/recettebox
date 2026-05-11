import React, { useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

import { Colors, Radius } from "@/constants/theme";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  trailing?: React.ReactNode;
  leading?: React.ReactNode;
  description?: string;
};

export function OptionCard({ label, selected, onPress, trailing, leading, description }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
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
          { transform: [{ scale }] },
        ]}
      >
        {leading ? (
          <View style={[styles.leadingWrap, selected && styles.leadingWrapActive]}>
            {leading}
          </View>
        ) : null}
        <View style={styles.textCol}>
          <Text style={[styles.label, selected && styles.labelActive]}>{label}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
        {trailing}
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
    gap: 12,
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
  textCol: {
    flex: 1,
    gap: 4,
  },
  leadingWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.creme,
    borderWidth: 1,
    borderColor: Colors.rule,
    alignItems: "center",
    justifyContent: "center",
  },
  leadingWrapActive: {
    backgroundColor: Colors.cremeDeep,
    borderColor: "transparent",
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

export default OptionCard;
