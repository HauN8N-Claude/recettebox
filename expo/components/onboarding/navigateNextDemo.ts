import type { Router } from "expo-router";

export type DemoParcours = "social" | "web" | "manuscript";
export type DemoTrack = "A" | "B" | "C";

const ORDER: DemoParcours[] = ["social", "web", "manuscript"];
const TRACK_ORDER: DemoTrack[] = ["A", "B", "C"];

const FIRST_ROUTE: Record<DemoParcours, string> = {
  social: "/onboarding/demo-a1",
  web: "/onboarding/demo-b1",
  manuscript: "/onboarding/demo-c1",
};

const FIRST_ROUTE_BY_TRACK: Record<DemoTrack, string> = {
  A: "/onboarding/demo-a1",
  B: "/onboarding/demo-b1",
  C: "/onboarding/demo-c1",
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

  if (next) {
    router.push(FIRST_ROUTE_BY_TRACK[next] as never);
    return;
  }
  router.push(PAYWALL_ROUTE as never);
}

export { FIRST_ROUTE, ORDER };
export default navigateNextDemo;
