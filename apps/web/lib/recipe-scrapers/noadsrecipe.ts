import https from "https";

export type ParsedIngredient = {
  raw: string;
  amount: number | null;
  unit: string | null;
  product: string;
};

export type ParsedRecipe = {
  title: string;
  servings: number;
  imageUrl: string | null;
  ingredients: string[];
  ingredientParts: ParsedIngredient[];
  directions: string[];
  sourceUrl: string;
};

type NoAdsRecipeResponse = {
  title?: string;
  imageURL?: string;
  ingredients?: unknown;
  instructions?: unknown;
  directions?: unknown;
  servings?: number;
};

const NOADS_RECIPE_PAGE = "https://noadsrecipe.com/recipe?url=";
const NOADS_RECIPE_API = "https://noadsrecipe.com/api/fetch?url=";

function cleanLines(lines: string[]) {
  return lines
    .map((line) => decodeHtmlEntities(line))
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function normalizeList(value: unknown): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return cleanLines(
      value.flatMap((entry) => {
        if (typeof entry === "string") {
          return [entry];
        }
        if (entry && typeof entry === "object" && "text" in entry) {
          const text = (entry as { text?: string }).text;
          return text ? [text] : [];
        }
        return [];
      })
    );
  }
  if (typeof value === "string") {
    return cleanLines(value.split(/\r?\n/));
  }
  return [];
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
}

function parseIngredientLine(line: string): ParsedIngredient {
  const cleaned = line.replace(/\s+/g, " ").trim();
  const match = cleaned.match(/^(\d+(?:[.,]\d+)?)(?:\s+([^\d\s]+))?\s+(.*)$/);
  if (!match) {
    return { raw: cleaned, amount: null, unit: null, product: cleaned };
  }
  const amount = Number(match[1].replace(",", "."));
  const unit = match[2] ?? null;
  const product = match[3]?.trim() || cleaned;
  return { raw: cleaned, amount: Number.isFinite(amount) ? amount : null, unit, product };
}

function fetchJsonWithHttps(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      new URL(url),
      {
        method: "GET",
        headers: {
          Origin: "https://noadsrecipe.com",
          "x-preserve-url-encoding": "true",
        },
        rejectUnauthorized: false,
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
            return;
          }
          reject(new Error(`NoAdsRecipe fetch failed (${res.statusCode})`));
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

export async function fetchNoAdsRecipe(url: string): Promise<ParsedRecipe> {
  const pageUrl = `${NOADS_RECIPE_PAGE}${encodeURIComponent(url)}`;
  // Fetch the NoAdsRecipe page to align with their flow; recipe data is fetched via their API.
  await fetchJsonWithHttps(pageUrl).catch(() => undefined);

  const raw = await fetchJsonWithHttps(`${NOADS_RECIPE_API}${encodeURIComponent(url)}`);
  const data = JSON.parse(raw) as NoAdsRecipeResponse;

  const title = data.title?.trim() ?? "";
  const imageUrl = data.imageURL ?? null;
  const servings = data.servings && data.servings > 0 ? data.servings : 4;
  const ingredients = normalizeList(data.ingredients);
  const directions = normalizeList(data.instructions ?? data.directions);

  if (!title || ingredients.length === 0 || directions.length === 0) {
    throw new Error("Unable to parse recipe data.");
  }

  return {
    title,
    servings,
    imageUrl,
    ingredients,
    ingredientParts: ingredients.map(parseIngredientLine),
    directions,
    sourceUrl: url,
  };
}

export function scaleIngredients(
  ingredients: ParsedIngredient[],
  fromServings: number,
  toServings: number
) {
  if (fromServings <= 0 || toServings <= 0) {
    return ingredients;
  }
  const factor = toServings / fromServings;
  return ingredients.map((item) => {
    if (item.amount === null) {
      return item;
    }
    const nextAmount = Math.round(item.amount * factor * 100) / 100;
    return {
      ...item,
      amount: nextAmount,
    };
  });
}
