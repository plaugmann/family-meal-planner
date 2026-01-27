import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { requireHousehold } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const household = await requireHousehold();
  if (!household) {
    return jsonError("NOT_ALLOWED", "Authentication required.", 401);
  }
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const favorites = searchParams.get("favorites");
  const familyFriendly = searchParams.get("familyFriendly");
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");
  const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 100) : 20;
  const offset = offsetParam ? Math.max(Number(offsetParam), 0) : 0;

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

  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.recipe.count({ where }),
  ]);

  return NextResponse.json({ recipes, total, limit, offset });
}
