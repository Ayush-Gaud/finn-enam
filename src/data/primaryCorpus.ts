import type { SeedDoc } from "@/lib/research/ingest";

/** Cached-first primary corpus so Pull always works offline of screener.in */
export const PRIMARY_CORPUS: SeedDoc[] = [
  {
    ticker: "INFY",
    name: "Infosys",
    sector: "IT Services",
    doc_type: "annual_report",
    period: "FY25",
    title: "Infosys Annual Report FY25 (seed)",
    source_url: "https://www.screener.in/company/INFY/",
    chunks: [
      {
        page: 12,
        content:
          "Infosys is a global digital services and consulting company. Segment mix: Financial Services ~31%, Retail ~15%, Communication ~12%, Energy/Utilities/Resources ~12%, Manufacturing ~14%, Hi-Tech ~8%, Life Sciences ~8%. Digital services (cloud, data/AI, experience) contribute over half of revenue.",
      },
      {
        page: 48,
        content:
          "FY25 revenue $19.3bn (+3.8% YoY CC). Operating margin 20.8%. Free cash flow $3.4bn. Cash & investments $4.1bn. Debt remains negligible. Dividend payout remained elevated with a buyback completed mid-year.",
      },
    ],
  },
  {
    ticker: "INFY",
    name: "Infosys",
    sector: "IT Services",
    doc_type: "concall_transcript",
    period: "Q4 FY25",
    title: "Infosys Q4 FY25 Earnings Call (seed)",
    source_url: "https://www.screener.in/company/INFY/",
    chunks: [
      {
        page: 1,
        content:
          "Management introduced FY26 revenue growth guidance of 1% to 3% in constant currency and said the outlook is cautiously constructive given client budget cycles. Operating margin band guided at 20% to 22%.",
      },
    ],
  },
  {
    ticker: "INFY",
    name: "Infosys",
    sector: "IT Services",
    doc_type: "concall_transcript",
    period: "Q1 FY26",
    title: "Infosys Q1 FY26 Earnings Call (seed)",
    source_url: "https://www.screener.in/company/INFY/",
    chunks: [
      {
        page: 2,
        content:
          "Q1 FY26 revenue grew 0.4% QoQ CC. Operating margin printed at 20.1%. Management attributed softness to discretionary spend pauses in financial services and delayed ramp of two large deals. FY26 CC growth guidance of 1%–3% and margin band 20%–22% were reiterated.",
      },
    ],
  },
  {
    ticker: "INFY",
    name: "Infosys",
    sector: "IT Services",
    doc_type: "concall_transcript",
    period: "Q2 FY26",
    title: "Infosys Q2 FY26 Earnings Call (seed)",
    source_url: "https://www.screener.in/company/INFY/",
    chunks: [
      {
        page: 2,
        content:
          "Q2 FY26 revenue grew 1.6% QoQ CC — sequential acceleration vs Q1. Operating margin 20.6%. Large-deal TCV $3.2bn, up QoQ. Management reaffirmed FY26 revenue growth guidance of 1% to 3% CC and margin band 20% to 22%, stating we are executing to our guidance.",
      },
      {
        page: 5,
        content:
          "Narrative vs numbers: management emphasises early signs of demand recovery while cumulative H1 growth remains near the bottom of the annual guide. Promised deal ramps from Q1 are partially visible in Q2 revenue but utilisation remains below peak.",
      },
    ],
  },
  {
    ticker: "INFY",
    name: "Infosys",
    sector: "IT Services",
    doc_type: "concall_transcript",
    period: "Q3 FY25",
    title: "Infosys Q3 FY25 Earnings Call (seed)",
    source_url: "https://www.screener.in/company/INFY/",
    chunks: [
      {
        page: 3,
        content:
          "Q3 FY25 revenue declined 1.1% QoQ CC. Management said discretionary projects were deferred and guided to a gradual improvement into FY26 rather than a sharp rebound.",
      },
    ],
  },
  {
    ticker: "TCS",
    name: "Tata Consultancy Services",
    sector: "IT Services",
    doc_type: "annual_report",
    period: "FY25",
    title: "TCS Annual Report FY25 (seed)",
    source_url: "https://www.screener.in/company/TCS/",
    chunks: [
      {
        page: 10,
        content:
          "TCS provides IT services, business solutions and consulting across BFSI, retail, manufacturing, communication and life sciences. BFSI remains the largest vertical. Geographic mix skewed to North America and Europe.",
      },
      {
        page: 40,
        content:
          "FY25 consolidated revenue grew mid-single digits. Operating margin stayed in the high teens to ~20% zone. Strong free cash conversion and consistent capital return via dividends and buybacks.",
      },
    ],
  },
  {
    ticker: "TCS",
    name: "Tata Consultancy Services",
    sector: "IT Services",
    doc_type: "concall_transcript",
    period: "Q2 FY26",
    title: "TCS Q2 FY26 Earnings Call (seed)",
    source_url: "https://www.screener.in/company/TCS/",
    chunks: [
      {
        page: 2,
        content:
          "Management highlighted deal TCV strength and said margin levers (pyramid, productivity, utilisation) remain intact. Q2 revenue growth was modest QoQ with EBIT margin stable. BFSI demand described as selective; manufacturing and energy stronger.",
      },
    ],
  },
  {
    ticker: "RELIANCE",
    name: "Reliance Industries",
    sector: "Energy / Conglomerate",
    doc_type: "annual_report",
    period: "FY25",
    title: "Reliance Annual Report FY25 (seed)",
    source_url: "https://www.screener.in/company/RELIANCE/",
    chunks: [
      {
        page: 15,
        content:
          "Reliance operates Oil-to-Chemicals (O2C), Oil & Gas, Retail, Digital Services (Jio), and new energy initiatives. Retail and Jio are primary growth engines while O2C remains the cash-flow backbone.",
      },
      {
        page: 55,
        content:
          "Consolidated net debt moderated YoY as operating cash flows from O2C and digital funded capex. Capex guidance remains elevated for new energy and retail store expansion.",
      },
    ],
  },
  {
    ticker: "RELIANCE",
    name: "Reliance Industries",
    sector: "Energy / Conglomerate",
    doc_type: "concall_transcript",
    period: "Q2 FY26",
    title: "Reliance Q2 FY26 Earnings Call (seed)",
    source_url: "https://www.screener.in/company/RELIANCE/",
    chunks: [
      {
        page: 3,
        content:
          "Management noted O2C margin softness on product cracks, while Jio ARPU and retail footfalls remained resilient. Capex for H1 tracked the full-year programme.",
      },
    ],
  },
  {
    ticker: "POLYCAB",
    name: "Polycab India",
    sector: "Cables / Electricals",
    yahoo_symbol: "POLYCAB.NS",
    doc_type: "annual_report",
    period: "FY25",
    title: "Polycab Annual Report FY25 (seed)",
    source_url: "https://www.screener.in/company/POLYCAB/",
    chunks: [
      {
        page: 8,
        content:
          "Polycab India is a leading wires and cables manufacturer with a growing FMEG (fast-moving electrical goods) portfolio. Cables & wires remain the dominant revenue contributor; FMEG and EPC contribute the balance. Distribution reach spans dealers and electricians nationwide.",
      },
      {
        page: 42,
        content:
          "FY25 revenue grew strongly on volume and realisation. EBITDA margin stayed in the mid-teens. Working capital intensity remains a focus given copper price volatility. Balance sheet stayed comfortably geared with internal accruals funding capacity expansion.",
      },
    ],
  },
  {
    ticker: "POLYCAB",
    name: "Polycab India",
    sector: "Cables / Electricals",
    yahoo_symbol: "POLYCAB.NS",
    doc_type: "concall_transcript",
    period: "Q1 FY26",
    title: "Polycab Q1 FY26 Earnings Call (seed)",
    source_url: "https://www.screener.in/company/POLYCAB/",
    chunks: [
      {
        page: 2,
        content:
          "Management guided to sustain double-digit volume growth in wires & cables for FY26 and indicated FMEG margin improvement initiatives. Capex for the year was reiterated toward capacity debottlenecking.",
      },
    ],
  },
  {
    ticker: "POLYCAB",
    name: "Polycab India",
    sector: "Cables / Electricals",
    doc_type: "concall_transcript",
    period: "Q2 FY26",
    title: "Polycab Q2 FY26 Earnings Call (seed)",
    source_url: "https://www.screener.in/company/POLYCAB/",
    chunks: [
      {
        page: 2,
        content:
          "Q2 FY26 wires & cables volumes grew high-teens YoY. Management said they remain on track versus the double-digit volume guidance. FMEG grew but margins trailed cables. Copper price pass-through was described as largely intact.",
      },
    ],
  },
  {
    ticker: "POLYCAB",
    name: "Polycab India",
    sector: "Cables / Electricals",
    doc_type: "concall_transcript",
    period: "Q4 FY25",
    title: "Polycab Q4 FY25 Earnings Call (seed)",
    source_url: "https://www.screener.in/company/POLYCAB/",
    chunks: [
      {
        page: 1,
        content:
          "On the Q4 FY25 call, management set the tone for FY26 with an ambition of sustaining industry-leading volume growth in cables and improving FMEG profitability through mix and distribution.",
      },
    ],
  },
  {
    ticker: "POLYCAB",
    name: "Polycab India",
    sector: "Cables / Electricals",
    doc_type: "concall_transcript",
    period: "Q3 FY25",
    title: "Polycab Q3 FY25 Earnings Call (seed)",
    source_url: "https://www.screener.in/company/POLYCAB/",
    chunks: [
      {
        page: 2,
        content:
          "Q3 FY25 showed healthy cable demand from infra and real estate channels. Management highlighted dealer expansion and project wins but flagged near-term FMEG competitive intensity.",
      },
    ],
  },
];
