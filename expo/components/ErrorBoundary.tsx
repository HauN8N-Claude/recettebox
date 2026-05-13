import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { AlertTriangle, RotateCcw } from "lucide-react-native";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { PressableScale } from "@/components/PressableScale";

type Props = {
  children: React.ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // V1.0 : log uniquement console. PostHog (C2.2) sera ajouté en V1.0.1
    // pour remonter ces crashes de façon centralisée.
    if (__DEV__) {
      console.error("[ErrorBoundary]", error, info.componentStack);
    } else {
      console.error("[ErrorBoundary]", error.message);
    }
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <ErrorFallback error={this.state.error} onReset={this.handleReset} />
      );
    }
    return this.props.children;
  }
}

function ErrorFallback({
  error,
  onReset,
}: {
  error: Error;
  onReset: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconRing}>
        <AlertTriangle size={32} color={Colors.terracotta} strokeWidth={1.6} />
      </View>
      <Text style={styles.title}>Oups, quelque chose a planté.</Text>
      <Text style={styles.body}>
        On note l&apos;incident. Tu peux réessayer&nbsp;— si le problème
        persiste, ferme et rouvre l&apos;app.
      </Text>

      {__DEV__ && Platform.OS !== "web" ? (
        <View style={styles.devBox}>
          <Text style={styles.devLabel}>Détail (dev seulement)</Text>
          <Text style={styles.devText} numberOfLines={6}>
            {error.message}
          </Text>
        </View>
      ) : null}

      <PressableScale style={styles.cta} onPress={onReset} scaleTo={0.97}>
        <RotateCcw size={18} color={Colors.creme} strokeWidth={2} />
        <Text style={styles.ctaText}>Réessayer</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.creme,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.screen,
    gap: 18,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.cremeDeep,
    borderWidth: 1,
    borderColor: Colors.rule,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 26,
    color: Colors.encre,
    textAlign: "center",
    lineHeight: 32,
    maxWidth: 320,
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.cacao,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
  devBox: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.card,
    backgroundColor: Colors.cremeDeep,
    borderWidth: 1,
    borderColor: Colors.rule,
    alignSelf: "stretch",
    gap: 6,
  },
  devLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.32,
    textTransform: "uppercase",
    color: Colors.sauge,
  },
  devText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.encre,
    lineHeight: 18,
  },
  cta: {
    marginTop: 8,
    height: 54,
    paddingHorizontal: 28,
    borderRadius: Radius.cta,
    backgroundColor: Colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: Colors.terracotta,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  ctaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.creme,
    letterSpacing: 0.2,
  },
});

export default ErrorBoundary;
