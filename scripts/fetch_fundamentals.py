#!/usr/bin/env python3
"""
Best-effort fundamentals fetch for FINN (cached-first).

Resolves screener.in company pages, attempts to record AR + concall links,
and upserts lightweight document metadata. Full PDF parsing is best-effort;
the Next.js app also ships a seed primary corpus so Research always works.

Usage:
  python scripts/fetch_fundamentals.py INFY TCS POLYCAB
"""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "scripts" / ".cache" / "fundamentals"
CACHE.mkdir(parents=True, exist_ok=True)
load_dotenv(ROOT / ".env.local")

HEADERS = {
    "User-Agent": "FINN-ENAM-ResearchBot/1.0 (+assessment; educational build challenge)",
    "Accept": "text/html,application/xhtml+xml",
}


def sb():
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise SystemExit("Missing Supabase env")
    return create_client(url, key)


def fetch(url: str) -> str:
    path = CACHE / (url.replace("https://", "").replace("/", "_")[:180] + ".html")
    if path.exists() and path.stat().st_size > 100:
        return path.read_text(encoding="utf-8", errors="ignore")
    for attempt in range(3):
        try:
            r = requests.get(url, headers=HEADERS, timeout=30)
            if r.status_code == 200:
                path.write_text(r.text, encoding="utf-8")
                return r.text
            time.sleep(1.5 * (attempt + 1))
        except requests.RequestException:
            time.sleep(1.5 * (attempt + 1))
    return ""


def ensure_company(client, ticker: str):
    yahoo = f"{ticker}.NS"
    client.table("companies").upsert(
        {
            "ticker": ticker,
            "yahoo_symbol": yahoo,
            "name": ticker,
            "sector": "Unknown",
            "in_portfolio": False,
        },
        on_conflict="ticker",
    ).execute()
    row = client.table("companies").select("id").eq("ticker", ticker).single().execute()
    return row.data["id"]


def main(tickers: list[str]) -> None:
    client = sb()
    for ticker in tickers:
        ticker = ticker.upper().replace(".NS", "")
        print(f"== {ticker}")
        company_id = ensure_company(client, ticker)
        url = f"https://www.screener.in/company/{ticker}/"
        html = fetch(url)
        time.sleep(1.0)
        note = (
            f"Screener page fetched for {ticker}. "
            f"HTML bytes={len(html)}. "
            "Use Next.js seed corpus / manual IR PDFs for chunked primary text; "
            "this script records the source URL for auditability."
        )
        # Idempotent document marker
        existing = (
            client.table("documents")
            .select("id")
            .eq("company_id", company_id)
            .eq("doc_type", "annual_report")
            .eq("period", "FY25-meta")
            .execute()
        )
        if existing.data:
            print("  already recorded")
            continue
        doc = (
            client.table("documents")
            .insert(
                {
                    "company_id": company_id,
                    "doc_type": "annual_report",
                    "period": "FY25-meta",
                    "title": f"{ticker} screener.in source marker",
                    "source_url": url,
                }
            )
            .execute()
        )
        doc_id = doc.data[0]["id"]
        client.table("doc_chunks").insert(
            {
                "document_id": doc_id,
                "chunk_index": 0,
                "content": note,
                "page": 1,
            }
        ).execute()
        print("  recorded source marker")
    print("done")


if __name__ == "__main__":
    args = sys.argv[1:] or ["INFY", "TCS", "RELIANCE", "POLYCAB"]
    main(args)
