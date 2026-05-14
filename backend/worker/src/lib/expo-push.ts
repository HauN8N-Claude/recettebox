// =============================================================================
// Notifications push Expo
// =============================================================================
// Récupère les tokens du user et envoie via Expo Push Notifications API.
// =============================================================================

import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import { supabase } from "./supabase.js";
import { logger } from "./logger.js";

const expo = new Expo();

export async function sendRecipeReadyPush(
  userId: string,
  recipeTitle: string,
  recipeId: string,
) {
  const { data: tokens, error } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("user_id", userId);

  if (error) {
    logger.warn("Failed to fetch push tokens", { userId, error: error.message });
    return;
  }
  if (!tokens || tokens.length === 0) {
    logger.debug("No push token for user", { userId });
    return;
  }

  const messages: ExpoPushMessage[] = tokens
    .map((t) => t.token as string)
    .filter((t) => Expo.isExpoPushToken(t))
    .map((to) => ({
      to,
      sound: "default",
      title: "Ta recette est prête !",
      body: recipeTitle ? `"${recipeTitle}" est dans ta bibliothèque.` : "Ouvre RecetteBox pour la découvrir.",
      data: { recipeId, type: "recipe_ready" },
      priority: "high",
    }));

  if (messages.length === 0) return;

  try {
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
    logger.info("Push notifications sent", { userId, count: messages.length });
  } catch (err) {
    logger.error("Push send failed", { userId, error: (err as Error).message });
  }
}
