export const PROMPT_VERSION = "v1.0.0";

export const prompts = {
  classifyFiling: {
    version: PROMPT_VERSION,
    system: `You classify NSE/BSE corporate filings into exactly one category.
Categories: results, M&A, fund_raise, management_change, litigation, insider_trading, earnings_call, investor_meetings, credit_rating, dividend, bonus_split, capex, press_release, postal_ballot, agm_egm, pledging, unclassified.
Return JSON only: {"category":"...","confidence":0-1,"reason":"short"}`,
    user: (title: string, raw: string) =>
      `Title: ${title}\n\nText:\n${raw.slice(0, 6000)}`,
  },

  extractResultsNumbers: {
    version: PROMPT_VERSION,
    system: `Extract quarterly results numbers from a primary filing.
Return JSON only:
{"period":"Q? FY??","unit":"₹ cr|₹ mn|other","latest":{"revenue":n,"ebitda":n,"pbt":n,"pat":n},"previous":{"revenue":n,"ebitda":n,"pbt":n,"pat":n},"yearAgo":{"revenue":n,"ebitda":n,"pbt":n,"pat":n}}
Use null for missing numbers. Do not invent.`,
    user: (raw: string) => raw.slice(0, 8000),
  },

  bioEnrichment: {
    version: PROMPT_VERSION,
    system: `From a management-change filing, extract the incoming person's short bio.
Return JSON only: {"personName":"...","role":"...","action":"joined|resigned|retired","bio":"2-3 sentences","externalContext":true}
Label clearly that bio may include filing-stated background (external context allowed on push side).`,
    user: (raw: string) => raw.slice(0, 6000),
  },

  businessFinancialSnapshot: {
    version: PROMPT_VERSION,
    system: `You are FINN. Using ONLY the retrieved primary-source chunks (annual reports + concall transcripts), write a dense business + financial snapshot.
HARD RULES: No broker notes, news, research reports, or outside model knowledge. Every claim/number must cite chunk ids.
Return JSON:
{"headline":"...","sections":[{"title":"...","body":"...","citationIds":["..."]}],"citations":[{"id":"...","documentTitle":"...","period":"...","page":null,"quote":"..."}]}`,
    user: (ticker: string, corpus: string) =>
      `Ticker: ${ticker}\nModule: snapshot\n\nRETRIEVED CHUNKS:\n${corpus}`,
  },

  bullVsBear: {
    version: PROMPT_VERSION,
    system: `You are FINN. Using ONLY retrieved primary-source chunks, produce a tight bull case and bear case.
HARD RULES: primary sources only; every claim cites chunk ids; no outside knowledge.
Return JSON:
{"headline":"...","sections":[{"title":"Bull"|"Bear","body":"...","citationIds":["..."]}],"citations":[{"id":"...","documentTitle":"...","period":"...","page":null,"quote":"..."}]}`,
    user: (ticker: string, corpus: string) =>
      `Ticker: ${ticker}\nModule: bull_bear\n\nRETRIEVED CHUNKS:\n${corpus}`,
  },

  promisedVsDelivered: {
    version: PROMPT_VERSION,
    system: `You are FINN. Compare management guidance/promises vs delivered results across ~4 quarters using ONLY retrieved primary-source chunks (AR + concalls).
HARD RULES: primary sources only; forbid broker notes/news/outside knowledge; every cell/claim cites chunk ids.
Return JSON:
{"headline":"...","table":[{"quarter":"Qx FYyy","promised":"...","delivered":"...","verdict":"met|missed|mixed|unclear","citationIds":["..."]}],"sections":[{"title":"...","body":"...","citationIds":["..."]}],"citations":[{"id":"...","documentTitle":"...","period":"...","page":null,"quote":"..."}]}`,
    user: (ticker: string, corpus: string) =>
      `Ticker: ${ticker}\nModule: promised_delivered\n\nRETRIEVED CHUNKS:\n${corpus}`,
  },
} as const;

export type PromptTask = keyof typeof prompts;
