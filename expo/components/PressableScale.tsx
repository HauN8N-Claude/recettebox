import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  PressableProps,
  Platform,
  StyleProp,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";

type Props = PressableProps & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
  children?: React.ReactNode;
};

export function PressableScale({
  style,
  scaleTo = 0.97,
  haptic = true,
  onPressIn,
  onPressOut,
  onPress,
  children,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        Animated.spring(scale, {
          toValue: scaleTo,
          useNativeDriver: true,
          speed: 40,
          bounciness: 0,
        }).start();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 30,
          bounciness: 6,
        }).start();
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic && Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPress?.(e);
      }}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default PressableScale;
