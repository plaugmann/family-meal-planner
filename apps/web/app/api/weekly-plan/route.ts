import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateHousehold, getWeekStartUtc, jsonError, parseJson } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const household = await getOrCreateHousehold();
  const weekStart = getWeekStartUtc(new Date());

  const weeklyPlan = await prisma.weeklyPlan.findFirst({
    where: { householdId: household.id, weekStart },
    include: { items: true },
  });

  return NextResponse.json({ weeklyPlan });
}

export async function PUT(request: Request) {
  const payload = await parseJson<{
    weekStart?: string;
    items?: { recipeId: string; servings?: number }[];
  }>(request);

  if (!payload?.weekStart || !payload.items) {
    return jsonError("VALIDATION_ERROR", "weekStart and items are required.", 400);
  }

  const items = payload.items;

  if (items.length !== 3) {
    return jsonError("VALIDATION_ERROR", "Exactly 3 items are required.", 400);
  }

  const uniqueRecipeIds = new Set(items.map((item) => item.recipeId));
  if (uniqueRecipeIds.size !== 3) {
    return jsonError("VALIDATION_ERROR", "Recipes must be unique.", 400);
  }

  const household = await getOrCreateHousehold();
  const weekStart = new Date(payload.weekStart);
  if (Number.isNaN(weekStart.getTime())) {
    return jsonError("VALIDATION_ERROR", "weekStart must be a valid ISO date.", 400);
  }

  const recipes = await prisma.recipe.findMany({
    where: { householdId: household.id, id: { in: Array.from(uniqueRecipeIds) } },
  });

  if (recipes.length !== 3) {
    return jsonError("NOT_FOUND", "One or more recipes not found.", 404);
  }

  const weeklyPlan = await prisma.$transaction(async (tx) => {
    const plan = await tx.weeklyPlan.upsert({
      where: { householdId_weekStart: { householdId: household.id, weekStart } },
      update: {},
      create: { householdId: household.id, weekStart },
    });

    await tx.weeklyPlanItem.deleteMany({ where: { weeklyPlanId: plan.id } });
      await tx.weeklyPlanItem.createMany({
        data: items.map((item) => ({
          weeklyPlanId: plan.id,
          recipeId: item.recipeId,
          servings: item.servings ?? 4,
        })),
      });

    return tx.weeklyPlan.findUnique({
      where: { id: plan.id },
      include: { items: true },
    });
  });

  return NextResponse.json({ weeklyPlan });
}
