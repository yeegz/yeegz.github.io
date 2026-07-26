const { test, expect } = require('@playwright/test');

test('portfolio boots without uncaught runtime errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.waitForTimeout(250);
  expect(errors).toEqual([]);
});

test('the h1 announces the name, not the easter egg, and the role line is readable', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#siteLoader')).toHaveAttribute('aria-hidden', 'true', { timeout: 5200 });
  const state = await page.evaluate(() => ({
    nmLastRole: document.getElementById('nmLast')?.getAttribute('role'),
    nmLastLabel: document.getElementById('nmLast')?.getAttribute('aria-label'),
    roleHidden: document.getElementById('roleTop')?.getAttribute('aria-hidden'),
    announced: document.querySelector('.hm-role .vh[aria-live]')?.textContent || ''
  }));
  expect(state.nmLastRole).toBeNull();
  expect(state.nmLastLabel).toBeNull();
  expect(state.roleHidden).toBe('true');
  expect(state.announced).toContain('Mobile & Full-Stack Developer');
});

test('the loader always lifts, even if nothing else runs', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#siteLoader')).toHaveAttribute('aria-hidden', 'true', { timeout: 5200 });
});

test('desktop navigation becomes visible after the entrance', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#siteLoader')).toHaveAttribute('aria-hidden', 'true', { timeout: 3500 });
  await expect(page.locator('#siteHead')).toHaveCSS('opacity', '1', { timeout: 3500 });
});

test('desktop landing keeps the full name and niche figure visible before scrolling', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#siteLoader')).toHaveAttribute('aria-hidden', 'true', { timeout: 3500 });
  const state = await page.evaluate(() => {
    const panel = document.querySelector('#aboutPanel');
    const first = document.querySelector('#nmFirst').getBoundingClientRect();
    const last = document.querySelector('#nmLast').getBoundingClientRect();
    const figure = document.querySelector('#portraitWrap').getBoundingClientRect();
    const overlap = (a, b) => ({
      x: Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)),
      y: Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
    });
    const firstOverlap = overlap(first, figure);
    const lastOverlap = overlap(last, figure);
    return {
      scrollY,
      panelOpacity: Number(getComputedStyle(panel).opacity),
      firstOpacity: Number(getComputedStyle(document.querySelector('#nmFirst')).opacity),
      lastOpacity: Number(getComputedStyle(document.querySelector('#nmLast')).opacity),
      figureOverlap: Math.max(firstOverlap.x * firstOverlap.y, lastOverlap.x * lastOverlap.y)
    };
  });
  expect(state.scrollY).toBe(0);
  expect(state.panelOpacity).toBeLessThan(0.05);
  expect(state.firstOpacity).toBeGreaterThan(0.95);
  expect(state.lastOpacity).toBeGreaterThan(0.95);
  expect(state.figureOverlap).toBeGreaterThan(1200);
});

/* The figure has to sit in the step of the name — measured against the box it
   is actually positioned in, not against the name's own offset parent. */
const nicheError = (page) => page.evaluate(() => {
  const first = document.querySelector('#nmFirst');
  const figure = document.querySelector('#portraitWrap');
  const stage = figure.offsetParent || document.querySelector('.hero-stage');
  const fontSize = parseFloat(getComputedStyle(first).fontSize);
  const expected = first.getBoundingClientRect().right - stage.getBoundingClientRect().left - fontSize * 0.18;
  return Math.abs(figure.getBoundingClientRect().left - stage.getBoundingClientRect().left - expected);
});

test('dotted figure realigns when the display font finishes loading', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    document.querySelector('#portraitWrap').style.setProperty('--niche-x', '120px');
    document.fonts.dispatchEvent(new Event('loadingdone'));
  });
  await page.waitForTimeout(260);
  expect(await nicheError(page)).toBeLessThan(2);
});

test('the figure stays seated in the name at every viewport, and while resizing', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2600);
  for (const size of [
    { width: 1440, height: 900 }, { width: 1180, height: 820 }, { width: 1024, height: 1366 },
    { width: 900, height: 700 }, { width: 768, height: 1024 }, { width: 430, height: 932 },
    { width: 375, height: 667 }, { width: 320, height: 568 }, { width: 1920, height: 1080 }
  ]) {
    await page.setViewportSize(size);
    // one frame after the resize, before any debounce could have run
    await page.waitForTimeout(60);
    expect(await nicheError(page), `mid-resize at ${size.width}x${size.height}`).toBeLessThan(2);
    await page.waitForTimeout(500);
    expect(await nicheError(page), `settled at ${size.width}x${size.height}`).toBeLessThan(2);
  }
});

test('desktop identity render completes without an excessive pinned scroll distance', async ({ page }) => {
  await page.goto('/');
  const pinnedViewports = await page.evaluate(() => {
    const pin = document.querySelector('#identityPin');
    const trigger = window.ScrollTrigger?.getAll().find(item => item.trigger === pin && item.pin);
    return trigger ? (trigger.end - trigger.start) / innerHeight : null;
  });
  expect(pinnedViewports).not.toBeNull();
  expect(pinnedViewports).toBeLessThanOrEqual(1.5);
});

test('resume-synced portfolio structure is present', async ({ page }) => {
  await page.goto('/');
  // Résumé order, résumé count.
  await expect(page.locator('#work .work-name')).toHaveText([
    'Bupples', 'Adelante', 'Photoshoot', 'Tajweed', 'Fallen Asteri'
  ]);
  await expect(page.locator('#work .work-status.is-closed')).toHaveCount(1);
  await expect(page.locator('#work .sec-tag')).toContainText('05');
  await expect(page.locator('#work')).not.toContainText('Task Management App');
  await expect(page.locator('#skills [data-skill-lane]')).toHaveCount(5);
  await expect(page.locator('#education')).toContainText('Sunway University');
  await expect(page.locator('#education')).toContainText('Multimedia University');
  await expect(page.locator('#experience')).toContainText('Digital Marketing Executive');
  await expect(page.locator('#experience')).not.toContainText('Freelance Software Engineer');
  // The word the owner asked to be gone, everywhere it used to hide.
  const source = await page.content();
  expect(source.toLowerCase()).not.toContain('freelance');
  expect(source).not.toContain('Client apps');
  expect(await page.title()).toContain('Mobile & Full-Stack Developer');
  await expect(page.locator('#identity')).toContainText('Mobile');
  const workControlStyle = await page.locator('#work .work-link').first().evaluate(node => ({
    background: getComputedStyle(node).backgroundColor,
    border: getComputedStyle(node).borderTopWidth
  }));
  expect(workControlStyle).toEqual({ background: 'rgba(0, 0, 0, 0)', border: '0px' });
});

test('desktop identity is the approved photo-left copy-right composition', async ({ page }) => {
  await page.goto('/');
  const photo = page.locator('#portraitSlot');
  const copy = page.locator('.about-body');
  await photo.scrollIntoViewIfNeeded();
  const [photoBox, copyBox] = await Promise.all([photo.boundingBox(), copy.boundingBox()]);
  expect(photoBox.width).toBeLessThan(560);
  expect(photoBox.x).toBeLessThan(copyBox.x);
  await expect(page.locator('#gardenImg')).toHaveAttribute('src', /identity-photo/);
});

test('desktop identity morph resolves to a visible photo instead of an empty canvas', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.portrait-canvas');
  await page.evaluate(() => window.scrollTo({ top: 1650, behavior: 'instant' }));
  await page.waitForTimeout(1400);
  const layers = await page.evaluate(() => ({
    portrait: Number(getComputedStyle(document.querySelector('#portraitWrap')).zIndex),
    panel: Number(getComputedStyle(document.querySelector('#aboutPanel')).zIndex)
  }));
  expect(layers.portrait).toBeGreaterThan(layers.panel);
  const canvasMetrics = await page.locator('.portrait-canvas').evaluate(canvas => {
    const { width, height } = canvas;
    const pixels = canvas.getContext('2d').getImageData(0, 0, width, height).data;
    let visible = 0, light = 0, colour = 0, luminance = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] <= 20) continue;
      visible++;
      const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      luminance += luma;
      if (luma > 35) light++;
      if (Math.max(r, g, b) - Math.min(r, g, b) > 12) colour++;
    }
    return { visible, light, colour, meanLuminance: visible ? luminance / visible : 0 };
  });
  expect(canvasMetrics.visible).toBeGreaterThan(20000);
  expect(canvasMetrics.light).toBeGreaterThan(20000);
  expect(canvasMetrics.colour).toBeGreaterThan(20000);
  expect(canvasMetrics.meanLuminance).toBeGreaterThan(45);
});

test('cursor tracks the pointer exactly and expands with an action verb', async ({ page }) => {
  await page.goto('/');
  await page.mouse.move(840, 520);
  await page.waitForTimeout(100);
  const ring = page.locator('#cursorRing');
  const box = await ring.boundingBox();
  expect(Math.abs(box.x + box.width / 2 - 840)).toBeLessThan(3);
  expect(Math.abs(box.y + box.height / 2 - 520)).toBeLessThan(3);
  await page.locator('[data-cursor="SCROLL"]').first().hover();
  await expect(page.locator('#cursorLabel')).toHaveText('SCROLL');
});

test('expanded cursor dots ride the inner edge of the action disc', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#siteLoader')).toHaveAttribute('aria-hidden', 'true', { timeout: 3500 });
  await page.locator('#themeToggle').hover();
  await expect(page.locator('html')).toHaveClass(/\bcur-view\b/);
  await page.waitForTimeout(420);
  const geometry = await page.evaluate(() => {
    const ring = document.querySelector('#cursorRing').getBoundingClientRect();
    const dotsNode = document.querySelector('.ring-dots');
    const circle = dotsNode.querySelector('circle');
    const discNode = document.querySelector('.cursor-disc');
    const dots = dotsNode.getBoundingClientRect();
    const disc = discNode.getBoundingClientRect();
    const dotsStyle = getComputedStyle(dotsNode);
    const circleStyle = getComputedStyle(circle);
    const discStyle = getComputedStyle(discNode);
    return {
      ring: { x: ring.x, y: ring.y, width: ring.width, height: ring.height },
      dots: { x: dots.x, y: dots.y, width: dots.width, height: dots.height },
      disc: { x: disc.x, y: disc.y, width: disc.width, height: disc.height },
      style: {
        transform: dotsStyle.transform,
        opacity: Number(dotsStyle.opacity),
        dashArray: circleStyle.strokeDasharray,
        dashOffset: circleStyle.strokeDashoffset,
        stroke: dotsStyle.stroke,
        disc: discStyle.backgroundColor,
        dotsZ: Number(dotsStyle.zIndex),
        discZ: Number(discStyle.zIndex)
      }
    };
  });
  const ringCenter = {
    x: geometry.ring.x + geometry.ring.width / 2,
    y: geometry.ring.y + geometry.ring.height / 2
  };
  const dotsCenter = {
    x: geometry.dots.x + geometry.dots.width / 2,
    y: geometry.dots.y + geometry.dots.height / 2
  };
  expect(Math.abs(dotsCenter.x - ringCenter.x)).toBeLessThan(2);
  expect(Math.abs(dotsCenter.y - ringCenter.y)).toBeLessThan(2);
  // The dotted circle spans 92% of the dots box; it must sit fully INSIDE the
  // filled disc, hugging its inner edge (a 2-8px inset all around).
  const dotCircleDiameter = geometry.dots.width * 0.92;
  const insetFromDiscEdge = (geometry.disc.width - dotCircleDiameter) / 2;
  expect(insetFromDiscEdge).toBeGreaterThan(2);
  expect(insetFromDiscEdge).toBeLessThan(8);
  expect(geometry.dots.width).toBeLessThan(geometry.ring.width);
  expect(geometry.style.transform).toBe('none');
  expect(geometry.style.opacity).toBeGreaterThan(0.4);
  expect(geometry.style.dashArray).not.toBe('none');
  expect(geometry.style.stroke).not.toBe(geometry.style.disc);
  expect(geometry.style.dotsZ).toBeGreaterThan(geometry.style.discZ);
  await page.waitForTimeout(180);
  const nextDashOffset = await page.locator('.ring-dots circle').evaluate(node => getComputedStyle(node).strokeDashoffset);
  expect(nextDashOffset).not.toBe(geometry.style.dashOffset);
});

test('fine-pointer tablet windows keep the custom cursor enabled', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 820, height: 1000 } });
  const page = await context.newPage();
  await page.goto('/');
  await page.mouse.move(520, 420);
  await expect(page.locator('html')).toHaveClass(/\bcur\b/);
  await expect(page.locator('#cursor')).toHaveClass(/\bis-visible\b/);
  await context.close();
});

test('custom cursor suppresses native pointers and clears stale action state', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-open-project="adelante"]').click();
  await expect(page.locator('#projectTheater')).toHaveAttribute('data-project', 'adelante');
  const deck = page.locator('#quoteDeck');
  await deck.hover();
  await expect(deck).toHaveCSS('cursor', 'none');
  await expect(page.locator('#cursorLabel')).toHaveText('SELECT');
  await page.mouse.down();
  await expect(page.locator('html')).toHaveClass(/\bcursor-press\b/);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.locator('html')).not.toHaveClass(/\bcursor-press\b/);
  await page.mouse.up();
});

test('every skill lane auto-scrolls while only the hovered lane pauses', async ({ page }) => {
  await page.goto('/');
  const lanes = page.locator('[data-skill-lane]');
  await lanes.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(220);
  const before = await page.locator('.skill-scroller').evaluateAll(nodes => nodes.map(node => node.scrollLeft));
  await lanes.first().hover();
  await page.waitForTimeout(320);
  const after = await page.locator('.skill-scroller').evaluateAll(nodes => nodes.map(node => node.scrollLeft));
  expect(Math.abs(after[0] - before[0])).toBeLessThan(2);
  expect(Math.abs(after[1] - before[1])).toBeGreaterThan(2);
  await expect(lanes.first().locator('.edge.next')).toBeVisible();
  const pausedAt = after[0];
  await lanes.first().locator('.edge.next').click();
  await page.waitForTimeout(420);
  const nudged = await lanes.first().locator('.skill-scroller').evaluate(node => node.scrollLeft);
  expect(Math.abs(nudged - pausedAt)).toBeGreaterThan(30);
  await page.mouse.move(12, 12);
  await page.waitForTimeout(650);
  const resumeAt = await lanes.first().locator('.skill-scroller').evaluate(node => node.scrollLeft);
  await page.waitForTimeout(320);
  const resumed = await lanes.first().locator('.skill-scroller').evaluate(node => node.scrollLeft);
  expect(Math.abs(resumed - resumeAt)).toBeGreaterThan(2);
});

test('contact email drags without a box and springs back into place', async ({ page }) => {
  await page.goto('/');
  const email = page.locator('#dragMail');
  await email.scrollIntoViewIfNeeded();
  await page.waitForTimeout(850);
  const before = await email.boundingBox();
  const style = await email.evaluate(node => ({ background: getComputedStyle(node).backgroundColor, border: getComputedStyle(node).borderTopWidth }));
  expect(style).toEqual({ background: 'rgba(0, 0, 0, 0)', border: '0px' });
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(before.x + before.width / 2 + 56, before.y + before.height / 2 + 12, { steps: 6 });
  const dragged = await email.boundingBox();
  expect(dragged.x - before.x).toBeGreaterThan(30);
  await page.mouse.up();
  await page.mouse.move(10, 10);
  await page.waitForTimeout(1100);
  const settled = await email.boundingBox();
  expect(Math.abs(settled.x - before.x)).toBeLessThan(2);
});

test('Bupples opens the approved three-screen overlap', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-open-project="bupples"]').click();
  await expect(page.locator('#projectTheater')).toHaveAttribute('open', '');
  await page.waitForTimeout(950);
  expect(await page.locator('#projectTheater').evaluate(dialog => dialog.matches(':modal'))).toBe(true);
  const [bodyBox, stageBox] = await Promise.all([
    page.locator('.theater-body').boundingBox(),
    page.locator('[data-project-stage="bupples"]').boundingBox()
  ]);
  expect(Math.abs(bodyBox.y - stageBox.y)).toBeLessThan(1);
  expect(Math.abs(bodyBox.height - stageBox.height)).toBeLessThan(1);
  await expect(page.locator('[data-project-stage="bupples"] .bupples-screen')).toHaveCount(3);
  const screens = await page.locator('[data-project-stage="bupples"] .bupples-screen').evaluateAll(nodes =>
    nodes.map(node => ({ z: Number(getComputedStyle(node).zIndex), box: node.getBoundingClientRect().toJSON() }))
  );
  expect(screens[1].z).toBeGreaterThan(screens[0].z);
  expect(screens[1].z).toBeGreaterThan(screens[2].z);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(await page.evaluate(() => document.documentElement.clientWidth));
});

test('project theater contains keyboard focus and closes with Escape', async ({ page }) => {
  await page.goto('/');
  const opener = page.locator('[data-open-project="bupples"]');
  await opener.click();
  const theater = page.locator('#projectTheater');
  await expect(theater.locator('[data-close-project]')).toBeFocused({ timeout: 2500 });
  expect(await page.locator('main').evaluate(node => node.inert)).toBe(true);
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('#projectTheater')))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(theater).not.toHaveAttribute('open', '', { timeout: 2500 });
  expect(await page.locator('main').evaluate(node => node.inert)).toBe(false);
  await expect(opener).toBeFocused();
});

test('project theater exposes clear previous, next, and exit controls', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-open-project="bupples"]').click();
  const theater = page.locator('#projectTheater');
  await expect(theater).toHaveAttribute('data-project', 'bupples');
  await expect(theater).toHaveClass(/\bis-open\b/, { timeout: 2500 });

  const previous = theater.locator('[data-project-nav="prev"]');
  const next = theater.locator('[data-project-nav="next"]');
  const exit = theater.locator('[data-close-project]');
  await expect(exit).toBeFocused({ timeout: 2500 });
  await expect(previous.locator('svg')).toHaveCount(1);
  await expect(next.locator('svg')).toHaveCount(1);
  for (const control of [previous, next, exit]) {
    await expect(control).toBeVisible();
    const box = await control.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(38);
    expect(box.height).toBeGreaterThanOrEqual(38);
  }
  for (const arrow of [previous.locator('svg'), next.locator('svg')]) {
    const box = await arrow.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(18);
    expect(box.height).toBeGreaterThanOrEqual(18);
  }

  await next.click();
  await expect(theater).toHaveAttribute('data-project', 'adelante', { timeout: 2000 });
  await previous.click();
  await expect(theater).toHaveAttribute('data-project', 'bupples', { timeout: 2000 });
  await exit.click();
  await expect(theater).not.toHaveAttribute('open', '', { timeout: 2500 });
});

test('Photoshoot viewfinder is pointer-passive and only the shutter captures', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-open-project="photoshoot"]').click();
  const theater = page.locator('#projectTheater');
  await expect(theater).toHaveClass(/\bis-open\b/, { timeout: 2500 });

  const viewfinder = page.locator('#viewfinder');
  const viewBox = await viewfinder.boundingBox();
  const before = await page.evaluate(() => ({
    source: document.querySelector('#viewImage').getAttribute('src'),
    count: document.querySelector('#shotCount').textContent,
    captures: document.querySelectorAll('#strip img').length
  }));
  await page.mouse.move(viewBox.x + viewBox.width * .25, viewBox.y + viewBox.height * .35);
  await page.mouse.move(viewBox.x + viewBox.width * .75, viewBox.y + viewBox.height * .65, { steps: 4 });
  const passiveState = await viewfinder.evaluate(node => ({
    pointerEvents: getComputedStyle(node).pointerEvents,
    vx: node.style.getPropertyValue('--vx'),
    vy: node.style.getPropertyValue('--vy'),
    lensDisplay: getComputedStyle(node.querySelector('.lens-point')).display
  }));
  expect(passiveState).toEqual({ pointerEvents: 'none', vx: '', vy: '', lensDisplay: 'none' });
  await page.mouse.down();
  await expect(page.locator('html')).not.toHaveClass(/\bcursor-press\b/);
  await page.mouse.up();
  const afterViewfinder = await page.evaluate(() => ({
    source: document.querySelector('#viewImage').getAttribute('src'),
    count: document.querySelector('#shotCount').textContent,
    captures: document.querySelectorAll('#strip img').length
  }));
  expect(afterViewfinder).toEqual(before);

  const shutter = page.locator('#shutter');
  await shutter.hover();
  await expect(page.locator('#cursorLabel')).toHaveText('SHOOT');
  await shutter.click();
  await expect(page.locator('#shotCount')).toHaveText('1 / 4 captured');
  await expect(page.locator('#strip img')).toHaveCount(1);
  await expect(page.locator('#viewImage')).not.toHaveAttribute('src', before.source);
});

test('project destinations use the approved URLs', async ({ page }) => {
  await page.goto('/');
  // Each destination exists twice: once in the theater stage, once on the
  // case card's phone link row.
  for (const href of [
    'https://bupples.web.app/',
    'https://github.com/yeegz/Bupples-showcase',
    'https://photoshoot-yeegz.web.app/',
    'https://github.com/yeegz/photoshoot',
    'https://github.com/yeegz/adelante-showcase',
    'https://yeegz.itch.io/fallenasteri',
    'https://github.com/yeegz/Fallen-Asteri',
    'https://tajweed-wine.vercel.app/'
  ]) await expect(page.locator(`a[href="${href}"]`)).toHaveCount(2);
});

test('light mode reaches every portfolio section but preserves authored project palettes', async ({ page }) => {
  await page.goto('/');
  await page.locator('#themeToggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  // Every section now cross-fades its background over .7s on theme change;
  // let the transition settle before sampling the resolved palette.
  await page.waitForTimeout(900);
  const titleGradient = await page.locator('.nm-in').first().evaluate(node => getComputedStyle(node).backgroundImage);
  expect(titleGradient).toContain('rgb(32, 35, 31)');
  const palette = await page.evaluate(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    return {
      identity: rootStyle.getPropertyValue('--identity-bg').trim(),
      experience: rootStyle.getPropertyValue('--experience-bg').trim(),
      contact: rootStyle.getPropertyValue('--contact-bg').trim(),
      skills: getComputedStyle(document.querySelector('#skills')).backgroundColor,
      education: getComputedStyle(document.querySelector('#education')).backgroundColor
    };
  });
  expect(palette).toEqual({
    identity: '#ece7dc', experience: '#e2e4dc', contact: '#e8e3d7',
    skills: 'rgb(231, 225, 213)', education: 'rgb(228, 223, 211)'
  });
  await page.locator('[data-open-project="bupples"]').click();
  await page.waitForTimeout(950);
  await expect(page.locator('[data-project-stage="bupples"]')).toHaveCSS('background-color', 'rgb(5, 11, 7)');
});

test('tablet keeps an accessible desktop theme control', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 820, height: 1000 } });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#themeToggle')).toBeVisible();
  await expect(page.locator('#navToggle')).toBeHidden();
  await page.locator('#themeToggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await context.close();
});

test('phone uses native pointer behavior, a usable menu, and a loaded identity photo', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#cursor')).toBeHidden();
  await page.locator('#navToggle').tap();
  await expect(page.locator('#mobileNav')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('.mnav-theme')).toBeVisible();
  await page.locator('[data-theme-choice="light"]').tap();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.waitForTimeout(750);
  const menuBackground = await page.locator('#mobileNav').evaluate(node => getComputedStyle(node).backgroundColor);
  expect(Number(menuBackground.match(/[\d.]+/)[0])).toBeGreaterThan(200);
  await page.locator('#identity').scrollIntoViewIfNeeded();
  await expect(page.locator('#gardenImg')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await context.close();
});

test('phone case cards are self-contained: no theater, links and new art on the card', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('/');
  const opener = page.locator('[data-open-project="bupples"]');
  const card = page.locator('.work-row').first();
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  // The card is no longer an opener on phones — and it is no longer a disabled
  // button wrapped around the copy either.
  await expect(opener).toBeHidden();
  expect(await page.locator('.work-link').first().evaluate(node => node.tagName)).toBe('DIV');
  expect(await page.locator('#work button[disabled]').count()).toBe(0);
  await page.evaluate(() => document.querySelector('[data-open-project="bupples"]').click());
  await page.waitForTimeout(600);
  await expect(page.locator('#projectTheater')).not.toHaveAttribute('open', '');
  // The project's real destinations sit on the card as comfortable buttons.
  const links = page.locator('.work-row .work-links a');
  expect(await links.count()).toBe(8);
  await expect(links.first()).toBeVisible();
  const tap = await links.first().boundingBox();
  expect(tap.height).toBeGreaterThanOrEqual(44);
  // The card media is the current screenshot set, not the retired one.
  await expect(page.locator('.work-row .phones img').first()).toHaveAttribute('src', /projects\/bupples/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await context.close();
});
