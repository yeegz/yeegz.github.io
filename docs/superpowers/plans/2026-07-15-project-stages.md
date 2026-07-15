# Immersive Project Stages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Task Management project with Adelante and turn Bupples, Photoshoot, Adelante, and Fallen Asteri into four distinct, interactive, near-full landscape project stages with correct live/repository links.

**Architecture:** Preserve the Selected Work archive as the navigation surface, then open a native modal `dialog` theater that retains scroll position and focus. A shared `ProjectTheater` controller owns open/close transitions, cleanup, keyboard behavior, project cursor context, and reduced-motion fallbacks; each project registers a small local interaction controller and its own fixed palette in `project-stages.css`.

**Tech Stack:** Semantic HTML, CSS custom properties and 3D transforms, vanilla JavaScript, native `dialog`, GSAP-compatible easing, Playwright Test, `sips` image processing.

**Execution Order:** Complete `2026-07-15-portfolio-shell-sections.md` first so the Playwright harness and `window.PortfolioCore` theme/cursor contract exist.

## Global Constraints

- Project order is Bupples, Photoshoot, Adelante, Fallen Asteri; Task Management App is absent.
- Each stage is near-full landscape on desktop, but mobile is a separately authored `100dvh` composition at `360`, `390`, and `430` CSS pixels.
- Mobile interactions never depend on hover: screen focus uses tap/focus, quote decks use tap, Photoshoot uses a real button, and Fallen Asteri enemies are at least `44×44` CSS-pixel tap targets.
- Bupples uses `IMG_4702.jpg` (Ask Pip), `IMG_4701.PNG` (profile), and `IMG_4700.PNG` (accent editor) in a three-screen overlap with the profile centered above the side screens.
- Bupples screens may pull outward on hover/focus but must never clip or create horizontal page overflow.
- Adelante uses a large `A`, a smooth orange arrow drawn only from its path start, alternating forward-language hover copy, and an unnumbered looping quote deck.
- Photoshoot uses all four supplied photos with focal positions `50% 56%`, `50% 35%`, `50% 37%`, and `50% 40%`; its viewfinder remains intentionally smaller.
- Photoshoot's primary action is exactly `https://photoshoot-yeegz.web.app/`, never `/app/`.
- Fallen Asteri uses a smaller game frame, crisp pixel enemies, click/tap deaths, XP and level feedback, and a refined sword cursor with no slash trail.
- Every project includes one compact capability rail and project-specific external actions.
- Open and close transitions preserve scroll position, restore focus, reset ephemeral state, and cannot strand the page after rapid input.
- Stage shells open immediately; project media keeps explicit dimensions and decodes behind a project-colored loading veil that clears independently with a `900 ms` hard timeout, preventing blank frames and layout shifts during scroll or stage entry.
- Project palettes remain fixed when the portfolio shell switches between dark and light mode.
- Keyboard, touch, reduced motion, no-JavaScript content access, and responsive stability are mandatory.
- No production asset or URL may reference `localhost`, `Downloads`, `tmp`, or `.superpowers`.

---

## File Structure

- Modify `index.html`: archive rows, project trigger buttons, theater dialog, four semantic stage articles, capability rails, and external links.
- Modify `styles.css`: remove superseded work-panel presentation rules and retain archive typography/theming.
- Modify `script.js`: remove old `workPanel` hover synchronization and old Task sigil data.
- Create `styles/project-stages.css`: shared theater motion plus isolated Bupples, Photoshoot, Adelante, and Fallen Asteri compositions.
- Create `scripts/project-stages.js`: `ProjectTheater`, local project controllers, cleanup, and mobile alternatives.
- Create `images/projects/bupples/ask-pip.jpg`, `profile.png`, `accent.png`.
- Create `images/projects/photoshoot/subject-01.jpg` through `subject-04.jpg`.
- Create `tests/project-stages.spec.js`: archive, transition, interaction, mobile, keyboard, and link coverage.

---

### Task 1: Import and Verify Project Assets

**Files:**
- Create: `images/projects/bupples/ask-pip.jpg`
- Create: `images/projects/bupples/profile.png`
- Create: `images/projects/bupples/accent.png`
- Create: `images/projects/photoshoot/subject-01.jpg`
- Create: `images/projects/photoshoot/subject-02.jpg`
- Create: `images/projects/photoshoot/subject-03.jpg`
- Create: `images/projects/photoshoot/subject-04.jpg`
- Create: `tests/project-stages.spec.js`

**Interfaces:**
- Consumes: the seven approved source images from `/Users/yousofselim/Downloads`.
- Produces: stable optimized project asset URLs used by stage markup.

- [ ] **Step 1: Add the asset availability test**

```js
// tests/project-stages.spec.js
const { test, expect } = require('@playwright/test');

test('approved project assets are served from stable paths', async ({ request }) => {
  const paths = [
    '/images/projects/bupples/ask-pip.jpg',
    '/images/projects/bupples/profile.png',
    '/images/projects/bupples/accent.png',
    '/images/projects/photoshoot/subject-01.jpg',
    '/images/projects/photoshoot/subject-02.jpg',
    '/images/projects/photoshoot/subject-03.jpg',
    '/images/projects/photoshoot/subject-04.jpg'
  ];
  for (const path of paths) {
    const response = await request.get(path);
    expect(response.ok(), path).toBeTruthy();
    expect((await response.body()).byteLength, path).toBeGreaterThan(20_000);
  }
});
```

- [ ] **Step 2: Run the asset test and verify it fails**

Run: `npm run test:projects`

Expected: FAIL with `404` for the new stable paths.

- [ ] **Step 3: Create directories and optimized copies**

Run:

```bash
mkdir -p images/projects/bupples images/projects/photoshoot
sips -Z 1800 "/Users/yousofselim/Downloads/IMG_4702.jpg" --out "images/projects/bupples/ask-pip.jpg"
sips -Z 1800 "/Users/yousofselim/Downloads/IMG_4701.PNG" --out "images/projects/bupples/profile.png"
sips -Z 1800 "/Users/yousofselim/Downloads/IMG_4700.PNG" --out "images/projects/bupples/accent.png"
sips -Z 2000 "/Users/yousofselim/Downloads/IMG_4660.JPG" --out "images/projects/photoshoot/subject-01.jpg"
sips -Z 2000 "/Users/yousofselim/Downloads/IMG_9528.JPG" --out "images/projects/photoshoot/subject-02.jpg"
sips -Z 2000 "/Users/yousofselim/Downloads/IMG_4770.JPG" --out "images/projects/photoshoot/subject-03.jpg"
sips -Z 2000 "/Users/yousofselim/Downloads/IMG_2107.jpg" --out "images/projects/photoshoot/subject-04.jpg"
```

Expected: source aspect ratios remain unchanged and every production copy is below its maximum dimension.

- [ ] **Step 4: Run the asset test and commit**

Run: `npm run test:projects`

Expected: `1 passed`.

```bash
git add images/projects tests/project-stages.spec.js
git commit -m "assets: add approved project media"
```

---

### Task 2: Replace the Archive Content and Link Destinations

**Files:**
- Modify: `index.html:223-361`
- Modify: `script.js:98-144, 1574-1665`
- Modify: `tests/project-stages.spec.js`

**Interfaces:**
- Consumes: existing `.work-list` archive typography.
- Produces: four `[data-open-project]` buttons in the approved order and correct external links inside future stages.

- [ ] **Step 1: Add failing archive tests**

```js
test('archive contains the four approved projects in order', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#work .work-name')).toHaveText(['Bupples', 'Photoshoot', 'Adelante', 'Fallen Asteri']);
  await expect(page.locator('#work')).not.toContainText('Task Management App');
  await expect(page.locator('[data-open-project]')).toHaveCount(4);
});

```

- [ ] **Step 2: Run tests and verify the old archive fails**

Run: `npm run test:projects`

Expected: FAIL because Task Management remains and the third trigger is not Adelante.

- [ ] **Step 3: Convert each archive row into a project trigger**

Use this trigger contract for every row:

```html
<button class="work-link" type="button" data-open-project="bupples" data-cursor-action="OPEN" aria-haspopup="dialog"><span class="work-no">01</span><span class="work-main"><strong class="work-name">Bupples</strong><span class="work-kicker">Group expense system · Flutter · Firebase</span></span><span class="work-arrow">→</span></button>
<button class="work-link" type="button" data-open-project="photoshoot" data-cursor-action="OPEN" aria-haspopup="dialog"><span class="work-no">02</span><span class="work-main"><strong class="work-name">Photoshoot</strong><span class="work-kicker">Desktop photobooth · WebGL2 · MediaPipe</span></span><span class="work-arrow">→</span></button>
<button class="work-link" type="button" data-open-project="adelante" data-cursor-action="OPEN" aria-haspopup="dialog"><span class="work-no">03</span><span class="work-main"><strong class="work-name">Adelante</strong><span class="work-kicker">Daily motivation · Native widgets · Privacy first</span></span><span class="work-arrow">→</span></button>
<button class="work-link" type="button" data-open-project="asteri" data-cursor-action="OPEN" aria-haspopup="dialog"><span class="work-no">04</span><span class="work-main"><strong class="work-name">Fallen Asteri</strong><span class="work-kicker">2D action platformer · Godot · Team Git</span></span><span class="work-arrow">→</span></button>
```

Add these exact résumé-synced details beneath the matching trigger so the archive remains useful without opening the theater:

```html
<p class="work-summary">Cross-platform group expense system with multi-currency balances, real-time sync, receipt extraction, and secure release infrastructure.</p><dl class="work-meta"><div><dt>Role</dt><dd>Independent developer</dd></div><div><dt>Stack</dt><dd>Flutter · Firebase · Vertex AI</dd></div><div><dt>Platform</dt><dd>iOS · Android</dd></div></dl>
<p class="work-summary">Private desktop photobooth with 17 real-time WebGL2 effects, 8 MediaPipe face effects, photo strips, and local video capture.</p><dl class="work-meta"><div><dt>Role</dt><dd>Independent developer</dd></div><div><dt>Stack</dt><dd>TypeScript · Electron · WebGL2 · MediaPipe</dd></div><div><dt>Platform</dt><dd>Desktop · Web showcase</dd></div></dl>
<p class="work-summary">Privacy-first daily motivation app with native home-screen widgets, scheduled delivery, offline storage, and 80 automated tests.</p><dl class="work-meta"><div><dt>Role</dt><dd>Independent developer</dd></div><div><dt>Stack</dt><dd>Flutter · WidgetKit · RemoteViews</dd></div><div><dt>Platform</dt><dd>iOS · Android</dd></div></dl>
<p class="work-summary">Team-built 2D action platformer focused on player movement, combat, scene transitions, and a disciplined Git workflow.</p><dl class="work-meta"><div><dt>Role</dt><dd>Gameplay programmer</dd></div><div><dt>Stack</dt><dd>Godot · GDScript · Git</dd></div><div><dt>Platform</dt><dd>Desktop</dd></div></dl>
```

- [ ] **Step 4: Replace the Task sigil identifier**

In `script.js`, rename the sigil key and row mapping from `task` to `adelante`, using a dotted `A` plus forward line. Set:

```js
const SIGIL_ROWS = ['bupples', 'photoshoot', 'adelante', 'asteri'];
```

Remove the old desktop `workPanel` preview block; the near-full theater replaces it.

- [ ] **Step 5: Run archive tests and commit**

Run: `npm run test:projects`

Expected: archive order and Task-removal assertions pass.

```bash
git add index.html script.js tests/project-stages.spec.js
git commit -m "content: replace task manager with adelante"
```

---

### Task 3: Build the Shared Theater and Seamless Entry/Exit

**Files:**
- Modify: `index.html:455-479`
- Create: `styles/project-stages.css`
- Create: `scripts/project-stages.js`
- Modify: `tests/project-stages.spec.js`

**Interfaces:**
- Consumes: `[data-open-project]`, `PortfolioCore.cursor`, `window.lenis`.
- Produces: `#projectTheater`, `[data-project-stage]`, `ProjectTheater.open(name)`, `ProjectTheater.close()`, `project:open`, and `project:close` events.

- [ ] **Step 1: Add failing theater lifecycle tests**

```js
test('project theater opens, closes, preserves scroll, and restores focus', async ({ page }) => {
  await page.goto('/');
  const trigger = page.locator('[data-open-project="bupples"]');
  await trigger.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  await trigger.click();
  const theater = page.locator('#projectTheater');
  await expect(theater).toHaveAttribute('open', '');
  await expect(theater).toHaveAttribute('data-project', 'bupples');
  await page.keyboard.press('Escape');
  await expect(theater).not.toHaveAttribute('open', '');
  expect(Math.abs((await page.evaluate(() => scrollY)) - before)).toBeLessThan(2);
  await expect(trigger).toBeFocused();
});
```

- [ ] **Step 2: Verify lifecycle test fails**

Run: `npm run test:projects`

Expected: FAIL because `#projectTheater` does not exist.

- [ ] **Step 3: Add the dialog shell and four stage articles**

Place before the global cursor:

```html
<dialog class="project-theater" id="projectTheater" aria-label="Project showcase">
  <div class="theater-wash" aria-hidden="true"></div>
  <header class="theater-head"><button class="theater-close" type="button" data-close-project data-cursor-action="CLOSE">Close ×</button><p id="theaterLabel">Project showcase</p><nav aria-label="Project navigation"><button type="button" data-project-nav="prev" data-cursor-action="PREV">←</button><button type="button" data-project-nav="next" data-cursor-action="NEXT">→</button></nav></header>
  <div class="theater-body">
    <article class="project-stage bupples-stage" data-project-stage="bupples" hidden></article>
    <article class="project-stage photoshoot-stage" data-project-stage="photoshoot" hidden></article>
    <article class="project-stage adelante-stage" data-project-stage="adelante" hidden></article>
    <article class="project-stage asteri-stage" data-project-stage="asteri" hidden></article>
  </div>
</dialog>
<noscript><nav class="project-fallback" aria-label="Project links"><a href="https://bupples.web.app/">Bupples live</a><a href="https://github.com/yeegz/Bupples-showcase">Bupples showcase</a><a href="https://photoshoot-yeegz.web.app/">Photoshoot live</a><a href="https://github.com/yeegz/photoshoot">Photoshoot GitHub</a><a href="https://github.com/yeegz/adelante-showcase">Adelante showcase</a><a href="https://yeegz.itch.io/fallenasteri">Play Fallen Asteri</a><a href="https://github.com/yeegz/Fallen-Asteri">Fallen Asteri GitHub</a></nav></noscript>
```

Add `<link rel="stylesheet" href="styles/project-stages.css?v=1">` and load `scripts/project-stages.js` after `portfolio-core.js`.

- [ ] **Step 4: Implement the theater controller**

```js
// scripts/project-stages.js
(() => {
  const names = ['bupples', 'photoshoot', 'adelante', 'asteri'];
  const dialog = document.getElementById('projectTheater');
  const stages = new Map(names.map(name => [name, dialog.querySelector(`[data-project-stage="${name}"]`)]));
  const label = document.getElementById('theaterLabel');
  let current = '';
  let opener = null;
  let transition = Promise.resolve();
  let preloadToken = 0;
  const controllers = new Map();
  const wait = ms => new Promise(resolve => setTimeout(resolve, window.PortfolioCore.reduced ? 0 : ms));
  const enqueue = task => { transition = transition.then(task, task); return transition; };

  const showOnly = name => stages.forEach((stage, key) => { stage.hidden = key !== name; stage.setAttribute('aria-hidden', String(key !== name)); });
  const reset = name => controllers.get(name)?.reset?.();
  const activate = name => controllers.get(name)?.activate?.();

  const open = name => enqueue(async () => {
    if (dialog.open || !stages.has(name)) return;
    opener = document.activeElement; current = name;
    showOnly(name); dialog.dataset.project = name; label.textContent = `${String(names.indexOf(name) + 1).padStart(2, '0')} / ${name === 'asteri' ? 'Fallen Asteri' : name}`;
    dialog.showModal(); document.documentElement.classList.add('project-open', 'project-opening');
    window.lenis?.stop(); window.PortfolioCore.cursor.setContext(name === 'asteri' ? 'fallen' : name);
    preload(name);
    activate(name); dialog.dispatchEvent(new CustomEvent('project:open', { detail: { name } }));
    await wait(520); document.documentElement.classList.remove('project-opening');
  });

  const close = () => enqueue(async () => {
    if (!dialog.open) return;
    document.documentElement.classList.add('project-closing');
    await wait(420); reset(current); dialog.close(); dialog.dispatchEvent(new CustomEvent('project:close', { detail: { name: current } }));
    current = ''; document.documentElement.classList.remove('project-open', 'project-closing');
    window.PortfolioCore.cursor.resetContext(); window.lenis?.start(); opener?.focus({ preventScroll: true });
  });

  document.querySelectorAll('[data-open-project]').forEach(button => button.addEventListener('click', () => open(button.dataset.openProject)));
  dialog.querySelector('[data-close-project]').addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
  dialog.querySelectorAll('[data-project-nav]').forEach(button => button.addEventListener('click', () => enqueue(async () => {
    if (!dialog.open) return;
    const offset = button.dataset.projectNav === 'next' ? 1 : -1;
    const next = names[(names.indexOf(current) + offset + names.length) % names.length];
    document.documentElement.classList.add('project-switching'); await wait(180);
    reset(current); current = next; dialog.dataset.project = next; label.textContent = `${String(names.indexOf(next) + 1).padStart(2, '0')} / ${next === 'asteri' ? 'Fallen Asteri' : next}`;
    showOnly(next); preload(next); window.PortfolioCore.cursor.setContext(next === 'asteri' ? 'fallen' : next); activate(next);
    await wait(260); document.documentElement.classList.remove('project-switching');
  })));

  const preload = name => {
    const token = ++preloadToken;
    dialog.classList.remove('media-ready');
    const images = Array.from(stages.get(name).querySelectorAll('img'));
    Promise.race([
      Promise.all(images.map(image => image.complete ? Promise.resolve() : (typeof image.decode === 'function' ? image.decode().catch(() => {}) : new Promise(resolve => { image.addEventListener('load', resolve, { once:true }); image.addEventListener('error', resolve, { once:true }); })))),
      wait(900)
    ]).then(() => { if (token === preloadToken) dialog.classList.add('media-ready'); });
  };
  document.querySelectorAll('[data-open-project]').forEach(button => {
    const warm = () => preload(button.dataset.openProject);
    button.addEventListener('pointerenter', warm, { once: true });
    button.addEventListener('focus', warm, { once: true });
  });

  window.ProjectTheater = { open, close, register(name, controller) { controllers.set(name, controller); }, preload };
})();
```

- [ ] **Step 5: Add the nonblocking project-media loading veil**

Add `<span class="stage-loading" aria-hidden="true"><i></i><i></i><i></i></span>` as the first child of each project article, then add:

```css
.stage-loading { position:absolute; inset:0; z-index:12; display:flex; place-content:center; align-items:center; justify-content:center; gap:9px; background:var(--stage-bg); opacity:1; visibility:visible; transition:opacity .32s,visibility .32s; }
.stage-loading i { width:5px; height:5px; border-radius:50%; background:var(--project-accent); animation:stageLoad .7s ease-in-out infinite alternate; }
.stage-loading i:nth-child(2){animation-delay:.09s}.stage-loading i:nth-child(3){animation-delay:.18s}
.project-theater.media-ready .stage-loading { opacity:0; visibility:hidden; pointer-events:none; }
@keyframes stageLoad { to { transform:translateY(-7px); opacity:.35; } }
@media(prefers-reduced-motion:reduce){.stage-loading i{animation:none}}
```

Call `preload(name)` at the start of `open(name)` before `activate(name)`. The dialog shell and project background remain visible while media decodes; the `900 ms` race prevents the loading veil from blocking the stage after an image failure.

- [ ] **Step 6: Add shared desktop and mobile theater styling**

```css
.project-theater { inset: 0; width: 100%; max-width: none; height: 100dvh; max-height: none; margin: 0; padding: 0; border: 0; background: transparent; color: inherit; overflow: hidden; }
.project-theater[data-project="bupples"]{--stage-bg:#050b07}.project-theater[data-project="photoshoot"]{--stage-bg:#171614}.project-theater[data-project="adelante"]{--stage-bg:#faf7f0}.project-theater[data-project="asteri"]{--stage-bg:#0b0912}
.project-theater::backdrop { background: rgba(0,0,0,.72); opacity: 0; transition: opacity .42s; }
.project-theater[open]::backdrop { opacity: 1; }
.theater-wash { position: absolute; inset: 0; background: var(--stage-bg); transform: scaleX(0); transform-origin: right; transition: transform .52s cubic-bezier(.16,1,.3,1); }
.project-opening .theater-wash, .project-open .theater-wash { transform: scaleX(1); transform-origin: left; }
.project-closing .theater-wash { transform: scaleX(0); transform-origin: right; }
.theater-head { position: absolute; inset: 0 0 auto; z-index: 20; min-height: 68px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 0 clamp(18px,3vw,44px); }
.theater-head nav { justify-self: end; display: flex; gap: 1rem; }
.theater-head button { min-width: 44px; min-height: 44px; }
.theater-body, .project-stage { position: absolute; inset: 0; }
.project-stage { padding: 82px clamp(22px,4vw,64px) 28px; overflow: hidden; }
.project-stage[hidden] { display: none; }
.stage-copy { position:relative; z-index:3; max-width:min(38rem,42vw); }
.stage-copy > p:first-child { margin:0 0 1rem; font:600 .72rem/1.2 var(--mono); letter-spacing:.13em; text-transform:uppercase; opacity:.68; }
.stage-copy h2 { margin:0; font-size:clamp(4.5rem,10vw,10rem); line-height:.76; letter-spacing:-.075em; }
.stage-copy > p:not(:first-child) { max-width:36rem; margin:1.5rem 0 0; color:color-mix(in srgb,currentColor 72%,transparent); line-height:1.62; }
.stage-actions { display:flex; flex-wrap:wrap; gap:1rem 1.4rem; margin-top:1.5rem; }
.stage-actions a { min-height:44px; display:inline-flex; align-items:center; color:inherit; text-underline-offset:.3em; }
.capability-rail { position:absolute; z-index:4; left:clamp(22px,4vw,64px); right:clamp(22px,4vw,64px); bottom:24px; display:flex; gap:clamp(1.2rem,3vw,3rem); margin:0; padding:13px 0 0; border-top:1px solid color-mix(in srgb,currentColor 18%,transparent); list-style:none; font:600 .7rem/1.2 var(--mono); letter-spacing:.1em; text-transform:uppercase; white-space:nowrap; }
.project-stage:not([hidden]) > *:not(.stage-loading) { transition: opacity .42s ease, transform .55s cubic-bezier(.16,1,.3,1); }
.project-opening .project-stage:not([hidden]) > *:not(.stage-loading), .project-switching .project-stage:not([hidden]) > *:not(.stage-loading) { opacity:0; transform:translateY(14px); }
@media (max-width: 600px) { .theater-head { grid-template-columns: 1fr auto; min-height: 60px; } .theater-head > p { display: none; } .project-stage { padding: 66px 18px 84px; overflow-y: auto; overscroll-behavior: contain; } .stage-copy { max-width:none; } .stage-copy h2 { font-size:clamp(3.6rem,18vw,6rem); } .capability-rail { position:absolute; left:18px; right:18px; bottom:18px; overflow-x:auto; scrollbar-width:none; } }
@media (prefers-reduced-motion: reduce) { .theater-wash { transition: none; transform: none; } }
```

- [ ] **Step 7: Run lifecycle tests and commit**

Run: `npm run test:projects`

Expected: theater lifecycle passes; project content tests remain for subsequent tasks.

```bash
git add index.html styles/project-stages.css scripts/project-stages.js tests/project-stages.spec.js
git commit -m "feat: add immersive project theater"
```

---

### Task 4: Implement the Bupples Screen Stack

**Files:**
- Modify: `index.html` Bupples stage article
- Modify: `styles/project-stages.css`
- Modify: `scripts/project-stages.js`
- Modify: `tests/project-stages.spec.js`

**Interfaces:**
- Consumes: Bupples stage asset paths and `ProjectTheater.register('bupples', controller)`.
- Produces: `.bupples-screens`, pointer depth CSS variables, tap/focus screen emphasis, capability rail, and external actions.

- [ ] **Step 1: Add failing Bupples tests**

```js
test('Bupples uses three overlapping screens without clipping', async ({ page }) => {
  await page.goto('/'); await page.locator('[data-open-project="bupples"]').click();
  await expect(page.locator('.bupples-stage .phone-screen')).toHaveCount(3);
  await expect(page.locator('.bupples-stage h2')).toHaveText('Bupples');
  const stage = page.locator('.bupples-stage');
  const before = await page.locator('.phone-screen.side-left').evaluate(el => getComputedStyle(el).transform);
  await stage.hover({ position: { x: 900, y: 430 } }); await page.waitForTimeout(250);
  expect(await page.locator('.phone-screen.side-left').evaluate(el => getComputedStyle(el).transform)).not.toBe(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});
```

- [ ] **Step 2: Verify the Bupples test fails**

Run: `npm run test:projects`

Expected: FAIL because the Bupples stage article is empty.

- [ ] **Step 3: Add exact Bupples stage markup**

```html
<article class="project-stage bupples-stage" data-project-stage="bupples" hidden>
  <div class="stage-copy"><p class="stage-kicker">Social expense system · 2026</p><h2>Bupples</h2><p>Group expense splitting with live member bubbles, flexible splits, tax and service handling, AI receipt extraction, and settle-up plans.</p><div class="stage-actions"><a href="https://bupples.web.app/" target="_blank" rel="noopener" data-cursor-action="OPEN">Experience it live ↗</a><a href="https://github.com/yeegz/Bupples-showcase" target="_blank" rel="noopener" data-cursor-action="CODE">View showcase ↗</a></div></div>
  <div class="bupples-screens" aria-label="Current Bupples interface screens"><figure class="phone-screen side-left" tabindex="0"><img src="images/projects/bupples/ask-pip.jpg" alt="Ask Pip assistant screen" width="1187" height="2048"></figure><figure class="phone-screen center" tabindex="0"><img src="images/projects/bupples/profile.png" alt="Bupples profile screen" width="945" height="2048"></figure><figure class="phone-screen side-right" tabindex="0"><img src="images/projects/bupples/accent.png" alt="Bupples custom accent editor" width="945" height="2048"></figure></div>
  <ul class="capability-rail" aria-label="Bupples capabilities"><li>¢ exact ledger</li><li>↻ real-time sync</li><li>AI receipt extraction</li><li>secure cross-platform release</li></ul>
</article>
```

- [ ] **Step 4: Add depth, overlap, and mobile-safe focus rules**

```css
.bupples-stage { --stage-bg:#050b07; --project-accent:#86bd98; background: radial-gradient(circle at 72% 48%,rgba(134,189,152,.18),transparent 34%),#050b07; color:#f4f0e7; }
.bupples-stage h2 { white-space: nowrap; font: 900 clamp(4rem,9vw,9rem)/.75 var(--disp); letter-spacing:-.07em; }
.bupples-screens { position:absolute; right:2%; top:14%; width:min(64vw,920px); height:72%; perspective:1200px; }
.phone-screen { position:absolute; top:4%; width:min(26%,250px); aspect-ratio:945/2048; overflow:hidden; border-radius:28px; background:#101411; box-shadow:0 32px 70px rgba(0,0,0,.46); transition:transform .45s cubic-bezier(.16,1,.3,1),filter .3s; }
.phone-screen img { width:100%; height:100%; object-fit:cover; }.phone-screen.side-left img{object-fit:contain;object-position:50% 42%;background:#101511}
.phone-screen.center { left:47%; z-index:3; transform:translate3d(calc(-50% + var(--center-x,0px)),var(--center-y,0px),70px) scale(1.06); }
.phone-screen.side-left { left:18%; z-index:1; transform:translate3d(var(--left-x,0px),calc(8% + var(--left-y,0px)),0) rotateY(8deg); }
.phone-screen.side-right { right:2%; z-index:1; transform:translate3d(var(--right-x,0px),calc(8% + var(--right-y,0px)),0) rotateY(-8deg); }
.phone-screen:focus-visible { outline:2px solid var(--project-accent); outline-offset:5px; }
.phone-screen.side-left:hover,.phone-screen.side-left:focus { transform:translate3d(-34px,2%,90px) rotateY(2deg); z-index:5; }
.phone-screen.side-right:hover,.phone-screen.side-right:focus { transform:translate3d(28px,2%,90px) rotateY(-2deg); z-index:5; }
@media(max-width:700px){.bupples-stage{display:grid;align-content:start;gap:20px}.bupples-stage h2{font-size:clamp(3.5rem,20vw,5.4rem)}.bupples-screens{position:relative;inset:auto;width:100%;height:56dvh;min-height:430px}.phone-screen{width:44%;border-radius:20px}.phone-screen.side-left{left:0}.phone-screen.center{left:50%}.phone-screen.side-right{right:0}.phone-screen:hover{transform:none}.phone-screen:focus{z-index:6;scale:1.06}.capability-rail{overflow-x:auto}}
```

- [ ] **Step 5: Add pointer depth only for fine pointers**

Register this controller; it batches pointer updates and leaves touch devices on the tap/focus layout:

```js
const bupplesStage = dialog.querySelector('[data-project-stage="bupples"]');
let bupplesFrame = 0;
let bupplesPoint = { x: 0, y: 0 };
const paintBupples = () => {
  bupplesFrame = 0;
  bupplesStage.style.setProperty('--left-x', `${bupplesPoint.x * -22}px`);
  bupplesStage.style.setProperty('--center-x', `${bupplesPoint.x * 14}px`);
  bupplesStage.style.setProperty('--right-x', `${bupplesPoint.x * 26}px`);
  bupplesStage.style.setProperty('--left-y', `${bupplesPoint.y * -13}px`);
  bupplesStage.style.setProperty('--center-y', `${bupplesPoint.y * 10}px`);
  bupplesStage.style.setProperty('--right-y', `${bupplesPoint.y * 16}px`);
};
if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
  bupplesStage.addEventListener('pointermove', event => {
    const bounds = bupplesStage.getBoundingClientRect();
    bupplesPoint = { x: (event.clientX - bounds.left) / bounds.width - .5, y: (event.clientY - bounds.top) / bounds.height - .5 };
    if (!bupplesFrame) bupplesFrame = requestAnimationFrame(paintBupples);
  });
}
ProjectTheater.register('bupples', {
  reset() {
    cancelAnimationFrame(bupplesFrame); bupplesFrame = 0; bupplesPoint = { x: 0, y: 0 };
    ['--left-x','--center-x','--right-x','--left-y','--center-y','--right-y'].forEach(name => bupplesStage.style.removeProperty(name));
    bupplesStage.querySelectorAll('.phone-screen').forEach(screen => screen.blur());
  }
});
```

- [ ] **Step 6: Run Bupples tests and commit**

Run: `npm run test:projects`

Expected: Bupples tests pass at desktop and no page overflow is reported.

```bash
git add index.html styles/project-stages.css scripts/project-stages.js tests/project-stages.spec.js
git commit -m "feat: add interactive bupples stage"
```

---

### Task 5: Implement Adelante Arrow and Quote Deck

**Files:**
- Modify: `index.html` Adelante stage article
- Modify: `styles/project-stages.css`
- Modify: `scripts/project-stages.js`
- Modify: `tests/project-stages.spec.js`

**Interfaces:**
- Consumes: `.adelante-mark`, `#adelanteArrow`, `#adelanteMessage`, `#quoteDeck`.
- Produces: dash-offset arrow draw, alternating hover message, and looping unnumbered quote cards.

- [ ] **Step 1: Add failing Adelante interaction tests**

```js
test('Adelante draws its arrow from empty and cycles unnumbered quotes', async ({ page }) => {
  await page.goto('/'); await page.locator('[data-open-project="adelante"]').click();
  const path = page.locator('#adelanteArrow');
  expect(parseFloat(await path.evaluate(el => getComputedStyle(el).strokeDashoffset))).toBeGreaterThan(.5);
  await page.locator('.adelante-mark').hover(); await page.waitForTimeout(700);
  expect(parseFloat(await path.evaluate(el => getComputedStyle(el).strokeDashoffset))).toBeLessThan(1);
  await expect(page.locator('#adelanteMessage')).toContainText(/go forward|smallest step/i);
  const first = await page.locator('.quote-card').first().textContent();
  await page.locator('.quote-card').first().click(); await page.waitForTimeout(500);
  expect(await page.locator('.quote-card').first().textContent()).not.toBe(first);
  await expect(page.locator('#quoteDeck')).not.toContainText(/^\s*\d+[.)]/);
});
```

- [ ] **Step 2: Verify the test fails**

Run: `npm run test:projects`

Expected: FAIL because the Adelante stage is empty.

- [ ] **Step 3: Add the exact mark and quote structure**

```html
<article class="project-stage adelante-stage" data-project-stage="adelante" hidden>
  <div class="adelante-copy"><p>Native daily motivation · iOS & Android</p><div class="adelante-mark" tabindex="0" data-cursor-action="FORWARD"><span>A</span><svg viewBox="0 0 180 94" aria-hidden="true"><path id="adelanteArrow" pathLength="1" d="M18 62 C64 62 91 43 140 43 L119 25 L140 43 L119 62" /></svg></div><p id="adelanteMessage" aria-live="polite">Adelante is Spanish for “go forward.”</p><div class="stage-actions"><a href="https://github.com/yeegz/adelante-showcase" target="_blank" rel="noopener" data-cursor-action="CODE">View showcase ↗</a></div></div>
  <div class="quote-deck" id="quoteDeck" aria-label="Motivational quote deck"><button class="quote-card" type="button"></button><button class="quote-card" type="button" tabindex="-1"></button><button class="quote-card" type="button" tabindex="-1"></button><button class="quote-card" type="button" tabindex="-1"></button></div>
  <ul class="capability-rail" aria-label="Adelante capabilities"><li>Native widgets</li><li>Scheduled pipeline</li><li>Offline + private</li><li>80 automated tests</li></ul>
</article>
```

- [ ] **Step 4: Add elegant arrow and quote styling**

```css
.adelante-stage{--stage-bg:#faf7f0;--project-accent:#df7545;background:linear-gradient(135deg,#fffdf8,#f4eee4);color:#2f2922}.adelante-mark{display:flex;align-items:center;min-height:clamp(150px,27vw,340px)}.adelante-mark span{font:900 clamp(10rem,29vw,27rem)/.6 var(--disp);letter-spacing:-.12em}.adelante-mark svg{width:min(23vw,250px);overflow:visible}.adelante-mark path{fill:none;stroke:var(--project-accent);stroke-width:7;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .78s cubic-bezier(.16,1,.3,1)}.adelante-mark:hover path,.adelante-mark:focus-visible path{stroke-dashoffset:0}.quote-deck{position:absolute;right:5%;top:25%;width:min(36vw,520px);height:50%;isolation:isolate}.quote-card{position:absolute;inset:0;border:1px solid rgba(47,41,34,.18);background:#fffdf8;color:#2f2922;padding:clamp(2rem,5vw,4rem);font:italic clamp(1.7rem,3vw,3rem)/1.05 var(--serif);text-align:left;box-shadow:0 28px 65px rgba(78,56,35,.12);transition:transform .55s cubic-bezier(.16,1,.3,1),opacity .35s}.quote-card:nth-child(2){transform:translate(10px,10px) rotate(.7deg);z-index:-1}.quote-card:nth-child(3){transform:translate(20px,20px) rotate(1.4deg);z-index:-2}.quote-card:nth-child(4){transform:translate(30px,30px) rotate(2deg);z-index:-3}.quote-card.is-discarding{transform:translate(35%,-18%) rotate(8deg);opacity:0}@media(max-width:700px){.adelante-mark span{font-size:40vw}.adelante-mark svg{width:29vw}.quote-deck{position:relative;inset:auto;width:calc(100% - 30px);height:35dvh;min-height:280px;margin-top:10px}}
```

- [ ] **Step 5: Implement message and quote cycling**

Register a controller with these exact arrays and behaviors:

```js
const adelanteQuotes = [
  'The next version of you is built one step at a time.',
  'Small movement is still movement.',
  'Make the direction clear. Then begin.',
  'Forward is a practice, not a finish line.'
];
const adelanteMessages = ['Adelante is Spanish for “go forward.”', 'Even the smallest step is still forward.'];
```

Complete the controller with:

```js
const adelanteStage = dialog.querySelector('[data-project-stage="adelante"]');
const adelanteMark = adelanteStage.querySelector('.adelante-mark');
const adelanteMessage = adelanteStage.querySelector('#adelanteMessage');
const quoteCards = Array.from(adelanteStage.querySelectorAll('.quote-card'));
let quoteIndex = 0;
let messageIndex = 0;
let quoteLocked = false;
const renderQuotes = () => quoteCards.forEach((card, offset) => { card.textContent = adelanteQuotes[(quoteIndex + offset) % adelanteQuotes.length]; card.tabIndex = offset === 0 ? 0 : -1; });
const advanceMessage = () => { messageIndex = (messageIndex + 1) % adelanteMessages.length; adelanteMessage.textContent = adelanteMessages[messageIndex]; };
adelanteMark.addEventListener('pointerenter', advanceMessage);
adelanteMark.addEventListener('focusin', advanceMessage);
quoteCards.forEach(card => card.addEventListener('click', async () => {
  if (quoteLocked || card !== quoteCards[0]) return;
  quoteLocked = true; card.classList.add('is-discarding'); await wait(420);
  quoteIndex = (quoteIndex + 1) % adelanteQuotes.length; card.classList.remove('is-discarding'); renderQuotes(); quoteLocked = false; quoteCards[0].focus({ preventScroll:true });
}));
renderQuotes();
ProjectTheater.register('adelante', { reset() { quoteIndex = 0; messageIndex = 0; quoteLocked = false; adelanteMessage.textContent = adelanteMessages[0]; quoteCards.forEach(card => card.classList.remove('is-discarding')); renderQuotes(); } });
```

- [ ] **Step 6: Run Adelante tests and commit**

Run: `npm run test:projects`

Expected: arrow and quote tests pass on desktop; tap-driven quote cycling works at 390px.

```bash
git add index.html styles/project-stages.css scripts/project-stages.js tests/project-stages.spec.js
git commit -m "feat: add adelante forward story"
```

---

### Task 6: Implement Photoshoot Viewfinder and Shutter

**Files:**
- Modify: `index.html` Photoshoot stage article
- Modify: `styles/project-stages.css`
- Modify: `scripts/project-stages.js`
- Modify: `tests/project-stages.spec.js`

**Interfaces:**
- Consumes: four Photoshoot asset URLs, `#viewfinderPhoto`, `#shutterButton`, and `#photoCounter`.
- Produces: focal-position-preserving photo cycle, flash, capture counter, and correct live-link action.

- [ ] **Step 1: Add failing Photoshoot tests**

```js
test('Photoshoot shutter cycles all four focal-positioned photos', async ({ page }) => {
  await page.goto('/'); await page.locator('[data-open-project="photoshoot"]').click();
  const image = page.locator('#viewfinderPhoto');
  const shutter = page.locator('#shutterButton');
  const expected = ['50% 56%', '50% 35%', '50% 37%', '50% 40%'];
  await page.locator('[data-effect="mono"]').click();
  for (let index = 0; index < expected.length; index += 1) {
    expect(await image.evaluate(el => getComputedStyle(el).objectPosition)).toBe(expected[index]);
    await shutter.click(); await page.waitForTimeout(360);
  }
  await expect(page.locator('.capture-slot img')).toHaveCount(4);
  await expect(page.locator('.capture-slot img').first()).toHaveAttribute('data-effect','mono');
  await expect(page.locator('a[href="https://photoshoot-yeegz.web.app/"]')).toHaveText(/Experience it live/i);
  const viewfinder = page.locator('.viewfinder');
  const box = await viewfinder.boundingBox();
  await page.mouse.move(box.x + box.width * .72, box.y + box.height * .38);
  await expect.poll(() => viewfinder.evaluate(el => el.style.getPropertyValue('--focus-x'))).toBeTruthy();
});
```

- [ ] **Step 2: Verify the Photoshoot test fails**

Run: `npm run test:projects`

Expected: FAIL because the stage viewfinder does not exist.

- [ ] **Step 3: Add the smaller camera composition**

```html
<article class="project-stage photoshoot-stage" data-project-stage="photoshoot" hidden>
  <div class="stage-copy"><p>Private desktop photobooth · WebGL2</p><h2>Photo<br><em>shoot.</em></h2><p>17 real-time effects, 8 MediaPipe face effects, single shots, strips, and video with fully local processing.</p><div class="stage-actions"><a href="https://photoshoot-yeegz.web.app/" target="_blank" rel="noopener" data-cursor-action="OPEN">Experience it live ↗</a><a href="https://github.com/yeegz/photoshoot" target="_blank" rel="noopener" data-cursor-action="CODE">View GitHub ↗</a></div></div>
  <div class="camera"><div class="viewfinder" data-effect="clean"><img id="viewfinderPhoto" src="images/projects/photoshoot/subject-01.jpg" alt="Photoshoot sample subject" width="1500" height="2000"><span class="focus-reticle" aria-hidden="true"></span><span class="camera-flash" aria-hidden="true"></span><span class="camera-readout">ISO 400 · F/1.8</span></div><div class="effect-controls" aria-label="Preview effects"><button type="button" data-effect="clean" aria-pressed="true">Clean</button><button type="button" data-effect="mono" aria-pressed="false">Mono</button><button type="button" data-effect="warm" aria-pressed="false">Warm</button><button type="button" data-effect="pixel" aria-pressed="false">Pixel</button></div><div class="camera-controls"><button id="shutterButton" type="button" data-cursor-action="SHOOT" aria-label="Take a photo"><span></span></button><output id="photoCounter">00 / 04</output></div><div class="capture-strip" aria-label="Captured photos"><span class="capture-slot"></span><span class="capture-slot"></span><span class="capture-slot"></span><span class="capture-slot"></span></div></div>
  <ul class="capability-rail" aria-label="Photoshoot capabilities"><li>WebGL2 pipeline</li><li>17 live effects</li><li>8 face effects</li><li>fully local</li></ul>
</article>
```

- [ ] **Step 4: Add fixed viewfinder proportions and responsive crop rules**

```css
.photoshoot-stage{--stage-bg:#171614;--project-accent:#e0543e;background:radial-gradient(circle at 68% 44%,#3a3026,#171614 58%);color:#f4eee3}.camera{position:absolute;right:7%;top:17%;width:min(42vw,590px);padding:18px;border:1px solid rgba(244,238,227,.18);background:#111}.viewfinder{--focus-x:50%;--focus-y:50%;position:relative;width:100%;aspect-ratio:4/3;overflow:hidden;background:#050505}.viewfinder img{width:100%;height:100%;object-fit:cover;object-position:50% 56%;transform:translate3d(var(--photo-shift-x,0),var(--photo-shift-y,0),0) scale(1.018);transition:opacity .18s,transform .32s cubic-bezier(.16,1,.3,1)}.focus-reticle{position:absolute;z-index:2;left:var(--focus-x);top:var(--focus-y);width:34px;height:34px;border:1px solid rgba(255,255,255,.68);transform:translate(-50%,-50%);opacity:0;transition:opacity .22s}.focus-reticle::before,.focus-reticle::after{content:"";position:absolute;background:rgba(255,255,255,.68)}.focus-reticle::before{left:50%;top:-5px;width:1px;height:44px}.focus-reticle::after{top:50%;left:-5px;width:44px;height:1px}.viewfinder:hover .focus-reticle,.viewfinder:focus-within .focus-reticle{opacity:1}.viewfinder[data-effect="mono"] img,.capture-slot img[data-effect="mono"]{filter:grayscale(1) contrast(1.08)}.viewfinder[data-effect="warm"] img,.capture-slot img[data-effect="warm"]{filter:sepia(.25) saturate(1.2) hue-rotate(-8deg)}.viewfinder[data-effect="pixel"] img,.capture-slot img[data-effect="pixel"]{filter:contrast(1.3) saturate(.8);image-rendering:pixelated}.camera-flash{position:absolute;inset:0;background:#fff;opacity:0}.camera.is-flashing .camera-flash{animation:cameraFlash .3s ease-out}.effect-controls{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}.effect-controls button{min-height:44px;border:1px solid rgba(244,238,227,.18);background:transparent;color:#aaa}.effect-controls button[aria-pressed="true"]{color:#fff;border-color:var(--project-accent)}.camera-controls{display:flex;justify-content:space-between;align-items:center;padding-top:12px}#shutterButton{width:58px;height:58px;border:2px solid #f4eee3;border-radius:50%;background:transparent;display:grid;place-items:center}#shutterButton span{width:42px;height:42px;border-radius:50%;background:var(--project-accent)}.capture-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}.capture-slot{aspect-ratio:4/3;background:#282522;overflow:hidden}.capture-slot img{width:100%;height:100%;object-fit:cover}@keyframes cameraFlash{0%{opacity:0}20%{opacity:.94}100%{opacity:0}}@media(hover:none){.focus-reticle{left:50%;top:50%;opacity:.45}.viewfinder img{transform:none}}@media(max-width:700px){.photoshoot-stage{display:grid;align-content:start}.camera{position:relative;inset:auto;width:min(100%,520px);margin:18px auto 0}.viewfinder{aspect-ratio:4/3;max-height:42dvh}.photoshoot-stage h2{font-size:18vw}.effect-controls button{font-size:.65rem}}
```

- [ ] **Step 5: Implement the focal photo cycle**

Register a Photoshoot controller using:

```js
const photos = [
  ['images/projects/photoshoot/subject-01.jpg', '50% 56%'],
  ['images/projects/photoshoot/subject-02.jpg', '50% 35%'],
  ['images/projects/photoshoot/subject-03.jpg', '50% 37%'],
  ['images/projects/photoshoot/subject-04.jpg', '50% 40%']
];
```

Complete the controller with:

```js
const photoStage = dialog.querySelector('[data-project-stage="photoshoot"]');
const camera = photoStage.querySelector('.camera');
const viewfinder = photoStage.querySelector('.viewfinder');
const photo = photoStage.querySelector('#viewfinderPhoto');
const shutter = photoStage.querySelector('#shutterButton');
const counter = photoStage.querySelector('#photoCounter');
const effectButtons = Array.from(photoStage.querySelectorAll('[data-effect]')).filter(element => element.tagName === 'BUTTON');
const captureSlots = Array.from(photoStage.querySelectorAll('.capture-slot'));
let photoIndex = 0;
let captureCount = 0;
let selectedEffect = 'clean';
let captureLocked = false;
let focusFrame = 0;
const showPhoto = index => { photo.src = photos[index][0]; photo.style.objectPosition = photos[index][1]; };
const clearStrip = () => { captureSlots.forEach(slot => slot.replaceChildren()); captureCount = 0; counter.value = '00 / 04'; counter.textContent = counter.value; };
effectButtons.forEach(button => button.addEventListener('click', () => { selectedEffect = button.dataset.effect; viewfinder.dataset.effect = selectedEffect; effectButtons.forEach(candidate => candidate.setAttribute('aria-pressed', String(candidate === button))); }));
viewfinder.addEventListener('pointermove', event => {
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches || focusFrame) return;
  focusFrame = requestAnimationFrame(() => {
    focusFrame = 0; const bounds = viewfinder.getBoundingClientRect();
    const x = Math.max(8, Math.min(92, ((event.clientX - bounds.left) / bounds.width) * 100));
    const y = Math.max(10, Math.min(90, ((event.clientY - bounds.top) / bounds.height) * 100));
    viewfinder.style.setProperty('--focus-x', `${x}%`); viewfinder.style.setProperty('--focus-y', `${y}%`);
    viewfinder.style.setProperty('--photo-shift-x', `${(50 - x) * .045}px`); viewfinder.style.setProperty('--photo-shift-y', `${(50 - y) * .045}px`);
  });
}, { passive:true });
viewfinder.addEventListener('pointerleave', () => { viewfinder.style.setProperty('--focus-x','50%'); viewfinder.style.setProperty('--focus-y','50%'); viewfinder.style.setProperty('--photo-shift-x','0'); viewfinder.style.setProperty('--photo-shift-y','0'); });
shutter.addEventListener('click', async () => {
  if (captureLocked) return;
  captureLocked = true; if (captureCount === 4) clearStrip();
  const captured = new Image(); captured.src = photos[photoIndex][0]; captured.alt = ''; captured.width = 1500; captured.height = 2000; captured.dataset.effect = selectedEffect; captured.style.objectPosition = photos[photoIndex][1]; captureSlots[captureCount].replaceChildren(captured); captureCount += 1;
  counter.value = `${String(captureCount).padStart(2,'0')} / 04`; counter.textContent = counter.value;
  camera.classList.add('is-flashing'); await wait(120); photoIndex = (photoIndex + 1) % photos.length; showPhoto(photoIndex); await wait(200);
  camera.classList.remove('is-flashing'); captureLocked = false;
});
ProjectTheater.register('photoshoot', {
  activate() { photos.forEach(([src]) => { const image = new Image(); image.src = src; }); },
  reset() { photoIndex = 0; captureLocked = false; selectedEffect = 'clean'; viewfinder.dataset.effect = 'clean'; effectButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.effect === 'clean'))); camera.classList.remove('is-flashing'); clearStrip(); showPhoto(0); }
});
clearStrip(); showPhoto(0);
```

- [ ] **Step 6: Run Photoshoot tests and commit**

Run: `npm run test:projects`

Expected: all four focal positions and the root live URL pass.

```bash
git add index.html styles/project-stages.css scripts/project-stages.js tests/project-stages.spec.js
git commit -m "feat: add photoshoot shutter experience"
```

---

### Task 7: Implement Fallen Asteri Pixel Combat and Sword Cursor

**Files:**
- Modify: `index.html` Fallen Asteri stage article
- Modify: `styles/project-stages.css`
- Modify: `scripts/project-stages.js`
- Modify: `scripts/portfolio-core.js`
- Modify: `tests/project-stages.spec.js`

**Interfaces:**
- Consumes: `#asteriGame`, `#asteriEnemies`, `#asteriXp`, `#asteriLevel`, and cursor context `fallen`.
- Produces: crisp pixel enemies, kill/death/respawn state, XP/level state, tap parity, and sword cursor override without slash effects.

- [ ] **Step 1: Add failing combat and cursor tests**

```js
test('Fallen Asteri enemies die, grant XP, respawn, and level up', async ({ page }) => {
  await page.goto('/'); await page.locator('[data-open-project="asteri"]').click();
  await expect(page.locator('.pixel-enemy')).toHaveCount(4);
  const first = page.locator('.pixel-enemy').first();
  await first.click();
  await expect(first).toHaveClass(/is-dying/);
  await expect(page.locator('#asteriXp')).toHaveText('35');
  for (let index = 0; index < 2; index += 1) await page.locator('.pixel-enemy').nth(index + 1).click();
  await expect(page.locator('#asteriLevel')).toHaveText('2');
  await expect(page.locator('#asteriCleared')).toHaveText('3');
  await expect(page.locator('.slash-effect')).toHaveCount(0);
});

test('Fallen Asteri uses sword cursor only on fine pointers', async ({ page }) => {
  await page.goto('/'); await page.locator('[data-open-project="asteri"]').click();
  await page.locator('#asteriGame').hover();
  await expect(page.locator('html')).toHaveAttribute('data-cursor-context', 'fallen');
  await expect(page.locator('.sword-cursor')).toBeVisible();
});
```

- [ ] **Step 2: Verify combat tests fail**

Run: `npm run test:projects`

Expected: FAIL because the game vignette and sword cursor do not exist.

- [ ] **Step 3: Add game, HUD, and external actions**

```html
<article class="project-stage asteri-stage" data-project-stage="asteri" hidden>
  <div class="stage-copy"><p>2D action platformer · Godot</p><h2>Fallen<br>Asteri</h2><p>Player movement, combat systems, scene transitions, and team Git collaboration.</p><div class="stage-actions"><a href="https://yeegz.itch.io/fallenasteri" target="_blank" rel="noopener" data-cursor-action="PLAY">Play the game ↗</a><a href="https://github.com/yeegz/Fallen-Asteri" target="_blank" rel="noopener" data-cursor-action="CODE">View GitHub ↗</a></div></div>
  <div class="asteri-game" id="asteriGame" aria-label="Fallen Asteri combat vignette"><div class="asteri-hud"><span>LV <b id="asteriLevel">1</b></span><span>XP <b id="asteriXp">0</b>/100</span><span>CLEARED <b id="asteriCleared">0</b></span></div><div class="asteri-enemies" id="asteriEnemies"></div><div class="asteri-ground" aria-hidden="true"></div></div>
  <ul class="capability-rail" aria-label="Fallen Asteri capabilities"><li>Combat systems</li><li>Player movement</li><li>Scene state</li><li>Team Git workflow</li></ul>
</article>
```

- [ ] **Step 4: Render pixel sprites from authored grids**

Use this exact renderer in `project-stages.js`:

```js
const enemyFrames = [
  ['00111100','01122110','11222211','12211221','12222221','01133110','01300310','11000011'],
  ['00011000','00122100','01222210','12211221','12222221','01133110','00100100','01000010'],
  ['00111100','01222210','12211221','12222221','11222211','01133110','01011010','10000001'],
  ['00011000','00122100','01233210','12222221','11211211','01122110','00100100','01000010']
];
const palette = { 1:'#1c1724', 2:'#8f5eaa', 3:'#f2c86e' };
const makeEnemy = (frame, index) => {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'pixel-enemy'; button.dataset.enemy = String(index); button.setAttribute('aria-label', `Defeat pixel enemy ${index + 1}`);
  button.innerHTML = frame.flatMap((row, y) => [...row].map((value, x) => value === '0' ? '' : `<i style="--x:${x};--y:${y};--pixel:${palette[value]}"></i>`)).join('');
  return button;
};
```

Each pixel is `4px` desktop and `3px` mobile with `image-rendering: pixelated`; the button remains at least `44×44px` and has a visible focus outline.

- [ ] **Step 5: Implement kill, XP, level, and respawn state**

Register this combat controller:

```js
const asteriStage = dialog.querySelector('[data-project-stage="asteri"]');
const enemyField = asteriStage.querySelector('#asteriEnemies');
const xpOutput = asteriStage.querySelector('#asteriXp');
const levelOutput = asteriStage.querySelector('#asteriLevel');
const clearedOutput = asteriStage.querySelector('#asteriCleared');
const enemyPositions = [[12,58],[35,34],[59,61],[78,29]];
let xp = 0;
let level = 1;
let cleared = 0;
let respawnTimers = [];
const updateHud = () => { xpOutput.textContent = String(xp); levelOutput.textContent = String(level); clearedOutput.textContent = String(cleared); };
const placeEnemy = (enemy, index) => { const [left, top] = enemyPositions[index]; enemy.style.left = `${left}%`; enemy.style.top = `${top}%`; };
const enemies = enemyFrames.map((frame, index) => {
  const enemy = makeEnemy(frame, index); placeEnemy(enemy, index); enemyField.appendChild(enemy);
  enemy.addEventListener('click', () => {
    if (enemy.disabled) return;
    enemy.disabled = true; enemy.classList.add('is-dying'); asteriStage.classList.add('is-hit'); xp += 35; cleared += 1;
    const hitTimer = setTimeout(() => asteriStage.classList.remove('is-hit'), 180); respawnTimers.push(hitTimer);
    const gain = document.createElement('span'); gain.className = 'xp-pop'; gain.textContent = '+35 XP'; gain.style.left = enemy.style.left; gain.style.top = enemy.style.top; enemyField.appendChild(gain);
    const gainTimer = setTimeout(() => gain.remove(), 650); respawnTimers.push(gainTimer);
    if (xp >= 100) { xp -= 100; level += 1; asteriStage.classList.add('is-leveling'); const levelTimer = setTimeout(() => asteriStage.classList.remove('is-leveling'), 650); respawnTimers.push(levelTimer); }
    updateHud();
    const timer = setTimeout(() => { enemy.classList.remove('is-dying'); enemy.disabled = false; placeEnemy(enemy, (index + level) % enemyPositions.length); }, 900);
    respawnTimers.push(timer);
  });
  return enemy;
});
ProjectTheater.register('asteri', { reset() { respawnTimers.forEach(clearTimeout); respawnTimers = []; enemyField.querySelectorAll('.xp-pop').forEach(node => node.remove()); asteriStage.classList.remove('is-hit','is-leveling'); xp = 0; level = 1; cleared = 0; updateHud(); enemies.forEach((enemy,index) => { enemy.disabled = false; enemy.classList.remove('is-dying'); placeEnemy(enemy,index); }); } });
updateHud();
```

Add `.xp-pop{position:absolute;color:#f2c86e;font:700 10px var(--mono);animation:xpPop .65s steps(6) forwards;pointer-events:none}@keyframes xpPop{to{opacity:0;transform:translateY(-28px)}}` beside the pixel-death animation. This effect is bounded to one node per successful hit and removes itself after `650 ms`.

- [ ] **Step 6: Add the refined sword cursor and touch fallback**

```css
.asteri-stage{--stage-bg:#0b0912;--project-accent:#d3a85e;background:radial-gradient(circle at 70% 38%,#252039,#0b0912 60%);color:#eee8db}.asteri-game{position:absolute;right:6%;top:20%;width:min(48vw,670px);height:min(52vh,440px);border:3px solid #3c324e;background:linear-gradient(rgba(11,9,18,.22),rgba(11,9,18,.48)),url("../images/fallenasteri.png") center/cover;image-rendering:pixelated;overflow:hidden}.asteri-stage.is-hit .asteri-game{animation:sceneHit .18s steps(2)}.pixel-enemy{position:absolute;width:52px;height:52px;border:0;background:transparent;image-rendering:pixelated}.pixel-enemy i{position:absolute;left:calc(var(--x)*4px + 10px);top:calc(var(--y)*4px + 10px);width:4px;height:4px;background:var(--pixel);transition:transform .5s steps(5),opacity .5s}.pixel-enemy.is-dying{animation:pixelDeath .55s steps(5) forwards}.pixel-enemy.is-dying i{transform:translate(calc((var(--x) - 3.5)*4px),calc((var(--y) - 3.5)*4px));opacity:0}.sword-cursor{position:fixed;z-index:500;pointer-events:none;width:48px;height:68px;display:none;transform:translate(-8px,-58px) rotate(-18deg)}html[data-cursor-context="fallen"].has-custom-cursor .sword-cursor{display:block}html[data-cursor-context="fallen"] #cursor{display:none}@keyframes sceneHit{50%{transform:translateX(3px);filter:brightness(1.3)}100%{transform:translateX(-2px)}}@keyframes pixelDeath{to{opacity:0;transform:translateY(-12px) scale(.45);filter:brightness(2)}}@media(hover:none){.sword-cursor{display:none!important}.pixel-enemy{width:52px;height:52px}.pixel-enemy:active{filter:brightness(1.5)}}@media(max-width:700px){.asteri-game{position:relative;inset:auto;width:100%;height:40dvh;min-height:300px}.pixel-enemy i{left:calc(var(--x)*3px + 14px);top:calc(var(--y)*3px + 14px);width:3px;height:3px}}
```

Add one inline crisp-edge SVG `.sword-cursor`. Position it only while `PortfolioCore.cursor.context === 'fallen'`; the hotspot is the blade tip. Do not add click trails or slash pseudo-elements.

Use this exact element immediately after the global cursor:

```html
<div class="sword-cursor" aria-hidden="true"><svg viewBox="0 0 24 34" shape-rendering="crispEdges"><path fill="#e9e2cf" d="M14 0h4v4h-2v16h-4V4h2z"/><path fill="#8b7ea6" d="M12 20h8v4h-3v3h-3v-3h-2z"/><path fill="#d3a85e" d="M14 27h4v7h-4z"/><path fill="#3c324e" d="M10 4h2v18h2v4h-4z"/></svg></div>
```

Position it without a trail:

```js
const swordCursor = document.querySelector('.sword-cursor');
let swordFrame = 0;
let swordPoint = { x:-100, y:-100 };
window.addEventListener('pointermove', event => {
  swordPoint = { x:event.clientX, y:event.clientY };
  if (window.PortfolioCore.cursor.context !== 'fallen' || swordFrame) return;
  swordFrame = requestAnimationFrame(() => { swordFrame = 0; swordCursor.style.transform = `translate3d(${swordPoint.x - 8}px,${swordPoint.y - 58}px,0) rotate(-18deg)`; });
}, { passive:true });
```

- [ ] **Step 7: Run combat tests and commit**

Run: `npm run test:projects`

Expected: enemies die and respawn, level reaches two after four kills, the sword appears only for fine pointers, and no slash element exists.

```bash
git add index.html styles/project-stages.css scripts/project-stages.js scripts/portfolio-core.js tests/project-stages.spec.js
git commit -m "feat: add fallen asteri combat vignette"
```

---

### Task 8: Verify Mobile Parity, Accessibility, and Transition Resilience

**Files:**
- Modify: `styles/project-stages.css`
- Modify: `scripts/project-stages.js`
- Modify: `tests/project-stages.spec.js`

**Interfaces:**
- Consumes: all project controllers and shared theater state.
- Produces: verified desktop/mobile/touch/keyboard/reduced-motion behavior and safe rapid interaction cleanup.

- [ ] **Step 1: Add mobile and rapid-input regression tests**

```js
for (const viewport of [{ width: 430, height: 932 }, { width: 390, height: 844 }, { width: 360, height: 800 }]) {
  test(`all project stages fit and respond to touch at ${viewport.width}px`, async ({ browser }) => {
    const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    await page.goto('/');
    for (const name of ['bupples','photoshoot','adelante','asteri']) {
      await page.locator(`[data-open-project="${name}"]`).tap();
      const stage = page.locator(`[data-project-stage="${name}"]`);
      await expect(stage).toBeVisible();
      expect(await stage.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
      if (name === 'photoshoot') await page.locator('#shutterButton').tap();
      if (name === 'adelante') await page.locator('.quote-card').first().tap();
      if (name === 'asteri') await page.locator('.pixel-enemy').first().tap();
      await page.locator('[data-close-project]').tap();
      await expect(page.locator('#projectTheater')).not.toHaveAttribute('open', '');
    }
    await context.close();
  });
}

test('every project uses its exact live and repository destinations', async ({ page }) => {
  await page.goto('/');
  const expected = [
    'https://bupples.web.app/',
    'https://github.com/yeegz/Bupples-showcase',
    'https://photoshoot-yeegz.web.app/',
    'https://github.com/yeegz/photoshoot',
    'https://github.com/yeegz/adelante-showcase',
    'https://yeegz.itch.io/fallenasteri',
    'https://github.com/yeegz/Fallen-Asteri'
  ];
  for (const href of expected) await expect(page.locator(`a[href="${href}"]`)).toHaveCount(1);
  await expect(page.locator('a[href*="photoshoot-yeegz.web.app/app"]')).toHaveCount(0);
});

test('rapid project open and close never strands the dialog', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-open-project="bupples"]').click();
  await page.locator('[data-project-nav="next"]').click();
  await page.locator('[data-project-nav="next"]').click();
  await page.locator('[data-close-project]').click();
  await page.waitForTimeout(2_400);
  await expect(page.locator('#projectTheater')).not.toHaveAttribute('open', '');
  await expect(page.locator('html')).not.toHaveClass(/project-open|project-opening|project-closing/);
});

test('stage media reserves layout and loading veil always releases', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-open-project="photoshoot"]').click();
  await expect(page.locator('#projectTheater')).toHaveClass(/media-ready/, { timeout: 1_200 });
  const missingDimensions = await page.locator('[data-project-stage] img').evaluateAll(images => images.filter(image => !image.getAttribute('width') || !image.getAttribute('height')).length);
  expect(missingDimensions).toBe(0);
});
```

- [ ] **Step 2: Add keyboard and reduced-motion coverage**

```js
test('project interactions and focus restoration work from the keyboard', async ({ page }) => {
  await page.goto('/');
  const adelanteTrigger = page.locator('[data-open-project="adelante"]');
  await adelanteTrigger.focus(); await page.keyboard.press('Enter');
  const firstQuote = page.locator('.quote-card').first(); await firstQuote.focus();
  const before = await firstQuote.textContent(); await page.keyboard.press('Space'); await page.waitForTimeout(500);
  expect(await page.locator('.quote-card').first().textContent()).not.toBe(before);
  await page.keyboard.press('Escape'); await expect(adelanteTrigger).toBeFocused();
  const asteriTrigger = page.locator('[data-open-project="asteri"]');
  await asteriTrigger.focus(); await page.keyboard.press('Enter');
  await page.locator('.pixel-enemy').first().focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#asteriXp')).toHaveText('35');
});

test('reduced motion opens and closes the theater without delay', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion:'reduce' }); const page = await context.newPage();
  await page.goto('/'); const started = Date.now();
  await page.locator('[data-open-project="bupples"]').click(); await expect(page.locator('#projectTheater')).toHaveAttribute('open','');
  await page.keyboard.press('Escape'); await expect(page.locator('#projectTheater')).not.toHaveAttribute('open','');
  expect(Date.now() - started).toBeLessThan(350);
  await context.close();
});
```

- [ ] **Step 3: Run the full project suite**

Run: `npm run test:projects`

Expected: every desktop, mobile, touch, keyboard, reduced-motion, and rapid-input test passes.

- [ ] **Step 4: Scan for stale assets and forbidden paths**

Run:

```bash
rg -n "todo\.jpg|Task Management App|photoshoot-yeegz\.web\.app/app|localhost|127\.0\.0\.1|/Users/|Downloads|tmp/|\.superpowers" index.html styles/project-stages.css scripts/project-stages.js
```

Expected: no matches.

- [ ] **Step 5: Capture desktop and mobile stage screenshots**

Run the project tests with tracing, then use Playwright screenshots for all four stages at `1440×1000`, `430×932`, and `360×800`. Inspect Bupples edge clearance, Adelante title/quote breathing room, every Photoshoot crop, Asteri game-frame size, capability rail readability, and close/navigation touch targets.

- [ ] **Step 6: Run the complete portfolio suite and commit final polish**

Run: `npm test`

Expected: shell and project suites both pass.

```bash
git add index.html styles.css script.js styles/project-stages.css scripts/project-stages.js scripts/portfolio-core.js tests/project-stages.spec.js images/projects
git commit -m "fix: polish project stages across desktop and mobile"
```
