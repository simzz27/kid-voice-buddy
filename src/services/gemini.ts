/**
 * Calls our own Cloudflare Worker proxy, which holds the Gemini API key
 * server-side. The browser NEVER sees the API key — it only talks to our
 * worker, which talks to Google on our behalf.
 *
 * This is the fix for: "if I call Gemini directly from the browser, anyone
 * can open DevTools > Network and steal my key." The worker URL itself is
 * not a secret — it's fine for it to be public, the same way a website's
 * URL is public.
 */

const WORKER_URL = import.meta.env.VITE_WORKER_URL as string | undefined;

export interface CurioResponse {
  answer: string;
  flaggedForReview: boolean;
}

export async function askCurio(question: string): Promise<CurioResponse> {
  if (!WORKER_URL) {
    return {
      answer:
        "I'm not connected to my brain yet! Ask a grown-up to finish setting up the worker URL.",
      flaggedForReview: false,
    };
  }

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(`Worker request failed: ${response.status}`);
    }

    const data = (await response.json()) as CurioResponse;
    return data;
  } catch (err) {
    console.error("askCurio error:", err);
    return {
      answer: "Oops, my brain had a hiccup! Can you try asking that again?",
      flaggedForReview: false,
    };
  }
}

