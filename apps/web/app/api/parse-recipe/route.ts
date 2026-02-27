import { NextResponse } from "next/server";
import { jsonError, parseJson } from "@/lib/api";
import { fetchNoAdsRecipe } from "@/lib/recipe-scrapers/noadsrecipe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await parseJson<{ url: string }>(request);
  if (!payload?.url) {
    return jsonError("VALIDATION_ERROR", "URL is required.", 400);
  }

  try {
    new URL(payload.url);
  } catch {
    return jsonError("VALIDATION_ERROR", "Invalid URL.", 400);
  }

  try {
    const recipe = await fetchNoAdsRecipe(payload.url);
    return NextResponse.json({ recipe });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to parse recipe.";
    return jsonError("IMPORT_FAILED", message, 422);
  }
}
