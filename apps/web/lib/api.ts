import { NextResponse } from "next/server";
import { prisma } from "./prisma";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "NOT_ALLOWED"
  | "CONFLICT"
  | "IMPORT_FAILED";

export function jsonError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details: details ?? undefined,
      },
    },
    { status }
  );
}

export async function parseJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export async function getOrCreateHousehold() {
  const existing = await prisma.household.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) {
    return existing;
  }

  return prisma.household.create({
    data: {
      name: "Family Household",
      familyFriendlyDefault: true,
      minimizeWasteDefault: true,
    },
  });
}

export function getWeekStartUtc(date: Date) {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay();
  const diff = (day + 6) % 7; // Monday = 0
  utc.setUTCDate(utc.getUTCDate() - diff);
  utc.setUTCHours(0, 0, 0, 0);
  return utc;
}

export function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function extractDomain(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function stubParseRecipe(url: string) {
  const domain = extractDomain(url) ?? "unknown";
  const slug = url.split("/").filter(Boolean).pop() ?? "recipe";
  const title = slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return {
    title,
    imageUrl: null as string | null,
    servings: 4,
    ingredients: [
      "1 tbsp olive oil",
      "2 cloves garlic",
      "1 can tomatoes",
    ],
    steps: ["Prep ingredients", "Cook and serve"],
    sourceDomain: domain,
  };
}

const categoryKeywords: Record<string, string[]> = {
  PRODUCE: ["onion", "garlic", "tomato", "carrot", "salad", "lettuce", "pepper", "potato"],
  DAIRY: ["milk", "cheese", "butter", "cream", "yogurt"],
  MEAT_FISH: ["beef", "chicken", "pork", "fish", "salmon", "bacon"],
  PANTRY: ["pasta", "rice", "beans", "flour", "oil", "salt", "pepper", "sugar"],
  FROZEN: ["frozen"],
};

export function categorizeIngredient(line: string) {
  const text = normalizeText(line);
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category as "PRODUCE" | "DAIRY" | "MEAT_FISH" | "PANTRY" | "FROZEN";
    }
  }
  return "OTHER" as const;
}

export async function inventoryHasIngredient(line: string, householdId: string) {
  const inventory = await prisma.inventoryItem.findMany({
    where: { householdId, isActive: true },
    select: { name: true },
  });
  const normalizedLine = normalizeText(line);
  return inventory.some((item) => normalizedLine.includes(normalizeText(item.name)));
}
