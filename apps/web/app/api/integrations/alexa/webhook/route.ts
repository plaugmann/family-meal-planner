import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { requireHousehold } from "@/lib/auth";
import { getWeekStartUtc } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const household = await requireHousehold();
  if (!household) {
    return jsonError("NOT_ALLOWED", "Authentication required.", 401);
  }

  const weekStart = getWeekStartUtc(new Date());
  const weeklyPlan = await prisma.weeklyPlan.findFirst({
    where: { householdId: household.id, weekStart },
    include: { shoppingListItems: { where: { isBought: false } } },
  });

  if (!weeklyPlan) {
    return NextResponse.json({ items: [] });
  }

  // Return items in a format suitable for Zapier/Alexa
  const items = weeklyPlan.shoppingListItems.map((item) => ({
    name: item.name,
    quantity: item.quantityText || "",
  }));

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const household = await requireHousehold();
  if (!household) {
    return jsonError("NOT_ALLOWED", "Authentication required.", 401);
  }

  const weekStart = getWeekStartUtc(new Date());
  const weeklyPlan = await prisma.weeklyPlan.findFirst({
    where: { householdId: household.id, weekStart },
    include: { shoppingListItems: { where: { isBought: false } } },
  });

  if (!weeklyPlan) {
    return NextResponse.json({ success: false, message: "No shopping list found" });
  }

  // Return items as an array of strings for easier Zapier integration
  const items = weeklyPlan.shoppingListItems.map((item) => 
    item.quantityText ? `${item.name} (${item.quantityText})` : item.name
  );

  return NextResponse.json({ 
    success: true,
    items,
    count: items.length 
  });
}
