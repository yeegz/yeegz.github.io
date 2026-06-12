(() => {
  const docEl = document.documentElement;
  docEl.classList.add('booted');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const wideScreen = matchMedia('(min-width: 901px)').matches;
  const panelScreen = matchMedia('(min-width: 1025px)').matches;

  const nmFirst = document.getElementById('nmFirst');
  const nmLast = document.getElementById('nmLast');
  const nmStack = document.getElementById('nmStack');
  const portraitWrapEl = document.getElementById('portraitWrap');
  const placeNiche = () => {
    if (!portraitWrapEl || !nmStack || !nmFirst) return;
    const nmPx = parseFloat(getComputedStyle(nmFirst).fontSize);
    const left = nmStack.offsetLeft + nmFirst.offsetWidth - nmPx * 0.18;
    portraitWrapEl.style.left = left + 'px';
  };
  const fitNames = () => {
    if (!nmFirst || !nmLast) return;
    nmLast.style.fontSize = '';
    const w1 = nmFirst.offsetWidth;
    const w2 = nmLast.offsetWidth;
    if (!w1 || !w2) return;
    const nmPx = parseFloat(getComputedStyle(nmFirst).fontSize);
    const size = parseFloat(getComputedStyle(nmLast).fontSize) * ((w1 + nmPx * 1.82) / w2);
    nmLast.style.fontSize = size + 'px';
    placeNiche();
  };
  fitNames();
  let fitTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(() => {
      fitNames();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }, 150);
  });

  const copyBtn = document.getElementById('copyMail');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText('yousofselim2@gmail.com');
        copyBtn.textContent = 'COPIED';
        copyBtn.classList.add('did');
        setTimeout(() => { copyBtn.textContent = 'COPY'; copyBtn.classList.remove('did'); }, 1600);
      } catch (err) {
        window.location.href = 'mailto:yousofselim2@gmail.com';
      }
    });
  }

  const timeEl = document.getElementById('localTime');
  if (timeEl) {
    const tickClock = () => {
      timeEl.textContent = new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kuala_Lumpur'
      });
    };
    tickClock();
    setInterval(tickClock, 30000);
  }

  if (reduced || !window.gsap || !window.ScrollTrigger) {
    docEl.classList.add('reduced');
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNames);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
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
  const entrance = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  entrance
    .to('#halo', { opacity: 1, duration: 1.6, ease: 'power2.out' }, 0)
    .to('.nm-in', { y: 0, duration: 1.3, ease: 'expo.out', stagger: 0.13 }, 0.15)
    .to('#nmGround', { scaleX: 1, duration: 1.4, ease: 'power2.inOut' }, 0.5)
    .fromTo('#portrait',
      { filter: 'blur(10px) ' + portraitFilter },
      { filter: 'blur(0px) ' + portraitFilter, duration: 1.3, clearProps: 'filter' },
      0.75)
    .to(wrap, { opacity: 1, y: 0, duration: 1.3, ease: 'power3.out' }, 0.75)
    .to('#identityPin [data-load]', { opacity: 1, y: 0, duration: 0.9, stagger: 0.09 }, 1.2)
    .from('.site-head', { opacity: 0, y: -14, duration: 0.8 }, 1.25);

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
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      start();
      fitNames();
      ScrollTrigger.refresh();
    });
  }
  setTimeout(start, 1300);

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
      ['Software Engineering Student', ['Flutter ', { em: '&' }, ' Full-Stack ', { em: 'Developer' }]],
      ['Mobile', ['Flutter, Dart ', { em: '&' }, ' React Native']],
      ['Backend & Data', ['Node.js, Supabase ', { em: '&' }, ' Firebase']],
      ['Frontend', ['TypeScript, Tailwind ', { em: '&' }, ' responsive UI']],
      ['Game Systems', ['Godot Engine ', { em: '&' }, ' GDScript']]
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
    const splitChars = (el) => {
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
    setInterval(() => {
      if (!heroVisible || document.hidden || swapping) return;
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

  const nameDots = document.getElementById('nameDots');
  if (nameDots) {
    const nctx = nameDots.getContext('2d');
    const NW = nameDots.width;
    const NH = nameDots.height;
    const NCELL = 5;
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
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        setA = sampleText('يوسف سليم', '500 40px "Geeza Pro", "Arial", sans-serif');
        setB = sampleText('YOUSOF SELIM', '500 34px "JetBrains Mono", monospace');
      });
    }
    let namePhase = 0;
    let nameDir = 1;
    let nameHold = 2.6;
    let nameLast = performance.now();
    const drawSet = (set, vis) => {
      for (let i = 0; i < set.length; i++) {
        const p = set[i];
        const v = Math.min(1, Math.max(0, (vis - p.h) * 2.8));
        if (v < 0.05) continue;
        nctx.globalAlpha = v;
        nctx.beginPath();
        nctx.arc(p.x, p.y, NCELL * 0.42 * (0.4 + v * 0.6), 0, 6.2832);
        nctx.fill();
      }
    };
    const nameTick = (now) => {
      requestAnimationFrame(nameTick);
      const dt = Math.min(0.05, (now - nameLast) / 1000);
      nameLast = now;
      if (!heroVisible || document.hidden) return;
      if (nameHold > 0) {
        nameHold -= dt;
      } else {
        namePhase += nameDir * dt / 1.1;
        if (namePhase >= 1) { namePhase = 1; nameDir = -1; nameHold = 3.4; }
        if (namePhase <= 0) { namePhase = 0; nameDir = 1; nameHold = 3.4; }
      }
      nctx.clearRect(0, 0, NW, NH);
      nctx.fillStyle = '#f2efe9';
      drawSet(setA, 1 - namePhase);
      drawSet(setB, namePhase);
      nctx.globalAlpha = 1;
    };
    requestAnimationFrame(nameTick);
  }

  const portraitImgEl = document.getElementById('portrait');
  if (portraitImgEl && wrap) {
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

      let photoReady = false;
      const photoImg = new Image();
      photoImg.src = 'images/yousof-photo.png';
      photoImg.decode().then(() => { photoReady = true; }).catch(() => {});

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
            rC = 201; gC = 238; bC = 209;
          } else {
            rC = 242 - 87 * g; gC = 239 - 32 * g; bC = 233 - 68 * g;
          }
          if (dq > 0) {
            rC += (d.c0 - rC) * dq;
            gC += (d.c1 - gC) * dq;
            bC += (d.c2 - bC) * dq;
            const edge = Math.sin(Math.PI * dq) * 0.55;
            if (edge > 0.04) {
              rC += (155 - rC) * edge;
              gC += (207 - gC) * edge;
              bC += (165 - bC) * edge;
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
    nmLast.setAttribute('role', 'button');
    nmLast.setAttribute('tabindex', '0');
    nmLast.setAttribute('aria-label', 'Hidden mini game: press three times to explore the name');
    nmLast.dataset.cursor = 'PRESS ×3';

    const FACTS = [
      'FLUTTER & DART', 'TYPESCRIPT & JS', 'PYTHON & SQL',
      'SUPABASE · POSTGRES', 'FIREBASE · FIRESTORE', 'NODE.JS & REST APIS',
      'FREELANCE — FEB 2023', '4 CLIENT APPS SHIPPED', "BSC '27 — SUNWAY × LANCASTER",
      'NOW BUILDING BUPPLES', 'EN / AR — SUBANG JAYA'
    ];
    const BONUS = ['TAJWEED — UI/UX REDESIGN', 'TASK MANAGER — DRAG & DROP', 'FALLEN ASTERI — GODOT'];
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
      if (e.button === 0) press();
    });
    nmLast.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); press(); }
    });

    const startGame = () => {
      if (game) return;
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
          picks.push({
            x: p.x + p.w / 2,
            y: p.y - 44,
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
      plateRows.forEach((row, i) => {
        const r = row.getBoundingClientRect();
        if (r.width < 40) return;
        const py = r.top - sr.top;
        plats.push({ x: r.left - sr.left, w: r.width, y: py, dx: 0, dy: 0, mover: false });
        if (plateTop === null || py < plateTop) plateTop = py;
        plateLeft = r.left - sr.left;
      });
      if (plateTop !== null) {
        picks.push({ x: plateLeft + 120, y: plateTop - 48, fact: BONUS[1], plat: null, got: false });
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
          fxc.fillStyle = '#9bcfa5';
          fxc.globalAlpha = 0.95;
          fxc.beginPath();
          fxc.arc(c.x, c.y, 4.4 * pu, 0, 6.2832);
          fxc.fill();
          fxc.globalAlpha = 0.22;
          fxc.beginPath();
          fxc.arc(c.x, c.y, 9.5 * pu, 0, 6.2832);
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
        trigger: pinEl,
        start: 'top top',
        end: '+=205%',
        pin: true,
        scrub: 1.2,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          docEl.classList.toggle('about-active', self.progress > 0.45);
          docEl.classList.toggle('meta-off', self.progress > 0.1);
        }
      }
    })
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
      scrollTrigger: { trigger: '#heroStage', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to(wrap, {
      yPercent: 10,
      ease: 'none',
      scrollTrigger: { trigger: '#heroStage', start: 'top top', end: 'bottom top', scrub: true }
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
      scrollTrigger: { trigger: l.closest('.sec-head'), start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  if (document.getElementById('lampLine')) {
    gsap.timeline({
      scrollTrigger: { trigger: '.scene-statement', start: 'top 72%', once: true }
    })
      .fromTo('#lampLine', { scaleX: 0.25, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 1.15, ease: 'power3.out' })
      .fromTo('#lampGlow', { scaleX: 0.3, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 1.3, ease: 'power3.out' }, 0.05)
      .fromTo('.lamp-beam', { opacity: 0 }, { opacity: 1, duration: 1.3, ease: 'power2.out' }, 0.2);
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

  const stWords = gsap.utils.toArray('.st-w');
  if (stWords.length) {
    const stl = gsap.timeline({
      scrollTrigger: { trigger: '.scene-statement', start: 'top 78%', end: 'center 38%', scrub: 1 }
    });
    stWords.forEach((w) => {
      stl.to(w, {
        color: w.classList.contains('st-accent') ? '#9bcfa5' : '#f2efe9',
        duration: 1,
        ease: 'none'
      }, '<55%');
    });
  }

  gsap.utils.toArray('.sec-ghost').forEach((g) => {
    gsap.fromTo(g, { yPercent: 24 }, {
      yPercent: -18,
      ease: 'none',
      scrollTrigger: { trigger: g.closest('.sec-head'), start: 'top bottom', end: 'bottom top', scrub: true }
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

  gsap.fromTo('.contact-mail',
    { opacity: 0, y: 34 },
    { opacity: 1, y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '.scene-contact', start: 'top 62%', once: true } });
  gsap.fromTo('.contact-ghost',
    { opacity: 0, yPercent: 26 },
    { opacity: 1, yPercent: 0, duration: 1.6, ease: 'power3.out',
      scrollTrigger: { trigger: '.scene-contact', start: 'top 45%', once: true } });

  const prFill = document.getElementById('prFill');
  const prLabel = document.getElementById('prLabel');
  if (prFill && prLabel) {
    gsap.to(prFill, {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.4 }
    });
    [['#identity', '00 / IDENTITY'], ['#work', '01 / WORK'], ['#stack', '02 / STACK'], ['#record', '03 / RECORD'], ['#contact', '04 / CONTACT']].forEach(([sel, txt]) => {
      ScrollTrigger.create({
        trigger: sel,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => { if (self.isActive) prLabel.textContent = txt; }
      });
    });
  }

  const workRows = gsap.utils.toArray('.work-row');
  if (panelScreen && workRows.length) {
    const items = gsap.utils.toArray('.wp-item');
    const ticks = gsap.utils.toArray('.wp-ticks i');
    const wpIndex = document.getElementById('wpIndex');
    const wpName = document.getElementById('wpName');
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
    };
    setActive(0);

    gsap.set('#workPanel', { transformPerspective: 1100, transformOrigin: '50% 18%' });
    gsap.fromTo('#workPanel',
      { rotationX: 17, scale: 0.94, y: 48 },
      {
        rotationX: 0, scale: 1, y: 0,
        ease: 'none',
        scrollTrigger: { trigger: '.scene-work', start: 'top 85%', end: 'top 5%', scrub: 1 }
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

  if (finePointer) {
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
    document.addEventListener('mouseover', (e) => {
      const view = e.target.closest('[data-cursor]');
      const interactive = e.target.closest('a, button');
      docEl.classList.toggle('cur-view', !!view);
      docEl.classList.toggle('cur-hover', !view && !!interactive);
      if (view) label.textContent = view.dataset.cursor;
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
