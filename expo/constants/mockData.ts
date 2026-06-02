import type { ImageSourcePropType } from "react-native";

export type RecipeSource = "instagram" | "tiktok" | "pinterest" | "web" | "manual";

export type Recipe = {
  id: string;
  title: string;
  source: RecipeSource;
  sourceAuthor?: string;
  imageUrl: string;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: "facile" | "moyen" | "expert";
  tags: string[];
  ingredients: { name: string; quantity: string }[];
  steps: string[];
  importedAt: string;
  cookedCount: number;
  isFavorite: boolean;
};

export const currentUser = {
  firstName: "Camille",
  householdSize: 3,
  restrictions: ["sans lactose"],
  topGoal: "cuisiner vraiment ce que je sauve",
  startDate: "2026-04-26",
  isPremium: false,
  stats: {
    cookedCount: 12,
    savedAmount: 23,
    cuisinesExplored: 4,
  },
} as const;

export const recipes: Recipe[] = [
  {
    id: "r1",
    title: "Tian de courgettes",
    source: "manual",
    imageUrl:
      "https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?w=800&q=80",
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 35,
    difficulty: "facile",
    tags: ["sans lactose", "anti-gaspi", "végétarien"],
    ingredients: [
      { name: "Courgettes", quantity: "3 moyennes" },
      { name: "Tomates", quantity: "4" },
      { name: "Oignon", quantity: "1" },
      { name: "Huile d'olive", quantity: "3 c. à s." },
      { name: "Thym frais", quantity: "1 branche" },
    ],
    steps: [
      "Préchauffe ton four à 180°C.",
      "Coupe les légumes en fines rondelles régulières.",
      "Dispose-les en alternance dans un plat huilé.",
      "Arrose d'huile d'olive, parsème de thym, sale et poivre.",
      "Enfourne 35 minutes jusqu'à coloration dorée.",
    ],
    importedAt: "2026-05-06",
    cookedCount: 2,
    isFavorite: true,
  },
  {
    id: "r2",
    title: "Pâtes à la truffe et parmesan",
    source: "instagram",
    sourceAuthor: "@marlene.cooks",
    imageUrl:
      "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80",
    servings: 2,
    prepTimeMinutes: 5,
    cookTimeMinutes: 12,
    difficulty: "facile",
    tags: ["pâtes", "rapide"],
    ingredients: [
      { name: "Tagliatelles", quantity: "200 g" },
      { name: "Huile de truffe", quantity: "2 c. à s." },
      { name: "Parmesan", quantity: "60 g" },
      { name: "Beurre", quantity: "30 g" },
    ],
    steps: [
      "Cuis les pâtes al dente dans une eau bien salée.",
      "Fais fondre le beurre avec l'huile de truffe.",
      "Égoutte les pâtes en gardant un peu d'eau de cuisson.",
      "Mélange tout, ajoute le parmesan râpé.",
    ],
    importedAt: "2026-05-05",
    cookedCount: 1,
    isFavorite: true,
  },
  {
    id: "r3",
    title: "Risotto aux champignons",
    source: "pinterest",
    sourceAuthor: "Cuisine d'automne",
    imageUrl:
      "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&q=80",
    servings: 4,
    prepTimeMinutes: 10,
    cookTimeMinutes: 30,
    difficulty: "moyen",
    tags: ["réconfortant", "végétarien"],
    ingredients: [
      { name: "Riz arborio", quantity: "300 g" },
      { name: "Champignons de Paris", quantity: "400 g" },
      { name: "Bouillon de légumes", quantity: "1 L" },
      { name: "Échalote", quantity: "1" },
      { name: "Vin blanc sec", quantity: "100 ml" },
    ],
    steps: [
      "Fais revenir l'échalote ciselée à l'huile.",
      "Ajoute le riz et nacre-le 2 minutes.",
      "Déglace au vin blanc.",
      "Verse le bouillon louche par louche, en remuant.",
      "Ajoute les champignons sautés en fin de cuisson.",
    ],
    importedAt: "2026-05-04",
    cookedCount: 0,
    isFavorite: false,
  },
  {
    id: "r4",
    title: "Bœuf bourguignon",
    source: "web",
    sourceAuthor: "marmiton.org",
    imageUrl:
      "https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=800&q=80",
    servings: 6,
    prepTimeMinutes: 25,
    cookTimeMinutes: 180,
    difficulty: "moyen",
    tags: ["mijoté", "classique"],
    ingredients: [
      { name: "Bœuf à mijoter", quantity: "1,2 kg" },
      { name: "Lardons", quantity: "200 g" },
      { name: "Carottes", quantity: "4" },
      { name: "Vin rouge", quantity: "75 cl" },
      { name: "Bouquet garni", quantity: "1" },
    ],
    steps: [
      "Fais dorer les morceaux de bœuf dans une cocotte.",
      "Ajoute lardons, oignons et carottes.",
      "Mouille au vin rouge, ajoute le bouquet garni.",
      "Laisse mijoter 3 heures à feu doux.",
    ],
    importedAt: "2026-05-03",
    cookedCount: 1,
    isFavorite: false,
  },
  {
    id: "r5",
    title: "Pad thaï aux crevettes",
    source: "tiktok",
    sourceAuthor: "@thai.kitchen",
    imageUrl:
      "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80",
    servings: 2,
    prepTimeMinutes: 15,
    cookTimeMinutes: 10,
    difficulty: "moyen",
    tags: ["asiatique", "rapide"],
    ingredients: [
      { name: "Nouilles de riz", quantity: "200 g" },
      { name: "Crevettes", quantity: "250 g" },
      { name: "Œufs", quantity: "2" },
      { name: "Sauce nuoc-mâm", quantity: "3 c. à s." },
      { name: "Cacahuètes", quantity: "50 g" },
    ],
    steps: [
      "Fais tremper les nouilles 10 minutes.",
      "Saute les crevettes au wok.",
      "Ajoute les œufs battus, puis les nouilles.",
      "Assaisonne et termine avec cacahuètes et coriandre.",
    ],
    importedAt: "2026-05-02",
    cookedCount: 0,
    isFavorite: true,
  },
  {
    id: "r6",
    title: "Tarte tatin",
    source: "manual",
    imageUrl:
      "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=800&q=80",
    servings: 6,
    prepTimeMinutes: 20,
    cookTimeMinutes: 40,
    difficulty: "moyen",
    tags: ["dessert", "classique"],
    ingredients: [
      { name: "Pommes", quantity: "6" },
      { name: "Sucre", quantity: "150 g" },
      { name: "Beurre", quantity: "80 g" },
      { name: "Pâte brisée", quantity: "1 rouleau" },
    ],
    steps: [
      "Fais un caramel à sec dans un moule.",
      "Dispose les pommes coupées en quartiers.",
      "Couvre avec la pâte, rentre les bords.",
      "Cuis 40 minutes à 180°C, puis retourne.",
    ],
    importedAt: "2026-05-01",
    cookedCount: 1,
    isFavorite: false,
  },
  {
    id: "r7",
    title: "Crumble pommes-cannelle",
    source: "instagram",
    sourceAuthor: "@maison.douce",
    imageUrl:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80",
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    difficulty: "facile",
    tags: ["dessert", "anti-gaspi"],
    ingredients: [
      { name: "Pommes", quantity: "5" },
      { name: "Farine", quantity: "150 g" },
      { name: "Beurre", quantity: "100 g" },
      { name: "Cassonade", quantity: "100 g" },
      { name: "Cannelle", quantity: "1 c. à c." },
    ],
    steps: [
      "Coupe les pommes en cubes, dépose dans un plat.",
      "Sable farine, beurre et sucre du bout des doigts.",
      "Recouvre les pommes, parsème de cannelle.",
      "Cuis 30 minutes à 180°C.",
    ],
    importedAt: "2026-04-29",
    cookedCount: 2,
    isFavorite: true,
  },
  {
    id: "r8",
    title: "Quiche lorraine",
    source: "web",
    sourceAuthor: "750g.com",
    imageUrl:
      "https://images.unsplash.com/photo-1591985666643-1ecc67616216?w=800&q=80",
    servings: 6,
    prepTimeMinutes: 15,
    cookTimeMinutes: 35,
    difficulty: "facile",
    tags: ["classique", "salé"],
    ingredients: [
      { name: "Pâte brisée", quantity: "1" },
      { name: "Lardons fumés", quantity: "200 g" },
      { name: "Œufs", quantity: "3" },
      { name: "Crème fraîche", quantity: "20 cl" },
      { name: "Lait", quantity: "20 cl" },
    ],
    steps: [
      "Étale la pâte dans un moule.",
      "Fais revenir les lardons sans matière grasse.",
      "Bats œufs, crème, lait, muscade.",
      "Verse sur les lardons et cuis 35 minutes.",
    ],
    importedAt: "2026-04-28",
    cookedCount: 0,
    isFavorite: false,
  },
  {
    id: "r9",
    title: "Houmous maison",
    source: "manual",
    imageUrl:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80",
    servings: 4,
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    difficulty: "facile",
    tags: ["sans lactose", "végétarien", "apéro"],
    ingredients: [
      { name: "Pois chiches cuits", quantity: "400 g" },
      { name: "Tahini", quantity: "2 c. à s." },
      { name: "Citron", quantity: "1" },
      { name: "Ail", quantity: "1 gousse" },
      { name: "Huile d'olive", quantity: "3 c. à s." },
    ],
    steps: [
      "Mixe pois chiches, tahini, jus de citron et ail.",
      "Ajoute l'huile en filet jusqu'à texture lisse.",
      "Sale, poivre, et termine avec un trait d'huile.",
    ],
    importedAt: "2026-04-27",
    cookedCount: 3,
    isFavorite: true,
  },
  {
    id: "r10",
    title: "Salade César",
    source: "pinterest",
    sourceAuthor: "Bistrot",
    imageUrl:
      "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&q=80",
    servings: 2,
    prepTimeMinutes: 15,
    cookTimeMinutes: 15,
    difficulty: "facile",
    tags: ["salade", "rapide"],
    ingredients: [
      { name: "Romaine", quantity: "1" },
      { name: "Blanc de poulet", quantity: "2" },
      { name: "Parmesan", quantity: "60 g" },
      { name: "Croûtons", quantity: "100 g" },
      { name: "Sauce César", quantity: "4 c. à s." },
    ],
    steps: [
      "Cuis le poulet à la poêle, coupe en lamelles.",
      "Lave et coupe la romaine.",
      "Dresse, ajoute croûtons, parmesan, sauce.",
    ],
    importedAt: "2026-04-26",
    cookedCount: 1,
    isFavorite: false,
  },
  {
    id: "r11",
    title: "Pesto rouge maison",
    source: "instagram",
    sourceAuthor: "@cuisine.italia",
    imageUrl:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80",
    servings: 4,
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    difficulty: "facile",
    tags: ["sans lactose", "anti-gaspi", "rapide"],
    ingredients: [
      { name: "Tomates séchées", quantity: "150 g" },
      { name: "Pignons", quantity: "50 g" },
      { name: "Basilic frais", quantity: "1 bouquet" },
      { name: "Ail", quantity: "1 gousse" },
      { name: "Huile d'olive", quantity: "10 cl" },
    ],
    steps: [
      "Mixe tomates, pignons, basilic et ail.",
      "Ajoute l'huile en filet, ajuste l'assaisonnement.",
      "Garde au frais dans un bocal hermétique.",
    ],
    importedAt: "2026-04-25",
    cookedCount: 0,
    isFavorite: false,
  },
  {
    id: "r12",
    title: "Soupe miso",
    source: "tiktok",
    sourceAuthor: "@tokyo.bites",
    imageUrl:
      "https://images.unsplash.com/photo-1607301405390-d831c242f59b?w=800&q=80",
    servings: 2,
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    difficulty: "facile",
    tags: ["sans lactose", "asiatique", "léger"],
    ingredients: [
      { name: "Pâte de miso", quantity: "2 c. à s." },
      { name: "Tofu soyeux", quantity: "150 g" },
      { name: "Algues wakame", quantity: "1 c. à s." },
      { name: "Oignons nouveaux", quantity: "2" },
      { name: "Bouillon dashi", quantity: "60 cl" },
    ],
    steps: [
      "Chauffe le bouillon dashi sans le faire bouillir.",
      "Délaye le miso dans un peu de bouillon, ajoute.",
      "Ajoute le tofu en cubes et le wakame réhydraté.",
      "Termine avec les oignons nouveaux.",
    ],
    importedAt: "2026-04-24",
    cookedCount: 1,
    isFavorite: true,
  },
];

export type DemoIngredientColor = "miel" | "sauge" | "cacao" | "terracotta";

export type DemoIngredient = {
  color: DemoIngredientColor;
  text: string;
};

export type DemoRecipe = {
  name: string;
  nameStyle?: "handwritten";
  source: string;
  portions: number;
  badge?: string;
  badgeColor?: "encre" | "sauge" | "miel";
  badgeIcon?: "check";
  image: ImageSourcePropType | string;
  fallback?: { emoji: string; gradient: [string, string] };
  ingredients: DemoIngredient[];
};

export const demoRecipes: Record<"risotto" | "tarteFigues" | "blanquette", DemoRecipe> = {
  risotto: {
    name: "Risotto crémeux\naux champignons",
    source: "@marlene.cooks · Instagram",
    portions: 4,
    // Photo du plat recadrée depuis A1-instagram-post.png (le screenshot complet
    // affichait la barre d'état + l'en-tête IG via cover sur la carte recette).
    image: require("../assets/demo/A1-risotto-food.png") as ImageSourcePropType,
    fallback: { emoji: "🍚", gradient: ["#C8654A", "#6B4423"] },
    ingredients: [
      { color: "miel", text: "320g de riz arborio" },
      { color: "sauge", text: "500g de champignons mélangés" },
      { color: "cacao", text: "100g de parmesan râpé" },
      { color: "terracotta", text: "15cl de vin blanc sec" },
    ],
  },
  tarteFigues: {
    name: "Tarte fine aux\nfigues et chèvre",
    source: "marmiton.org",
    portions: 4,
    badge: "Sans pubs",
    badgeColor: "sauge",
    badgeIcon: "check",
    // Photo du plat recadrée depuis B1-safari-marmiton.png (le screenshot
    // complet affichait la barre d'URL Safari via cover sur la carte recette).
    image: require("../assets/demo/B1-tarte-food.png") as ImageSourcePropType,
    ingredients: [
      { color: "miel", text: "1 pâte feuilletée" },
      { color: "terracotta", text: "8 figues fraîches mûres" },
      { color: "sauge", text: "150g de chèvre frais" },
      { color: "cacao", text: "2 c. à soupe de miel" },
    ],
  },
  blanquette: {
    name: "Blanquette de\nVeau de Mémé",
    nameStyle: "handwritten",
    source: "Carnet familial · 1987",
    portions: 6,
    badge: "Manuscrit",
    badgeColor: "miel",
    badgeIcon: "check",
    // Carnet manuscrit recadré depuis C1-camera-manuscrit.png (le screenshot
    // complet affichait l'UI caméra via cover sur la carte recette).
    image: require("../assets/demo/C1-manuscrit-photo.png") as ImageSourcePropType,
    fallback: { emoji: "🍲", gradient: ["#E8B86A", "#5C4A3A"] },
    ingredients: [
      { color: "cacao", text: "800g d'épaule de veau" },
      { color: "sauge", text: "2 carottes, 1 poireau" },
      { color: "miel", text: "200g de champignons" },
      { color: "terracotta", text: "20cl de crème fraîche" },
    ],
  },
};

export const suggestedRecipe = recipes[0];

export const recentlyImported = recipes.slice(1, 5);
