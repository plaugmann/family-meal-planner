import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const household = await prisma.household.create({
    data: {
      name: "Family Household",
      accessCode: "1234",
      familyFriendlyDefault: true,
      minimizeWasteDefault: true,
    },
  });

  await prisma.user.create({
    data: {
      householdId: household.id,
      name: "Primary User",
      email: "family@example.com",
    },
  });

  await prisma.whitelistSite.createMany({
    data: [
      { householdId: household.id, domain: "smittenkitchen.com", name: "Smitten Kitchen", isActive: true },
      { householdId: household.id, domain: "valdemarsro.dk", name: "Valdemarsro", isActive: true },
    ],
  });

  const recipeOne = await prisma.recipe.create({
    data: {
      householdId: household.id,
      title: "Spaghetti and Meatballs",
      imageUrl: "https://smittenkitchen.com/images/spaghetti.jpg",
      sourceUrl: "https://smittenkitchen.com/spaghetti-and-meatballs",
      sourceDomain: "smittenkitchen.com",
      servings: 4,
      isFavorite: true,
      isFamilyFriendly: true,
      ingredients: {
        create: [
          { position: 1, line: "400 g spaghetti" },
          { position: 2, line: "500 g ground beef" },
          { position: 3, line: "1 jar tomato sauce" },
        ],
      },
      steps: {
        create: [
          { position: 1, text: "Boil the spaghetti." },
          { position: 2, text: "Cook the meatballs." },
          { position: 3, text: "Simmer in tomato sauce." },
        ],
      },
    },
  });

  const recipeTwo = await prisma.recipe.create({
    data: {
      householdId: household.id,
      title: "Chicken Taco Bowls",
      imageUrl: "https://valdemarsro.dk/images/taco-bowl.jpg",
      sourceUrl: "https://valdemarsro.dk/chicken-taco-bowls",
      sourceDomain: "valdemarsro.dk",
      servings: 4,
      isFavorite: false,
      isFamilyFriendly: true,
      ingredients: {
        create: [
          { position: 1, line: "2 chicken breasts" },
          { position: 2, line: "1 cup rice" },
          { position: 3, line: "1 can black beans" },
        ],
      },
      steps: {
        create: [
          { position: 1, text: "Cook the rice." },
          { position: 2, text: "Season and cook chicken." },
          { position: 3, text: "Assemble bowls." },
        ],
      },
    },
  });

  const recipeThree = await prisma.recipe.create({
    data: {
      householdId: household.id,
      title: "Veggie Stir Fry",
      imageUrl: "https://valdemarsro.dk/images/veggie-stir-fry.jpg",
      sourceUrl: "https://valdemarsro.dk/veggie-stir-fry",
      sourceDomain: "valdemarsro.dk",
      servings: 4,
      isFavorite: false,
      isFamilyFriendly: true,
      ingredients: {
        create: [
          { position: 1, line: "1 head broccoli" },
          { position: 2, line: "2 carrots" },
          { position: 3, line: "1 bell pepper" },
        ],
      },
      steps: {
        create: [
          { position: 1, text: "Chop vegetables." },
          { position: 2, text: "Stir fry until tender." },
        ],
      },
    },
  });

  const weeklyPlan = await prisma.weeklyPlan.create({
    data: {
      householdId: household.id,
      weekStart: new Date("2026-01-19T00:00:00.000Z"),
      items: {
        create: [
          { recipeId: recipeOne.id, servings: 4 },
          { recipeId: recipeTwo.id, servings: 4 },
          { recipeId: recipeThree.id, servings: 4 },
        ],
      },
    },
  });

  await prisma.inventoryItem.createMany({
    data: [
      { householdId: household.id, name: "olive oil", location: "PANTRY", isActive: true },
      { householdId: household.id, name: "salt", location: "PANTRY", isActive: true },
    ],
  });

  await prisma.shoppingListItem.createMany({
    data: [
      {
        weeklyPlanId: weeklyPlan.id,
        name: "spaghetti",
        category: "PANTRY",
        quantityText: "1 pack",
        isBought: false,
      },
      {
        weeklyPlanId: weeklyPlan.id,
        name: "ground beef",
        category: "MEAT_FISH",
        quantityText: "500 g",
        isBought: false,
      },
    ],
  });
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
