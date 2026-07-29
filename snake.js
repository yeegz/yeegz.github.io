/* =========================================================================
 * Eagle snake — the second secret inside the "egypt" egg.
 * -------------------------------------------------------------------------
 * With the flag on, triple-clicking SELIM opens a snake game whose playfield
 * is masked to the Eagle of Saladin. With the flag off the word behaves
 * exactly as it always has — the existing name game in script.js owns it, and
 * nothing here fires.
 *
 * Its own file rather than a graft onto script.js or approved.js: script.js
 * already owns SELIM for the pixel-creature game and is the one file whose
 * regression would take the hero down with it, and approved.js runs on the
 * case-study routes where there is no hero to attach to. A separate file
 * loaded only from index.html keeps the blast radius at "the game does not
 * open" — the page cannot be broken by anything below.
 * ========================================================================= */

(function eagleSnake() {
  'use strict';

  var root = document.documentElement;
  var nmLast = document.getElementById('nmLast');
  if (!nmLast || !document.body) return;

  var GOLD = '#d4a017';
  var GOLD_LIT = '#f2cd6b';
  var RED = '#ce1126';

  /* ---- the field -------------------------------------------------------
     The eagle as a coarse boolean grid, hand-authored rather than traced off
     the flag's artwork: a traced outline yields single-cell slivers a snake
     can enter but never turn around in, which reads as a bug rather than as
     difficulty. Wings are a horizontal band with the trailing edge swept
     down, the head carries a beak to the left, and the fan tail sits on the
     scroll. Every open cell is reachable from the start cell — flood-filled
     before this was pasted in, 389 cells, no islands and no dead pockets
     narrower than two. */
  var EAGLE = [
    '................####................',
    '...............######...............',
    '............#########...............',
    '.............########...............',
    '...............######...............',
    '.........##################.........',
    '...##############################...',
    '####################################',
    '####################################',
    '####################################',
    '.##################################.',
    '....############################....',
    '........####################........',
    '............############............',
    '..............########..............',
    '..............########..............',
    '.............##########.............',
    '...........##############...........',
    '...........##############...........',
    '............############............',
    '........####################........',
    '........####################........'
  ];
  var COLS = EAGLE[0].length;
  var ROWS = EAGLE.length;
  var free = function (x, y) {
    return y >= 0 && y < ROWS && x >= 0 && x < COLS && EAGLE[y].charAt(x) === '#';
  };

  var BEST_KEY = 'ysf-snake-best';
  var readBest = function () {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (_) { return 0; }
  };
  var writeBest = function (n) {
    try { localStorage.setItem(BEST_KEY, String(n)); } catch (_) {}
  };

  var reducedMQ = matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return reducedMQ.matches; };

  /* ---- state ----------------------------------------------------------- */
  var live = null;   // everything the open game owns; null when closed

  var DIRS = {
    arrowup: [0, -1], arrowdown: [0, 1], arrowleft: [-1, 0], arrowright: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0]
  };
  var HEADING = { '0,-1': 'up', '0,1': 'down', '-1,0': 'left', '1,0': 'right' };

  /* ---- chrome ----------------------------------------------------------- */
  function build() {
    var el = function (tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text) n.textContent = text;
      return n;
    };

    var overlay = el('div', 'snk');
    overlay.id = 'snkOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'snkTitle');
    overlay.dataset.state = 'running';

    var frame = el('div', 'snk-frame');
    frame.tabIndex = -1;

    var bar = el('header', 'snk-bar');
    var title = el('p', 'snk-kicker', 'Snake — the Eagle of Saladin');
    title.id = 'snkTitle';
    var scores = el('p', 'snk-scores');
    var scoreVal = el('b', 'snk-num', '0');
    var bestVal = el('b', 'snk-num', String(readBest()));
    scores.appendChild(el('span', null, 'Score'));
    scores.appendChild(scoreVal);
    scores.appendChild(el('span', 'snk-sep', '/'));
    scores.appendChild(el('span', null, 'Best'));
    scores.appendChild(bestVal);
    var close = el('button', 'snk-btn snk-close', 'Close');
    close.type = 'button';
    var closeX = el('span', null, '✕');
    closeX.setAttribute('aria-hidden', 'true');
    close.appendChild(closeX);
    bar.appendChild(title);
    bar.appendChild(scores);
    bar.appendChild(close);

    var stage = el('div', 'snk-stage');
    var canvas = el('canvas', 'snk-canvas');
    canvas.id = 'snkCanvas';
    stage.appendChild(canvas);

    var over = el('div', 'snk-over');
    over.hidden = true;
    over.appendChild(el('p', 'snk-over-t', 'Game over'));
    var overLine = el('p', 'snk-over-s', '');
    over.appendChild(overLine);
    var again = el('button', 'snk-btn snk-again', 'Play again');
    again.type = 'button';
    over.appendChild(again);
    stage.appendChild(over);

    var hint = el('p', 'snk-hint', 'Arrows or WASD to steer · swipe on touch · Esc to close');
    var lives = el('p', 'vh', '');
    lives.setAttribute('role', 'status');
    lives.setAttribute('aria-live', 'polite');

    frame.appendChild(bar);
    frame.appendChild(stage);
    frame.appendChild(hint);
    frame.appendChild(lives);
    overlay.appendChild(frame);

    return {
      overlay: overlay, frame: frame, canvas: canvas, stage: stage,
      scoreVal: scoreVal, bestVal: bestVal, over: over, overLine: overLine,
      close: close, again: again, lives: lives
    };
  }

  /* ---- painting ---------------------------------------------------------
     The eagle is drawn once per frame under the snake: a whisper of gold fill
     inside the mask, the silhouette stroked along the cell edges where inside
     meets outside, then the details that make it the flag's bird rather than a
     generic blob — the chest shield in the three bands, an eye, feather rays
     across the wings, the rule across the scroll. All of it decoration: the
     mask above is the only thing the snake collides with. */
  function paintEagle(ctx, cell) {
    var path = new Path2D();
    var edges = new Path2D();
    var x, y;
    for (y = 0; y < ROWS; y++) {
      for (x = 0; x < COLS; x++) {
        if (!free(x, y)) continue;
        path.rect(x * cell, y * cell, cell, cell);
        var l = x * cell + 0.5, t = y * cell + 0.5;
        var r = (x + 1) * cell - 0.5, b = (y + 1) * cell - 0.5;
        if (!free(x, y - 1)) { edges.moveTo(l - 0.5, t); edges.lineTo(r + 0.5, t); }
        if (!free(x, y + 1)) { edges.moveTo(l - 0.5, b); edges.lineTo(r + 0.5, b); }
        if (!free(x - 1, y)) { edges.moveTo(l, t - 0.5); edges.lineTo(l, b + 0.5); }
        if (!free(x + 1, y)) { edges.moveTo(r, t - 0.5); edges.lineTo(r, b + 0.5); }
      }
    }

    ctx.save();
    ctx.fillStyle = 'rgba(212, 160, 23, 0.055)';
    ctx.fill(path);

    /* Details are clipped to the bird so nothing bleeds into the walls. */
    ctx.clip(path);
    ctx.lineWidth = 1;

    /* Flight feathers, fanning out of each shoulder and running the length of
       the wing — the clip stops every one of them at the silhouette. */
    ctx.strokeStyle = 'rgba(212, 160, 23, 0.22)';
    [-1, 1].forEach(function (side) {
      var px = (18 + side * 3.4) * cell;
      var py = 6.1 * cell;
      for (var i = 0; i <= 6; i++) {
        var t = (Math.PI / 180) * (-9 + i * 8.5);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + side * Math.cos(t) * 34 * cell, py + Math.sin(t) * 34 * cell);
        ctx.stroke();
      }
    });

    // Tail feathers, and the rule that reads as the scroll.
    [13.6, 15.6, 18, 20.4, 22.4].forEach(function (tx) {
      ctx.beginPath();
      ctx.moveTo(tx * cell, 15.6 * cell);
      ctx.lineTo(tx * cell, 19.9 * cell);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(7 * cell, 21 * cell);
    ctx.lineTo(29 * cell, 21 * cell);
    ctx.stroke();

    /* The chest shield: three vertical bands, the way the flag draws it —
       held right down in alpha, because the snake has to stay legible
       crossing it. */
    var sl = 15.4 * cell, sr = 20.6 * cell, st = 6.4 * cell, sm = 11.2 * cell, sb = 13.4 * cell;
    var shield = new Path2D();
    shield.moveTo(sl, st);
    shield.lineTo(sr, st);
    shield.lineTo(sr, sm);
    shield.quadraticCurveTo(sr, sb, (sl + sr) / 2, sb);
    shield.quadraticCurveTo(sl, sb, sl, sm);
    shield.closePath();
    ctx.save();
    ctx.clip(shield);
    var third = (sr - sl) / 3;
    ctx.fillStyle = 'rgba(206, 17, 38, 0.20)';
    ctx.fillRect(sl, st, third, sb - st);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.fillRect(sl + third, st, third, sb - st);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.fillRect(sl + third * 2, st, third, sb - st);
    ctx.restore();
    ctx.strokeStyle = 'rgba(212, 160, 23, 0.42)';
    ctx.stroke(shield);

    // The eye, on the beak side.
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(16.2 * cell, 2.5 * cell, cell * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 160, 23, 0.85)';
    ctx.beginPath();
    ctx.arc(16.2 * cell, 2.5 * cell, cell * 0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(212, 160, 23, 0.78)';
    ctx.lineWidth = 1;
    ctx.stroke(edges);
    ctx.restore();
  }

  function paint(g) {
    var ctx = g.ctx;
    var cell = g.cell;
    ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
    ctx.clearRect(0, 0, COLS * cell, ROWS * cell);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, COLS * cell, ROWS * cell);

    paintEagle(ctx, cell);

    // Food: the flag's red, hairlined in gold so it never disappears into black.
    var k = reduced() ? 1 : 0.86 + 0.14 * Math.sin(performance.now() / 210);
    var fs = Math.max(3, (cell - 3) * k);
    var fx = g.food.x * cell + (cell - fs) / 2;
    var fy = g.food.y * cell + (cell - fs) / 2;
    ctx.fillStyle = RED;
    ctx.fillRect(fx, fy, fs, fs);
    ctx.strokeStyle = 'rgba(212, 160, 23, 0.85)';
    ctx.lineWidth = 1;
    ctx.strokeRect(fx + 0.5, fy + 0.5, fs - 1, fs - 1);

    // Snake: gold, head lit, tail fading out.
    var n = g.snake.length;
    for (var i = n - 1; i >= 0; i--) {
      var seg = g.snake[i];
      ctx.globalAlpha = i === 0 ? 1 : 0.5 + 0.45 * (1 - i / n);
      ctx.fillStyle = i === 0 ? GOLD_LIT : GOLD;
      var inset = i === 0 ? 0.5 : 1.5;
      ctx.fillRect(seg.x * cell + inset, seg.y * cell + inset, cell - inset * 2, cell - inset * 2);
    }
    ctx.globalAlpha = 1;
  }

  /* ---- the game --------------------------------------------------------- */
  function measure(g) {
    var padX = window.innerWidth < 700 ? 16 : 30;
    var chrome = window.innerWidth < 700 ? 176 : 208;
    var cell = Math.floor(Math.min(
      (window.innerWidth - padX * 2) / COLS,
      (window.innerHeight - chrome) / ROWS
    ));
    g.cell = Math.max(5, Math.min(26, cell));
    g.dpr = Math.min(3, window.devicePixelRatio || 1);
    g.canvas.width = Math.round(COLS * g.cell * g.dpr);
    g.canvas.height = Math.round(ROWS * g.cell * g.dpr);
    g.canvas.style.width = COLS * g.cell + 'px';
    g.canvas.style.height = ROWS * g.cell + 'px';
    /* Line the chrome up with the field rather than with the viewport. */
    g.frame.style.maxWidth = Math.max(300, COLS * g.cell + 2) + 'px';
  }

  function placeFood(g) {
    var open = [];
    for (var y = 0; y < ROWS; y++) {
      for (var x = 0; x < COLS; x++) {
        if (!free(x, y)) continue;
        var taken = g.snake.some(function (s) { return s.x === x && s.y === y; });
        if (!taken) open.push({ x: x, y: y });
      }
    }
    g.food = open.length ? open[Math.floor(Math.random() * open.length)] : { x: 4, y: 8 };
  }

  function reset(g) {
    /* Row 8 is the full-span band through the wings, so the opening run is
       clear whichever way the first key sends it. */
    g.snake = [{ x: 6, y: 8 }, { x: 5, y: 8 }, { x: 4, y: 8 }];
    g.dir = [1, 0];
    g.queue = [];
    g.score = 0;
    g.dead = false;
    g.step = 135;
    g.acc = 0;
    g.last = 0;
    placeFood(g);
    g.scoreVal.textContent = '0';
    g.over.hidden = true;
    g.overlay.dataset.state = 'running';
    g.canvas.dataset.heading = 'right';
  }

  function steer(g, d) {
    if (g.dead) return;
    var from = g.queue.length ? g.queue[g.queue.length - 1] : g.dir;
    if (d[0] === -from[0] && d[1] === -from[1]) return;   // no instant reversal
    if (d[0] === from[0] && d[1] === from[1]) return;
    if (g.queue.length < 2) g.queue.push(d);
  }

  function die(g) {
    g.dead = true;
    g.overlay.dataset.state = 'over';
    var best = readBest();
    var record = g.score > best;
    if (record) { writeBest(g.score); g.bestVal.textContent = String(g.score); }
    g.overLine.textContent = record
      ? 'New best — ' + g.score + '. Enter to fly again.'
      : g.score + ' collected. Best ' + readBest() + '. Enter to fly again.';
    g.over.hidden = false;
    g.lives.textContent = 'Game over. Score ' + g.score + '.';
    g.again.focus({ preventScroll: true });
  }

  function tick(g) {
    if (g.queue.length) g.dir = g.queue.shift();
    g.canvas.dataset.heading = HEADING[g.dir[0] + ',' + g.dir[1]] || 'right';
    var head = { x: g.snake[0].x + g.dir[0], y: g.snake[0].y + g.dir[1] };
    if (!free(head.x, head.y)) { die(g); return; }
    var eating = head.x === g.food.x && head.y === g.food.y;
    var body = eating ? g.snake : g.snake.slice(0, -1);
    if (body.some(function (s) { return s.x === head.x && s.y === head.y; })) { die(g); return; }
    g.snake.unshift(head);
    if (eating) {
      g.score++;
      g.scoreVal.textContent = String(g.score);
      g.lives.textContent = 'Score ' + g.score;
      g.step = Math.max(72, 135 - g.score * 2.5);
      placeFood(g);
    } else {
      g.snake.pop();
    }
  }

  function frame(now) {
    var g = live;
    if (!g) return;
    g.raf = requestAnimationFrame(frame);
    if (!g.last) g.last = now;
    var dt = Math.min(240, now - g.last);
    g.last = now;
    if (!g.dead) {
      g.acc += dt;
      while (g.acc >= g.step && !g.dead) { g.acc -= g.step; tick(g); }
    }
    paint(g);
  }

  /* ---- open / close ----------------------------------------------------- */
  function focusable(g) {
    return [g.close, g.again].filter(function (b) { return b.offsetParent !== null || b === g.close; });
  }

  function onKey(e) {
    var g = live;
    if (!g) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key || '';

    if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); closeGame(); return; }

    if (k === 'Tab') {
      e.stopPropagation();
      var list = focusable(g);
      if (!list.length) { e.preventDefault(); g.frame.focus(); return; }
      var first = list[0], last = list[list.length - 1], activeEl = document.activeElement;
      /* Includes the frame itself, which holds focus while a run is going —
         shift-tabbing off it would walk straight out of a modal dialog. */
      if (list.indexOf(activeEl) === -1) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; }
      if (e.shiftKey && activeEl === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && activeEl === last) { e.preventDefault(); first.focus(); }
      return;
    }

    /* The dialog is modal, so nothing below it should hear a keystroke — not
       least the "egypt" code itself, which would reload the page mid-run. */
    e.stopPropagation();

    var d = DIRS[k.toLowerCase()];
    if (d) { e.preventDefault(); steer(g, d); return; }

    /* Enter restarts — unless a button has focus, in which case the button is
       what the visitor means to press. */
    if ((k === 'Enter' || k === ' ') && g.dead) {
      var onButton = document.activeElement && document.activeElement.tagName === 'BUTTON';
      if (!onButton) { e.preventDefault(); reset(g); g.frame.focus(); }
    }
  }

  function onResize() {
    if (live) measure(live);
  }

  function openGame() {
    if (live) return;
    if (!root.classList.contains('egypt')) return;
    if (root.classList.contains('gaming')) return;      // the name game has the hero

    var g = build();
    var ctx;
    try { ctx = g.canvas.getContext('2d'); } catch (_) { ctx = null; }
    if (!ctx) return;                                    // no canvas, no game, no damage
    g.ctx = ctx;

    g.scrollY = window.scrollY || window.pageYOffset || 0;
    g.returnTo = nmLast;
    live = g;

    document.body.appendChild(g.overlay);
    measure(g);
    reset(g);

    root.classList.add('snake-on');
    if (window.lenis && window.lenis.stop) window.lenis.stop();
    try { window.getSelection().removeAllRanges(); } catch (_) {}

    g.close.addEventListener('click', closeGame);
    g.again.addEventListener('click', function () { reset(g); g.frame.focus(); });
    document.addEventListener('keydown', onKey, true);
    addEventListener('resize', onResize, { passive: true });

    /* Swipe to steer. The stage swallows touchmove so the page behind cannot
       scroll out from under a game that is meant to be modal. */
    var sx = 0, sy = 0, swiping = false;
    g.stage.addEventListener('touchstart', function (e) {
      var t = e.changedTouches[0];
      sx = t.clientX; sy = t.clientY; swiping = true;
    }, { passive: true });
    g.stage.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
    g.stage.addEventListener('touchend', function (e) {
      if (!swiping) return;
      swiping = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
      steer(g, Math.abs(dx) > Math.abs(dy) ? [dx > 0 ? 1 : -1, 0] : [0, dy > 0 ? 1 : -1]);
    }, { passive: true });

    /* Twice: the press that opened this is still mid-flight, and the browser
       moves focus on mousedown after every handler has run. */
    g.frame.focus({ preventScroll: true });
    requestAnimationFrame(function () { if (live === g) g.frame.focus({ preventScroll: true }); });
    g.lives.textContent = 'Snake started. Score 0.';
    g.raf = requestAnimationFrame(frame);
  }

  function closeGame() {
    var g = live;
    if (!g) return;
    live = null;
    if (g.raf) cancelAnimationFrame(g.raf);
    document.removeEventListener('keydown', onKey, true);
    removeEventListener('resize', onResize);
    g.overlay.remove();
    root.classList.remove('snake-on');
    if (window.lenis && window.lenis.start) window.lenis.start();
    window.scrollTo(0, g.scrollY);
    if (g.returnTo) {
      if (!g.returnTo.hasAttribute('tabindex')) g.returnTo.setAttribute('tabindex', '-1');
      g.returnTo.focus({ preventScroll: true });
    }
  }

  /* ---- the way in -------------------------------------------------------
     Three quick presses on SELIM, and only under the flag.

     The name game in script.js counts pointerdowns on the same word and opens
     at three. Its guard against this — `e.detail <= 1` — never bites, because
     a PointerEvent reports detail 0, so a triple-click already reaches it. So
     the third press of a fast run is stopped here instead: it is caught in the
     capture phase on the document, which runs before any listener bound to the
     word itself, and goes no further. One and two presses still reach the name
     game exactly as before, and with the egg off this handler returns on its
     first line and the word is untouched. */
  var taps = 0;
  var lastTap = -1e6;
  var swallowUntil = -1e6;
  var onWord = function (e) { return e.target === nmLast || nmLast.contains(e.target); };

  document.addEventListener('pointerdown', function (e) {
    if (!onWord(e)) return;
    if (!root.classList.contains('egypt')) return;
    if (e.button) return;
    taps = (e.timeStamp - lastTap > 640) ? 1 : taps + 1;
    lastTap = e.timeStamp;
    if (taps < 3) return;
    taps = 0;
    swallowUntil = e.timeStamp + 900;
    e.stopPropagation();
    /* Also stops the selection the third click would drag across the line. */
    e.preventDefault();
    openGame();
  }, true);

  /* The clicks the browser fires after that press would otherwise reach the
     touch egg's fact chip, which is bound to `click` on the same word. */
  document.addEventListener('click', function (e) {
    if (!onWord(e) || e.timeStamp > swallowUntil) return;
    e.stopPropagation();
    e.preventDefault();
  }, true);

  /* Triple-click is a pointer gesture. Keyboard visitors get the same door,
     hidden until focused, the way the name game's entry point is. */
  if (root.classList.contains('egypt')) {
    /* The hero is pointer-events: none but for the pieces that opt back in,
       and script.js only opts SELIM in from code paths that never run under
       prefers-reduced-motion — which left the word unclickable there. Say it
       here too, so the way in does not depend on the animation path. */
    var line = nmLast.closest('.nm-line');
    if (line) line.style.pointerEvents = 'auto';

    var host = document.getElementById('heroName');
    if (host && host.parentNode) {
      var key = document.createElement('button');
      key.type = 'button';
      key.className = 'vh egg-key';
      key.textContent = 'Play the eagle snake game';
      key.addEventListener('click', openGame);
      host.parentNode.insertBefore(key, host.nextSibling);
    }
  }
})();
