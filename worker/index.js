/**
 * Cloudflare Worker — secure proxy for the Gemini API.
 *
 * This is the ONLY place the Gemini API key ever exists at runtime.
 * It is stored as a Cloudflare "secret" (set via `wrangler secret put`),
 * never in source code, never in the .env file shipped to the browser,
 * and never visible in DevTools/Network tab on the deployed site.
 *
 * The React app calls THIS worker's URL instead of calling Google directly.
 * This worker then calls Google using the secret key, and returns just the
 * answer text back to the browser.
 */

const CHILD_SAFE_SYSTEM_PROMPT = `
You are Curio, a warm, patient, encouraging learning buddy for children ages 5-9.

Rules you must always follow:
- Use simple words a 6-year-old can understand. Keep answers to 2-3 short sentences.
- Be factually accurate. If you are not sure, say so honestly instead of guessing.
- Never include violence, frightening content, romantic content, or anything inappropriate for young children.
- If a question touches on something sensitive, unsafe, or something you shouldn't answer
  (e.g. personal safety, family conflict, self-harm, or anything an adult should help with),
  gently say you're not the right one to answer that and encourage the child to ask a parent,
  teacher, or trusted grown-up.
- End almost every answer with one short, fun follow-up question to keep the child curious
  and talking (e.g. "Want to know why that happens?").
- Speak directly to the child in a friendly, encouraging tone — like a curious older friend,
  not a textbook.
`.trim();

const SENSITIVE_TOPIC_PATTERN =
  /\b(hurt myself|self.?harm|suicide|abuse|kill|weapon|gun|drugs?)\b/i;

// Only allow requests from your own deployed site, not just anyone on the internet.
// Replace with your actual deployed domain(s) before going live.
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://curio-voice-buddy.pages.dev", // <-- update after you deploy the frontend
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const question = (body.question || "").toString().slice(0, 500); // basic length cap

    if (!question.trim()) {
      return new Response(JSON.stringify({ error: "Missing question" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // Pre-filter sensitive topics before ever calling the model.
    if (SENSITIVE_TOPIC_PATTERN.test(question)) {
      return new Response(
        JSON.stringify({
          answer:
            "That's a really important question, but it's one for a grown-up you trust, like a parent or teacher. Can you ask them today?",
          flaggedForReview: true,
        }),
        { headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    // env.GEMINI_API_KEY is a Cloudflare secret — never logged, never in source.
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${env.GEMINI_API_KEY}`;

    try {
      const geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: question }] }],
          systemInstruction: { parts: [{ text: CHILD_SAFE_SYSTEM_PROMPT }] },
          generationConfig: { temperature: 0.7, maxOutputTokens: 120 },
        }),
      });

      if (!geminiResponse.ok) {
        throw new Error(`Gemini returned ${geminiResponse.status}`);
      }

      const data = await geminiResponse.json();
      const answer =
        data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
        "Hmm, I couldn't quite figure that out. Can you ask me in a different way?";

      return new Response(
        JSON.stringify({ answer, flaggedForReview: false }),
        { headers: { ...headers, "Content-Type": "application/json" } }
      );
    } catch (err) {
      console.log("GEMINI ERROR:", err.message);
      return new Response(
        JSON.stringify({
          answer: "Oops, my brain had a hiccup! Can you try asking that again?",
          flaggedForReview: false,
        }),
        { headers: { ...headers, "Content-Type": "application/json" } }
      );
    }
  },
};
