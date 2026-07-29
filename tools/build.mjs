#!/usr/bin/env node
/**
 * Static generator for the case-study routes.
 *
 * Reads content/site.json + content/projects/*.json, validates them against
 * content/schema.mjs, and writes work/<slug>/index.html plus work/index.html
 * and an updated sitemap.xml. Output is committed, so GitHub Pages keeps
 * serving a plain static site with no runtime framework.
 *
 *   node tools/build.mjs          build
 *   node tools/build.mjs --check  validate only, write nothing
 *
 * Design rule enforced here rather than in the templates: a section whose
 * content is absent renders NOTHING — no heading, no empty container, no
 * stray rule. That is why every renderer below starts by bailing on empty.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAll } from '../content/schema.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://yeegz.github.io';
const CHECK_ONLY = process.argv.includes('--check');

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const readJSON = (p) => JSON.parse(read(p));

/** Escape for HTML text nodes and quoted attributes. */
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Present only if there is something to present. */
const has = (v) =>
  v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0) && !(typeof v === 'string' && !v.trim());

/**
 * Inline emphasis for authored prose: *word* becomes the site's serif-italic
 * accent voice. Escapes first, so content can never inject markup.
 */
const rich = (s) => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>');

const list = (arr, fn) => (has(arr) ? arr.map(fn).join('\n') : '');

/** Section wrapper. Returns '' when the body is empty so nothing renders. */
function section(id, num, label, title, body, opts = {}) {
  if (!has(body)) return '';
  const ghost = opts.ghost ? ` data-ghost="${esc(opts.ghost)}"` : '';
  return `
<section class="cs-section${opts.className ? ' ' + opts.className : ''}" id="${esc(id)}"${ghost} aria-labelledby="${esc(id)}-t">
  <span class="cs-ghost" aria-hidden="true">${esc(num)}</span>
  <header class="cs-sec-head" data-reveal>
    <p class="sec-label">${esc(num)}<span class="slash">/</span>${esc(label)}</p>
    <h2 class="cs-sec-title" id="${esc(id)}-t">${rich(title)}</h2>
    <div class="sec-rail" aria-hidden="true"><i class="sec-rail-spark"></i></div>
  </header>
  <div class="cs-sec-body" data-reveal>${body}</div>
</section>`;
}

/* ------------------------------------------------------------------ */
/* fragments                                                           */
/* ------------------------------------------------------------------ */

/**
 * The schema declares `architecture`, `flow` and friends as objects without
 * pinning their inner shape, so independently-authored content files drifted:
 * one used {label, nodes} where another used {title, items}, and one wrote flow
 * steps as plain strings where another wrote {title, body}. The renderer read
 * only the first spelling, so a whole architecture diagram rendered as empty
 * boxes without failing anything.
 *
 * normalise() accepts every spelling actually in use and reduces it to one.
 * assertNothingDropped() then fails the build if the result is empty, so a
 * future mismatch is a red build rather than a blank section on a live page.
 */
function normalise(p) {
  const a = p.architecture;
  if (a && Array.isArray(a.groups)) {
    a.groups = a.groups.map((g) => ({
      ...g,
      label: g.label ?? g.title ?? '',
      nodes: g.nodes ?? g.items ?? [],
    }));
  }
  if (a && Array.isArray(a.edges)) {
    a.edges = a.edges.map((e) => ({ ...e, via: e.via ?? e.label ?? '' }));
  }
  /* Several list fields were authored as strings in one file and as
     {title, body} objects in another. The renderers assumed strings, so an
     object list rendered as literal "[object Object]" on a live page. Flatten
     any such list to a single rich string. */
  const flatten = (v) =>
    typeof v === 'string'
      ? v
      : v && typeof v === 'object'
        ? [v.title, v.body].filter(Boolean).join(' — ') || String(v.value ?? '')
        : String(v ?? '');

  if (p.problem && Array.isArray(p.problem.points)) p.problem.points = p.problem.points.map(flatten);
  if (p.testing && Array.isArray(p.testing.cases)) p.testing.cases = p.testing.cases.map(flatten);
  if (p.contribution) {
    for (const k of ['owned', 'notOwned']) {
      if (Array.isArray(p.contribution[k])) p.contribution[k] = p.contribution[k].map(flatten);
    }
  }
  if (p.lessons) {
    for (const k of ['worked', 'underestimated', 'next']) {
      if (Array.isArray(p.lessons[k])) p.lessons[k] = p.lessons[k].map(flatten);
    }
  }

  if (p.flow && Array.isArray(p.flow.steps)) {
    p.flow.steps = p.flow.steps.map((s) =>
      typeof s === 'string' ? { title: '', body: s } : { title: s.title ?? '', body: s.body ?? '' }
    );
  }
  return p;
}

function assertNothingDropped(p) {
  const errs = [];
  const a = p.architecture;
  if (a) {
    if (!has(a.alt)) errs.push(`${p.slug}.architecture.alt: required — the diagram needs a text alternative`);
    const TIER_NAMES = TIERS.map(([t]) => t);
    const ids = new Set();
    (a.groups || []).forEach((g, i) => {
      if (!has(g.label)) errs.push(`${p.slug}.architecture.groups[${i}].label: empty after normalising (expected label/title)`);
      if (!has(g.nodes)) errs.push(`${p.slug}.architecture.groups[${i}].nodes: empty after normalising (expected nodes/items)`);
      /* Both of these shipped broken: every group rendered data-tier="core",
         which no rule matches, and Photoshoot addressed its groups by display
         name so all nine of its edges pointed at nothing. Neither failed
         anything, so both reached the live site. */
      if (!has(g.id)) errs.push(`${p.slug}.architecture.groups[${i}].id: required — edges address groups by id`);
      else if (ids.has(g.id)) errs.push(`${p.slug}.architecture.groups[${i}].id: duplicate "${g.id}"`);
      else ids.add(g.id);
      if (!TIER_NAMES.includes(g.tier)) {
        errs.push(`${p.slug}.architecture.groups[${i}].tier: must be one of ${TIER_NAMES.join(' / ')} (got ${JSON.stringify(g.tier)})`);
      }
    });
    (a.edges || []).forEach((e, i) => {
      for (const end of ['from', 'to']) {
        if (!ids.has(e[end])) {
          errs.push(`${p.slug}.architecture.edges[${i}].${end}: "${e[end]}" matches no group id — the edge would point at nothing`);
        }
      }
    });
  }
  const stringLists = [
    ['problem.points', p.problem?.points],
    ['testing.cases', p.testing?.cases],
    ['contribution.owned', p.contribution?.owned],
    ['contribution.notOwned', p.contribution?.notOwned],
    ['lessons.worked', p.lessons?.worked],
    ['lessons.underestimated', p.lessons?.underestimated],
    ['lessons.next', p.lessons?.next],
  ];
  for (const [name, list] of stringLists) {
    (list || []).forEach((v, i) => {
      if (typeof v !== 'string' || !v.trim()) {
        errs.push(`${p.slug}.${name}[${i}]: must be a non-empty string after flattening (got ${typeof v}) — this is what renders as "[object Object]"`);
      }
    });
  }

  (p.flow?.steps || []).forEach((s, i) => {
    if (!has(s.body)) errs.push(`${p.slug}.flow.steps[${i}]: empty body after normalising`);
  });
  return errs;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2026-02 – Present" reads like a database row. Render it like a sentence. */
function humanDate(s) {
  return String(s).replace(/(\d{4})-(\d{2})/g, (_, y, m) => {
    const name = MONTHS[Number(m) - 1];
    return name ? `${name} ${y}` : `${y}`;
  });
}

function quickFacts(p) {
  const rows = [
    ['Role', p.role],
    ['Team', p.team],
    ['Timeline', humanDate(p.timeline)],
    ['Status', p.status],
    ['Category', p.category],
    ['Platforms', has(p.platforms) ? p.platforms.join(' · ') : null],
  ].filter(([, v]) => has(v));

  // The stack row is a sibling, not a full-width grid child: a `1 / -1` span
  // makes auto-fit keep every generated track, which left empty cells showing
  // the container's rule colour whenever the fact count did not divide evenly.
  return `
<dl class="cs-facts">
  ${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('\n  ')}
</dl>
${
  has(p.stack)
    ? `<dl class="cs-stack"><dt>Built with</dt><dd>${p.stack.map((t) => `<span class="cs-chip">${esc(t)}</span>`).join('')}</dd></dl>`
    : ''
}`;
}

function linkRow(p) {
  if (!has(p.links)) return '';
  return `<nav class="cs-links" aria-label="${esc(p.name)} destinations">
  ${p.links
    .map((l) => {
      const external = /^https?:/.test(l.href);
      const arrow = l.kind === 'store' || l.kind === 'play' ? '↗' : external ? '↗' : '→';
      return `<a class="cs-link cs-link-${esc(l.kind)}" href="${esc(l.href)}"${
        external ? ' target="_blank" rel="noopener"' : ''
      } data-cursor="OPEN">${esc(l.label)}<span class="cta-arr" aria-hidden="true">${arrow}</span></a>`;
    })
    .join('\n  ')}
</nav>`;
}

/**
 * A citation for a claim. Deliberately esc() and not rich(): these strings hold
 * shell globs like '*_test.dart', and the emphasis pass would eat the asterisks.
 */
const cite = (text, kicker) =>
  has(text) ? `<p class="cs-cite"><span>${esc(kicker)}</span>${esc(text)}</p>` : '';

function problem(p) {
  if (!has(p.problem)) return '';
  const { lead, points } = p.problem;
  return `<div class="cs-prose">
  ${has(lead) ? `<p class="cs-lead">${rich(lead)}</p>` : ''}
  ${has(points) ? `<ul class="cs-points">${points.map((x) => `<li>${rich(x)}</li>`).join('')}</ul>` : ''}
</div>`;
}

function contribution(p) {
  if (!has(p.contribution)) return '';
  const { owned, notOwned } = p.contribution;
  return `<div class="cs-split">
  ${
    has(owned)
      ? `<div class="cs-owned"><h3 class="cs-h3">What I designed and engineered</h3><ul class="cs-ticks">${owned
          .map((x) => `<li>${rich(x)}</li>`)
          .join('')}</ul></div>`
      : ''
  }
  ${
    has(notOwned)
      ? `<div class="cs-not-owned"><h3 class="cs-h3">What I did not own</h3><ul class="cs-ticks cs-ticks-muted">${notOwned
          .map((x) => `<li>${rich(x)}</li>`)
          .join('')}</ul></div>`
      : ''
  }
</div>`;
}

const itemGrid = (arr, cls = '') =>
  !has(arr)
    ? ''
    : `<div class="cs-grid ${cls}">${arr
        .map(
          (c, i) => `<article class="cs-card">
    <p class="cs-card-n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</p>
    <h3 class="cs-card-t">${rich(c.title)}</h3>
    <p>${rich(c.body)}</p>
    ${cite(c.evidence, 'Evidence')}
  </article>`,
        )
        .join('\n')}</div>`;

function flow(p) {
  if (!has(p.flow) || !has(p.flow.steps)) return '';
  return `<figure class="cs-flow">
  <ol class="cs-flow-steps">
    ${p.flow.steps
      .map(
        (s, i) => `<li class="cs-step">
      <span class="cs-step-n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      ${has(s.title) ? `<h3 class="cs-step-t">${esc(s.title)}</h3>` : ''}
      <p>${rich(s.body)}</p>
    </li>`,
      )
      .join('\n    ')}
  </ol>
  ${has(p.flow.caption) ? `<figcaption>${rich(p.flow.caption)}</figcaption>` : ''}
</figure>`;
}

/* Where each tier runs. This is the board's reading order, top to bottom. */
const TIERS = [
  ['client', 'On the device'],
  ['server', 'On my infrastructure'],
  ['external', 'Outside the system'],
];

/**
 * Architecture is drawn with layout, not an image, so it stays legible at any
 * width, works in both themes, and can carry a real text alternative.
 *
 * The board used to be a wrapping flex row of boxes sized by their longest
 * sentence: leftover space on each line was left unfilled and painted with the
 * board's own background, which is the empty rectangle that made this section
 * look broken. Groups are now banded by tier and laid out in equal tracks, so
 * width is a design decision and no track can be empty.
 *
 * `role="img"` used to sit on the board, which prunes every descendant from the
 * accessibility tree — all 35 node lines were unreachable, leaving one enormous
 * aria-label as the only channel. The labels and lists are already good markup,
 * so they are simply exposed, and the prose alternative moves into the figure.
 */
function architecture(p) {
  if (!has(p.architecture) || !has(p.architecture.groups)) return '';
  const a = p.architecture;
  const nodeId = (id) => `arch-${esc(p.slug)}-${esc(id)}`;
  const labelOf = new Map(a.groups.map((g) => [g.id, g.label]));

  const band = ([tier, heading]) => {
    const groups = a.groups.filter((g) => (g.tier || 'client') === tier);
    if (!groups.length) return '';
    return `<section class="cs-arch-band" data-tier="${esc(tier)}">
      <p class="cs-arch-band-l">${esc(heading)}</p>
      <div class="cs-arch-groups">
        ${groups
          .map(
            (g) => `<div class="cs-arch-group" id="${nodeId(g.id)}" data-node="${esc(g.id)}" data-tier="${esc(tier)}">
          <p class="cs-arch-label">${esc(g.label)}</p>
          <ul class="cs-arch-nodes">${(g.nodes || []).map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
          ${has(g.note) ? `<p class="cs-arch-note">${esc(g.note)}</p>` : ''}
        </div>`,
          )
          .join('\n        ')}
      </div>
    </section>`;
  };

  /* Edges printed raw ids — "web → functions" named nothing a reader could see
     on the board. They now resolve to the group's own label and link to it. */
  const edge = (e) => {
    const cell = (id) =>
      labelOf.has(id)
        ? `<a href="#${nodeId(id)}"><b>${esc(labelOf.get(id))}</b></a>`
        : `<b>${esc(id)}</b>`;
    return `<li>${cell(e.from)}<i aria-hidden="true">→</i>${cell(e.to)}<span>${esc(e.via || '')}</span></li>`;
  };

  return `<figure class="cs-arch">
  ${has(a.alt) ? `<p class="vh">${esc(a.alt)}</p>` : ''}
  <div class="cs-arch-board">
    ${TIERS.map(band).filter(Boolean).join('\n    ')}
  </div>
  ${
    has(a.edges)
      ? `<ol class="cs-arch-edges">${a.edges.map(edge).join('')}</ol>`
      : ''
  }
  ${has(a.caption) ? `<figcaption>${rich(a.caption)}</figcaption>` : ''}
</figure>`;
}

function challenges(p) {
  if (!has(p.challenges)) return '';
  return p.challenges
    .map(
      (c, i) => `<article class="cs-challenge" id="challenge-${i + 1}">
  <p class="cs-challenge-n" aria-hidden="true">CH.${String(i + 1).padStart(2, '0')}</p>
  <h3 class="cs-challenge-t">${rich(c.title)}</h3>
  <div class="cs-challenge-body">
    <div class="cs-cbeat"><p class="cs-beat-l">Why it was hard</p><p>${rich(c.why)}</p></div>
    ${
      has(c.options)
        ? `<div class="cs-cbeat"><p class="cs-beat-l">Options considered</p><ul class="cs-points">${c.options
            .map((o) => `<li>${rich(o)}</li>`)
            .join('')}</ul></div>`
        : ''
    }
    <div class="cs-cbeat"><p class="cs-beat-l">What I built</p><p>${rich(c.solution)}</p></div>
    ${has(c.tradeoff) ? `<div class="cs-cbeat"><p class="cs-beat-l">What it cost</p><p>${rich(c.tradeoff)}</p></div>` : ''}
    ${has(c.validation) ? `<div class="cs-cbeat"><p class="cs-beat-l">How I know it works</p><p>${rich(c.validation)}</p></div>` : ''}
    <div class="cs-cbeat cs-cbeat-out"><p class="cs-beat-l">Result</p><p>${rich(c.result)}</p></div>
  </div>
  ${cite(c.evidence, 'Where to look')}
</article>`,
    )
    .join('\n');
}

function decisions(p) {
  if (!has(p.decisions)) return '';
  return `<div class="cs-decisions">
  ${p.decisions
    .map(
      (d, i) => `<article class="cs-decision">
    <p class="cs-dec-n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</p>
    <h3 class="cs-h3">${rich(d.title)}</h3>
    <div class="cs-dec-fork">
      <p class="cs-dec-chose"><span>Chose</span> ${rich(d.chose)}</p>
      ${has(d.instead) ? `<p class="cs-dec-alt"><span>Instead of</span> ${rich(d.instead)}</p>` : ''}
    </div>
    <p class="cs-dec-why">${rich(d.because)}</p>
    ${has(d.cost) ? `<p class="cs-dec-cost"><span>Trade-off</span> ${rich(d.cost)}</p>` : ''}
    ${cite(d.evidence, 'Where to look')}
  </article>`,
    )
    .join('\n  ')}
</div>`;
}

function testing(p) {
  if (!has(p.testing)) return '';
  const t = p.testing;
  return `<div class="cs-testing">
  ${has(t.lead) ? `<p class="cs-lead">${rich(t.lead)}</p>` : ''}
  ${
    has(t.stats)
      ? `<dl class="cs-metrics">${t.stats
          .map((s) => `<div><dt>${esc(s.label)}</dt><dd>${esc(s.value)}</dd>${cite(s.evidence, 'How it was counted')}</div>`)
          .join('')}</dl>`
      : ''
  }
  ${
    has(t.cases)
      ? `<div class="cs-cases"><h3 class="cs-h3">Representative cases</h3><ul class="cs-points">${t.cases
          .map((c) => `<li>${rich(c)}</li>`)
          .join('')}</ul></div>`
      : ''
  }
</div>`;
}

function results(p) {
  if (!has(p.results)) return '';
  return `<dl class="cs-metrics cs-metrics-lg">${p.results
    .map((r) => `<div><dt>${esc(r.title)}</dt><dd>${rich(r.body)}</dd></div>`)
    .join('')}</dl>`;
}

function lessons(p) {
  if (!has(p.lessons)) return '';
  const l = p.lessons;
  const col = (label, arr) =>
    has(arr) ? `<div><h3 class="cs-h3">${esc(label)}</h3><ul class="cs-points">${arr.map((x) => `<li>${rich(x)}</li>`).join('')}</ul></div>` : '';
  return `<div class="cs-lessons">
  ${col('What worked', l.worked)}
  ${col('What I underestimated', l.underestimated)}
  ${col('What I would do next', l.next)}
</div>`;
}

/**
 * A phone screenshot and a desktop window are not the same kind of picture, and
 * letting each one claim the full column made the set read as an accident: the
 * 830x1800 captures rendered nearly 2,800px tall while the 1202x956 one sat
 * short and wide. Orientation is derived from the declared size and carried on
 * the markup so the stylesheet can frame each kind properly — phone captures
 * stand side by side at a phone's width, wide captures get the column.
 */
function media(p) {
  if (!has(p.media)) return '';
  const shapeOf = (m) => (m.width && m.height && m.width / m.height < 0.8 ? 'portrait' : 'landscape');
  const shapes = new Set(p.media.map(shapeOf));
  const set = shapes.size > 1 ? 'mixed' : [...shapes][0];
  return `<div class="cs-media" data-shape="${esc(set)}">
  ${p.media
    .map(
      (m, i) => `<figure class="cs-fig cs-fig-${shapeOf(m)}">
    <img src="${esc(m.src)}" alt="${esc(m.alt)}"${m.width ? ` width="${m.width}"` : ''}${
      m.height ? ` height="${m.height}"` : ''
    } loading="lazy" decoding="async" />
    <figcaption><b aria-hidden="true">FIG. ${String(i + 1).padStart(2, '0')}</b>${rich(m.caption)}</figcaption>
  </figure>`,
    )
    .join('\n  ')}
</div>`;
}

/* ------------------------------------------------------------------ */
/* page                                                                */
/* ------------------------------------------------------------------ */

const NAV = `
<header class="site-head cs-head" id="siteHead">
  <a class="brand" href="/#top">ysf.slm<span class="brand-dot"></span></a>
  <nav class="site-nav" aria-label="Site">
    <a href="/#work"><sup>01</sup>Work</a>
    <a href="/#skills"><sup>02</sup>Skills</a>
    <a href="/#education"><sup>03</sup>Education</a>
    <a href="/#experience"><sup>04</sup>Experience</a>
    <a href="/#contact"><sup>05</sup>Contact</a>
  </nav>
  <div class="head-actions">
    <button class="head-egg-off" id="eggOff" type="button" data-cursor="EXIT" hidden>Exit Egypt<span aria-hidden="true">×</span></button>
    <a class="head-resume" href="/Yousof-Selim-Resume.pdf" download data-cursor="PDF">Résumé</a>
    <a class="head-simple" href="/simple/" data-cursor="SCAN">Simple</a>
    <button class="theme-toggle" id="themeToggle" type="button" aria-pressed="false" aria-label="Switch to light mode" data-cursor="LIGHT">
      <svg class="theme-icon theme-icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.25"/><path d="M12 2.2v2.1M12 19.7v2.1M2.2 12h2.1M19.7 12h2.1M5.08 5.08l1.49 1.49M17.43 17.43l1.49 1.49M18.92 5.08l-1.49 1.49M6.57 17.43l-1.49 1.49"/></svg>
      <svg class="theme-icon theme-icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.15A8.25 8.25 0 0 1 8.85 4 8.25 8.25 0 1 0 20 15.15Z"/></svg>
    </button>
  </div>
</header>`;

const HEAD_BOOT = `<script>
document.documentElement.classList.replace('no-js','js');
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
try {
  var t = localStorage.getItem('ysf-theme');
  document.documentElement.dataset.theme = t === 'light' ? 'light' : 'dark';
  if (localStorage.getItem('ysf-egypt')) {
    document.documentElement.classList.add('egypt');
    document.documentElement.dataset.theme = 'dark';
  }
} catch (_) { document.documentElement.dataset.theme = 'dark'; }
</script>`;

/** Only offer a contents entry for a section that actually rendered. */
function tocFor(parts) {
  const items = parts.filter((x) => x.html).map((x) => `<li><a href="#${x.id}">${esc(x.label)}</a></li>`);
  if (items.length < 3) return '';
  return `<nav class="cs-toc" aria-label="On this page">
  <p class="cs-toc-l">On this page</p>
  <ol>${items.join('')}</ol>
</nav>`;
}

function renderProject(p, all) {
  const idx = all.findIndex((x) => x.slug === p.slug);
  const prev = all[idx - 1];
  const next = all[idx + 1];

  const parts = [
    { id: 'overview', label: 'Overview', html: `<div class="cs-prose"><p class="cs-lead">${rich(p.summary)}</p></div>` },
    { id: 'problem', label: 'The problem', html: problem(p) },
    { id: 'role', label: 'My role', html: contribution(p) },
    { id: 'constraints', label: 'Constraints', html: itemGrid(p.constraints) },
    { id: 'research', label: 'Research', html: itemGrid(p.research) },
    { id: 'flow', label: 'Product flow', html: flow(p) },
    { id: 'architecture', label: 'Architecture', html: architecture(p) },
    { id: 'challenges', label: 'Engineering challenges', html: challenges(p) },
    { id: 'decisions', label: 'Technical decisions', html: decisions(p) },
    { id: 'evolution', label: 'Design evolution', html: itemGrid(p.evolution) },
    { id: 'testing', label: 'Testing', html: testing(p) },
    { id: 'results', label: 'Results', html: results(p) },
    { id: 'lessons', label: 'Reflection', html: lessons(p) },
  ];

  /* The display line with a serif-italic phrase dropped under it is this site's
     signature. Used on all thirteen of these it stopped being a voice and became
     a stamp — the same construction thirty-nine times across three case studies,
     which reads as generated rather than written. Seven of the thirteen are now
     plain statements; the device is kept for the ones where the turn actually
     earns it. */
  const LABELS = {
    overview: ['01', 'EXECUTIVE SUMMARY', 'The short version'],
    problem: ['02', 'THE PROBLEM', 'What was *broken.*'],
    role: ['03', 'ROLE & OWNERSHIP', 'Mine, and not mine'],
    constraints: ['04', 'CONSTRAINTS', 'The boundaries it was built inside'],
    research: ['05', 'RESEARCH & DISCOVERY', 'What I *found out.*'],
    flow: ['06', 'PRODUCT FLOW', 'The path through it'],
    architecture: ['07', 'SYSTEM ARCHITECTURE', 'How it *fits together.*'],
    challenges: ['08', 'ENGINEERING CHALLENGES', 'Where it got difficult'],
    decisions: ['09', 'TECHNICAL DECISIONS', 'Why *this way.*'],
    evolution: ['10', 'DESIGN EVOLUTION', 'What changed, and when'],
    testing: ['11', 'TESTING & RELIABILITY', 'How it is *proven.*'],
    results: ['12', 'RESULTS', 'What *shipped.*'],
    lessons: ['13', 'REFLECTION', 'In hindsight'],
  };

  /* Numbering follows what actually rendered. The numbers used to be a fixed
     column in LABELS, and since no project declares `research`, every case
     study's ghost numerals ran 01-04 then jumped to 06 — a gap in a signature
     device reads as a bug, not as a missing chapter.

     The className is what makes a per-section design possible at all: section()
     always accepted one and no call site ever passed it, so all thirteen
     sections shared one anonymous container and case.css had nothing to hang a
     bespoke layout on. */
  const body = parts
    .filter((x) => x.html)
    .map((x, i) => {
      const [, label, title] = LABELS[x.id];
      return section(x.id, String(i + 1).padStart(2, '0'), label, title, x.html, { className: 'cs-s-' + x.id });
    })
    .join('\n');

  const related = `
<nav class="cs-related" aria-label="More work">
  ${prev ? `<a class="cs-rel cs-rel-prev" href="/work/${esc(prev.slug)}/"><span>Previous</span><b>${esc(prev.name)}</b></a>` : ''}
  <a class="cs-rel cs-rel-all" href="/work/"><span>All work</span><b>Selected work</b></a>
  ${next ? `<a class="cs-rel cs-rel-next" href="/work/${esc(next.slug)}/"><span>Next</span><b>${esc(next.name)}</b></a>` : ''}
</nav>`;

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: p.name,
    description: p.tagline,
    applicationCategory: p.category,
    operatingSystem: has(p.platforms) ? p.platforms.join(', ') : undefined,
    author: { '@type': 'Person', name: 'Yousof Selim', url: ORIGIN + '/' },
    url: `${ORIGIN}/work/${p.slug}/`,
  };
  const store = (p.links || []).find((l) => l.kind === 'store');
  if (store) jsonld.downloadUrl = store.href;

  const ogImage = p.seo?.image ? `${ORIGIN}/${String(p.seo.image).replace(/^\//, '')}` : `${ORIGIN}/images/og-card.jpg?v=2`;

  return `<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<title>${esc(p.seo.title)}</title>
<meta name="description" content="${esc(p.seo.description)}" />
<meta name="author" content="Yousof Selim" />
<meta name="theme-color" content="${esc(p.ground)}" />
<meta name="color-scheme" content="dark light" />
<link rel="canonical" href="${ORIGIN}/work/${esc(p.slug)}/" />

<meta property="og:type" content="article" />
<meta property="og:site_name" content="ysf.slm" />
<meta property="og:title" content="${esc(p.seo.title)}" />
<meta property="og:description" content="${esc(p.seo.description)}" />
<meta property="og:url" content="${ORIGIN}/work/${esc(p.slug)}/" />
<meta property="og:image" content="${esc(ogImage)}" />
<meta property="og:image:alt" content="${esc(p.name)} — ${esc(p.tagline)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(p.seo.title)}" />
<meta name="twitter:description" content="${esc(p.seo.description)}" />
<meta name="twitter:image" content="${esc(ogImage)}" />

<link rel="icon" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/favicon.svg" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,600..900&family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@300..700&family=JetBrains+Mono:wght@400;500&display=swap" />
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,600..900&family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@300..700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" media="print" onload="this.media='all'" />
<noscript><link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,600..900&family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@300..700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" /></noscript>

<link rel="stylesheet" href="/styles.css?v=95" />
<link rel="stylesheet" href="/case.css?v=18" />
${HEAD_BOOT}
<script type="application/ld+json">${JSON.stringify(jsonld, null, 0)}</script>
</head>
<body class="cs-body" data-project="${esc(p.slug)}" style="--cs-accent:${esc(p.accent)};--cs-ground:${esc(p.ground)}">

<a class="skip-link" href="#overview">Skip to the case study</a>
${NAV}

<main class="cs-main" id="top">
  <article class="cs-article">

    <header class="cs-hero">
      <span class="reg reg-tl" aria-hidden="true">+</span>
      <span class="reg reg-tr" aria-hidden="true">+</span>
      <p class="cs-eyebrow" data-reveal><a href="/work/">Selected work</a><span aria-hidden="true">/</span>${esc(p.name)}</p>
      <h1 class="cs-title" data-reveal>${esc(p.name)}</h1>
      <p class="cs-tagline" data-reveal>${rich(p.tagline)}</p>
      <div class="sec-rail cs-hero-rail" aria-hidden="true"><i class="sec-rail-spark"></i></div>
      <div data-reveal>${linkRow(p)}</div>
      <div data-reveal>${quickFacts(p)}</div>
    </header>

    ${tocFor(parts)}
    ${body}
    ${media(p)}
    ${related}

    <aside class="cs-cta">
      <h2>Want the detail behind any of this?</h2>
      <p>I am looking for a full-time software engineering internship, January to April 2027, in Subang Jaya or Kuala Lumpur, Malaysia.</p>
      <nav class="cs-cta-links" aria-label="Contact">
        <a href="mailto:yousofselim2@gmail.com" data-cursor="MAIL">yousofselim2@gmail.com<span class="cta-arr" aria-hidden="true">↗</span></a>
        <a href="/Yousof-Selim-Resume.pdf" download data-cursor="PDF">Résumé<span class="cta-arr" aria-hidden="true">↓</span></a>
        <a href="/#contact">Contact<span class="cta-arr" aria-hidden="true">→</span></a>
      </nav>
    </aside>

  </article>
</main>

<footer class="site-foot cs-foot">
  <p>DESIGNED AND BUILT BY HAND · 2026</p>
  <a href="/#top">Back to top ↑</a>
</footer>

<script src="/case.js?v=9" defer></script>
</body>
</html>
`;
}

function renderIndex(projects, site) {
  const cards = projects
    .map(
      (p) => `<li class="wk-item" data-reveal>
  <a class="wk-card" href="/work/${esc(p.slug)}/" style="--cs-accent:${esc(p.accent)}">
    <p class="wk-no" aria-hidden="true">${String(p.order).padStart(2, '0')}</p>
    <h2 class="wk-name">${esc(p.name)}</h2>
    <p class="wk-tag">${esc(p.tagline)}</p>
    <dl class="wk-meta">
      <div><dt>Role</dt><dd>${esc(p.role)}</dd></div>
      <div><dt>Status</dt><dd>${esc(p.status)}</dd></div>
      <div><dt>Platforms</dt><dd>${esc((p.platforms || []).join(' · '))}</dd></div>
    </dl>
    <p class="wk-open">Read the case study <span aria-hidden="true">→</span></p>
  </a>
</li>`,
    )
    .join('\n');

  const archive = has(site.archive)
    ? `<section class="wk-archive" aria-labelledby="arch-t">
  <header class="cs-sec-head">
    <p class="sec-label">02<span class="slash">/</span>ARCHIVE</p>
    <h2 class="cs-sec-title" id="arch-t">Everything <em>else.</em></h2>
  </header>
  <ul class="wk-arch-list">
    ${site.archive
      .map(
        (a) => `<li class="wk-arch">
      <p class="wk-arch-y">${esc(a.year)}</p>
      <div>
        <h3>${a.href ? `<a href="${esc(a.href)}" target="_blank" rel="noopener">${esc(a.name)} <span aria-hidden="true">↗</span></a>` : esc(a.name)}</h3>
        <p class="wk-arch-b">${esc(a.blurb)}</p>
        <p class="wk-arch-m">${esc(a.category)} · ${esc(a.role)}${has(a.tech) ? ' · ' + esc(a.tech.join(', ')) : ''}</p>
      </div>
    </li>`,
      )
      .join('\n    ')}
  </ul>
</section>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<title>Selected work — Yousof Selim</title>
<meta name="description" content="Case studies of the products Yousof Selim has designed, engineered, tested and shipped across mobile, web and desktop." />
<link rel="canonical" href="${ORIGIN}/work/" />
<meta property="og:type" content="website" />
<meta property="og:title" content="Selected work — Yousof Selim" />
<meta property="og:description" content="Case studies of shipped products across mobile, web and desktop." />
<meta property="og:url" content="${ORIGIN}/work/" />
<meta property="og:image" content="${ORIGIN}/images/og-card.jpg?v=2" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="color-scheme" content="dark light" />
<link rel="icon" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/favicon.svg" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,600..900&family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@300..700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" media="print" onload="this.media='all'" />
<noscript><link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,600..900&family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@300..700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" /></noscript>
<link rel="stylesheet" href="/styles.css?v=95" />
<link rel="stylesheet" href="/case.css?v=18" />
${HEAD_BOOT}
</head>
<body class="cs-body wk-body">
<a class="skip-link" href="#work-list">Skip to the work</a>
${NAV}
<main class="cs-main" id="top">
  <header class="wk-hero">
    <span class="cs-ghost wk-ghost" aria-hidden="true">01</span>
    <span class="reg reg-tl" aria-hidden="true">+</span>
    <span class="reg reg-tr" aria-hidden="true">+</span>
    <p class="sec-label" data-reveal>01<span class="slash">/</span>SELECTED WORK</p>
    <h1 class="wk-title" data-reveal>Products, <em>start to shipped.</em></h1>
    <div class="sec-rail cs-hero-rail" aria-hidden="true"><i class="sec-rail-spark"></i></div>
    <p class="wk-lead" data-reveal>Each of these was designed, engineered, tested and released by me. The case studies cover what the problem was, what I built, what it cost, and how I know it works.</p>
  </header>
  <ul class="wk-list" id="work-list">
${cards}
  </ul>
  ${archive}
</main>
<footer class="site-foot cs-foot">
  <p>DESIGNED AND BUILT BY HAND · 2026</p>
  <a href="/#top">Back to top ↑</a>
</footer>
<script src="/case.js?v=9" defer></script>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ */
/* the scan route                                                      */
/*                                                                     */
/* A recruiter with ninety seconds should not have to scroll through a */
/* pinned hero, a halftone canvas and five scroll-driven scenes to     */
/* find out what was built and where it is live. /simple/ is the same  */
/* facts, generated from the same content files so the two can never   */
/* disagree, in one plain column with no script but the theme boot.    */
/* ------------------------------------------------------------------ */

/** First sentence only — the scan route states the claim and leaves the
 *  elaboration to the case study. Split on a period followed by a capital so
 *  version numbers and package ids survive. */
const firstSentence = (s) => {
  const t = String(s ?? '').trim();
  const m = t.split(/(?<=\.)\s+(?=[A-Z])/);
  return m[0] || t;
};

function renderSimple(site, projects) {
  const p = site.profile || {};
  const PORTRAIT = fs.existsSync(path.join(ROOT, 'images/yousof-headshot.png'));

  const chips = (arr, cls = 's-chip') =>
    !has(arr) ? '' : `<p class="s-chips">${arr.map((t) => `<span class="${cls}">${esc(t)}</span>`).join('')}</p>`;

  const linkRow = (links, extra = []) =>
    !has(links) && !extra.length
      ? ''
      : `<p class="s-links">${[...(links || []), ...extra]
          .map((l) => {
            const ext = /^https?:/.test(l.href);
            return `<a href="${esc(l.href)}"${ext ? ' target="_blank" rel="noopener"' : ''}${
              l.kind === 'store' ? ' class="is-store"' : ''
            }>${esc(l.label)}<span aria-hidden="true">${ext ? '↗' : '→'}</span></a>`;
          })
          .join('')}</p>`;

  /* Stat tiles. The reference portfolio leans on these hard and it is the right
     instinct — a number with a label is the fastest thing on a page to read.
     What it does NOT get to keep is the emoji in front of each one, or the
     percentage bars underneath, which assert a precision nobody measured. */
  const statTiles = (items) =>
    `<div class="s-stats">${items
      .map((c) => {
        // "iOS · Android · Web" is a value but not a numeral, and setting it at
        // display size wrapped it to three lines and made it read as a headline.
        const numeral = /^[\d.,]+$/.test(String(c.value).trim());
        return `<div class="s-stat${numeral ? '' : ' is-text'}"><b>${esc(c.value)}</b><span>${esc(c.label)}</span></div>`;
      })
      .join('')}</div>`;

  const work = projects
    .map((x) => {
      const shot = has(x.media) ? x.media[0] : null;
      const results = (x.results || []).slice(0, 3);
      return `<article class="s-card">
      ${
        shot
          ? `<div class="s-card-shot"><img src="${esc(shot.src)}" alt="${esc(shot.alt)}"${
              shot.width ? ` width="${shot.width}"` : ''
            }${shot.height ? ` height="${shot.height}"` : ''} loading="lazy" decoding="async" /></div>`
          : ''
      }
      <div class="s-card-body">
        <div class="s-card-head">
          <h3>${esc(x.name)}</h3>
          <p class="s-when">${esc(humanDate(x.timeline))}</p>
        </div>
        <p class="s-card-tag">${rich(x.tagline)}</p>
        <p class="s-card-role"><span>Role</span>${esc(x.role)}</p>
        ${chips(x.platforms, 's-chip s-chip-quiet')}
        ${
          results.length
            ? `<ul class="s-list">${results
                .map((r) => `<li><b>${esc(r.title)}.</b> ${rich(firstSentence(r.body))}</li>`)
                .join('')}</ul>`
            : ''
        }
        ${chips(x.stack)}
        ${linkRow(x.links, [{ label: 'Full case study', href: `/work/${x.slug}/` }])}
      </div>
    </article>`;
    })
    .join('\n    ');

  const caps = (site.capabilities || [])
    .map(
      (c) => `<article class="s-card s-card-flat">
      <div class="s-card-body">
        <h3>${esc(c.group)}</h3>
        <p>${rich(c.lead)}</p>
        ${chips(c.tools)}
      </div>
    </article>`,
    )
    .join('\n    ');

  const timeline = (entries, render) =>
    `<ol class="s-time">${entries.map(render).join('')}</ol>`;

  const edu = has(site.education)
    ? timeline(
        site.education,
        (e) => `<li class="s-time-row">
        <p class="s-when">${esc(humanDate(e.dates))}</p>
        <div>
          <h3>${esc(e.credential)}</h3>
          <p class="s-org">${esc(e.institution)}${has(e.location) ? ` · ${esc(e.location)}` : ''}</p>
          ${has(e.status) ? `<p class="s-note-sm">${esc(e.status)}</p>` : ''}
          ${chips(e.coursework, 's-chip s-chip-quiet')}
        </div>
      </li>`,
      )
    : '';

  const record = has(site.experience)
    ? timeline(
        site.experience,
        (e) => `<li class="s-time-row">
        <p class="s-when">${esc(humanDate(e.dates))}</p>
        <div>
          <h3>${esc(e.role)}</h3>
          <p class="s-org">${esc(e.org)}${has(e.location) ? ` · ${esc(e.location)}` : ''}</p>
          ${has(e.lead) ? `<p>${rich(e.lead)}</p>` : ''}
          ${has(e.bullets) ? `<ul class="s-list">${e.bullets.map((b) => `<li>${rich(firstSentence(b))}</li>`).join('')}</ul>` : ''}
          ${
            has(e.projects)
              ? `<ul class="s-list">${e.projects
                  .map(
                    (pr) =>
                      `<li><b>${esc(pr.name)}${has(pr.dates) ? ` · ${esc(pr.dates)}` : ''}.</b>${
                        has(pr.bullets) ? ` ${rich(firstSentence(pr.bullets[0]))}` : ''
                      }</li>`,
                  )
                  .join('')}</ul>`
              : ''
          }
          ${chips(e.tech, 's-chip s-chip-quiet')}
        </div>
      </li>`,
      )
    : '';

  const nowCol = (label, items) =>
    !has(items)
      ? ''
      : `<div class="s-now-col">
        <h3>${esc(label)}</h3>
        <ul>${items
          .map((i) =>
            typeof i === 'string'
              ? `<li>${esc(i)}</li>`
              : `<li><b>${esc(i.title)}</b>${has(i.body) ? ` ${esc(firstSentence(i.body))}` : ''}</li>`,
          )
          .join('')}</ul>
      </div>`;

  const now = site.now
    ? `<div class="s-now">
      ${nowCol('Building', site.now.building)}
      ${nowCol('Studying', site.now.studying)}
      ${nowCol('Looking for', site.now.seeking)}
      ${nowCol('Exploring', site.now.exploring)}
    </div>`
    : '';

  const externals = (p.links || site.links || []).filter(
    (l) => !/^mailto:/i.test(l.href) && !/resume/i.test(l.href) && !/r[ée]sum/i.test(l.label || ''),
  );

  return `<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<title>Yousof Selim — the short version</title>
<meta name="description" content="A plain, scannable summary of Yousof Selim's shipped products, skills, education and availability. The full portfolio is one click away." />
<link rel="canonical" href="${ORIGIN}/simple/" />
<meta name="robots" content="noindex, follow" />
<meta name="color-scheme" content="dark light" />
<link rel="icon" href="/favicon.svg" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,600..900&family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@300..700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" media="print" onload="this.media='all'" />
<noscript><link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,600..900&family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@300..700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" /></noscript>
<link rel="stylesheet" href="/simple.css?v=10" />
<script>
document.documentElement.classList.replace('no-js','js');
try { document.documentElement.dataset.theme = localStorage.getItem('ysf-theme') === 'light' ? 'light' : 'dark'; }
catch (_) { document.documentElement.dataset.theme = 'dark'; }
addEventListener('DOMContentLoaded', function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('s-anim');
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.02 });
  document.querySelectorAll('[data-in]').forEach(function (el) { io.observe(el); });

  // The nav marks where you are. Nothing else on this page moves on scroll.
  var links = [].slice.call(document.querySelectorAll('.s-nav a'));
  var spy = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (a) { a.classList.toggle('is-here', a.hash === '#' + e.target.id); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach(function (el) { spy.observe(el); });

  // How far through the page you are. One custom property, written on scroll.
  var bar = document.querySelector('.s-progress');
  if (bar) {
    var tick = function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
    };
    addEventListener('scroll', tick, { passive: true });
    addEventListener('resize', tick, { passive: true });
    tick();
  }
});
</script>
</head>
<body>
<div class="s-wash" aria-hidden="true"></div>

<header class="s-head">
  <i class="s-progress" aria-hidden="true"></i>
  <a class="s-brand" href="/">ysf.slm</a>
  <nav class="s-nav" aria-label="Sections">
    <a href="#work">Work</a>
    <a href="#skills">Skills</a>
    <a href="#education">Education</a>
    <a href="#record">Record</a>
    <a href="#contact">Contact</a>
  </nav>
  <div class="s-actions">
    <a class="s-btn s-btn-lead" href="/">Full portfolio</a>
    <a class="s-btn" href="/Yousof-Selim-Resume.pdf" download>Résumé</a>
  </div>
</header>

<main>

  <section class="s-hero" data-in>
    ${
      PORTRAIT
        ? `<figure class="s-portrait">
      <picture>
        <source type="image/webp" srcset="/images/yousof-headshot.webp" />
        <img src="/images/yousof-headshot.png" alt="Yousof Selim" width="861" height="991" fetchpriority="high" />
      </picture>
      <figcaption>FIG. 01 — YOUSOF SELIM</figcaption>
    </figure>`
        : ''
    }
    <div class="s-intro">
      <p class="s-kicker">Portfolio <span>/</span> the short version</p>
      <h1 class="s-name">${esc(p.name || site.name)}</h1>
      <p class="s-role">${esc(p.title || site.title)}</p>
      <p class="s-meta">${esc(p.location || site.location)} <span>·</span> ${esc(p.availability || site.availability)}</p>
      <p class="s-lede">${rich(p.positioning)}</p>
      <p class="s-lede-more"><a href="/">The long version, with the case studies <span aria-hidden="true">→</span></a></p>
      ${chips((site.capabilities || []).map((c) => c.group))}
      <p class="s-cta">
        <a class="s-btn s-btn-lead" href="mailto:${esc(p.email)}">Get in touch<span aria-hidden="true">→</span></a>
        <a class="s-btn" href="#work">See the work<span aria-hidden="true">↓</span></a>
      </p>
    </div>
  </section>

  <section class="s-sec" id="glance" data-in>
    <h2><b>01</b> At a glance<i class="s-rail" aria-hidden="true"></i></h2>
    ${has(site.credibility) ? statTiles(site.credibility) : ''}
  </section>

  <section class="s-sec" id="work" data-in>
    <h2><b>02</b> Selected work<i class="s-rail" aria-hidden="true"></i></h2>
    <p class="s-sec-lede">Each of these was designed, engineered, tested and released by me. Every number below is one I can show you where to check.</p>
    <div class="s-cards">
    ${work}
    </div>
  </section>

  ${
    caps
      ? `<section class="s-sec" id="skills" data-in>
    <h2><b>03</b> What I can build<i class="s-rail" aria-hidden="true"></i></h2>
    <p class="s-sec-lede">The things I can take from an empty repository to a release, and what I use to do it.</p>
    <div class="s-cards s-cards-2">
    ${caps}
    </div>
  </section>`
      : ''
  }

  ${edu ? `<section class="s-sec" id="education" data-in><h2><b>04</b> Education<i class="s-rail" aria-hidden="true"></i></h2>${edu}</section>` : ''}

  ${record ? `<section class="s-sec" id="record" data-in><h2><b>05</b> The record<i class="s-rail" aria-hidden="true"></i></h2>${record}</section>` : ''}

  ${now ? `<section class="s-sec" id="rightnow" data-in><h2><b>06</b> Right now<i class="s-rail" aria-hidden="true"></i></h2>${now}</section>` : ''}

  <section class="s-sec s-contact" id="contact" data-in>
    <h2><b>07</b> Contact<i class="s-rail" aria-hidden="true"></i></h2>
    <p class="s-contact-line">Available for a full-time software engineering internship, ${esc(
      String(p.availability || site.availability || '').replace(/^full-time internship\s*[—–-]\s*/i, ''),
    )}, in ${esc(p.location || site.location)}.</p>
    <p class="s-mail"><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></p>
    ${linkRow(externals, [{ label: 'Résumé (PDF)', href: '/Yousof-Selim-Resume.pdf' }])}
  </section>

  <p class="s-note">This is the short version. The full portfolio carries the case studies — the problem, the architecture, what each decision cost, and how it was tested.</p>

  <p class="s-foot">Designed and built by hand · 2026 · <a href="/">Full portfolio</a></p>
</main>
</body>
</html>
`;
}

function renderSitemap(projects) {
  const urls = [`${ORIGIN}/`, `${ORIGIN}/simple/`, `${ORIGIN}/work/`, ...projects.map((p) => `${ORIGIN}/work/${p.slug}/`)];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`.replace('www.sitemap.org', 'www.sitemaps.org');
}

/* ------------------------------------------------------------------ */
/* run                                                                 */
/* ------------------------------------------------------------------ */

function main() {
  const site = readJSON('content/site.json');
  const dir = path.join(ROOT, 'content/projects');
  const projects = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

  projects.forEach(normalise);

  const errs = validateAll({ projects, archive: site.archive || [], site: site.profile || {} });
  for (const p of projects) errs.push(...assertNothingDropped(p));
  if (errs.length) {
    console.error(`\n✗ content validation failed (${errs.length}):\n`);
    for (const e of errs) console.error('  - ' + e);
    process.exit(1);
  }
  console.log(`✓ content valid — ${projects.length} case studies, ${(site.archive || []).length} archive entries`);

  if (CHECK_ONLY) return;

  for (const p of projects) {
    const out = path.join(ROOT, 'work', p.slug);
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'index.html'), renderProject(p, projects));
    console.log(`  → work/${p.slug}/index.html`);
  }

  fs.mkdirSync(path.join(ROOT, 'work'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'work/index.html'), renderIndex(projects, site));
  console.log('  → work/index.html');

  fs.mkdirSync(path.join(ROOT, 'simple'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'simple/index.html'), renderSimple(site, projects));
  console.log('  → simple/index.html');

  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), renderSitemap(projects));
  console.log('  → sitemap.xml');

  injectHomepage(site, projects);
}

/* ------------------------------------------------------------------ */
/* homepage sections                                                   */
/*                                                                     */
/* index.html stays hand-authored — its GSAP choreography, pinned      */
/* identity scene and easter egg are not worth generating. Only the    */
/* evidence-bearing blocks are injected, between markers.              */
/*                                                                     */
/* Each block gets a layout that suits what it holds, not one shared   */
/* card grid: the credibility line reads as a measuring scale, the     */
/* principles as a numbered manifesto, the capabilities as a spec      */
/* sheet, the record as a rail with nodes, and the current focus as a  */
/* status board. Dot-matrix glyphs carry the site's existing dotted    */
/* language into each one.                                             */
/* ------------------------------------------------------------------ */

/**
 * Dot-matrix glyph on a 10×10 grid, drawn as SVG circles.
 * The site draws its sigils as dots on canvas; these are the static
 * equivalent — no JS, no animation dependency, same visual language.
 */
const GLYPHS = {
  coin:      [[8.4, 5.0], [7.94, 6.7], [6.7, 7.94], [5.0, 8.4], [3.3, 7.94], [2.06, 6.7], [1.6, 5.0], [2.06, 3.3], [3.3, 2.06], [5.0, 1.6], [6.7, 2.06], [7.94, 3.3], [5, 5]],
  shield:    [[2, 2], [3.5, 2], [5, 2], [6.5, 2], [8, 2], [2, 3.6], [8, 3.6], [2.2, 5.2], [7.8, 5.2], [3.1, 6.6], [6.9, 6.6], [4, 7.7], [6, 7.7], [5, 8.5]],
  launch:    [[5, 1.4], [3.9, 2.6], [6.1, 2.6], [2.9, 3.8], [7.1, 3.8], [5, 3.1], [5, 4.6], [5, 6.1], [5, 7.6], [5, 9]],
  proof:     [[1.8, 5], [2.8, 6], [3.8, 7], [4.8, 7.8], [5.8, 6.2], [6.8, 4.6], [7.8, 3], [8.6, 1.8]],
  lock:      [[3.4, 3.6], [3.3, 2.6], [4, 1.9], [5, 1.7], [6, 1.9], [6.7, 2.6], [6.6, 3.6], [2.4, 4.6], [3.7, 4.6], [5, 4.6], [6.3, 4.6], [7.6, 4.6], [2.4, 6], [7.6, 6], [2.4, 7.6], [3.7, 7.6], [5, 7.6], [6.3, 7.6], [7.6, 7.6], [5, 6.1]],
  layers:    [[2, 2.6], [3.5, 2.6], [5, 2.6], [6.5, 2.6], [8, 2.6], [2, 5], [3.5, 5], [5, 5], [6.5, 5], [8, 5], [2, 7.4], [3.5, 7.4], [5, 7.4], [6.5, 7.4], [8, 7.4]],
  mobile:    [[3.6, 1.4], [5, 1.4], [6.4, 1.4], [3, 2.6], [7, 2.6], [3, 4], [7, 4], [3, 5.4], [7, 5.4], [3, 6.8], [7, 6.8], [3.6, 8.2], [5, 8.2], [6.4, 8.2], [5, 7]],
  widget:    [[2, 2], [4, 2], [6, 2], [8, 2], [2, 4], [8, 4], [2, 6], [8, 6], [2, 8], [4, 8], [6, 8], [8, 8], [4.4, 4.4], [5.6, 4.4], [4.4, 5.6], [5.6, 5.6]],
  data:      [[3.1, 1.8], [5, 1.5], [6.9, 1.8], [2.6, 2.9], [7.4, 2.9], [3.1, 3.9], [5, 4.2], [6.9, 3.9], [2.6, 5.1], [7.4, 5.1], [3.1, 6.1], [5, 6.4], [6.9, 6.1], [2.6, 7.2], [7.4, 7.2], [3.1, 8.3], [5, 8.6], [6.9, 8.3]],
  gpu:       [[3.4, 3.4], [5, 3.4], [6.6, 3.4], [3.4, 5], [6.6, 5], [3.4, 6.6], [5, 6.6], [6.6, 6.6], [1.9, 4.2], [1.9, 5.8], [8.1, 4.2], [8.1, 5.8], [4.2, 1.9], [5.8, 1.9], [4.2, 8.1], [5.8, 8.1]],
  ai:        [[5, 1.6], [2.4, 4], [7.6, 4], [3.5, 7.8], [6.5, 7.8], [5, 4.9], [3.8, 2.7], [6.2, 2.7], [4.1, 4.5], [5.9, 4.5], [4.1, 6.4], [5.9, 6.4]],
  release:   [[5, 1.2], [3.8, 2.4], [6.2, 2.4], [5, 2.5], [5, 3.7], [5, 4.7], [2.2, 5.8], [3.6, 5.8], [5, 5.8], [6.4, 5.8], [7.8, 5.8], [2.2, 7.1], [7.8, 7.1], [2.2, 8.4], [3.6, 8.4], [5, 8.4], [6.4, 8.4], [7.8, 8.4]],
};

const GLYPH_ORDER = ['coin', 'shield', 'launch', 'proof', 'lock', 'layers'];
const CAP_GLYPHS = ['mobile', 'widget', 'data', 'gpu', 'ai', 'release'];

function dotGlyph(name, cls = 'dot-glyph') {
  const pts = GLYPHS[name];
  // A missing name used to render nothing at all, which is how a capability
  // row lost its icon without anything failing.
  if (!pts) { console.error(`\n✗ unknown glyph "${name}" — known: ${Object.keys(GLYPHS).join(', ')}`); process.exit(1); }
  const dots = pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.62"/>`).join('');
  return `<svg class="${cls}" viewBox="-0.5 -0.5 11 11" aria-hidden="true" focusable="false">${dots}</svg>`;
}

/* ---------- credibility: a measuring scale, not cards -------------- */

function renderCredibility(site) {
  if (!has(site.credibility)) return '';
  return `<div class="cred" data-reveal>
            <p class="cred-l">FIG. 00.2<span class="slash">/</span>AT A GLANCE</p>
            <ul class="cred-scale">
${site.credibility
  .map((c) => {
    // A thousands separator is still a numeral — "9,206" was falling through
    // to the small text treatment meant for values like "iOS · Android · Web".
    const isNumeral = /^[\d.,]+$/.test(String(c.value).trim());
    return `              <li${isNumeral ? '' : ' class="is-text"'} data-cursor="FACT"><b>${esc(c.value)}</b><span>${esc(c.label)}</span></li>`;
  })
  .join('\n')}
            </ul>
          </div>`;
}

/* ---------- principles: a numbered manifesto ----------------------- */

function renderPrinciples(site) {
  if (!has(site.principles)) return '';
  return `<div class="principles">
      <header class="pr-head" data-reveal>
        <p class="sec-label">FIG. 00.6<span class="slash">/</span>HOW I WORK</p>
        <h2 class="pr-title">Six rules I actually follow</h2>
      </header>
      <ol class="pr-list">
${site.principles
  .map(
    (p, i) => `        <li class="pr-item" data-cursor="RULE">
          <i class="pr-rule" aria-hidden="true"></i>
          <span class="pr-no" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          ${dotGlyph(GLYPH_ORDER[i % GLYPH_ORDER.length], 'dot-glyph pr-glyph')}
          <div class="pr-body">
            <h3>${rich(p.title)}</h3>
            <p>${rich(p.body)}</p>
          </div>
          ${has(p.exampleDetail) ? `<p class="pr-eg"><span>In practice</span>${rich(p.exampleDetail)}</p>` : ''}
        </li>`
  )
  .join('\n')}
      </ol>
    </div>`;
}

/* ---------- capabilities: a spec sheet -----------------------------
   `tools` is deliberately NOT rendered. The lanes directly below this
   block enumerate every tool by category, so printing them again here
   said the same thing twice and made the section longer for it. What
   a capability row is FOR is the sentence: what I can take from an
   empty repository to a release. The data stays in site.json — it is
   still true, it just is not said twice on one screen. */

function renderCapabilities(site) {
  if (!has(site.capabilities)) return '';
  return `<div class="caps" data-reveal>
      <p class="caps-intro">Before the tool list — the things I can take from an empty repository to a release.</p>
      <ul class="cap-rows">
${site.capabilities
  .map(
    (c, i) => `        <li class="cap-row" data-cursor="BUILD">
          <div class="cap-name">
            ${dotGlyph(CAP_GLYPHS[i % CAP_GLYPHS.length], 'dot-glyph cap-glyph')}
            <h3>${esc(c.group)}</h3>
          </div>
          <p class="cap-lead">${rich(c.lead)}</p>
        </li>`
  )
  .join('\n')}
      </ul>
    </div>`;
}

/* ---------- the record: a rail with nodes -------------------------- */

function renderExperience(site, projects) {
  if (!has(site.experience)) return '';
  const slugs = new Set(projects.map((p) => p.slug));

  const nested = (e) =>
    !has(e.projects)
      ? ''
      : `<ol class="tl-projects">
${e.projects
  .map(
    (pr) => `              <li class="tl-project" data-cursor="STUDY">
                <div class="tl-p-head">
                  <h4>${esc(pr.name)}</h4>
                  <p class="tl-p-when">${esc(pr.dates)}</p>
                </div>
                ${has(pr.bullets) ? `<ul>${pr.bullets.map((b) => `<li>${rich(b)}</li>`).join('')}</ul>` : ''}
                ${has(pr.tech) ? `<p class="tl-tech">${pr.tech.map((t) => esc(t)).join(' <i aria-hidden="true">·</i> ')}</p>` : ''}
                ${
                  slugs.has(String(pr.slug || '').toLowerCase())
                    ? `<a class="tl-study" href="work/${esc(String(pr.slug).toLowerCase())}/" data-cursor="READ">Case study<span class="cta-arr" aria-hidden="true">→</span></a>`
                    : ''
                }
              </li>`
  )
  .join('\n')}
            </ol>`;

  return `<div class="timeline" data-reveal>
      <p class="sec-label">FIG. 04<span class="slash">/</span>THE RECORD</p>
      <ol class="tl-list">
${site.experience
  .map(
    (e) => `        <li class="tl-row" data-cursor="RECORD">
          <p class="tl-when">${esc(e.dates)}</p>
          <div class="tl-what">
            <h3>${esc(e.role)}</h3>
            <p class="tl-org">${esc(e.org)}${has(e.location) ? ` <i aria-hidden="true">·</i> ${esc(e.location)}` : ''}</p>
            ${has(e.lead) ? `<p class="tl-lead">${rich(e.lead)}</p>` : ''}
            ${has(e.bullets) ? `<ul class="tl-bullets">${e.bullets.map((b) => `<li>${rich(b)}</li>`).join('')}</ul>` : ''}
            ${has(e.tech) ? `<p class="tl-tech">${e.tech.map((t) => esc(t)).join(' <i aria-hidden="true">·</i> ')}</p>` : ''}
            ${nested(e)}
          </div>
        </li>`
  )
  .join('\n')}
      </ol>
    </div>`;
}

/* ---------- current focus: a status board -------------------------- */

function renderNow(site) {
  const n = site.now;
  if (!n) return '';
  const col = (label, items, tone) =>
    !has(items)
      ? ''
      : `<section class="now-col" data-tone="${tone}" data-cursor="NOW">
          <h3 class="now-h"><i class="now-dot" aria-hidden="true"></i>${esc(label)}</h3>
          <ul>${items
            .map((i) =>
              typeof i === 'string'
                ? `<li><p>${rich(i)}</p></li>`
                : `<li><b>${esc(i.title)}</b><p>${rich(i.body || '')}</p></li>`
            )
            .join('')}</ul>
        </section>`;
  return `<div class="now-block" data-reveal>
      <div class="now-head">
        <p class="sec-label">NOW<span class="slash">/</span>CURRENT FOCUS</p>
        ${has(n.updated) ? `<p class="now-stamp"><i aria-hidden="true"></i>LAST UPDATED ${esc(String(n.updated).toUpperCase())}</p>` : ''}
      </div>
      <div class="now-grid">
        ${col('Building', n.building, 'live')}
        ${col('Studying', n.studying, 'study')}
        ${col('Looking for', n.seeking, 'seek')}
        ${col('Exploring', n.exploring, 'explore')}
      </div>
    </div>`;
}

/** Replace the body between <!--build:name--> and <!--/build:name-->. */
function injectHomepage(site, projects) {
  const file = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const blocks = {
    credibility: renderCredibility(site),
    principles: renderPrinciples(site),
    capabilities: renderCapabilities(site),
    experience: renderExperience(site, projects),
    now: renderNow(site),
  };
  const missing = [];
  for (const [name, body] of Object.entries(blocks)) {
    const re = new RegExp(`(<!--build:${name}-->)[\\s\\S]*?(<!--/build:${name}-->)`);
    if (!re.test(html)) { missing.push(name); continue; }
    html = html.replace(re, `$1\n          ${body}\n          $2`);
  }
  if (missing.length) {
    console.error(`\n✗ index.html is missing markers: ${missing.join(', ')}`);
    process.exit(1);
  }
  fs.writeFileSync(file, html);
  console.log(`  → index.html (${Object.values(blocks).filter(Boolean).length} sections injected)`);
}

main();
