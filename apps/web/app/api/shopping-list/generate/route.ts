import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorizeIngredient, getOrCreateHousehold, getWeekStartUtc, jsonError, normalizeText } from "@/lib/api";

export const runtime = "nodejs";

function splitQuantity(line: string) {
  const tokens = line.trim().split(/\s+/);
  if (tokens.length === 0) {
    return { name: line, quantityText: null as string | null };
  }
  if (/^\d/.test(tokens[0])) {
    const quantityTokens = tokens.slice(0, Math.min(2, tokens.length));
    const nameTokens = tokens.slice(quantityTokens.length);
    return {
      name: nameTokens.join(" ") || line,
      quantityText: quantityTokens.join(" "),
    };
  }
  return { name: line, quantityText: null as string | null };
}

export async function POST() {
  const household = await getOrCreateHousehold();
  const weekStart = getWeekStartUtc(new Date());

  const weeklyPlan = await prisma.weeklyPlan.findFirst({
    where: { householdId: household.id, weekStart },
    include: { items: { include: { recipe: { include: { ingredients: true } } } } },
  });

  if (!weeklyPlan || weeklyPlan.items.length !== 3) {
    return jsonError("CONFLICT", "Weekly plan is incomplete.", 409);
  }

  const inventoryItems = await prisma.inventoryItem.findMany({
    where: { householdId: household.id, isActive: true },
    select: { name: true },
  });
  const inventoryNames = inventoryItems.map((item) => normalizeText(item.name));

  const grouped = new Map<string, { name: string; quantityText: string | null; category: string }>();

  for (const item of weeklyPlan.items) {
    for (const ingredient of item.recipe.ingredients) {
      const normalizedLine = normalizeText(ingredient.line);
      const inInventory = inventoryNames.some((name) => normalizedLine.includes(name));
      if (inInventory) {
        continue;
      }

      const { name, quantityText } = splitQuantity(ingredient.line);
      const key = normalizeText(name);
      const category = categorizeIngredient(ingredient.line);

      if (!grouped.has(key)) {
        grouped.set(key, { name, quantityText, category });
        continue;
      }

      const existing = grouped.get(key);
      if (existing && quantityText) {
        existing.quantityText = existing.quantityText
          ? `${existing.quantityText} + ${quantityText}`
          : quantityText;
      }
    }
  }

  const items = Array.from(grouped.values());

  const shoppingList = await prisma.$transaction(async (tx) => {
    await tx.shoppingListItem.deleteMany({ where: { weeklyPlanId: weeklyPlan.id } });

    if (items.length > 0) {
      await tx.shoppingListItem.createMany({
        data: items.map((item) => ({
          weeklyPlanId: weeklyPlan.id,
          name: item.name,
          category: item.category as "PRODUCE" | "DAIRY" | "MEAT_FISH" | "PANTRY" | "FROZEN" | "OTHER",
          quantityText: item.quantityText,
          isBought: false,
        })),
      });
    }

    return tx.shoppingListItem.findMany({
      where: { weeklyPlanId: weeklyPlan.id },
      orderBy: { category: "asc" },
    });
  });

  return NextResponse.json({
    shoppingList: {
      weeklyPlanId: weeklyPlan.id,
      items: shoppingList,
    },
  });
}
