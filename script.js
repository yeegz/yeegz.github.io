(() => {
  const docEl = document.documentElement;
  docEl.classList.add('booted');

  /* Easter egg imagery. This runs before the halftone morph canvas is built
     and before the name/figure geometry is measured, so the dotted effect,
     the seating maths and every downstream animation operate on the egg's
     photograph rather than the default one. That is also why toggling the
     code reloads the page: the canvas is rendered once from these sources. */
  if (docEl.classList.contains('egypt')) {
    const print = document.getElementById('portrait');
    if (print) {
      /* The morph samples this image to place its dots and then dissolves
         those dots into the photograph. Feeding it the pre-made halftone
         plate produced dots of dots and never resolved; feeding it the
         photograph itself means the dot field IS an analysis of that
         photograph, so it lands on it exactly. */
      print.src = 'images/egypt-photo-1600.jpg';
      print.removeAttribute('srcset');
      print.alt = 'Dot-matrix analysis of Yousof Selim wrapped in an Al Ahly flag at a match';
    }
    const photo = document.getElementById('gardenImg');
    if (photo) {
      photo.src = 'images/egypt-photo-1600.jpg';
      photo.srcset = 'images/egypt-photo-960.jpg 960w, images/egypt-photo-1600.jpg 1600w';
      photo.alt = 'Yousof Selim wrapped in an Al Ahly flag in the stand at a match';
      const webp = photo.parentElement && photo.parentElement.querySelector('source');
      if (webp) webp.srcset = 'images/egypt-photo-640.webp 640w, images/egypt-photo-960.webp 960w, images/egypt-photo-1600.webp 1600w';
    }
    const cap = document.getElementById('figTag');
    if (cap) cap.textContent = 'FIG. 01 — CAIRO, EG · AL AHLY';
  }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const wideScreen = matchMedia('(min-width: 901px)').matches;
  const panelScreen = matchMedia('(min-width: 1025px)').matches;

  const nmFirst = document.getElementById('nmFirst');
  const nmLast = document.getElementById('nmLast');
  const nmStack = document.getElementById('nmStack');
  const portraitWrapEl = document.getElementById('portraitWrap');
  /* Seat the figure in the step of the name.
     `left` is a layout property, so it has to be computed from layout — never
     from getBoundingClientRect(). The name rides a parallax transform, and a
     rect includes it: measured while scrolled, the seat came out 169px to the
     right and stayed there, which is what stranded the figure after opening a
     case file and scrolling back up. Walking offsetLeft to the figure's own
     offset parent is both transform-free and origin-correct.
     Written as a custom property so the CSS keeps a usable fallback until
     this first runs, and with no JS at all. */
  const offsetWithin = (el, ancestor) => {
    let x = 0, node = el;
    while (node && node !== ancestor) { x += node.offsetLeft; node = node.offsetParent; }
    return x;
  };
  const placeNiche = () => {
    if (!portraitWrapEl || !nmStack || !nmFirst) return;
    const stage = portraitWrapEl.offsetParent || nmStack.closest('.hero-stage');
    if (!stage || !nmFirst.offsetWidth) return;
    const nmPx = parseFloat(getComputedStyle(nmFirst).fontSize);
    const left = offsetWithin(nmFirst, stage) + nmFirst.offsetWidth - nmPx * 0.18;
    portraitWrapEl.style.setProperty('--niche-x', left.toFixed(2) + 'px');
  };

  /* ── The name block is fitted, not guessed. ──────────────────────────────
     SELIM is the long line: it is measured and sized to a share of the stage's
     content width, and YOUSOF is derived back from it so the step the figure
     sits in stays proportional. Both lines therefore fit by construction at
     every viewport — 320px phones, landscape phones, and 4K alike — instead of
     riding a viewport clamp that overflows at the bottom and starves at the top.
     Only --nm and --nm-ratio are written, so every CSS relationship built on
     var(--nm) (the step, the figure, the ground rule) keeps holding. ── */
  const NICHE = 1.0;       /* the step's width, in units of the SELIM size */
  const PROBE = 100;       /* measure once at a known size, then scale linearly */
  const unitWidth = (el) => {
    const had = el.style.fontSize;
    el.style.fontSize = PROBE + 'px';
    const w = el.offsetWidth / PROBE;
    el.style.fontSize = had;
    return w;
  };
  /* How much of the content width the long line claims. The step down at 901px
     is where the right-hand data plate appears and needs its own column. */
  const nameFill = (w) => (w <= 760 ? 0.995 : w <= 900 ? 0.95 : 0.78);
  const fitNames = () => {
    if (!nmFirst || !nmLast || !nmStack) return;
    const stage = nmStack.closest('.hero-stage') || nmStack.offsetParent || docEl;
    const stageW = stage.clientWidth || docEl.clientWidth;
    const stageH = stage.clientHeight || docEl.clientHeight;
    const padLeft = nmStack.offsetLeft || 0;
    const avail = Math.max(160, stageW - padLeft * 2);
    const unit1 = unitWidth(nmFirst);
    const unit2 = unitWidth(nmLast);
    if (!unit1 || !unit2) return;

    let fsLast = (avail * nameFill(stageW)) / unit2;
    /* Never let the two lines eat the stage: the pair occupies
       (1/ratio + 1) * 0.84 line-heights, capped at a share of the stage. */
    const heightBudget = stageH * (stageH < 520 ? 0.4 : 0.47);
    fsLast = Math.min(fsLast, heightBudget / ((1 / 1.16 + 1) * 0.84));
    fsLast = Math.max(fsLast, 30);

    const fsFirst = Math.max(20, (unit2 * fsLast - fsLast * NICHE) / unit1);
    const ratio = fsLast / fsFirst;
    /* A measurement taken mid font-swap can come back nonsense. Reject it and
       try again on the next frame rather than committing a broken lockup. */
    if (!isFinite(ratio) || ratio < 1.2 || ratio > 3.2) {
      /* Try again next frame — but still seat the figure against whatever the
         type currently measures, so a rejected fit never leaves it stranded. */
      if (!fitRetry) { fitRetry = requestAnimationFrame(() => { fitRetry = 0; fitNames(); }); }
      placeNiche();
      return;
    }
    docEl.style.setProperty('--nm', fsFirst.toFixed(2) + 'px');
    docEl.style.setProperty('--nm-ratio', ratio.toFixed(4));
    /* The figure rests on SELIM, so its vertical seat is expressed in SELIM's
       size. Tying it to YOUSOF only held while the two happened to keep a
       fixed ratio; the height cap on short screens breaks that. */
    docEl.style.setProperty('--nm-2', fsLast.toFixed(2) + 'px');
    if (portraitWrapEl) portraitWrapEl.style.width = (fsLast * NICHE * 0.98).toFixed(2) + 'px';
    placeNiche();
  };
  let fitRetry = 0;
  fitNames();
  let fitTimer = null;
  let lastFitW = innerWidth, lastFitH = innerHeight;
  const refit = () => {
    fitNames();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  };
  /* Two speeds. The figure is re-seated on the very next frame of any resize —
     it is two rect reads — so it can never be seen adrift from the letters
     while a window is being dragged. The full re-fit, which rewrites the type
     scale, still waits for the drag to settle. */
  let nicheFrame = 0;
  const reseatSoon = () => {
    if (nicheFrame) return;
    nicheFrame = requestAnimationFrame(() => { nicheFrame = 0; placeNiche(); });
  };
  window.addEventListener('resize', () => {
    reseatSoon();
    /* Mobile browsers fire resize when the URL bar collapses; only the width
       (or a real height jump) should cost a relayout. */
    const dw = Math.abs(innerWidth - lastFitW), dh = Math.abs(innerHeight - lastFitH);
    if (dw < 2 && dh < 120) return;
    lastFitW = innerWidth; lastFitH = innerHeight;
    clearTimeout(fitTimer);
    fitTimer = setTimeout(refit, 150);
  }, { passive: true });
  /* Zoom, a font finally arriving, a scrollbar appearing — anything that
     changes the name's box re-seats the figure without waiting for a resize. */
  if ('ResizeObserver' in window && nmFirst) {
    new ResizeObserver(reseatSoon).observe(nmFirst);
  }
  window.addEventListener('orientationchange', () => {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(() => { lastFitW = innerWidth; lastFitH = innerHeight; refit(); }, 260);
  });
  document.fonts?.addEventListener?.('loadingdone', () => {
    requestAnimationFrame(() => {
      fitNames();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  const timeEl = document.getElementById('localTime');
  const phaseEl = document.getElementById('dayPhase');
  if (timeEl) {
    const tickClock = () => {
      const now = new Date();
      timeEl.textContent = now.toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kuala_Lumpur'
      });
      if (phaseEl) {
        const h = parseInt(now.toLocaleTimeString('en-GB', {
          hour: '2-digit', hour12: false, timeZone: 'Asia/Kuala_Lumpur'
        }), 10);
        phaseEl.textContent = ' · ' + (
          h >= 5 && h < 12 ? 'MORNING' :
          h >= 12 && h < 18 ? 'AFTERNOON' :
          h >= 18 && h < 23 ? 'EVENING' : 'LATE NIGHT — STILL BUILDING');
      }
    };
    tickClock();
    setInterval(tickClock, 30000);
  }

  try {
    console.log(
      '%c YSF.SLM %c SPECIMEN ARCHIVE — 2026 ',
      'background:#9bcfa5;color:#0a0a0b;font-family:monospace;font-weight:bold;padding:4px 7px;',
      'background:#141415;color:#f2efe9;font-family:monospace;padding:4px 7px;'
    );
    console.log(
      '%cdesigned & built by hand — no template, no builder.\n%cpsst — on a desktop, click SELIM three times.',
      'color:#8e8b85;font-family:monospace;',
      'color:#9bcfa5;font-family:monospace;'
    );
  } catch (err) {}

  const baseTitle = document.title;
  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? 'ysf.slm — archived until you return' : baseTitle;
  });

  /* The header floats sheer over the hero by design. Past the fold it sits on
     body copy, so it takes a solid backdrop — otherwise text scrolling
     underneath collides with the nav labels. Hysteresis either side of the
     threshold stops it flickering when a scroll settles right on the line. */
  {
    const docEl2 = document.documentElement;
    let solid = false;
    const syncHead = () => {
      const y = window.scrollY;
      if (!solid && y > 96) { solid = true; docEl2.classList.add('head-solid'); }
      else if (solid && y < 64) { solid = false; docEl2.classList.remove('head-solid'); }
    };
    let headTick = false;
    addEventListener('scroll', () => {
      if (headTick) return;
      headTick = true;
      requestAnimationFrame(() => { syncHead(); headTick = false; });
    }, { passive: true });
    syncHead();
  }

  const FACTS = [
    'FLUTTER & DART', 'TYPESCRIPT & JS', 'PYTHON & SQL',
    'SWIFT · KOTLIN — NATIVE WIDGETS', 'FIREBASE · FIRESTORE', 'NODE.JS & REST APIS',
    'SHIPPING SINCE 2024', 'BUILT SOLO — 3 PRODUCTS', "BSC AUG '27 — SUNWAY × LANCASTER",
    'BUPPLES — LIVE ON BOTH STORES', 'EN / AR — SUBANG JAYA'
  ];
  const BONUS = ['PHOTOSHOOT — WEBGL FX', 'ADELANTE — NATIVE WIDGETS', 'TAJWEED — FRONTEND & IA'];

  /* ── Project sigils — dotted-stroke glyphs, one per case file.
     Bupples = Pip (the app's real mark: two overlapping rings, eyes in the lens),
     Adelante = forward mark, Photoshoot = camera, Tajweed = open book with its
     diacritic, Fallen Asteri = sword. ── */
  const SIGIL_GEO = {
    bupples: {
      strokes: [
        { circle: [39, 50, 21], step: 6.4 },
        { circle: [61, 50, 21], step: 6.4 },
        { dot: [44.6, 50, 2.9], accent: true, tag: 'eye' },
        { dot: [55.4, 50, 2.9], accent: true, tag: 'eye' }
      ],
      idle: 'blink'
    },
    photoshoot: {
      strokes: [
        { pts: [[26, 35], [74, 35], [74, 73], [26, 73]], close: true, step: 6.2 },
        { pts: [[40, 35], [44, 26], [59, 26], [63, 35]], step: 6 },
        { circle: [50, 54, 12], step: 5.8 },
        { dot: [50, 54, 3], accent: true, tag: 'pulse' },
        { dot: [67.5, 42.5, 1.8], accent: true }
      ],
      idle: 'pulse'
    },
    adelante: {
      strokes: [
        { pts: [[16, 74], [38, 24], [60, 74]], step: 5.2 },
        { pts: [[25, 56], [51, 56]], step: 5.2 },
        { pts: [[62, 49], [84, 49]], step: 5, accent: true },
        { pts: [[76, 40], [86, 49], [76, 58]], step: 4.5, accent: true }
      ],
      idle: 'sheen'
    },
    tajweed: {
      /* An open book with the mark that sits above a letter — the whole point
         of tajweed is what the diacritic tells you to do with the sound. */
      strokes: [
        { pts: [[50, 38], [24, 44], [24, 74], [50, 69]], step: 5.6 },
        { pts: [[50, 38], [76, 44], [76, 74], [50, 69]], step: 5.6 },
        { pts: [[50, 38], [50, 69]], step: 6.4, faint: true },
        { dot: [50, 25, 2.9], accent: true }
      ],
      idle: 'sheen'
    },
    asteri: {
      strokes: [
        { pts: [[44, 57], [44, 23], [50, 11], [56, 23], [56, 57]], step: 5.4 },
        { pts: [[50, 24], [50, 50]], step: 6.5, faint: true },
        { pts: [[34, 63], [66, 63]], step: 5.2 },
        { pts: [[50, 69], [50, 79]], step: 5 },
        { dot: [50, 86, 2.8], accent: true, tag: 'gem' }
      ],
      idle: 'sheen'
    }
  };
  const SIGIL_PAL = {
    cursor: { ink: '#1a1b1c', accent: '#417a52', dotScale: 1.18 },
    stamp: { ink: '#d8d5ce', accent: '#9bcfa5', dotScale: 1.28 },
    panel: { ink: '#cfccc4', accent: '#9bcfa5', dotScale: 1.75 }
  };
  const sigilDots = (geo) => {
    const dots = [];
    const push = (x, y, r, st, tag) => {
      const prev = dots[dots.length - 1];
      if (prev && !tag && Math.hypot(prev.x - x, prev.y - y) < 2.4) return;
      dots.push({ x, y, r, accent: !!st.accent, faint: !!st.faint, tag: tag || st.tag || '' });
    };
    geo.strokes.forEach((st) => {
      if (st.dot) { push(st.dot[0], st.dot[1], st.dot[2], st, st.tag || 'solo'); return; }
      if (st.circle) {
        const cx = st.circle[0], cy = st.circle[1], cr = st.circle[2];
        const n = Math.max(6, Math.round((2 * Math.PI * cr) / st.step));
        for (let i = 0; i < n; i++) {
          const a = (i / n) * 2 * Math.PI - Math.PI / 2;
          push(cx + Math.cos(a) * cr, cy + Math.sin(a) * cr, 1.9, st);
        }
        return;
      }
      const pts = st.close ? st.pts.concat([st.pts[0]]) : st.pts;
      for (let i = 0; i < pts.length - 1; i++) {
        const x0 = pts[i][0], y0 = pts[i][1];
        const x1 = pts[i + 1][0], y1 = pts[i + 1][1];
        const len = Math.hypot(x1 - x0, y1 - y0);
        const n = Math.max(1, Math.round(len / st.step));
        for (let j = (i === 0 ? 0 : 1); j <= n; j++) {
          const t = j / n;
          push(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 1.9, st);
        }
      }
    });
    return dots;
  };
  const makeSigil = (name, px, pal) => {
    const geo = SIGIL_GEO[name];
    if (!geo) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const cnv = document.createElement('canvas');
    cnv.width = Math.round(px * dpr);
    cnv.height = Math.round(px * dpr);
    cnv.style.width = px + 'px';
    cnv.style.height = px + 'px';
    cnv.setAttribute('aria-hidden', 'true');
    const ctx = cnv.getContext('2d');
    const k = (px * dpr) / 100;
    const dots = sigilDots(geo);
    const S_MAX = 200;
    let raf = null;
    let t0 = 0;
    const api = { canvas: cnv, played: false, settled: false };
    const render = (t, still) => {
      const front = api.settled ? 9999 : (t - t0) * 340;
      ctx.clearRect(0, 0, cnv.width, cnv.height);
      let blinkV = 1;
      let pulseV = 0;
      let checkV = 1;
      let bandPos = -1;
      if (!still) {
        if (geo.idle === 'blink') {
          const ph = t % 3.8;
          if (ph < 0.3) blinkV = Math.abs(ph / 0.15 - 1);
        } else if (geo.idle === 'pulse') {
          const ph = t % 4.2;
          if (ph < 0.9) pulseV = Math.sin((ph / 0.9) * Math.PI);
        } else if (geo.idle === 'check') {
          const ph = t % 7;
          checkV = ph < 0.4 ? ph / 0.4 : 1;
        } else if (geo.idle === 'sheen') {
          const ph = t % 5.5;
          if (ph < 1.1) bandPos = (ph / 1.1) * S_MAX;
        }
      }
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const s = d.x + d.y;
        let g = api.settled ? 1 : Math.min(1, Math.max(0, (front - s) / 60));
        if (g <= 0) continue;
        g = g * (2 - g);
        let r = d.r * pal.dotScale * k * g;
        let alpha = d.faint ? 0.4 : 1;
        let sy = 1;
        if (d.tag === 'eye') sy = Math.max(0.14, blinkV);
        if (d.tag === 'pulse') r *= 1 + pulseV * 0.7;
        if (d.tag === 'check') alpha *= 0.2 + 0.8 * checkV;
        if (bandPos >= 0) {
          let b = 1 - Math.abs(s - bandPos) / 26;
          if (b > 0) { b = b * b; r *= 1 + b * 0.5; alpha = Math.min(1, alpha + b * 0.4); }
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = d.accent ? pal.accent : pal.ink;
        ctx.beginPath();
        ctx.ellipse(d.x * k, d.y * k, r, r * sy, 0, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      render(now / 1000, false);
    };
    api.play = () => {
      api.played = true;
      api.settled = false;
      t0 = performance.now() / 1000;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    api.idle = () => {
      api.settled = true;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    api.settle = () => {
      api.played = true;
      api.settled = true;
      api.stop();
      render(0, true);
    };
    api.stop = () => {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    };
    return api;
  };
  /* The corrected cursor layer (approved.js) mounts these same sigils in the
     cursor disc when a case-file row is hovered. */
  window.makeSigil = makeSigil;

  /* case-file stamps: the same sigils, printed on each work row for touch screens.
     Keyed off each row's own data-project so reordering the archive can never
     hand a project someone else's glyph. */
  const SIGIL_ROWS = [...document.querySelectorAll('#workList .work-row')].map((row) => row.dataset.project || '');
  document.querySelectorAll('#workList .work-link').forEach((link, i) => {
    const name = SIGIL_ROWS[i];
    if (!SIGIL_GEO[name]) return;
    const sig = makeSigil(name, 40, SIGIL_PAL.stamp);
    if (!sig) return;
    link.dataset.cursorSigil = name;
    const holder = document.createElement('span');
    holder.className = 'work-sigil';
    holder.setAttribute('aria-hidden', 'true');
    holder.appendChild(sig.canvas);
    link.appendChild(holder);
    if (reduced || !('IntersectionObserver' in window)) {
      sig.settle();
      return;
    }
    new IntersectionObserver((en) => {
      if (en[0].isIntersecting) {
        if (!sig.played) sig.play();
        else sig.idle();
      } else {
        sig.stop();
      }
    }, { rootMargin: '40px' }).observe(sig.canvas);
  });

  /* dot-matrix nameplate — desktop data plate + mobile ID strip share the frames */
  const nameCanvases = [document.getElementById('nameDots'), document.getElementById('nameDotsM')]
    .filter(Boolean)
    .map((c) => ({ c, x: c.getContext('2d'), on: true }));
  if (nameCanvases.length) {
    const NW = 460;
    const NH = 60;
    const NCELL = 5;
    const markShown = () => nameCanvases.forEach((t) => { t.on = t.c.getClientRects().length > 0; });
    markShown();
    let shownTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(shownTimer);
      shownTimer = setTimeout(markShown, 200);
    });
    const sampleText = (text, font) => {
      const off = document.createElement('canvas');
      off.width = NW; off.height = NH;
      const o = off.getContext('2d');
      o.fillStyle = '#fff';
      o.font = font;
      o.textAlign = 'right';
      o.textBaseline = 'middle';
      o.fillText(text, NW - 4, NH / 2 + 2);
      const d = o.getImageData(0, 0, NW, NH).data;
      const set = [];
      for (let y = NCELL / 2; y < NH; y += NCELL) {
        for (let x = NCELL / 2; x < NW; x += NCELL) {
          if (d[((y | 0) * NW + (x | 0)) * 4 + 3] > 110) {
            set.push({ x, y, h: (1 - x / NW) * 0.45 + Math.random() * 0.18 });
          }
        }
      }
      return set;
    };
    let setA = sampleText('يوسف سليم', '500 40px "Geeza Pro", "Arial", sans-serif');
    let setB = sampleText('YOUSOF SELIM', '500 34px "JetBrains Mono", monospace');
    const drawSet = (nctx, set, vis) => {
      for (let i = 0; i < set.length; i++) {
        const p = set[i];
        const v = Math.min(1, Math.max(0, (vis - p.h) * 2.8));
        if (v < 0.05) continue;
        nctx.globalAlpha = v;
        nctx.beginPath();
        nctx.arc(p.x, p.y, NCELL * 0.42 * (0.4 + v * 0.6), 0, 6.2832);
        nctx.fill();
      }
      nctx.globalAlpha = 1;
    };
    const drawStatic = () => {
      const ink = getComputedStyle(docEl).getPropertyValue('--ink').trim() || '#f2efe9';
      nameCanvases.forEach((t) => {
        t.x.clearRect(0, 0, NW, NH);
        t.x.fillStyle = ink;
        drawSet(t.x, setB, 1.2);
      });
    };
    if (reduced) {
      drawStatic();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          setB = sampleText('YOUSOF SELIM', '500 34px "JetBrains Mono", monospace');
          drawStatic();
        });
      }
    } else {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          setA = sampleText('يوسف سليم', '500 40px "Geeza Pro", "Arial", sans-serif');
          setB = sampleText('YOUSOF SELIM', '500 34px "JetBrains Mono", monospace');
        });
      }
      let nameOn = true;
      const heroEl = document.getElementById('heroStage');
      if (heroEl && 'IntersectionObserver' in window) {
        new IntersectionObserver((en) => { nameOn = en[0].isIntersecting; }, { rootMargin: '60px' }).observe(heroEl);
      }
      let namePhase = 0;
      let nameDir = 1;
      let nameHold = 2.6;
      let nameLast = performance.now();
      const nameTick = (now) => {
        requestAnimationFrame(nameTick);
        const dt = Math.min(0.05, (now - nameLast) / 1000);
        nameLast = now;
        if (!nameOn || document.hidden) return;
        if (nameHold > 0) {
          nameHold -= dt;
        } else {
          namePhase += nameDir * dt / 1.1;
          if (namePhase >= 1) { namePhase = 1; nameDir = -1; nameHold = 3.4; }
          if (namePhase <= 0) { namePhase = 0; nameDir = 1; nameHold = 3.4; }
        }
        const ink = getComputedStyle(docEl).getPropertyValue('--ink').trim() || '#f2efe9';
        nameCanvases.forEach((t) => {
          if (!t.on) return;
          t.x.clearRect(0, 0, NW, NH);
          t.x.fillStyle = ink;
          drawSet(t.x, setA, 1 - namePhase);
          drawSet(t.x, setB, namePhase);
        });
      };
      requestAnimationFrame(nameTick);
    }
  }

  /* touch archive: tapping SELIM pops fact chips (the desktop game's little sibling) */
  const heroStagePre = document.getElementById('heroStage');

  /* The trigger's accessible surface lives outside the <h1> so the heading
     keeps announcing the name. `eggButton` is a real, labelled control; the
     word itself stays a pointer/touch shortcut. */
  const mountEggButton = (label, run) => {
    const host = document.getElementById('heroName');
    if (!host || !host.parentNode) return null;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'vh egg-key';
    button.textContent = label;
    button.addEventListener('click', run);
    host.parentNode.insertBefore(button, host.nextSibling);
    return button;
  };

  const touchEgg = !(matchMedia('(min-width: 1150px)').matches && finePointer);
  if (touchEgg && nmLast && heroStagePre) {
    const eggLineTap = nmLast.closest('.nm-line');
    if (eggLineTap) eggLineTap.style.pointerEvents = 'auto';
    nmLast.setAttribute('aria-hidden', 'false');
    const ALLFACTS = FACTS.concat(BONUS);
    let fi = 0;
    let chipT = null;
    const chip = document.createElement('span');
    chip.className = 'egg-chip egg-chip-tap';
    chip.setAttribute('role', 'status');
    chip.setAttribute('aria-live', 'polite');
    const chipDot = document.createElement('i');
    chipDot.textContent = '◉';
    chipDot.setAttribute('aria-hidden', 'true');
    const chipText = document.createElement('span');
    chip.appendChild(chipDot);
    chip.appendChild(chipText);
    heroStagePre.appendChild(chip);
    const popFact = () => {
      const sr = heroStagePre.getBoundingClientRect();
      const r = nmLast.getBoundingClientRect();
      nmLast.classList.remove('egg-flash');
      void nmLast.offsetWidth;
      nmLast.classList.add('egg-flash');
      chipText.textContent = ALLFACTS[fi % ALLFACTS.length];
      fi++;
      const cx = Math.max(84, Math.min(sr.width - 84, r.left - sr.left + r.width * (0.2 + 0.6 * ((fi * 0.37) % 1))));
      chip.style.left = cx + 'px';
      chip.style.top = (r.top - sr.top - 14) + 'px';
      chip.classList.remove('on');
      void chip.offsetWidth;
      chip.classList.add('on');
      clearTimeout(chipT);
      chipT = setTimeout(() => chip.classList.remove('on'), 2400);
    };
    nmLast.addEventListener('click', popFact);
    mountEggButton('Reveal a fact from the archive', popFact);
  }

  if (reduced || !window.gsap || !window.ScrollTrigger) {
    docEl.classList.add('reduced');
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNames);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* Two scrub speeds, and a reason for each. SCRUB_UI is anything the visitor
     should feel they are driving directly; SCRUB_BG is background parallax,
     where a little lag reads as depth rather than as lag. */
  const SCRUB_UI = 0.35;
  const SCRUB_BG = 1;
  /* A slow boot may have set `.reduced` from the head-script timer. The full
     animation path is running, so take the class back — otherwise the CSS
     stays in its motionless state while GSAP animates against it. */
  docEl.classList.remove('reduced');
  ScrollTrigger.config({ ignoreMobileResize: true });

  let lenis = null;
  if (window.Lenis) {
    /* `duration: 1.15` with an expo-out ease means a single wheel impulse
       takes over a second to settle — and ScrollTrigger's scrub then adds its
       own catch-up on top, so the pinned hero trailed the wheel by more than a
       second. One lerp, tuned to land inside the perceptual 'instant' band. */
    lenis = new Lenis({
      lerp: 0.11,
      smoothWheel: true,
      wheelMultiplier: 1
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.lenis = lenis;
  }

  document.querySelectorAll('[data-scrollto]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.5 });
      else target.scrollIntoView({ behavior: 'smooth' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  const wrap = document.getElementById('portraitWrap');
  const slot = document.getElementById('portraitSlot');
  const pinEl = document.getElementById('identityPin');
  const heroMeta = document.getElementById('heroMeta');

  const portraitFilter = '';
  /* The entrance used to run for well over three seconds, and the thing a
     visitor came to click — View Work, Résumé, GitHub — arrived tenth of
     eleven. Same choreography, half the length, and the actions promoted to
     the third beat: name, face, actions. Everything else fills in behind. */
  const entrance = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  entrance
    .to('#halo', { opacity: 1, duration: 0.9, ease: 'power2.out' }, 0)
    .to('.nm-in', { y: 0, duration: 1.05, ease: 'expo.out', stagger: 0.09 }, 0.06)
    .to('#nmGround', { scaleX: 1, duration: 0.8, ease: 'power2.inOut' }, 0.26)
    .fromTo('#portrait',
      { filter: 'blur(9px) ' + portraitFilter },
      { filter: 'blur(0px) ' + portraitFilter, duration: 0.72, clearProps: 'filter' },
      0.34)
    .to(wrap, { opacity: 1, y: 0, duration: 0.72, ease: 'power3.out' }, 0.34)
    .fromTo('.site-head',
      { opacity: 0, y: -14 },
      { opacity: 1, y: 0, duration: 0.44, clearProps: 'opacity,transform' },
      0.30)
    .to('.hm-eyebrow, .hm-role', { opacity: 1, y: 0, duration: 0.44, stagger: 0.06 }, 0.40)
    .to('.hm-ctas', { opacity: 1, y: 0, duration: 0.46 }, 0.56)
    .to('.hm-scroll', { opacity: 1, y: 0, duration: 0.4 }, 0.62)
    .to('#identityPin [data-load]:not(.hm-eyebrow):not(.hm-role):not(.hm-ctas):not(.hm-scroll)',
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.055 }, 0.68);

  gsap.set('#identityPin [data-load]', { y: 22 });
  gsap.set(wrap, { y: -26 });

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    fitNames();
    ScrollTrigger.refresh();
    entrance.play();
  };
  /* Hold the entrance until the loader has actually lifted (approved.js exposes
     window.siteReady) so the name-rise always plays in view, never behind it. */
  const loaderGone = () => window.siteReady || Promise.resolve();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => loaderGone().then(() => {
      start();
      fitNames();
      ScrollTrigger.refresh();
    }));
  }
  setTimeout(() => loaderGone().then(start), 1300);
  setTimeout(start, 2600);

  const portraitFX = { dev: { v: 0 }, bg: { v: 0 }, ph: { v: 0 } };
  let heroVisible = true;
  const heroStageEl = document.getElementById('heroStage');
  if (heroStageEl) {
    new IntersectionObserver((entries) => {
      heroVisible = entries[0].isIntersecting;
    }, { rootMargin: '60px' }).observe(heroStageEl);
  }

  const roleTop = document.getElementById('roleTop');
  const roleBottom = document.getElementById('roleBottom');
  if (roleTop && roleBottom) {
    const ROLES = [
      ['Software Engineering Student', ['Mobile ', { em: '&' }, ' Full-Stack ', { em: 'Developer' }]],
      ['Mobile', ['Flutter, SwiftUI ', { em: '&' }, ' Kotlin']],
      ['Backend & Data', ['Firebase, Node.js ', { em: '&' }, ' Cloud Functions']],
      ['Cloud & AI', ['Vertex AI, Gemini ', { em: '&' }, ' MediaPipe']],
      ['Interactive', ['WebGL2, Electron ', { em: '&' }, ' Godot Engine']]
    ];
    const setParts = (el, parts) => {
      el.textContent = '';
      parts.forEach((p) => {
        if (typeof p === 'string') {
          el.appendChild(document.createTextNode(p));
        } else {
          const em = document.createElement('em');
          em.textContent = p.em;
          el.appendChild(em);
        }
      });
    };
    /* Each character becomes its own inline-block span so it can be staggered.
       That shatters the text run: screen readers announce the job title one
       letter at a time. Hide the animated glyphs from the accessibility tree
       and publish one clean string beside them instead. */
    const roleSR = document.createElement('p');
    roleSR.className = 'vh';
    roleSR.setAttribute('aria-live', 'polite');
    roleTop.closest('.hm-role')?.appendChild(roleSR);
    const flatten = (parts) => parts.map((p) => (typeof p === 'string' ? p : p.em)).join('');
    const announceRole = (index) => {
      roleSR.textContent = `${ROLES[index][0]} — ${flatten(ROLES[index][1])}`;
    };
    const splitChars = (el) => {
      el.setAttribute('aria-hidden', 'true');
      const spans = [];
      const frag = document.createDocumentFragment();
      const wrapRun = (txt, italic) => {
        for (const ch of txt) {
          const s = document.createElement('span');
          s.className = italic ? 'ch ch-em' : 'ch';
          s.textContent = ch === ' ' ? ' ' : ch;
          frag.appendChild(s);
          spans.push(s);
        }
      };
      Array.from(el.childNodes).forEach((n) => {
        if (n.nodeType === 3) wrapRun(n.textContent, false);
        else if (n.tagName === 'EM') wrapRun(n.textContent, true);
      });
      el.textContent = '';
      el.appendChild(frag);
      return spans;
    };
    let topSpans = splitChars(roleTop);
    let botSpans = splitChars(roleBottom);
    let ri = 0;
    let swapping = false;
    announceRole(0);
    let dwell = 0;
    setInterval(() => {
      if (!heroVisible || document.hidden || swapping) return;
      /* Index 0 is the résumé's own title. Let it sit for an extra beat so a
         quick visitor reads the headline, not a random specialism. */
      if (ri === 0 && dwell < 1) { dwell += 1; return; }
      dwell = 0;
      swapping = true;
      ri = (ri + 1) % ROLES.length;
      gsap.to(topSpans.concat(botSpans), {
        yPercent: -112,
        opacity: 0,
        duration: 0.32,
        ease: 'power2.in',
        stagger: 0.012,
        onComplete: () => {
          roleTop.textContent = ROLES[ri][0];
          setParts(roleBottom, ROLES[ri][1]);
          topSpans = splitChars(roleTop);
          botSpans = splitChars(roleBottom);
          announceRole(ri);
          gsap.fromTo(topSpans.concat(botSpans),
            { yPercent: 115, opacity: 0 },
            {
              yPercent: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.016,
              onComplete: () => { swapping = false; }
            });
        }
      });
    }, 3900);
  }

  const portraitImgEl = document.getElementById('portrait');
  if (portraitImgEl && wrap && finePointer) {
    const srcImg = new Image();
    srcImg.src = 'images/yousof-niche.png';
    srcImg.decode().then(() => {
      const sw = srcImg.naturalWidth;
      const sh = srcImg.naturalHeight;
      const S = 4;
      const CELL = 26;
      const cs = CELL / S;
      const samp = document.createElement('canvas');
      samp.width = sw; samp.height = sh;
      const sc = samp.getContext('2d', { willReadFrequently: true });
      sc.drawImage(srcImg, 0, 0);
      const px = sc.getImageData(0, 0, sw, sh).data;
      const dots = [];
      let rowI = 0;
      for (let cy = 0; cy < sh; cy += cs, rowI++) {
        const xo = (rowI % 2) ? cs / 2 : 0;
        for (let cx = -xo; cx < sw; cx += cs) {
          let lum = 0, a = 0, n = 0, cr = 0, cg = 0, cb = 0;
          const x0 = Math.max(0, Math.floor(cx)), x1 = Math.min(sw, Math.ceil(cx + cs));
          const y0 = Math.max(0, Math.floor(cy)), y1 = Math.min(sh, Math.ceil(cy + cs));
          for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
              const i = (y * sw + x) * 4;
              const al = px[i + 3] / 255;
              lum += (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255 * al;
              cr += px[i] * al; cg += px[i + 1] * al; cb += px[i + 2] * al;
              a += al; n++;
            }
          }
          if (!n) continue;
          lum /= n;
          const aSum = a;
          a /= n;
          if (a < 0.42) continue;
          const r = (CELL * 0.47) * Math.pow(Math.min(1, lum * 1.45 + 0.06), 0.78);
          if (r < 1.4) continue;
          dots.push({
            x: (cx + cs / 2) * S, y: (cy + cs / 2) * S, r,
            c0: Math.round(cr / aSum), c1: Math.round(cg / aSum), c2: Math.round(cb / aSum)
          });
        }
      }

      const sil = document.createElement('canvas');
      sil.width = sw * S; sil.height = sh * S;
      const slx = sil.getContext('2d');
      [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3], [3, 3], [-3, 3], [3, -3], [-3, -3]].forEach(([ox, oy]) => {
        slx.drawImage(srcImg, ox, oy, sil.width, sil.height);
      });
      slx.globalCompositeOperation = 'source-in';
      slx.fillStyle = '#0b0b0c';
      slx.fillRect(0, 0, sil.width, sil.height);

      /* The morph's dot highlight and its travelling edge tint were hardcoded
         mint. Under the easter egg they take the eagle's gold, so the figure
         glows with the flag rather than the default accent. */
      const EGY = docEl.classList.contains('egypt');
      const DOT_HI = EGY ? [246, 216, 138] : [201, 238, 209];
      const DOT_EDGE = EGY ? [212, 160, 23] : [155, 207, 165];

      const photoImg = document.getElementById('gardenImg');
      let photoReady = Boolean(photoImg && photoImg.complete && photoImg.naturalWidth);
      if (photoImg && !photoReady) {
        photoImg.decode().then(() => { photoReady = true; }).catch(() => {});
      }

      const cnv = document.createElement('canvas');
      cnv.width = sw * S; cnv.height = sh * S;
      cnv.className = 'portrait-canvas';
      cnv.setAttribute('role', 'img');
      cnv.setAttribute('aria-label', portraitImgEl.alt);
      cnv.setAttribute('data-cursor', 'FIG. 00');
      wrap.appendChild(cnv);
      portraitImgEl.style.display = 'none';
      const ctx = cnv.getContext('2d');

      let mouse = null;
      if (finePointer) {
        window.addEventListener('pointermove', (e) => {
          const r = cnv.getBoundingClientRect();
          if (!r.width) { mouse = null; return; }
          const k = cnv.width / r.width;
          mouse = { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k };
        }, { passive: true });
      }

      const DIAG = (sw + sh) * S;
      const T0 = performance.now() / 1000 + 0.9;
      let pMode = 'render';
      let pT0 = T0;
      portraitFX.dissolve = () => {
        pMode = 'dissolve';
        pT0 = performance.now() / 1000;
        cnv.style.pointerEvents = 'none';
      };
      portraitFX.render = () => {
        pMode = 'render';
        pT0 = performance.now() / 1000;
        cnv.style.pointerEvents = '';
      };
      let rafId = null;
      const draw = () => {
        rafId = requestAnimationFrame(draw);
        const t = performance.now() / 1000;
        ctx.clearRect(0, 0, cnv.width, cnv.height);
        const front = (t - pT0) * 1050;
        const done = front > DIAG + 460;
        if (pMode === 'dissolve' && done) return;
        const bgV = portraitFX.bg.v;
        const phV = portraitFX.ph.v;
        if (bgV > 0 && photoReady) {
          const sc = 1.03 - 0.03 * bgV;
          const dw = cnv.width * sc;
          const dh = cnv.height * sc;
          ctx.globalAlpha = bgV;
          ctx.filter = 'saturate(0.92) contrast(1.05) brightness(0.96)';
          ctx.drawImage(photoImg, (cnv.width - dw) / 2, (cnv.height - dh) / 2, dw, dh);
          ctx.filter = 'none';
          ctx.globalAlpha = 1;
        }
        const silA = (pMode === 'dissolve' ? Math.max(0, 1 - front / (DIAG + 460)) : 1) * (1 - phV);
        if (silA > 0.01) {
          ctx.globalAlpha = silA;
          ctx.drawImage(sil, 0, 0);
        }
        ctx.globalAlpha = Math.max(0, 1 - phV);
        if (phV >= 0.995) { ctx.globalAlpha = 1; return; }
        const settled = pMode === 'render' && done;
        const bandPos = (t * 150) % (DIAG * 2.2);
        for (let i = 0; i < dots.length; i++) {
          const d = dots[i];
          const s = d.x + d.y;
          let gq;
          if (pMode === 'render') {
            gq = settled ? 1 : Math.min(1, Math.max(0, (front - s) / 440));
          } else {
            gq = 1 - Math.min(1, Math.max(0, (front - s) / 440));
          }
          if (gq <= 0) continue;
          const grow = gq * (2 - gq);
          const renderG = settled ? 0 : Math.min(1, (1 - gq) * 1.25);
          let band = 1 - Math.abs(s - bandPos) / 210;
          band = band > 0 ? band * band : 0;
          let boost = 0;
          if (mouse) {
            const dx = d.x - mouse.x;
            const dy = d.y - mouse.y;
            const ds = dx * dx + dy * dy;
            if (ds < 160000) boost = Math.exp(-ds / 40000) * 0.75;
          }
          const dv = portraitFX.dev.v;
          let dq = 0;
          if (dv > 0) {
            dq = Math.min(1, Math.max(0, (dv * (DIAG + 520) - s) / 420));
          }
          const breathe = 1 + 0.045 * (1 - dq) * Math.sin(t * 1.4 + d.x * 0.012 + d.y * 0.009);
          const r = d.r * grow * breathe * (1 + (band * 0.42 + boost) * (1 - dq) + dq * 0.42);
          const g = Math.max(renderG, Math.min(1, band * 0.85 + boost)) * (1 - dq);
          let rC, gC, bC;
          if (g > 0.92) {
            rC = DOT_HI[0]; gC = DOT_HI[1]; bC = DOT_HI[2];
          } else {
            rC = 242 - 87 * g; gC = 239 - 32 * g; bC = 233 - 68 * g;
          }
          if (dq > 0) {
            rC += (d.c0 - rC) * dq;
            gC += (d.c1 - gC) * dq;
            bC += (d.c2 - bC) * dq;
            const edge = Math.sin(Math.PI * dq) * 0.55;
            if (edge > 0.04) {
              rC += (DOT_EDGE[0] - rC) * edge;
              gC += (DOT_EDGE[1] - gC) * edge;
              bC += (DOT_EDGE[2] - bC) * edge;
            }
          }
          ctx.fillStyle = 'rgb(' + (rC | 0) + ',' + (gC | 0) + ',' + (bC | 0) + ')';
          ctx.beginPath();
          ctx.arc(d.x, d.y, r, 0, 6.2832);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      };
      new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          if (!rafId) draw();
        } else if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }, { rootMargin: '80px' }).observe(cnv);
    }).catch(() => {});
  }

  const gameScreen = matchMedia('(min-width: 1150px)').matches;
  if (gameScreen && finePointer && nmLast && heroStageEl) {
    const eggLine = nmLast.closest('.nm-line');
    if (eggLine) eggLine.style.pointerEvents = 'auto';
    nmLast.dataset.cursor = 'PRESS ×3';

    const SPR = {
      run1: ['..XX....', '..XX....', '...X....', '.XXXX...', 'X..X.X..', '...XX...', '...X....', '..X.X...', '..X..X..', '.X....X.', '.X.....X', 'XX......'],
      run2: ['..XX....', '..XX....', '...X....', '.XXXX...', '.X.X.X..', '...XX...', '...X....', '...XX...', '...XX...', '..X..X..', '..X..X..', '..X..XX.'],
      jump: ['..XX....', '..XX....', '...X....', 'XXXXX...', 'X..X.X..', '...XX...', '..X.X...', '..X.X...', '.X...X..', '.X...X..', '........', '........']
    };

    const snd = (() => {
      let ac = null;
      let muted = false;
      const blip = (f0, f1, dur, type, vol) => {
        if (muted) return;
        try {
          if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
          if (ac.state === 'suspended') ac.resume();
          const t = ac.currentTime;
          const o = ac.createOscillator();
          const g = ac.createGain();
          o.type = type;
          o.frequency.setValueAtTime(f0, t);
          o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
          g.gain.setValueAtTime(vol, t);
          g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
          o.connect(g);
          g.connect(ac.destination);
          o.start(t);
          o.stop(t + dur + 0.03);
        } catch (err) {}
      };
      return {
        start: () => {
          blip(150, 620, 0.18, 'square', 0.035);
          setTimeout(() => blip(494, 494, 0.1, 'sine', 0.04), 150);
          setTimeout(() => blip(740, 740, 0.18, 'sine', 0.045), 260);
        },
        jump: () => blip(190, 340, 0.09, 'square', 0.03),
        air: () => blip(260, 470, 0.09, 'square', 0.028),
        land: () => blip(150, 65, 0.07, 'triangle', 0.045),
        collect: () => { blip(659, 659, 0.07, 'sine', 0.045); setTimeout(() => blip(880, 880, 0.11, 'sine', 0.045), 70); },
        complete: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, f, 0.15, 'sine', 0.045), i * 95)),
        toggle: () => { muted = !muted; return muted; }
      };
    })();

    let presses = 0;
    let pressTimer = null;
    let game = null;
    const cursorLabelEl = document.getElementById('cursorLabel');

    const press = () => {
      if (game) return;
      if (window.scrollY > 8) {
        if (lenis) lenis.scrollTo(0, { duration: 0.9 });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      presses++;
      if (presses >= 3) {
        presses = 0;
        nmLast.dataset.cursor = 'PRESS ×3';
        gsap.fromTo(nmLast, { filter: 'brightness(1)' }, { filter: 'brightness(2.1)', duration: 0.18, yoyo: true, repeat: 1, clearProps: 'filter' });
        startGame();
        return;
      }
      nmLast.dataset.cursor = 'PRESS ×' + (3 - presses);
      if (cursorLabelEl) cursorLabelEl.textContent = nmLast.dataset.cursor;
      gsap.fromTo(nmLast, { filter: 'brightness(1)' }, { filter: 'brightness(1.55)', duration: 0.14, yoyo: true, repeat: 1, clearProps: 'filter' });
      clearTimeout(pressTimer);
      pressTimer = setTimeout(() => { presses = 0; nmLast.dataset.cursor = 'PRESS ×3'; }, 1600);
    };
    nmLast.addEventListener('pointerdown', (e) => {
      /* detail > 1 is a double/triple click — the browser's select-this-line
         gesture, not an intent to start anything. */
      if (e.button === 0 && e.detail <= 1) press();
    });
    mountEggButton('Play the hidden name game', () => { presses = 2; press(); });

    const startGame = () => {
      if (game) return;
      snd.start();
      if (lenis) lenis.scrollTo(0, { duration: 0.45 });
      else window.scrollTo(0, 0);
      const deadline = performance.now() + 2200;
      const waitTop = () => {
        if (game) return;
        if (window.scrollY < 4 || performance.now() > deadline) buildGame();
        else requestAnimationFrame(waitTop);
      };
      setTimeout(() => requestAnimationFrame(waitTop), 480);
    };

    const buildGame = () => {
      if (game) return;
      docEl.classList.add('gaming');
      if (lenis) lenis.stop();
      void heroStageEl.offsetWidth;
      requestAnimationFrame(() => requestAnimationFrame(buildGameMeasured));
    };

    const buildGameMeasured = () => {
      if (game) return;
      fitNames();
      const sr = heroStageEl.getBoundingClientRect();
      const stackR = nmStack.getBoundingClientRect();
      const groundY = stackR.bottom - sr.top + 1;
      const walls = [nmFirst, nmLast].map((el) => {
        const r = el.getBoundingClientRect();
        return {
          left: r.left - sr.left,
          right: r.right - sr.left,
          top: r.top - sr.top + r.height * 0.18,
          bottom: r.bottom - sr.top
        };
      });
      const plats = [];
      const picks = [];
      [[nmFirst, 0], [nmLast, 6]].forEach(([el, off]) => {
        const node = el.firstChild;
        if (!node || node.nodeType !== 3) return;
        const txt = node.textContent;
        for (let i = 0; i < txt.length; i++) {
          const rg = document.createRange();
          rg.setStart(node, i);
          rg.setEnd(node, i + 1);
          const r = rg.getBoundingClientRect();
          const p = {
            x: r.left - sr.left,
            w: r.width,
            y: r.top - sr.top + r.height * 0.2,
            dx: 0, dy: 0, mover: false
          };
          plats.push(p);
          /* Pickups rise in an arc over each word — low at the word's ends,
             peaking mid-word — instead of one flat monotonous row. */
          const arc = 36 + Math.sin((txt.length > 1 ? i / (txt.length - 1) : 0.5) * Math.PI) * 56;
          picks.push({
            x: p.x + p.w / 2,
            y: p.y - arc,
            fact: FACTS[off + i],
            plat: p,
            got: false
          });
        }
      });
      if (!plats.length) {
        docEl.classList.remove('gaming');
        if (lenis) lenis.start();
        return;
      }
      const dimEl = document.querySelector('.dim-top');
      let dimY = null;
      if (dimEl) {
        const dr = dimEl.getBoundingClientRect();
        dimY = dr.top - sr.top + dr.height / 2;
        plats.push({ x: dr.left - sr.left + 8, w: dr.width - 16, y: dimY, dx: 0, dy: 0, mover: false });
        picks.push({ x: dr.left - sr.left + dr.width / 2, y: dimY - 46, fact: BONUS[0], plat: null, got: false });
      }
      const plateRows = document.querySelectorAll('.hm-data > div');
      let plateTop = null;
      let plateLeft = null;
      let plateRight = null;
      plateRows.forEach((row, i) => {
        const r = row.getBoundingClientRect();
        if (r.width < 40) return;
        const py = r.top - sr.top;
        plats.push({ x: r.left - sr.left, w: r.width, y: py, dx: 0, dy: 0, mover: false });
        if (plateTop === null || py < plateTop) plateTop = py;
        plateLeft = r.left - sr.left;
        if (plateRight === null || r.right - sr.left > plateRight) plateRight = r.right - sr.left;
      });
      if (plateTop !== null) {
        picks.push({ x: (plateLeft + plateRight) / 2, y: plateTop - 48, fact: BONUS[1], plat: null, got: false });
      }
      const stackRight = stackR.right - sr.left;
      const selimTopY = plats[6] ? plats[6].y : groundY - 150;
      const movers = [];
      if (plateLeft !== null) {
        movers.push({
          x: stackRight - 30, w: 74, y: selimTopY - 24,
          x0: stackRight - 30, y0: selimTopY - 24,
          ax: Math.max(30, (plateLeft - stackRight) * 0.4), ay: 14,
          sp: 0.9, ph: 0, dx: 0, dy: 0, mover: true
        });
      }
      movers.push({
        x: Math.min(sr.width - 150, (plateLeft || sr.width - 240) + 60), w: 74,
        y: groundY - 60,
        x0: Math.min(sr.width - 150, (plateLeft || sr.width - 240) + 60),
        y0: groundY - 60,
        ax: 0, ay: Math.min(150, (groundY - (plateTop || groundY - 220)) * 0.42),
        sp: 0.75, ph: 1.8, dx: 0, dy: 0, mover: true
      });
      movers.forEach((m) => plats.push(m));
      picks.push({
        x: movers[movers.length - 1].x0 + 37,
        y: movers[movers.length - 1].y0 - movers[movers.length - 1].ay - 50,
        fact: BONUS[2], plat: null, got: false
      });

      if (portraitFX.dissolve) portraitFX.dissolve();
      if (eggLine) eggLine.style.pointerEvents = 'none';

      const hud = document.createElement('div');
      hud.className = 'egg-hud';
      hud.setAttribute('aria-hidden', 'true');
      const hudKeys = document.createElement('span');
      hudKeys.textContent = '←→ RUN · SPACE ×2 JUMP · M SOUND · ESC EXIT';
      const hudCount = document.createElement('b');
      hudCount.textContent = '0 / ' + picks.length;
      hud.appendChild(hudKeys);
      hud.appendChild(hudCount);
      heroStageEl.appendChild(hud);

      const layer = document.createElement('div');
      layer.className = 'egg-layer';
      heroStageEl.appendChild(layer);

      const CELLPX = 3;
      const rc = document.createElement('canvas');
      rc.width = 8 * CELLPX * 2;
      rc.height = 12 * CELLPX * 2;
      rc.className = 'egg-runner';
      rc.style.width = (8 * CELLPX) + 'px';
      rc.style.height = (12 * CELLPX) + 'px';
      layer.appendChild(rc);
      const rctx = rc.getContext('2d');
      rctx.scale(2, 2);
      rc.style.transformOrigin = '50% 100%';

      const fx = document.createElement('canvas');
      fx.width = Math.round(sr.width);
      fx.height = Math.round(sr.height);
      fx.className = 'egg-fx';
      layer.appendChild(fx);
      const fxc = fx.getContext('2d');
      const parts = [];
      const spawnDust = (x, y, n, green, up) => {
        for (let i = 0; i < n; i++) {
          parts.push({
            x: x + (Math.random() - 0.5) * 14,
            y: y + (Math.random() - 0.5) * 4,
            vx: (Math.random() - 0.5) * (up ? 160 : 90),
            vy: up ? (-90 - Math.random() * 160) : (-30 - Math.random() * 50),
            life: 0.5 + Math.random() * 0.35,
            age: 0,
            r: 1.6 + Math.random() * 1.8,
            green
          });
        }
      };

      const wr = portraitWrapEl ? portraitWrapEl.getBoundingClientRect() : null;
      const st = {
        x: wr ? (wr.left + wr.width / 2 - sr.left) : sr.width * 0.6,
        y: 60, vx: 0, vy: 0, face: 1, grounded: false, wasGrounded: false,
        lit: 0, t0: performance.now() / 1000, anim: 0,
        coyote: 0, buffer: 0, sq: 0, sqv: 0, dustT: 0, startT: performance.now(),
        jumps: 0, ride: null
      };
      const keys = {};
      let rafG = null;
      let last = performance.now();

      const onKey = (e) => {
        if (e.code === 'Escape') { endGame(); return; }
        if (e.code === 'KeyM' && e.type === 'keydown') {
          const m = snd.toggle();
          hudKeys.textContent = (m ? '←→ RUN · SPACE ×2 JUMP · M SOUND OFF · ESC EXIT' : '←→ RUN · SPACE ×2 JUMP · M SOUND · ESC EXIT');
          return;
        }
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyA', 'KeyD', 'KeyW'].indexOf(e.code) !== -1) {
          e.preventDefault();
          const isJumpKey = e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW';
          if (isJumpKey) {
            if (e.type === 'keydown' && !keys[e.code]) st.buffer = 0.13;
            if (e.type === 'keyup' && st.vy < 0) st.vy *= 0.45;
          }
          keys[e.code] = e.type === 'keydown';
        }
      };
      const w0 = window.innerWidth;
      const h0 = window.innerHeight;
      const onResize = () => {
        if (Math.abs(window.innerWidth - w0) > 3 || Math.abs(window.innerHeight - h0) > 90) endGame();
      };

      const drawRunner = (frame, greenT) => {
        rctx.clearRect(0, 0, 24, 36);
        const map = SPR[frame];
        const g = greenT;
        rctx.fillStyle = g > 0.04
          ? 'rgb(' + (242 - 87 * g | 0) + ',' + (239 - 32 * g | 0) + ',' + (233 - 68 * g | 0) + ')'
          : '#f2efe9';
        for (let r = 0; r < map.length; r++) {
          for (let c = 0; c < 8; c++) {
            if (map[r][c] !== 'X') continue;
            rctx.beginPath();
            rctx.arc(c * CELLPX + CELLPX / 2, r * CELLPX + CELLPX / 2, CELLPX * 0.46, 0, 6.2832);
            rctx.fill();
          }
        }
      };

      const onCollect = (c) => {
        hudCount.textContent = st.lit + ' / ' + picks.length;
        gsap.fromTo(hudCount, { scale: 1.45 }, { scale: 1, duration: 0.4, ease: 'back.out(3)', transformOrigin: '50% 50%', display: 'inline-block' });
        spawnDust(c.x, c.y, 12, true, true);
        snd.collect();
        if (c.plat) {
          const strip = document.createElement('span');
          strip.className = 'egg-strip';
          strip.style.left = c.plat.x + 'px';
          strip.style.top = (c.plat.y - 1) + 'px';
          strip.style.width = c.plat.w + 'px';
          layer.appendChild(strip);
          gsap.from(strip, { scaleX: 0, duration: 0.4, ease: 'power3.out' });
        }
        const chip = document.createElement('span');
        chip.className = 'egg-chip';
        const dotEl = document.createElement('i');
        dotEl.textContent = '◉';
        chip.appendChild(dotEl);
        chip.appendChild(document.createTextNode(c.fact));
        chip.style.left = Math.max(90, Math.min(sr.width - 90, c.x)) + 'px';
        chip.style.top = (c.y - 12) + 'px';
        layer.appendChild(chip);
        gsap.fromTo(chip, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' });
        gsap.to(chip, { opacity: 0, y: -8, delay: 2.5, duration: 0.4, onComplete: () => chip.remove() });
        if (st.lit === picks.length) {
          const secs = Math.round((performance.now() - st.startT) / 1000);
          const tStr = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
          hudKeys.textContent = 'ARCHIVE COMPLETE ✦ ' + tStr + ' · ESC EXIT';
          snd.complete();
          picks.forEach((pp, i) => {
            setTimeout(() => spawnDust(pp.x, pp.y, 8, true, true), i * 60);
          });
          gsap.fromTo('.egg-strip', { opacity: 1 }, { opacity: 0.25, duration: 0.28, yoyo: true, repeat: 5, stagger: 0.04 });
        }
      };

      const doJump = (air) => {
        st.vy = air ? -645 : -730;
        st.grounded = false;
        st.coyote = 0;
        st.buffer = 0;
        st.sq = 0.22;
        st.sqv = 0;
        st.ride = null;
        if (air) {
          st.jumps++;
          spawnDust(st.x, st.y - 12, 6, true, false);
          snd.air();
        } else {
          spawnDust(st.x, st.y, 3, false, false);
          snd.jump();
        }
      };

      const loop = (now) => {
        rafG = requestAnimationFrame(loop);
        const t = now / 1000;
        const dt = Math.min(0.035, (now - last) / 1000);
        last = now;
        const leftK = keys.ArrowLeft || keys.KeyA;
        const rightK = keys.ArrowRight || keys.KeyD;
        const target = (rightK ? 290 : 0) - (leftK ? 290 : 0);
        const acc = (target === 0 || target * st.vx < 0) ? 3600 : 2800;
        const dv = target - st.vx;
        st.vx += Math.max(-acc * dt, Math.min(acc * dt, dv));
        if (Math.abs(st.vx) < 6 && target === 0) st.vx = 0;
        if (target) st.face = target > 0 ? 1 : -1;

        st.coyote = st.grounded ? 0.09 : Math.max(0, st.coyote - dt);
        st.buffer = Math.max(0, st.buffer - dt);
        if (st.buffer > 0) {
          if (st.grounded || st.coyote > 0) doJump(false);
          else if (st.jumps < 1) doJump(true);
        }

        const tg = (now - st.startT) / 1000;
        for (let mi = 0; mi < movers.length; mi++) {
          const m = movers[mi];
          const nx = m.x0 + Math.sin(tg * m.sp + m.ph) * m.ax;
          const ny = m.y0 + Math.sin(tg * m.sp + m.ph) * m.ay;
          m.dx = nx - m.x;
          m.dy = ny - m.y;
          m.x = nx;
          m.y = ny;
        }
        if (st.ride && st.grounded) {
          st.x += st.ride.dx;
          st.y += st.ride.dy;
          if (st.x < st.ride.x - 8 || st.x > st.ride.x + st.ride.w + 8) st.ride = null;
        }

        const prevY = st.y;
        const prevX = st.x;
        const grav = Math.abs(st.vy) < 90 && !st.grounded ? 950 : 1500;
        st.vy += grav * dt;
        st.x += st.vx * dt;
        st.y += st.vy * dt;
        st.x = Math.max(10, Math.min(sr.width - 10, st.x));
        for (let wi = 0; wi < walls.length; wi++) {
          const w = walls[wi];
          if (st.y > w.top + 8 && st.y - 26 < w.bottom) {
            if (prevX <= w.left - 7 && st.x > w.left - 7) st.x = w.left - 7;
            else if (prevX >= w.right + 7 && st.x < w.right + 7) st.x = w.right + 7;
          }
        }
        const vyImpact = st.vy;
        st.wasGrounded = st.grounded;
        st.grounded = false;
        if (st.vy >= 0 && !keys.ArrowDown) {
          for (let i = 0; i < plats.length; i++) {
            const p = plats[i];
            if (prevY <= p.y + (p.mover ? 9 : 1) && st.y >= p.y && st.x > p.x - 3 && st.x < p.x + p.w + 3) {
              st.y = p.y;
              st.vy = 0;
              st.grounded = true;
              st.jumps = 0;
              st.ride = p.mover ? p : null;
              break;
            }
          }
        }
        if (!st.grounded && st.y >= groundY) {
          st.y = groundY;
          st.vy = 0;
          st.grounded = true;
          st.jumps = 0;
          st.ride = null;
        }
        if (st.grounded && !st.wasGrounded && vyImpact > 260) {
          st.sq = -0.26;
          st.sqv = 0;
          spawnDust(st.x, st.y, 5, false, false);
          snd.land();
        }

        st.dustT -= dt;
        if (st.grounded && Math.abs(st.vx) > 140 && st.dustT <= 0) {
          st.dustT = 0.13;
          spawnDust(st.x - st.face * 6, st.y, 1, false, false);
        }

        st.sqv += -st.sq * 320 * dt;
        st.sqv *= Math.exp(-9 * dt);
        st.sq += st.sqv * dt;

        fxc.clearRect(0, 0, fx.width, fx.height);
        fxc.fillStyle = '#cfccc4';
        for (let mi = 0; mi < movers.length; mi++) {
          const m = movers[mi];
          for (let k = 0; k < 6; k++) {
            fxc.beginPath();
            fxc.arc(m.x + 8 + k * ((m.w - 16) / 5), m.y + 4, 3.2, 0, 6.2832);
            fxc.fill();
          }
        }
        for (let ci = 0; ci < picks.length; ci++) {
          const c = picks[ci];
          if (c.got) continue;
          const pu = 1 + 0.22 * Math.sin(tg * 3.2 + c.x * 0.05);
          /* Dark die-cut rim first, so the dot stays visible over the light
             glyphs; then a glowing mint core and a soft halo. */
          fxc.globalAlpha = 0.62;
          fxc.fillStyle = '#0a0a0b';
          fxc.beginPath();
          fxc.arc(c.x, c.y, 8.6 * pu, 0, 6.2832);
          fxc.fill();
          fxc.globalAlpha = 1;
          fxc.fillStyle = '#9bcfa5';
          fxc.shadowColor = '#9bcfa5';
          fxc.shadowBlur = 16;
          fxc.beginPath();
          fxc.arc(c.x, c.y, 6 * pu, 0, 6.2832);
          fxc.fill();
          fxc.shadowBlur = 0;
          fxc.globalAlpha = 0.26;
          fxc.beginPath();
          fxc.arc(c.x, c.y, 13.5 * pu, 0, 6.2832);
          fxc.fill();
        }
        fxc.globalAlpha = 1;
        for (let ci = 0; ci < picks.length; ci++) {
          const c = picks[ci];
          if (c.got || st.grounded) continue;
          const ddx = st.x - c.x;
          const ddy = (st.y - 16) - c.y;
          if (ddx * ddx + ddy * ddy < 560) {
            c.got = true;
            st.lit++;
            onCollect(c);
          }
        }
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          p.age += dt;
          if (p.age >= p.life) { parts.splice(i, 1); continue; }
          p.vy += 420 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          const a = 1 - p.age / p.life;
          fxc.globalAlpha = a * 0.9;
          fxc.fillStyle = p.green ? '#9bcfa5' : '#cfccc4';
          fxc.beginPath();
          fxc.arc(p.x, p.y, p.r * (0.6 + a * 0.4), 0, 6.2832);
          fxc.fill();
        }
        fxc.globalAlpha = 1;

        st.anim += Math.abs(st.vx) * dt;
        const frame = !st.grounded ? 'jump' : (Math.abs(st.vx) > 20 ? (Math.floor(st.anim / 26) % 2 ? 'run1' : 'run2') : 'run2');
        drawRunner(frame, Math.max(0, 1 - (t - st.t0) / 0.8));
        const sx = st.face * (1 - st.sq * 0.55);
        const sy = 1 + st.sq;
        rc.style.transform = 'translate(' + (st.x - 12) + 'px,' + (st.y - 36) + 'px) scale(' + sx + ',' + sy + ')';
      };

      const endGame = () => {
        if (!game) return;
        game = null;
        cancelAnimationFrame(rafG);
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('keyup', onKey);
        window.removeEventListener('resize', onResize);
        gsap.to([layer, hud], {
          opacity: 0, duration: 0.35,
          onComplete: () => { layer.remove(); hud.remove(); }
        });
        docEl.classList.remove('gaming');
        if (lenis) lenis.start();
        if (portraitFX.render) portraitFX.render();
        if (eggLine) eggLine.style.pointerEvents = 'auto';
      };

      window.addEventListener('keydown', onKey);
      window.addEventListener('keyup', onKey);
      window.addEventListener('resize', onResize);
      game = { end: endGame };
      rafG = requestAnimationFrame((n) => { last = n; loop(n); });
    };
  }

  /* `wideScreen` was read once at parse time while the CSS media queries stay
     live, so rotating a tablet from landscape to portrait left the desktop
     pinned layout — docked portrait and all — running at phone width. The
     class and the pinned trigger now stand down together when the query does. */
  const wideMQ = matchMedia('(min-width: 901px)');
  const standDownPin = () => {
    if (wideMQ.matches) return;
    ScrollTrigger.getById('identityPin')?.kill(true);
    docEl.classList.remove('pin', 'about-active', 'meta-off');
    gsap.set('#portraitWrap', { clearProps: 'transform,opacity' });
    ScrollTrigger.refresh();
  };
  if (wideMQ.addEventListener) wideMQ.addEventListener('change', standDownPin);
  else wideMQ.addListener?.(standDownPin);

  if (wideScreen) {
    docEl.classList.add('pin');
    gsap.set(wrap, { transformOrigin: '50% 50%' });

    const dock = { x: 0, y: 0, s: 0.8 };
    const measure = () => {
      if (typeof placeNiche === 'function') placeNiche();
      const prevY = gsap.getProperty(wrap, 'y');
      gsap.set(wrap, { clearProps: 'transform' });
      const a = wrap.getBoundingClientRect();
      const b = slot.getBoundingClientRect();
      dock.s = b.height / a.height;
      dock.x = (b.left + b.width / 2) - (a.left + a.width / 2);
      dock.y = (b.top + b.height / 2) - (a.top + a.height / 2);
      if (!started) gsap.set(wrap, { y: prevY });
    };
    ScrollTrigger.addEventListener('refreshInit', measure);

    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        id: 'identityPin',
        trigger: pinEl,
        start: 'top top',
        end: '+=140%',
        pin: true,
        scrub: SCRUB_UI,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          docEl.classList.toggle('about-active', self.progress > 0.45);
          docEl.classList.toggle('meta-off', self.progress > 0.1);
        }
      }
    })
      .to('#aboutPanel', { opacity: 1, duration: 0.24, ease: 'power1.inOut' }, 0.14)
      .to('#nmStack', { xPercent: 16, opacity: 0.06, ease: 'power1.inOut', duration: 0.5 }, 0)
      .to(heroMeta, { autoAlpha: 0, y: -50, ease: 'power1.in', duration: 0.26 }, 0)
      .to('#halo', { opacity: 0.4, duration: 0.5 }, 0)
      .fromTo(wrap, { x: 0, y: 0, scale: 1 }, {
        x: () => dock.x,
        y: () => dock.y,
        scale: () => dock.s,
        ease: 'power2.inOut',
        duration: 0.5,
        immediateRender: false
      }, 0.05)
      .to('#figFrame', { opacity: 1, duration: 0.12, ease: 'power1.out' }, 0.45)
      .to('#figTag', { opacity: 1, duration: 0.1 }, 0.52)
      .to(portraitFX.dev, { v: 1, duration: 0.22, ease: 'power1.inOut' }, 0.42)
      .to(portraitFX.bg, { v: 1, duration: 0.2, ease: 'power1.inOut' }, 0.6)
      .to(portraitFX.ph, { v: 1, duration: 0.16, ease: 'power1.inOut' }, 0.78)
      .fromTo('#aboutPanel [data-reveal]',
        { opacity: 0, y: 44 },
        { opacity: 1, y: 0, stagger: 0.05, duration: 0.3, ease: 'power2.out' },
        0.4);
  } else {
    gsap.to('#heroName', {
      yPercent: -7,
      ease: 'none',
      scrollTrigger: { trigger: '#heroStage', start: 'top top', end: 'bottom top', scrub: SCRUB_BG }
    });
    gsap.to(wrap, {
      yPercent: 10,
      ease: 'none',
      scrollTrigger: { trigger: '#heroStage', start: 'top top', end: 'bottom top', scrub: SCRUB_BG }
    });
  }

  const pinned = docEl.classList.contains('pin');
  const reveals = gsap.utils.toArray('[data-reveal]').filter((el) =>
    (!pinned || !el.closest('#aboutPanel')) &&
    !el.classList.contains('sys-row') &&
    !el.classList.contains('rec-row'));
  ScrollTrigger.batch(reveals, {
    start: 'top 88%',
    once: true,
    onEnter: (els) => {
      gsap.fromTo(els,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.95, stagger: 0.08, ease: 'power3.out' });
      els.forEach((el) => {
        el.classList.add('drawn');
        if (el.classList.contains('work-row')) {
          gsap.fromTo(el.querySelectorAll('.work-spec div'),
            { clipPath: 'inset(0 100% 0 0)' },
            { clipPath: 'inset(0 -2% 0 0)', stagger: 0.09, duration: 0.7, ease: 'power2.out', delay: 0.3 });
        }
      });
    }
  });

  /* The six rules are introduced rather than faded in: the divider draws
     across the row, the dotted glyph assembles dot by dot the way the project
     sigils do, then the number and the copy arrive behind it.

     The initial state is set here, inside the block that only runs when motion
     is allowed and GSAP is present — so a reduced-motion visitor, or one whose
     script never loads, is never left looking at hidden content. */
  gsap.utils.toArray('.pr-item').forEach((item) => {
    const rule = item.querySelector('.pr-rule');
    const dots = item.querySelectorAll('.pr-glyph circle');
    const no = item.querySelector('.pr-no');
    const body = item.querySelector('.pr-body');
    const eg = item.querySelector('.pr-eg');

    gsap.set(item, { opacity: 0 });
    gsap.set(dots, { scale: 0, opacity: 0, transformOrigin: '50% 50%' });
    gsap.set([no, body, eg].filter(Boolean), { y: 16, opacity: 0 });

    gsap.timeline({ scrollTrigger: { trigger: item, start: 'top 86%', once: true } })
      .to(item, { opacity: 1, duration: 0.3, ease: 'power1.out' })
      .to(rule, { scaleX: 1, opacity: 1, duration: 0.75, ease: 'power3.inOut' }, 0)
      .to(dots, { scale: 1, opacity: 1, duration: 0.5, stagger: { each: 0.018, from: 'random' }, ease: 'back.out(2.4)' }, 0.14)
      .to(body, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, 0.2)
      .to(no, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, 0.34)
      .to(eg ? eg : {}, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, 0.4)
      /* Settle the rule back to the hairline once it has finished drawing. */
      .to(rule, { opacity: 0.28, duration: 0.5, ease: 'power2.out' }, 0.8);
  });

  ScrollTrigger.batch('.sys-row', {
    start: 'top 88%',
    once: true,
    onEnter: (els) => gsap.fromTo(els,
      { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
      { opacity: 1, clipPath: 'inset(0 -2% 0 0)', stagger: 0.12, duration: 0.9, ease: 'power2.inOut' })
  });

  gsap.utils.toArray('.rec-row').forEach((row) => {
    gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 86%', once: true } })
      .fromTo(row, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power1.out' })
      .fromTo(row.querySelector('.rec-date'), { x: -26, opacity: 0 }, { x: 0, opacity: 1, duration: 0.85, ease: 'power3.out' }, 0.05)
      .fromTo(row.querySelector('.rec-body'), { x: 26, opacity: 0 }, { x: 0, opacity: 1, duration: 0.85, ease: 'power3.out' }, 0.15);
  });

  gsap.utils.toArray('.sec-title .line-shift').forEach((l) => {
    gsap.fromTo(l, { yPercent: 11 }, {
      yPercent: -8,
      ease: 'none',
      scrollTrigger: { trigger: l.closest('.sec-head'), start: 'top bottom', end: 'bottom top', scrub: SCRUB_BG }
    });
  });

  /* The pipeline statement: the rail draws itself across the scene, each stage
     comes online in its production state (spec outline -> assembled source ->
     shipped glow), and the rail's far end ignites once Ship lands. */
  const pipelineScene = document.querySelector('.scene-statement');
  if (pipelineScene && pipelineScene.querySelector('.pipe-rail')) {
    const stl = gsap.timeline({
      scrollTrigger: { trigger: pipelineScene, start: 'top 76%', end: 'center 32%', scrub: SCRUB_UI, invalidateOnRefresh: true }
    });
    stl
      .fromTo('.pipe-rail', { clipPath: 'inset(-8px 100% -8px 0)' }, { clipPath: 'inset(-8px 0% -8px 0)', duration: 3, ease: 'none' }, 0)
      .fromTo('.pipe-spark', { x: 0, opacity: 0 }, { opacity: 1, duration: 0.18, ease: 'none' }, 0)
      .to('.pipe-spark', { x: () => (pipelineScene.querySelector('.pipe-rail')?.offsetWidth || 0), duration: 3, ease: 'none' }, 0)
      .fromTo('.st-design', { opacity: 0 }, { opacity: 1, duration: 0.1, ease: 'none' }, 0.32)
      .fromTo('.st-design .st-word', { clipPath: 'inset(-10% 104% -12% -4%)' }, { clipPath: 'inset(-10% -4% -12% -4%)', duration: 0.85, ease: 'power1.inOut' }, 0.32)
      .fromTo('.st-design .st-tag', { opacity: 0, y: 9 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.95)
      .fromTo('.st-build', { opacity: 0 }, { opacity: 1, duration: 0.1, ease: 'none' }, 1.22)
      .fromTo('.st-build .st-word', { clipPath: 'inset(102% 0 -12% 0)' }, { clipPath: 'inset(-10% 0 -12% 0)', duration: 0.85, ease: 'power1.inOut' }, 1.22)
      .fromTo('.st-build .st-tag', { opacity: 0, y: 9 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 1.85)
      .fromTo('.st-ship', { opacity: 0, x: -30, scale: 0.94 }, { opacity: 1, x: 0, scale: 1, duration: 0.9, ease: 'power2.out' }, 2.05)
      .fromTo('.st-ship .st-tag', { opacity: 0, y: 9 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 2.6)
      .fromTo('.pipe-glow', { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power1.in' }, 2.55)
      .to('.pipe-spark', { scale: 1.8, duration: 0.5, ease: 'power1.inOut' }, 2.55)
      .fromTo('.st-close .st-serif', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 2.75);
  }

  if (!panelScreen) {
    gsap.utils.toArray('.work-media').forEach((m) => {
      gsap.fromTo(m,
        { rotationX: 16, transformPerspective: 900, y: 36, opacity: 0 },
        {
          rotationX: 0, y: 0, opacity: 1, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: m, start: 'top 88%', once: true }
        });
    });
  }

  const shaderCanvas = document.getElementById('contactShader');
  if (shaderCanvas) {
    const gl = shaderCanvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) {
      shaderCanvas.remove();
    } else {
      const compile = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
      };
      const vs = compile(gl.VERTEX_SHADER,
        'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}');
      const fs = compile(gl.FRAGMENT_SHADER,
        'precision highp float;uniform vec2 resolution;uniform float time;' +
        'void main(void){' +
        'vec2 uv=(gl_FragCoord.xy*2.0-resolution.xy)/min(resolution.x,resolution.y);' +
        'float t=time*0.05;float lw=0.002;vec3 c=vec3(0.0);' +
        'for(int j=0;j<3;j++){for(int i=0;i<5;i++){' +
        'c[j]+=lw*float(i*i)/abs(fract(t-0.01*float(j)+float(i)*0.01)*5.0-length(uv)+mod(uv.x+uv.y,0.2));}}' +
        'vec3 tinted=c.r*vec3(0.82,0.80,0.74)+c.g*vec3(0.52,0.76,0.58)+c.b*vec3(0.28,0.36,0.31);' +
        'gl_FragColor=vec4(tinted*0.55,1.0);}');
      if (!vs || !fs) {
        shaderCanvas.remove();
      } else {
        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        gl.useProgram(prog);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, 'p');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        const uRes = gl.getUniformLocation(prog, 'resolution');
        const uTime = gl.getUniformLocation(prog, 'time');
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        let raf = null;
        let t = 1;
        const resizeShader = () => {
          const w = Math.round(shaderCanvas.clientWidth * dpr);
          const h = Math.round(shaderCanvas.clientHeight * dpr);
          if (shaderCanvas.width !== w || shaderCanvas.height !== h) {
            shaderCanvas.width = w;
            shaderCanvas.height = h;
            gl.viewport(0, 0, w, h);
            gl.uniform2f(uRes, w, h);
          }
        };
        const frame = () => {
          raf = requestAnimationFrame(frame);
          t += 0.05;
          gl.uniform1f(uTime, t);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
        new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            resizeShader();
            if (!raf) frame();
          } else if (raf) {
            cancelAnimationFrame(raf);
            raf = null;
          }
        }, { rootMargin: '120px' }).observe(shaderCanvas);
        window.addEventListener('resize', resizeShader);
      }
    }
  }

  gsap.utils.toArray('.sec-ghost').forEach((g) => {
    gsap.fromTo(g, { yPercent: 24 }, {
      yPercent: -18,
      ease: 'none',
      scrollTrigger: { trigger: g.closest('.sec-head'), start: 'top bottom', end: 'bottom top', scrub: SCRUB_BG }
    });
  });

  gsap.utils.toArray('.sec-title').forEach((t) => {
    gsap.to(t.querySelectorAll('.line-in'), {
      y: 0,
      duration: 1.15,
      ease: 'expo.out',
      stagger: 0.14,
      scrollTrigger: { trigger: t, start: 'top 86%', once: true }
    });
  });

  /* Work-head rail: draws itself once the title has risen, tag prints after. */
  const secRail = document.querySelector('.sec-rail');
  if (secRail) {
    gsap.timeline({ scrollTrigger: { trigger: secRail.closest('.sec-head'), start: 'top 74%', once: true } })
      .fromTo(secRail, { clipPath: 'inset(-8px 100% -8px 0)' }, { clipPath: 'inset(-8px 0% -8px 0)', duration: 1.1, ease: 'power2.inOut' }, 0.35)
      .fromTo('.sec-tag', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, 1.1);
  }

  if (document.querySelector('.contact-mail') && document.querySelector('.scene-contact')) {
    gsap.fromTo('.contact-mail',
      { opacity: 0, y: 34 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: '.scene-contact', start: 'top 62%', once: true } });
  }
  if (document.querySelector('.contact-ghost') && document.querySelector('.scene-contact')) {
    gsap.fromTo('.contact-ghost',
      { opacity: 0, yPercent: 26 },
      { opacity: 1, yPercent: 0, duration: 1.6, ease: 'power3.out',
        scrollTrigger: { trigger: '.scene-contact', start: 'top 45%', once: true } });
  }

  const prFill = document.getElementById('prFill');
  const prLabel = document.getElementById('prLabel');
  let prSwap = null;
  if (prFill && prLabel) {
    gsap.to(prFill, {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: SCRUB_UI }
    });
    [['#identity', '00 / IDENTITY'], ['#work', '01 / WORK'], ['#skills', '02 / SKILLS'], ['#education', '03 / EDUCATION'], ['#experience', '04 / EXPERIENCE'], ['#contact', '05 / CONTACT']].forEach(([sel, txt]) => {
      ScrollTrigger.create({
        trigger: sel,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          /* Swap the wording while it is faded out, so the label changes
             without a hard cut. The box is a fixed size, so nothing moves. */
          if (!self.isActive || prLabel.textContent === txt) return;
          const rail = prLabel.closest('.progress-rail');
          if (!rail || reduced) { prLabel.textContent = txt; return; }
          rail.classList.add('is-turning');
          clearTimeout(prSwap);
          prSwap = setTimeout(() => {
            prLabel.textContent = txt;
            rail.classList.remove('is-turning');
          }, 280);
        }
      });
    });
  }

  const workRows = gsap.utils.toArray('.work-row');
  if (panelScreen && workRows.length && document.getElementById('workPanel') && document.querySelector('.wp-item')) {
    const items = gsap.utils.toArray('.wp-item');
    const ticks = gsap.utils.toArray('.wp-ticks i');
    const wpIndex = document.getElementById('wpIndex');
    const wpName = document.getElementById('wpName');
    const wpSigilHold = document.getElementById('wpSigil');
    const panelSigils = {};
    let panelSigilLive = null;
    let panelOn = true;
    if (wpSigilHold && 'IntersectionObserver' in window) {
      new IntersectionObserver((en) => {
        panelOn = en[0].isIntersecting;
        if (panelSigilLive) { if (panelOn) panelSigilLive.idle(); else panelSigilLive.stop(); }
      }, { rootMargin: '80px' }).observe(wpSigilHold);
    }
    const setPanelSigil = (i) => {
      if (!wpSigilHold) return;
      const name = SIGIL_ROWS[i];
      if (panelSigilLive) panelSigilLive.stop();
      while (wpSigilHold.firstChild) wpSigilHold.removeChild(wpSigilHold.firstChild);
      panelSigilLive = null;
      if (!name) return;
      if (!(name in panelSigils)) panelSigils[name] = makeSigil(name, 26, SIGIL_PAL.panel);
      panelSigilLive = panelSigils[name];
      if (panelSigilLive) {
        wpSigilHold.appendChild(panelSigilLive.canvas);
        if (panelOn) panelSigilLive.play();
        else panelSigilLive.settle();
      }
    };
    let current = 0;
    let hovering = false;

    const setActive = (i) => {
      if (i === current && items[i].classList.contains('is-active')) return;
      current = i;
      items.forEach((el, j) => el.classList.toggle('is-active', j === i));
      workRows.forEach((el, j) => el.classList.toggle('is-current', j === i));
      ticks.forEach((el, j) => el.classList.toggle('on', j === i));
      wpIndex.textContent = String(i + 1).padStart(2, '0');
      const name = workRows[i].querySelector('.work-name');
      wpName.textContent = name ? name.textContent.toUpperCase() : '';
      setPanelSigil(i);
    };
    setActive(0);
    setPanelSigil(0);

    gsap.set('#workPanel', { transformPerspective: 1100, transformOrigin: '50% 18%' });
    gsap.fromTo('#workPanel',
      { rotationX: 17, scale: 0.94, y: 48 },
      {
        rotationX: 0, scale: 1, y: 0,
        ease: 'none',
        scrollTrigger: { trigger: '.scene-work', start: 'top 85%', end: 'top 5%', scrub: SCRUB_UI }
      });

    const list = document.getElementById('workList');
    list.addEventListener('pointerleave', () => { hovering = false; });
    workRows.forEach((row, i) => {
      row.addEventListener('pointerenter', () => { hovering = true; setActive(i); });
    });
    ScrollTrigger.create({
      trigger: list,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: () => {
        if (hovering && !document.querySelector('.work-row:hover')) hovering = false;
        if (hovering) return;
        const mid = window.innerHeight * 0.5;
        let best = 0;
        let bestDist = Infinity;
        workRows.forEach((row, i) => {
          const r = row.getBoundingClientRect();
          const d = Math.abs((r.top + r.bottom) / 2 - mid);
          if (d < bestDist) { bestDist = d; best = i; }
        });
        setActive(best);
      }
    });
  }

  if (false && finePointer) {
    const cursor = document.getElementById('cursor');
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    const label = document.getElementById('cursorLabel');
    gsap.set(cursor, { autoAlpha: 0 });
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power2.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power2.out' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });
    let cursorShown = false;
    window.addEventListener('pointermove', (e) => {
      if (!cursorShown) {
        cursorShown = true;
        docEl.classList.add('cur');
        gsap.to(cursor, { autoAlpha: 1, duration: 0.3 });
      }
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
    }, { passive: true });
    const sigilHold = document.getElementById('cursorSigil');
    const cursorSigils = {};
    let curSigilName = null;
    let curSigilLive = null;
    document.addEventListener('mouseover', (e) => {
      const view = e.target.closest('[data-cursor]');
      const interactive = e.target.closest('a, button');
      docEl.classList.toggle('cur-view', !!view);
      docEl.classList.toggle('cur-hover', !view && !!interactive);
      if (view) label.textContent = view.dataset.cursor;
      const sigEl = e.target.closest('[data-cursor-sigil]');
      const name = sigEl && sigilHold ? sigEl.dataset.cursorSigil : null;
      if (name !== curSigilName) {
        curSigilName = name;
        if (curSigilLive) curSigilLive.stop();
        while (sigilHold.firstChild) sigilHold.removeChild(sigilHold.firstChild);
        curSigilLive = null;
        if (name) {
          if (!(name in cursorSigils)) cursorSigils[name] = makeSigil(name, 62, SIGIL_PAL.cursor);
          curSigilLive = cursorSigils[name];
          if (curSigilLive) {
            sigilHold.appendChild(curSigilLive.canvas);
            curSigilLive.play();
          }
        }
      }
      docEl.classList.toggle('cur-sigil', !!(name && curSigilLive));
    });

    document.querySelectorAll('.magnetic').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
      const my = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const f = r.width > 300 ? 0.12 : 0.28;
        mx((e.clientX - (r.left + r.width / 2)) * f);
        my((e.clientY - (r.top + r.height / 2)) * f);
      });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }
})();

/* ===== Mobile menu — standalone so it works even with reduced motion / no GSAP ===== */
(() => {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mobileNav');
  if (!toggle || !nav) return;
  const docEl = document.documentElement;
  const label = toggle.querySelector('.nav-toggle-label');
  const links = Array.from(nav.querySelectorAll('a'));
  const focusables = [toggle].concat(links);
  let open = false;

  const setOpen = (state) => {
    if (state === open) return;
    open = state;
    docEl.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (label) label.textContent = open ? 'Close' : 'Menu';
    nav.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) nav.removeAttribute('inert'); else nav.setAttribute('inert', '');
    /* The overlay covers the page but never took it out of the tab order, so
       Tab walked straight off the menu and into the page behind it. */
    [document.querySelector('main'), document.querySelector('.site-foot'), document.getElementById('projectTheater')]
      .forEach((region) => { if (region) region.inert = open; });
    if (window.lenis) { if (open) window.lenis.stop(); else window.lenis.start(); }
    if (open) {
      setTimeout(() => { if (open) (links[0] || nav).focus({ preventScroll: true }); }, 90);
    } else {
      toggle.focus({ preventScroll: true });
    }
  };

  /* Index each item so the stagger scales with the list. */
  nav.querySelectorAll('.mnav-list li').forEach((item, i) => item.style.setProperty('--i', String(i)));

  toggle.addEventListener('click', () => setOpen(!open));

  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
    if (e.key === 'Tab' && focusables.length) {
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      setOpen(false);
      if (href && href.charAt(0) === '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          requestAnimationFrame(() => {
            if (window.lenis) window.lenis.scrollTo(target, { duration: 1.2 });
            else target.scrollIntoView({ behavior: 'smooth' });
            target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
          });
        }
      }
    });
  });

  const mq = matchMedia('(min-width: 761px)');
  const onChange = () => { if (mq.matches && open) setOpen(false); };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);
})();
