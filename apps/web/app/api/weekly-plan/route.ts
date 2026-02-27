import { NextResponse } from "next/server";
import { jsonError, parseJson, getWeekStartUtc } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const weekStart = getWeekStartUtc(new Date());

  const plan = await prisma.weeklyPlan.findUnique({
    where: { weekStart },
    include: {
      recipes: { orderBy: { position: "asc" } },
    },
  });

  if (!plan) {
    return NextResponse.json({ weeklyPlan: null });
  }

  return NextResponse.json({
    weeklyPlan: {
      id: plan.id,
      weekStart: plan.weekStart.toISOString(),
      recipes: plan.recipes.map((r) => ({
        id: r.id,
        title: r.title,
        imageUrl: r.imageUrl,
        sourceUrl: r.sourceUrl,
        servings: r.servings,
        ingredients: JSON.parse(r.ingredients),
        directions: JSON.parse(r.directions),
        position: r.position,
      })),
    },
  });
}

type RecipeInput = {
  title: string;
  imageUrl?: string | null;
  sourceUrl: string;
  servings?: number;
  ingredients: string[];
  directions: string[];
};

export async function PUT(request: Request) {
  const payload = await parseJson<{ recipes: RecipeInput[] }>(request);
  if (!payload?.recipes || !Array.isArray(payload.recipes)) {
    return jsonError("VALIDATION_ERROR", "Recipes array is required.", 400);
  }

  if (payload.recipes.length > 5) {
    return jsonError("VALIDATION_ERROR", "Maximum 5 recipes per week.", 400);
  }

  const weekStart = getWeekStartUtc(new Date());

  const plan = await prisma.$transaction(async (tx) => {
    await tx.weeklyPlan.deleteMany({ where: { weekStart } });

    const created = await tx.weeklyPlan.create({
      data: {
        weekStart,
        recipes: {
          create: payload.recipes.map((r, i) => ({
            title: r.title,
            imageUrl: r.imageUrl ?? null,
            sourceUrl: r.sourceUrl,
            servings: r.servings ?? 4,
            ingredients: JSON.stringify(r.ingredients),
            directions: JSON.stringify(r.directions),
            position: i,
          })),
        },
      },
      include: {
        recipes: { orderBy: { position: "asc" } },
      },
    });

    return created;
  });

  return NextResponse.json({
    weeklyPlan: {
      id: plan.id,
      weekStart: plan.weekStart.toISOString(),
      recipes: plan.recipes.map((r) => ({
        id: r.id,
        title: r.title,
        imageUrl: r.imageUrl,
        sourceUrl: r.sourceUrl,
        servings: r.servings,
        ingredients: JSON.parse(r.ingredients),
        directions: JSON.parse(r.directions),
        position: r.position,
      })),
    },
  });
}
