/**
 * Standalone test: Call DALL-E 3 API directly to verify it works.
 * 
 * Usage:
 *   node scripts/test-dalle.mjs <YOUR_OPENAI_API_KEY>
 * 
 * Or set OPENAI_API_KEY env var:
 *   $env:OPENAI_API_KEY="sk-..."; node scripts/test-dalle.mjs
 */

const apiKey = process.argv[2] || process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("ERROR: Provide OpenAI API key as argument or OPENAI_API_KEY env var");
  console.error("Usage: node scripts/test-dalle.mjs sk-your-key-here");
  process.exit(1);
}

const prompt = `Create a vertical A4 children's recipe infographic poster in Danish.
STYLE: Digital hand-drawn illustration, cute Scandinavian children's cookbook style.
Simple test: Show a poster for "Pandekager" (pancakes) with 3 ingredients and 2 steps.
All text in Danish. One single illustrated poster.`;

console.log("--- DALL-E 3 API Test ---");
console.log("Using key:", apiKey.slice(0, 8) + "..." + apiKey.slice(-4));
console.log("Sending request (this takes 20-40 seconds)...");

const startTime = Date.now();

try {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1792",
      quality: "hd",
      response_format: "b64_json",
    }),
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Response status: ${response.status} (${elapsed}s)`);

  if (!response.ok) {
    const error = await response.json();
    console.error("API Error:", JSON.stringify(error, null, 2));
    process.exit(1);
  }

  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;

  if (b64) {
    console.log(`SUCCESS: Got base64 image (${(b64.length / 1024).toFixed(0)} KB)`);
    
    // Write to file so we can verify the image
    const fs = await import("fs");
    const outPath = "scripts/test-dalle-output.png";
    fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
    console.log(`Image saved to: ${outPath}`);
  } else {
    console.error("ERROR: No b64_json in response");
    console.error("Response data keys:", Object.keys(data));
    if (data.data?.[0]) {
      console.error("First item keys:", Object.keys(data.data[0]));
    }
  }
} catch (err) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.error(`FETCH ERROR (${elapsed}s):`, err.message);
  process.exit(1);
}
