/**
 * Handler du deep link de la Share Extension — Sprint 2 / N2.1.
 *
 * ⚠️ Cet écran n'est plus l'ancien formulaire « coller une URL » (mocké, reporté
 * en V1.0.1, cf. SHARE-EXTENSION-PLAN.md annexe A5). C'est désormais l'endpoint
 * du deep link `recettebox://import?url=<url-encodée>` ouvert par l'extension de
 * partage (modèle A « passe-plat »).
 *
 * Flux :
 *   1. Résout l'URL à importer depuis deux sources, par priorité :
 *        a. les query params du deep link direct (`?url=…`, synchrone) ;
 *        b. la Share Extension, lue côté natif via `useShareIntentContext()`
 *           (asynchrone — on attend `isReady` avant de trancher).
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
import { useShareIntentContext } from "expo-share-intent";
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

  // ── Source 1 : query params du deep link direct `recettebox://import?url=…`.
  //    Disponibles de façon SYNCHRONE. `url` est le cas nominal ; `text`/`shared`
  //    couvrent les liens manuels / tests E2E.
  const params = useLocalSearchParams<{ url?: string; text?: string; shared?: string }>();
  const queryUrl = extractSharedUrl(
    decodeMaybe(params.url ?? params.text ?? params.shared ?? "")
  );

  // ── Source 2 : la Share Extension `expo-share-intent`. La donnée partagée
  //    N'arrive PAS en query param : elle est lue côté natif via le contexte du
  //    ShareIntentProvider (cf. _layout.tsx), de façon ASYNCHRONE (`isReady`).
  //    `webUrl` = URL propre (partage iOS d'un lien) ; `text` = texte contenant
  //    l'URL noyée (partage TikTok/Android), nettoyé par `extractSharedUrl`.
  const {
    isReady: shareIntentReady,
    hasShareIntent,
    shareIntent,
    resetShareIntent,
  } = useShareIntentContext();
  const intentUrl = hasShareIntent
    ? extractSharedUrl(shareIntent.webUrl ?? shareIntent.text ?? "")
    : "";

  // URL d'import figée une seule fois, priorité query param > share intent :
  //   null  = source pas encore résolue (on attend le module natif) → spinner ;
  //   ""    = résolue mais vide → écran d'aide ;
  //   <url> = cible d'import.
  // Figée en state pour que `resetShareIntent()` (qui vide la source native) ne
  // fasse pas perdre l'URL lors d'un « Réessayer ».
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(queryUrl || null);
  const resolvedRef = useRef<boolean>(Boolean(queryUrl));

  const [phase, setPhase] = useState<Phase>("working");
  const [errorCode, setErrorCode] = useState<ImportErrorCode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  // Évite un double POST si l'effet se re-déclenche (StrictMode / re-render).
  const startedRef = useRef(false);

  // Résout la source une seule fois. Sans query param, on attend que le module
  // natif ait répondu (`shareIntentReady`) avant de trancher.
  useEffect(() => {
    if (resolvedRef.current) return;
    if (!shareIntentReady) return;
    resolvedRef.current = true;
    setResolvedUrl(intentUrl);
    // Intent consommé → on vide la source native pour éviter un reprocessing au
    // prochain montage de l'écran ou retour de background.
    if (hasShareIntent) resetShareIntent();
  }, [shareIntentReady, hasShareIntent, intentUrl, resetShareIntent]);

  const runImport = useCallback(async () => {
    if (resolvedUrl === null) return; // source pas encore résolue → spinner
    if (resolvedUrl === "") {
      setPhase("help");
      return;
    }
    // Pas de session → mémorise l'URL et laisse l'auth reprendre la main.
    if (!session) {
      setPendingImport(resolvedUrl);
      router.replace("/auth/login");
      return;
    }

    setPhase("working");
    try {
      const { jobId } = await createImport(resolvedUrl);
      router.replace(`/import/processing/${jobId}`);
    } catch (err) {
      const e = err instanceof ImportError ? err : new ImportError("UNKNOWN", "Une erreur est survenue.");
      // Session expirée : on re-mémorise et on renvoie vers l'auth.
      if (e.code === "UNAUTHENTICATED") {
        setPendingImport(resolvedUrl);
        router.replace("/auth/login");
        return;
      }
      setErrorCode(e.code);
      setErrorMessage(e.message);
      setPhase("error");
    }
  }, [resolvedUrl, session, setPendingImport, router]);

  useEffect(() => {
    if (!ready) return; // attend que l'état d'auth soit hydraté
    if (resolvedUrl === null) return; // attend la résolution de la source
    if (startedRef.current) return;
    startedRef.current = true;
    void runImport();
  }, [ready, resolvedUrl, runImport]);

  const retry = useCallback(() => {
    startedRef.current = false;
    setErrorCode(null);
    setPhase("working");
    void runImport();
  }, [runImport]);

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
