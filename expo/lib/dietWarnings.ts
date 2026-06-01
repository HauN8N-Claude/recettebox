/**
 * Détection (heuristique, par mots-clés) des ingrédients d'une recette qui
 * pourraient ne PAS convenir aux restrictions de l'utilisateur :
 * allergies, régime alimentaire et exclusions personnelles.
 *
 * 100 % côté app — aucune donnée backend requise : on compare les noms des
 * ingrédients (déjà chargés avec la recette) aux restrictions stockées dans le
 * store onboarding local.
 *
 * ⚠️ Best-effort : la détection est volontairement simple (regex sur le nom).
 * Très fiable pour les allergies courantes et le lactose ; plus approximative
 * pour « sans gluten » et « vegan » (sources cachées). Côté UI, le bandeau
 * formule donc un « semble contenir », jamais une garantie.
 */

export type Restrictions = {
  /** Valeurs de `onboardingStore.allergies` (ex: "lactose", "oeufs"…). */
  allergies: string[];
  /** Valeurs de `onboardingStore.q8_restrictions` (ex: "vegan", "sans_gluten"…). */
  dietary: string[];
  /** Exclusions libres saisies par l'utilisateur (texte). */
  customExclusions: string[];
};

export type DietWarning = {
  /** Libellé du problème, inséré après « semble contenir » (ex: "du lactose"). */
  reason: string;
  /** Noms des ingrédients qui ont déclenché l'alerte. */
  ingredients: string[];
};

type Rule = { reason: string; test: RegExp };

/** Minuscule + ligature œ→oe + suppression des accents, pour matcher large. */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/œ/g, "oe")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const LACTOSE =
  /lait|creme|beurre|fromage|yaourt|parmesan|mozzarella|mascarpone|ricotta|chantilly|lactose|gruyere|emmental|cheddar|feta|raclette|comte|reblochon/;
const EGGS = /oeuf|meringue|mayonnaise/;
const MEAT_FISH =
  /viande|boeuf|poulet|porc|veau|agneau|jambon|lardon|bacon|saucisse|saucisson|steak|dinde|canard|gigot|merguez|chorizo|poisson|saumon|thon|cabillaud|crevette|crustace|fruits de mer|gelatine/;
const ANIMAL = new RegExp(`${MEAT_FISH.source}|${LACTOSE.source}|${EGGS.source}|miel`);
const GLUTEN =
  /\bble\b|farine|\bpain\b|\bpates?\b|semoule|chapelure|gluten|orge|seigle|biscuit|brioche|couscous|boulgour|epeautre|panure/;

const ALLERGY_RULES: Record<string, Rule> = {
  lactose: { reason: "du lactose", test: LACTOSE },
  oeufs: { reason: "des œufs", test: EGGS },
  "fruits-a-coque": {
    reason: "des fruits à coque",
    test: /noix|amande|noisette|cajou|pistache|pecan|macadamia|praline/,
  },
  arachides: { reason: "des arachides", test: /arachide|cacahuete/ },
  "poisson-crustaces": {
    reason: "du poisson ou des crustacés",
    test: /poisson|saumon|thon|cabillaud|crevette|crustace|moule|crabe|homard|gambas|anchois|sardine|maquereau|colin|merlu|fruits de mer/,
  },
  soja: { reason: "du soja", test: /soja|tofu|edamame|tamari|miso/ },
};

const DIET_RULES: Record<string, Rule> = {
  vegetarien: { reason: "de la viande ou du poisson", test: MEAT_FISH },
  vegan: { reason: "des produits d'origine animale", test: ANIMAL },
  sans_gluten: { reason: "du gluten", test: GLUTEN },
  sans_lactose: { reason: "du lactose", test: LACTOSE },
};

export function computeDietWarnings(
  ingredients: { name: string }[],
  restrictions: Restrictions,
): DietWarning[] {
  const normalized = ingredients.map((i) => ({
    raw: i.name,
    norm: normalize(i.name),
  }));

  // reason -> ensemble d'ingrédients déclencheurs (dédupliqués).
  const byReason = new Map<string, Set<string>>();

  const apply = (rule: Rule) => {
    for (const { raw, norm } of normalized) {
      if (rule.test.test(norm)) {
        const set = byReason.get(rule.reason) ?? new Set<string>();
        set.add(raw);
        byReason.set(rule.reason, set);
      }
    }
  };

  for (const a of restrictions.allergies ?? []) {
    if (a === "aucune") continue;
    const rule = ALLERGY_RULES[a];
    if (rule) apply(rule);
  }

  for (const d of restrictions.dietary ?? []) {
    const rule = DIET_RULES[d];
    if (rule) apply(rule);
  }

  for (const excRaw of restrictions.customExclusions ?? []) {
    const exc = normalize(excRaw.trim());
    if (exc.length < 2) continue;
    for (const { raw, norm } of normalized) {
      if (norm.includes(exc)) {
        const reason = excRaw.trim();
        const set = byReason.get(reason) ?? new Set<string>();
        set.add(raw);
        byReason.set(reason, set);
      }
    }
  }

  return Array.from(byReason.entries()).map(([reason, set]) => ({
    reason,
    ingredients: Array.from(set),
  }));
}
