import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, parseJson } from "@/lib/api";
import { requireHousehold } from "@/lib/auth";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const household = await requireHousehold();
  if (!household) {
    return jsonError("NOT_ALLOWED", "Authentication required.", 401);
  }
  const payload = await parseJson<{
    isBought?: boolean;
    name?: string;
    quantityText?: string | null;
    category?: "PRODUCE" | "DAIRY" | "MEAT_FISH" | "PANTRY" | "FROZEN" | "OTHER";
  }>(request);

  if (!payload) {
    return jsonError("VALIDATION_ERROR", "Invalid JSON body.", 400);
  }

  const item = await prisma.shoppingListItem.findFirst({
    where: { id: params.id, weeklyPlan: { householdId: household.id } },
  });
  if (!item) {
    return jsonError("NOT_FOUND", "Shopping list item not found.", 404);
  }

  const updated = await prisma.shoppingListItem.update({
    where: { id: item.id },
    data: {
      isBought: payload.isBought ?? undefined,
      name: payload.name?.trim() ?? undefined,
      quantityText: payload.quantityText ?? undefined,
      category: payload.category ?? undefined,
    },
  });

  if (payload.isBought === true) {
    await prisma.inventoryItem.upsert({
      where: {
        householdId_name_location: {
          householdId: household.id,
          name: updated.name,
          location: "PANTRY",
        },
      },
      update: { isActive: true },
      create: {
        householdId: household.id,
        name: updated.name,
        location: "PANTRY",
        isActive: true,
      },
    });
  }

  return NextResponse.json({ item: updated });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const household = await requireHousehold();
  if (!household) {
    return jsonError("NOT_ALLOWED", "Authentication required.", 401);
  }

  const item = await prisma.shoppingListItem.findFirst({
    where: { id: params.id, weeklyPlan: { householdId: household.id } },
  });
  if (!item) {
    return jsonError("NOT_FOUND", "Shopping list item not found.", 404);
  }

  await prisma.shoppingListItem.delete({
    where: { id: item.id },
  });

  return NextResponse.json({ success: true });
}
