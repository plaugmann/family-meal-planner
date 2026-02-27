export type WeeklyPlanRecipe = {
  id: string;
  title: string;
  imageUrl: string | null;
  sourceUrl: string;
  servings: number;
  ingredients: string[];
  directions: string[];
  position: number;
};

export type WeeklyPlan = {
  id: string;
  weekStart: string;
  recipes: WeeklyPlanRecipe[];
};

export type ShoppingListItem = {
  id: string;
  weeklyPlanId: string;
  name: string;
  quantity: string | null;
  isChecked: boolean;
};

export type ParsedRecipe = {
  title: string;
  servings: number;
  imageUrl: string | null;
  ingredients: string[];
  directions: string[];
  sourceUrl: string;
};
