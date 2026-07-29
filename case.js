/* case.js — progressive enhancement for the case-study routes.
 *
 * Everything here is additive. With this file blocked or failing, the page is
 * still complete: all copy is in the markup, the contents list is a plain list
 * of anchors, and the theme falls back to whatever the inline <head> script
 * already set. Nothing below is allowed to be the only copy of anything.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- theme: same key and semantics as the homepage ---------------- */

  var toggle = document.getElementById('themeToggle');

  function paint(theme) {
    root.dataset.theme = theme;
    if (!toggle) return;
    var light = theme === 'light';
    toggle.setAttribute('aria-pressed', String(light));
    toggle.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
  }

  paint(root.dataset.theme === 'light' ? 'light' : 'dark');

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.dataset.theme === 'light' ? 'dark' : 'light';
      paint(next);
      try { localStorage.setItem('ysf-theme', next); } catch (_) {}
    });
  }

  /* ---- header height ------------------------------------------------
   * The contents bar sticks directly beneath the fixed header, and the
   * header's height depends on the font size and whether the nav has
   * wrapped. Measuring beats guessing: a stale constant left the bar's
   * label tucked underneath.
   */
  var head = document.querySelector('.site-head');
  /* These are written to the element that DECLARES them. case.css sets
     --cs-head-h in the `.cs-body` block, i.e. on <body>; writing the measured
     value to <html> as this used to left the declaration on <body> shadowing
     the inherited value, so the measurement never reached the contents bar and
     the stale 93px literal was what actually applied. The header composes to
     78.6px, so the bar sat 14px too low and the page scrolled through the strip
     between them — the gap you could see through. */
  var hostEl = document.querySelector('.cs-body') || document.body;
  var toc = document.querySelector('.cs-toc');

  function syncHeadHeight() {
    if (!head) return;
    // Only offset when the header is actually pinned over the content.
    var fixed = getComputedStyle(head).position === 'fixed';
    hostEl.style.setProperty('--cs-head-h', fixed ? head.getBoundingClientRect().height.toFixed(2) + 'px' : '0px');
    /* The contents bar's own height feeds every section's scroll-margin, and
       nothing measured it either — anchor jumps landed 19px behind the bar. */
    if (toc) {
      var sticky = getComputedStyle(toc).position === 'sticky';
      hostEl.style.setProperty('--cs-toc-h', sticky ? toc.getBoundingClientRect().height.toFixed(2) + 'px' : '0px');
    }
  }

  syncHeadHeight();
  window.addEventListener('resize', syncHeadHeight, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncHeadHeight).catch(function () {});

  /* ---- reveal on scroll --------------------------------------------
   * Mirrors the homepage's ScrollTrigger.batch: fire once when a block
   * reaches 88% of the viewport, lift it from y:40/opacity:0 over 0.95s,
   * and stagger a batch by 0.08s. IntersectionObserver rather than GSAP,
   * because these routes have no other use for the animation bundle.
   *
   * .cs-anim is set here, not in the markup, so a page whose script never
   * runs is never left with hidden content.
   */

  var revealables = document.querySelectorAll('[data-reveal]');

  if (revealables.length && 'IntersectionObserver' in window) {
    if (reduced) {
      // No hiding at all — the class is what hides things.
      revealables.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      root.classList.add('cs-anim');

      var show = function (el, delay) {
        el.style.setProperty('--d', delay.toFixed(2) + 's');
        el.classList.add('is-in');
        var label = el.querySelector('.sec-label') || (el.classList.contains('sec-label') ? el : null);
        if (label) label.classList.add('drawn');
        /* The measuring rail under every section head is clipped to zero width
           by styles.css and drawn open by the homepage's GSAP. Nothing on these
           routes ever opened it, so the site's signature rule — and the accent
           spark that rides its right end — was invisible on all thirteen
           sections of every case study. */
        var rail = el.querySelector('.sec-rail');
        if (rail) rail.classList.add('drawn');
      };

      var observer = new IntersectionObserver(
        function (entries) {
          // Batch whatever crossed in the same frame, then stagger it.
          var arrived = entries.filter(function (e) { return e.isIntersecting; });
          arrived.forEach(function (entry, i) {
            // Cap the cascade. On the homepage a batch is a handful of blocks,
            // but an anchor jump can hand this callback the whole page at once
            // — an uncapped 0.08s stagger would leave the tail sitting invisible
            // for over two seconds.
            show(entry.target, Math.min(i, 5) * 0.08);
            observer.unobserve(entry.target);
          });
        },
        // Bottom margin cuts the trigger line to 88% of the viewport, matching
        // the homepage. The very large TOP margin is load-bearing: a contents-
        // bar anchor jumps instantly, and anything the jump skipped over would
        // never register an intersecting frame — leaving those sections stuck
        // at opacity 0 for anyone who then scrolled back up. Extending the root
        // upwards means "already passed" counts as arrived.
        { rootMargin: '200000px 0px -12% 0px', threshold: 0.01 }
      );

      revealables.forEach(function (el) {
        // Anything already on screen at load should not wait for a scroll.
        if (el.getBoundingClientRect().top < window.innerHeight * 0.88) {
          show(el, 0);
        } else {
          observer.observe(el);
        }
      });
    }
  }

  /* ---- easter egg: type "egypt" -------------------------------------
   * A cheat code, so it behaves like one: type it anywhere, the site
   * repaints in the flag, and typing it again puts it back. The choice
   * persists so it survives a click through to a case study.
   */
  (function egyptEgg() {
    var CODE = 'egypt';
    var buf = '';
    var toast;

    function announce(on) {
      if (!toast) {
        toast = document.createElement('p');
        toast.className = 'egg-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.innerHTML = '<i aria-hidden="true"></i><span></span>';
        document.body.appendChild(toast);
      }
      toast.querySelector('span').textContent = on ? 'Cheat code activated' : 'Cheat code cleared';
      toast.classList.add('is-on');
      clearTimeout(announce.t);
      announce.t = setTimeout(function () { toast.classList.remove('is-on'); }, 2600);
    }

    /* The same cover the homepage raises, so the egg feels identical whichever
       route the visitor types it on. These routes carry no `.site-loader` of
       their own, but the sheet is entirely self-contained — including the 5s
       `loaderGiveUp` that stops it ever being the last thing on screen. */
    function raiseVeil() {
      var el = document.createElement('div');
      el.className = 'site-loader egg-veil';
      el.setAttribute('aria-hidden', 'true');
      var mark = document.createElement('span');
      mark.className = 'loader-mark';
      for (var i = 0; i < 4; i++) mark.appendChild(document.createElement('i'));
      var name = document.createElement('span');
      name.className = 'loader-name';
      name.textContent = 'YSF.SLM';
      el.appendChild(mark);
      el.appendChild(name);
      document.body.appendChild(el);
      void el.offsetWidth;
      el.classList.add('is-on');
      // If the reload never lands, the cover takes itself off.
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2600);
    }

    function apply(on, loud) {
      try {
        on ? localStorage.setItem('ysf-egypt', '1') : localStorage.removeItem('ysf-egypt');
        // Survives the reload so the toast still lands on the other side.
        if (loud) sessionStorage.setItem('ysf-egypt-said', on ? 'on' : 'off');
      } catch (_) {}
      document.documentElement.classList.toggle('egypt', on);
      if (!loud) return;
      /* Reload rather than live-patch. The halftone morph canvas is rendered
         once from the source images, and the name/figure geometry is measured
         once at boot — repainting in place would leave the dots, the seating
         and the scroll choreography describing the previous photograph.

         The reload goes out behind the flag: a 350ms fade, then the sheet
         holds through the navigation. A clean cut under reduced motion. */
      announce(on);
      if (!reduced) raiseVeil();
      setTimeout(function () { location.reload(); }, 820);
    }

    // Announce on the far side of that reload.
    try {
      var said = sessionStorage.getItem('ysf-egypt-said');
      if (said) { sessionStorage.removeItem('ysf-egypt-said'); setTimeout(function () { announce(said === 'on'); }, 420); }
    } catch (_) {}

    var offBtn = document.getElementById('eggOff');
    if (offBtn) {
      offBtn.hidden = !document.documentElement.classList.contains('egypt');
      offBtn.addEventListener('click', function () { apply(false, true); });
    }

    addEventListener('keydown', function (e) {
      // Never swallow a keystroke meant for a field or a shortcut.
      var t = e.target;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key.length !== 1) return;
      buf = (buf + e.key.toLowerCase()).slice(-CODE.length);
      if (buf === CODE) {
        buf = '';
        apply(!document.documentElement.classList.contains('egypt'), true);
      }
    });
  })();

  /* ---- reading progress -------------------------------------------- */

  var bar = null;
  if (!reduced) {
    bar = document.createElement('div');
    bar.className = 'cs-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
  }

  /* ---- contents: mark the section you are actually reading ---------- */

  var links = Array.prototype.slice.call(document.querySelectorAll('.cs-toc a'));
  var targets = links
    .map(function (a) {
      var id = a.getAttribute('href').slice(1);
      var el = document.getElementById(id);
      return el ? { a: a, el: el } : null;
    })
    .filter(Boolean);

  var current = null;

  function onScroll() {
    if (bar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty('--p', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : '0');
    }

    if (!targets.length) return;
    // The section whose top has most recently passed a third of the viewport.
    var line = window.innerHeight * 0.33;
    var found = targets[0];
    for (var i = 0; i < targets.length; i++) {
      if (targets[i].el.getBoundingClientRect().top <= line) found = targets[i];
    }
    if (found === current) return;
    if (current) current.a.classList.remove('is-current');
    found.a.classList.add('is-current');
    current = found;
  }

  var ticking = false;
  window.addEventListener(
    'scroll',
    function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        onScroll();
        ticking = false;
      });
    },
    { passive: true }
  );

  onScroll();
})();
