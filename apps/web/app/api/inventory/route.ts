import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateHousehold, jsonError, parseJson } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const household = await getOrCreateHousehold();
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location");
  const active = searchParams.get("active");

  const items = await prisma.inventoryItem.findMany({
    where: {
      householdId: household.id,
      location: location === "FRIDGE" || location === "PANTRY" ? location : undefined,
      isActive: active === null ? undefined : active === "true",
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const payload = await parseJson<{ name?: string; location?: "FRIDGE" | "PANTRY" }>(request);
  if (!payload?.name) {
    return jsonError("VALIDATION_ERROR", "Name is required.", 400);
  }

  const household = await getOrCreateHousehold();

  const item = await prisma.inventoryItem.create({
    data: {
      householdId: household.id,
      name: payload.name.trim(),
      location: payload.location ?? "PANTRY",
      isActive: true,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
