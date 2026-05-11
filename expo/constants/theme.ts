export const Colors = {
  creme: "#FAF6F0",
  cremeDeep: "#F0E9DD",
  terracotta: "#C8654A",
  sauge: "#8A9A7B",
  miel: "#E8B86A",
  cacao: "#5C4A3A",
  encre: "#2A2520",
  rule: "#E8DDC9",
} as const;

export const Radius = {
  cta: 14,
  card: 18,
  pill: 999,
} as const;

export const Spacing = {
  screen: 26,
  section: 32,
  component: 16,
  tabBar: 84,
} as const;

export const demoColors = {
  haloOrange: "#F47B3E",
  pillBackground: Colors.encre,
  pillText: Colors.creme,
  scanCornerYellow: Colors.miel,
} as const;

export const demoAnimations = {
  haloPulseDuration: 1600,
  pillBounceDuration: 1400,
  loadingOrbDuration: 2000,
  confettiDuration: 3000,
} as const;

export const Fonts = {
  titleScreen: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 28,
    color: Colors.encre,
  },
  titleSection: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 22,
    color: Colors.encre,
  },
  recipeCard: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 17,
    color: Colors.encre,
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.encre,
  },
  systemLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.32,
    textTransform: "uppercase" as const,
  },
  caption: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.cacao,
  },
  ctaPrimary: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.creme,
  },
} as const;

export default Colors;
