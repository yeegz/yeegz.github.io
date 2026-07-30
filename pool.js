/* =========================================================================
 * EIGHT BALL — the "pool" egg.
 * -------------------------------------------------------------------------
 * Type "pool" anywhere that is not a text field and a table racks up over
 * the page.
 *
 * Its own file for the reason snake.js and contra.js are: script.js owns the
 * hero and approved.js runs on routes with no hero to attach to, so the worst
 * failure available here is "the word does nothing".
 *
 * The physics is written out rather than pulled in — equal-mass elastic
 * collisions resolved along the contact normal, cushions with restitution,
 * rolling friction, and a fixed 240Hz substep so a ball cannot pass through
 * another between frames. No library, no assets, one file.
 * ========================================================================= */

(function eightBall() {
  'use strict';

  var root = document.documentElement;
  if (!document.body) return;

  var canPlay = matchMedia('(min-width: 720px)').matches;

  /* ---- table ------------------------------------------------------------
     Real proportions: a nine-foot table is 2:1, so the playfield is too. */
  var TW = 800, TH = 400;      // felt, in table units
  var R = 11;                  // ball radius
  var POCKET = 20;
  var FRICTION = 0.982;
  var CUSHION = 0.86;
  var STOP = 0.05;

  var POCKETS = [
    { x: 0, y: 0 }, { x: TW / 2, y: -4 }, { x: TW, y: 0 },
    { x: 0, y: TH }, { x: TW / 2, y: TH + 4 }, { x: TW, y: TH },
  ];

  /* Standard colours, and the site's bone for the cue. */
  var COLOURS = {
    1: '#e8b62c', 2: '#2f5fbf', 3: '#c8302c', 4: '#6c3fa0', 5: '#d97b2b',
    6: '#2e8b57', 7: '#8d3b2f', 8: '#141416',
    9: '#e8b62c', 10: '#2f5fbf', 11: '#c8302c', 12: '#6c3fa0', 13: '#d97b2b',
    14: '#2e8b57', 15: '#8d3b2f',
  };


  /* Every code announces itself in the colour of what it opened — the three
     eggs are one system, not three accidents. */
  function codeToast(text, colour) {
    var el = document.createElement('p');
    el.className = 'egg-code-toast';
    el.setAttribute('role', 'status');
    el.style.setProperty('--code-colour', colour);
    var mark = document.createElement('i');
    mark.setAttribute('aria-hidden', 'true');
    el.appendChild(mark);
    el.appendChild(document.createTextNode(text));
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('on'); });
    setTimeout(function () {
      el.classList.remove('on');
      setTimeout(function () { el.remove(); }, 460);
    }, 2600);
  }

  var game = null;
  function open() {
    if (game) return;
    codeToast('POOL — eight ball', '#3f7f5a');
    game = build();
  }

  function build() {
    var host = document.createElement('div');
    host.className = 'pl-host';
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-modal', 'true');
    host.setAttribute('aria-label', 'Eight ball, a hidden pool table');

    var cv = document.createElement('canvas');
    cv.className = 'pl-canvas';
    host.appendChild(cv);

    var hud = document.createElement('p');
    hud.className = 'pl-hud';
    host.appendChild(hud);

    var help = document.createElement('p');
    help.className = 'pl-help';
    [['Move', 'to aim'], ['Hold', 'to draw back'], ['Release', 'to strike'], ['Esc', 'to leave']]
      .forEach(function (pair, i) {
        if (i) help.appendChild(document.createTextNode('   '));
        var b = document.createElement('b');
        b.textContent = pair[0];
        help.appendChild(b);
        help.appendChild(document.createTextNode(' ' + pair[1]));
      });
    host.appendChild(help);

    document.body.appendChild(host);
    root.classList.add('pl-on');
    requestAnimationFrame(function () { host.classList.add('pl-in'); });

    var scrollY = window.scrollY;
    if (window.lenis && window.lenis.stop) window.lenis.stop();
    document.body.style.top = -scrollY + 'px';
    document.body.classList.add('pl-lock');

    var ctx = cv.getContext('2d');
    var scale = 1, PAD = 34;

    function resize() {
      var maxW = Math.min(window.innerWidth - 40, 1000);
      var maxH = window.innerHeight - 150;
      scale = Math.min(maxW / (TW + PAD * 2), maxH / (TH + PAD * 2));
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = (TW + PAD * 2) * scale * dpr;
      cv.height = (TH + PAD * 2) * scale * dpr;
      cv.style.width = (TW + PAD * 2) * scale + 'px';
      cv.style.height = (TH + PAD * 2) * scale + 'px';
      ctx.setTransform(scale * dpr, 0, 0, scale * dpr, PAD * scale * dpr, PAD * scale * dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    /* ---- rack ------------------------------------------------------------
       A legal triangle: eight in the middle of the third row, a solid and a
       stripe in the back corners, apex on the foot spot. */
    var balls = [];
    function rack() {
      balls = [{ n: 0, x: TW * 0.25, y: TH / 2, vx: 0, vy: 0, in: false }];
      var order = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15];
      var apex = { x: TW * 0.72, y: TH / 2 };
      var i = 0;
      for (var row = 0; row < 5; row++) {
        for (var seat = 0; seat <= row; seat++) {
          var n = order[i++];
          balls.push({
            n: n,
            x: apex.x + row * (R * 1.74),
            y: apex.y + (seat - row / 2) * (R * 2.02),
            vx: 0, vy: 0, in: false,
          });
        }
      }
    }
    rack();

    var state = 'rack';       // rack | aim | power | roll | think | over
    var aim = 0, power = 0, powering = false;
    var group = null;         // the player's group, once assigned
    var potted = [];
    var message = 'Racking';
    var shots = 0, fouls = 0, won = false;
    var t = 0;
    var turn = 'you';         // you | ai
    var think = 0;            // the opponent's pause before it shoots
    var rackT = 0;
    var drops = [];           // balls mid-fall, drawn after they leave play

    var cue = function () { return balls[0]; };

    function pointerAt(e) {
      var r = cv.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) / scale - PAD,
        y: (e.clientY - r.top) / scale - PAD,
      };
    }

    function onMove(e) {
      if (state !== 'aim' && state !== 'power') return;
      if (turn !== 'you') return;
      var p = pointerAt(e);
      var c = cue();
      aim = Math.atan2(p.y - c.y, p.x - c.x);
    }
    function onDown(e) {
      if (state !== 'aim' || turn !== 'you') return;
      e.preventDefault();
      state = 'power';
      powering = true;
      power = 0;
    }
    function onUp() {
      if (state !== 'power') return;
      powering = false;
      strike(Math.max(0.12, power));
    }
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);

    function strike(p) {
      var c = cue();
      var speed = 3.2 + p * 15.5;
      c.vx = Math.cos(aim) * speed;
      c.vy = Math.sin(aim) * speed;
      state = 'roll';
      shots++;
      potted = [];
      click(0.09, 240 + p * 420);
    }

    /* ---- audio: felt, cushion, pocket ------------------------------------ */
    var actx = null;
    function click(dur, freq, vol) {
      try {
        if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
        if (actx.state !== 'running') actx.resume();
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, actx.currentTime);
        o.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.4), actx.currentTime + dur);
        g.gain.setValueAtTime(vol == null ? 0.09 : vol, actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
        o.connect(g); g.connect(actx.destination);
        o.start(); o.stop(actx.currentTime + dur + 0.02);
      } catch (_) {}
    }

    /* ---- physics ---------------------------------------------------------
       Substepped so a fast ball cannot jump a gap and miss a contact. */
    function physics() {
      var SUB = 4;
      for (var s2 = 0; s2 < SUB; s2++) {
        for (var i = 0; i < balls.length; i++) {
          var b = balls[i];
          if (b.in) continue;
          b.x += b.vx / SUB;
          b.y += b.vy / SUB;

          // cushions
          if (b.x < R) { b.x = R; b.vx = -b.vx * CUSHION; click(0.05, 150, 0.05); }
          if (b.x > TW - R) { b.x = TW - R; b.vx = -b.vx * CUSHION; click(0.05, 150, 0.05); }
          if (b.y < R) { b.y = R; b.vy = -b.vy * CUSHION; click(0.05, 150, 0.05); }
          if (b.y > TH - R) { b.y = TH - R; b.vy = -b.vy * CUSHION; click(0.05, 150, 0.05); }

          // pockets
          for (var pi = 0; pi < POCKETS.length; pi++) {
            var dxp = b.x - POCKETS[pi].x, dyp = b.y - POCKETS[pi].y;
            if (dxp * dxp + dyp * dyp < POCKET * POCKET) { pot(b); break; }
          }
        }

        // ball on ball: equal masses, impulse along the normal
        for (var a = 0; a < balls.length; a++) {
          if (balls[a].in) continue;
          for (var c2 = a + 1; c2 < balls.length; c2++) {
            if (balls[c2].in) continue;
            var A = balls[a], B = balls[c2];
            var dx = B.x - A.x, dy = B.y - A.y;
            var d2 = dx * dx + dy * dy;
            if (d2 > (R * 2) * (R * 2) || d2 === 0) continue;
            var d = Math.sqrt(d2);
            var nx = dx / d, ny = dy / d;
            var overlap = R * 2 - d;
            A.x -= nx * overlap / 2; A.y -= ny * overlap / 2;
            B.x += nx * overlap / 2; B.y += ny * overlap / 2;
            var rvx = B.vx - A.vx, rvy = B.vy - A.vy;
            var vn = rvx * nx + rvy * ny;
            if (vn > 0) continue;
            var imp = -vn * 0.97;
            A.vx -= imp * nx; A.vy -= imp * ny;
            B.vx += imp * nx; B.vy += imp * ny;
            if (Math.abs(vn) > 0.6) click(0.04, 520 + Math.min(600, Math.abs(vn) * 40), 0.06);
          }
        }
      }

      var moving = false;
      for (var m = 0; m < balls.length; m++) {
        var bb = balls[m];
        if (bb.in) continue;
        bb.vx *= FRICTION; bb.vy *= FRICTION;
        if (Math.abs(bb.vx) < STOP && Math.abs(bb.vy) < STOP) { bb.vx = 0; bb.vy = 0; }
        else moving = true;
      }
      return moving;
    }

    function pot(b) {
      b.in = true;
      b.vx = b.vy = 0;
      potted.push(b.n);
      /* Find the mouth it went down so the fall is toward the right hole. */
      var near = POCKETS[0], nd = 1e9;
      POCKETS.forEach(function (pk) {
        var d = (b.x - pk.x) * (b.x - pk.x) + (b.y - pk.y) * (b.y - pk.y);
        if (d < nd) { nd = d; near = pk; }
      });
      drops.push({ n: b.n, x: b.x, y: b.y, tx: near.x, ty: near.y, t: 0 });
      click(0.22, 110, 0.14);
      setTimeout(function () { click(0.13, 74, 0.1); }, 130);   // the drop into the net
    }

    /* ---- the opponent -----------------------------------------------------
       It plays the same rules it is bound by: its own group first, the eight
       only once that group is gone. For every ball it owns and every pocket,
       it works out where the cue ball must strike — the ghost ball — checks
       both halves of the path are clear, and scores the shot by how thin the
       cut is and how far the ball has to travel. It takes the best one and
       misses it by a little, because an opponent that never misses is not an
       opponent, it is a wall. */
    function groupOf(b) { return b.n >= 1 && b.n <= 7 ? 'solid' : b.n >= 9 ? 'stripe' : 'eight'; }

    function pathClear(fromX, fromY, toX, toY, ignore) {
      var dx = toX - fromX, dy = toY - fromY;
      var len = Math.hypot(dx, dy);
      if (len < 0.001) return true;
      var ux = dx / len, uy = dy / len;
      for (var i = 0; i < balls.length; i++) {
        var b = balls[i];
        if (b.in || b === ignore) continue;
        var rx = b.x - fromX, ry = b.y - fromY;
        var along = rx * ux + ry * uy;
        if (along <= 0 || along >= len) continue;
        var perp = Math.abs(rx * uy - ry * ux);
        if (perp < R * 1.95) return false;
      }
      return true;
    }

    function aiGroupName() {
      if (!group) return null;
      return group === 'solid' ? 'stripe' : 'solid';
    }

    function aiPlan() {
      var c = cue();
      var mine = balls.filter(function (b) {
        if (b.in || b.n === 0) return false;
        var g = groupOf(b);
        var want = aiGroupName();
        if (!want) return g !== 'eight';               // table still open
        if (remaining(want) === 0) return g === 'eight';
        return g === want;
      });
      var best = null;
      mine.forEach(function (o) {
        POCKETS.forEach(function (pk) {
          var dx = pk.x - o.x, dy = pk.y - o.y;
          var d = Math.hypot(dx, dy);
          if (d < 1) return;
          var gx = o.x - (dx / d) * R * 2.02;
          var gy = o.y - (dy / d) * R * 2.02;
          var cdx = gx - c.x, cdy = gy - c.y;
          var cd = Math.hypot(cdx, cdy);
          if (cd < R) return;
          var cut = Math.acos(Math.max(-1, Math.min(1, ((cdx / cd) * (dx / d)) + ((cdy / cd) * (dy / d)))));
          if (cut > 1.05) return;                       // too thin to make
          if (!pathClear(c.x, c.y, gx, gy, o)) return;
          if (!pathClear(o.x, o.y, pk.x, pk.y, o)) return;
          var score = Math.cos(cut) * (260 / (160 + d)) * (320 / (220 + cd));
          if (!best || score > best.score) {
            best = {
              score: score,
              angle: Math.atan2(cdy, cdx),
              power: Math.max(0.3, Math.min(0.92, 0.28 + (d + cd) / 900)),
            };
          }
        });
      });
      if (best) {
        /* Miss by a little, more on the harder shots. */
        var slop = (1 - Math.min(1, best.score * 2.2)) * 0.05;
        best.angle += (Math.random() - 0.5) * slop;
        return best;
      }
      /* Nothing on: roll safe at the nearest ball it is allowed to hit. */
      var target = mine.sort(function (a2, b2) {
        return Math.hypot(a2.x - c.x, a2.y - c.y) - Math.hypot(b2.x - c.x, b2.y - c.y);
      })[0];
      if (!target) return null;
      return { angle: Math.atan2(target.y - c.y, target.x - c.x), power: 0.3, score: 0 };
    }

    function remaining(kind) {
      return balls.filter(function (b) {
        return !b.in && (kind === 'solid' ? b.n >= 1 && b.n <= 7 : b.n >= 9 && b.n <= 15);
      }).length;
    }

    function settle() {
      var scratched = cue().in;
      var eight = potted.indexOf(8) >= 0;

      if (!group) {
        var first = potted.filter(function (n) { return n >= 1 && n <= 15 && n !== 8; })[0];
        if (first) group = first <= 7 ? 'solid' : 'stripe';
      }

      if (eight) {
        var cleared = group && remaining(group) === 0;
        won = cleared && !scratched;
        message = won ? 'Eight ball — game.' : 'Eight ball too early.';
        state = 'over';
        return;
      }
      if (scratched) {
        fouls++;
        cue().in = false;
        cue().x = TW * 0.25;
        cue().y = TH / 2;
        cue().vx = cue().vy = 0;
        message = (turn === 'you' ? 'You scratch.' : 'They scratch.') + ' Ball in hand.';
        turn = 'ai';
      } else if (potted.length) {
        /* You only keep the table if what went down was yours. */
        var ownGroup = turn === 'you' ? group : aiGroupName();
        var mine = potted.filter(function (n) {
          return n !== 8 && ownGroup && groupOf({ n: n }) === ownGroup;
        }).length;
        message = (turn === 'you' ? 'You pot ' : 'They pot ') + potted.length +
                  (group ? ' — you are ' + group + 's' : '');
        if (!mine && ownGroup) turn = turn === 'you' ? 'ai' : 'you';
      } else {
        message = turn === 'you' ? 'No pot — their table.' : 'They miss.';
        turn = turn === 'you' ? 'ai' : 'you';
      }
      state = 'aim';
      if (turn === 'ai') { state = 'think'; think = 46; }
    }

    /* ---- draw ------------------------------------------------------------- */
    function draw() {
      ctx.clearRect(-PAD, -PAD, TW + PAD * 2, TH + PAD * 2);

      // rail
      ctx.fillStyle = '#2a1d12';
      ctx.fillRect(-PAD, -PAD, TW + PAD * 2, TH + PAD * 2);
      ctx.fillStyle = '#3a2817';
      ctx.fillRect(-PAD + 6, -PAD + 6, TW + PAD * 2 - 12, TH + PAD * 2 - 12);

      // felt, lit from above
      var felt = ctx.createLinearGradient(0, -10, 0, TH + 10);
      felt.addColorStop(0, '#1f5c3d');
      felt.addColorStop(0.5, '#17492f');
      felt.addColorStop(1, '#103822');
      ctx.fillStyle = felt;
      ctx.fillRect(0, 0, TW, TH);

      // baulk line and the spots
      ctx.strokeStyle = 'rgba(242,239,233,.12)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(TW * 0.25, 0); ctx.lineTo(TW * 0.25, TH); ctx.stroke();
      ctx.fillStyle = 'rgba(242,239,233,.16)';
      [[TW * 0.25, TH / 2], [TW * 0.72, TH / 2]].forEach(function (p) {
        ctx.beginPath(); ctx.arc(p[0], p[1], 2, 0, 6.2832); ctx.fill();
      });

      // pockets
      POCKETS.forEach(function (p) {
        ctx.fillStyle = '#07080a';
        ctx.beginPath(); ctx.arc(p.x, p.y, POCKET, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x, p.y, POCKET, 0, 6.2832); ctx.stroke();
      });

      // balls falling into a mouth, drawn under the rails so they vanish into it
      drops.forEach(function (d) {
        var k = d.t / 26;
        var bx = d.x + (d.tx - d.x) * k;
        var by = d.y + (d.ty - d.y) * k;
        var rr = R * (1 - k * 0.85);
        ctx.globalAlpha = 1 - k * 0.7;
        ctx.fillStyle = d.n === 0 ? '#f2efe9' : COLOURS[d.n];
        ctx.beginPath(); ctx.arc(bx, by, Math.max(0.5, rr), 0, 6.2832); ctx.fill();
        ctx.globalAlpha = 1;
      });

      // balls
      balls.forEach(function (b) {
        if (b.in) return;
        var col = b.n === 0 ? '#f2efe9' : COLOURS[b.n];
        /* The rack drops in rather than being there: each ball falls the last
           few pixels on its own beat, so the triangle assembles. */
        var settle2 = 1;
        if (state === 'rack') {
          var when = 8 + b.n * 3.4;
          settle2 = Math.max(0, Math.min(1, (rackT - when) / 13));
          if (settle2 <= 0) return;
        }
        var lift = (1 - settle2) * (1 - settle2) * 46;
        var sq = 1 + (1 - settle2) * 0.18;
        ctx.save();
        ctx.translate(0, -lift);
        ctx.globalAlpha = settle2;

        /* A ball moving fast smears a little behind itself. */
        var sp = Math.hypot(b.vx, b.vy);
        if (sp > 2.2) {
          ctx.strokeStyle = 'rgba(242,239,233,.10)';
          ctx.lineWidth = R * 1.7;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(b.x - b.vx * 1.4, b.y - b.vy * 1.4);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }

        ctx.fillStyle = 'rgba(0,0,0,.34)';
        ctx.beginPath(); ctx.ellipse(b.x + 2 + lift * 0.3, b.y + 3.5 + lift * 0.35, R * 0.95 * sq, R * 0.6 * sq, 0, 0, 6.2832); ctx.fill();

        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, 6.2832); ctx.fill();

        if (b.n > 8) {                      // stripes wear a band
          ctx.save();
          ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, 6.2832); ctx.clip();
          ctx.fillStyle = '#f2efe9';
          ctx.fillRect(b.x - R, b.y - R, R * 2, R * 0.62);
          ctx.fillRect(b.x - R, b.y + R * 0.38, R * 2, R * 0.62);
          ctx.restore();
        }
        if (b.n > 0) {
          /* The patch rides the surface: as the ball rolls it swings around
             and shrinks toward the edge, which is what makes it read as
             turning rather than sliding. */
          b.roll = (b.roll || 0) + (b.vx * 0.055);
          b.rollY = (b.rollY || 0) + (b.vy * 0.055);
          var ox = Math.sin(b.roll) * R * 0.42;
          var oy = Math.sin(b.rollY) * R * 0.42;
          var face = Math.max(0.25, 1 - (Math.abs(ox) + Math.abs(oy)) / (R * 0.85));
          ctx.fillStyle = '#f5f3ee';
          ctx.beginPath(); ctx.ellipse(b.x + ox, b.y + oy, R * 0.46 * face, R * 0.46, 0, 0, 6.2832); ctx.fill();
          if (face > 0.55) {
            ctx.fillStyle = '#15151a';
            ctx.font = '600 ' + (R * 0.72) + 'px "JetBrains Mono", monospace';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(String(b.n), b.x + ox, b.y + oy + 0.5);
          }
        }
        var sh = ctx.createRadialGradient(b.x - R * 0.35, b.y - R * 0.4, 0, b.x, b.y, R);
        sh.addColorStop(0, 'rgba(255,255,255,.42)');
        sh.addColorStop(0.55, 'rgba(255,255,255,0)');
        ctx.fillStyle = sh;
        ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, 6.2832); ctx.fill();
        ctx.restore();
      });

      // cue, aim line and power
      if ((state === 'aim' || state === 'power') && turn === 'you') {
        var c = cue();
        var back = 26 + power * 60;
        ctx.strokeStyle = 'rgba(242,239,233,.22)';
        ctx.setLineDash([5, 7]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(c.x + Math.cos(aim) * (R + 3), c.y + Math.sin(aim) * (R + 3));
        ctx.lineTo(c.x + Math.cos(aim) * 300, c.y + Math.sin(aim) * 300);
        ctx.stroke();
        ctx.setLineDash([]);

        var cx1 = c.x - Math.cos(aim) * back, cy1 = c.y - Math.sin(aim) * back;
        var cx2 = c.x - Math.cos(aim) * (back + 190), cy2 = c.y - Math.sin(aim) * (back + 190);
        var cueGrad = ctx.createLinearGradient(cx1, cy1, cx2, cy2);
        cueGrad.addColorStop(0, '#e8dcc3');
        cueGrad.addColorStop(0.12, '#c9a86b');
        cueGrad.addColorStop(1, '#5d3f22');
        ctx.strokeStyle = cueGrad;
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx1, cy1); ctx.lineTo(cx2, cy2); ctx.stroke();

        if (power > 0.01) {
          ctx.fillStyle = 'rgba(206,17,38,.9)';
          ctx.fillRect(10, TH - 22, power * 180, 8);
          ctx.strokeStyle = 'rgba(242,239,233,.35)';
          ctx.lineWidth = 1;
          ctx.strokeRect(10.5, TH - 22.5, 180, 9);
        }
      }

      if (state === 'over') {
        ctx.fillStyle = 'rgba(7,8,10,.74)';
        ctx.fillRect(0, TH / 2 - 34, TW, 68);
        ctx.fillStyle = won ? '#9bcfa5' : '#ce1126';
        ctx.fillRect(0, TH / 2 - 34, TW, 1);
        ctx.fillRect(0, TH / 2 + 33, TW, 1);
        ctx.font = '600 26px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = won ? '#9bcfa5' : '#ce1126';
        ctx.fillText(won ? 'GAME' : 'LOST', TW / 2, TH / 2 - 6);
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillStyle = '#cdc9c1';
        ctx.fillText('R to rack again  ·  Esc to leave', TW / 2, TH / 2 + 18);
      }
    }

    function step() {
      t++;
      if (state === 'rack') {
        rackT++;
        if (rackT > 74) { state = 'aim'; message = 'Your break'; }
      }
      if (powering) power = Math.min(1, power + 0.017);
      if (state === 'think') {
        if (--think <= 0) {
          var plan = aiPlan();
          if (plan) { aim = plan.angle; strike(plan.power); }
          else { turn = 'you'; state = 'aim'; message = 'They pass.'; }
        }
      }
      if (state === 'roll') {
        if (!physics()) { settle(); }
      }
      for (var di = drops.length - 1; di >= 0; di--) {
        drops[di].t++;
        if (drops[di].t > 26) drops.splice(di, 1);
      }
      hud.textContent =
        (state === 'think' ? 'THEIR SHOT' : turn === 'you' ? 'YOUR SHOT' : 'THEIR SHOT') + '   ·   ' +
        message.toUpperCase() +
        '   ·   SHOT ' + shots +
        (group ? '   ·   ' + group.toUpperCase() + 'S — ' + remaining(group) + ' LEFT' : '') +
        (fouls ? '   ·   ' + fouls + ' FOUL' + (fouls > 1 ? 'S' : '') : '');
    }

    var raf = 0, acc = 0, prev = 0, STEP = 1000 / 60;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (!prev) prev = now;
      acc += Math.min(100, now - prev);
      prev = now;
      var guard = 0;
      while (acc >= STEP && guard++ < 5) { acc -= STEP; step(); }
      draw();
    }
    raf = requestAnimationFrame(loop);

    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if ((e.key === 'r' || e.key === 'R') && state !== 'roll') {
        e.preventDefault();
        rack(); state = 'aim'; group = null; potted = []; shots = 0; fouls = 0; won = false;
        message = 'Break';
      }
    }
    window.addEventListener('keydown', onKey, true);

    /* A read-only seam, so a test can assert the table actually plays. */
    window.__eightBall = {
      state: function () {
        return {
          state: state, shots: shots, group: group, won: won, fouls: fouls,
          onTable: balls.filter(function (b) { return !b.in; }).length,
          cue: { x: Math.round(cue().x), y: Math.round(cue().y) },
        };
      },
      shoot: function (angle, p) { aim = angle; strike(p); },
    };

    function close() {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerup', onUp);
      host.classList.remove('pl-in');
      document.body.classList.remove('pl-lock');
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
      if (window.lenis && window.lenis.start) window.lenis.start();
      root.classList.remove('pl-on');
      setTimeout(function () { host.remove(); }, 320);
      game = null;
    }

    host.tabIndex = -1;
    host.focus();
    return { close: close };
  }

  /* ---- the word --------------------------------------------------------- */
  var WORD = 'pool';
  var buf = '';
  document.addEventListener('keydown', function (e) {
    if (game) return;
    var el = e.target;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
    var k = String(e.key || '');
    if (k.length !== 1) return;
    buf = (buf + k.toLowerCase()).slice(-WORD.length);
    if (buf === WORD) {
      buf = '';
      if (canPlay) open();
      else {
        var p = document.createElement('p');
        p.className = 'cx-toast';
        p.setAttribute('role', 'status');
        p.textContent = 'The table needs a wider screen.';
        document.body.appendChild(p);
        requestAnimationFrame(function () { p.classList.add('on'); });
        setTimeout(function () { p.classList.remove('on'); setTimeout(function () { p.remove(); }, 400); }, 3000);
      }
    }
  });
})();
