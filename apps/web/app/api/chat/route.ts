import { NextResponse } from "next/server";
import { jsonError, parseJson } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await parseJson<{ message: string; conversationHistory?: Array<{ role: string; content: string }> }>(request);
  if (!payload?.message) {
    return jsonError("VALIDATION_ERROR", "Message is required.", 400);
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return jsonError("IMPORT_FAILED", "OpenAI API key not configured.", 500);
  }

  try {
    const messages = [
      {
        role: "system",
        content: `Du er en hjælpsom madassistent for en familiemadplanlægger-app. Din rolle er at:
- Foreslå familievenlige middagsopskrifter (passende til 2 voksne og 2 børn)
- Give opskriftsideer baseret på ingredienser, diætpræferencer eller temaer
- Holde opskrifter simple og praktiske til hverdagsmiddage
- Foreslå opskrifter der minimerer madspild
- Være kortfattet og venlig
- Svare på dansk

Når du foreslår opskrifter, inkluder:
- Opskriftsnavn
- Kort beskrivelse
- Hovedingredienser
- Cirka tilberedningstid
- Hvorfor den er familievenlig`,
      },
      ...(payload.conversationHistory || []),
      {
        role: "user",
        content: payload.message,
      },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 800,
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
    const aiMessage = data.choices[0]?.message?.content || "Beklager, jeg kunne ikke generere et svar.";

    return NextResponse.json({
      message: aiMessage,
      conversationHistory: [
        ...(payload.conversationHistory || []),
        { role: "user", content: payload.message },
        { role: "assistant", content: aiMessage },
      ],
    });
  } catch (error) {
    return jsonError("IMPORT_FAILED", "Unable to process your request.", 500);
  }
}
