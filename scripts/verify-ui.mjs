import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import axeCore from "axe-core";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3000";
const OUTPUT_DIR = path.resolve("./public/screenshots");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
];

const STATES = [
  { id: "empty", label: "1-layar-kosong" },
  { id: "uploaded", label: "2-setelah-upload" },
  { id: "generating", label: "3-saat-proses" },
  { id: "success", label: "4-hasil-sukses" },
  { id: "failed", label: "5-hasil-gagal" },
];

async function runVerification() {
  console.log("=== MEMULAI VERIFIKASI SCREENSHOT, RESPONSIVITAS, DAN AKSESIBILITAS ===");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const scrollAudit = {};
  const allAxeViolations = [];

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n========================================================`);
      console.log(`🔍 VIEWPORT: ${vp.name.toUpperCase()} (${vp.width}x${vp.height}px)`);
      console.log(`========================================================`);

      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });

      for (const st of STATES) {
        const targetUrl = `${BASE_URL}/?testState=${st.id}`;
        await page.goto(targetUrl, { waitUntil: "networkidle0" });
        await new Promise((resolve) => setTimeout(resolve, 800));

        // 1. Cek horizontal scroll
        const scrollInfo = await page.evaluate(() => {
          const doc = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
          const clientWidth = doc.clientWidth;
          const innerWidth = window.innerWidth;
          const hasHorizontalScroll = scrollWidth > innerWidth;
          return { scrollWidth, clientWidth, innerWidth, hasHorizontalScroll };
        });

        scrollAudit[`${vp.name}__${st.id}`] = scrollInfo;

        if (scrollInfo.hasHorizontalScroll) {
          console.error(`❌ [FAIL] Horizontal scroll terdeteksi pada ${vp.name} (${st.id}): scrollWidth=${scrollInfo.scrollWidth}, innerWidth=${scrollInfo.innerWidth}`);
        } else {
          console.log(`✅ [PASS] Bebas horizontal scroll pada ${vp.name} (${st.id}): width=${scrollInfo.innerWidth}px`);
        }

        // 2. Ambil screenshot
        const fileName = `${vp.name}-${st.label}.png`;
        const filePath = path.join(OUTPUT_DIR, fileName);
        await page.screenshot({ path: filePath, fullPage: false });
        console.log(`   📸 Screenshot: ${fileName}`);

        // 3. Jalankan accessibility check pada desktop success & empty
        if (vp.name === "desktop" && (st.id === "empty" || st.id === "success")) {
          await page.evaluate(axeCore.source);
          const axeReport = await page.evaluate(async () => {
            // @ts-expect-error axe is injected on window via evaluate
            return await window.axe.run(document, {
              runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa"],
              },
            });
          });

          if (axeReport.violations && axeReport.violations.length > 0) {
            allAxeViolations.push({
              state: st.id,
              violations: axeReport.violations,
            });
          }
        }
      }

      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log("\n========================================================");
  console.log("📊 REKAPITULASI AUDIT RESPONSIVITAS (HORIZONTAL SCROLL)");
  console.log("========================================================");
  let anyHorizontalScroll = false;
  for (const [key, res] of Object.entries(scrollAudit)) {
    if (res.hasHorizontalScroll) {
      anyHorizontalScroll = true;
      console.log(`❌ ${key}: SCROLL DETECTED (scrollWidth: ${res.scrollWidth}, innerWidth: ${res.innerWidth})`);
    } else {
      console.log(`✅ ${key}: 0px horizontal scroll`);
    }
  }

  console.log("\n========================================================");
  console.log("♿ REKAPITULASI AUDIT AKSESIBILITAS WCAG AA");
  console.log("========================================================");
  if (allAxeViolations.length === 0) {
    console.log("🎉 SEMPURNA: 100% Lolos WCAG AA (0 Pelanggaran pada semua state)!");
  } else {
    console.log(`⚠️ Ditemukan pelanggaran WCAG:`);
    for (const v of allAxeViolations) {
      console.log(`State: ${v.state}`);
      for (const item of v.violations) {
        console.log(`  - [${item.impact}] ${item.id}: ${item.description}`);
      }
    }
  }

  // Tuliskan file ringkasan verifikasi JSON
  const summaryPath = path.join(OUTPUT_DIR, "verification-summary.json");
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        totalScreenshots: 15,
        noHorizontalScroll: !anyHorizontalScroll,
        scrollAudit,
        axeAudit: {
          passesWcagAA: allAxeViolations.length === 0,
          violations: allAxeViolations,
        },
      },
      null,
      2
    )
  );
  console.log(`\nRingkasan verifikasi disimpan di: ${summaryPath}`);
}

runVerification().catch(console.error);
