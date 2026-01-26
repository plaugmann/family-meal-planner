import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, parseJson } from "@/lib/api";
import { requireHousehold } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const household = await requireHousehold();
  if (!household) {
    return jsonError("NOT_ALLOWED", "Authentication required.", 401);
  }
  const recipe = await prisma.recipe.findFirst({
    where: { id: params.id, householdId: household.id },
    include: { ingredients: true, steps: true },
  });

  if (!recipe) {
    return jsonError("NOT_FOUND", "Recipe not found.", 404);
  }

  const responseRecipe = {
    ...recipe,
    steps: recipe.steps
      .sort((a, b) => a.position - b.position)
      .map((step: { text: string }) => step.text),
  };

  return NextResponse.json({ recipe: responseRecipe });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const household = await requireHousehold();
  if (!household) {
    return jsonError("NOT_ALLOWED", "Authentication required.", 401);
  }
  const payload = await parseJson<{
    title?: string;
    imageUrl?: string | null;
    servings?: number;
    isFavorite?: boolean;
    isFamilyFriendly?: boolean;
    ingredients?: { position: number; line: string }[];
    steps?: string[];
  }>(request);

  if (!payload) {
    return jsonError("VALIDATION_ERROR", "Invalid JSON body.", 400);
  }

  const recipe = await prisma.recipe.findFirst({
    where: { id: params.id, householdId: household.id },
  });

  if (!recipe) {
    return jsonError("NOT_FOUND", "Recipe not found.", 404);
  }

  const updateData = {
    title: payload.title?.trim() ?? undefined,
    imageUrl: payload.imageUrl ?? undefined,
    servings: payload.servings ?? undefined,
    isFavorite: payload.isFavorite ?? undefined,
    isFamilyFriendly: payload.isFamilyFriendly ?? undefined,
  };

  const updated = await prisma.$transaction(async (tx) => {
    const recipeUpdate = await tx.recipe.update({
      where: { id: recipe.id },
      data: updateData,
    });

    if (payload.ingredients) {
      await tx.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });
      await tx.recipeIngredient.createMany({
        data: payload.ingredients.map((item, index) => ({
          recipeId: recipe.id,
          position: item.position ?? index + 1,
          line: item.line,
        })),
      });
    }

    if (payload.steps) {
      await tx.recipeStep.deleteMany({ where: { recipeId: recipe.id } });
      await tx.recipeStep.createMany({
        data: payload.steps.map((text, index) => ({
          recipeId: recipe.id,
          position: index + 1,
          text,
        })),
      });
    }

    return tx.recipe.findUnique({
      where: { id: recipe.id },
      include: { ingredients: true, steps: true },
    });
  });

  const responseRecipe = updated
    ? {
        ...updated,
        steps: updated.steps
          .sort((a, b) => a.position - b.position)
          .map((step: { text: string }) => step.text),
      }
    : updated;

  return NextResponse.json({ recipe: responseRecipe });
}
