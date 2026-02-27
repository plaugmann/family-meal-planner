import { NextResponse } from "next/server";
import { jsonError, parseJson } from "@/lib/api";

export const runtime = "nodejs";

type KidsRecipePayload = {
  title: string;
  ingredients: string[];
  directions: string[];
  servings: number;
};

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
    const prompt = `Lav en børnevenlig infografik-opskrift på dansk baseret på følgende opskrift. 
Infografikken skal være designet så børn i alderen 4-9 år kan følge den.

Regler:
- Brug simple, korte sætninger
- Brug emoji-ikoner til hvert trin (f.eks. 🥄 for rør, 🔥 for opvarm, ❄️ for køl ned, ✂️ for skær)
- Nummerer trinene tydeligt
- Forenkl ingredienslisten med emoji-ikoner
- Brug farverige HTML med inline styles der er klar til print
- Designet skal være sjovt og indbydende for børn
- Brug store skrifttyper og tydelig kontrast
- Alt skal være på DANSK
- Output KUN HTML (ingen markdown, ingen code blocks)
- HTML'en skal have max-width: 800px og være centreret
- Inkluder opskriftens titel som overskrift med sjov styling

Opskrift: ${payload.title}
Portioner: ${payload.servings}

Ingredienser:
${payload.ingredients.join("\n")}

Fremgangsmåde:
${payload.directions.join("\n")}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Du er en kreativ designer der laver børnevenlige kogeinfografikker i HTML. Output KUN ren HTML med inline styles." },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 2000,
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
    let html = data.choices[0]?.message?.content || "";
    
    // Strip markdown code blocks if present
    html = html.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();

    return NextResponse.json({ html });
  } catch (error) {
    return jsonError("IMPORT_FAILED", "Unable to generate kids recipe.", 500);
  }
}
