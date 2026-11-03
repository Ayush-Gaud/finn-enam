# ENAM — Covering Note

**To:** assessment@enam.com  
**Subject:** ENAM - IIT screening - 2027

## What I built

**FINN** — a mobile-first Financial Investment Agent (PWA) with:

- **Push / Feed** — windowed portfolio filing digest (24h / 7d / 30d), materiality-ranked, routine collapsed; results cards with QoQ/YoY mini-tables; management-change cards with bio labeled as external context.
- **Push / Alerts** — unusual EOD volume/price moves plus material announcement alerts, with plain-English reasons and thresholds from Settings.
- **Pull / Research** — three deep modules (Snapshot, Bull vs Bear, **Promised vs Delivered**) grounded only in annual-report + concall chunks, with expandable citations. Works for demo names and arbitrary NSE tickers (e.g. POLYCAB) via ingest.
- **Settings** — persist `vol_multiple`, `price_pct`, `window_hours`, muted categories to Supabase.

## Key trade-offs

1. **Cached-first data** — `prefetch_prices.py` + `seed_filings.py` + primary corpus write durable snapshots to Supabase; the app reads those so the demo always has content. Live Yahoo/screener fetch is best-effort.
2. **Three deep Pull modules** instead of a shallow full menu of eight — Promised vs Delivered is the analytical edge.
3. **Flash / Pro routing + `llm_cache`** — Flash for classify/extract/snapshot; Pro for bull/bear and promised-vs-delivered; every call keyed by `sha256(model + PROMPT_VERSION + inputHash)`.
4. **Deterministic grounded fallbacks** when Gemini is unavailable — still citation-backed from primary chunks so the phone demo never blank-screens.

## Deliberately left out

- Full 8-module pull menu  
- Realtime / OS push notifications  
- Multi-user auth  
- Reliable LinkedIn scraping for bios  
- Robust live NSE/BSE scraping (taxonomy seed + cache preferred)

## Next steps

- Deeper live AR/transcript PDF parsing pipeline  
- Remaining pull modules (cash quality, balance sheet, trajectory, guidance-only)  
- True push notifications + auth’d portfolios  
- Stronger embedding recall + IVFFlat rebuild after corpus growth  

## Links

- Live app: https://finn-enam-omega.vercel.app  
- GitHub: https://github.com/Ayush-Gaud/finn-enam  
- AI build history: this Cursor conversation / export  

