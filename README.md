# Curio — Voice-Interactive Learning Buddy for Kids

A React + TypeScript web app that lets young children ask questions out loud
and get safe, age-appropriate, spoken-back answers. I built this to get
hands-on with real-time speech interfaces and to see what it actually takes
to put a conversational AI in front of a young user safely — turns out the
hard part isn't the AI, it's everything around it (content filtering, visible
system state, not leaking your API key to the entire internet).

## Architecture
┌─────────────────┐      ┌──────────────────┐      ┌────────────────────┐

│   Child speaks   │ ───▶ │  Web Speech API   │ ───▶ │  Transcript (text)  │

│   (microphone)   │      │  (browser ASR)    │      │                     │

└─────────────────┘      └──────────────────┘      └─────────┬──────────┘

▼

┌─────────────────┐      ┌──────────────────┐      ┌────────────────────┐

│  Child hears     │ ◀─── │  SpeechSynthesis  │ ◀─── │  Cloudflare Worker  │

│  spoken answer   │      │  (text-to-speech) │      │  (holds Gemini key  │

└─────────────────┘      └──────────────────┘      │  server-side only)  │

└─────────┬──────────┘

▼

┌────────────────────┐

│  Gemini API +       │

│  Firebase Firestore │

│  (session history)  │

└────────────────────┘

**Why a Worker in the middle?** Calling Gemini directly from browser
JavaScript puts the API key inside the JS bundle, visible to anyone via
DevTools → Network tab — a key embedded in client code is never truly
secret, no matter what's in `.gitignore`. I learned this the hard way after
almost shipping it that way. The Cloudflare Worker (`worker/index.js`) holds
the key as a server-side secret and is the only thing that ever talks to
Google. The React app only ever talks to the worker's public URL, which is
safe to expose.

## Stack

- **Frontend:** React 18, TypeScript, Vite
- **Speech input (ASR):** Web Speech API (`SpeechRecognition`) — real
  browser-native speech-to-text, continuous listening with interim results
- **Speech output:** Web Speech Synthesis API
- **AI layer:** Gemini API, called from a Cloudflare Worker proxy with a
  child-safety system prompt — never called directly from the browser
- **Backend/storage:** Firebase (Firestore for session + question history,
  optional)
- **Deployment:** Cloudflare Pages (frontend) + Cloudflare Workers (API
  proxy) — both free, no card required

## Design notes

- **Big tap targets, minimal text** — kids this age may not read fluently yet
- **Visible AI state** — the buddy's face changes so the child always knows
  if it's listening, thinking, or talking, instead of a silent black box
- **Answers end with a follow-up question** — flat one-shot answers felt
  boring to test with, so I made it nudge toward a little back-and-forth
- **Content safety layer** — a pre-filter catches obviously sensitive topics
  before they ever reach the model, and the system prompt keeps tone and
  vocabulary age-appropriate
- **Session logging** — every exchange gets written to Firestore, mostly so
  I could look back at what kinds of questions it handled well vs. badly

## Running locally

```bash
npm install
cp .env.example .env
npm run dev
```

## Live demo

🔗 **https://curio-voice-buddy.pages.dev**

Try it in Chrome or Edge (Safari doesn't support the Web Speech API used for
voice input). Tap the mic button and ask Curio anything.

## Deploying your own copy

Want to run this yourself? You'll need your own free Gemini API key and
Cloudflare account — both free, no credit card required.

### Step 1 — Deploy the Worker (holds your Gemini key)

```bash
cd worker
npm install -g wrangler
wrangler login
wrangler secret put GEMINI_API_KEY
wrangler deploy
```

Open `worker/index.js` and add your frontend's domain to `ALLOWED_ORIGINS`
once you know it (next step), then redeploy.

### Step 2 — Deploy the frontend

```bash
echo "VITE_WORKER_URL=https://curio-gemini-proxy.YOUR-SUBDOMAIN.workers.dev" > .env
npm run build
npx wrangler pages deploy dist --project-name=your-project-name
```

Take the printed URL, add it to `ALLOWED_ORIGINS` in `worker/index.js`, and
redeploy the worker once more.