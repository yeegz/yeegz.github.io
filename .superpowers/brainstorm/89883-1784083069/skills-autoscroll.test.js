const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'no-preference'
  });

  try {
    await page.goto('http://localhost:61963/?key=703cd1ef0f497c28b73f87d8cdf20d6ec7484cdf0c46885e42e59201afc8c626');
    await page.waitForTimeout(250);
    const before = await page.locator('.scroller').evaluateAll(nodes => nodes.map(node => node.scrollLeft));
    await page.waitForTimeout(1200);
    const after = await page.locator('.scroller').evaluateAll(nodes => nodes.map(node => node.scrollLeft));
    const deltas = after.map((value, index) => Math.abs(value - before[index]));

    if (deltas.some(delta => delta < 8)) {
      throw new Error(`Expected every resting lane to auto-scroll; observed deltas: ${deltas.join(', ')}`);
    }

    const firstLane = page.locator('.lane').first();
    await firstLane.hover();
    const hoverBefore = await page.locator('.scroller').evaluateAll(nodes => nodes.map(node => node.scrollLeft));
    await page.waitForTimeout(700);
    const hoverAfter = await page.locator('.scroller').evaluateAll(nodes => nodes.map(node => node.scrollLeft));
    const hoveredDelta = Math.abs(hoverAfter[0] - hoverBefore[0]);
    const otherDeltas = hoverAfter.slice(1).map((value, index) => Math.abs(value - hoverBefore[index + 1]));

    if (hoveredDelta > 2 || otherDeltas.some(delta => delta < 6)) {
      throw new Error(`Expected only the hovered lane to pause; hovered delta ${hoveredDelta}, other deltas ${otherDeltas.join(', ')}`);
    }

    const beforeArrow = hoverAfter[0];
    await firstLane.locator('.edge.next').click();
    await page.waitForTimeout(500);
    const afterArrow = await firstLane.locator('.scroller').evaluate(node => node.scrollLeft);
    if (Math.abs(afterArrow - beforeArrow) < 80) {
      throw new Error(`Expected the hovered lane's arrow to scroll it; observed delta ${Math.abs(afterArrow - beforeArrow)}`);
    }

    console.log(`PASS: resting lanes moved, the hovered lane paused alone, and its arrow scrolled manually.`);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
});
