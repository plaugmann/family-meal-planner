-- Drop foreign keys first
ALTER TABLE "WeeklyPlanItem" DROP CONSTRAINT IF EXISTS "WeeklyPlanItem_weeklyPlanId_fkey";
ALTER TABLE "WeeklyPlanItem" DROP CONSTRAINT IF EXISTS "WeeklyPlanItem_recipeId_fkey";
ALTER TABLE "ShoppingListItem" DROP CONSTRAINT IF EXISTS "ShoppingListItem_weeklyPlanId_fkey";
ALTER TABLE "RecipeIngredient" DROP CONSTRAINT IF EXISTS "RecipeIngredient_recipeId_fkey";
ALTER TABLE "RecipeStep" DROP CONSTRAINT IF EXISTS "RecipeStep_recipeId_fkey";
ALTER TABLE "Recipe" DROP CONSTRAINT IF EXISTS "Recipe_householdId_fkey";
ALTER TABLE "WhitelistSite" DROP CONSTRAINT IF EXISTS "WhitelistSite_householdId_fkey";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_householdId_fkey";
ALTER TABLE "InventoryItem" DROP CONSTRAINT IF EXISTS "InventoryItem_householdId_fkey";
ALTER TABLE "WeeklyPlan" DROP CONSTRAINT IF EXISTS "WeeklyPlan_householdId_fkey";
ALTER TABLE "HouseholdSession" DROP CONSTRAINT IF EXISTS "HouseholdSession_householdId_fkey";

-- Drop old tables
DROP TABLE IF EXISTS "WeeklyPlanItem";
DROP TABLE IF EXISTS "RecipeIngredient";
DROP TABLE IF EXISTS "RecipeStep";
DROP TABLE IF EXISTS "Recipe";
DROP TABLE IF EXISTS "WhitelistSite";
DROP TABLE IF EXISTS "User";
DROP TABLE IF EXISTS "InventoryItem";
DROP TABLE IF EXISTS "HouseholdSession";
DROP TABLE IF EXISTS "Household";
DROP TABLE IF EXISTS "ShoppingListItem";

-- Drop old enums
DROP TYPE IF EXISTS "InventoryLocation";
DROP TYPE IF EXISTS "ShoppingCategory";

-- Recreate WeeklyPlan (drop and recreate to remove householdId)
DROP TABLE IF EXISTS "WeeklyPlan";

CREATE TABLE "WeeklyPlan" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WeeklyPlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WeeklyPlan_weekStart_key" ON "WeeklyPlan"("weekStart");

-- Create WeeklyPlanRecipe
CREATE TABLE "WeeklyPlanRecipe" (
    "id" TEXT NOT NULL,
    "weeklyPlanId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "servings" INTEGER NOT NULL DEFAULT 4,
    "ingredients" TEXT NOT NULL,
    "directions" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WeeklyPlanRecipe_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WeeklyPlanRecipe_weeklyPlanId_idx" ON "WeeklyPlanRecipe"("weeklyPlanId");

ALTER TABLE "WeeklyPlanRecipe" ADD CONSTRAINT "WeeklyPlanRecipe_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "WeeklyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create new ShoppingListItem
CREATE TABLE "ShoppingListItem" (
    "id" TEXT NOT NULL,
    "weeklyPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" TEXT,
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ShoppingListItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ShoppingListItem_weeklyPlanId_idx" ON "ShoppingListItem"("weeklyPlanId");

ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "WeeklyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
