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
