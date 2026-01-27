import { NextResponse } from "next/server";
import { jsonError, parseJson } from "@/lib/api";
import { requireHousehold } from "@/lib/auth";
import { fetchNoAdsRecipe } from "@/lib/recipe-scrapers/noadsrecipe";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await requireHousehold())) {
    return jsonError("NOT_ALLOWED", "Authentication required.", 401);
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) {
    return jsonError("VALIDATION_ERROR", "url is required.", 400);
  }

  try {
    const recipe = await fetchNoAdsRecipe(url);
    return NextResponse.json({ recipe });
  } catch (error) {
    return jsonError("IMPORT_FAILED", "Unable to parse recipe.", 422, { url });
  }
}

export async function POST(request: Request) {
  if (!(await requireHousehold())) {
    return jsonError("NOT_ALLOWED", "Authentication required.", 401);
  }

  const payload = await parseJson<{ url?: string }>(request);
  if (!payload?.url) {
    return jsonError("VALIDATION_ERROR", "url is required.", 400);
  }

  try {
    const recipe = await fetchNoAdsRecipe(payload.url);
    return NextResponse.json({ recipe });
  } catch (error) {
    return jsonError("IMPORT_FAILED", "Unable to parse recipe.", 422, { url: payload.url });
  }
}
