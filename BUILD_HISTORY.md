# FINN — AI build history

This is the build trail for the ENAM AI Engineer Build Challenge.  
Built with **Cursor** (Composer / agent mode) in one continuous project chat.

- Live app: https://finn-enam-omega.vercel.app  
- Repo: https://github.com/Ayush-Gaud/finn-enam  
- Cursor chat id: `b7277de2-af1b-45ee-a8d2-fbf688eef2ca`

If a Cursor shared transcript link is available on your plan, paste it at the top of the submission email as well. Native Share links look like `https://cursor.com/s/...` (Teams/Enterprise). This file is the portable history anyone can open from GitHub.

---

## How the work was done

I used Cursor as the main coding agent end-to-end: reading the ENAM PDFs, scaffolding the Next.js app, wiring Supabase + Gemini, building the four mobile tabs, redesigning the UI, deploying to Vercel, and drafting the submission note/email. I steered product choices; the agent wrote and iterated most of the code.

---

## Timeline of the build (what we asked Cursor to do)

### 1. Brief → understanding map
- Read the ENAM challenge PDFs.
- Produced `UNDERSTANDING_MAP.md` (push vs pull, materiality, primary sources, demo constraints).

### 2. Scaffold
- Next.js + TypeScript + Tailwind + PWA at the repo root.
- Mobile shell with four tabs: Feed, Alerts, Research, Settings.
- Env helpers, health check, `.env.local.example` (no secrets committed).

### 3. Data layer
- Supabase schema (`supabase/schema.sql`): filings, prices, settings, llm_cache, embeddings / primary chunks.
- Python seeds: `prefetch_prices.py`, `seed_filings.py`, `fetch_fundamentals.py`.
- Demo primary corpus + `/api/seed-demo` for research grounding.

### 4. AI layer
- Gemini router with Flash/Pro split and `llm_cache` keyed by model + prompt version + input hash.
- Classify filings, extract results numbers, bio enrichment, research modules.
- Deterministic citation-backed fallbacks when Gemini is down (so the phone demo never blanks).

### 5. Push product
- `/api/digest` — windowed materiality-ranked feed; routine collapsed.
- `/api/alerts` — volume/price breaches + material filings; plain-English reasons.
- Settings persisted to Supabase (`vol_multiple`, `price_pct`, `window_hours`, muted categories).

### 6. Pull product
- `/api/research` — Snapshot, Bull vs Bear, Promised vs Delivered.
- Grounded only in annual-report + concall chunks; expandable citations.
- Ingest path so non-demo tickers (e.g. POLYCAB) work.

### 7. Ship
- GitHub: https://github.com/Ayush-Gaud/finn-enam  
- Vercel (baymax6): https://finn-enam-omega.vercel.app  
- Covering note + submission email drafts.

### 8. UI polish (after first ship)
- Removed serif fallbacks; Geist Sans + Geist Mono only.
- Dusk glass UI: mesh gradient background, frosted glass cards/nav, amber→coral accent.
- Feed hierarchy fix: announcement headline first; sentiment-colored chips/rules; category icons; relative time.
- Phone screenshots at `docs/screens/` (390×844).

### 9. Submission pack
- Updated covering note, plain-language submission email.
- Pointed Gemini router at `gemini-3.8-flash` after 2.0 deprecation.
- Final push + production deploy.

---

## Product decisions made with the agent

| Decision | Why |
|----------|-----|
| Cached-first Supabase | Demo always has content on a phone; live NSE scrape is fragile |
| 3 deep pull modules, not 8 shallow | Promised vs Delivered is the analytical edge |
| Flash for extract, Pro for reasoning (+ cache) | Cost/latency vs quality; same answers when cached |
| Deterministic grounded fallbacks | Gemini outages (404/503) must not kill the demo |
| Glass / dusk UI late | Product first, then craft for the phone grading surface |

---

## What to open if you want the raw chat

1. Preferred: Cursor Share on this chat → Public/Team → copy `https://cursor.com/s/...`  
   (Requires Teams/Enterprise and Storage privacy mode.)
2. Fallback (this file): https://github.com/Ayush-Gaud/finn-enam/blob/master/BUILD_HISTORY.md  
3. Local transcript (developer machine only): Cursor agent transcript `b7277de2-af1b-45ee-a8d2-fbf688eef2ca`

No API keys or `.env` values are included in this history.
