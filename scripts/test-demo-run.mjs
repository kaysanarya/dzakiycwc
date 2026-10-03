import puppeteer from 'puppeteer-core';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Click demo button in header
  console.log('1. Clicking demo button in header...');
  const demoBtn = await page.waitForSelector('button[aria-label="Muat produk demo sepatu"]');
  await demoBtn.click();
  await new Promise((r) => setTimeout(r, 1000));

  // Verify that outputs loaded and slider is visible
  const hasSlider = await page.evaluate(() => {
    const slider = document.querySelector('[role="slider"]');
    const variations = document.querySelectorAll('button[aria-label^="Pilih variasi"]');
    return {
      sliderPresent: Boolean(slider),
      variationsCount: variations.length,
    };
  });

  console.log('2. Demo Shoot State:', JSON.stringify(hasSlider, null, 2));

  // Test keyboard shortcut ArrowRight to switch variation
  console.log('3. Testing keyboard shortcut ArrowRight...');
  await page.keyboard.press('ArrowRight');
  await new Promise((r) => setTimeout(r, 500));

  const activeVariation = await page.evaluate(() => {
    const activeText = document.querySelector('.text-studio-accent.font-medium')?.textContent;
    return activeText;
  });
  console.log('Active variation angle:', activeVariation);

  // Take screenshot of demo shoot
  await page.screenshot({ path: 'docs/ui-after/demo-interactive-test.png' });
  console.log('Screenshot saved to docs/ui-after/demo-interactive-test.png');

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
