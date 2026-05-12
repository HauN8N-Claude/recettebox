/**
 * Canonical onboarding step ordering.
 *
 * Single source of truth for the progress bar value shown by
 * `<OnboardingHeader progress={…} />`. Each screen calls `progressFor(id)`
 * with its own step id so the bar advances monotonically across the flow.
 *
 * Screens WITHOUT an OnboardingHeader (auto-advance loaders, celebration
 * screens, paywall) are not listed here — they intentionally hide the bar.
 *
 * The demo screens (X1 of each track) share a single id "demo-intro" so the
 * bar reaches its end at the start of the first demo, signalling "you've
 * finished the questions — enjoy the demo".
 */

export type OnboardingStepId =
  | "q4"
  | "q4b"
  | "q5"
  | "q11"
  | "q11b-profile"
  | "q5b-cooking-time"
  | "q6"
  | "q7"
  | "q8"
  | "q9-exclusions"
  | "q10"
  | "q10b-filters"
  | "qualif-sources"
  | "demo-intro";

const STEP_ORDER: OnboardingStepId[] = [
  "q4",
  "q4b",
  "q5",
  "q11",
  "q11b-profile",
  "q5b-cooking-time",
  "q6",
  "q7",
  "q8",
  "q9-exclusions",
  "q10",
  "q10b-filters",
  "qualif-sources",
  "demo-intro",
];

const TOTAL_STEPS = STEP_ORDER.length;

/**
 * Returns a value in [0, 1] suitable for `<OnboardingHeader progress={…} />`.
 * Monotonic across the canonical onboarding flow.
 */
export function progressFor(step: OnboardingStepId): number {
  const idx = STEP_ORDER.indexOf(step);
  if (idx === -1) return 0;
  return (idx + 1) / TOTAL_STEPS;
}

export { STEP_ORDER, TOTAL_STEPS };
