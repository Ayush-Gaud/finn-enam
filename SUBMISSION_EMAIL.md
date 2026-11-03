# Submission email (copy into Gmail / Outlook)

To: assessment@enam.com  
Subject: ENAM - IIT screening - 2027

---

Hi,

I’m submitting my build for the ENAM AI Engineer Build Challenge.

Links:
- Live app: https://finn-enam-omega.vercel.app
- GitHub: https://github.com/Ayush-Gaud/finn-enam
- AI build history: https://github.com/Ayush-Gaud/finn-enam/blob/master/BUILD_HISTORY.md
  (If you also have a Cursor Share link like https://cursor.com/s/..., paste it here too.)
- Covering note: attached (COVERING_NOTE.md)

What I built:
FINN is a mobile-first investment agent. It has four tabs:

1. Feed — a digest of portfolio filings (24h / 7d / 30d). Material items are ranked; routine ones are folded away. Results cards show QoQ/YoY numbers; management-change cards include a short bio labeled as context.
2. Alerts — unusual volume or price moves, plus material announcements, with plain-English reasons. Thresholds are editable in Settings.
3. Research — Snapshot, Bull vs Bear, and Promised vs Delivered. Answers are grounded in annual reports and concalls only, with expandable citations. Works for INFY and for other NSE tickers (e.g. POLYCAB).
4. Settings — volume multiple, price move %, window, and muted categories, saved to Supabase.

Key choices:
- Cached-first data so the phone demo always has content; live fetch is best-effort.
- Three deep research modules instead of eight shallow ones. Promised vs Delivered is the main analytical piece.
- Gemini Flash/Pro with response caching, plus citation-backed fallbacks if the model is down.

Left out on purpose:
Full 8-module research menu, OS push notifications, multi-user auth, LinkedIn scraping, and fragile live exchange scraping.

Next steps I’d take:
Better live PDF parsing for ARs/transcripts, the remaining research modules, real push + auth’d portfolios, and stronger retrieval.

Quick phone walkthrough:
1. Open the live link → Feed → try the time windows → open a results or management card.
2. Alerts → check the reasons → tweak thresholds in Settings.
3. Research → INFY → Promised → expand footnotes. Then try POLYCAB Snapshot.

Happy to walk through anything if useful.

Thanks,  
Ayush Gaud  
[phone] · [email] · IIT [campus / year]

---

Before sending:
1. Check the live link on your phone
2. Paste your Cursor share link
3. Attach COVERING_NOTE.md
4. Keep the subject exactly: ENAM - IIT screening - 2027
