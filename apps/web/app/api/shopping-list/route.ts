import { NextResponse } from "next/server";
import { jsonError, parseJson, getWeekStartUtc } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const weekStart = getWeekStartUtc(new Date());

  const plan = await prisma.weeklyPlan.findUnique({
    where: { weekStart },
    include: { shoppingListItems: { orderBy: { createdAt: "asc" } } },
  });

  if (!plan) {
    return NextResponse.json({ items: [] });
  }

  return NextResponse.json({
    weeklyPlanId: plan.id,
    items: plan.shoppingListItems,
  });
}

export async function PUT(request: Request) {
  const payload = await parseJson<{ weeklyPlanId: string; items: { name: string; quantity?: string }[] }>(request);
  if (!payload?.weeklyPlanId || !Array.isArray(payload.items)) {
    return jsonError("VALIDATION_ERROR", "weeklyPlanId and items array required.", 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.shoppingListItem.deleteMany({ where: { weeklyPlanId: payload.weeklyPlanId } });
    if (payload.items.length > 0) {
      await tx.shoppingListItem.createMany({
        data: payload.items.map((item) => ({
          weeklyPlanId: payload.weeklyPlanId,
          name: item.name,
          quantity: item.quantity ?? null,
        })),
      });
    }
  });

  const items = await prisma.shoppingListItem.findMany({
    where: { weeklyPlanId: payload.weeklyPlanId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ weeklyPlanId: payload.weeklyPlanId, items });
}
