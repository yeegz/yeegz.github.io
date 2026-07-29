/**
 * Content schema for the portfolio.
 *
 * Every field a case study can carry is declared here once, with the rules that
 * make a build fail rather than let a half-written section reach production.
 * Two rules matter more than the rest:
 *
 *   1. Optional means *absent*, not empty. A missing field renders nothing at
 *      all; it never renders a heading over blank space.
 *   2. Anything asserted as fact carries an `evidence` string naming the file,
 *      command, or URL it came from. Evidence never ships to the page — it is
 *      there so a claim can be re-checked a year from now.
 */

/** @typedef {'string'|'text'|'url'|'slug'|'date'|'array'|'object'|'bool'} Kind */

const RE = {
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  url: /^(https?:\/\/|\/|mailto:|#)/,
  // Either a year, a month-year, or an open/closed range. Keeps timelines honest.
  date: /^(\d{4}(-\d{2})?)(\s*[–—-]\s*(\d{4}(-\d{2})?|Present))?$/,
};

/** Fields shared by flagship case studies. `req` fields fail the build when missing. */
export const PROJECT_FIELDS = {
  slug: { kind: 'slug', req: true },
  name: { kind: 'string', req: true, max: 40 },
  tagline: { kind: 'string', req: true, max: 90, note: 'One sentence. What the product is, not how good it is.' },
  summary: { kind: 'text', req: true, min: 180, note: 'Executive summary: problem, audience, solution, my contribution, why it matters.' },

  category: { kind: 'string', req: true },
  role: { kind: 'string', req: true, note: 'Must be defensible. "Sole developer" only where literally true.' },
  team: { kind: 'string', req: true, note: 'Say "Solo" or name the team context. Never leave ambiguous.' },
  timeline: { kind: 'date', req: true },
  status: { kind: 'string', req: true },
  platforms: { kind: 'array', req: true, of: 'string' },
  stack: { kind: 'array', req: true, of: 'string' },

  featured: { kind: 'bool', req: true },
  order: { kind: 'number', req: true },
  accent: { kind: 'string', req: true, note: 'Project-authored accent, kept out of the global token layer.' },
  ground: { kind: 'string', req: true, note: 'Stage background. Fixed per project in both themes, like the existing stages.' },

  links: { kind: 'array', req: true, of: 'link', note: 'Each: {label, href, kind, evidence}. kind ∈ store|live|repo|showcase|play' },

  problem: { kind: 'object', req: true, note: '{ lead, points[] } — the real user or technical problem.' },
  contribution: { kind: 'object', req: true, note: '{ owned[], notOwned[] } — explicit about what I did NOT own.' },
  constraints: { kind: 'array', req: false, of: 'item' },
  research: { kind: 'array', req: false, of: 'item' },
  flow: { kind: 'object', req: false, note: '{ caption, steps[] } — rendered as an accessible diagram.' },
  architecture: { kind: 'object', req: false, note: '{ caption, alt, groups[], edges[] } — must carry a text alternative.' },
  challenges: { kind: 'array', req: false, of: 'challenge' },
  decisions: { kind: 'array', req: false, of: 'decision' },
  evolution: { kind: 'array', req: false, of: 'item' },
  testing: { kind: 'object', req: false, note: '{ lead, stats[], cases[] }' },
  results: { kind: 'array', req: false, of: 'item' },
  lessons: { kind: 'object', req: false, note: '{ worked[], underestimated[], next[] }' },

  media: { kind: 'array', req: false, of: 'figure' },

  seo: { kind: 'object', req: true, note: '{ title, description, image }' },
};

/** Shapes for the `of:` entries above. */
export const SUB_SHAPES = {
  link: { label: 'string!', href: 'url!', kind: 'string!', evidence: 'string' },
  item: { title: 'string!', body: 'text!', evidence: 'string' },
  figure: { src: 'url!', alt: 'string!', caption: 'string!', width: 'number', height: 'number' },
  challenge: {
    title: 'string!',
    why: 'text!',            // why it was hard
    options: 'array',        // what was considered
    solution: 'text!',       // what was chosen
    tradeoff: 'text',        // what it cost
    validation: 'text',      // how it was proven
    result: 'text!',         // outcome or lesson
    evidence: 'string',
  },
  decision: { title: 'string!', chose: 'string!', because: 'text!', instead: 'string', cost: 'text', evidence: 'string' },
};

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;

function checkScalar(path, value, kind, spec, errs) {
  switch (kind) {
    case 'slug':
      if (!isStr(value) || !RE.slug.test(value)) errs.push(`${path}: not a slug (got ${JSON.stringify(value)})`);
      break;
    case 'url':
      if (!isStr(value) || !RE.url.test(value)) errs.push(`${path}: not a usable href (got ${JSON.stringify(value)})`);
      break;
    case 'date':
      if (!isStr(value) || !RE.date.test(value)) errs.push(`${path}: not a date or range (got ${JSON.stringify(value)})`);
      break;
    case 'bool':
      if (typeof value !== 'boolean') errs.push(`${path}: expected a boolean`);
      break;
    case 'number':
      if (typeof value !== 'number' || Number.isNaN(value)) errs.push(`${path}: expected a number`);
      break;
    case 'string':
    case 'text':
      if (!isStr(value)) errs.push(`${path}: expected non-empty text`);
      else {
        if (spec?.max && value.length > spec.max) errs.push(`${path}: ${value.length} chars, max ${spec.max}`);
        if (spec?.min && value.length < spec.min) errs.push(`${path}: ${value.length} chars, min ${spec.min}`);
      }
      break;
    default:
      break;
  }
}

function checkShape(path, value, shapeName, errs) {
  const shape = SUB_SHAPES[shapeName];
  if (!shape) return;
  if (typeof value !== 'object' || value === null) {
    errs.push(`${path}: expected an object shaped like ${shapeName}`);
    return;
  }
  for (const [key, rule] of Object.entries(shape)) {
    const required = typeof rule === 'string' && rule.endsWith('!');
    const kind = typeof rule === 'string' ? rule.replace('!', '') : 'string';
    const has = value[key] !== undefined && value[key] !== null && value[key] !== '';
    if (!has) {
      if (required) errs.push(`${path}.${key}: required`);
      continue;
    }
    if (kind === 'array') {
      if (!Array.isArray(value[key])) errs.push(`${path}.${key}: expected an array`);
    } else {
      checkScalar(`${path}.${key}`, value[key], kind, null, errs);
    }
  }
}

/**
 * Validate one project. Returns an array of human-readable errors; empty means
 * it may ship. Deliberately strict about *empty* optional values, because an
 * empty array is how a blank section with a heading gets rendered.
 */
export function validateProject(p, { strict = true } = {}) {
  const errs = [];
  const name = p?.slug || '(unnamed)';

  for (const [key, spec] of Object.entries(PROJECT_FIELDS)) {
    const value = p?.[key];
    const present = value !== undefined && value !== null && !(Array.isArray(value) && value.length === 0);

    if (!present) {
      if (spec.req) errs.push(`${name}.${key}: required but missing`);
      // An optional field that is present-but-empty is a bug, not a choice.
      else if (value !== undefined && value !== null) {
        errs.push(`${name}.${key}: present but empty — omit the key instead so nothing renders`);
      }
      continue;
    }

    if (spec.kind === 'array') {
      if (!Array.isArray(value)) { errs.push(`${name}.${key}: expected an array`); continue; }
      value.forEach((entry, i) => {
        if (spec.of && SUB_SHAPES[spec.of]) checkShape(`${name}.${key}[${i}]`, entry, spec.of, errs);
        else checkScalar(`${name}.${key}[${i}]`, entry, spec.of || 'string', null, errs);
      });
    } else if (spec.kind === 'object') {
      if (typeof value !== 'object' || Array.isArray(value)) errs.push(`${name}.${key}: expected an object`);
    } else {
      checkScalar(`${name}.${key}`, value, spec.kind, spec, errs);
    }
  }

  // Cross-field rules that catch the failure modes the brief calls out by name.
  if (Array.isArray(p?.links)) {
    for (const l of p.links) {
      if (l?.kind === 'store' && !/apps\.apple\.com|play\.google\.com/.test(l.href || '')) {
        errs.push(`${name}.links: kind "store" must point at a real store listing`);
      }
    }
  }
  if (strict && Array.isArray(p?.challenges)) {
    p.challenges.forEach((c, i) => {
      if (!c?.evidence) errs.push(`${name}.challenges[${i}]: needs an evidence citation`);
    });
  }
  if (p?.role && /sole developer/i.test(p.role) && p?.team && !/solo/i.test(p.team)) {
    errs.push(`${name}.role: claims "sole developer" while team is "${p.team}" — pick one and make it true`);
  }

  return errs;
}

/** Validate the whole content set, including cross-project uniqueness. */
export function validateAll({ projects = [], archive = [], site = {} } = {}) {
  const errs = [];
  const seen = new Set();

  for (const p of projects) {
    errs.push(...validateProject(p));
    if (seen.has(p.slug)) errs.push(`duplicate slug: ${p.slug}`);
    seen.add(p.slug);
  }

  for (const [i, a] of archive.entries()) {
    for (const key of ['name', 'year', 'category', 'blurb', 'role']) {
      if (!isStr(a?.[key])) errs.push(`archive[${i}].${key}: required`);
    }
    if (a?.href && !RE.url.test(a.href)) errs.push(`archive[${i}].href: not a usable href`);
  }

  for (const key of ['name', 'title', 'location', 'availability', 'email', 'links']) {
    if (site?.[key] === undefined) errs.push(`site.${key}: required`);
  }

  return errs;
}

export default { PROJECT_FIELDS, SUB_SHAPES, validateProject, validateAll };
