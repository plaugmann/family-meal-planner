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
  const payload = await parseJson<{ name?: string; location?: "FRIDGE" | "PANTRY"; isActive?: boolean }>(request);
  if (!payload) {
    return jsonError("VALIDATION_ERROR", "Invalid JSON body.", 400);
  }

  const item = await prisma.inventoryItem.findFirst({
    where: { id: params.id, householdId: household.id },
  });
  if (!item) {
    return jsonError("NOT_FOUND", "Inventory item not found.", 404);
  }

  const updated = await prisma.inventoryItem.update({
    where: { id: item.id },
    data: {
      name: payload.name?.trim() ?? undefined,
      location: payload.location ?? undefined,
      isActive: payload.isActive ?? undefined,
    },
  });

  return NextResponse.json({ item: updated });
}
