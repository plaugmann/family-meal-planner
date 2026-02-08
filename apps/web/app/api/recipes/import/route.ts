import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHousehold } from "@/lib/auth";
import { extractDomain, jsonError, parseJson, stubParseRecipe } from "@/lib/api";
import { fetchNoAdsRecipe } from "@/lib/recipe-scrapers/noadsrecipe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const household = await requireHousehold();
  if (!household) {
    return jsonError("NOT_ALLOWED", "Authentication required.", 401);
  }
  const payload = await parseJson<{ url?: string }>(request);
  if (!payload?.url) {
    return jsonError("VALIDATION_ERROR", "URL is required.", 400);
  }

  const domain = extractDomain(payload.url);
  if (!domain) {
    return jsonError("VALIDATION_ERROR", "URL is invalid.", 400);
  }

  // Allow import from any domain, not just whitelisted
  // Search is still limited to whitelisted domains only
  
  let noAdsParsed = null;
  try {
    noAdsParsed = await fetchNoAdsRecipe(payload.url);
  } catch {
    noAdsParsed = null;
  }

  const parsed = noAdsParsed
    ? {
        title: noAdsParsed.title,
        imageUrl: noAdsParsed.imageUrl,
        servings: noAdsParsed.servings,
        ingredients: noAdsParsed.ingredients,
        steps: noAdsParsed.directions,
      }
    : stubParseRecipe(payload.url);

  try {
    const recipe = await prisma.recipe.create({
      data: {
        householdId: household.id,
        title: parsed.title,
        imageUrl: parsed.imageUrl,
        sourceUrl: payload.url,
        sourceDomain: domain,
        servings: parsed.servings,
        isFavorite: false,
        isFamilyFriendly: household.familyFriendlyDefault,
        needsReview: !noAdsParsed,
        ingredients: {
          create: parsed.ingredients.map((line, index) => ({
            position: index + 1,
            line,
          })),
        },
        steps: {
          create: parsed.steps.map((text, index) => ({
            position: index + 1,
            text,
          })),
        },
      },
      include: { ingredients: true, steps: true },
    });

    const responseRecipe = {
      ...recipe,
      steps: recipe.steps.map((step) => step.text),
    };

    return NextResponse.json({ recipe: responseRecipe }, { status: 201 });
  } catch (error) {
    return jsonError("IMPORT_FAILED", "Recipe import failed.", 422, { url: payload.url });
  }
}
