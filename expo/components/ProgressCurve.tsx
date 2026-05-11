import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";

import { Colors } from "@/constants/theme";

const AnimatedPath = Animated.createAnimatedComponent(Path);

const WIDTH = 280;
const HEIGHT = 70;
// gentle upward curve from bottom-left to top-right
const D = "M 4 56 C 60 50, 100 40, 140 30 S 230 14, 276 8";
const TOTAL_LENGTH = 360;

export function ProgressCurve() {
  const dash = useRef(new Animated.Value(TOTAL_LENGTH)).current;
  const dotOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(dash, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: false,
      }),
      Animated.timing(dotOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [dash, dotOpacity]);

  return (
    <View style={{ width: "100%", height: HEIGHT }}>
      <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <Defs>
          <LinearGradient id="g" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={Colors.miel} stopOpacity={0.4} />
            <Stop offset="1" stopColor={Colors.miel} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        {/* baseline */}
        <Path
          d={D}
          stroke={Colors.rule}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <AnimatedPath
          d={D}
          stroke="url(#g)"
          strokeWidth={2.6}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${TOTAL_LENGTH}`}
          strokeDashoffset={dash as unknown as number}
        />
        <Circle cx={276} cy={8} r={4} fill={Colors.miel} />
      </Svg>
    </View>
  );
}

export default ProgressCurve;
