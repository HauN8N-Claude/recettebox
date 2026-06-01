/**
 * Handler du deep link de la Share Extension — Sprint 2 / N2.1.
 *
 * ⚠️ Cet écran n'est plus l'ancien formulaire « coller une URL » (mocké, reporté
 * en V1.0.1, cf. SHARE-EXTENSION-PLAN.md annexe A5). C'est désormais l'endpoint
 * du deep link `recettebox://import?url=<url-encodée>` ouvert par l'extension de
 * partage (modèle A « passe-plat »).
 *
 * Flux :
 *   1. Lit le paramètre `url` (ou `text`/`shared`) des query params.
 *   2. Extrait/nettoie l'URL (tolère « Check this out: https://… »).
 *   3. Si pas de session → mémorise l'URL (pendingImportStore) et redirige vers
 *      l'auth ; RootGate rouvrira cet écran une fois connecté.
 *   4. Si session → POST /functions/v1/imports, puis router.replace vers
 *      /import/processing/{jobId}.
 *   5. Erreurs (plateforme non supportée, quota, réseau, serveur) → vue d'erreur
 *      avec action adaptée (paywall pour les quotas).
 *
 * Ouverture directe sans paramètre `url` → petit écran d'aide.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertTriangle, ChefHat, Share2, Sparkles } from "lucide-react-native";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { PressableScale } from "@/components/PressableScale";
import { useAuth } from "@/hooks/useAuth";
import { usePendingImportStore } from "@/stores/pendingImportStore";
import {
  createImport,
  extractSharedUrl,
  ImportError,
  isQuotaError,
  type ImportErrorCode,
} from "@/lib/api/imports";

type Phase = "working" | "error" | "help";

export default function ImportDeepLinkScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, ready } = useAuth();
  const setPendingImport = usePendingImportStore((s) => s.setPendingImport);

  // Les query params du deep link. `url` est le cas nominal (extension iOS qui
  // partage une URL propre) ; `text`/`shared` couvrent le texte TikTok Android.
  const params = useLocalSearchParams<{ url?: string; text?: string; shared?: string }>();
  const rawShared = params.url ?? params.text ?? params.shared ?? "";
  const sharedUrl = extractSharedUrl(decodeMaybe(rawShared));

  const [phase, setPhase] = useState<Phase>(sharedUrl ? "working" : "help");
  const [errorCode, setErrorCode] = useState<ImportErrorCode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  // Évite un double POST si l'effet se re-déclenche (StrictMode / re-render).
  const startedRef = useRef(false);

  const runImport = useCallback(async () => {
    if (!sharedUrl) {
      setPhase("help");
      return;
    }
    // Pas de session → mémorise l'URL et laisse l'auth reprendre la main.
    if (!session) {
      setPendingImport(sharedUrl);
      router.replace("/auth/login");
      return;
    }

    setPhase("working");
    try {
      const { jobId } = await createImport(sharedUrl);
      router.replace(`/import/processing/${jobId}`);
    } catch (err) {
      const e = err instanceof ImportError ? err : new ImportError("UNKNOWN", "Une erreur est survenue.");
      // Session expirée : on re-mémorise et on renvoie vers l'auth.
      if (e.code === "UNAUTHENTICATED") {
        setPendingImport(sharedUrl);
        router.replace("/auth/login");
        return;
      }
      setErrorCode(e.code);
      setErrorMessage(e.message);
      setPhase("error");
    }
  }, [sharedUrl, session, setPendingImport, router]);

  useEffect(() => {
    if (!ready) return; // attend que l'état d'auth soit hydraté
    if (startedRef.current) return;
    startedRef.current = true;
    void runImport();
  }, [ready, runImport]);

  const retry = useCallback(() => {
    startedRef.current = false;
    setErrorCode(null);
    setPhase(sharedUrl ? "working" : "help");
    void runImport();
  }, [runImport, sharedUrl]);

  const goPremium = useCallback(() => {
    router.replace("/paywall");
  }, [router]);

  const goHome = useCallback(() => {
    router.replace("/(tabs)");
  }, [router]);

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {phase === "working" && <WorkingView />}

      {phase === "help" && <HelpView onClose={goHome} />}

      {phase === "error" && (
        <ErrorView
          message={errorMessage}
          isQuota={errorCode ? isQuotaError(errorCode) : false}
          onRetry={retry}
          onPremium={goPremium}
          onClose={goHome}
        />
      )}
    </View>
  );
}

/** Décode l'URL-encoding une seule fois si nécessaire (le deep link arrive encodé). */
function decodeMaybe(value: string): string {
  if (!value) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function WorkingView() {
  return (
    <View style={styles.centered}>
      <View style={styles.iconHalo}>
        <ChefHat size={26} color={Colors.terracotta} strokeWidth={1.7} />
      </View>
      <Text style={styles.title}>On enregistre ta recette…</Text>
      <Text style={styles.subtitle}>Encore un instant, on prépare tout.</Text>
      <ActivityIndicator color={Colors.terracotta} style={{ marginTop: 22 }} />
    </View>
  );
}

function HelpView({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.centered}>
      <View style={styles.iconHalo}>
        <Share2 size={24} color={Colors.sauge} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>Partage un lien pour importer</Text>
      <Text style={styles.subtitle}>
        Depuis Instagram ou TikTok, touche « Partager » puis choisis RecetteBox.
        On extrait la recette automatiquement.
      </Text>
      <PressableScale onPress={onClose} style={styles.primaryBtn} scaleTo={0.97}>
        <Sparkles size={16} color={Colors.creme} strokeWidth={2.2} />
        <Text style={styles.primaryBtnText}>Compris</Text>
      </PressableScale>
    </View>
  );
}

function ErrorView({
  message,
  isQuota,
  onRetry,
  onPremium,
  onClose,
}: {
  message: string;
  isQuota: boolean;
  onRetry: () => void;
  onPremium: () => void;
  onClose: () => void;
}) {
  return (
    <View style={styles.centered}>
      <View style={[styles.iconHalo, styles.iconHaloError]}>
        <AlertTriangle size={24} color={Colors.terracotta} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>
        {isQuota ? "Limite atteinte" : "Import impossible"}
      </Text>
      <Text style={styles.subtitle}>{message}</Text>

      {isQuota ? (
        <PressableScale onPress={onPremium} style={styles.primaryBtn} scaleTo={0.97}>
          <Sparkles size={16} color={Colors.creme} strokeWidth={2.2} />
          <Text style={styles.primaryBtnText}>Passer en Premium</Text>
        </PressableScale>
      ) : (
        <PressableScale onPress={onRetry} style={styles.primaryBtn} scaleTo={0.97}>
          <Text style={styles.primaryBtnText}>Réessayer</Text>
        </PressableScale>
      )}

      <PressableScale onPress={onClose} style={styles.ghostBtn} scaleTo={0.97}>
        <Text style={styles.ghostBtnText}>Plus tard</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.screen,
  },
  iconHalo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.cremeDeep,
    borderWidth: 1,
    borderColor: Colors.rule,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  iconHaloError: {
    backgroundColor: "rgba(200,101,74,0.12)",
    borderColor: "rgba(200,101,74,0.30)",
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 24,
    color: Colors.encre,
    textAlign: "center",
    lineHeight: 30,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
    maxWidth: 320,
  },
  primaryBtn: {
    marginTop: 28,
    height: 52,
    paddingHorizontal: 24,
    borderRadius: Radius.cta,
    backgroundColor: Colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.creme,
  },
  ghostBtn: {
    marginTop: 12,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: Radius.cta,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.cacao,
  },
});
