# Portfolio Shell and Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the portfolio shell around the approved résumé-synced Skills, Education, Identity, Experience, Contact, theme, loading, transition, and cursor systems while preserving the landing dot-to-photo reveal.

**Architecture:** Keep the existing static HTML/CSS/JavaScript site and GSAP/Lenis landing experience, but isolate new responsibilities into `styles/portfolio-sections.css`, `scripts/portfolio-core.js`, and `scripts/portfolio-sections.js`. `script.js` remains responsible for the existing landing composition and navigation; the new core exposes a small `window.PortfolioCore` contract for theme, motion, and cursor state, and section code progressively enhances semantic HTML.

**Tech Stack:** HTML5, CSS custom properties, vanilla JavaScript, GSAP 3.12.5, ScrollTrigger, Lenis 1.1.18, Playwright Test, Python static server, `sips` image processing.

## Global Constraints

- The supplied `Yousof_Selim_Resume_Final_2027_Internship(2)(1).pdf` is the sole content source of truth.
- Dark mode is the default; light mode restyles every non-project section, including Identity/About.
- Opened project stages retain their own fixed palettes and are implemented by the separate project-stage plan.
- The registered Identity crop is exactly left `368`, top `2448`, width `3010`, height `2358` from `IMG_7210.jpg`.
- Identity uses a smaller photograph on the left and résumé-synced text on the right at desktop widths.
- All six Skills lanes auto-scroll; only the hovered/focused lane pauses; visible edge arrows manually scroll that lane.
- Contact uses bare draggable email typography, not a boxed email card or contact portrait.
- The resting cursor is a low-opacity dotted orbit; actionable states fill with the inverse theme color and show a concise centered action label in roughly `300–380 ms`.
- Initial readiness and scroll-time loading are one authored system: media reserves its dimensions, sections reveal with structure-specific motion, and the outgoing section's final surface is the incoming section's first background stop.
- Scroll motion uses one observer/controller and transform/opacity/custom-property updates; it pauses offscreen and must not create blank gaps, white flashes, or scroll jank.
- Fallen Asteri's sword cursor and all project-local interactions are owned by the project-stage plan.
- Reduced motion, keyboard, touch, no-JavaScript readability, and responsive layouts are mandatory.
- Mobile is a first-class authored experience at `360`, `390`, and `430` CSS pixels: no desktop-only hover dependency, no clipped display type, no horizontal page overflow, touch targets at least `44×44` CSS pixels, and equivalent tap/drag controls for every interaction.
- No production URL may reference `localhost`, `Downloads`, `tmp`, or `.superpowers`.

---

## File Structure

- Modify `index.html`: metadata, loader/theme controls, semantic section markup, asset links, and new stylesheet/script includes.
- Modify `styles.css`: shared theme tokens, landing/Identity registration hooks, old section rule removal, and compatibility with the new files.
- Modify `script.js`: résumé copy constants, landing-to-Identity destination geometry, progress labels, and removal of superseded Contact/Stack/Record handlers.
- Create `styles/portfolio-sections.css`: Skills, Education, Identity, Experience, Contact, boundary ramps, light-mode section surfaces, and responsive rules.
- Create `scripts/portfolio-core.js`: theme persistence, readiness-driven loader, shared section observer, and global cursor state machine.
- Create `scripts/portfolio-sections.js`: Skills auto-scroll, Education reveal, Identity replay, Experience filters, contact drag/copy behavior.
- Replace `Yousof-Selim-Resume.pdf`: approved July 2026 résumé.
- Create `images/identity-photo.jpg`: full registered Identity derivative.
- Create `images/identity-photo-1600.jpg` and `images/identity-photo-960.jpg`: responsive derivatives.
- Create `package.json`, `package-lock.json`, `playwright.config.js`: repeatable browser-test harness.
- Create `tests/portfolio-shell.spec.js`: content, theme, motion, cursor, contact, and responsive regression coverage.

---

### Task 1: Establish the Browser Test Harness

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `playwright.config.js`
- Create: `tests/portfolio-shell.spec.js`

**Interfaces:**
- Consumes: the existing static `index.html` served from repository root.
- Produces: `npm test`, `npm run test:shell`, and a Playwright `page` at `http://127.0.0.1:4173/`.

- [ ] **Step 1: Initialize the package and install the test runner**

Run:

```bash
npm init -y
npm install --save-dev @playwright/test@1.54.1
```

Expected: `package.json` and `package-lock.json` exist and npm reports no install error.

- [ ] **Step 2: Replace the generated scripts with the exact test commands**

```json
{
  "name": "yeegz-portfolio",
  "private": true,
  "scripts": {
    "serve": "python3 -m http.server 4173 --bind 127.0.0.1",
    "test": "playwright test",
    "test:shell": "playwright test tests/portfolio-shell.spec.js",
    "test:projects": "playwright test tests/project-stages.spec.js"
  },
  "devDependencies": {
    "@playwright/test": "1.54.1"
  }
}
```

- [ ] **Step 3: Add the Playwright configuration**

```js
// playwright.config.js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: 'chrome',
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'no-preference',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run serve',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true
  }
});
```

- [ ] **Step 4: Add a passing baseline smoke test**

```js
// tests/portfolio-shell.spec.js
const { test, expect } = require('@playwright/test');

test('the current portfolio loads without page errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('#identity')).toBeVisible();
  expect(errors).toEqual([]);
});
```

- [ ] **Step 5: Run the baseline test**

Run: `npm run test:shell`

Expected: `1 passed`.

- [ ] **Step 6: Commit the harness**

```bash
git add package.json package-lock.json playwright.config.js tests/portfolio-shell.spec.js
git commit -m "test: add portfolio browser harness"
```

---

### Task 2: Synchronize Résumé Content and Stable Assets

**Files:**
- Modify: `index.html:1-75, 176-211, 363-453`
- Modify: `script.js:92-110, 1570-1587`
- Replace: `Yousof-Selim-Resume.pdf`
- Create: `images/identity-photo.jpg`
- Create: `images/identity-photo-1600.jpg`
- Create: `images/identity-photo-960.jpg`
- Modify: `tests/portfolio-shell.spec.js`

**Interfaces:**
- Consumes: the approved résumé PDF and `IMG_7210.jpg` from `/Users/yousofselim/Downloads`.
- Produces: stable production asset URLs and semantic DOM hooks `#skills`, `#education`, `#identity`, `#experience`, and `#contact`.

- [ ] **Step 1: Add failing content-source tests**

Append:

```js
test('content and downloads match the July 2026 résumé', async ({ page, request }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Software Engineering/i);
  await expect(page.locator('body')).toContainText('graduating in 2027');
  await expect(page.locator('body')).toContainText('Digital Marketing Executive');
  await expect(page.locator('body')).not.toContainText('Freelance Software Engineer');
  await expect(page.locator('#skills [data-skill-lane]')).toHaveCount(6);
  await expect(page.locator('#education')).toContainText('Sunway University');
  await expect(page.locator('#education')).toContainText('Multimedia University');
  const response = await request.get('/Yousof-Selim-Resume.pdf');
  expect(response.ok()).toBeTruthy();
  expect((await response.body()).byteLength).toBeGreaterThan(50_000);
});
```

- [ ] **Step 2: Run the content test and confirm current résumé drift**

Run: `npm run test:shell`

Expected: FAIL because the page still contains `Freelance Software Engineer`, has no `#education`, and has five old skill rows.

- [ ] **Step 3: Copy the approved résumé and generate registered photo derivatives**

Run:

```bash
cp "/Users/yousofselim/Downloads/Yousof_Selim_Resume_Final_2027_Internship(2)(1).pdf" "Yousof-Selim-Resume.pdf"
sips -c 2358 3010 --cropOffset 2448 368 "/Users/yousofselim/Downloads/IMG_7210.jpg" --out "images/identity-photo.jpg"
sips -Z 1600 "images/identity-photo.jpg" --out "images/identity-photo-1600.jpg"
sips -Z 960 "images/identity-photo.jpg" --out "images/identity-photo-960.jpg"
```

Expected: the three images keep the same `3010:2358` aspect ratio; the responsive copies have maximum dimensions `1600` and `960`.

- [ ] **Step 4: Update metadata and résumé-facing copy**

Use these exact values in `index.html`:

```html
<title>Yousof Selim — Software Engineering Student</title>
<meta name="description" content="Yousof Selim is a Software Engineering student graduating in 2027 with 3+ years building and shipping mobile, web, and desktop products across iOS, Android, web, and Windows." />
<meta name="color-scheme" content="dark light" />
```

Update every résumé link to `Yousof-Selim-Resume.pdf`, change availability to `FULL-TIME SOFTWARE ENGINEERING INTERNSHIP · JAN–APR 2027`, and remove every user-facing claim that introduces freelance employment absent from the supplied résumé.

- [ ] **Step 5: Replace the old Stack and Record markup with résumé-exact semantic shells**

Use the exact Skills groups:

```html
<section class="scene skills" id="skills" aria-labelledby="skills-title">
  <p class="sec-label">02 / SKILLS · MOVING INDEX</p>
  <h2 id="skills-title">Tools I reach for.</h2>
  <div class="skills-lanes">
    <div class="skills-lane" data-skill-lane tabindex="0" data-label="Languages"><button class="lane-arrow prev" type="button" aria-label="Scroll Languages backward">←</button><div class="skills-track" data-skills="Dart|TypeScript|JavaScript|Python|SQL|HTML/CSS"></div><button class="lane-arrow next" type="button" aria-label="Scroll Languages forward">→</button></div>
    <div class="skills-lane" data-skill-lane tabindex="0" data-label="Mobile & Frontend"><button class="lane-arrow prev" type="button" aria-label="Scroll Mobile and Frontend backward">←</button><div class="skills-track" data-skills="Flutter|Riverpod|Swift/SwiftUI|Kotlin|WidgetKit|Android RemoteViews|Electron|WebGL2"></div><button class="lane-arrow next" type="button" aria-label="Scroll Mobile and Frontend forward">→</button></div>
    <div class="skills-lane" data-skill-lane tabindex="0" data-label="Backend & Data"><button class="lane-arrow prev" type="button" aria-label="Scroll Backend and Data backward">←</button><div class="skills-track" data-skills="Firebase|Firestore|Cloud Functions|Node.js|REST APIs|Supabase/PostgreSQL"></div><button class="lane-arrow next" type="button" aria-label="Scroll Backend and Data forward">→</button></div>
    <div class="skills-lane" data-skill-lane tabindex="0" data-label="Cloud, AI & Services"><button class="lane-arrow prev" type="button" aria-label="Scroll Cloud, AI and Services backward">←</button><div class="skills-track" data-skills="Vertex AI|Gemini|MediaPipe|RevenueCat|Remote Config|App Check"></div><button class="lane-arrow next" type="button" aria-label="Scroll Cloud, AI and Services forward">→</button></div>
    <div class="skills-lane" data-skill-lane tabindex="0" data-label="Tools"><button class="lane-arrow prev" type="button" aria-label="Scroll Tools backward">←</button><div class="skills-track" data-skills="Git/GitHub|Xcode|Figma|Godot Engine"></div><button class="lane-arrow next" type="button" aria-label="Scroll Tools forward">→</button></div>
    <div class="skills-lane" data-skill-lane tabindex="0" data-label="Spoken Languages"><button class="lane-arrow prev" type="button" aria-label="Scroll Spoken Languages backward">←</button><div class="skills-track" data-skills="English (Fluent)|Arabic (Native)"></div><button class="lane-arrow next" type="button" aria-label="Scroll Spoken Languages forward">→</button></div>
  </div>
</section>

<section class="scene education" id="education" aria-labelledby="education-title">
  <p class="sec-label">03 / EDUCATION · TWO CHAPTERS</p>
  <h2 id="education-title">Built in chapters.</h2>
  <div class="education-tabs" role="tablist" aria-label="Education chapters"><button id="education-tab-degree" type="button" role="tab" aria-selected="true" aria-controls="education-degree">2024—2027</button><button id="education-tab-foundation" type="button" role="tab" aria-selected="false" aria-controls="education-foundation" tabindex="-1">May 2023—July 2024</button></div>
  <div class="education-spread">
    <article class="education-panel" id="education-degree" role="tabpanel" aria-labelledby="education-tab-degree"><time>2024—2027</time><div><h3>Bachelor of Software Engineering (Hons)</h3><p>Sunway University / Lancaster University · Subang Jaya, Malaysia</p><small>Expected 2027 · Software Architecture, Data Structures, Mobile Development, Databases, UI/UX Design</small></div></article>
    <article class="education-panel" id="education-foundation" role="tabpanel" aria-labelledby="education-tab-foundation" hidden><time>May 2023—July 2024</time><div><h3>Foundation in Information Technology</h3><p>Multimedia University · Cyberjaya, Malaysia</p><small>Programming, Data Structures, Networking, Web Fundamentals</small></div></article>
  </div>
</section>

<section class="scene experience" id="experience" aria-labelledby="experience-title">
  <p class="sec-label">05 / EXPERIENCE & LEADERSHIP</p>
  <h2 id="experience-title">Content with <em>direction.</em></h2>
  <div class="experience-summary"><p class="experience-count">10+</p><div><h3>Digital Marketing Executive</h3><p>Sunway Cybersecurity Club</p><time>January 2026—Present</time></div></div>
  <div class="campaign-calendar" id="campaignCalendar" aria-label="Content calendar visualization"></div>
  <div class="campaign-filters" aria-label="Campaign categories"><button type="button" data-filter="recruitment">Recruitment</button><button type="button" data-filter="visit">Industry visits</button><button type="button" data-filter="award">Awards</button><button type="button" data-filter="recap">Event recaps</button></div>
  <p>Planned 10+ LinkedIn posts and campaign assets, coordinated the content calendar, produced graphics in Canva, and collaborated with the committee and external partners.</p>
</section>
```

- [ ] **Step 6: Update navigation and progress labels**

Use `Work`, `Skills`, `Education`, `Experience`, and `Contact` as semantic anchor destinations. Update the progress mapping in `script.js` to:

```js
[
  ['#identity', '00 / IDENTITY'],
  ['#work', '01 / WORK'],
  ['#skills', '02 / SKILLS'],
  ['#education', '03 / EDUCATION'],
  ['#experience', '04 / EXPERIENCE'],
  ['#contact', '05 / CONTACT']
]
```

- [ ] **Step 7: Run tests and commit synchronized content**

Run: `npm run test:shell`

Expected: content test passes; smoke test remains green.

```bash
git add index.html script.js Yousof-Selim-Resume.pdf images/identity-photo*.jpg tests/portfolio-shell.spec.js
git commit -m "content: sync portfolio with internship resume"
```

---

### Task 3: Add Theme, Loader, and Boundary-Ramp Core

**Files:**
- Modify: `index.html:1-112, 455-479`
- Modify: `styles.css:1-45, 58-96`
- Create: `styles/portfolio-sections.css`
- Create: `scripts/portfolio-core.js`
- Modify: `tests/portfolio-shell.spec.js`

**Interfaces:**
- Consumes: `#themeToggle`, `#siteLoader`, `[data-section]`, and existing `.cursor` markup.
- Produces: `window.PortfolioCore.theme`, `window.PortfolioCore.motion`, `window.PortfolioCore.cursor`, `html[data-theme]`, and `html.is-ready`.

- [ ] **Step 1: Add failing theme and readiness tests**

```js
test('theme persists and Identity settles into the light palette', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('#themeToggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.waitForTimeout(800);
  const identity = await page.locator('#identity').evaluate(el => ({ color: getComputedStyle(el).color, background: getComputedStyle(el).backgroundImage }));
  expect(identity.color).toBe('rgb(16, 23, 17)');
  expect(identity.background).toContain('rgb(236, 231, 220)');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('loader releases after critical content becomes ready', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/is-ready/);
  await expect(page.locator('#siteLoader')).toHaveAttribute('aria-hidden', 'true');
});

test('section boundaries use continuous themed color ramps', async ({ page }) => {
  await page.goto('/');
  const ramps = await page.evaluate(() => ({
    identity: getComputedStyle(document.querySelector('#identity')).backgroundImage,
    experience: getComputedStyle(document.querySelector('#experience')).backgroundImage,
    contact: getComputedStyle(document.querySelector('#contact')).backgroundImage,
    ...['shell','identity-bg','experience-bg','contact-bg'].reduce((colors, name) => {
      const probe = document.createElement('i');
      probe.style.backgroundColor = `var(--${name})`;
      document.body.appendChild(probe);
      colors[name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return colors;
    }, {})
  }));
  expect(ramps.identity).toContain(ramps.shell);
  expect(ramps.identity).toContain(ramps.identityBg);
  expect(ramps.experience).toContain(ramps.identityBg);
  expect(ramps.experience).toContain(ramps.experienceBg);
  expect(ramps.contact).toContain(ramps.experienceBg);
  expect(ramps.contact).toContain(ramps.contactBg);
});
```

- [ ] **Step 2: Verify the new tests fail**

Run: `npm run test:shell`

Expected: FAIL because `#themeToggle`, `#siteLoader`, and `PortfolioCore` do not exist.

- [ ] **Step 3: Add semantic loader and theme control markup**

```html
<div class="site-loader" id="siteLoader" role="status" aria-live="polite" aria-label="Loading portfolio">
  <span class="loader-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
  <span class="loader-name">YSF.SLM</span>
</div>
```

Place this immediately after `<body>`. Add this button inside `.site-head` before the résumé link:

```html
<button class="theme-toggle" id="themeToggle" type="button" aria-pressed="false" data-cursor-action="LIGHT">
  <span aria-hidden="true">◐</span><span id="themeLabel">Dark</span>
</button>
```

Load the focused files before the existing `script.js`:

```html
<link rel="stylesheet" href="styles/portfolio-sections.css?v=1" />
<script src="scripts/portfolio-core.js?v=1" defer></script>
<script src="scripts/portfolio-sections.js?v=1" defer></script>
```

- [ ] **Step 4: Define the theme tokens and section handoff ramps**

Add to `styles.css`:

```css
:root {
  color-scheme: dark;
  --bg: #090a0a; --ink: #f0eee8; --ink-soft: #c9c5bd; --muted: #92918b;
  --line: rgba(240,238,232,.14); --line-soft: rgba(240,238,232,.07); --accent: #9bcfa5;
  --shell: #0d100e; --identity-bg: #0c0d0d; --experience-bg: #111511;
  --contact-bg: #0e100f; --contact-bridge: #141815;
  --header-wash: rgba(9,10,10,.86);
  --cursor-fill: #f0eee8; --cursor-text: #090a0a; --cursor-dots: .44;
}
:root[data-theme="light"] {
  color-scheme: light;
  --bg: #eee8db; --ink: #101711; --ink-soft: #344038; --muted: #5d665f;
  --line: rgba(16,23,17,.16); --line-soft: rgba(16,23,17,.08); --accent: #315d43;
  --shell: #e2ddcf; --identity-bg: #ece7dc; --experience-bg: #e2e4dc;
  --contact-bg: #e8e3d7; --contact-bridge: #e5e2d8;
  --header-wash: rgba(238,232,219,.88);
  --cursor-fill: #101711; --cursor-text: #eee8db; --cursor-dots: .30;
}
body, .site-head, .site-foot { transition: background-color .75s cubic-bezier(.16,1,.3,1), color .55s; }
.site-head::before { background: linear-gradient(180deg, var(--header-wash), transparent); }
#identity { background: linear-gradient(to bottom, var(--shell), var(--identity-bg) 96px); }
#experience { background: linear-gradient(to bottom, var(--identity-bg), var(--experience-bg) 112px); }
#contact { background: linear-gradient(to bottom, var(--experience-bg), var(--contact-bridge) 105px, var(--contact-bg) 220px); }
.site-foot { background: linear-gradient(to bottom, var(--contact-bg), var(--bg)); }
```

- [ ] **Step 5: Implement the core contract**

```js
// scripts/portfolio-core.js
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');
  root.classList.toggle('reduced', reduced);
  const toggle = document.getElementById('themeToggle');
  const label = document.getElementById('themeLabel');
  const loader = document.getElementById('siteLoader');
  const saved = localStorage.getItem('portfolio-theme');
  const initial = saved === 'light' || saved === 'dark' ? saved : 'dark';

  const setTheme = theme => {
    root.dataset.theme = theme;
    localStorage.setItem('portfolio-theme', theme);
    toggle?.setAttribute('aria-pressed', String(theme === 'light'));
    if (label) label.textContent = theme === 'light' ? 'Light' : 'Dark';
    toggle?.setAttribute('data-cursor-action', theme === 'light' ? 'DARK' : 'LIGHT');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#eee8db' : '#090a0a');
  };

  setTheme(initial);
  toggle?.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

  const observe = (element, enter, exit = () => {}) => {
    if (reduced || !('IntersectionObserver' in window)) { enter(element); return { disconnect() {} }; }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.isIntersecting ? enter(entry.target) : exit(entry.target)), { rootMargin: '15% 0px' });
    observer.observe(element);
    return observer;
  };

  const cursor = {
    context: 'default',
    setContext(name) { this.context = name; root.dataset.cursorContext = name; },
    resetContext() { this.setContext('default'); }
  };

  const release = () => {
    root.classList.add('is-ready');
    loader?.setAttribute('aria-hidden', 'true');
  };
  const critical = Array.from(document.querySelectorAll('[data-critical-image]'));
  const criticalReady = Promise.all(critical.map(img => img.complete ? Promise.resolve() : new Promise(resolve => { img.addEventListener('load', resolve, { once: true }); img.addEventListener('error', resolve, { once: true }); })));
  const minimumDisplay = new Promise(resolve => setTimeout(resolve, reduced ? 0 : 720));
  Promise.race([
    Promise.all([criticalReady, minimumDisplay]),
    new Promise(resolve => setTimeout(resolve, 1800))
  ]).then(release);

  window.PortfolioCore = { reduced, theme: { get: () => root.dataset.theme, set: setTheme, toggle: () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark') }, motion: { observe }, cursor };
})();
```

- [ ] **Step 6: Register section-specific scroll entrances with one observer**

Add `data-section` and one of these values to each primary section: `identity`, `work`, `skills`, `education`, `experience`, `contact`. Add `data-reveal` only to semantic content that may safely begin visually hidden after JavaScript boots.

Append before exporting `PortfolioCore`:

```js
const sectionObserver = reduced || !('IntersectionObserver' in window) ? null : new IntersectionObserver(entries => {
  entries.forEach(entry => {
    entry.target.classList.toggle('is-section-visible', entry.isIntersecting);
    if (entry.isIntersecting) root.dataset.activeSection = entry.target.dataset.section;
  });
}, { rootMargin: '-12% 0px -18%', threshold: .12 });
document.querySelectorAll('[data-section]').forEach(section => {
  if (sectionObserver) sectionObserver.observe(section);
  else section.classList.add('is-section-visible');
});
document.querySelectorAll('[data-loading-image]').forEach(image => {
  const settle = () => image.classList.add('is-loaded');
  if (image.complete) settle();
  else { image.addEventListener('load', settle, { once:true }); image.addEventListener('error', settle, { once:true }); }
});
```

Use section-specific CSS rather than one repeated fade:

```css
.js:not(.reduced) [data-section] [data-reveal] { opacity: 0; transform: translateY(20px); }
.js:not(.reduced) [data-section].is-section-visible [data-reveal] { opacity: 1; transform: none; transition: opacity .62s ease, transform .72s cubic-bezier(.16,1,.3,1); }
.skills.is-section-visible .skills-track { opacity: 1; transform: translateX(0); }
.education .education-panel { clip-path: inset(0 100% 0 0); }
.education.is-section-visible .education-panel { clip-path: inset(0); transition: clip-path .9s cubic-bezier(.16,1,.3,1); }
.experience .campaign-calendar::before { transform: scaleX(0); transform-origin: left; }
.experience.is-section-visible .campaign-calendar::before { transform: scaleX(1); transition: transform .8s cubic-bezier(.16,1,.3,1); }
.contact h2 { clip-path: inset(0 0 100%); }
.contact.is-section-visible h2 { clip-path: inset(0); transition: clip-path .9s cubic-bezier(.16,1,.3,1); }
[data-loading-image] { background: color-mix(in srgb,var(--ink) 5%,var(--bg)); }
[data-loading-image].is-loaded { background: transparent; transition: background .35s; }
```

For every below-the-fold image, keep explicit `width`, `height`, and `aspect-ratio`, add `data-loading-image`, and toggle `.is-loaded` on `load` or immediately when `complete`. Do not delay section visibility while noncritical images decode.

- [ ] **Step 7: Add loader visuals and reduced-motion behavior**

```css
.site-loader { position: fixed; inset: 0; z-index: 1000; display: grid; place-content: center; gap: 1rem; background: var(--bg); color: var(--ink); transition: opacity .45s, visibility .45s; }
.loader-mark { display: flex; gap: 8px; justify-content: center; }
.loader-mark i { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); animation: loaderDot .7s ease-in-out infinite alternate; }
.loader-mark i:nth-child(2) { animation-delay: .08s; }.loader-mark i:nth-child(3) { animation-delay: .16s; }.loader-mark i:nth-child(4) { animation-delay: .24s; }
.loader-name { font: 500 .68rem var(--mono); letter-spacing: .2em; }
.is-ready .site-loader { opacity: 0; visibility: hidden; pointer-events: none; }
@keyframes loaderDot { to { transform: translateY(-7px); opacity: .35; } }
@media (prefers-reduced-motion: reduce) { .loader-mark i { animation: none; } }
```

- [ ] **Step 8: Run theme, loader, and scroll-handoff tests and commit**

Run: `npm run test:shell`

Expected: all tests pass.

```bash
git add index.html styles.css styles/portfolio-sections.css scripts/portfolio-core.js tests/portfolio-shell.spec.js
git commit -m "feat: add portfolio theme and motion core"
```

---

### Task 4: Build the Skills and Education Experiences

**Files:**
- Modify: `styles/portfolio-sections.css`
- Create: `scripts/portfolio-sections.js`
- Modify: `tests/portfolio-shell.spec.js`

**Interfaces:**
- Consumes: `[data-skill-lane]`, `.skills-track[data-skills]`, `.lane-arrow`, `PortfolioCore.motion.observe`.
- Produces: duplicated seamless skill tracks, per-lane pause state, manual arrow scrolling, and chapter reveal classes.

- [ ] **Step 1: Add failing Skills interaction tests**

```js
test('every Skills lane moves, only the hovered lane pauses, and its arrow scrolls', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('#skills');
  await section.scrollIntoViewIfNeeded();
  const tracks = page.locator('.skills-track');
  const before = await tracks.evaluateAll(nodes => nodes.map(node => node.scrollLeft));
  await page.waitForTimeout(1100);
  const after = await tracks.evaluateAll(nodes => nodes.map(node => node.scrollLeft));
  expect(after.every((value, index) => Math.abs(value - before[index]) > 7)).toBeTruthy();
  const first = page.locator('[data-skill-lane]').first();
  await first.hover();
  const pausedBefore = await tracks.evaluateAll(nodes => nodes.map(node => node.scrollLeft));
  await page.waitForTimeout(650);
  const pausedAfter = await tracks.evaluateAll(nodes => nodes.map(node => node.scrollLeft));
  expect(Math.abs(pausedAfter[0] - pausedBefore[0])).toBeLessThan(2);
  expect(pausedAfter.slice(1).every((value, index) => Math.abs(value - pausedBefore[index + 1]) > 4)).toBeTruthy();
  await first.locator('.next').click();
  await page.waitForTimeout(420);
  expect(await tracks.first().evaluate(node => Math.abs(node.scrollLeft - pausedAfter[0]))).toBeGreaterThan(70);
});

test('Education chapters switch with click and arrow keys', async ({ page }) => {
  await page.goto('/'); await page.locator('#education').scrollIntoViewIfNeeded();
  const foundation = page.locator('#education-tab-foundation');
  await foundation.click();
  await expect(foundation).toHaveAttribute('aria-selected','true');
  await expect(page.locator('#education-foundation')).toBeVisible();
  await foundation.focus(); await page.keyboard.press('ArrowRight');
  await expect(page.locator('#education-tab-degree')).toHaveAttribute('aria-selected','true');
  await expect(page.locator('#education-degree')).toBeVisible();
});
```

- [ ] **Step 2: Confirm the Skills test fails**

Run: `npm run test:shell`

Expected: FAIL because the data-only tracks do not yet contain scrollable chips or animation.

- [ ] **Step 3: Implement deterministic per-lane scrolling**

```js
// scripts/portfolio-sections.js
(() => {
  const { reduced, motion } = window.PortfolioCore;
  const lanes = Array.from(document.querySelectorAll('[data-skill-lane]'));
  lanes.forEach((lane, laneIndex) => {
    const track = lane.querySelector('.skills-track');
    const values = track.dataset.skills.split('|');
    const set = values.map(value => `<span class="skill-chip">${value}</span>`).join('');
    track.innerHTML = `<span class="skill-set">${set}</span><span class="skill-set" aria-hidden="true">${set}</span>`;
    let paused = reduced;
    let visible = true;
    let raf = 0;
    let last = performance.now();
    const speed = 18 + laneIndex * 1.75;
    const tick = now => {
      const dt = Math.min(40, now - last); last = now;
      if (!paused) {
        track.scrollLeft += speed * dt / 1000;
        if (track.scrollLeft >= track.scrollWidth / 2) track.scrollLeft -= track.scrollWidth / 2;
      }
      raf = visible ? requestAnimationFrame(tick) : 0;
    };
    const start = () => { visible = true; if (!reduced && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    const stop = () => { visible = false; if (raf) cancelAnimationFrame(raf); raf = 0; };
    const setPaused = state => { paused = state; };
    lane.addEventListener('pointerenter', () => setPaused(true));
    lane.addEventListener('pointerleave', () => setPaused(false));
    lane.addEventListener('focusin', () => setPaused(true));
    lane.addEventListener('focusout', event => { if (!lane.contains(event.relatedTarget)) setPaused(false); });
    lane.querySelector('.prev').addEventListener('click', () => track.scrollBy({ left: -220, behavior: reduced ? 'auto' : 'smooth' }));
    lane.querySelector('.next').addEventListener('click', () => track.scrollBy({ left: 220, behavior: reduced ? 'auto' : 'smooth' }));
    motion.observe(lane, start, stop);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  });

  const educationTabs = Array.from(document.querySelectorAll('[role="tab"][aria-controls^="education-"]'));
  const selectEducation = tab => {
    educationTabs.forEach(candidate => {
      const selected = candidate === tab;
      candidate.setAttribute('aria-selected', String(selected)); candidate.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(candidate.getAttribute('aria-controls')); panel.hidden = !selected;
      if (selected) requestAnimationFrame(() => panel.classList.add('is-visible'));
    });
  };
  educationTabs.forEach((tab,index) => {
    tab.addEventListener('click', () => selectEducation(tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
      event.preventDefault(); const offset = event.key === 'ArrowRight' ? 1 : -1;
      const next = educationTabs[(index + offset + educationTabs.length) % educationTabs.length]; selectEducation(next); next.focus();
    });
  });
  document.querySelectorAll('.education-panel').forEach(panel => motion.observe(panel, element => element.classList.add('is-visible')));
})();
```

- [ ] **Step 4: Add the readable moving-lane and editorial chapter styling**

```css
.skills { overflow: hidden; background: var(--bg); }
.skills-lanes { margin-inline: calc(var(--pad-x) * -1); border-block: 1px solid var(--line); }
.skills-lane { position: relative; min-height: 104px; border-bottom: 1px solid var(--line); display: grid; align-items: center; }
.skills-lane::before { content: attr(data-label); position: absolute; left: var(--pad-x); top: 12px; z-index: 2; color: var(--muted); font: 500 .56rem var(--mono); letter-spacing: .15em; text-transform: uppercase; }
.skills-track { display: flex; gap: 1rem; overflow: hidden; scrollbar-width: none; padding: 32px 5rem 16px; }
.skill-set { display: flex; gap: 1rem; flex: none; padding-right: 1rem; }
.skill-chip { flex: none; color: var(--ink); font: 700 clamp(1.2rem, 2.2vw, 2rem) var(--disp); letter-spacing: -.03em; }
.skill-chip::after { content: "↗"; color: var(--accent); margin-left: .7rem; font: 400 .6em var(--mono); }
.lane-arrow { position: absolute; inset-block: 0; z-index: 4; width: 74px; border: 0; color: var(--ink); background: linear-gradient(90deg, var(--bg), transparent); opacity: 0; transition: opacity .25s; }
.lane-arrow.prev { left: 0; text-align: left; padding-left: var(--pad-x); }
.lane-arrow.next { right: 0; text-align: right; padding-right: var(--pad-x); background: linear-gradient(-90deg, var(--bg), transparent); }
.skills-lane:hover .lane-arrow, .skills-lane:focus-within .lane-arrow { opacity: 1; }
.education { background: var(--bg); }
.education-tabs { display:flex; gap:clamp(1rem,4vw,3rem); border-bottom:1px solid var(--line); }
.education-tabs button { min-height:44px; border:0; border-bottom:2px solid transparent; background:transparent; color:var(--muted); font:500 .65rem var(--mono); letter-spacing:.12em; }
.education-tabs button[aria-selected="true"] { color:var(--accent); border-bottom-color:var(--accent); }
.education-panel { display: grid; grid-template-columns: minmax(110px, 18vw) 1fr; padding: clamp(2rem, 6vw, 5rem) 0; opacity: 0; transform: translateY(28px); transition: opacity .7s, transform .7s cubic-bezier(.16,1,.3,1); }
.education-panel.is-visible { opacity: 1; transform: none; }
.education-panel[hidden] { display:none; }
.education-panel time { color: var(--accent); font: 500 clamp(1.2rem, 2vw, 2rem) var(--mono); }
.education-panel h3 { color: var(--ink); font: 800 clamp(2rem, 5vw, 5.5rem)/.9 var(--disp); letter-spacing: -.055em; }
.education-panel p, .education-panel small { color: var(--muted); }
@media (hover: none) { .lane-arrow { opacity: .72; width: 58px; min-height: 44px; } .skills-track { overflow-x: auto; touch-action: pan-x; } }
@media (max-width: 430px) { .skills-lane { min-height: 92px; } .skill-chip { font-size: 1.15rem; } .education-panel { grid-template-columns: 1fr; gap: 1rem; } .education-tabs{overflow-x:auto}.education-tabs button{flex:0 0 auto} }
```

- [ ] **Step 5: Run tests and commit**

Run: `npm run test:shell`

Expected: all tests pass, including lane-local pause and arrow behavior.

```bash
git add styles/portfolio-sections.css scripts/portfolio-sections.js tests/portfolio-shell.spec.js
git commit -m "feat: build kinetic skills and editorial education"
```

---

### Task 5: Register the Identity Reveal and Experience Calendar

**Files:**
- Modify: `index.html:114-211` and the new `#experience` section
- Modify: `styles.css:97-335, 689-719`
- Modify: `styles/portfolio-sections.css`
- Modify: `script.js:483-805`
- Modify: `scripts/portfolio-sections.js`
- Modify: `tests/portfolio-shell.spec.js`

**Interfaces:**
- Consumes: `#portraitSlot`, `#gardenImg`, `#portraitCanvas`, `#campaignCalendar`, campaign filter buttons.
- Produces: an aligned dot-to-photo destination with no geometry jump and filterable campaign markers.

- [ ] **Step 1: Add failing Identity and Experience tests**

```js
test('Identity uses the registered image and desktop split layout', async ({ page }) => {
  await page.goto('/');
  const figure = page.locator('#portraitSlot');
  const copy = page.locator('.about-body');
  await figure.scrollIntoViewIfNeeded();
  const [figureBox, copyBox] = await Promise.all([figure.boundingBox(), copy.boundingBox()]);
  expect(figureBox.width).toBeLessThan(520);
  expect(figureBox.x).toBeLessThan(copyBox.x);
  await expect(page.locator('#gardenImg')).toHaveAttribute('src', /identity-photo-1600\.jpg/);
});

test('Experience filters emphasize one campaign category without hiding résumé copy', async ({ page }) => {
  await page.goto('/');
  await page.locator('#experience').scrollIntoViewIfNeeded();
  await page.locator('[data-filter="award"]').click();
  await expect(page.locator('#campaignCalendar')).toHaveAttribute('data-active-filter', 'award');
  await expect(page.locator('.campaign-marker[data-category="award"]').first()).toHaveClass(/is-emphasized/);
  await expect(page.locator('#experience')).toContainText('Planned 10+ LinkedIn posts');
});
```

- [ ] **Step 2: Verify the tests fail**

Run: `npm run test:shell`

Expected: FAIL because the old Identity source/layout and empty calendar remain.

- [ ] **Step 3: Register the developed photograph with the landing target**

Replace the Identity image with:

```html
<img id="gardenImg" src="images/identity-photo-1600.jpg" srcset="images/identity-photo-960.jpg 960w, images/identity-photo-1600.jpg 1600w, images/identity-photo.jpg 3010w" sizes="(max-width: 900px) 88vw, 36vw" alt="Yousof Selim seated in a stone opening in Melaka" loading="eager" decoding="async" width="3010" height="2358" data-critical-image />
```

Use this résumé-synced copy beside it:

```html
<div class="about-body"><p class="sec-label">00 / IDENTITY · DEVELOPED</p><h2 class="about-title">Software,<br>built <em>with intent.</em></h2><p class="about-lead">Software Engineering student graduating in 2027 with 3+ years of experience building and shipping mobile, web, and desktop products across iOS, Android, web, and Windows.</p><dl class="about-facts"><div><dt>Focus</dt><dd>Mobile and full-stack product development</dd></div><div><dt>Practice</dt><dd>Design, engineering, testing, and delivery</dd></div><div><dt>Location</dt><dd>Subang Jaya / Kuala Lumpur</dd></div><div><dt>Languages</dt><dd>English · fluent<br>Arabic · native</dd></div></dl></div>
```

Use the same aspect ratio for `.portrait-wrap`, `.portrait-canvas`, and `.about-figure`. Replace the old destination math with this helper and feed its returned rectangle into the existing GSAP transform calculation:

```js
const getIdentityTargetRect = () => {
  const slot = document.getElementById('portraitSlot');
  const image = document.getElementById('gardenImg');
  const rect = slot.getBoundingClientRect();
  const ratio = 3010 / 2358;
  const width = rect.width;
  const height = width / ratio;
  image.width = 3010; image.height = 2358;
  return { left: rect.left, top: rect.top + (rect.height - height) / 2, width, height };
};
const target = getIdentityTargetRect();
portraitCanvas.width = Math.round(target.width * Math.min(devicePixelRatio || 1, 2));
portraitCanvas.height = Math.round(target.height * Math.min(devicePixelRatio || 1, 2));
portraitCanvas.style.width = `${target.width}px`;
portraitCanvas.style.height = `${target.height}px`;
```

Do not use the old `yousof-color.png` destination dimensions.

- [ ] **Step 4: Apply the approved Identity layout and tone**

```css
.about-panel { min-height: 730px; display: grid; grid-template-columns: minmax(300px, 36vw) minmax(0, 1fr); align-items: center; gap: clamp(3rem, 8vw, 9rem); padding: 10rem var(--pad-x); color: var(--ink); }
.about-figure { width: min(36vw, 475px); aspect-ratio: 3010 / 2358; margin: 0; overflow: hidden; background: #181714; box-shadow: 0 30px 75px rgba(0,0,0,.34); }
.about-figure img { width: 100%; height: 100%; object-fit: cover; filter: brightness(.8) saturate(.82) contrast(.98); }
.about-body { max-width: 640px; }
.about-title { font: 900 clamp(3.3rem, 6vw, 5.9rem)/.8 var(--disp); letter-spacing: -.06em; text-transform: uppercase; }
@media (max-width: 900px) { .about-panel { grid-template-columns: 1fr; min-height: auto; } .about-figure { width: min(88vw, 520px); } }
```

- [ ] **Step 5: Populate and filter the Experience calendar**

Append inside the section IIFE:

```js
const calendar = document.getElementById('campaignCalendar');
if (calendar) {
  const campaigns = [
    ['Jan', 'recruitment', 28], ['Feb', 'recruitment', 55], ['Feb', 'recap', 74],
    ['Mar', 'visit', 37], ['Mar', 'recap', 68], ['Apr', 'award', 45],
    ['May', 'visit', 35], ['May', 'recruitment', 66], ['Jun', 'award', 38],
    ['Jun', 'recap', 70], ['Now', 'recruitment', 54]
  ];
  calendar.innerHTML = campaigns.map(([month, category, top], index) => `<button class="campaign-marker" type="button" data-category="${category}" style="--month:${index};--top:${top}%" aria-label="${month} ${category} campaign"><span>${month}</span></button>`).join('');
  const markers = Array.from(calendar.querySelectorAll('.campaign-marker'));
  document.querySelectorAll('.campaign-filters [data-filter]').forEach(button => button.addEventListener('click', () => {
    const next = calendar.dataset.activeFilter === button.dataset.filter ? '' : button.dataset.filter;
    calendar.dataset.activeFilter = next;
    document.querySelectorAll('.campaign-filters [data-filter]').forEach(candidate => candidate.setAttribute('aria-pressed', String(candidate === button && !!next)));
    markers.forEach(marker => marker.classList.toggle('is-emphasized', !!next && marker.dataset.category === next));
  }));
}
```

Add calendar rules that use a seven-column desktop grid, preserve the résumé paragraph, and become horizontally scrollable below `760px`.

```css
.campaign-calendar { position:relative; display:grid; grid-template-columns:repeat(7,minmax(100px,1fr)); min-height:255px; border-block:1px solid var(--line); overflow:hidden; }
.campaign-calendar::before { content:""; position:absolute; inset:0; background:repeating-linear-gradient(90deg,transparent 0,transparent calc(14.285% - 1px),var(--line) calc(14.285% - 1px),var(--line) 14.285%); pointer-events:none; }
.campaign-marker { position:absolute; left:calc((var(--month) / 11) * (100% - 24px)); top:var(--top); width:14px; height:14px; border:1px solid currentColor; border-radius:50%; background:var(--experience-bg); color:var(--muted); transition:transform .25s,opacity .25s,color .25s; }
.campaign-marker[data-category="recruitment"]{color:var(--accent)}.campaign-marker[data-category="visit"]{color:#7aa4bd}.campaign-marker[data-category="award"]{color:#c29b49}.campaign-marker[data-category="recap"]{color:#ae7da2}
.campaign-calendar[data-active-filter] .campaign-marker:not(.is-emphasized){opacity:.16}.campaign-marker.is-emphasized{transform:scale(1.55)}
.campaign-filters{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px}.campaign-filters button{min-height:44px;border:1px solid var(--line);background:transparent;color:var(--muted);padding:0 12px}.campaign-filters button[aria-pressed="true"]{color:var(--accent);border-color:var(--accent)}
@media(max-width:760px){.campaign-calendar{width:100%;overflow-x:auto;grid-template-columns:repeat(7,110px)}.experience{overflow-x:hidden}.experience>.campaign-calendar{max-width:100%}}
```

- [ ] **Step 6: Run tests and commit**

Run: `npm run test:shell`

Expected: all Identity and Experience tests pass with zero horizontal overflow.

```bash
git add index.html styles.css styles/portfolio-sections.css script.js scripts/portfolio-sections.js tests/portfolio-shell.spec.js
git commit -m "feat: align identity reveal and experience calendar"
```

---

### Task 6: Rebuild Contact and the Global Reactive Cursor

**Files:**
- Modify: `index.html:421-479`
- Modify: `styles.css:537-675`
- Modify: `styles/portfolio-sections.css`
- Modify: `script.js:32-52, 1453-1565, 1667-1733`
- Modify: `scripts/portfolio-sections.js`
- Modify: `scripts/portfolio-core.js`
- Modify: `tests/portfolio-shell.spec.js`

**Interfaces:**
- Consumes: `#dragMail`, `#mailTrack`, `#copyMail`, `[data-cursor-action]`, `PortfolioCore.cursor`.
- Produces: bounded email drag, copy outcome, inverse-theme action cursor, and project context hook `PortfolioCore.cursor.setContext(name)`.

- [ ] **Step 1: Add failing drag and cursor tests**

```js
test('email drags within bounds, springs home, and copies', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  const mail = page.locator('#dragMail');
  await mail.scrollIntoViewIfNeeded();
  const box = await mail.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 160, box.y + box.height / 2 + 90, { steps: 8 });
  expect(Math.abs(await mail.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41))).toBeLessThanOrEqual(90);
  await page.mouse.up();
  await page.waitForTimeout(750);
  expect(Math.abs(await mail.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41))).toBeLessThan(1);
  await page.locator('#copyMail').click();
  await expect(page.locator('#copyMail')).toContainText('Copied');
});

test('action cursor fills with inverse theme color and a verb', async ({ page }) => {
  await page.goto('/');
  await page.locator('#copyMail').scrollIntoViewIfNeeded();
  await page.locator('#copyMail').hover();
  await page.waitForTimeout(420);
  await expect(page.locator('#cursor')).toHaveClass(/cur-action/);
  await expect(page.locator('#cursorLabel')).toHaveText('COPY');
  expect(await page.locator('.cursor-disc').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(240, 238, 232)');
  await page.locator('#themeToggle').click();
  await page.locator('#copyMail').hover();
  await page.waitForTimeout(420);
  expect(await page.locator('.cursor-disc').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(16, 23, 17)');
});
```

- [ ] **Step 2: Confirm the Contact tests fail**

Run: `npm run test:shell`

Expected: FAIL because the old Contact photo, magnetic email, and cursor states are still present.

- [ ] **Step 3: Replace Contact with the approved typographic sign-off**

```html
<section class="scene contact" id="contact" aria-labelledby="contact-title">
  <div class="contact-top"><p>Available for full-time internship · Jan–Apr 2027</p><p>Subang Jaya / Kuala Lumpur · Malaysia</p></div>
  <div class="contact-poster"><h2 id="contact-title">Let's build <em>something memorable.</em></h2><p>Move the address gently. Click without dragging to open your email client, or copy it directly.</p></div>
  <div class="mail-track" id="mailTrack"><a class="drag-mail" id="dragMail" href="mailto:yousofselim2@gmail.com" data-cursor-action="DRAG">yousofselim2@gmail.com</a><button id="copyMail" type="button" data-cursor-action="COPY">Copy address ↗</button></div>
  <div class="contact-foot"><nav aria-label="Profiles"><a href="https://github.com/yeegz" target="_blank" rel="noopener" data-cursor-action="OPEN">GitHub ↗</a><a href="https://www.linkedin.com/in/ysf-slm" target="_blank" rel="noopener" data-cursor-action="OPEN">LinkedIn ↗</a><a href="Yousof-Selim-Resume.pdf" download data-cursor-action="PDF">Résumé ↓</a></nav><p>Designed and built by hand · 2026</p></div>
</section>
```

Remove `.contact-shader`, `.contact-fig`, and image-filled Contact ghost logic.

Add the typographic layout and restrained glow:

```css
.contact { --contact-x:50%; --contact-y:42%; min-height:940px; display:flex; flex-direction:column; justify-content:center; gap:clamp(2rem,6vw,5rem); overflow:hidden; background:radial-gradient(circle at var(--contact-x) var(--contact-y),color-mix(in srgb,var(--accent) 5%,transparent),transparent 28%),linear-gradient(to bottom,var(--experience-bg),var(--contact-bridge) 105px,var(--contact-bg) 220px); }
.contact-top,.contact-foot{display:flex;justify-content:space-between;gap:2rem;color:var(--muted);font:500 .62rem var(--mono);letter-spacing:.12em;text-transform:uppercase}.contact-poster{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(230px,.55fr);gap:clamp(3rem,8vw,8rem);align-items:end}.contact-poster h2{max-width:9ch;font:900 clamp(4.25rem,10.5vw,10rem)/.74 var(--disp);letter-spacing:-.075em;text-transform:uppercase}.contact-poster h2 em{display:block;margin-left:18%;color:var(--accent);font:italic .31em/1 var(--serif);white-space:nowrap}.contact-poster>p{border-left:1px solid var(--line);padding-left:1.5rem;color:var(--muted)}.mail-track{min-height:164px;border-block:1px solid var(--line);display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:1.5rem;padding:1.5rem clamp(.6rem,2.5vw,2.25rem);overflow:hidden}.drag-mail{--mail-x:0px;--mail-y:0px;--mail-r:0deg;justify-self:center;max-width:100%;padding:.5rem 0;border-bottom:4px solid var(--accent);font:720 clamp(1.25rem,4vw,3.8rem)/1 var(--disp);letter-spacing:-.045em;overflow-wrap:anywhere;transform:translate3d(var(--mail-x),var(--mail-y),0) rotate(var(--mail-r));transition:transform .65s cubic-bezier(.16,1,.3,1),color .25s;touch-action:none;user-select:none}.drag-mail.is-dragging{transition:none}.mail-track button{min-width:44px;min-height:44px;border:0;background:transparent;color:var(--accent)}.contact-foot nav{display:flex;flex-wrap:wrap;gap:clamp(1rem,3vw,2.5rem)}
@media(max-width:700px){.contact{min-height:auto;padding-block:8rem}.contact-top,.contact-foot{align-items:flex-start;flex-direction:column}.contact-poster{grid-template-columns:1fr}.contact-poster h2 em{margin-left:8%;white-space:normal}.mail-track{grid-template-columns:1fr}.drag-mail{justify-self:start;font-size:clamp(1.15rem,6.4vw,2rem)}.mail-track button{justify-self:end}}
```

- [ ] **Step 4: Implement bounded drag and copy behavior**

Append inside `scripts/portfolio-sections.js`:

```js
const dragMail = document.getElementById('dragMail');
const mailTrack = document.getElementById('mailTrack');
const contactSection = document.getElementById('contact');
let dragState = null;
contactSection?.addEventListener('pointermove', event => {
  if (!matchMedia('(pointer:fine)').matches) return;
  const bounds = contactSection.getBoundingClientRect();
  contactSection.style.setProperty('--contact-x', `${(event.clientX - bounds.left) / bounds.width * 100}%`);
  contactSection.style.setProperty('--contact-y', `${(event.clientY - bounds.top) / bounds.height * 100}%`);
}, { passive:true });
if (dragMail && mailTrack) {
  dragMail.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragState = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    dragMail.setPointerCapture(event.pointerId);
    dragMail.classList.add('is-dragging');
  });
  dragMail.addEventListener('pointermove', event => {
    if (!dragState || dragState.id !== event.pointerId) return;
    const dx = Math.max(-88, Math.min(88, event.clientX - dragState.x));
    const dy = Math.max(-34, Math.min(34, event.clientY - dragState.y));
    dragState.moved ||= Math.hypot(dx, dy) > 5;
    dragMail.style.setProperty('--mail-x', `${dx}px`);
    dragMail.style.setProperty('--mail-y', `${dy}px`);
    dragMail.style.setProperty('--mail-r', `${Math.max(-3.2, Math.min(3.2, dx / 28))}deg`);
  });
  const release = event => {
    if (!dragState || dragState.id !== event.pointerId) return;
    dragMail.dataset.suppressClick = String(dragState.moved);
    dragState = null;
    dragMail.classList.remove('is-dragging');
    dragMail.style.setProperty('--mail-x', '0px');
    dragMail.style.setProperty('--mail-y', '0px');
    dragMail.style.setProperty('--mail-r', '0deg');
  };
  dragMail.addEventListener('pointerup', release);
  dragMail.addEventListener('pointercancel', release);
  dragMail.addEventListener('click', event => { if (dragMail.dataset.suppressClick === 'true') { event.preventDefault(); dragMail.dataset.suppressClick = 'false'; } });
}

document.getElementById('copyMail')?.addEventListener('click', async event => {
  try {
    await navigator.clipboard.writeText('yousofselim2@gmail.com');
    event.currentTarget.textContent = 'Copied ✓';
  } catch {
    location.href = 'mailto:yousofselim2@gmail.com';
  }
});
```

- [ ] **Step 5: Replace cursor markup and state logic**

Use this markup:

```html
<div class="cursor" id="cursor" aria-hidden="true"><span class="cursor-dot"></span><span class="cursor-ring"><span class="cursor-disc"></span><svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="19" /></svg><span id="cursorLabel"></span></span></div>
```

In `scripts/portfolio-core.js`, add this single-frame pointer loop and action mapping. Keep `cursor.setContext('fallen')` as a public hook; the project plan will replace the orbit with the sword only while that context is active.

```js
const cursorElement = document.getElementById('cursor');
const cursorRing = cursorElement?.querySelector('.cursor-ring');
const cursorDot = cursorElement?.querySelector('.cursor-dot');
const cursorLabel = document.getElementById('cursorLabel');
if (cursorElement && matchMedia('(pointer:fine)').matches && !reduced) {
  root.classList.add('has-custom-cursor');
  let point = { x:-100, y:-100 };
  let cursorFrame = 0;
  const paintCursor = () => {
    cursorFrame = 0;
    cursorDot.style.transform = `translate3d(${point.x}px,${point.y}px,0)`;
    cursorRing.style.transform = `translate3d(${point.x}px,${point.y}px,0)`;
  };
  window.addEventListener('pointermove', event => {
    point = { x:event.clientX, y:event.clientY };
    if (!cursorFrame) cursorFrame = requestAnimationFrame(paintCursor);
    cursorElement.classList.add('is-visible');
    const action = event.target.closest('[data-cursor-action],a,button');
    const verb = action?.dataset.cursorAction || (action?.tagName === 'A' ? 'OPEN' : action ? 'SELECT' : '');
    cursorElement.classList.toggle('cur-action', Boolean(action));
    cursorLabel.textContent = verb;
  }, { passive:true });
  window.addEventListener('pointerdown', () => cursorElement.classList.add('is-pressed'));
  window.addEventListener('pointerup', () => cursorElement.classList.remove('is-pressed'));
  document.addEventListener('mouseleave', () => cursorElement.classList.remove('is-visible'));
}
```

Use these exact transition values:

```css
.cursor-ring { width: 46px; height: 46px; transition: width .36s cubic-bezier(.2,.72,.25,1), height .36s cubic-bezier(.2,.72,.25,1); }
.cursor-ring svg circle { fill: none; stroke: var(--cursor-fill); stroke-width: 1.35; stroke-linecap: round; stroke-dasharray: 1 8; opacity: var(--cursor-dots); }
.cursor-disc { position: absolute; inset: 4px; border-radius: 50%; background: var(--cursor-fill); opacity: 0; scale: .18; transition: scale .36s cubic-bezier(.2,.72,.25,1), opacity .26s; }
.cur-action .cursor-ring { width: 76px; height: 76px; }
.cur-action .cursor-disc { opacity: 1; scale: 1; }
.cur-action .cursor-ring svg { opacity: 0; }
.cur-action #cursorLabel { color: var(--cursor-text); opacity: 1; }
```

- [ ] **Step 6: Run tests and commit**

Run: `npm run test:shell`

Expected: all tests pass; Contact has no photograph and cursor action states use inverse colors.

```bash
git add index.html styles.css styles/portfolio-sections.css script.js scripts/portfolio-core.js scripts/portfolio-sections.js tests/portfolio-shell.spec.js
git commit -m "feat: rebuild contact and reactive cursor"
```

---

### Task 7: Complete Responsive, Reduced-Motion, and Visual QA

**Files:**
- Modify: `styles.css`
- Modify: `styles/portfolio-sections.css`
- Modify: `scripts/portfolio-core.js`
- Modify: `scripts/portfolio-sections.js`
- Modify: `tests/portfolio-shell.spec.js`

**Interfaces:**
- Consumes: all shell/section contracts from Tasks 1–6.
- Produces: verified desktop/mobile/reduced-motion behavior with no production-path leaks.

- [ ] **Step 1: Add cross-viewport and reduced-motion tests**

```js
for (const viewport of [{ width: 1440, height: 1000 }, { width: 820, height: 900 }, { width: 430, height: 932 }, { width: 390, height: 844 }, { width: 360, height: 800 }]) {
  test(`shell has no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });
}

test('mobile controls do not depend on hover', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto('/');
  await page.locator('#skills').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-skill-lane]').first().locator('.next')).toBeVisible();
  const before = await page.locator('.skills-track').first().evaluate(node => node.scrollLeft);
  await page.locator('[data-skill-lane]').first().locator('.next').tap();
  await page.waitForTimeout(450);
  expect(await page.locator('.skills-track').first().evaluate(node => Math.abs(node.scrollLeft - before))).toBeGreaterThan(70);
  await page.locator('#experience').scrollIntoViewIfNeeded();
  await page.locator('[data-filter="award"]').tap();
  await expect(page.locator('#campaignCalendar')).toHaveAttribute('data-active-filter', 'award');
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect(page.locator('#dragMail')).toBeVisible();
  await expect(page.locator('#copyMail')).toBeVisible();
  await context.close();
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('exposes all essential content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#skills')).toBeVisible();
    await expect(page.locator('#education')).toBeVisible();
    await expect(page.locator('#experience')).toBeVisible();
    await expect(page.locator('#contact')).toBeVisible();
    await expect(page.locator('#siteLoader')).toHaveAttribute('aria-hidden', 'true');
  });
});
```

- [ ] **Step 2: Run the full shell suite**

Run: `npm run test:shell`

Expected: all tests pass at 1440, 820, 430, 390, and 360 pixels with reduced motion enabled for its dedicated case.

- [ ] **Step 3: Scan for forbidden production paths and stale content**

Run:

```bash
rg -n "localhost|127\.0\.0\.1|/Users/|Downloads|tmp/|\.superpowers|Task Management App|Freelance Software Engineer|INTERNSHIPS — 2026" index.html styles.css script.js styles scripts
```

Expected: no matches.

- [ ] **Step 4: Capture comparison screenshots**

Run:

```bash
npx playwright screenshot --channel=chrome --viewport-size=1440,1000 --full-page http://127.0.0.1:4173 tmp/qa-shell-dark.png
npx playwright screenshot --channel=chrome --viewport-size=390,844 --full-page http://127.0.0.1:4173 tmp/qa-shell-mobile.png
npx playwright screenshot --channel=chrome --viewport-size=360,800 --full-page http://127.0.0.1:4173 tmp/qa-shell-mobile-compact.png
```

Inspect all images for clipped headings, abrupt color seams, unreadable lanes, misplaced registered photo geometry, undersized touch targets, and Contact overflow.

- [ ] **Step 5: Run all browser tests and commit the QA fixes**

Run: `npm test`

Expected: all available Playwright tests pass.

```bash
git add index.html styles.css script.js styles scripts tests Yousof-Selim-Resume.pdf images/identity-photo*.jpg package.json package-lock.json playwright.config.js
git commit -m "fix: polish responsive portfolio shell"
```
