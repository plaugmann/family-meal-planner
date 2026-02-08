import { NextResponse } from "next/server";
import { jsonError, parseJson } from "@/lib/api";
import { requireHousehold } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const household = await requireHousehold();
  if (!household) {
    return jsonError("NOT_ALLOWED", "Authentication required.", 401);
  }

  const payload = await parseJson<{ message: string; conversationHistory?: Array<{ role: string; content: string }> }>(request);
  if (!payload?.message) {
    return jsonError("VALIDATION_ERROR", "Message is required.", 400);
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return jsonError("CONFIG_ERROR", "OpenAI API key not configured.", 500);
  }

  try {
    const messages = [
      {
        role: "system",
        content: `You are a helpful cooking assistant for a family meal planning app. Your role is to:
- Suggest family-friendly dinner recipes (suitable for 2 adults and 2 children)
- Provide recipe ideas based on ingredients, dietary preferences, or themes
- Keep recipes simple and practical for weeknight dinners
- Suggest recipes that minimize food waste
- Recommend only 3 dinner recipes per week as per the app's design
- Be concise and friendly

When suggesting recipes, include:
- Recipe name
- Brief description
- Main ingredients
- Approximate cooking time
- Why it's family-friendly

Do not suggest breakfast, lunch, or dessert recipes unless specifically asked.`,
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
      console.error("OpenAI API error:", error);
      return jsonError("AI_ERROR", "Failed to get response from AI.", 500);
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return NextResponse.json({
      message: aiMessage,
      conversationHistory: [
        ...(payload.conversationHistory || []),
        { role: "user", content: payload.message },
        { role: "assistant", content: aiMessage },
      ],
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return jsonError("AI_ERROR", "Unable to process your request.", 500);
  }
}
