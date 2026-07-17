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
  const critical = [document.getElementById('portrait'), document.getElementById('gardenImg')].filter(Boolean);
  const mediaReady = Promise.all(critical.map((image) => {
    if (image.complete && image.naturalWidth) return Promise.resolve();
    return typeof image.decode === 'function' ? image.decode().catch(() => {}) : new Promise((resolve) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    });
  }));
  window.siteReady = Promise.race([Promise.all([document.fonts?.ready || Promise.resolve(), mediaReady]), wait(1050)]).then(async () => {
    await wait(120);
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
  skillLanes.forEach((lane, index) => {
    const scroller = lane.querySelector('.skill-scroller');
    const set = lane.querySelector('.tool-set');
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
      nudge(direction);
      if (event.detail > 0) event.currentTarget.blur();
    };
    lane.querySelector('.prev')?.addEventListener('click', (event) => nudgeFromControl(event, -1));
    lane.querySelector('.next')?.addEventListener('click', (event) => nudgeFromControl(event, 1));
  });
  let skillLast = performance.now();
  const moveSkills = (now) => {
    const delta = Math.min(32, now - skillLast);
    skillLast = now;
    if (!reduceMotion && !document.hidden) skillLanes.forEach((lane, index) => {
      const scroller = lane.querySelector('.skill-scroller');
      const width = lane.querySelector('.tool-set')?.offsetWidth || 0;
      if (!width) return;
      if (lane.matches(':hover') || lane.contains(document.activeElement)) {
        skillPositions[index] = scroller.scrollLeft;
        return;
      }
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
      ghost: '2027', no: 'Chapter 02 / Current', title: 'BSc (Hons) Software Engineering', type: 'Expected 2027',
      institutions: [['Sunway University', 'Malaysia'], ['Lancaster University', 'United Kingdom']],
      status: 'Subang Jaya, Malaysia<br>Dual-degree programme<br>In progress',
      courses: ['Software Architecture', 'Data Structures', 'Mobile Development', 'Databases', 'UI / UX Design']
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
    });
    chapter?.classList.remove('change');
    void chapter?.offsetWidth;
    chapter?.classList.add('change');
  };
  chapterTabs.forEach((tab) => tab.addEventListener('click', () => showChapter(tab.dataset.chapter)));
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
    const calTick = (now) => {
      const delta = Math.min(48, now - calLast);
      calLast = now;
      const max = calendar.scrollWidth - calendar.clientWidth;
      if (max > 8) {
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
    document.querySelectorAll('.filter').forEach((item) => item.classList.toggle('active', !same && item === button));
  }));

  /* Contact drag, bounded and springing home. */
  const contact = document.getElementById('contact');
  const mail = document.getElementById('dragMail');
  const mailTrack = document.getElementById('mailTrack');
  let dragging = false, dragMoved = false, suppressMailClick = false, dragStartX = 0, dragStartY = 0;
  contact?.addEventListener('pointermove', (event) => {
    const section = contact.getBoundingClientRect();
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
  });
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
  const projectNames = ['bupples', 'photoshoot', 'adelante', 'asteri'];
  const projectMeta = {
    bupples: { label: '01 / Bupples', surface: '#050b07', color: '#f4f0e7' },
    photoshoot: { label: '02 / Photoshoot', surface: '#e9e3d6', color: '#24221f' },
    adelante: { label: '03 / Adelante', surface: '#faf7f0', color: '#15130f' },
    asteri: { label: '04 / Fallen Asteri', surface: '#120909', color: '#f4e8d7' }
  };
  let currentProject = '', projectOpener = null, projectScroll = 0, theaterBusy = false;
  let pendingProjectSteps = 0, pendingProjectClose = false;
  /* Phones keep cases self-contained on the card (links included), so the
     theater never opens there and its openers stop being buttons at all. */
  const phoneCards = matchMedia('(max-width: 760px)');
  const syncCardMode = () => {
    document.querySelectorAll('[data-open-project]').forEach((button) => { button.disabled = phoneCards.matches; });
  };
  syncCardMode();
  if (phoneCards.addEventListener) phoneCards.addEventListener('change', syncCardMode);
  else if (phoneCards.addListener) phoneCards.addListener(syncCardMode);
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
    theaterBusy = true; pendingProjectSteps = 0; pendingProjectClose = false; projectOpener = opener; projectScroll = scrollY;
    const row = opener.getBoundingClientRect();
    theater.style.setProperty('--wash-top', `${Math.max(0, row.top)}px`);
    theater.style.setProperty('--wash-right', `${Math.max(0, innerWidth - row.right)}px`);
    theater.style.setProperty('--wash-bottom', `${Math.max(0, innerHeight - row.bottom)}px`);
    theater.style.setProperty('--wash-left', `${Math.max(0, row.left)}px`);
    showProject(name);
    if (typeof theater.show === 'function') theater.show();
    else theater.setAttribute('open', '');
    isolateTheater(true);
    root.classList.add('project-open');
    window.lenis?.stop?.();
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
    await transitionDone(theaterWash, 'clip-path', 980);
    theater.close(); theater.classList.remove('is-closing');
    isolateTheater(false);
    window.lenis?.start?.(); window.scrollTo(0, projectScroll); projectOpener?.focus({ preventScroll: true }); completeTheaterAction();
  };
  document.querySelectorAll('[data-open-project]').forEach((button) => button.addEventListener('click', () => openProject(button.dataset.openProject, button)));
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
    await wait(260);
    outgoing?.classList.remove('stage-switching', 'stage-out');
    showProject(nextName);
    incoming.classList.add('stage-switching', 'stage-in');
    void incoming.offsetWidth;
    requestAnimationFrame(() => incoming.classList.remove('stage-in'));
    await wait(460);
    incoming.classList.remove('stage-switching');
    completeTheaterAction();
  };
  theater?.querySelectorAll('[data-project-nav]').forEach((button) => button.addEventListener('click', () => {
    navigateProject(button.dataset.projectNav === 'next' ? 1 : -1);
  }));

  /* Bupples parallax without separating the approved phone overlap. */
  const bupples = document.querySelector('[data-project-stage="bupples"]');
  bupples?.addEventListener('pointermove', (event) => {
    const rect = bupples.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    bupples.style.setProperty('--lpx', `${x * -18}px`); bupples.style.setProperty('--lpy', `${y * -11}px`);
    bupples.style.setProperty('--cpx', `${x * 12}px`); bupples.style.setProperty('--cpy', `${y * 8}px`);
    bupples.style.setProperty('--rpx', `${x * 20}px`); bupples.style.setProperty('--rpy', `${y * 12}px`);
    bupples.style.setProperty('--bgx', `${x * -7}px`); bupples.style.setProperty('--bgy', `${y * -7}px`);
  });
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
  const adelanteMessages = ['Adelante is Spanish for “go forward.”', 'Even the smallest step is still forward.'];
  let adelanteMessage = 0;
  document.getElementById('aMark')?.addEventListener('pointerenter', async () => {
    const line = document.getElementById('forwardLine'); line.classList.add('changing'); await wait(80);
    line.textContent = adelanteMessages[adelanteMessage]; adelanteMessage = (adelanteMessage + 1) % adelanteMessages.length; line.classList.remove('changing');
  });

  /* Photoshoot session, preserving each approved focal point. */
  const photos = [
    ['images/projects/photoshoot/subject-01.jpg', '50% 56%'],
    ['images/projects/photoshoot/subject-02.jpg', '50% 35%'],
    ['images/projects/photoshoot/subject-03.jpg', '50% 37%'],
    ['images/projects/photoshoot/subject-04.jpg', '50% 40%']
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

  /* One corrected cursor system. No second transform or legacy margin math. */
  if (finePointer) {
    const cursor = document.getElementById('cursor'), label = document.getElementById('cursorLabel');
    root.classList.add('cur');
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

    let sizedAction = null;
    const updateCursorAction = (target) => {
      const element = target instanceof Element ? target : null;
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
    window.addEventListener('pointermove', (event) => {
      cursorX = event.clientX; cursorY = event.clientY; if (!cursorFrame) cursorFrame = requestAnimationFrame(paint);
      cursor.classList.add('is-visible');
      updateCursorAction(event.target);
    }, { passive: true });
    document.addEventListener('pointerover', (event) => updateCursorAction(event.target), true);
    document.addEventListener('pointerout', refreshCursorAction, true);
    document.addEventListener('click', refreshCursorAction, true);
    addEventListener('scroll', refreshCursorAction, { passive: true, capture: true });
    addEventListener('pointerdown', (event) => {
      if (event.target instanceof Element && event.target.closest('[data-cursor],a,button,[role="button"]')) root.classList.add('cursor-press');
    });
    const releaseCursor = () => root.classList.remove('cursor-press');
    addEventListener('pointerup', releaseCursor);
    addEventListener('pointercancel', releaseCursor);
    addEventListener('blur', releaseCursor);
    document.documentElement.addEventListener('mouseleave', () => {
      cursor.classList.remove('is-visible');
      updateCursorAction(null);
      releaseCursor();
    });
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
