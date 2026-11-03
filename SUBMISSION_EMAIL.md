# Submission email (copy into Gmail / Outlook)

**To:** assessment@enam.com  
**Subject:** ENAM - IIT screening - 2027

---

Hi ENAM team,

Please find my submission for the **ENAM AI Engineer Build Challenge**.

### Links
- **Live prototype (mobile-first PWA):** https://finn-enam-omega.vercel.app  
- **GitHub repository:** https://github.com/Ayush-Gaud/finn-enam  
- **AI build history:** [paste Cursor chat share link / attach export ZIP]  
- **Covering note:** attached as `COVERING_NOTE.md` (also in the repo root)

### What I built
**FINN** — a Financial Investment Agent that filters what matters across an NSE/BSE portfolio:

1. **Feed (push)** — 24h / 7d / 30d digest; material filings ranked; routine collapsed; results QoQ/YoY tables; management-change context cards.  
2. **Alerts (push)** — unusual volume/price + material announcements, with editable thresholds.  
3. **Research (pull)** — Snapshot, Bull vs Bear, and **Promised vs Delivered**, grounded only in annual reports + concalls, with expandable citations. Works for INFY and non-demo tickers (e.g. POLYCAB).  
4. **Settings** — volume multiple, price %, window, muted categories → Supabase.

### Key decisions / trade-offs
- **Cached-first:** seed prices/filings/primary corpus into Supabase so the phone demo always has content; live fetch is best-effort.  
- **Depth over breadth on Pull:** three strong modules instead of eight shallow ones; Promised vs Delivered is the edge.  
- **Gemini Flash/Pro + `llm_cache`:** Flash for classify/extract; Pro for reasoning; deterministic citation-backed fallbacks if the model is down.

### Deliberately left out
Full 8-module pull menu, OS push notifications, multi-user auth, LinkedIn bio scraping, fragile live exchange scraping.

### Where I’d take it next
Live AR/transcript PDF pipeline, remaining pull modules, real push + auth’d portfolios, stronger retrieval.

### Phone demo (≈2 min)
1. Open the live link on your phone → **Feed** → switch windows → open a results / management card.  
2. **Alerts** → note plain-English reasons → tweak thresholds in **Settings**.  
3. **Research** → `INFY` → Promised → expand footnotes; then try `POLYCAB` Snapshot.

Happy to walk through the architecture or the Cursor build trail live.

Thanks,  
Ayush Gaud  
[your phone] · [your email] · IIT [campus / year]

---

## Attachments checklist
- [ ] `COVERING_NOTE.md`
- [ ] Cursor AI build history (export / share link)
- [ ] Optional: `docs/screens/feed.png`, `alerts.png`, `research.png` (also in repo)

## Before you hit send
1. Confirm https://finn-enam-omega.vercel.app loads on your phone.  
2. Confirm the GitHub repo is public (or ENAM has access).  
3. Paste your Cursor share link into the email body.  
4. Subject line must be exactly: `ENAM - IIT screening - 2027`
