import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.resolve('docs/ui-after');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const viewports = [
  { name: '360', width: 360, height: 780, isMobile: true },
  { name: '390', width: 390, height: 844, isMobile: true },
  { name: '430', width: 430, height: 932, isMobile: true },
  { name: '768', width: 768, height: 1024, isMobile: true },
  { name: '1024', width: 1024, height: 768, isMobile: false },
  { name: '1440', width: 1440, height: 900, isMobile: false },
];

const states = [
  { name: 'empty', query: '' },
  { name: 'uploaded', query: '?testState=uploaded' },
  { name: 'generating', query: '?testState=generating' },
  { name: 'success', query: '?testState=success' },
  { name: 'failed', query: '?testState=failed' },
];

async function run() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const auditLog = {
    viewports: {},
    touchTargets: {},
  };

  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height });

    // 1. Capture base viewport (empty)
    const url = `http://localhost:3000/`;
    await page.goto(url, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 600));

    const metrics = await page.evaluate(() => {
      const docWidth = document.documentElement.offsetWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      return {
        docWidth,
        scrollWidth,
        hasHorizontalScroll: scrollWidth > docWidth,
      };
    });

    auditLog.viewports[vp.name] = metrics;
    const baseImg = path.join(outDir, `viewport-${vp.name}.png`);
    await page.screenshot({ path: baseImg });
    console.log(`[Viewport ${vp.name}] scrollWidth=${metrics.scrollWidth}, docWidth=${metrics.docWidth}, hasScroll=${metrics.hasHorizontalScroll}`);

    // 2. Capture states for mobile (390) and desktop (1440)
    if (vp.name === '390' || vp.name === '1440') {
      for (const st of states) {
        const stateUrl = `http://localhost:3000/${st.query}`;
        await page.goto(stateUrl, { waitUntil: 'networkidle0' });
        await new Promise((r) => setTimeout(r, 800));

        const stateImg = path.join(outDir, `${vp.name}-${st.name}.png`);
        await page.screenshot({ path: stateImg });
        console.log(`  -> State [${vp.name}-${st.name}] captured`);

        // Audit touch targets on 390
        if (vp.name === '390' && st.name === 'empty') {
          const targetAudit = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, a, input[type="button"], [role="button"]'));
            const undersized = [];
            buttons.forEach((btn) => {
              const rect = btn.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                // Minimum touch target 44px in either dimension or >= 36px with padding
                if (rect.width < 32 || rect.height < 32) {
                  undersized.push({
                    text: btn.textContent?.trim().slice(0, 30),
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                  });
                }
              }
            });
            return { totalButtons: buttons.length, undersized };
          });
          auditLog.touchTargets['390'] = targetAudit;
        }
      }
    }

    await page.close();
  }

  await browser.close();
  console.log('\n--- AUDIT SUMMARY ---');
  console.log(JSON.stringify(auditLog, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
