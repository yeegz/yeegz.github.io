const { test, expect, devices } = require('@playwright/test');

/**
 * Guards the /work routes and the defects fixed alongside them.
 *
 * The homepage suite in approved-portfolio.spec.js is deliberately left alone;
 * this file only covers what is new. Every assertion here corresponds to a real
 * bug that existed, so a failure means a regression, not a style preference.
 */

const ROUTES = ['/work/', '/work/bupples/', '/work/adelante/', '/work/photoshoot/'];

test.describe('case-study routes', () => {
  for (const route of ROUTES) {
    test(`${route} renders a complete, well-formed page`, async ({ page }) => {
      const errors = [];
      const failed = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });

      await page.goto(route);
      await expect(page.locator('h1')).toHaveCount(1);
      expect(errors, 'uncaught runtime errors').toEqual([]);
      expect(failed, 'failed subresources').toEqual([]);

      // Headings must not skip a level.
      const levels = await page.evaluate(() =>
        [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => Number(h.tagName[1]))
      );
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i] - levels[i - 1], `heading jump ${levels[i - 1]}→${levels[i]}`).toBeLessThanOrEqual(1);
      }

      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      ).toBe(0);
    });
  }

  test('a case study is readable with JavaScript disabled', async ({ browser }) => {
    // The whole point of the rebuild: evidence must never live behind a script.
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/work/bupples/');
    await expect(page.locator('h1')).toHaveText('Bupples');
    await expect(page.locator('.cs-lead').first()).not.toBeEmpty();
    await expect(page.locator('.cs-challenge')).not.toHaveCount(0);
    await expect(page.locator('.cs-arch-group').first()).toBeVisible();
    await context.close();
  });

  test('the architecture diagram carries a text alternative', async ({ page }) => {
    await page.goto('/work/bupples/');
    const board = page.locator('.cs-arch-board');
    await expect(board).toHaveAttribute('role', 'img');
    const label = await board.getAttribute('aria-label');
    expect(label && label.length, 'aria-label on the diagram').toBeGreaterThan(40);
    // Every group must have carried its label and nodes through the renderer.
    const empties = await page.locator('.cs-arch-label').evaluateAll((ns) =>
      ns.filter((n) => !n.textContent.trim()).length
    );
    expect(empties, 'architecture groups rendered with no label').toBe(0);
  });

  test('in-page contents jumps land clear of the fixed header', async ({ page }) => {
    await page.goto('/work/bupples/');
    const link = page.locator('.cs-toc a').nth(3);
    const href = await link.getAttribute('href');
    await page.evaluate((h) => { window.location.hash = h; }, href);
    await page.waitForTimeout(400);
    const { top, obstruction } = await page.evaluate((h) => {
      const section = document.querySelector(h);
      const head = document.querySelector('.site-head');
      const toc = document.querySelector('.cs-toc');
      const fixedHead = head && getComputedStyle(head).position === 'fixed' ? head.getBoundingClientRect().bottom : 0;
      const stickyToc = toc && getComputedStyle(toc).position === 'sticky' ? toc.getBoundingClientRect().height : 0;
      return { top: section.querySelector('h2').getBoundingClientRect().top, obstruction: fixedHead + stickyToc };
    }, href);
    expect(top).toBeGreaterThanOrEqual(obstruction - 8);
  });

  test('no layout renders an empty cell', async ({ page }) => {
    // auto-fit derives its track count from the container width, so an item
    // count that does not divide evenly used to leave live tracks painted in
    // the rule colour. These containers must never be grid.
    await page.goto('/work/bupples/');
    const grids = await page.evaluate(() => {
      const out = [];
      for (const sel of ['.cs-facts', '.cs-grid', '.cs-arch-board', '.cs-decisions', '.cs-metrics', '.cs-flow-steps', '.cs-related']) {
        document.querySelectorAll(sel).forEach((el) => {
          if (getComputedStyle(el).display === 'grid') out.push(sel);
        });
      }
      return out;
    });
    expect(grids, 'containers still using auto-fit grid').toEqual([]);
  });

  test('phones get real navigation and comfortable targets', async ({ browser }) => {
    // Case pages do not load the homepage drawer, so .site-nav must stay
    // visible here rather than hiding behind a hamburger that does not exist.
    const context = await browser.newContext({ ...devices['iPhone 13'] });
    const page = await context.newPage();
    await page.goto('/work/bupples/');
    await expect(page.locator('.cs-head .site-nav')).toBeVisible();
    expect(await page.locator('.cs-head .site-nav a').count()).toBeGreaterThanOrEqual(5);

    const undersized = await page.locator('a, button').evaluateAll((els) =>
      els
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && (r.height < 24 || r.width < 24);
        })
        .map((e) => (e.textContent || '').trim().slice(0, 24))
    );
    expect(undersized, 'targets below the 24px WCAG 2.2 minimum').toEqual([]);
    await context.close();
  });

  test('the site signature devices are present, not a generic article', async ({ page }) => {
    await page.goto('/work/bupples/');
    // Outlined ghost numerals, the measuring rail with its accent spark, and
    // the registration crosses — the devices that make this the same site.
    expect(await page.locator('.cs-ghost').count()).toBeGreaterThan(5);
    expect(await page.locator('.sec-rail').count()).toBeGreaterThan(5);
    expect(await page.locator('.sec-rail-spark').first()).toBeTruthy();
    expect(await page.locator('.cs-hero .reg').count()).toBe(2);

    const ghost = page.locator('.cs-ghost').first();
    expect(await ghost.evaluate((n) => getComputedStyle(n).webkitTextStrokeWidth)).toBe('1px');
    expect(await ghost.evaluate((n) => getComputedStyle(n).color)).toBe('rgba(0, 0, 0, 0)');

    // The serif-italic drop line is the most distinctive move in the design.
    const em = page.locator('.cs-sec-title em').first();
    expect(await em.evaluate((n) => getComputedStyle(n).fontStyle)).toBe('italic');
    expect(await em.evaluate((n) => getComputedStyle(n).display)).toBe('block');
  });

  test('scroll reveals never strand a section invisible', async ({ page }) => {
    // A contents-bar anchor jumps instantly. Anything the jump skipped over
    // registers no intersecting frame, so without a compensating rootMargin
    // those sections stayed at opacity 0 for anyone who scrolled back up.
    await page.goto('/work/bupples/');
    await page.waitForTimeout(500);
    await page.locator('.cs-toc a').last().click();
    await page.waitForTimeout(900);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(900);

    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll('[data-reveal]')].filter((e) => getComputedStyle(e).opacity === '0').length
    );
    expect(hidden, 'blocks left invisible after an anchor jump').toBe(0);
  });

  test('reveals never hide content when the script cannot run', async ({ browser }) => {
    // .cs-anim is what hides a block, and only JS sets it.
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/work/bupples/');
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll('[data-reveal]')].filter((e) => getComputedStyle(e).opacity === '0').length
    );
    expect(hidden).toBe(0);
    await context.close();
  });

  test('reduced motion shows everything immediately', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/work/bupples/');
    await page.waitForTimeout(500);
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll('[data-reveal]')].filter((e) => getComputedStyle(e).opacity === '0').length
    );
    expect(hidden, 'content withheld under prefers-reduced-motion').toBe(0);
    await context.close();
  });

  test('every store link points at a real store listing', async ({ page }) => {
    await page.goto('/work/bupples/');
    const stores = page.locator('.cs-link-store');
    expect(await stores.count()).toBeGreaterThanOrEqual(1);
    for (const href of await stores.evaluateAll((as) => as.map((a) => a.getAttribute('href')))) {
      expect(href).toMatch(/apps\.apple\.com|play\.google\.com/);
    }
  });
});

test.describe('homepage repairs', () => {
  test('desktop can reach every project destination without opening a modal', async ({ page }) => {
    // .work-links was display:none above 1024px, so on desktop the live app,
    // the stores, the repos and the playable build were unreachable.
    await page.goto('/');
    await page.locator('#work').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const displays = await page.locator('.work-links').evaluateAll((ns) => ns.map((n) => getComputedStyle(n).display));
    expect(displays.length).toBeGreaterThan(0);
    expect(displays.every((d) => d !== 'none'), 'a card hid its destinations').toBe(true);

    const links = page.locator('.work-links a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const a = links.nth(i);
      await a.scrollIntoViewIfNeeded();
      await page.waitForTimeout(120);
      const reachable = await a.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !!top && (top === el || el.contains(top));
      });
      expect(reachable, `${await a.getAttribute('href')} is buried under the opener overlay`).toBe(true);
    }
  });

  test('the education tablist is fully keyboard operable', async ({ page }) => {
    // Roving tabindex was applied without arrow-key handling, so the entire
    // Foundation chapter was unreachable without a mouse.
    await page.goto('/');
    await page.locator('#education').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const degree = (await page.locator('#eduTitle').textContent()).trim();
    await page.locator('#chapTabDegree').focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    expect((await page.locator('#eduTitle').textContent()).trim()).not.toBe(degree);
    expect(await page.evaluate(() => document.activeElement.id)).toBe('chapTabFoundation');
    await expect(page.locator('#institutionLockup')).toContainText('Multimedia');

    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);
    expect((await page.locator('#eduTitle').textContent()).trim()).toBe(degree);

    await page.keyboard.press('End');
    expect(await page.evaluate(() => document.activeElement.id)).toBe('chapTabFoundation');
    await page.keyboard.press('Home');
    expect(await page.evaluate(() => document.activeElement.id)).toBe('chapTabDegree');
  });

  test('skill-lane captions never collide with the marquee on touch', async ({ browser }) => {
    // The caption sat inside the marquee's band and the scroller's z-index:1
    // painted the type straight over it. On touch the caption is always shown,
    // so the collision was permanent.
    const context = await browser.newContext({ ...devices['iPhone 13'] });
    const page = await context.newPage();
    await page.goto('/');
    await page.locator('#skills').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    const lanes = await page.locator('[data-skill-lane]').evaluateAll((els) =>
      els.map((lane) => {
        const note = lane.querySelector('.lane-note');
        const scroller = lane.querySelector('.skill-scroller');
        const range = document.createRange();
        range.selectNodeContents(note);
        const n = range.getBoundingClientRect();
        const s = scroller.getBoundingClientRect();
        const l = lane.getBoundingClientRect();
        return {
          shown: getComputedStyle(note).opacity !== '0',
          overlap: Math.min(n.bottom, s.bottom) - Math.max(n.top, s.top),
          clipped: n.bottom - l.bottom,
        };
      })
    );
    expect(lanes.length).toBeGreaterThan(0);
    for (const lane of lanes) {
      expect(lane.shown, 'caption hidden on touch').toBe(true);
      expect(lane.overlap, 'caption overlaps the marquee').toBeLessThanOrEqual(0);
      expect(lane.clipped, 'caption clipped by the lane').toBeLessThanOrEqual(0);
    }
    await context.close();
  });

  test('each flagship links to its case study', async ({ page }) => {
    await page.goto('/');
    for (const slug of ['bupples', 'adelante', 'photoshoot']) {
      await expect(page.locator(`.work-study a[href="work/${slug}/"]`)).toHaveCount(1);
    }
  });
});

test('content passes schema validation', async () => {
  const { execFileSync } = require('child_process');
  const out = execFileSync('node', ['tools/build.mjs', '--check'], { encoding: 'utf8' });
  expect(out).toContain('content valid');
});
