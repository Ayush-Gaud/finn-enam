import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, "..", "docs", "screens");
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

async function shot(name, url, waitMs = 2000) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(waitMs);
  await page.screenshot({ path: path.join(out, name), fullPage: false });
}

await shot("feed.png", "http://localhost:3000/feed", 2500);
await shot("alerts.png", "http://localhost:3000/alerts", 2500);

await page.goto("http://localhost:3000/research", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(600);
await page.fill("input", "INFY");
await page.getByRole("button", { name: /Run research/i }).click();
await page.waitForTimeout(4500);
await page.screenshot({ path: path.join(out, "research.png"), fullPage: false });
await page.screenshot({ path: path.join(out, "research-infy.png"), fullPage: false });

await page.goto("http://localhost:3000/feed", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
const fonts = await page.evaluate(() => {
  const check = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const family = getComputedStyle(el).fontFamily;
    const primary = family.split(",")[0].replace(/["']/g, "").trim();
    return { primary, text: (el.textContent || "").slice(0, 36) };
  };
  return {
    brand: check("header h1"),
    heading: check("main h2"),
    title: check("main article h3"),
    body: check("main article p"),
  };
});
console.log(JSON.stringify(fonts, null, 2));
const bad = Object.entries(fonts).filter(([, v]) => v && !/^GeistSans$/i.test(v.primary));
if (bad.length) {
  console.error("FONT_FAIL", bad);
  process.exit(1);
}
console.log("FONT_OK");
await browser.close();
