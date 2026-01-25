import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateHousehold } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const household = await getOrCreateHousehold();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const favorites = searchParams.get("favorites");
  const familyFriendly = searchParams.get("familyFriendly");

  const where: { householdId: string; isFavorite?: boolean; isFamilyFriendly?: boolean; title?: { contains: string; mode: "insensitive" } } = {
    householdId: household.id,
  };

  if (q) {
    where.title = { contains: q, mode: "insensitive" };
  }
  if (favorites !== null) {
    where.isFavorite = favorites === "true";
  }
  if (familyFriendly !== null) {
    where.isFamilyFriendly = familyFriendly === "true";
  }

  const recipes = await prisma.recipe.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ recipes });
}
