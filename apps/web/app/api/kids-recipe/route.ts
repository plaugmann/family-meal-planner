import { NextResponse } from "next/server";
import { jsonError, parseJson } from "@/lib/api";

export const runtime = "nodejs";
export const maxDuration = 60;

type KidsRecipePayload = {
  title: string;
  ingredients: string[];
  directions: string[];
  servings: number;
};

function buildDallePrompt(payload: KidsRecipePayload): string {
  const recipeContent = `
Titel: ${payload.title}
Portioner: ${payload.servings}
Ingredienser: ${payload.ingredients.join(", ")}
Fremgangsmåde: ${payload.directions.map((d, i) => `${i + 1}. ${d}`).join(" ")}
`.trim();

  return `Create a vertical A4 children's recipe infographic poster in Danish.
STYLE:
• Digital hand-drawn illustration
• Cute Scandinavian children's cookbook style
• Warm, soft, cozy colors
• Light beige textured background with small decorative dots
• Bright accent colors (green, orange, yellow, blue)
• Soft shadows and slightly rounded shapes
• No photos – illustration only
• High resolution
• Clear readable Danish text integrated into the design
TARGET GROUP:
Children age 4–9
LAYOUT (IMPORTANT – follow strictly):
TOP SECTION:
• Large playful hand-drawn title in Danish
• Smaller friendly subtitle underneath
• "(${payload.servings} portioner)" displayed clearly
• Add a cute illustrated character (for example a smiling lemon or vegetable with eyes)
LEFT COLUMN:
Header: "DU SKAL BRUGE:"
• Show ingredients as cute illustrated drawings (not realistic photos)
• Each ingredient clearly labeled in Danish with quantity
• Arrange neatly with spacing
• Use bowls, jars, bundles etc. to make it visual
RIGHT COLUMN:
Header: "SÅDAN GØR DU:"
• 3–4 clearly separated step boxes
• Each step has:
• Large red number inside a circle
• Very short, simple Danish instruction
• Matching illustration showing the action (stirring, pouring water, adding herbs etc.)
• Child-friendly language
• Big readable letters
BOTTOM SECTION:
Header: "SERVER MED:"
• Small illustrated toppings
• A green "Tip:" box
• Large cheerful "Velbekomme!" text
TEXT RULES:
• All text must be in Danish
• Short simple sentences
• Large readable lettering
• No extra English text
• No markdown
• No UI elements
• No website layout
• No HTML
• Everything must look like one finished printed poster
VISUAL MOOD:
Fun, friendly, colorful, modern children's cookbook illustration.
RECIPE CONTENT:
${recipeContent}
OUTPUT:
One single complete illustrated infographic poster.`;
}

export async function POST(request: Request) {
  const payload = await parseJson<KidsRecipePayload>(request);
  if (!payload?.title || !payload?.ingredients || !payload?.directions) {
    return jsonError("VALIDATION_ERROR", "Title, ingredients, and directions are required.", 400);
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return jsonError("IMPORT_FAILED", "OpenAI API key not configured.", 500);
  }

  try {
    const prompt = buildDallePrompt(payload);

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1792",
        quality: "hd",
        response_format: "url",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({
        error: {
          code: "IMPORT_FAILED",
          message: `OpenAI API error: ${error.error?.message || response.statusText}`,
        },
      }, { status: response.status });
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      return jsonError("IMPORT_FAILED", "No image returned from DALL-E.", 500);
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    return jsonError("IMPORT_FAILED", "Unable to generate kids recipe image.", 500);
  }
}
