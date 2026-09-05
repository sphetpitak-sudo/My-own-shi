// Manual QA assist: viewport overflow + console errors + touch sizes + tab order.
// Run: node /tmp/qa-pass.mjs [baseUrl]  (dev server must be up)
// Manual QA assist: viewport overflow + console errors + touch sizes + tab order.
// Run: npm run dev -- --port 3101 &  node scripts/qa-viewport.mjs http://localhost:3101
// Public pages only (no auth): / and /auth/auth-code-error.
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
const require = createRequire(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "package.json"));
const { chromium } = require("playwright-core");

const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const VIEWPORTS = [320, 375, 390, 430, 768, 1024, 1440];
const PAGES = ["/", "/auth/auth-code-error"];

const browser = await chromium.launch();
const report = [];

for (const path of PAGES) {
  for (const w of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: w, height: 800 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push("pageerror: " + String(e.message).slice(0, 140)));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push("console: " + m.text().slice(0, 140));
    });
    await page.goto(base + path, { waitUntil: "networkidle", timeout: 45000 }).catch((e) => errors.push("goto: " + String(e).slice(0, 120)));
    await page.waitForTimeout(1200);

    const metrics = await page.evaluate(() => {
      const de = document.documentElement;
      const small = [];
      document.querySelectorAll("button, a, input, select, textarea, [role=button]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const visible = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
        if (!visible) return;
        if (r.width < 44 || r.height < 44) {
          small.push(`${el.tagName.toLowerCase()}(${(el.textContent || "").trim().slice(0, 18)}|${el.getAttribute("aria-label") || ""}) ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      });
      return { scrollW: de.scrollWidth, innerW: innerWidth, small: small.slice(0, 12), smallTotal: small.length };
    });

    // Keyboard: 12 Tabs from top, record focus ring presence.
    await page.keyboard.press("Tab");
    const tabStops = [];
    for (let i = 0; i < 12; i++) {
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const ring = cs.outlineWidth !== "0px" || cs.boxShadow !== "none";
        return `${el.tagName.toLowerCase()}[${(el.textContent || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "").trim().slice(0, 20)}] ring=${ring}`;
      });
      if (info) tabStops.push(info);
      await page.keyboard.press("Tab");
    }

    report.push({
      path, w,
      overflow: metrics.scrollW > metrics.innerW + 1 ? `OVERFLOW ${metrics.scrollW - metrics.innerW}px` : "ok",
      errors: errors.slice(0, 5),
      small: metrics.smallTotal,
      smallSample: metrics.small,
      tabStops: tabStops.length,
      noRing: tabStops.filter((t) => t.endsWith("ring=false")).slice(0, 4),
    });
    await page.close();
  }
}
await browser.close();
console.log(JSON.stringify(report, null, 1));
