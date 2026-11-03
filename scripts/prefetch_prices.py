#!/usr/bin/env python3
"""
Prefetch EOD prices for the FINN mock portfolio via yfinance and upsert into Supabase.

Cached-first: this script writes a durable snapshot; the Next.js app reads from Supabase
so the demo always has price/volume data even if Yahoo is down later.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import pandas as pd
import yfinance as yf
from dotenv import load_dotenv
from supabase import Client, create_client

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")

PORTFOLIO: list[dict[str, str]] = [
    {"ticker": "RELIANCE", "yahoo_symbol": "RELIANCE.NS", "name": "Reliance Industries", "sector": "Energy / Conglomerate"},
    {"ticker": "TCS", "yahoo_symbol": "TCS.NS", "name": "Tata Consultancy Services", "sector": "IT Services"},
    {"ticker": "HDFCBANK", "yahoo_symbol": "HDFCBANK.NS", "name": "HDFC Bank", "sector": "Banking"},
    {"ticker": "INFY", "yahoo_symbol": "INFY.NS", "name": "Infosys", "sector": "IT Services"},
    {"ticker": "ITC", "yahoo_symbol": "ITC.NS", "name": "ITC", "sector": "FMCG / Diversified"},
    {"ticker": "TATAMOTORS", "yahoo_symbol": "TATAMOTORS.NS", "name": "Tata Motors", "sector": "Auto"},
    {"ticker": "SUNPHARMA", "yahoo_symbol": "SUNPHARMA.NS", "name": "Sun Pharmaceutical", "sector": "Pharma"},
    {"ticker": "ASIANPAINT", "yahoo_symbol": "ASIANPAINT.NS", "name": "Asian Paints", "sector": "Consumer / Paints"},
    {"ticker": "LT", "yahoo_symbol": "LT.NS", "name": "Larsen & Toubro", "sector": "Engineering / Infra"},
    {"ticker": "MARUTI", "yahoo_symbol": "MARUTI.NS", "name": "Maruti Suzuki", "sector": "Auto"},
    {"ticker": "BHARTIARTL", "yahoo_symbol": "BHARTIARTL.NS", "name": "Bharti Airtel", "sector": "Telecom"},
    {"ticker": "NESTLEIND", "yahoo_symbol": "NESTLEIND.NS", "name": "Nestlé India", "sector": "FMCG"},
    {"ticker": "DMART", "yahoo_symbol": "DMART.NS", "name": "Avenue Supermarts", "sector": "Retail"},
    {"ticker": "TITAN", "yahoo_symbol": "TITAN.NS", "name": "Titan Company", "sector": "Consumer / Jewellery"},
    {"ticker": "ULTRACEMCO", "yahoo_symbol": "ULTRACEMCO.NS", "name": "UltraTech Cement", "sector": "Cement"},
    {"ticker": "COALINDIA", "yahoo_symbol": "COALINDIA.NS", "name": "Coal India", "sector": "Mining / Energy"},
]


def get_supabase() -> Client:
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print(
            "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local",
            file=sys.stderr,
        )
        sys.exit(1)
    return create_client(url, key)


def upsert_companies(sb: Client) -> dict[str, str]:
    """Upsert portfolio companies; return yahoo_symbol -> company_id."""
    rows = [
        {
            "ticker": c["ticker"],
            "yahoo_symbol": c["yahoo_symbol"],
            "name": c["name"],
            "sector": c["sector"],
            "in_portfolio": True,
        }
        for c in PORTFOLIO
    ]
    res = sb.table("companies").upsert(rows, on_conflict="yahoo_symbol").execute()
    mapping = {r["yahoo_symbol"]: r["id"] for r in (res.data or [])}

    # Ensure we have ids even if upsert response is partial
    if len(mapping) < len(PORTFOLIO):
        fetched = sb.table("companies").select("id,yahoo_symbol").in_(
            "yahoo_symbol", [c["yahoo_symbol"] for c in PORTFOLIO]
        ).execute()
        mapping = {r["yahoo_symbol"]: r["id"] for r in (fetched.data or [])}

    print(f"companies upserted: {len(mapping)}")
    return mapping


def enrich_history(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["avg_vol_20d"] = out["Volume"].rolling(20, min_periods=5).mean()
    out["pct_change_1d"] = out["Close"].pct_change() * 100.0
    return out


def fetch_and_upsert_prices(sb: Client, company_ids: dict[str, str], period: str = "6mo") -> int:
    symbols = list(company_ids.keys())
    raw = yf.download(
        symbols,
        period=period,
        group_by="ticker",
        auto_adjust=False,
        threads=True,
        progress=False,
    )

    price_rows: list[dict] = []
    for symbol in symbols:
        company_id = company_ids[symbol]
        try:
            if len(symbols) == 1:
                hist = raw.copy()
            else:
                hist = raw[symbol].dropna(how="all")
        except Exception as exc:  # noqa: BLE001
            print(f"  skip {symbol}: {exc}")
            continue

        if hist.empty:
            print(f"  skip {symbol}: empty history")
            continue

        hist = enrich_history(hist)
        # Keep last ~90 sessions for a compact demo snapshot
        hist = hist.tail(90)

        for ts, row in hist.iterrows():
            close = row.get("Close")
            volume = row.get("Volume")
            if pd.isna(close) or pd.isna(volume):
                continue
            avg_vol = row.get("avg_vol_20d")
            pct = row.get("pct_change_1d")
            price_rows.append(
                {
                    "company_id": company_id,
                    "date": pd.Timestamp(ts).date().isoformat(),
                    "close": float(close),
                    "volume": int(volume),
                    "avg_vol_20d": None if pd.isna(avg_vol) else float(avg_vol),
                    "pct_change_1d": None if pd.isna(pct) else float(pct),
                }
            )
        print(f"  {symbol}: {len(hist)} bars")

    if not price_rows:
        print("No price rows to upsert", file=sys.stderr)
        return 0

    # Batch upsert
    batch = 500
    total = 0
    for i in range(0, len(price_rows), batch):
        chunk = price_rows[i : i + batch]
        sb.table("prices_eod").upsert(chunk, on_conflict="company_id,date").execute()
        total += len(chunk)
    print(f"prices_eod upserted: {total}")
    return total


def main() -> None:
    sb = get_supabase()
    company_ids = upsert_companies(sb)
    fetch_and_upsert_prices(sb, company_ids)
    print("done — prices snapshot cached in Supabase")


if __name__ == "__main__":
    main()
