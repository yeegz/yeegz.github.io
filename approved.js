(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine) and (hover: hover)').matches;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, reduceMotion ? 0 : ms));
  const transitionDone = (element, property, fallback = 1000) => {
    if (reduceMotion || !element) return Promise.resolve();
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        element.removeEventListener('transitionend', onEnd);
        clearTimeout(timer);
        resolve();
      };
      const onEnd = (event) => { if (event.target === element && event.propertyName === property) finish(); };
      const timer = setTimeout(finish, fallback);
      element.addEventListener('transitionend', onEnd);
    });
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  /* Synthesized stage audio — built lazily inside user gestures, no asset files.
     Every voice routes through one soft-limited master so overlapping hits never clip. */
  const sfx = (() => {
    let ctx = null, master = null;
    const ensure = () => {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      if (!ctx) {
        ctx = new Ctx();
        master = ctx.createGain();
        master.gain.value = 0.42;
        const limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = -14; limiter.knee.value = 8; limiter.ratio.value = 9;
        limiter.attack.value = 0.002; limiter.release.value = 0.16;
        master.connect(limiter).connect(ctx.destination);
      }
      if (ctx.state !== 'running') ctx.resume().catch(() => {});
      return ctx;
    };
    const voice = (play) => (...args) => { try { if (ensure()) play(...args); } catch (_) {} };
    const tone = (at, { type = 'sine', from = 440, to = from, dur = 0.2, peak = 0.4 }) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from, at);
      if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), at + dur);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(peak, at + Math.min(0.018, dur * 0.25));
      gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(gain).connect(master);
      osc.start(at); osc.stop(at + dur + 0.03);
    };
    const noise = (at, { dur = 0.3, peak = 0.35, filter = 'bandpass', from = 600, to = 1200, q = 1, attack = 0.25, panFrom = 0, panTo = panFrom }) => {
      const length = Math.max(1, Math.ceil(ctx.sampleRate * dur));
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource(); source.buffer = buffer;
      const shape = ctx.createBiquadFilter();
      shape.type = filter; shape.Q.value = q;
      shape.frequency.setValueAtTime(from, at);
      if (to !== from) shape.frequency.exponentialRampToValueAtTime(Math.max(40, to), at + dur);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(peak, at + dur * attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      let tail = gain;
      if (ctx.createStereoPanner && (panFrom || panTo)) {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(panFrom, at);
        if (panTo !== panFrom) panner.pan.linearRampToValueAtTime(panTo, at + dur);
        gain.connect(panner); tail = panner;
      }
      source.connect(shape); shape.connect(gain); tail.connect(master);
      source.start(at); source.stop(at + dur + 0.03);
    };
    return {
      /* Adelante deck — an airy whoosh that sweeps left to right with the card. */
      whoosh: voice(() => {
        const at = ctx.currentTime;
        noise(at, { dur: 0.44, peak: 0.5, filter: 'bandpass', from: 340, to: 2600, q: 0.8, attack: 0.3, panFrom: -0.35, panTo: 0.45 });
        noise(at + 0.03, { dur: 0.3, peak: 0.16, filter: 'highpass', from: 1400, to: 3600, q: 0.7, attack: 0.35, panFrom: -0.2, panTo: 0.5 });
      }),
      /* Photoshoot — mirror clack, shutter blades, and a soft body thump. */
      shutter: voice(() => {
        const at = ctx.currentTime;
        tone(at, { type: 'sine', from: 150, to: 88, dur: 0.09, peak: 0.42 });
        noise(at, { dur: 0.055, peak: 0.55, filter: 'highpass', from: 2800, to: 1600, q: 0.6, attack: 0.12 });
        noise(at + 0.082, { dur: 0.05, peak: 0.38, filter: 'highpass', from: 2200, to: 900, q: 0.6, attack: 0.12 });
        tone(at + 0.082, { type: 'square', from: 1900, to: 1300, dur: 0.03, peak: 0.1 });
      }),
      /* Tajweed — a dry wooden tick, the sound of turning to the next step. */
      tick: voice(() => {
        const at = ctx.currentTime;
        tone(at, { type: 'triangle', from: 880, to: 520, dur: 0.05, peak: 0.2 });
        noise(at, { dur: 0.035, peak: 0.16, filter: 'bandpass', from: 2400, to: 1500, q: 1.6, attack: 0.1 });
      }),
      /* Fallen Asteri — an 8-bit zap with a pinch of pitch variance per kill. */
      kill: voice(() => {
        const at = ctx.currentTime;
        const vary = 0.92 + Math.random() * 0.16;
        tone(at, { type: 'square', from: 640 * vary, to: 105, dur: 0.2, peak: 0.5 });
        tone(at, { type: 'sawtooth', from: 990 * vary, to: 150, dur: 0.13, peak: 0.2 });
        noise(at + 0.015, { dur: 0.15, peak: 0.32, filter: 'bandpass', from: 950, to: 210, q: 1.4, attack: 0.15 });
      }),
      /* Fallen Asteri — a rising square-wave fanfare, scheduled in-gesture via
         the audio clock (delay in seconds) so it never needs a later gesture. */
      levelUp: voice((delay = 0) => {
        const at = ctx.currentTime + delay;
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, step) => {
          tone(at + step * 0.072, { type: 'square', from: freq, dur: 0.16, peak: 0.2 });
        });
        tone(at + 0.29, { type: 'triangle', from: 1046.5, dur: 0.42, peak: 0.14 });
        tone(at + 0.29, { type: 'triangle', from: 1318.5, dur: 0.42, peak: 0.1 });
      })
    };
  })();

  /* Real, bounded loading sequence. */
  const loader = document.getElementById('siteLoader');
  /* The loader used to wait on the hero print AND the Melaka photograph — on a
     slow phone that is most of a megabyte, and the visitor stared at a black
     screen for nine seconds. Only the hero print is above the fold, and even
     that loses a short race: an image still decoding is a reason to start
     without it, not a reason to hold the door shut. */
  const heroImage = document.getElementById('portrait');
  const heroReady = !heroImage || (heroImage.complete && heroImage.naturalWidth)
    ? Promise.resolve()
    : (typeof heroImage.decode === 'function' ? heroImage.decode().catch(() => {}) : new Promise((resolve) => {
        heroImage.addEventListener('load', resolve, { once: true });
        heroImage.addEventListener('error', resolve, { once: true });
      }));
  window.siteReady = Promise.race([
    Promise.all([document.fonts?.ready || Promise.resolve(), heroReady]),
    wait(700)
  ]).then(() => {
    root.classList.add('is-ready');
    loader?.setAttribute('aria-hidden', 'true');
  });

  /* Theme is global; authored project palettes remain fixed. */
  const themeToggle = document.getElementById('themeToggle');
  const themeChoices = [...document.querySelectorAll('[data-theme-choice]')];
  const applyTheme = (theme, persist = true) => {
    const next = theme === 'light' ? 'light' : 'dark';
    root.dataset.theme = next;
    themeToggle?.setAttribute('aria-pressed', String(next === 'light'));
    themeToggle?.setAttribute('aria-label', `Switch to ${next === 'light' ? 'dark' : 'light'} mode`);
    if (themeToggle) themeToggle.dataset.cursor = next === 'light' ? 'DARK' : 'LIGHT';
    themeChoices.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === next)));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'light' ? '#eee8db' : '#0a0a0b');
    if (persist) try { localStorage.setItem('ysf-theme', next); } catch (_) {}
    document.dispatchEvent(new CustomEvent('ysf-theme'));
  };
  /* User-initiated switches ride a view transition — one whole-page cross-fade
     that also carries the gradients and canvases CSS transitions can't. */
  const switchTheme = (theme) => {
    if (!reduceMotion && typeof document.startViewTransition === 'function') {
      document.startViewTransition(() => applyTheme(theme));
    } else {
      applyTheme(theme);
    }
  };
  applyTheme(root.dataset.theme, false);
  themeToggle?.addEventListener('click', () => switchTheme(root.dataset.theme === 'light' ? 'dark' : 'light'));
  themeChoices.forEach((button) => button.addEventListener('click', () => switchTheme(button.dataset.themeChoice)));

  /* Exact final Skills behavior: every lane moves; only the selected lane pauses. */
  const skillLanes = [...document.querySelectorAll('[data-skill-lane]')];
  const skillPositions = skillLanes.map(() => 0);
  /* Measured once per resize instead of six querySelector + offsetWidth reads
     per frame, and a per-lane hold so a tap (or an arrow) really does pause. */
  const skillParts = skillLanes.map((lane) => ({
    scroller: lane.querySelector('.skill-scroller'),
    set: lane.querySelector('.tool-set'),
    width: 0
  }));
  const skillHold = skillLanes.map(() => 0);
  const measureLanes = () => skillParts.forEach((part) => { part.width = part.set?.offsetWidth || 0; });
  measureLanes();
  addEventListener('resize', () => requestAnimationFrame(measureLanes), { passive: true });
  skillLanes.forEach((lane, index) => {
    const scroller = lane.querySelector('.skill-scroller');
    const set = lane.querySelector('.tool-set');
    lane.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse') return;
      skillHold[index] = performance.now() + 6000;
      lane.classList.add('is-held');
    }, { passive: true });
    const direction = Number(lane.dataset.direction) || 1;
    if (direction < 0) requestAnimationFrame(() => {
      skillPositions[index] = set.offsetWidth;
      scroller.scrollLeft = skillPositions[index];
    });
    const nudge = (dir) => {
      const step = Math.min(scroller.clientWidth * .74, 540);
      const width = set.offsetWidth;
      if (dir < 0 && scroller.scrollLeft < step) scroller.scrollLeft += width;
      if (dir > 0 && scroller.scrollLeft > width * 1.55) scroller.scrollLeft -= width;
      scroller.scrollBy({ left: dir * step, behavior: reduceMotion ? 'auto' : 'smooth' });
      skillPositions[index] = scroller.scrollLeft + dir * step;
    };
    const nudgeFromControl = (event, direction) => {
      /* Hold the drift off while the browser's smooth scroll plays out —
         otherwise the next frame writes the destination straight to
         scrollLeft and the lane teleports instead of gliding. */
      skillHold[index] = performance.now() + 800;
      nudge(direction);
    };
    lane.querySelector('.prev')?.addEventListener('click', (event) => nudgeFromControl(event, -1));
    lane.querySelector('.next')?.addEventListener('click', (event) => nudgeFromControl(event, 1));
  });
  /* WCAG 2.2.2: motion that starts on its own and runs for more than five
     seconds needs a control that stops it. Hover and tap only cover pointers. */
  let skillsPaused = false;
  const skillToggle = document.getElementById('skillsPause');
  if (skillToggle) {
    skillToggle.hidden = false;
    skillToggle.addEventListener('click', () => {
      skillsPaused = !skillsPaused;
      skillToggle.setAttribute('aria-pressed', String(skillsPaused));
      skillToggle.querySelector('.sp-label').textContent = skillsPaused ? 'Resume lanes' : 'Pause lanes';
      document.querySelector('.skill-lanes')?.classList.toggle('is-paused', skillsPaused);
    });
  }
  /* Nothing to animate while the section is off screen. */
  let skillsOnScreen = true;
  const skillsRoot = document.querySelector('.skill-lanes');
  if (skillsRoot && 'IntersectionObserver' in window) {
    skillsOnScreen = false;
    new IntersectionObserver(([entry]) => { skillsOnScreen = entry.isIntersecting; }, { rootMargin: '120px' }).observe(skillsRoot);
  }
  let skillLast = performance.now();
  const moveSkills = (now) => {
    const delta = Math.min(32, now - skillLast);
    skillLast = now;
    if (!reduceMotion && !skillsPaused && skillsOnScreen && !document.hidden) skillLanes.forEach((lane, index) => {
      const { scroller, width } = skillParts[index];
      if (!width || !scroller) return;
      /* Hover pauses; so does *keyboard* focus, because someone stepping
         through with the arrow keys is reading. A mouse click on an arrow
         leaves :focus but not :focus-visible, so the lane resumes on its own
         instead of being frozen by a click that has already finished. */
      if (now < skillHold[index] || lane.matches(':hover') || lane.querySelector(':focus-visible')) {
        skillPositions[index] = scroller.scrollLeft;
        if (now >= skillHold[index]) lane.classList.remove('is-held');
        return;
      }
      lane.classList.remove('is-held');
      const direction = Number(lane.dataset.direction) || 1;
      skillPositions[index] += direction * (.019 + (index % 3) * .003) * delta;
      if (direction > 0 && skillPositions[index] >= width) skillPositions[index] -= width;
      if (direction < 0 && skillPositions[index] <= 0) skillPositions[index] += width;
      scroller.scrollLeft = skillPositions[index];
    });
    requestAnimationFrame(moveSkills);
  };
  requestAnimationFrame(moveSkills);

  /* Education chapters. */
  const education = {
    degree: {
      ghost: '2027', no: 'Chapter 02 / Current', title: 'Bachelor of Software Engineering (Hons)', type: 'Expected August 2027',
      institutions: [['Sunway University', 'Malaysia'], ['Lancaster University', 'United Kingdom']],
      status: 'Subang Jaya, Malaysia<br>Dual-degree programme<br>In progress',
      courses: ['Software Architecture', 'Data Structures', 'Mobile Development', 'Databases', 'UI/UX Design']
    },
    foundation: {
      ghost: '2024', no: 'Chapter 01 / Complete', title: 'Foundation in Information Technology', type: 'May 2023 — July 2024',
      institutions: [['Multimedia University', 'Malaysia']],
      status: 'Cyberjaya, Malaysia<br>Foundation programme<br>Completed',
      courses: ['Programming', 'Data Structures', 'Networking', 'Web Fundamentals']
    }
  };
  const chapter = document.getElementById('chapter');
  const chapterTabs = [...document.querySelectorAll('.chapter-tab')];
  const showChapter = (key) => {
    const record = education[key];
    const lockup = document.getElementById('institutionLockup');
    const courses = document.getElementById('courses');
    if (!record || !lockup || !courses) return;
    document.getElementById('education').dataset.ghost = record.ghost;
    document.getElementById('chapterNo').textContent = record.no;
    document.getElementById('eduTitle').textContent = record.title;
    document.getElementById('degreeType').textContent = record.type;
    document.getElementById('eduStatus').innerHTML = record.status;
    lockup.replaceChildren();
    record.institutions.forEach(([name, place], index) => {
      if (index) { const multiplier = document.createElement('i'); multiplier.textContent = '×'; lockup.append(multiplier); }
      const group = document.createElement('span');
      const strong = document.createElement('b'); strong.textContent = name;
      const small = document.createElement('small'); small.textContent = place;
      group.append(strong, small); lockup.append(group);
    });
    courses.replaceChildren(...record.courses.map((name) => { const item = document.createElement('span'); item.textContent = name; return item; }));
    chapterTabs.forEach((tab) => {
      const active = tab.dataset.chapter === key;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    chapter?.classList.remove('change');
    void chapter?.offsetWidth;
    chapter?.classList.add('change');
  };
  chapterTabs.forEach((tab) => tab.addEventListener('click', () => showChapter(tab.dataset.chapter)));

  /* showChapter() gives the tablist a roving tabindex — the inactive tab is set
     to -1. That pattern is only half of it: without arrow-key handling the
     unfocusable tab becomes unreachable, and the entire Foundation chapter
     (Multimedia University, 2023—24, its subjects) was readable by mouse only.
     Standard tablist keys, with focus following selection. */
  const focusChapter = (index) => {
    const tab = chapterTabs[(index + chapterTabs.length) % chapterTabs.length];
    if (!tab) return;
    showChapter(tab.dataset.chapter);
    tab.focus();
  };
  chapterTabs.forEach((tab, index) => {
    tab.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (step) { event.preventDefault(); focusChapter(index + step); return; }
      if (event.key === 'Home') { event.preventDefault(); focusChapter(0); }
      if (event.key === 'End') { event.preventDefault(); focusChapter(chapterTabs.length - 1); }
    });
  });

  showChapter('degree');

  /* Experience calendar filter. */
  const calendar = document.getElementById('campaignCalendar');

  /* On narrow screens the calendar overflows sideways: give it a gentle
     ping-pong drift. The edge arrows (and touch) take over on demand, then
     the drift resumes after a few idle seconds. */
  if (calendar) {
    let calDir = 1, calHoldUntil = 0, calDwellUntil = 0, calLast = performance.now();
    /* Position accrues in a float — writing fractional deltas straight to
       scrollLeft rounds back to the same value and the drift never starts. */
    let calPos = 0;
    let calOnScreen = true, calMax = 0;
    const measureCal = () => { calMax = calendar.scrollWidth - calendar.clientWidth; };
    measureCal();
    addEventListener('resize', () => requestAnimationFrame(measureCal), { passive: true });
    if ('IntersectionObserver' in window) {
      calOnScreen = false;
      new IntersectionObserver(([entry]) => { calOnScreen = entry.isIntersecting; if (entry.isIntersecting) measureCal(); }, { rootMargin: '120px' }).observe(calendar);
    }
    const calTick = (now) => {
      const delta = Math.min(48, now - calLast);
      calLast = now;
      const max = calMax;
      if (calOnScreen && max > 8) {
        if (reduceMotion || document.hidden || now <= calHoldUntil) {
          calPos = calendar.scrollLeft;
        } else if (now > calDwellUntil) {
          calPos = clamp(calPos + calDir * 0.028 * delta, 0, max);
          calendar.scrollLeft = calPos;
          if (calDir > 0 && calPos >= max - 1) { calDir = -1; calDwellUntil = now + 1200; }
          else if (calDir < 0 && calPos <= 1) { calDir = 1; calDwellUntil = now + 1200; }
        }
      }
      requestAnimationFrame(calTick);
    };
    requestAnimationFrame(calTick);
    const calPause = () => { calHoldUntil = performance.now() + 4200; };
    calendar.addEventListener('pointerdown', calPause);
    calendar.addEventListener('wheel', calPause, { passive: true });
    document.querySelectorAll('.cal-edge').forEach((button) => button.addEventListener('click', (event) => {
      calPause();
      const direction = event.currentTarget.classList.contains('next') ? 1 : -1;
      calendar.scrollBy({ left: direction * Math.min(calendar.clientWidth * 0.8, 300), behavior: reduceMotion ? 'auto' : 'smooth' });
    }));
  }

  document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => {
    const same = calendar.dataset.activeFilter === button.dataset.filter;
    if (same) delete calendar.dataset.activeFilter;
    else calendar.dataset.activeFilter = button.dataset.filter;
    document.querySelectorAll('.filter').forEach((item) => {
      const on = !same && item === button;
      item.classList.toggle('active', on);
      item.setAttribute('aria-pressed', String(on));
    });
  }));

  /* Contact drag, bounded and springing home. */
  const contact = document.getElementById('contact');
  /* Pointer-driven decoration is a per-frame job, not a per-event one. These
     handlers read a box and write custom properties that repaint large
     gradients; run raw, a 1000Hz mouse does it hundreds of times a second. */
  const perFrame = (fn) => {
    let queued = 0, lastEvent = null;
    return (event) => {
      lastEvent = event;
      if (queued) return;
      queued = requestAnimationFrame(() => { queued = 0; fn(lastEvent); });
    };
  };
  const boxOf = (element) => {
    let rect = null;
    const clear = () => { rect = null; };
    addEventListener('resize', clear, { passive: true });
    addEventListener('scroll', clear, { passive: true });
    return () => (rect || (rect = element.getBoundingClientRect()));
  };

  const mail = document.getElementById('dragMail');
  const mailTrack = document.getElementById('mailTrack');
  let dragging = false, dragMoved = false, suppressMailClick = false, dragStartX = 0, dragStartY = 0;
  const contactBox = contact ? boxOf(contact) : null;
  contact?.addEventListener('pointermove', perFrame((event) => {
    const section = contactBox();
    contact.style.setProperty('--cx', `${(event.clientX - section.left) / section.width * 100}%`);
    contact.style.setProperty('--cy', `${(event.clientY - section.top) / section.height * 100}%`);
    if (!dragging) return;
    const track = mailTrack.getBoundingClientRect();
    const item = mail.getBoundingClientRect();
    const maxX = Math.max(20, Math.min(90, (track.width - item.width) / 2 - 24));
    const dx = clamp(event.clientX - dragStartX, -maxX, maxX);
    const dy = clamp(event.clientY - dragStartY, -34, 34);
    dragMoved ||= Math.hypot(event.clientX - dragStartX, event.clientY - dragStartY) > 5;
    mail.style.setProperty('--dx', `${dx}px`);
    mail.style.setProperty('--dy', `${dy}px`);
    mail.style.setProperty('--rot', `${clamp(dx / 28, -3.2, 3.2)}deg`);
  }));
  mail?.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragging = true; dragMoved = false; dragStartX = event.clientX; dragStartY = event.clientY;
    mail.setPointerCapture(event.pointerId); mail.classList.add('dragging');
  });
  const releaseMail = (event) => {
    if (!dragging) return;
    dragging = false; suppressMailClick = dragMoved; mail.classList.remove('dragging');
    mail.style.setProperty('--dx', '0px'); mail.style.setProperty('--dy', '0px'); mail.style.setProperty('--rot', '0deg');
    if (mail.hasPointerCapture?.(event.pointerId)) mail.releasePointerCapture(event.pointerId);
  };
  mail?.addEventListener('pointerup', releaseMail); mail?.addEventListener('pointercancel', releaseMail);
  mail?.addEventListener('click', (event) => { if (suppressMailClick) { event.preventDefault(); suppressMailClick = false; } });
  document.getElementById('copyMail')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText('yousofselim2@gmail.com');
      button.textContent = 'Copied ✓';
      clearTimeout(button._copyReset);
      button._copyReset = setTimeout(() => { button.textContent = 'Copy address ↗'; }, 1800);
    }
    catch (_) { location.href = 'mailto:yousofselim2@gmail.com'; }
  });

  /* Project theater lifecycle and the row-originating surface expansion. */
  const theater = document.getElementById('projectTheater');
  const theaterWash = theater?.querySelector('.theater-wash');
  const theaterBackground = [...document.querySelectorAll('body > .site-loader, body > .skip-link, body > .site-head, body > .mobile-nav, body > main, body > .site-foot, body > .progress-rail')];
  let theaterBackgroundState = null;
  const isolateTheater = (active) => {
    if (active) {
      if (theaterBackgroundState) return;
      theaterBackgroundState = theaterBackground.map((element) => [element, element.inert]);
      theaterBackground.forEach((element) => { element.inert = true; });
      return;
    }
    theaterBackgroundState?.forEach(([element, wasInert]) => { element.inert = wasInert; });
    theaterBackgroundState = null;
  };
  const theaterFocusable = () => [...theater.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.closest('[hidden]') && element.getClientRects().length);
  /* The archive's order is the résumé's order; the theater follows it. */
  const projectNames = ['bupples', 'adelante', 'photoshoot', 'tajweed', 'asteri'];
  const projectMeta = {
    bupples: { label: '01 / Bupples', surface: '#050b07', color: '#f4f0e7' },
    adelante: { label: '02 / Adelante', surface: '#faf7f0', color: '#15130f' },
    photoshoot: { label: '03 / Photoshoot', surface: '#e9e3d6', color: '#24221f' },
    tajweed: { label: '04 / Tajweed', surface: '#0b1220', color: '#eef2f8' },
    asteri: { label: '05 / Fallen Asteri', surface: '#120909', color: '#f4e8d7' }
  };
  let currentProject = '', projectOpener = null, projectScroll = 0, theaterBusy = false;
  /* Captured once per opening; every re-aim is measured against these. */
  let openScroll = 0, openedWith = '', openRowTop = null, projectRow = null;
  let pendingProjectSteps = 0, pendingProjectClose = false;
  /* Phones keep cases self-contained on the card (links included), so the
     theater never opens there. The opener is hidden by CSS at that width — it
     is no longer a *disabled* button wrapped around the whole card, which used
     to strand the card's copy in a control assistive tech reports as
     unavailable. This only guards against a stray programmatic call. */
  const phoneCards = matchMedia('(max-width: 760px)');
  const completeTheaterAction = () => {
    theaterBusy = false;
    if (!theater?.open) { pendingProjectSteps = 0; pendingProjectClose = false; return; }
    if (pendingProjectClose) {
      pendingProjectClose = false; pendingProjectSteps = 0; closeProject(); return;
    }
    if (pendingProjectSteps) {
      const offset = Math.sign(pendingProjectSteps); pendingProjectSteps -= offset; navigateProject(offset);
    }
  };
  /* Re-aims the closing wash, the scroll restore and the focus restore at
     whichever case file is currently on stage. */
  const aimAtRow = (name) => {
    const opener = document.querySelector(`[data-open-project="${name}"]`);
    const row = opener?.closest('.work-row');
    if (!row) return;
    projectOpener = opener;
    projectRow = row;
    setWashFrom(row);
  };
  /* Where the exited case should sit once the page is back: exactly where the
     visitor left it if they never navigated, otherwise just under the header.
     Measured live, after the close has settled — the pinned hero re-measures
     on the way out and moves every row's document offset, so anything computed
     earlier is stale by the time it would be applied. */
  const restoreToRow = () => {
    const row = projectRow;
    if (!row) { window.scrollTo(0, projectScroll); return; }
    const wanted = (currentProject === openedWith && openRowTop != null)
      ? openRowTop
      : Math.round(innerHeight * 0.14);
    const target = Math.max(0, Math.round(scrollY + row.getBoundingClientRect().top - wanted));
    if (window.lenis?.scrollTo) window.lenis.scrollTo(target, { immediate: true, force: true });
    else window.scrollTo(0, target);
  };
  const setWashFrom = (row) => {
    const box = row.getBoundingClientRect();
    theater.style.setProperty('--wash-top', `${Math.max(0, box.top)}px`);
    theater.style.setProperty('--wash-right', `${Math.max(0, innerWidth - box.right)}px`);
    theater.style.setProperty('--wash-bottom', `${Math.max(0, innerHeight - box.bottom)}px`);
    theater.style.setProperty('--wash-left', `${Math.max(0, box.left)}px`);
  };
  const showProject = (name) => {
    theater.querySelectorAll('[data-project-stage]').forEach((stage) => { stage.hidden = stage.dataset.projectStage !== name; });
    currentProject = name;
    theater.dataset.project = name;
    theater.style.setProperty('--project-surface', projectMeta[name].surface);
    theater.style.color = projectMeta[name].color;
    document.getElementById('theaterLabel').textContent = projectMeta[name].label;
  };
  const openProject = async (name, opener) => {
    if (theaterBusy || theater.open || !projectMeta[name] || phoneCards.matches) return;
    theaterBusy = true; pendingProjectSteps = 0; pendingProjectClose = false; projectOpener = opener;
    const rowEl = opener.closest('.work-row') || opener;
    /* The position the visitor is actually looking at. Taken on pointerdown,
       because focusing the stretched opener makes the browser scroll it into
       view before this handler runs. */
    const scrollBeforeFreeze = pointerScroll ?? scrollY;
    const pointerRowTop = pointerRowViewportTop ?? rowEl.getBoundingClientRect().top;
    showProject(name);
    if (typeof theater.showModal === 'function') {
      try { theater.showModal(); } catch (_) { theater.show?.(); }
    } else if (typeof theater.show === 'function') { theater.show(); }
    else { theater.setAttribute('open', ''); }
    isolateTheater(true);
    root.classList.add('project-open');
    window.ysfCursorHost?.(theater);
    window.lenis?.stop?.();
    /* Freezing the page removes the scrollbar and settles the pinned hero,
       which shifts the document by a hundred-odd pixels. Everything the close
       depends on — where the wash starts, where to scroll back to, which row
       to land on — is measured *after* that, so it is all in one coordinate
       system and navigating between cases stays exact. */
    openScroll = scrollBeforeFreeze;
    projectScroll = scrollBeforeFreeze;
    openedWith = name;
    openRowTop = pointerRowTop;
    projectRow = rowEl;
    /* The wash grows out of the whole case-file row, not just the opener. */
    setWashFrom(rowEl);
    requestAnimationFrame(() => requestAnimationFrame(() => theater.classList.add('is-open')));
    await transitionDone(theaterWash, 'clip-path', 980);
    theater.querySelector('[data-close-project]')?.focus({ preventScroll: true });
    completeTheaterAction();
  };
  const closeProject = async () => {
    if (!theater.open) return;
    if (theaterBusy) { pendingProjectClose = true; pendingProjectSteps = 0; return; }
    theaterBusy = true; theater.classList.add('is-closing'); theater.classList.remove('is-open');
    root.classList.remove('project-open');
    /* The exit rides the panel's own transform, not the wash's clip-path. */
    await transitionDone(theater, 'transform', 420);
    theater.close(); theater.classList.remove('is-closing');
    window.ysfCursorHost?.(null);
    isolateTheater(false);
    window.lenis?.start?.();
    restoreToRow();
    projectOpener?.focus({ preventScroll: true });
    completeTheaterAction();
  };
  let pointerScroll = null, pointerRowViewportTop = null;
  document.querySelectorAll('[data-open-project]').forEach((button) => {
    const mark = () => {
      pointerScroll = scrollY;
      pointerRowViewportTop = (button.closest('.work-row') || button).getBoundingClientRect().top;
    };
    button.addEventListener('pointerdown', mark, { passive: true });
    button.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') mark(); });
    button.addEventListener('click', () => {
      openProject(button.dataset.openProject, button);
      pointerScroll = null; pointerRowViewportTop = null;
    });
  });
  theater?.querySelector('[data-close-project]')?.addEventListener('click', closeProject);
  theater?.addEventListener('cancel', (event) => { event.preventDefault(); closeProject(); });
  document.addEventListener('keydown', (event) => {
    if (!theater?.open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeProject();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = theaterFocusable();
    if (!focusable.length) { event.preventDefault(); theater.focus(); return; }
    const first = focusable[0], last = focusable[focusable.length - 1], active = document.activeElement;
    if (!theater.contains(active)) { event.preventDefault(); first.focus(); return; }
    if (event.shiftKey && active === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
  });
  const navigateProject = async (offset) => {
    if (!theater?.open) return;
    if (theaterBusy) { if (!pendingProjectClose) pendingProjectSteps += offset; return; }
    const nextName = projectNames[(projectNames.indexOf(currentProject) + offset + projectNames.length) % projectNames.length];
    const outgoing = theater.querySelector(`[data-project-stage="${currentProject}"]`);
    const incoming = theater.querySelector(`[data-project-stage="${nextName}"]`);
    if (!incoming || incoming === outgoing) return;
    theaterBusy = true;
    theater.style.setProperty('--stage-dir', offset > 0 ? '1' : '-1');
    outgoing?.classList.add('stage-switching', 'stage-out');
    await wait(250);                       /* .stage-out runs for 240ms */
    showProject(nextName);                 /* swap while both are invisible */
    outgoing?.classList.remove('stage-switching', 'stage-out');
    incoming.classList.add('stage-switching', 'stage-in');
    void incoming.offsetWidth;
    requestAnimationFrame(() => incoming.classList.remove('stage-in'));
    await wait(400);                       /* .stage-in settles at 380ms */
    incoming.classList.remove('stage-switching');
    aimAtRow(nextName);
    completeTheaterAction();
  };
  theater?.querySelectorAll('[data-project-nav]').forEach((button) => button.addEventListener('click', () => {
    navigateProject(button.dataset.projectNav === 'next' ? 1 : -1);
  }));

  /* Bupples parallax without separating the approved phone overlap. */
  const bupples = document.querySelector('[data-project-stage="bupples"]');
  const bupplesBox = bupples ? boxOf(bupples) : null;
  bupples?.addEventListener('pointermove', perFrame((event) => {
    const rect = bupplesBox();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    bupples.style.setProperty('--lpx', `${x * -18}px`); bupples.style.setProperty('--lpy', `${y * -11}px`);
    bupples.style.setProperty('--cpx', `${x * 12}px`); bupples.style.setProperty('--cpy', `${y * 8}px`);
    bupples.style.setProperty('--rpx', `${x * 20}px`); bupples.style.setProperty('--rpy', `${y * 12}px`);
    bupples.style.setProperty('--bgx', `${x * -7}px`); bupples.style.setProperty('--bgy', `${y * -7}px`);
  }));
  bupples?.addEventListener('pointerleave', () => ['--lpx','--lpy','--cpx','--cpy','--rpx','--rpy','--bgx','--bgy'].forEach((name) => bupples.style.removeProperty(name)));

  /* Adelante deck and alternating discovered message. */
  const quoteDeck = document.getElementById('quoteDeck');
  let quoteCards = quoteDeck ? [...quoteDeck.querySelectorAll('.quote-card')] : [], quoteBusy = false;
  const layoutQuotes = () => quoteCards.forEach((card, index) => card.dataset.position = index);
  const advanceQuote = async () => {
    if (quoteBusy || !quoteCards.length) return;
    quoteBusy = true; sfx.whoosh(); const front = quoteCards.shift(); front.classList.add('leaving');
    await wait(560); front.style.transition = 'none'; front.style.opacity = '0'; front.classList.remove('leaving'); quoteCards.push(front); layoutQuotes();
    void front.offsetWidth; requestAnimationFrame(() => { front.style.transition = ''; front.style.opacity = ''; quoteBusy = false; });
  };
  quoteDeck?.addEventListener('click', advanceQuote);
  quoteDeck?.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); advanceQuote(); } });
  /* Tajweed: the rule, painted into the letter.
     The platform's whole idea is that recitation rules live in the colour of
     the script. Picking a rule here isolates exactly the letters it governs —
     including the ones this ayah simply does not contain, which is itself the
     honest answer rather than a dead button. */
  const tajweedPlate = document.getElementById('tajweedPlate');
  if (tajweedPlate) {
    const note = document.getElementById('tajweedNote');
    const keys = [...document.querySelectorAll('#tajweedKeys .t-rule')];
    const letters = [...tajweedPlate.querySelectorAll('.tw')];
    const RULE_NOTE = {
      wasl: ['Hamzat waṣl', 'The alif is written but swallowed — you slide straight into the lām.'],
      madd: ['Madd ṭabīʿī', 'A natural stretch: hold the vowel for two counts, no more.'],
      tafkhim: ['Tafkhīm', 'The rāʾ is heavy here — the back of the tongue lifts and the sound thickens.'],
      silent: ['Sukūn', 'No vowel rides this letter; it closes and hands over to the next.'],
      ghunna: ['Ghunna / Ikhfāʾ', 'A nasal hum held for two counts.'],
      qalqala: ['Qalqala', 'A bounce off a resting qāf, ṭāʾ, bāʾ, jīm or dāl.'],
      madd4: ['Madd wājib', 'Obligatory stretch — four or five counts.'],
      madd6: ['Madd lāzim', 'Necessary stretch — a full six counts.']
    };
    let active = '';
    const paint = (rule) => {
      active = rule;
      const on = !!rule;
      tajweedPlate.classList.toggle('is-isolating', on);
      const colour = keys.find((k) => k.dataset.rule === rule)?.style.getPropertyValue('--rule') || '';
      let hits = 0;
      letters.forEach((el) => {
        const lit = on && el.dataset.rule === rule;
        el.classList.toggle('is-lit', lit);
        if (lit) { el.style.setProperty('--lit', colour); hits += 1; }
        else el.style.removeProperty('--lit');
      });
      keys.forEach((k) => k.setAttribute('aria-selected', String(k.dataset.rule === rule)));
      if (!note) return;
      if (!on) { note.textContent = 'Every rule is on. Choose one to isolate it.'; return; }
      const [name, meaning] = RULE_NOTE[rule] || [rule, ''];
      note.innerHTML = '';
      const strong = document.createElement('b');
      strong.textContent = name;
      note.append(strong, document.createTextNode(' — ' + meaning + ' '));
      const tail = document.createElement('span');
      tail.textContent = hits
        ? `Lit ${hits} ${hits === 1 ? 'place' : 'places'} in this ayah.`
        : 'This ayah does not contain it — the rule still colours the rest of the Qur’an.';
      note.append(tail);
    };
    keys.forEach((key) => key.addEventListener('click', () => {
      sfx.tick?.();
      paint(key.dataset.rule === active ? '' : key.dataset.rule);
    }));
    /* Leaving the plate lets the full colouring come back. */
    tajweedPlate.addEventListener('pointerleave', () => { if (active) return; paint(''); });
    paint('');
  }

  const adelanteMessages = ['Adelante is Spanish for “go forward.”', 'Even the smallest step is still forward.'];
  let adelanteMessage = 0;
  document.getElementById('aMark')?.addEventListener('pointerenter', async () => {
    const line = document.getElementById('forwardLine'); line.classList.add('changing'); await wait(80);
    line.textContent = adelanteMessages[adelanteMessage]; adelanteMessage = (adelanteMessage + 1) % adelanteMessages.length; line.classList.remove('changing');
  });

  /* Photoshoot session, preserving each approved focal point. */
  const photos = [
    ['images/projects/photoshoot/subject-01.webp', '50% 56%'],
    ['images/projects/photoshoot/subject-02.webp', '50% 35%'],
    ['images/projects/photoshoot/subject-03.webp', '50% 37%'],
    ['images/projects/photoshoot/subject-04.webp', '50% 40%']
  ];
  const viewfinder = document.getElementById('viewfinder'), viewImage = document.getElementById('viewImage');
  let photoIndex = 0, shot = 0, currentEffect = 'none';
  document.getElementById('effects')?.addEventListener('click', (event) => {
    const button = event.target.closest('.effect'); if (!button) return;
    currentEffect = button.dataset.effect; viewfinder.dataset.effect = currentEffect;
    document.querySelectorAll('.effect').forEach((item) => item.classList.toggle('active', item === button));
    document.getElementById('effectLabel').textContent = `ISO 400 · F/1.8 · ${currentEffect === 'none' ? 'CLEAN' : currentEffect.toUpperCase()}`;
  });
  let lastShutter = 0;
  document.getElementById('shutter')?.addEventListener('click', async () => {
    const now = performance.now();
    if (now - lastShutter < 180) return;
    lastShutter = now;
    const flash = document.getElementById('flash'), slots = [...document.getElementById('strip').children];
    sfx.shutter();
    flash.classList.remove('fire'); void flash.offsetWidth; flash.classList.add('fire');
    if (shot === 4) { slots.forEach((slot) => slot.replaceChildren()); shot = 0; }
    const capture = document.createElement('img'); capture.src = photos[photoIndex][0]; capture.style.objectPosition = photos[photoIndex][1];
    if (currentEffect === 'mono') capture.style.filter = 'grayscale(1) contrast(1.13)';
    if (currentEffect === 'sepia') capture.style.filter = 'sepia(.82) contrast(1.08)';
    if (currentEffect === 'pop') capture.style.filter = 'saturate(1.8) contrast(1.18)';
    slots[shot].append(capture); shot += 1; document.getElementById('shotCount').textContent = `${shot} / 4 captured`;
    photoIndex = (photoIndex + 1) % photos.length; viewImage.classList.add('switching'); await wait(175);
    viewImage.src = photos[photoIndex][0]; viewImage.style.objectPosition = photos[photoIndex][1];
    document.getElementById('subjectLabel').textContent = `SUBJECT ${String(photoIndex + 1).padStart(2, '0')}`; viewImage.classList.remove('switching');
  });

  /* Fallen Asteri micro-combat, bounded to four enemies. */
  const fStage = document.querySelector('[data-project-stage="asteri"]'), game = document.getElementById('gameFrame');
  const sword = document.getElementById('swordCursor');

  /* Pixel sprites in the cavern's own palette — one char per pixel, rendered
     as crisp SVG rects so the creatures and sword read as real game art. */
  const PIXEL_INK = {
    k: '#2b171b', m: '#7b3d4b', M: '#4e2635', r: '#ff604e',
    a: '#e0a15a', A: '#a05a32', c: '#f0d29b', P: '#3a2440',
    p: '#5a3a57', w: '#f4ead7', W: '#fff9e9'
  };
  const pixelSprite = (rows) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${rows[0].length} ${rows.length}`);
    svg.setAttribute('aria-hidden', 'true');
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x += 1) {
        const ink = PIXEL_INK[row[x]];
        if (!ink) continue;
        const px = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        px.setAttribute('x', x); px.setAttribute('y', y);
        px.setAttribute('width', '1.04'); px.setAttribute('height', '1.04');
        px.setAttribute('fill', ink);
        svg.appendChild(px);
      }
    });
    return svg;
  };
  const ENEMY_SPRITES = {
    slime: [
      '...kkkkk...',
      '..kmmmmmk..',
      '.kmwmmmmmk.',
      'kmmmmmmmmmk',
      'kmrrmmmrrmk',
      'kmmmkkkmmmk',
      'kMMMMMMMMMk',
      '.kkkkkkkkk.'
    ],
    bat: [
      'kk.........kk',
      'kpk.......kpk',
      'kppk.k.k.kppk',
      'kpppppppppppk',
      'kppprppprpppk',
      '.kpppppppppk.',
      '..kppkpkppk..',
      '...kk.k.kk...'
    ],
    eye: [
      '..kkkkk..',
      '.kmmmmmk.',
      'kmcccccmk',
      'kccPPPcck',
      'kccPwPcck',
      'kccPPPcck',
      'kmcccccmk',
      '.kmmmmmk.',
      '..kkkkk..'
    ]
  };
  const SWORD_SPRITE = [
    '............kkk.',
    '...........kWWk.',
    '..........kWWwk.',
    '.........kWWwk..',
    '........kWWwk...',
    '.......kWWwk....',
    '......kWWwk.....',
    '..kk.kWWwk......',
    '..kaakWwk.......',
    '...kaawk........',
    '....kaakak......',
    '...kAkkaakk.....',
    '..kAAk..kk......',
    '.kAAk...........',
    '.kAk............',
    '..k.............'
  ];
  if (sword) {
    while (sword.firstChild) sword.removeChild(sword.firstChild);
    sword.append(pixelSprite(SWORD_SPRITE));
  }
  let xp = 0, level = 1, kills = 0, spawnIndex = 0;
  const spawnPoints = [[18,64],[39,57],[63,65],[82,53],[27,50],[73,58]];
  const spawnEnemy = () => {
    if (!game || game.querySelectorAll('.enemy').length >= 4) return;
    const enemy = document.createElement('button'); const point = spawnPoints[spawnIndex % spawnPoints.length]; const types = ['slime','bat','eye'];
    const type = types[spawnIndex % types.length];
    enemy.type = 'button'; enemy.className = `enemy ${type}`; spawnIndex += 1;
    enemy.setAttribute('aria-label', 'Defeat enemy'); enemy.style.left = `${point[0]}%`; enemy.style.top = `${point[1]}%`;
    const art = pixelSprite(ENEMY_SPRITES[type]);
    art.style.animationDelay = `${(-Math.random() * 3).toFixed(2)}s`;
    enemy.append(art); game.append(enemy);
    enemy.addEventListener('click', (event) => killEnemy(enemy, event));
  };
  const killEnemy = (enemy, event) => {
    event.stopPropagation(); if (enemy.classList.contains('dying')) return;
    sfx.kill();
    const gameRect = game.getBoundingClientRect(), enemyRect = enemy.getBoundingClientRect();
    const x = enemyRect.left - gameRect.left + enemyRect.width / 2, y = enemyRect.top - gameRect.top + enemyRect.height / 2;
    sword.classList.remove('attack'); void sword.offsetWidth; sword.classList.add('attack'); enemy.classList.add('dying');
    game.classList.add('hit'); setTimeout(() => game.classList.remove('hit'), 120);
    for (let index = 0; index < 9; index += 1) {
      const pixel = document.createElement('i'); pixel.className = 'death-pixel'; pixel.style.setProperty('--px', `${x}px`); pixel.style.setProperty('--py', `${y}px`);
      pixel.style.setProperty('--dx', `${Math.random() * 80 - 40}px`); pixel.style.setProperty('--dy', `${Math.random() * -65 - 5}px`); game.append(pixel); setTimeout(() => pixel.remove(), 650);
    }
    const pop = document.createElement('b'); pop.className = 'xp-pop'; pop.textContent = '+35 XP'; pop.style.left = `${x + 10}px`; pop.style.top = `${y - 8}px`; game.append(pop); setTimeout(() => pop.remove(), 750);
    kills += 1; xp += 35; document.getElementById('kills').textContent = `${kills} ENEMIES CLEARED`;
    if (xp >= 100) { xp -= 100; level += 1; document.getElementById('level').textContent = level; const flare = document.getElementById('levelUp'); flare.classList.remove('show'); void flare.offsetWidth; flare.classList.add('show'); sfx.levelUp(0.14); }
    document.getElementById('xpFill').style.width = `${xp}%`;
    setTimeout(() => { enemy.remove(); setTimeout(spawnEnemy, 450); }, 520);
  };
  for (let index = 0; index < 4; index += 1) spawnEnemy();
  fStage?.addEventListener('pointermove', (event) => {
    const rect = fStage.getBoundingClientRect(); fStage.style.setProperty('--sx', `${event.clientX - rect.left}px`); fStage.style.setProperty('--sy', `${event.clientY - rect.top}px`);
  });
  fStage?.addEventListener('pointerleave', () => { fStage.style.setProperty('--sx', '-100px'); fStage.style.setProperty('--sy', '-100px'); });

  /* One corrected cursor system. No second transform or legacy margin math.
     Mounted on any device that *can* drive a fine pointer, then switched on and
     off live: a hybrid machine (touch laptop, iPad with a trackpad) must never
     show the drawn cursor and the real one at the same time. */
  const pointerMQ = matchMedia('(pointer: fine) and (hover: hover)');
  if (pointerMQ.matches || matchMedia('(any-pointer: fine)').matches) {
    const cursor = document.getElementById('cursor'), label = document.getElementById('cursorLabel');
    let cursorX = -100, cursorY = -100, cursorFrame = 0, actionFrame = 0;
    const paint = () => { cursorFrame = 0; cursor.style.transform = `translate3d(${cursorX}px,${cursorY}px,0)`; };

    /* Case-file sigils riding in the disc: Pip, camera, forward mark, sword.
       Rendered by script.js's makeSigil; cached per project and per theme so
       the glyph ink always contrasts with the current disc colour. */
    const sigilHold = document.getElementById('cursorSigil');
    const sigilCache = {};
    let sigilLive = null, sigilName = '';
    const setCursorSigil = (name) => {
      if (name === sigilName || !sigilHold) return;
      sigilName = name;
      sigilLive?.stop();
      while (sigilHold.firstChild) sigilHold.removeChild(sigilHold.firstChild);
      sigilLive = null;
      if (!name || typeof window.makeSigil !== 'function') return;
      const theme = root.dataset.theme === 'light' ? 'light' : 'dark';
      const key = `${name}:${theme}`;
      if (!(key in sigilCache)) {
        sigilCache[key] = window.makeSigil(name, 54, theme === 'light'
          ? { ink: '#eee8db', accent: '#9bcfa5', dotScale: 1.2 }
          : { ink: '#1a1b1c', accent: '#417a52', dotScale: 1.2 });
      }
      sigilLive = sigilCache[key];
      if (sigilLive) {
        sigilHold.appendChild(sigilLive.canvas);
        /* Replay the dot assembly on every arrival so the glyph draws itself
           in smoothly rather than popping in fully formed. */
        sigilLive.play();
      }
    };

    /* Surface awareness: sample the effective background under the pointer
       and flip the cursor's ink so it stays visible over light stages and
       panels (and over dark ones in light theme). */
    let lumaElement = null, lumaCell = '';
    /* Declared light/dark zones are static markup; hold the list instead of
       re-querying the document on every pointer sample. */
    let surfaceZones = null;
    const zones = () => (surfaceZones || (surfaceZones = [...document.querySelectorAll('[data-cursor-surface]')]));
    /* Both engines serialize color-mix() as `color(srgb 0.61 0.81 0.65 / .45)`
       — components 0..1, not 0..255. Reading those as bytes made every
       colour-mixed surface compute as near-black, so the cursor stayed light
       on light panels. Parse both forms properly. */
    const parseColour = (value) => {
      if (!value || value === 'transparent') return null;
      let m = value.match(/^color\(\s*(?:srgb|display-p3)\s+([-\d.eE]+)\s+([-\d.eE]+)\s+([-\d.eE]+)(?:\s*\/\s*([-\d.eE]+|none))?/i);
      if (m) {
        const a = m[4] === undefined || m[4] === 'none' ? 1 : parseFloat(m[4]);
        return { r: parseFloat(m[1]) * 255, g: parseFloat(m[2]) * 255, b: parseFloat(m[3]) * 255, a };
      }
      m = value.match(/^rgba?\(([^)]+)\)/i);
      if (m) {
        const n = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
        if (n.length >= 3 && n.every((x) => !isNaN(x))) {
          return { r: n[0], g: n[1], b: n[2], a: n.length > 3 ? n[3] : 1 };
        }
      }
      return null;
    };
    const surfaceLuma = (element) => {
      let node = element;
      /* Composite what we walk past: a 70%-opaque dark panel over a light page
         is not the same surface as either one alone. */
      let r = 0, g = 0, b = 0, covered = 0;
      while (node && node !== document.documentElement) {
        const c = parseColour(getComputedStyle(node).backgroundColor);
        if (c && c.a > 0.02) {
          const share = c.a * (1 - covered);
          r += c.r * share; g += c.g * share; b += c.b * share;
          covered += share;
          if (covered > 0.96) break;
        }
        node = node.parentElement;
      }
      if (covered < 0.5) {
        const base = root.dataset.theme === 'light' ? 238 : 10;
        const share = 1 - covered;
        r += base * share; g += base * share; b += base * share;
      }
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    };
    const applySurface = (element, force) => {
      /* Pointer-transparent regions (like the camera viewfinder) never become
         event targets, so declared [data-cursor-surface] zones win by rect. */
      let zone = null;
      for (const candidate of zones()) {
        const rect = candidate.getBoundingClientRect();
        if (rect.width && cursorX >= rect.left && cursorX <= rect.right && cursorY >= rect.top && cursorY <= rect.bottom) { zone = candidate; break; }
      }
      const key = zone || element;
      /* Sampling keyed only on the element meant crossing from a glyph to the
         gap beside it — same element — never re-read. Key on the point too. */
      const cell = ((cursorX / 24) | 0) + ':' + ((cursorY / 24) | 0);
      if (!force && key === lumaElement && cell === lumaCell) return;
      lumaElement = key; lumaCell = cell;
      const luma = zone
        ? (zone.dataset.cursorSurface === 'light' ? 0.9 : 0.05)
        : (element ? surfaceLuma(element) : (root.dataset.theme === 'light' ? 0.9 : 0.05));
      cursor.classList.toggle('on-light', luma > 0.52);
      cursor.classList.toggle('on-dark', luma <= 0.52);
    };
    let themeSettle = 0;
    document.addEventListener('ysf-theme', () => {
      /* The page cross-fades for .7s, so a single reading at t=0 samples the
         colour it is leaving. Re-read across the fade and once it has landed. */
      applySurface(lumaElement, true);
      clearInterval(themeSettle);
      const until = performance.now() + 900;
      themeSettle = setInterval(() => {
        applySurface(lumaElement, true);
        if (performance.now() > until) clearInterval(themeSettle);
      }, 120);
    });

    let sizedAction = null;
    const updateCursorAction = (target) => {
      const element = target instanceof Element ? target : null;
      applySurface(element, false);
      const inAsteri = !!element?.closest('.f-stage');
      root.classList.toggle('sword-mode', inAsteri);
      const action = element?.closest('[data-cursor],a,button,[role="button"]');
      const verb = action?.dataset.cursor || (action?.tagName === 'A' ? 'OPEN' : action ? 'SELECT' : '');
      label.textContent = verb;
      /* The disc sizes itself to the hovered control so it never swallows it. */
      if (action && verb && !inAsteri) {
        if (action !== sizedAction) {
          sizedAction = action;
          const rect = action.getBoundingClientRect();
          const size = clamp(Math.round(Math.min(rect.width, rect.height) * 1.2), 54, 76);
          cursor.style.setProperty('--cur-size', `${size}px`);
        }
      } else {
        sizedAction = null;
        cursor.style.removeProperty('--cur-size');
      }
      const project = (!inAsteri && action) ? (action.dataset.openProject || action.dataset.cursorSigil || '') : '';
      setCursorSigil(project);
      root.classList.toggle('cur-sigil', !!project);
      root.classList.toggle('cur-view', !!verb && !inAsteri);
    };
    const refreshCursorAction = () => {
      if (actionFrame) return;
      actionFrame = requestAnimationFrame(() => {
        actionFrame = 0;
        updateCursorAction(document.elementFromPoint(cursorX, cursorY));
      });
    };
    /* ── Live on/off. ────────────────────────────────────────────────────────
       The drawn cursor is only ever on while a real mouse is the pointer in
       use. Touching the screen on a hybrid machine turns it off (and gives the
       system cursor back); moving the mouse turns it on again. This is what
       stops the drawn and native cursors being visible at the same time. */
    let cursorOn = null;
    const releaseCursor = () => root.classList.remove('cursor-press');
    const setCursorMode = (on) => {
      if (on === cursorOn) return;
      cursorOn = on;
      root.classList.toggle('cur', on);
      if (on) { cursor.removeAttribute('hidden'); return; }
      cursor.setAttribute('hidden', '');
      cursor.classList.remove('is-visible');
      root.classList.remove('cur-view', 'cur-sigil', 'sword-mode');
      releaseCursor();
      sizedAction = null; lumaElement = null;
    };
    /* A dialog opened with showModal() lives in the top layer, which paints
       above every z-index there is — so the drawn cursor was behind the case
       file while `cursor: none` was still hiding the real one. Re-home the
       cursor into the top-layer element while it is open. */
    window.ysfCursorHost = (host) => {
      const parent = host || document.body;
      if (cursor.parentElement !== parent) parent.appendChild(cursor);
    };
    setCursorMode(pointerMQ.matches);
    if (pointerMQ.addEventListener) pointerMQ.addEventListener('change', (event) => setCursorMode(event.matches));
    else pointerMQ.addListener?.((event) => setCursorMode(event.matches));

    /* One frame, one update. pointermove fires far faster than the display on
       high-polling mice, and each update hit-tests and samples the surface
       under the pointer — doing that per event starved the frame budget and
       made the cursor lag, stutter and appear to drop out. */
    let moveTarget = null;
    const commitMove = () => {
      cursorFrame = 0;
      paint();
      updateCursorAction(moveTarget);
    };
    window.addEventListener('pointermove', (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') { setCursorMode(false); return; }
      if (!cursorOn && pointerMQ.matches) setCursorMode(true);
      if (!cursorOn) return;
      cursorX = event.clientX; cursorY = event.clientY;
      moveTarget = event.target;
      cursor.classList.add('is-visible');
      if (!cursorFrame) cursorFrame = requestAnimationFrame(commitMove);
    }, { passive: true });
    document.addEventListener('pointerover', (event) => { if (cursorOn && event.pointerType === 'mouse') refreshCursorAction(); }, true);
    document.addEventListener('pointerout', (event) => {
      if (!cursorOn) return;
      /* No relatedTarget means the pointer left the document entirely. */
      if (!event.relatedTarget) { cursor.classList.remove('is-visible'); updateCursorAction(null); releaseCursor(); return; }
      refreshCursorAction();
    }, true);
    document.addEventListener('click', () => { if (cursorOn) refreshCursorAction(); }, true);
    addEventListener('scroll', (event) => {
      /* Capture phase sees element scrolls too — and the skills marquee writes
         scrollLeft on six lanes every frame. Only the page moving under the
         pointer can change what is beneath it. */
      if (!cursorOn) return;
      if (event.target !== document && event.target !== document.documentElement && event.target !== window) return;
      refreshCursorAction();
    }, { passive: true, capture: true });
    addEventListener('pointerdown', (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') { setCursorMode(false); return; }
      if (cursorOn && event.target instanceof Element && event.target.closest('[data-cursor],a,button,[role="button"]')) root.classList.add('cursor-press');
    }, { passive: true });
    addEventListener('pointerup', releaseCursor, { passive: true });
    addEventListener('pointercancel', releaseCursor, { passive: true });
    /* Leaving or re-entering the window: WebKit drops `cursor:none` when the
       window loses focus, so the class is re-asserted on the way back in. */
    addEventListener('blur', () => { releaseCursor(); cursor.classList.remove('is-visible'); });
    addEventListener('focus', () => {
      if (!cursorOn) return;
      root.classList.remove('cur');
      requestAnimationFrame(() => root.classList.add('cur'));
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { releaseCursor(); cursor.classList.remove('is-visible'); } });
  } else {
    document.getElementById('cursor')?.setAttribute('hidden', '');
  }

  /* Magnetic pull on the hero CTAs — restored after the legacy cursor block retired. */
  if (finePointer && !reduceMotion && window.gsap) {
    document.querySelectorAll('.magnetic').forEach((element) => {
      const moveX = gsap.quickTo(element, 'x', { duration: 0.45, ease: 'power3.out' });
      const moveY = gsap.quickTo(element, 'y', { duration: 0.45, ease: 'power3.out' });
      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        const factor = rect.width > 300 ? 0.12 : 0.28;
        moveX((event.clientX - (rect.left + rect.width / 2)) * factor);
        moveY((event.clientY - (rect.top + rect.height / 2)) * factor);
      });
      element.addEventListener('pointerleave', () => { moveX(0); moveY(0); });
    });
  }
})();
