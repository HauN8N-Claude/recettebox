import type { Router } from "expo-router";

export type DemoParcours = "social" | "web" | "manuscript";
export type DemoTrack = "A" | "B" | "C";

const ORDER: DemoParcours[] = ["social", "web", "manuscript"];
// V1.0 : seul le parcours A (réseaux sociaux) est actif.
// B (web) et C (manuscrites) sont reportés en V1.1 / V1.2 — leurs démos
// restent sur le disque mais ne sont plus accessibles via le routing.
const TRACK_ORDER: DemoTrack[] = ["A"];

const FIRST_ROUTE: Record<DemoParcours, string> = {
  social: "/onboarding/demo-a1",
  web: "/onboarding/demo-b1",
  manuscript: "/onboarding/demo-c1",
};

const FIRST_ROUTE_BY_TRACK: Partial<Record<DemoTrack, string>> = {
  A: "/onboarding/demo-a1",
};

const PARCOURS_TO_TRACK: Record<DemoParcours, DemoTrack> = {
  social: "A",
  web: "B",
  manuscript: "C",
};

const PAYWALL_ROUTE = "/onboarding/paywall-compare";

/**
 * Determines the next demo parcours route to navigate to, based on the
 * selected sources stored in the onboarding store. Falls through to the
 * paywall when there are no further parcours to play.
 *
 * Accepts both legacy parcours selections ("social"|"web"|"manuscript") and
 * the new track-based selections ("A"|"B"|"C").
 */
export function navigateNextDemo(
  router: Router,
  selected: (DemoParcours | DemoTrack)[],
  current?: DemoParcours | DemoTrack
) {
  const selectedTracks: DemoTrack[] = selected.map((s) =>
    s === "A" || s === "B" || s === "C" ? s : PARCOURS_TO_TRACK[s]
  );

  const currentTrack: DemoTrack | undefined = current
    ? current === "A" || current === "B" || current === "C"
      ? current
      : PARCOURS_TO_TRACK[current]
    : undefined;

  const currentIdx = currentTrack ? TRACK_ORDER.indexOf(currentTrack) : -1;
  const next = TRACK_ORDER.slice(currentIdx + 1).find((t) => selectedTracks.includes(t));
  const nextRoute = next ? FIRST_ROUTE_BY_TRACK[next] : undefined;

  if (nextRoute) {
    router.push(nextRoute as never);
    return;
  }
  router.push(PAYWALL_ROUTE as never);
}

export { FIRST_ROUTE, ORDER };
export default navigateNextDemo;
