#!/usr/bin/env python3
"""
Seed a realistic filings snapshot for the FINN portfolio into Supabase.

Cached-first: filings are written once so the Feed/Alerts demo always has content
without live NSE scraping. Re-run to refresh the snapshot.
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv
from supabase import Client, create_client

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")

IST = timezone(timedelta(hours=5, minutes=30))


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


def company_map(sb: Client) -> dict[str, str]:
    res = sb.table("companies").select("id,ticker").eq("in_portfolio", True).execute()
    mapping = {r["ticker"]: r["id"] for r in (res.data or [])}
    if not mapping:
        print(
            "No companies found. Run scripts/prefetch_prices.py first to upsert the portfolio.",
            file=sys.stderr,
        )
        sys.exit(1)
    return mapping


def ts(days_ago: float, hour: int = 12, minute: int = 0) -> str:
    base = datetime.now(IST).replace(hour=hour, minute=minute, second=0, microsecond=0)
    return (base - timedelta(days=days_ago)).isoformat()


INFY_RESULTS_RAW = """
INFOSYS LIMITED — Unaudited Consolidated Financial Results
Quarter ended 30 Sep 2025 (Q2 FY26)

Amount in ₹ crore

Metric                  Q2 FY26 (latest)    Q1 FY26 (prev)     Q2 FY25 (YoY)
Revenue from operations      40,980             40,120             39,340
EBITDA                        9,420              9,150              9,010
Profit before tax (PBT)       9,080              8,820              8,690
Profit after tax (PAT)        6,810              6,620              6,510

Notes:
- Operating margin Q2 FY26: 20.6% (Q1 FY26: 20.1%; Q2 FY25: 20.9%)
- Large deal TCV in Q2 FY26: $3.2bn
- Management commentary: FY26 constant-currency revenue growth guidance reaffirmed at 1%–3%;
  operating margin band 20%–22%.
""".strip()

TCS_MGMT_RAW = """
TATA CONSULTANCY SERVICES LIMITED
Regulation 30 — Change in Key Managerial Personnel

The Board of Directors today approved the appointment of Ms. Ananya Krishnan as
Chief Financial Officer and Key Managerial Personnel, effective 1 December 2025.

Outgoing CFO Mr. Rajesh Mehta will retire on 30 November 2025 after 12 years with the Company.

Brief profile — Ananya Krishnan:
- Former Group Treasurer, large Indian conglomerate
- Previously CFO of a listed IT mid-cap (2018–2023)
- 18 years experience in corporate finance, FX hedging and working-capital programmes
- Chartered Accountant; alumnus of IIM Ahmedabad

No other material change in management.
""".strip()


def build_filings(ids: dict[str, str]) -> list[dict]:
    """Realistic multi-category snapshot. Requires INFY + TCS (+ others) in portfolio."""
    need = ["INFY", "TCS", "RELIANCE", "HDFCBANK", "ITC", "BHARTIARTL", "LT", "SUNPHARMA", "ASIANPAINT", "MARUTI"]
    missing = [t for t in need if t not in ids]
    if missing:
        print(f"Warning: missing tickers in DB (skipped related filings): {missing}")

    filings: list[dict] = []

    def add(
        ticker: str,
        *,
        filed_at: str,
        title: str,
        category: str,
        materiality: str,
        summary: str,
        raw_text: str,
        source_url: str = "https://www.nseindia.com/",
    ) -> None:
        if ticker not in ids:
            return
        filings.append(
            {
                "company_id": ids[ticker],
                "filed_at": filed_at,
                "title": title,
                "category": category,
                "materiality": materiality,
                "summary": summary,
                "source_url": source_url,
                "raw_text": raw_text,
            }
        )

    # --- Required: results with latest / prev / YoY prints in raw_text ---
    add(
        "INFY",
        filed_at=ts(1, 18, 10),
        title="Unaudited Financial Results — Q2 FY26",
        category="results",
        materiality="high",
        summary="Revenue, EBITDA, PBT and PAT printed; FY26 CC growth guide 1%–3% reaffirmed.",
        raw_text=INFY_RESULTS_RAW,
    )

    # --- Required: management_change ---
    add(
        "TCS",
        filed_at=ts(0, 9, 5),
        title="Appointment of Chief Financial Officer",
        category="management_change",
        materiality="high",
        summary="Board appoints Ananya Krishnan as CFO effective 1 Dec 2025; outgoing CFO retires.",
        raw_text=TCS_MGMT_RAW,
    )

    # --- Broader taxonomy coverage ---
    add(
        "RELIANCE",
        filed_at=ts(2, 11, 20),
        title="Unaudited Financial Results — Q2 FY26",
        category="results",
        materiality="high",
        summary="O2C margins soft; Retail and Jio steady. Consolidated PAT up YoY.",
        raw_text=(
            "RELIANCE INDUSTRIES — Q2 FY26 consolidated (₹ cr)\n"
            "Metric            Q2 FY26    Q1 FY26    Q2 FY25\n"
            "Revenue           258,420    253,100    238,400\n"
            "EBITDA             43,210     43,820     41,100\n"
            "PBT                22,150     21,970     20,860\n"
            "PAT                18,540     18,320     17,330\n"
        ),
    )
    add(
        "HDFCBANK",
        filed_at=ts(3, 16, 40),
        title="Interim Dividend Declared",
        category="dividend",
        materiality="medium",
        summary="Interim dividend ₹7.50/share; record date notified.",
        raw_text="Board declares interim dividend of ₹7.50 per equity share. Record date: 14 Nov 2025.",
    )
    add(
        "BHARTIARTL",
        filed_at=ts(1, 8, 45),
        title="Acquisition of Additional Stake in Subsidiary",
        category="M&A",
        materiality="high",
        summary="Buys residual minority in Africa operating subsidiary for ~$210m cash.",
        raw_text="Bharti Airtel to acquire remaining minority interest in an African subsidiary for approximately USD 210 million, funded from internal accruals.",
    )
    add(
        "LT",
        filed_at=ts(0, 14, 20),
        title="Large Order Win — Energy Projects",
        category="press_release",
        materiality="high",
        summary="Wins ₹6,200 cr hydrocarbon order; booking expected in Q3.",
        raw_text="L&T has secured an order valued at approximately ₹6,200 crore in the hydrocarbon sector. The order will be booked in Q3 FY26.",
    )
    add(
        "SUNPHARMA",
        filed_at=ts(0, 17, 50),
        title="Update on Regulatory Matter — US Facility",
        category="litigation",
        materiality="high",
        summary="Form 483 observations received; remediation underway; no shipment halt disclosed.",
        raw_text="The Company received Form 483 observations at a US manufacturing facility. A remediation plan is underway. No halt on shipments has been communicated.",
    )
    add(
        "ITC",
        filed_at=ts(5, 15, 30),
        title="Board Approves Capacity Expansion — Foods",
        category="capex",
        materiality="medium",
        summary="₹1,850 cr approved for FMCG foods capacity over 24 months.",
        raw_text="Board approved capital expenditure of ₹1,850 crore for capacity expansion in the Foods business across two plants over the next 24 months.",
    )
    add(
        "ASIANPAINT",
        filed_at=ts(8, 16, 0),
        title="Unaudited Results — Q2 FY26",
        category="results",
        materiality="high",
        summary="Decorative volumes soft; margins compress YoY.",
        raw_text=(
            "ASIAN PAINTS — Q2 FY26 (₹ cr)\n"
            "Metric     Q2 FY26   Q1 FY26   Q2 FY25\n"
            "Revenue      8,920     9,030     8,610\n"
            "EBITDA       1,680     1,746     1,721\n"
            "PBT          1,420     1,481     1,446\n"
            "PAT          1,065     1,104     1,077\n"
        ),
    )
    add(
        "MARUTI",
        filed_at=ts(2, 12, 30),
        title="Schedule of Analyst / Institutional Investor Meet",
        category="investor_meetings",
        materiality="low",
        summary="One-on-ones scheduled; no UPSI to be shared.",
        raw_text="The Company will meet institutional investors on 5–6 Nov 2025. No unpublished price sensitive information will be shared.",
    )
    add(
        "TCS",
        filed_at=ts(4, 10, 0),
        title="Allotment of Equity Shares under ESOP",
        category="unclassified",
        materiality="low",
        summary="Routine ESOP allotment.",
        raw_text="Allotment of equity shares pursuant to exercise of stock options under the Company ESOP scheme. Immaterial dilution.",
    )
    add(
        "RELIANCE",
        filed_at=ts(6, 11, 15),
        title="Credit Rating Reaffirmed",
        category="credit_rating",
        materiality="medium",
        summary="Domestic agency reaffirms AAA/Stable on long-term instruments.",
        raw_text="Credit rating agency has reaffirmed AAA/Stable on the Company's long-term debt instruments.",
    )
    add(
        "HDFCBANK",
        filed_at=ts(7, 9, 0),
        title="Compliance Certificate — SEBI LODR",
        category="unclassified",
        materiality="low",
        summary="Routine quarterly compliance certificate.",
        raw_text="Submission of compliance certificate under SEBI (LODR) Regulations for the quarter.",
    )
    add(
        "INFY",
        filed_at=ts(2, 18, 10),
        title="Q2 FY26 Earnings Conference Call — Intimation",
        category="earnings_call",
        materiality="medium",
        summary="Earnings call transcript link to follow on IR site / screener.",
        raw_text="Intimation of earnings conference call for Q2 FY26 results. Dial-in and webcast details on the Company IR page.",
    )
    add(
        "ITC",
        filed_at=ts(9, 10, 45),
        title="Notice of Annual General Meeting",
        category="agm_egm",
        materiality="low",
        summary="AGM scheduled; e-voting window announced.",
        raw_text="Notice of Annual General Meeting. E-voting will open three days prior to the AGM.",
    )
    add(
        "BHARTIARTL",
        filed_at=ts(10, 12, 0),
        title="Issue of Commercial Paper",
        category="fund_raise",
        materiality="medium",
        summary="CP issuance for working-capital; within board-approved limits.",
        raw_text="The Company has allotted commercial paper aggregating ₹2,500 crore for working-capital purposes within existing board limits.",
    )

    return filings


def main() -> None:
    sb = get_supabase()
    ids = company_map(sb)
    filings = build_filings(ids)
    if not filings:
        print("No filings built", file=sys.stderr)
        sys.exit(1)

    # Replace prior seed snapshot for these companies (demo-friendly idempotency)
    company_ids = list({f["company_id"] for f in filings})
    sb.table("filings").delete().in_("company_id", company_ids).execute()
    res = sb.table("filings").insert(filings).execute()
    n = len(res.data or filings)
    cats = sorted({f["category"] for f in filings})
    print(f"filings inserted: {n}")
    print(f"categories: {', '.join(cats)}")
    print("done — filings snapshot cached in Supabase")


if __name__ == "__main__":
    main()
