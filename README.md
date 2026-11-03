# FINN — Financial Investment Agent

Mobile-first push/pull investment agent for the **ENAM Holdings AI Engineer Build Challenge**.

Filter what matters across an NSE/BSE portfolio. Cached-first so the demo always runs.

## Live demo

- App: https://finn-enam-omega.vercel.app
- Repo: https://github.com/Ayush-Gaud/finn-enam

## Stack

- Next.js (App Router) + TypeScript + Tailwind + PWA
- Supabase (Postgres + pgvector)
- Google Gemini — Flash (classify/extract), Pro (reasoning), text-embedding-004
- Deploy: Vercel

## Cached-first posture

Scripts write durable snapshots into Supabase. The app **reads Supabase** — not live NSE on every request. Live Yahoo/screener is best-effort refresh.

```
prefetch_prices / seed_filings / primary corpus ──► Supabase
                                                      ▲
Feed · Alerts · Research · Settings ──────────────────┘
```

## Setup

```bash
cp .env.local.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY

npm install
npm run dev
```

### Database

1. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor (or migration already applied).
2. Python seed:

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r scripts/requirements.txt
python scripts/prefetch_prices.py
python scripts/seed_filings.py
python scripts/fetch_fundamentals.py INFY TCS RELIANCE POLYCAB
```

3. Primary research corpus (idempotent):

```bash
curl -X POST http://localhost:3000/api/seed-demo
```

## Architecture

| Area | Path |
|------|------|
| Mobile shell + tabs | `src/components/shell`, `src/app/{feed,alerts,research,settings}` |
| Env | `src/lib/env.ts` |
| Supabase clients | `src/lib/supabase.ts` |
| Gemini router + cache | `src/lib/ai/router.ts`, `src/lib/ai/prompts.ts` |
| Materiality / finance | `src/lib/materiality.ts`, `src/lib/finance.ts` |
| Pull ingest + research | `src/lib/research/*`, `src/data/primaryCorpus.ts` |
| APIs | `/api/digest`, `/api/alerts`, `/api/settings`, `/api/research`, `/api/ingest`, `/api/health`, `/api/seed-demo` |

### Model routing + caching

- **Flash:** classify filings, extract results numbers, bios, snapshots  
- **Pro:** bull/bear, promised vs delivered  
- **Cache key:** `sha256(model + PROMPT_VERSION + inputHash)` → `llm_cache`  
- Offline deterministic primary-source fallbacks if Gemini fails  

## Demo script (phone)

1. **Feed** → window `7d` → open a results card (QoQ/YoY) + TCS management-change bio.  
2. **Alerts** → see unusual volume/price + material filings; tweak thresholds in Settings.  
3. **Research** → `INFY` → Promised vs Delivered → expand citations.  
4. **Research** → `POLYCAB` → Snapshot (proves non-hardcoded ticker path).  

## Submission

Email **assessment@enam.com** · subject exactly **`ENAM - IIT screening - 2027`**  
Include live link, GitHub, AI build history, and [`COVERING_NOTE.md`](COVERING_NOTE.md).

## Secrets

Never commit `.env.local`. Only `.env.local.example` (empty placeholders) is tracked.
