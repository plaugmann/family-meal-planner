export type Recipe = {
  id: string;
  householdId?: string;
  title: string;
  imageUrl?: string | null;
  sourceUrl?: string;
  sourceDomain?: string;
  servings: number;
  isFavorite: boolean;
  isFamilyFriendly: boolean;
  needsReview?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type RecipeDetail = Recipe & {
  ingredients: { id: string; position: number; line: string }[];
  steps: string[];
};

export type WeeklyPlanItem = {
  id: string;
  weeklyPlanId: string;
  recipeId: string;
  servings: number;
};

export type WeeklyPlan = {
  id: string;
  householdId: string;
  weekStart: string;
  items: WeeklyPlanItem[];
};

export type ShoppingListItem = {
  id: string;
  weeklyPlanId: string;
  name: string;
  category: "PRODUCE" | "DAIRY" | "MEAT_FISH" | "PANTRY" | "FROZEN" | "OTHER";
  quantityText: string | null;
  isBought: boolean;
};

export type InventoryItem = {
  id: string;
  householdId: string;
  name: string;
  location: "FRIDGE" | "PANTRY";
  isActive: boolean;
};

export type WhitelistSite = {
  id: string;
  domain: string;
  name: string | null;
  isActive: boolean;
};
