/* =========================================================================
 * OPERATION BONE — the Konami code egg.
 * -------------------------------------------------------------------------
 * Up Up Down Down Left Right Left Right B A, typed anywhere that is not a
 * text field, drops a one-level run-and-gun over the page.
 *
 * Its own file for the same reason snake.js is: script.js owns the hero and
 * is the one file whose regression takes the identity scene down with it,
 * and approved.js runs on the case-study routes where there is nothing to
 * attach to. Loaded with defer from index.html only, so the worst failure
 * available to everything below is "the code does nothing".
 *
 * Everything is drawn from hand-authored pixel maps on a 1:1 grid and then
 * scaled by an integer factor with smoothing off, so the art is genuinely
 * pixel art rather than a filtered photograph of some. Nothing here is a
 * network request: the level, every sprite, every frame of animation and
 * every sound is in this file.
 * ========================================================================= */

(function operationBone() {
  'use strict';

  var root = document.documentElement;
  if (!document.body) return;

  /* Precise simultaneous key presses are the whole genre. A phone cannot
     offer them and a reduced-motion reader did not ask for a shooter, so
     neither is handed a code that does nothing when they enter it. */
  var canPlay =
    matchMedia('(pointer: fine)').matches &&
    matchMedia('(min-width: 900px)').matches &&
    !matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- palette ---------------------------------------------------------
     The site's own ink, bone and accent, plus the two reds it already wears
     under the flag. No colour here is new to the page. */
  var PAL = {
    '.': null,
    o: '#0a0a0b',
    k: '#17171a',
    s: '#e0b48c',
    d: '#b98960',
    u: '#f2efe9',
    v: '#b9b6ae',
    m: '#6f6d68',
    n: '#3c3b38',
    r: '#ce1126',
    a: '#9bcfa5',
    g: '#d4a017',
    w: '#ffffff',
  };

  /* ---- sprites: 12 wide, 16 tall --------------------------------------- */
  var S = {
    idle: [
      '....oooo....', '...orrrro...', '...osssso...', '...osoosso..',
      '....ossso...', '...ouuuuo...', '..ouuuuuuo..', '.ouuuuuuuo..',
      'ommuuuuuuo..', '.onouuuuo...', '...ouuuuo...', '...ouoouo...',
      '...ouo.ouo..', '...ouo.ouo..', '..okko.okko.', '..ooo...ooo.',
    ],
    run1: [
      '....oooo....', '...orrrro...', '...osssso...', '...osoosso..',
      '....ossso...', '...ouuuuo...', '..ouuuuuuo..', 'ommuuuuuuo..',
      '.onouuuuuo..', '...ouuuuo...', '...ouuuuo...', '..ouo..ouo..',
      '.ouo....ouo.', '.ouo.....ouo', 'okko.....okk', 'ooo.......oo',
    ],
    run2: [
      '....oooo....', '...orrrro...', '...osssso...', '...osoosso..',
      '....ossso...', '...ouuuuo...', '..ouuuuuuo..', 'ommuuuuuuo..',
      '.onouuuuuo..', '...ouuuuo...', '...ouuuuo...', '...ouuuuo...',
      '...ouo.ouo..', '..ouo..ouo..', '.okko...okko', '.ooo.....ooo',
    ],
    run3: [
      '....oooo....', '...orrrro...', '...osssso...', '...osoosso..',
      '....ossso...', '...ouuuuo...', '..ouuuuuuo..', 'ommuuuuuuo..',
      '.onouuuuuo..', '...ouuuuo...', '..ouuuuuo...', '..ouo.ouuo..',
      '.ouo...ouuo.', 'ouo.....ouo.', 'kko.....okko', 'oo.......ooo',
    ],
    jump: [
      '....oooo....', '...orrrro...', '...osssso...', '...osoosso..',
      '....ossso...', 'omm.ouuuuo..', '.ono.uuuuuo.', '..ouuuuuuuo.',
      '..ouuuuuuo..', '..ouuuuuo...', '..ouo.ouo...', '.ouo...ouo..',
      '.oo.....oo..', '............', '............', '............',
    ],
    prone: [
      '............', '............', '............', '............',
      '............', '............', '............', '............',
      '....oooooo..', '...orrssso..', 'ommouuuuuuo.', '.onouuuuuuoo',
      '..ouuuuuuuuo', '..okkoookkoo', '..ooo...ooo.', '............',
    ],
    aimUp: [
      '...om.oooo..', '...om.rrrro.', '...om.ssso..', '...onosooss.',
      '...ouuosso..', '...ouuuuo...', '..ouuuuuuo..', '.ouuuuuuuo..',
      '..ouuuuuuo..', '...ouuuuo...', '...ouuuuo...', '...ouoouo...',
      '...ouo.ouo..', '...ouo.ouo..', '..okko.okko.', '..ooo...ooo.',
    ],
  };

  /* The opposition is the same silhouette in hostile red — this is one
     soldier's level, and what he is fighting is shaped like him. */
  var E = {
    grunt1: [
      '....oooo....', '...orrrro...', '...orrrro...', '...oroorro..',
      '....orrro...', '...orrrro...', '..orrrrrro..', '..orrrrrro.o',
      '..orrrrrromm', '...orrrro.on', '...orrrro...', '..oro..oro..',
      '.oro....oro.', '.oro.....oro', 'okko.....okk', 'ooo.......oo',
    ],
    grunt2: [
      '....oooo....', '...orrrro...', '...orrrro...', '...oroorro..',
      '....orrro...', '...orrrro...', '..orrrrrro..', '..orrrrrro.o',
      '..orrrrrromm', '...orrrro.on', '...orrrro...', '...orrrro...',
      '...oro.oro..', '..oro..oro..', '.okko...okko', '.ooo.....ooo',
    ],
    /* The leaper is not a red soldier at all — it is the thing the base
       lets off the leash. Reading it apart from a grunt at a glance is the
       difference between standing your ground and moving. */
    leap1: [
      '............', '...o....o...', '...og..go...', '....oggo....',
      '...ogggggo..', '..oggwwggo..', '..oggggggo..', '.oggggggggo.',
      'ogg.oooo.ggo', 'ogg......ggo', '.oggggggggo.', '..og.oo.go..',
      '.ogg....ggo.', 'ogo......ogo', 'oo........oo', '............',
    ],
    leap2: [
      '..o......o..', '..og....go..', '...oggggo...', '..oggwwggo..',
      '..oggggggo..', 'o.oggggggo.o', 'og.oggggo.go', 'ogg.oggo.ggo',
      '.ogg.oo.ggo.', '..og....go..', '.og......go.', 'og........go',
      'o..........o', '............', '............', '............',
    ],
    /* And the bomber owns the air: rotors, a lit cockpit and an open bay.
       You cannot shoot it by walking — you have to look up. It is drawn in
       the light greys rather than the outline black the ground enemies use:
       against a night sky a black-edged shape is a smudge, and an enemy you
       cannot see coming is not difficulty, it is a bug. */
    bomb1: [
      '..................', '......v....v......', 'vvvvvvvvvvvvvvvvvv', '.......vmv........',
      '....vvvvvvvvv.....', '...vmmmmmmmmmv....', '..vmrwwrmmmmmmmv..', '..vmmmmmmmmmmmmvvv',
      '...vmmmmmmmmv..vvv', '....vnn.gg.nv.....', '......v.gg.v......', '..................',
    ],
    bomb2: [
      '..................', '......v....v......', '.vv.vv.vv.vv.vv.v.', '.......vmv........',
      '....vvvvvvvvv.....', '...vmmmmmmmmmv....', '..vmrwwrmmmmmmmv..', '..vmmmmmmmmmmmmvvv',
      '...vmmmmmmmmv..vvv', '....vnn....nv.....', '..................', '..................',
    ],
    turret: [
      '............', '............', '...oooooo...', '..onnnnnno..',
      '.onmmmmmmno.', 'onmmrrrrmmno', 'onmmrwwrmmno', 'onmmrrrrmmno',
      '.onmmmmmmno.', '..onnnnnno..', '..onnnnnno..', '.oooooooooo.',
      '............', '............', '............', '............',
    ],
  };

  /* The gate that ends the level: the base door, in the site's gold. */
  var GATE = [
    'oooooooooooooooooooo', 'onnnnnnnnnnnnnnnnnno', 'onmmmmmmmmmmmmmmmmno',
    'onmmnnnnnnnnnnnnmmno', 'onmmnggggggggggnmmno', 'onmmngwwwwwwwwgnmmno',
    'onmmngwrrrrrrwgnmmno', 'onmmngwroooorwgnmmno', 'onmmngwroooorwgnmmno',
    'onmmngwrrrrrrwgnmmno', 'onmmngwwwwwwwwgnmmno', 'onmmnggggggggggnmmno',
    'onmmnnnnnnnnnnnnmmno', 'onmmmmmmmmmmmmmmmmno', 'onnnnnnnnnnnnnnnnnno',
    'oooooooooooooooooooo',
  ];

  /* ---- the level -------------------------------------------------------
     '#' ground, '=' a platform, '^' a turret mount, 'g' a grunt, 'j' a
     leaper, 'v' a bomber holding station overhead, 'w' a wave line, 'B' the
     gate, '_' a pit. Authored as text so the level is legible in the source
     rather than a list of coordinates. */
  var MAP = [
    '................................................................................................',
    '................................................................................................',
    '.................v............g..............v............g...................v.................',
    '.............................====.....................====......................................',
    '................................................................................................',
    '...............====....................====......................====...........................',
    '.................................g................j.........................j.......g...........',
    '..........................^....................########..^................########......^.......',
    '....................g....................^.....############...j...........#######w.........B....',
    '################___#########################___####################___##########################',
  ];

  var CELL = 16;
  var GRAV = 0.52;
  var MOVE = 2.15;
  var JUMP = -8.5;

  /* ---- audio: four voices, nothing loaded ------------------------------- */
  var actx = null, master = null;
  function audio() {
    if (actx || !window.AudioContext) return actx;
    try {
      actx = new AudioContext();
      master = actx.createGain();
      master.gain.value = 0.16;
      var comp = actx.createDynamicsCompressor();
      master.connect(comp);
      comp.connect(actx.destination);
    } catch (_) { actx = null; }
    return actx;
  }
  function blip(freq, dur, type, vol, slideTo) {
    if (!audio()) return;
    if (actx.state !== 'running') { try { actx.resume(); } catch (_) {} }
    try {
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, actx.currentTime);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, actx.currentTime + dur);
      g.gain.setValueAtTime(vol == null ? 0.5 : vol, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
      o.connect(g); g.connect(master);
      o.start(); o.stop(actx.currentTime + dur + 0.02);
    } catch (_) {}
  }
  function noise(dur, vol) {
    if (!audio()) return;
    try {
      var n = Math.floor(actx.sampleRate * dur);
      var buf = actx.createBuffer(1, n, actx.sampleRate);
      var ch = buf.getChannelData(0);
      for (var i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
      var src = actx.createBufferSource(), g = actx.createGain();
      g.gain.value = vol == null ? 0.5 : vol;
      src.buffer = buf; src.connect(g); g.connect(master); src.start();
    } catch (_) {}
  }


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
    codeToast('Konami code — Operation Bone', '#9bcfa5');
    game = build();
  }

  function build() {
    var host = document.createElement('div');
    host.className = 'cx-host';
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-modal', 'true');
    host.setAttribute('aria-label', 'Operation Bone, a hidden side-scrolling shooter');

    var cv = document.createElement('canvas');
    cv.className = 'cx-canvas';
    host.appendChild(cv);

    var hud = document.createElement('p');
    hud.className = 'cx-hud';
    host.appendChild(hud);

    var help = document.createElement('p');
    help.className = 'cx-help';
    [['← →', 'move'], ['↑ ↓', 'aim'], ['X', 'jump'], ['Z', 'fire'], ['Esc', 'leave']]
      .forEach(function (pair, i) {
        if (i) help.appendChild(document.createTextNode('   '));
        var b = document.createElement('b');
        b.textContent = pair[0];
        help.appendChild(b);
        help.appendChild(document.createTextNode(' ' + pair[1]));
      });
    host.appendChild(help);

    document.body.appendChild(host);
    root.classList.add('cx-on');
    requestAnimationFrame(function () { host.classList.add('cx-in'); });

    var scrollY = window.scrollY;
    if (window.lenis && window.lenis.stop) window.lenis.stop();
    document.body.style.top = -scrollY + 'px';
    document.body.classList.add('cx-lock');

    var ctx = cv.getContext('2d');
    var VW = 320, VH = 180, scale = 1;

    function resize() {
      scale = Math.max(1, Math.floor(Math.min(window.innerWidth / VW, (window.innerHeight - 90) / VH)));
      cv.width = VW; cv.height = VH;
      cv.style.width = VW * scale + 'px';
      cv.style.height = VH * scale + 'px';
      ctx.imageSmoothingEnabled = false;
    }
    resize();
    window.addEventListener('resize', resize);

    var W = MAP[0].length * CELL;
    var H = MAP.length * CELL;

    /* Deterministic per-cell noise. Math.random() here would make the whole
       level shimmer as it scrolled, because every cell would be redrawn
       differently on every frame. */
    function hash(a, b) {
      var n = (a * 374761393 + b * 668265263) ^ 0x5bf03635;
      n = (n ^ (n >> 13)) * 1274126177;
      return ((n ^ (n >> 16)) >>> 0) % 997;
    }

    function cellAt(cx, cy) {
      if (cy < 0 || cy >= MAP.length || cx < 0 || cx >= MAP[0].length) return '.';
      return MAP[cy][cx];
    }
    function solidAt(x, y, fromAbove) {
      var c = cellAt(Math.floor(x / CELL), Math.floor(y / CELL));
      return c === '#' || (c === '=' && fromAbove);
    }
    function pitAt(x, y) { return cellAt(Math.floor(x / CELL), Math.floor(y / CELL)) === '_'; }

    var keys = Object.create(null);
    var player = {
      x: 24, y: H - CELL * 3, vx: 0, vy: 0, w: 10, h: 15,
      face: 1, aim: 0, ground: false, prone: false,
      /* Dropped in under fire: the first grunt is in range from frame one, so
         the drop itself is covered. */
      lives: 3, inv: 90, dead: 0, frame: 0, fireCd: 0, gun: 'R',
    };
    var bullets = [], foes = [], parts = [], waves = [], pops = [];
    var cam = 0, shake = 0, score = 0, won = 0, lost = 0, t = 0;

    /* ---- boot ------------------------------------------------------------
       The level does not snap into place: the machine comes up first. A
       scanline sweep, the mission name typed a character at a time, a
       loading bar, then the playfield wipes open behind it. */
    var phase = 'boot', bootT = 0;
    var TITLE = 'OPERATION BONE';
    var LOADS = ['MOUNTING TERRAIN', 'ARMING RIFLE', 'DEPLOYING'];

    for (var ry = 0; ry < MAP.length; ry++) {
      for (var rx = 0; rx < MAP[0].length; rx++) {
        var ch = MAP[ry][rx];
        if (ch === 'g') foes.push({ k: 'grunt', x: rx * CELL, home: rx * CELL, vx: -0.62, vy: 0, y: groundUnder(rx, ry, 15), w: 10, h: 15, hp: 1, cd: 60 + ((rx * 37) % 60), f: 0 });
        /* A bomber holds a lane of sky and drifts along it, so it is a
           position to solve rather than an obstacle that walks into you. */
        if (ch === 'v') foes.push({
          k: 'bomber', x: rx * CELL, y: ry * CELL, home: rx * CELL,
          w: 18, h: 12, hp: 2, cd: 70 + ((rx * 29) % 70), f: 0, y0: ry * CELL,
          vx: 0.55, range: 78, bob: (rx % 10) * 0.6,
        });
        if (ch === '^') foes.push({ k: 'turret', x: rx * CELL, y: groundUnder(rx, ry, 12) - 4, w: 12, h: 12, hp: 3, cd: 40 + ((rx * 23) % 50) });
        /* A leaper closes the distance instead of pacing it, so a gap or a
           ledge stops being safe ground to stand and shoot from. */
        if (ch === 'j') foes.push({ k: 'leap', x: rx * CELL, home: rx * CELL, y: groundUnder(rx, ry, 15), vx: 0, vy: 0, w: 10, h: 15, hp: 2, cd: 50 + ((rx * 17) % 40), f: 0, ground: true });
        /* A line you cross that sends a squad in from the right — the one
           thing the genre does that a static map cannot. */
        if (ch === 'w') waves.push({ x: rx * CELL, fired: false });
        if (ch === 'B') foes.push({ k: 'gate', x: rx * CELL, y: ry * CELL - CELL * 0.5, w: 20, h: 16, hp: 24, cd: 90, flash: 0 });
      }
    }

    /* Whatever row a spawn is authored on it stands on the first surface
       below it — a turret hanging two cells above the floor is the tell that
       placement was left to the map rather than to the terrain. */
    function groundUnder(rx, ry, h) {
      for (var y = ry; y < MAP.length; y++) {
        var c = MAP[y][rx];
        if (c === '#' || c === '=') return y * CELL - h;
      }
      return (MAP.length - 1) * CELL - h;
    }

    function burst(x, y, n, col, spd) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = (spd || 1.6) * (0.4 + Math.random());
        parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.5, life: 18 + Math.random() * 16, col: col });
      }
    }

    /* Four guns, each with a reason to want it: the rifle is the floor, spread
       covers width, machine covers time, laser covers a line all the way
       through whatever is standing in it. */
    var GUNS = {
      R: { cd: 10, speed: 4.4, dmg: 1, tone: 700, col: '#f2cd6b' },
      S: { cd: 8, speed: 4.2, dmg: 1, tone: 900, col: '#f2cd6b' },
      M: { cd: 4, speed: 5.0, dmg: 1, tone: 1050, col: '#e7f0c9' },
      L: { cd: 16, speed: 8.2, dmg: 3, tone: 1500, col: '#9bcfa5', pierce: true },
    };

    function fire() {
      if (phase !== 'play' || player.fireCd > 0 || player.dead || won || lost) return;
      var G = GUNS[player.gun] || GUNS.R;
      player.fireCd = G.cd;
      var bx = player.x + (player.face > 0 ? player.w : 0);
      var by = player.y + (player.prone ? 11 : 6);
      var dirs = [];
      if (player.aim < 0) dirs.push([0, -1]);
      else if (player.aim > 0 && !player.ground) dirs.push([0, 1]);
      else dirs.push([player.face, 0]);
      if (player.gun === 'S') { dirs.push([player.face * 0.86, -0.5]); dirs.push([player.face * 0.86, 0.5]); }
      dirs.forEach(function (d) {
        bullets.push({
          x: bx, y: by, vx: d[0] * G.speed, vy: d[1] * G.speed,
          mine: true, life: 90, dmg: G.dmg, col: G.col, pierce: G.pierce, hit: [],
        });
      });
      burst(bx, by, player.gun === 'L' ? 6 : 3, G.col, 0.7);
      blip(G.tone, 0.05, player.gun === 'L' ? 'sawtooth' : 'square', 0.3, 240);
    }

    /* A read-only seam. The level has to be provably fair rather than
       plausibly fair, and the only way to check that from a test is to see
       what actually killed the player and where. */
    var log = [];
    window.__opBone = {
      floating: function () {
        return foes.filter(function (f) {
          /* Bombers are supposed to be in the air — this seam is asking which
             ground enemies were placed over nothing, not which ones fly. */
          if (f.hp <= 0 || f.k === 'gate' || f.k === 'bomber' || f.k === 'pick') return false;
          /* The turret is drawn four pixels below its collision box, so the
             check has to ask about the sprite's feet, not the box's. */
          var below = f.y + (f.k === 'turret' ? 4 : 0) + f.h + 2;
          return !solidAt(f.x + f.w / 2, below, true);
        }).map(function (f) { return f.k + '@' + Math.round(f.x); });
      },
      state: function () {
        return {
          phase: phase, lives: player.lives, score: score, won: won, lost: lost,
          x: Math.round(player.x), y: Math.round(player.y), ground: player.ground,
          deaths: log.slice(),
        };
      },
    };

    function hurt(why) {
      /* Gravity is not something you get invulnerability frames against —
         while inv was honoured here, falling into a pit simply dropped the
         player out of the world until the frames ran out. */
      var fatal = why === 'pit' || why === 'fell';
      if (player.dead || won || lost) return;
      if (player.inv > 0 && !fatal) return;
      log.push({ why: why || '?', x: Math.round(player.x), y: Math.round(player.y) });
      player.lives--;
      player.dead = 46;
      player.gun = 'R';
      shake = 12;
      burst(player.x + 5, player.y + 8, 26, '#ce1126', 2.4);
      noise(0.4, 0.5);
      blip(180, 0.5, 'sawtooth', 0.4, 60);
    }
    /* Respawn onto ground, not into whatever happens to be at cam + 24 — a
       pit or a grunt there turned one death into all three. */
    function respawn() {
      var col = Math.floor((cam + 30) / CELL);
      for (var i = 0; i < 12; i++) {
        var c = col + i;
        if (cellAt(c, MAP.length - 1) === '#' && cellAt(c, MAP.length - 2) !== '#') { col = c; break; }
      }
      player.x = col * CELL + 3;
      player.y = (MAP.length - 1) * CELL - player.h;
      player.vx = player.vy = 0;
      player.ground = true;
      player.inv = 110;
      /* Anything standing on the doorstep is cleared, so the respawn is a
         chance rather than a repeat of the death. */
      foes.forEach(function (f) {
        if (f.k === 'grunt' && f.hp > 0 && Math.abs(f.x - player.x) < 40) {
          f.hp = 0;
          burst(f.x + 5, f.y + 8, 14, '#ce1126', 2);
        }
      });
    }

    function onKey(e) {
      var k = String(e.key || '');
      if (k === 'Escape') { e.preventDefault(); close(); return; }
      var down = e.type === 'keydown';
      var lower = k.toLowerCase();
      var JUMPK = [' ', 'x', 'k', 'w'];
      var FIREK = ['z', 'j', 'f'];
      var MOVEK = ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 's'];
      if (MOVEK.indexOf(lower) >= 0 || JUMPK.indexOf(lower) >= 0 || FIREK.indexOf(lower) >= 0) {
        e.preventDefault();
        /* WASD mirrors the arrows so either hand works, and space jumps because
           on a web page space is what jumps. Up stays aim: making it jump would
           launch you every time you tried to shoot something above you. */
        if (lower === 'a') keys.arrowleft = down;
        else if (lower === 'd') keys.arrowright = down;
        else if (lower === 's') keys.arrowdown = down;
        else keys[lower] = down;
        if (down && JUMPK.indexOf(lower) >= 0) jump();
        if (down && FIREK.indexOf(lower) >= 0) fire();
      }
    }
    function jump() {
      if (phase !== 'play' || player.dead || !player.ground) return;
      player.vy = JUMP;
      player.ground = false;
      blip(420, 0.12, 'square', 0.25, 700);
    }
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKey, true);

    function sprite(map, x, y, flip, tint) {
      for (var r = 0; r < map.length; r++) {
        var row = map[r];
        for (var c = 0; c < row.length; c++) {
          var col = PAL[row[c]];
          if (!col) continue;
          ctx.fillStyle = tint || col;
          ctx.fillRect(Math.round(x + (flip ? row.length - 1 - c : c)), Math.round(y + r), 1, 1);
        }
      }
    }

    function ridge(off, base, amp, step, col) {
      ctx.fillStyle = col;
      for (var x = 0; x < VW; x++) {
        var wx = x + off;
        var h = base + Math.sin(wx / step) * amp + Math.sin(wx / (step * 0.37)) * amp * 0.38;
        ctx.fillRect(x, Math.round(h), 1, VH - Math.round(h));
      }
    }

    function drawWorld() {
      var grd = ctx.createLinearGradient(0, 0, 0, VH);
      grd.addColorStop(0, '#0a0a0b');
      grd.addColorStop(0.55, '#14161a');
      grd.addColorStop(1, '#1d2118');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, VW, VH);

      for (var i = 0; i < 40; i++) {
        var sx = (i * 71 - cam * 0.08) % VW;
        if (sx < 0) sx += VW;
        ctx.fillStyle = i % 5 ? 'rgba(242,239,233,.25)' : 'rgba(155,207,165,.45)';
        ctx.fillRect(Math.round(sx), (i * 37) % 70 + 6, 1, 1);
      }
      ridge(cam * 0.12, 96, 16, 46, '#101318');
      ridge(cam * 0.26, 116, 11, 31, '#151a1c');
      ridge(cam * 0.45, 134, 7, 19, '#1a2020');

      ctx.save();
      var sx2 = shake > 0.3 ? (Math.random() - 0.5) * shake * 0.5 : 0;
      var sy2 = shake > 0.3 ? (Math.random() - 0.5) * shake * 0.5 : 0;
      ctx.translate(-Math.round(cam) + sx2, sy2);

      var c0 = Math.max(0, Math.floor(cam / CELL) - 1);
      var c1 = Math.min(MAP[0].length, c0 + Math.ceil(VW / CELL) + 3);
      for (var cy = 0; cy < MAP.length; cy++) {
        for (var cx = c0; cx < c1; cx++) {
          var ch2 = MAP[cy][cx], px = cx * CELL, py = cy * CELL;
          if (ch2 === '#') {
            var lip = cellAt(cx, cy - 1) !== '#';        // is this the surface?
            ctx.fillStyle = '#242A21';
            ctx.fillRect(px, py, CELL, CELL);
            /* Strata: three bands of rock rather than one flat fill, offset per
               column so the seam never runs straight across the level. */
            ctx.fillStyle = '#2C3327';
            ctx.fillRect(px, py + 4 + (hash(cx, cy) % 2), CELL, 4);
            ctx.fillStyle = '#1C211A';
            ctx.fillRect(px, py + 11 - (hash(cx, cy + 9) % 2), CELL, 3);
            /* Grain: a deterministic speckle, so the same cell is always the
               same rock and the level does not shimmer as it scrolls. */
            ctx.fillStyle = '#171C16';
            for (var d = 0; d < 4; d++) {
              var hx = hash(cx * 3 + d, cy * 5);
              ctx.fillRect(px + (hx % 14), py + 3 + ((hx >> 3) % 12), 1 + (hx & 1), 1);
            }
            ctx.fillStyle = '#333B2D';
            for (var d2 = 0; d2 < 2; d2++) {
              var hy = hash(cx * 7 + d2, cy * 11);
              ctx.fillRect(px + (hy % 13), py + 5 + ((hy >> 4) % 9), 1, 1);
            }
            if (lip) {
              /* The lit edge, then moss hanging off it in uneven tufts. */
              ctx.fillStyle = '#4A5540';
              ctx.fillRect(px, py, CELL, 2);
              ctx.fillStyle = '#9bcfa5';
              ctx.fillRect(px, py, CELL, 1);
              ctx.fillStyle = '#6E8F62';
              for (var g2 = 0; g2 < CELL; g2 += 2) {
                var t2 = hash(cx * 13 + g2, cy);
                if (t2 % 3) ctx.fillRect(px + g2, py + 1, 1, 1 + (t2 % 3));
              }
              /* A blade or two standing up out of it. */
              if (hash(cx, 7) % 3 === 0) {
                ctx.fillStyle = '#8FB683';
                var bx2 = px + (hash(cx, 3) % 12) + 2;
                ctx.fillRect(bx2, py - 3, 1, 3);
                ctx.fillRect(bx2 + 1, py - 2, 1, 2);
              }
            }
            /* Where the ground ends, the cut face is darker and beaded. */
            if (cellAt(cx - 1, cy) === '.' || cellAt(cx - 1, cy) === '_') {
              ctx.fillStyle = '#171C16'; ctx.fillRect(px, py, 1, CELL);
              ctx.fillStyle = '#3A4433'; ctx.fillRect(px + 1, py, 1, CELL);
            }
            if (cellAt(cx + 1, cy) === '.' || cellAt(cx + 1, cy) === '_') {
              ctx.fillStyle = '#171C16'; ctx.fillRect(px + CELL - 1, py, 1, CELL);
              ctx.fillStyle = '#3A4433'; ctx.fillRect(px + CELL - 2, py, 1, CELL);
            }
          } else if (ch2 === '=') {
            /* A girder, not a slab: plate, rivets, shadowed underside. */
            ctx.fillStyle = '#39412F'; ctx.fillRect(px, py, CELL, 5);
            ctx.fillStyle = '#232A1D'; ctx.fillRect(px, py + 5, CELL, 2);
            ctx.fillStyle = '#9bcfa5'; ctx.fillRect(px, py, CELL, 1);
            ctx.fillStyle = '#5B6A4B';
            ctx.fillRect(px + 3, py + 2, 1, 1);
            ctx.fillRect(px + 11, py + 2, 1, 1);
          } else if (ch2 === '_') {
            /* The pit reads as depth: a lit rim, then dark that gets darker. */
            var gp = ctx.createLinearGradient(0, py, 0, py + CELL);
            gp.addColorStop(0, '#101410');
            gp.addColorStop(1, '#05060a');
            ctx.fillStyle = gp;
            ctx.fillRect(px, py, CELL, CELL);
            if (cellAt(cx - 1, cy) === '#') { ctx.fillStyle = '#4A5540'; ctx.fillRect(px, py, 1, 4); }
            if (cellAt(cx + 1, cy) === '#') { ctx.fillStyle = '#4A5540'; ctx.fillRect(px + CELL - 1, py, 1, 4); }
          }
        }
      }

      foes.forEach(function (f) {
        if (f.hp <= 0) return;
        if (f.k === 'grunt') sprite(f.f < 8 ? E.grunt1 : E.grunt2, f.x, f.y, f.vx > 0);
        else if (f.k === 'leap') sprite(f.ground ? E.leap1 : E.leap2, f.x, f.y, f.vx > 0);
        else if (f.k === 'bomber') {
          /* The shadow is the warning. It lands where the bomb will — and
             over a pit there is no floor to land on, so there is none. */
          var scol = Math.max(0, Math.min(MAP[0].length - 1, Math.round((f.x + 7) / CELL)));
          var sfloor = -1;
          for (var sr = 0; sr < MAP.length; sr++) {
            var sc = MAP[sr][scol];
            if (sc === '#' || sc === '=') { sfloor = sr * CELL; break; }
          }
          if (sfloor >= 0) {
            ctx.fillStyle = 'rgba(10,10,11,.42)';
            ctx.fillRect(Math.round(f.x + 3), sfloor - 1, 8, 2);
          }
          sprite(f.f < 4 ? E.bomb1 : E.bomb2, f.x, f.y, false);
        }
        else if (f.k === 'turret') sprite(E.turret, f.x, f.y + 4, false);
        else if (f.k === 'pick') {
          /* A lit capsule with its letter, bobbing where it fell. */
          var by2 = f.y + Math.sin(f.bob / 9) * 2;
          ctx.fillStyle = '#0a0a0b'; ctx.fillRect(f.x - 1, by2 - 1, 12, 12);
          ctx.fillStyle = '#9bcfa5'; ctx.fillRect(f.x, by2, 10, 10);
          ctx.fillStyle = '#0a0a0b';
          ctx.font = '8px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(f.gun, f.x + 5, by2 + 8);
          ctx.textAlign = 'left';
        }
        else if (f.k === 'gate') sprite(GATE, f.x, f.y, false, f.flash > 0 ? '#ffffff' : null);
      });

      bullets.forEach(function (b) {
        /* A bomb reads as a falling object, not as a shot: a body, a nose and
           a fin, with the tail streaking up behind it as it accelerates. */
        if (b.bomb) {
          var bx2 = Math.round(b.x), by2 = Math.round(b.y);
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = '#f2cd6b';
          ctx.fillRect(bx2 - 1, by2 - 7, 2, 5);
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#0a0a0b';
          ctx.fillRect(bx2 - 2, by2 - 3, 4, 6);
          ctx.fillStyle = '#ce1126';
          ctx.fillRect(bx2 - 1, by2 - 2, 2, 3);
          ctx.fillStyle = '#f2cd6b';
          ctx.fillRect(bx2 - 1, by2 + 2, 2, 1);
          ctx.fillRect(bx2 - 2, by2 - 4, 4, 1);
          return;
        }
        var bc = b.mine ? (b.col || '#f2cd6b') : '#ce1126';
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = bc;
        ctx.fillRect(Math.round(b.x) - (b.pierce ? 9 : 4), Math.round(b.y), b.pierce ? 9 : 4, 1);
        ctx.globalAlpha = 1;
        ctx.fillStyle = bc;
        ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, b.pierce ? 5 : 3, 2);
      });

      if (!player.dead || Math.floor(t / 3) % 2) {
        if (!(player.inv > 0 && Math.floor(t / 4) % 2)) {
          var art = S.idle;
          if (player.prone) art = S.prone;
          else if (!player.ground) art = S.jump;
          else if (player.aim < 0) art = S.aimUp;
          else if (Math.abs(player.vx) > 0.3) art = [S.run1, S.run2, S.run3, S.run2][Math.floor(player.frame / 5) % 4];
          sprite(art, player.x - 1, player.y, player.face < 0);
        }
      }

      pops.forEach(function (q) {
        ctx.globalAlpha = Math.max(0, 1 - q.t / 46);
        ctx.fillStyle = q.txt.charAt(0) === '+' ? '#f2cd6b' : '#9bcfa5';
        ctx.font = '7px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(q.txt, q.x, q.y - q.t * 0.42);
        ctx.textAlign = 'left';
        ctx.globalAlpha = 1;
      });

      parts.forEach(function (p) {
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 18));
        ctx.fillStyle = p.col;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
        ctx.globalAlpha = 1;
      });
      ctx.restore();
    }

    function drawBoot() {
      ctx.fillStyle = '#05060a';
      ctx.fillRect(0, 0, VW, VH);

      // a sweep down the tube
      var sweep = (bootT * 3) % (VH + 40) - 20;
      var g2 = ctx.createLinearGradient(0, sweep - 18, 0, sweep + 18);
      g2.addColorStop(0, 'rgba(155,207,165,0)');
      g2.addColorStop(0.5, 'rgba(155,207,165,.10)');
      g2.addColorStop(1, 'rgba(155,207,165,0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, sweep - 18, VW, 36);

      ctx.textAlign = 'center';
      var shown = Math.min(TITLE.length, Math.floor(bootT / 3));
      ctx.font = '14px "JetBrains Mono", monospace';
      ctx.fillStyle = '#f2efe9';
      ctx.fillText(TITLE.slice(0, shown) + (bootT % 20 < 10 && shown < TITLE.length ? '_' : ''), VW / 2, 66);

      if (bootT > 46) {
        ctx.font = '7px "JetBrains Mono", monospace';
        ctx.fillStyle = '#8e8b85';
        ctx.fillText(LOADS[Math.min(LOADS.length - 1, Math.floor((bootT - 46) / 22))], VW / 2, 92);

        var p = Math.min(1, (bootT - 46) / 66);
        var bw = 150, bx2 = (VW - bw) / 2;
        ctx.fillStyle = '#23261f';
        ctx.fillRect(bx2, 102, bw, 5);
        ctx.fillStyle = '#9bcfa5';
        ctx.fillRect(bx2, 102, Math.round(bw * p), 5);
        ctx.fillStyle = '#d4a017';
        ctx.fillRect(bx2 + Math.round(bw * p) - 2, 100, 2, 9);

        // the sequence that got you here, ticking off
        ctx.font = '7px "JetBrains Mono", monospace';
        ctx.fillStyle = '#3c3b38';
        ctx.fillText('↑ ↑ ↓ ↓ ← → ← → B A', VW / 2, 126);
      }
      ctx.textAlign = 'left';
    }

    function banner(text, col) {
      ctx.fillStyle = 'rgba(10,10,11,.72)';
      ctx.fillRect(0, VH / 2 - 18, VW, 36);
      ctx.fillStyle = col;
      ctx.fillRect(0, VH / 2 - 18, VW, 1);
      ctx.fillRect(0, VH / 2 + 17, VW, 1);
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(text, VW / 2, VH / 2 + 1);
      ctx.fillStyle = '#8e8b85';
      ctx.font = '7px "JetBrains Mono", monospace';
      ctx.fillText('ESC TO LEAVE', VW / 2, VH / 2 + 12);
      ctx.textAlign = 'left';
    }

    function draw() {
      if (phase === 'boot') drawBoot();
      else {
        drawWorld();
        /* The wipe: the world is revealed from the middle out over the first
           half second of play, so the level opens rather than appears. */
        if (phase === 'wipe') {
          var w = Math.min(1, (bootT - 112) / 26);
          var half = Math.round((VH / 2) * (1 - w));
          ctx.fillStyle = '#05060a';
          ctx.fillRect(0, 0, VW, half);
          ctx.fillRect(0, VH - half, VW, half);
          ctx.fillStyle = '#9bcfa5';
          ctx.fillRect(0, half, VW, 1);
          ctx.fillRect(0, VH - half - 1, VW, 1);
        }
        if (won) banner('MISSION COMPLETE', '#9bcfa5');
        else if (lost) banner('GAME OVER', '#ce1126');
      }
      if (phase === 'play' || phase === 'wipe') {
        /* Lives, weapon and score across the top, the way the genre puts them
           — the strip under the canvas is chrome, not the game. */
        ctx.fillStyle = 'rgba(5,6,10,.55)';
        ctx.fillRect(0, 0, VW, 13);
        ctx.fillStyle = '#9bcfa5';
        ctx.fillRect(0, 13, VW, 1);
        ctx.font = '7px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ce1126';
        for (var lv = 0; lv <= player.lives; lv++) ctx.fillRect(6 + lv * 7, 4, 5, 6);
        ctx.fillStyle = '#8e8b85';
        ctx.fillText('LIVES', 6 + Math.max(1, player.lives + 1) * 7 + 4, 10);
        ctx.fillStyle = '#f2cd6b';
        ctx.textAlign = 'center';
        ctx.fillText({ R: 'RIFLE', S: 'SPREAD', L: 'LASER', M: 'MACHINE' }[player.gun] || 'RIFLE', VW / 2, 10);
        /* Hand-spaced on a fixed pitch. Left to the font, seven digits at 7px
           ran into each other and the whole readout turned to grey noise —
           a score you cannot read is not a score. Leading zeros sit back so
           the live digits are the ones the eye lands on. */
        ctx.textAlign = 'center';
        var txt = ('0000000' + score).slice(-7);
        var lead = txt.length - String(score).length;
        var right = VW - 7;
        for (var di = 0; di < txt.length; di++) {
          ctx.fillStyle = di < lead ? 'rgba(242,239,233,.22)' : '#f2efe9';
          ctx.fillText(txt[di], right - (txt.length - 1 - di) * 6, 10);
        }
        ctx.fillStyle = '#8e8b85';
        ctx.textAlign = 'right';
        ctx.fillText('SCORE', right - txt.length * 6 - 2, 10);
        ctx.textAlign = 'left';
      }

      ctx.fillStyle = 'rgba(0,0,0,.16)';
      for (var yy = 0; yy < VH; yy += 3) ctx.fillRect(0, yy, VW, 1);
    }

    function step() {
      t++;
      if (shake > 0) shake *= 0.86;

      if (phase !== 'play') {
        bootT++;
        if (bootT === 1) blip(180, 0.5, 'triangle', 0.16, 420);
        if (bootT > 46 && bootT < 112 && bootT % 9 === 0) blip(1200, 0.02, 'square', 0.07);
        if (bootT === 112) { phase = 'wipe'; blip(300, 0.3, 'triangle', 0.24, 900); }
        if (bootT === 140) { phase = 'play'; }
        if (phase === 'boot') return;
      }

      if (player.fireCd > 0) player.fireCd--;
      if (player.inv > 0) player.inv--;
      if (won || lost) return;

      if (player.dead) {
        player.dead--;
        if (player.dead === 0) { if (player.lives < 0) lost = 1; else respawn(); }
      } else {
        player.aim = keys.arrowup ? -1 : keys.arrowdown ? 1 : 0;
        player.prone = player.ground && keys.arrowdown;
        var dir = (keys.arrowright ? 1 : 0) - (keys.arrowleft ? 1 : 0);
        if (dir) player.face = dir;
        player.vx = player.prone ? 0 : dir * MOVE;
        if (Math.abs(player.vx) > 0.3) player.frame++;

        player.vy = Math.min(9, player.vy + GRAV);
        player.x += player.vx;
        if (player.vx) {
          var side = player.vx > 0 ? player.x + player.w : player.x;
          if (solidAt(side, player.y + 4) || solidAt(side, player.y + 13)) player.x -= player.vx;
        }
        player.x = Math.max(cam + 1, Math.min(W - player.w - 2, player.x));

        player.y += player.vy;
        player.ground = false;
        if (player.vy >= 0) {
          var feet = player.y + player.h;
          if (solidAt(player.x + 2, feet, true) || solidAt(player.x + player.w - 2, feet, true)) {
            player.y = Math.floor(feet / CELL) * CELL - player.h;
            player.vy = 0;
            player.ground = true;
          }
        } else if (solidAt(player.x + 4, player.y, false)) player.vy = 0;

        if (player.y > H + 30) hurt('fell');
        else if (player.ground === false && pitAt(player.x + 5, player.y + player.h + 1) && player.y + player.h > H - CELL) hurt('pit');
      }

      cam = Math.max(cam, Math.min(W - VW, player.x - VW * 0.38));

      /* Crossing the line sends a squad in from the right edge, running. */
      waves.forEach(function (wv) {
        if (wv.fired || player.x < wv.x) return;
        wv.fired = true;
        for (var n = 0; n < 3; n++) {
          foes.push({
            k: 'grunt', x: cam + VW + 12 + n * 26, home: cam + VW,
            y: (MAP.length - 1) * CELL - 15, vx: -1.35, vy: 0,
            w: 10, h: 15, hp: 1, cd: 40 + n * 22, f: 0, charging: true,
          });
        }
        blip(150, 0.4, 'sawtooth', 0.22, 70);
      });

      foes.forEach(function (f) {
        if (f.hp <= 0) return;
        if (f.x < cam - 48 || f.x > cam + VW + 48) return;
        if (f.k === 'grunt') {
          f.f = (f.f + 1) % 16;
          f.x += f.vx;
          if (solidAt(f.x + (f.vx > 0 ? f.w : 0), f.y + 8) ||
              !solidAt(f.x + f.w / 2, f.y + f.h + 2, true) ||
              (!f.charging && Math.abs(f.x - f.home) > 44)) f.vx *= -1;
          if (--f.cd <= 0 && Math.abs(player.x - f.x) < 150 && Math.abs(player.y - f.y) < 26) {
            f.cd = 95 + Math.random() * 60;
            bullets.push({ x: f.x + 5, y: f.y + 7, vx: player.x > f.x ? 2.1 : -2.1, vy: 0, mine: false, life: 130 });
            blip(240, 0.06, 'square', 0.18, 140);
          }
        } else if (f.k === 'leap') {
          f.f = (f.f + 1) % 16;
          f.vy = Math.min(9, f.vy + GRAV);
          var toward = player.x > f.x ? 1 : -1;
          if (f.ground) {
            f.vx *= 0.82;
            if (--f.cd <= 0 && Math.abs(player.x - f.x) < 130) {
              f.cd = 70 + Math.random() * 40;
              f.vy = -6.4;
              f.vx = toward * 1.55;
              f.ground = false;
              blip(320, 0.09, 'triangle', 0.14, 520);
            }
          }
          f.x += f.vx;
          if (solidAt(f.x + (f.vx > 0 ? f.w : 0), f.y + 8)) { f.x -= f.vx; f.vx = 0; }
          f.y += f.vy;
          f.ground = false;
          if (f.vy >= 0 && (solidAt(f.x + 2, f.y + f.h, true) || solidAt(f.x + f.w - 2, f.y + f.h, true))) {
            f.y = Math.floor((f.y + f.h) / CELL) * CELL - f.h;
            f.vy = 0;
            f.ground = true;
          }
          if (f.y > H + 40) f.hp = 0;
        } else if (f.k === 'bomber') {
          f.f = (f.f + 1) % 12;
          f.bob += 0.05;
          /* It drifts toward you inside its own lane rather than chasing you
             across the level: the sky stays a place you pass under, not a
             thing that follows you home. */
          var want = Math.max(f.home - f.range, Math.min(f.home + f.range, player.x - 3));
          f.x += Math.max(-f.vx, Math.min(f.vx, want - f.x));
          f.y = f.y0 + Math.sin(f.bob) * 3;
          /* Bombs come straight down, and only when it is actually over you,
             so the tell is the shadow arriving before the bomb does. */
          if (--f.cd <= 0 && Math.abs((f.x + 7) - (player.x + 5)) < 26 && player.y > f.y) {
            f.cd = 105 + Math.random() * 55;
            bullets.push({
              x: f.x + 7, y: f.y + 10, vx: 0, vy: 0.6,
              mine: false, life: 260, bomb: true,
            });
            blip(140, 0.12, 'sawtooth', 0.16, 90);
          }
        } else if (f.k === 'pick') {
          f.bob++;
          f.vy = Math.min(4, f.vy + GRAV * 0.5);
          f.y += f.vy;
          if (solidAt(f.x + 5, f.y + f.h, true)) { f.y = Math.floor((f.y + f.h) / CELL) * CELL - f.h; f.vy = 0; }
          if (!player.dead && Math.abs(f.x - player.x) < 12 && Math.abs(f.y - player.y) < 16) {
            f.hp = 0;
            player.gun = f.gun;
            score += 40;
            pops.push({ x: f.x, y: f.y, t: 0, txt: { S: 'SPREAD', M: 'MACHINE', L: 'LASER' }[f.gun] });
            burst(f.x + 5, f.y + 5, 12, '#9bcfa5', 1.6);
            blip(880, 0.3, 'triangle', 0.3, 1760);
          }
        } else if (f.k === 'turret') {
          if (--f.cd <= 0) {
            f.cd = 78;
            var ang = Math.atan2(player.y + 7 - (f.y + 10), player.x + 5 - (f.x + 6));
            bullets.push({ x: f.x + 6, y: f.y + 10, vx: Math.cos(ang) * 1.9, vy: Math.sin(ang) * 1.9, mine: false, life: 150 });
            blip(300, 0.07, 'sawtooth', 0.16, 160);
          }
        } else if (f.k === 'gate') {
          if (f.flash > 0) f.flash--;
          if (--f.cd <= 0) {
            f.cd = 46;
            for (var q = -1; q <= 1; q++) bullets.push({ x: f.x, y: f.y + 8, vx: -2.2, vy: q * 0.7, mine: false, life: 170 });
            blip(200, 0.1, 'sawtooth', 0.2, 90);
          }
        }
      });

      for (var i = bullets.length - 1; i >= 0; i--) {
        var b = bullets[i];
        /* A bomb is a bullet that falls. It gathers speed, so the window to
           move out from under one closes the longer you leave it. */
        if (b.bomb) b.vy = Math.min(4.6, b.vy + 0.14);
        b.x += b.vx; b.y += b.vy; b.life--;
        if (b.life <= 0 || b.x < cam - 24 || b.x > cam + VW + 24 || b.y < -12 || b.y > H + 12) { bullets.splice(i, 1); continue; }
        if (solidAt(b.x, b.y)) {
          if (b.bomb) {
            burst(b.x, b.y, 14, '#f2cd6b', 2.2);
            shake = Math.max(shake, 5);
            blip(90, 0.22, 'sawtooth', 0.26, 40);
            noise(0.16, 0.3);
            /* The blast has reach the shell did not — standing right beside
               the impact still costs you. */
            if (!player.dead && player.inv <= 0 &&
                Math.abs((b.x) - (player.x + 5)) < 13 && Math.abs(b.y - (player.y + 8)) < 15) hurt('blast');
          } else {
            burst(b.x, b.y, 2, '#6f6d68', 0.8);
          }
          bullets.splice(i, 1);
          continue;
        }
        if (b.mine) {
          for (var j = 0; j < foes.length; j++) {
            var f2 = foes[j];
            if (f2.hp <= 0) continue;
            var fh = f2.h + (f2.k === 'turret' ? 6 : 0);
            if (b.x > f2.x && b.x < f2.x + f2.w && b.y > f2.y && b.y < f2.y + fh) {
              if (b.pierce && b.hit.indexOf(j) >= 0) continue;
              f2.hp -= (b.dmg || 1);
              if (b.pierce) b.hit.push(j); else bullets.splice(i, 1);
              burst(b.x, b.y, 5, '#f2cd6b', 1.4);
              blip(520, 0.05, 'square', 0.2, 300);
              if (f2.k === 'gate') { f2.flash = 3; shake = Math.max(shake, 3); }
              if (f2.hp <= 0) {
                var pts = f2.k === 'gate' ? 500 : f2.k === 'bomber' ? 75
                  : f2.k === 'turret' ? 60 : f2.k === 'leap' ? 40 : 25;
                score += pts;
                pops.push({ x: f2.x + f2.w / 2, y: f2.y, t: 0, txt: '+' + pts });
                burst(f2.x + f2.w / 2, f2.y + f2.h / 2, f2.k === 'gate' ? 60 : 18, '#ce1126', f2.k === 'gate' ? 3.4 : 2);
                shake = Math.max(shake, f2.k === 'gate' ? 20 : 6);
                noise(0.3, 0.4);
                blip(120, 0.35, 'sawtooth', 0.3, 50);
                if (f2.k === 'gate') { won = 1; blip(660, 0.5, 'triangle', 0.3, 1320); }
                /* Turrets and leapers are carrying; grunts sometimes are. */
                var drops = f2.k === 'bomber' ? 0.85 : f2.k === 'turret' ? 0.8
                  : f2.k === 'leap' ? 0.55 : 0.16;
                if (f2.k === 'bomber') { burst(f2.x + 8, f2.y + 8, 26, '#f2cd6b', 2.6); shake = Math.max(shake, 9); }
                if (f2.k !== 'gate' && Math.random() < drops) {
                  var pool2 = ['S', 'M', 'L'];
                  foes.push({
                    k: 'pick', gun: pool2[(Math.random() * pool2.length) | 0],
                    x: f2.x, y: f2.y, vy: -1.6, w: 10, h: 10, hp: 1, bob: 0,
                  });
                }
              }
              break;
            }
          }
        } else if (!player.dead && player.inv <= 0) {
          var ph = player.prone ? 6 : player.h;
          var py2 = player.y + (player.prone ? 9 : 0);
          if (b.x > player.x && b.x < player.x + player.w && b.y > py2 && b.y < py2 + ph) {
            bullets.splice(i, 1);
            hurt('shot');
          }
        }
      }

      if (!player.dead && player.inv <= 0) {
        for (var z = 0; z < foes.length; z++) {
          var fz = foes[z];
          if (fz.k === 'grunt' && fz.hp > 0 && Math.abs(fz.x - player.x) < 9 && Math.abs(fz.y - player.y) < 13) { hurt('touch'); break; }
        }
      }

      for (var pk = pops.length - 1; pk >= 0; pk--) {
        pops[pk].t++;
        if (pops[pk].t > 46) pops.splice(pk, 1);
      }
      for (var p2 = parts.length - 1; p2 >= 0; p2--) {
        var pp = parts[p2];
        pp.x += pp.vx; pp.y += pp.vy; pp.vy += 0.12; pp.life--;
        if (pp.life <= 0) parts.splice(p2, 1);
      }

      hud.textContent =
        'LIVES ' + new Array(Math.max(0, player.lives + 1) + 1).join('▮') +
        '   ·   ' + ({ R: 'RIFLE', S: 'SPREAD', L: 'LASER', M: 'MACHINE' }[player.gun] || 'RIFLE') +
        '   ·   ' + ('00000' + score).slice(-5);
    }

    /* step() used to run once per animation frame, so the whole game ran at
       the refresh rate of the panel it was on — double speed on any 120Hz
       display, which is every recent Mac. The simulation is pinned to 60Hz and
       the frame only decides how often it is drawn. */
    var raf = 0, acc = 0, prev = 0;
    var STEP = 1000 / 60;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (!prev) prev = now;
      acc += Math.min(100, now - prev);   // a backgrounded tab must not fast-forward
      prev = now;
      var guard = 0;
      while (acc >= STEP && guard++ < 5) { acc -= STEP; step(); }
      draw();
    }
    raf = requestAnimationFrame(loop);

    function close() {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keyup', onKey, true);
      window.removeEventListener('resize', resize);
      host.classList.remove('cx-in');
      document.body.classList.remove('cx-lock');
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
      if (window.lenis && window.lenis.start) window.lenis.start();
      root.classList.remove('cx-on');
      setTimeout(function () { host.remove(); }, 320);
      game = null;
    }

    host.tabIndex = -1;
    host.focus();
    return { close: close };
  }

  /* ---- the code ---------------------------------------------------------
     A field must be able to receive b and a without the page taking them, so
     the same guard the "egypt" code uses applies here. */
  var SEQ = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  var at = 0;

  document.addEventListener('keydown', function (e) {
    if (game) return;
    var el = e.target;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
    var k = String(e.key || '').toLowerCase();
    if (k === SEQ[at]) {
      at++;
      if (at === SEQ.length) { at = 0; if (canPlay) open(); else toast(); }
    } else {
      at = k === SEQ[0] ? 1 : 0;
    }
  });

  /* Entered where it cannot be played, the code still answers — silence
     reads as a broken egg rather than an unavailable one. */
  function toast() {
    var el = document.createElement('p');
    el.className = 'cx-toast';
    el.setAttribute('role', 'status');
    el.textContent = 'Operation Bone needs a keyboard and a wider screen.';
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('on'); });
    setTimeout(function () {
      el.classList.remove('on');
      setTimeout(function () { el.remove(); }, 400);
    }, 3200);
  }
})();
