import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Linking, Platform } from "react-native";

import { supabase } from "@/lib/supabase";

export type NotificationStatus = "granted" | "denied" | "undetermined";

/**
 * Lit le statut actuel des permissions de notification (sans en demander).
 */
export async function getNotificationStatus(): Promise<NotificationStatus> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === "granted") return "granted";
    if (status === "denied") return "denied";
    return "undetermined";
  } catch {
    return "undetermined";
  }
}

/**
 * Ouvre les réglages système (iOS / Android) où l'utilisateur peut
 * activer ou désactiver les notifications de l'app.
 */
export function openSystemSettings(): void {
  Linking.openSettings().catch(() => {});
}

/**
 * Enregistre un token Expo Push pour l'utilisateur connecté.
 * Best-effort : logue silencieusement les erreurs, ne plante jamais l'app.
 *
 * Cas où on ne fait rien :
 * - Simulateur / émulateur (Expo push ne fonctionne que sur device réel).
 * - Web (pas de push Expo natif).
 * - Permission refusée par l'utilisateur.
 * - projectId Expo non configuré dans app.json (V1.0 : à ajouter quand le
 *   projet Expo Cloud est créé).
 */
export async function registerPushTokenForUser(userId: string): Promise<void> {
  try {
    if (!Device.isDevice) {
      console.log("[push] skip — appareil simulé");
      return;
    }
    if (Platform.OS === "web") {
      console.log("[push] skip — web (pas de push Expo natif)");
      return;
    }

    // Permission
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing === "undetermined") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("[push] skip — permission non accordée");
      return;
    }

    // projectId Expo requis pour getExpoPushTokenAsync (SDK 49+)
    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)
        ?.eas?.projectId ??
      (Constants.easConfig as { projectId?: string } | undefined)?.projectId;

    if (!projectId) {
      console.log(
        "[push] skip — projectId Expo non configuré dans app.json (extra.eas.projectId)",
      );
      return;
    }

    // Récupération du token
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    // Plateforme à enregistrer (compatible contrainte CHECK SQL : ios | android | web)
    const platform: "ios" | "android" | "web" =
      Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "web";

    // Upsert : si le même token existe déjà (réinstall, login sur autre compte),
    // on met à jour user_id + last_used_at.
    const { error } = await supabase.from("push_tokens").upsert(
      {
        user_id: userId,
        token,
        platform,
        device_name: Device.modelName ?? Platform.OS,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: "token" },
    );

    if (error) {
      console.log("[push] upsert error :", error.message);
      return;
    }

    console.log("[push] token enregistré");
  } catch (e) {
    console.log("[push] erreur inattendue :", e);
  }
}

export default registerPushTokenForUser;
