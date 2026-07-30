/* =========================================================================
 * CHESS — the "chess" egg.
 * -------------------------------------------------------------------------
 * Type "chess" anywhere that is not a text field and a board comes up over
 * the page. You are white, white moves first, and the thing on the other
 * side of the board actually knows the rules.
 *
 * Its own file for the reason snake.js, contra.js and pool.js are: script.js
 * owns the hero and approved.js runs on routes with no hero to attach to, so
 * the worst failure available here is "the word does nothing".
 *
 * The engine is written out rather than pulled in. Full legal move
 * generation — castling, en passant, promotion, pinned pieces, check
 * evasion — then alpha-beta negamax over a material + piece-square
 * evaluation, with a quiescence search so it does not walk into a recapture
 * it cannot see, and iterative deepening under a time budget so it answers
 * in about the time a person would. No library, no assets, one file.
 *
 * Board indices run 0..63 from a8 to h1, so index 0 is the top-left square
 * as drawn. Uppercase is white, lowercase is black — the same convention
 * FEN uses, which makes the whole engine readable against any reference.
 * ========================================================================= */

(function chessEgg() {
  'use strict';

  if (!document.body) return;

  var canPlay = matchMedia('(min-width: 680px)').matches;

  /* ---- engine ----------------------------------------------------------- */

  var START = 'rnbqkbnrpppppppp................................PPPPPPPPRNBQKBNR';

  var VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

  /* Piece-square tables, written from white's point of view and mirrored for
     black at read time. They are what stop the engine playing a legal but
     witless game: knights come off the rim, the king sits behind its pawns
     until the board empties out. */
  var PST = {
    p: [
      0, 0, 0, 0, 0, 0, 0, 0,
      50, 50, 50, 50, 50, 50, 50, 50,
      10, 10, 20, 30, 30, 20, 10, 10,
      5, 5, 10, 25, 25, 10, 5, 5,
      0, 0, 0, 20, 20, 0, 0, 0,
      5, -5, -10, 0, 0, -10, -5, 5,
      5, 10, 10, -20, -20, 10, 10, 5,
      0, 0, 0, 0, 0, 0, 0, 0,
    ],
    n: [
      -50, -40, -30, -30, -30, -30, -40, -50,
      -40, -20, 0, 0, 0, 0, -20, -40,
      -30, 0, 10, 15, 15, 10, 0, -30,
      -30, 5, 15, 20, 20, 15, 5, -30,
      -30, 0, 15, 20, 20, 15, 0, -30,
      -30, 5, 10, 15, 15, 10, 5, -30,
      -40, -20, 0, 5, 5, 0, -20, -40,
      -50, -40, -30, -30, -30, -30, -40, -50,
    ],
    b: [
      -20, -10, -10, -10, -10, -10, -10, -20,
      -10, 0, 0, 0, 0, 0, 0, -10,
      -10, 0, 5, 10, 10, 5, 0, -10,
      -10, 5, 5, 10, 10, 5, 5, -10,
      -10, 0, 10, 10, 10, 10, 0, -10,
      -10, 10, 10, 10, 10, 10, 10, -10,
      -10, 5, 0, 0, 0, 0, 5, -10,
      -20, -10, -10, -10, -10, -10, -10, -20,
    ],
    r: [
      0, 0, 0, 0, 0, 0, 0, 0,
      5, 10, 10, 10, 10, 10, 10, 5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      0, 0, 0, 5, 5, 0, 0, 0,
    ],
    q: [
      -20, -10, -10, -5, -5, -10, -10, -20,
      -10, 0, 0, 0, 0, 0, 0, -10,
      -10, 0, 5, 5, 5, 5, 0, -10,
      -5, 0, 5, 5, 5, 5, 0, -5,
      0, 0, 5, 5, 5, 5, 0, -5,
      -10, 5, 5, 5, 5, 5, 0, -10,
      -10, 0, 5, 0, 0, 0, 0, -10,
      -20, -10, -10, -5, -5, -10, -10, -20,
    ],
    k: [
      -30, -40, -40, -50, -50, -40, -40, -30,
      -30, -40, -40, -50, -50, -40, -40, -30,
      -30, -40, -40, -50, -50, -40, -40, -30,
      -30, -40, -40, -50, -50, -40, -40, -30,
      -20, -30, -30, -40, -40, -30, -30, -20,
      -10, -20, -20, -20, -20, -20, -20, -10,
      20, 20, 0, 0, 0, 20, 20, 20,
      20, 30, 10, 0, 0, 10, 30, 20,
    ],
    /* Once the queens are gone the king is a piece, not a liability. */
    kEnd: [
      -50, -40, -30, -20, -20, -30, -40, -50,
      -30, -20, -10, 0, 0, -10, -20, -30,
      -30, -10, 20, 30, 30, 20, -10, -30,
      -30, -10, 30, 40, 40, 30, -10, -30,
      -30, -10, 30, 40, 40, 30, -10, -30,
      -30, -10, 20, 30, 30, 20, -10, -30,
      -30, -30, 0, 0, 0, 0, -30, -30,
      -50, -30, -30, -30, -30, -30, -30, -50,
    ],
  };

  var N_DIRS = [-17, -15, -10, -6, 6, 10, 15, 17];
  var B_DIRS = [-9, -7, 7, 9];
  var R_DIRS = [-8, -1, 1, 8];
  var K_DIRS = [-9, -8, -7, -1, 1, 7, 8, 9];

  function fileOf(i) { return i & 7; }
  function rankOf(i) { return i >> 3; }
  function isWhite(p) { return p >= 'A' && p <= 'Z'; }
  function sideOf(p) { return isWhite(p) ? 'w' : 'b'; }

  /* Off-board detection by file distance, which is what makes a flat 64
     array safe: a knight that "wraps" from h-file to a-file moves seven
     files, and no real knight move moves more than two. */
  function stepOk(from, to, maxFileJump) {
    if (to < 0 || to > 63) return false;
    return Math.abs(fileOf(to) - fileOf(from)) <= maxFileJump;
  }

  function newGame() {
    return {
      bd: START.split(''),
      turn: 'w',
      cast: { K: true, Q: true, k: true, q: true },
      ep: -1,
      half: 0,
      full: 1,
    };
  }

  function cloneState(s) {
    return {
      bd: s.bd.slice(),
      turn: s.turn,
      cast: { K: s.cast.K, Q: s.cast.Q, k: s.cast.k, q: s.cast.q },
      ep: s.ep,
      half: s.half,
      full: s.full,
    };
  }

  /* Is `sq` attacked by `by`? Asked from the square outward rather than by
     generating every enemy move, because check detection runs inside move
     legality and would otherwise recurse. */
  function attacked(bd, sq, by) {
    var i, d, t, p;
    var white = by === 'w';

    /* Pawns. A white pawn on the square below-left attacks up-right. */
    var pdir = white ? 8 : -8;
    for (i = -1; i <= 1; i += 2) {
      t = sq + pdir + i;
      if (t >= 0 && t < 64 && Math.abs(fileOf(t) - fileOf(sq)) === 1) {
        if (bd[t] === (white ? 'P' : 'p')) return true;
      }
    }
    for (i = 0; i < 8; i++) {
      t = sq + N_DIRS[i];
      if (!stepOk(sq, t, 2)) continue;
      if (bd[t] === (white ? 'N' : 'n')) return true;
    }
    for (i = 0; i < 8; i++) {
      t = sq + K_DIRS[i];
      if (!stepOk(sq, t, 1)) continue;
      if (bd[t] === (white ? 'K' : 'k')) return true;
    }
    for (i = 0; i < 4; i++) {
      d = B_DIRS[i];
      t = sq;
      for (;;) {
        var prev = t;
        t += d;
        if (!stepOk(prev, t, 1)) break;
        p = bd[t];
        if (p !== '.') {
          if (sideOf(p) === by && (p.toLowerCase() === 'b' || p.toLowerCase() === 'q')) return true;
          break;
        }
      }
    }
    for (i = 0; i < 4; i++) {
      d = R_DIRS[i];
      t = sq;
      for (;;) {
        var prev2 = t;
        t += d;
        if (t < 0 || t > 63) break;
        if ((d === 1 || d === -1) && rankOf(t) !== rankOf(prev2)) break;
        p = bd[t];
        if (p !== '.') {
          if (sideOf(p) === by && (p.toLowerCase() === 'r' || p.toLowerCase() === 'q')) return true;
          break;
        }
      }
    }
    return false;
  }

  function kingSq(bd, side) {
    var want = side === 'w' ? 'K' : 'k';
    for (var i = 0; i < 64; i++) if (bd[i] === want) return i;
    return -1;
  }

  function inCheck(s, side) {
    var k = kingSq(s.bd, side);
    return k >= 0 && attacked(s.bd, k, side === 'w' ? 'b' : 'w');
  }

  /* Pseudo-legal generation. Legality is a second pass, because filtering by
     "does this leave my king in check" needs a made move to test. */
  function pseudo(s, capturesOnly) {
    var out = [];
    var bd = s.bd;
    var white = s.turn === 'w';
    var me = s.turn;
    var i, j, d, t, p, prev;

    function push(from, to, extra) {
      var m = { from: from, to: to, cap: bd[to] !== '.' ? bd[to] : '', promo: '', ep: false, castle: '' };
      if (extra) { if (extra.promo) m.promo = extra.promo; if (extra.ep) { m.ep = true; m.cap = white ? 'p' : 'P'; } if (extra.castle) m.castle = extra.castle; }
      if (capturesOnly && !m.cap && !m.promo) return;
      out.push(m);
    }

    for (i = 0; i < 64; i++) {
      p = bd[i];
      if (p === '.' || sideOf(p) !== me) continue;
      var kind = p.toLowerCase();

      if (kind === 'p') {
        var fwd = white ? -8 : 8;
        var startRank = white ? 6 : 1;
        var lastRank = white ? 0 : 7;
        t = i + fwd;
        if (t >= 0 && t < 64 && bd[t] === '.') {
          if (rankOf(t) === lastRank) {
            ['q', 'r', 'b', 'n'].forEach(function (pr) { push(i, t, { promo: pr }); });
          } else {
            push(i, t);
            if (rankOf(i) === startRank && bd[i + fwd * 2] === '.') push(i, i + fwd * 2);
          }
        }
        for (j = -1; j <= 1; j += 2) {
          t = i + fwd + j;
          if (t < 0 || t > 63 || Math.abs(fileOf(t) - fileOf(i)) !== 1) continue;
          if (bd[t] !== '.' && sideOf(bd[t]) !== me) {
            if (rankOf(t) === lastRank) ['q', 'r', 'b', 'n'].forEach(function (pr) { push(i, t, { promo: pr }); });
            else push(i, t);
          } else if (t === s.ep) {
            push(i, t, { ep: true });
          }
        }
        continue;
      }

      if (kind === 'n') {
        for (j = 0; j < 8; j++) {
          t = i + N_DIRS[j];
          if (!stepOk(i, t, 2)) continue;
          if (bd[t] !== '.' && sideOf(bd[t]) === me) continue;
          push(i, t);
        }
        continue;
      }

      if (kind === 'k') {
        for (j = 0; j < 8; j++) {
          t = i + K_DIRS[j];
          if (!stepOk(i, t, 1)) continue;
          if (bd[t] !== '.' && sideOf(bd[t]) === me) continue;
          push(i, t);
        }
        /* Castling: the king may not start in check, pass through an attacked
           square, or land on one — and the squares between must be empty. */
        if (!capturesOnly) {
          var home = white ? 60 : 4;
          var foe = white ? 'b' : 'w';
          if (i === home && !attacked(bd, home, foe)) {
            var kRight = white ? s.cast.K : s.cast.k;
            var qRight = white ? s.cast.Q : s.cast.q;
            if (kRight && bd[home + 1] === '.' && bd[home + 2] === '.' &&
                bd[home + 3] === (white ? 'R' : 'r') &&
                !attacked(bd, home + 1, foe) && !attacked(bd, home + 2, foe)) {
              push(i, home + 2, { castle: 'k' });
            }
            if (qRight && bd[home - 1] === '.' && bd[home - 2] === '.' && bd[home - 3] === '.' &&
                bd[home - 4] === (white ? 'R' : 'r') &&
                !attacked(bd, home - 1, foe) && !attacked(bd, home - 2, foe)) {
              push(i, home - 2, { castle: 'q' });
            }
          }
        }
        continue;
      }

      var dirs = kind === 'b' ? B_DIRS : kind === 'r' ? R_DIRS : B_DIRS.concat(R_DIRS);
      for (j = 0; j < dirs.length; j++) {
        d = dirs[j];
        t = i;
        for (;;) {
          prev = t;
          t += d;
          if (t < 0 || t > 63) break;
          if (Math.abs(fileOf(t) - fileOf(prev)) > 1) break;
          if (bd[t] !== '.') {
            if (sideOf(bd[t]) !== me) push(prev === i ? i : i, t);
            break;
          }
          push(i, t);
        }
      }
    }
    return out;
  }

  /* Apply in place and hand back everything needed to take it back. */
  function make(s, m) {
    var bd = s.bd;
    var undo = {
      cap: bd[m.to], from: bd[m.from], ep: s.ep, half: s.half,
      cast: { K: s.cast.K, Q: s.cast.Q, k: s.cast.k, q: s.cast.q },
      rookFrom: -1, rookTo: -1, epCapSq: -1,
    };
    var white = s.turn === 'w';
    var piece = bd[m.from];
    var kind = piece.toLowerCase();

    bd[m.to] = m.promo ? (white ? m.promo.toUpperCase() : m.promo) : piece;
    bd[m.from] = '.';

    if (m.ep) {
      var capSq = m.to + (white ? 8 : -8);
      undo.epCapSq = capSq;
      undo.cap = bd[capSq];
      bd[capSq] = '.';
    }

    if (m.castle) {
      var home = white ? 60 : 4;
      if (m.castle === 'k') { undo.rookFrom = home + 3; undo.rookTo = home + 1; }
      else { undo.rookFrom = home - 4; undo.rookTo = home - 1; }
      bd[undo.rookTo] = bd[undo.rookFrom];
      bd[undo.rookFrom] = '.';
    }

    s.ep = -1;
    if (kind === 'p' && Math.abs(m.to - m.from) === 16) s.ep = (m.from + m.to) / 2;

    if (kind === 'k') { if (white) { s.cast.K = s.cast.Q = false; } else { s.cast.k = s.cast.q = false; } }
    if (m.from === 63 || m.to === 63) s.cast.K = false;
    if (m.from === 56 || m.to === 56) s.cast.Q = false;
    if (m.from === 7 || m.to === 7) s.cast.k = false;
    if (m.from === 0 || m.to === 0) s.cast.q = false;

    s.half = (kind === 'p' || undo.cap !== '.') ? 0 : s.half + 1;
    if (!white) s.full++;
    s.turn = white ? 'b' : 'w';
    return undo;
  }

  function unmake(s, m, u) {
    var bd = s.bd;
    s.turn = s.turn === 'w' ? 'b' : 'w';
    if (s.turn === 'b') s.full--;
    bd[m.from] = u.from;
    bd[m.to] = u.epCapSq >= 0 ? '.' : u.cap;
    if (u.epCapSq >= 0) bd[u.epCapSq] = u.cap;
    if (u.rookFrom >= 0) { bd[u.rookFrom] = bd[u.rookTo]; bd[u.rookTo] = '.'; }
    s.ep = u.ep;
    s.half = u.half;
    s.cast = u.cast;
  }

  function legal(s) {
    var ms = pseudo(s, false);
    var out = [];
    var me = s.turn;
    for (var i = 0; i < ms.length; i++) {
      var u = make(s, ms[i]);
      if (!inCheck(s, me)) out.push(ms[i]);
      unmake(s, ms[i], u);
    }
    return out;
  }

  function endgame(bd) {
    var big = 0;
    for (var i = 0; i < 64; i++) {
      var k = bd[i].toLowerCase();
      if (k === 'q' || k === 'r') big++;
    }
    return big <= 2;
  }

  /* Positive is good for the side to move. */
  function evaluate(s) {
    var bd = s.bd;
    var sc = 0;
    var end = endgame(bd);
    for (var i = 0; i < 64; i++) {
      var p = bd[i];
      if (p === '.') continue;
      var white = isWhite(p);
      var k = p.toLowerCase();
      var table = k === 'k' ? (end ? PST.kEnd : PST.k) : PST[k];
      var sq = white ? i : (56 - (i & 56)) + (i & 7);
      var v = VAL[k] + table[sq];
      sc += white ? v : -v;
    }
    return s.turn === 'w' ? sc : -sc;
  }

  /* Most-valuable-victim / least-valuable-attacker, so the search looks at
     QxP before PxQ and prunes far more of the tree. */
  function order(s, ms) {
    var bd = s.bd;
    ms.forEach(function (m) {
      m.s = 0;
      if (m.cap) m.s = 10 * VAL[m.cap.toLowerCase()] - VAL[bd[m.from].toLowerCase()];
      if (m.promo) m.s += VAL[m.promo] * 8;
    });
    ms.sort(function (a, b) { return b.s - a.s; });
    return ms;
  }

  var MATE = 900000;
  var nodes = 0;

  function quiesce(s, alpha, beta, depth) {
    nodes++;
    var stand = evaluate(s);
    if (stand >= beta) return beta;
    if (stand > alpha) alpha = stand;
    if (depth <= 0) return alpha;
    var ms = order(s, pseudo(s, true));
    var me = s.turn;
    for (var i = 0; i < ms.length; i++) {
      var u = make(s, ms[i]);
      if (inCheck(s, me)) { unmake(s, ms[i], u); continue; }
      var sc = -quiesce(s, -beta, -alpha, depth - 1);
      unmake(s, ms[i], u);
      if (sc >= beta) return beta;
      if (sc > alpha) alpha = sc;
    }
    return alpha;
  }

  function search(s, depth, alpha, beta, ply) {
    nodes++;
    if (depth <= 0) return quiesce(s, alpha, beta, 4);
    var me = s.turn;
    var ms = order(s, pseudo(s, false));
    var any = false;
    for (var i = 0; i < ms.length; i++) {
      var u = make(s, ms[i]);
      if (inCheck(s, me)) { unmake(s, ms[i], u); continue; }
      any = true;
      var sc = -search(s, depth - 1, -beta, -alpha, ply + 1);
      unmake(s, ms[i], u);
      if (sc >= beta) return beta;
      if (sc > alpha) alpha = sc;
    }
    if (!any) {
      /* Mate is scored by distance so the engine plays the shortest one and,
         when losing, the longest. Stalemate is exactly nothing. */
      return inCheck(s, me) ? -MATE + ply : 0;
    }
    if (s.half >= 100) return 0;
    return alpha;
  }

  /* Iterative deepening under a wall-clock budget: it always has a complete
     answer from the previous depth, so running out of time costs strength
     rather than correctness. */
  function think(state, budgetMs, maxDepth) {
    var s = cloneState(state);
    var root = legal(s);
    if (!root.length) return null;
    nodes = 0;
    var t0 = Date.now();
    var best = root[0];
    var bestScore = -Infinity;

    order(s, root);
    for (var d = 1; d <= maxDepth; d++) {
      var localBest = null;
      var localScore = -Infinity;
      var alpha = -Infinity;
      for (var i = 0; i < root.length; i++) {
        var u = make(s, root[i]);
        var sc = -search(s, d - 1, -Infinity, -alpha, 1);
        unmake(s, root[i], u);
        if (sc > localScore) { localScore = sc; localBest = root[i]; }
        if (sc > alpha) alpha = sc;
        if (Date.now() - t0 > budgetMs) break;
      }
      if (localBest) {
        best = localBest;
        bestScore = localScore;
        /* Put the best move first so the next, deeper pass prunes hard. */
        var bi = root.indexOf(localBest);
        if (bi > 0) { root.splice(bi, 1); root.unshift(localBest); }
      }
      if (Date.now() - t0 > budgetMs) break;
      if (bestScore > MATE - 100) break;
    }
    return { move: best, score: bestScore, nodes: nodes, ms: Date.now() - t0, depth: d };
  }

  /* ---- notation --------------------------------------------------------- */

  var FILES = 'abcdefgh';
  function sqName(i) { return FILES[fileOf(i)] + (8 - rankOf(i)); }

  function san(s, m, afterState) {
    var piece = s.bd[m.from];
    var kind = piece.toLowerCase();
    var txt;
    if (m.castle) {
      txt = m.castle === 'k' ? 'O-O' : 'O-O-O';
    } else if (kind === 'p') {
      txt = m.cap ? FILES[fileOf(m.from)] + 'x' + sqName(m.to) : sqName(m.to);
      if (m.promo) txt += '=' + m.promo.toUpperCase();
    } else {
      /* Disambiguate only when another piece of the same kind could also
         reach the square, which is the whole reason SAN is readable. */
      var same = pseudo(s, false).filter(function (o) {
        return o.to === m.to && o.from !== m.from && s.bd[o.from] === piece;
      });
      var dis = '';
      if (same.length) {
        var fileClash = same.some(function (o) { return fileOf(o.from) === fileOf(m.from); });
        dis = fileClash ? String(8 - rankOf(m.from)) : FILES[fileOf(m.from)];
      }
      txt = piece.toUpperCase() + dis + (m.cap ? 'x' : '') + sqName(m.to);
    }
    var foe = afterState.turn;
    if (inCheck(afterState, foe)) txt += legal(afterState).length ? '+' : '#';
    return txt;
  }

  /* ---- sound ------------------------------------------------------------ */

  var actx = null, master = null, muted = false;
  function blip(freq, dur, type, vol, slideTo) {
    if (muted || !window.AudioContext) return;
    try {
      if (!actx) {
        actx = new AudioContext();
        master = actx.createGain();
        master.gain.value = 0.15;
        master.connect(actx.destination);
      }
      if (actx.state !== 'running') actx.resume();
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'triangle';
      o.frequency.setValueAtTime(freq, actx.currentTime);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, actx.currentTime + dur);
      g.gain.setValueAtTime(0, actx.currentTime);
      g.gain.linearRampToValueAtTime(vol || 0.2, actx.currentTime + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
      o.connect(g); g.connect(master);
      o.start(); o.stop(actx.currentTime + dur + 0.02);
    } catch (_) { /* sound is a nicety, never a dependency */ }
  }

  /* ---- board -------------------------------------------------------------
     Pieces live in one absolutely positioned layer and move by transform, so
     a move is a transition rather than a redraw. Squares are a separate grid
     underneath that never changes. */

  var GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function codeToast(text, colour) {
    var e = el('p', 'egg-code-toast');
    e.setAttribute('role', 'status');
    e.style.setProperty('--code-colour', colour);
    e.appendChild(el('i'));
    e.lastChild.setAttribute('aria-hidden', 'true');
    e.appendChild(document.createTextNode(text));
    document.body.appendChild(e);
    requestAnimationFrame(function () { e.classList.add('on'); });
    setTimeout(function () {
      e.classList.remove('on');
      setTimeout(function () { e.remove(); }, 460);
    }, 2600);
  }

  var game = null;

  function open() {
    if (game) return;
    codeToast('CHESS — you are white', '#6f6ab8');
    game = build();
  }

  function build() {
    var state = newGame();
    var history = [];        // { san, side }
    var taken = { w: [], b: [] };
    var sel = -1;
    var moves = [];          // legal moves for the human, this turn
    var lastMove = null;
    var over = '';
    var thinking = false;
    var pieceEls = {};       // square index -> element
    var pending = null;      // promotion awaiting a choice

    var host = el('div', 'ch-host');
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-modal', 'true');
    host.setAttribute('aria-label', 'Chess against the machine');

    var wrap = el('div', 'ch-wrap');
    host.appendChild(wrap);

    /* --- the board ------------------------------------------------------ */
    var boardWrap = el('div', 'ch-board-wrap');
    var board = el('div', 'ch-board');
    var squares = [];
    for (var i = 0; i < 64; i++) {
      var sq = el('button', 'ch-sq' + (((fileOf(i) + rankOf(i)) % 2) ? ' dark' : ' light'));
      sq.type = 'button';
      sq.setAttribute('aria-label', sqName(i));
      sq.dataset.i = String(i);
      /* The reveal deals the squares in from the corner rather than showing
         all sixty-four at once. */
      sq.style.setProperty('--d', String((fileOf(i) + rankOf(i)) * 16));
      board.appendChild(sq);
      squares.push(sq);
    }
    var layer = el('div', 'ch-pieces');
    boardWrap.appendChild(board);
    boardWrap.appendChild(layer);

    var files = el('div', 'ch-files');
    for (var f = 0; f < 8; f++) files.appendChild(el('span', null, FILES[f]));
    var ranks = el('div', 'ch-ranks');
    for (var r = 0; r < 8; r++) ranks.appendChild(el('span', null, String(8 - r)));
    boardWrap.appendChild(files);
    boardWrap.appendChild(ranks);
    wrap.appendChild(boardWrap);

    /* --- the panel ------------------------------------------------------ */
    var panel = el('aside', 'ch-panel');

    var head = el('div', 'ch-head');
    head.appendChild(el('p', 'ch-eyebrow', 'HIDDEN GAME · 03'));
    head.appendChild(el('h2', null, 'Chess'));
    head.appendChild(el('p', 'ch-sub', 'You are white. White moves first.'));
    panel.appendChild(head);

    var turnBar = el('div', 'ch-turn');
    var turnDot = el('i');
    turnDot.setAttribute('aria-hidden', 'true');
    var turnTxt = el('b', null, 'Your move');
    var turnNote = el('span', null, 'move 1');
    turnBar.appendChild(turnDot);
    turnBar.appendChild(turnTxt);
    turnBar.appendChild(turnNote);
    panel.appendChild(turnBar);

    var scoreRow = el('div', 'ch-score');
    var youBox = el('div', 'ch-side');
    youBox.appendChild(el('p', 'ch-side-k', 'YOU · WHITE'));
    var youVal = el('p', 'ch-side-v', '0');
    var youTaken = el('p', 'ch-taken', '');
    youBox.appendChild(youVal);
    youBox.appendChild(youTaken);
    var cpuBox = el('div', 'ch-side');
    cpuBox.appendChild(el('p', 'ch-side-k', 'ENGINE · BLACK'));
    var cpuVal = el('p', 'ch-side-v', '0');
    var cpuTaken = el('p', 'ch-taken', '');
    cpuBox.appendChild(cpuVal);
    cpuBox.appendChild(cpuTaken);
    scoreRow.appendChild(youBox);
    scoreRow.appendChild(cpuBox);
    panel.appendChild(scoreRow);

    var movesBox = el('div', 'ch-moves');
    var movesList = el('ol');
    movesBox.appendChild(movesList);
    panel.appendChild(movesBox);

    var stat = el('p', 'ch-stat', '');
    panel.appendChild(stat);

    var acts = el('div', 'ch-acts');
    var againBtn = el('button', 'ch-btn', 'New game');
    againBtn.type = 'button';
    var undoBtn = el('button', 'ch-btn ch-btn-q', 'Take back');
    undoBtn.type = 'button';
    var quitBtn = el('button', 'ch-btn ch-btn-q', 'Leave');
    quitBtn.type = 'button';
    acts.appendChild(againBtn);
    acts.appendChild(undoBtn);
    acts.appendChild(quitBtn);
    panel.appendChild(acts);

    panel.appendChild(el('p', 'ch-help', 'Click a piece, then its square · M sound · Esc to leave'));
    wrap.appendChild(panel);

    /* --- promotion chooser --------------------------------------------- */
    var promo = el('div', 'ch-promo');
    promo.setAttribute('aria-hidden', 'true');
    var promoIn = el('div', 'ch-promo-in');
    promoIn.appendChild(el('p', null, 'Promote to'));
    var promoRow = el('div', 'ch-promo-row');
    ['q', 'r', 'b', 'n'].forEach(function (k) {
      var b = el('button', 'ch-promo-b', GLYPH[k]);
      b.type = 'button';
      b.setAttribute('aria-label', { q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight' }[k]);
      b.addEventListener('click', function () { choosePromo(k); });
      promoRow.appendChild(b);
    });
    promoIn.appendChild(promoRow);
    promo.appendChild(promoIn);
    host.appendChild(promo);

    /* --- result banner -------------------------------------------------- */
    var banner = el('div', 'ch-banner');
    banner.setAttribute('aria-hidden', 'true');
    var bannerIn = el('div', 'ch-banner-in');
    var bannerH = el('h3', null, '');
    var bannerP = el('p', null, '');
    var bannerB = el('button', 'ch-btn', 'Play again');
    bannerB.type = 'button';
    bannerIn.appendChild(bannerH);
    bannerIn.appendChild(bannerP);
    bannerIn.appendChild(bannerB);
    banner.appendChild(bannerIn);
    host.appendChild(banner);

    document.body.appendChild(host);
    document.documentElement.classList.add('ch-on');

    /* --- rendering ------------------------------------------------------ */

    function place(e, i) {
      e.style.transform = 'translate(' + (fileOf(i) * 100) + '%,' + (rankOf(i) * 100) + '%)';
    }

    function buildPieces() {
      layer.textContent = '';
      pieceEls = {};
      for (var i = 0; i < 64; i++) {
        var p = state.bd[i];
        if (p === '.') continue;
        addPiece(p, i);
      }
    }

    function addPiece(p, i) {
      var e = el('span', 'ch-pc ' + (isWhite(p) ? 'w' : 'b'), GLYPH[p.toLowerCase()]);
      e.setAttribute('aria-hidden', 'true');
      place(e, i);
      layer.appendChild(e);
      pieceEls[i] = e;
      return e;
    }

    function marks() {
      squares.forEach(function (sq, i) {
        sq.classList.toggle('sel', i === sel);
        sq.classList.toggle('from', !!lastMove && lastMove.from === i);
        sq.classList.toggle('to', !!lastMove && lastMove.to === i);
        sq.classList.remove('go', 'take');
        sq.classList.remove('check');
      });
      if (sel >= 0) {
        moves.filter(function (m) { return m.from === sel; }).forEach(function (m) {
          squares[m.to].classList.add(m.cap ? 'take' : 'go');
        });
      }
      if (!over && inCheck(state, state.turn)) {
        var k = kingSq(state.bd, state.turn);
        if (k >= 0) squares[k].classList.add('check');
      }
    }

    function material() {
      var w = 0, b = 0;
      for (var i = 0; i < 64; i++) {
        var p = state.bd[i];
        if (p === '.' || p.toLowerCase() === 'k') continue;
        if (isWhite(p)) w += VAL[p.toLowerCase()]; else b += VAL[p.toLowerCase()];
      }
      return { w: w, b: b };
    }

    function panelPaint() {
      var m = material();
      var edge = Math.round((m.w - m.b) / 100 * 10) / 10;
      youVal.textContent = edge > 0 ? '+' + edge : String(edge === 0 ? 0 : edge);
      cpuVal.textContent = edge < 0 ? '+' + (-edge) : String(edge === 0 ? 0 : -edge);
      youVal.classList.toggle('up', edge > 0);
      cpuVal.classList.toggle('up', edge < 0);
      youTaken.textContent = taken.w.map(function (p) { return GLYPH[p.toLowerCase()]; }).join('');
      cpuTaken.textContent = taken.b.map(function (p) { return GLYPH[p.toLowerCase()]; }).join('');

      turnBar.classList.toggle('cpu', state.turn === 'b');
      turnBar.classList.toggle('done', !!over);
      if (over) turnTxt.textContent = 'Game over';
      else if (thinking) turnTxt.textContent = 'Engine thinking';
      else turnTxt.textContent = state.turn === 'w' ? 'Your move' : 'Black to move';
      turnNote.textContent = 'move ' + state.full;
    }

    function logMove(txt, side) {
      history.push({ san: txt, side: side });
      if (side === 'w') {
        var li = el('li');
        li.appendChild(el('b', null, txt));
        movesList.appendChild(li);
      } else {
        var last = movesList.lastChild;
        if (!last) { last = el('li'); last.appendChild(el('b', null, '…')); movesList.appendChild(last); }
        last.appendChild(el('span', null, txt));
      }
      movesBox.scrollTop = movesBox.scrollHeight;
    }

    /* --- applying a move ------------------------------------------------ */

    function apply(m) {
      var mover = pieceEls[m.from];
      var before = cloneState(state);
      var capturedPiece = m.ep ? state.bd[m.to + (state.turn === 'w' ? 8 : -8)] : state.bd[m.to];
      var capSq = m.ep ? m.to + (state.turn === 'w' ? 8 : -8) : m.to;
      var moverSide = state.turn;

      make(state, m);
      var text = san(before, m, state);

      /* The captured piece fades and shrinks where it stood rather than
         vanishing on the frame the mover lands. */
      if (capturedPiece && capturedPiece !== '.') {
        var gone = pieceEls[capSq];
        if (gone) {
          gone.classList.add('gone');
          setTimeout(function () { gone.remove(); }, 260);
        }
        delete pieceEls[capSq];
        taken[moverSide].push(capturedPiece);
      }

      if (mover) {
        delete pieceEls[m.from];
        pieceEls[m.to] = mover;
        mover.classList.add('moving');
        place(mover, m.to);
        setTimeout(function () { mover.classList.remove('moving'); }, 300);
        if (m.promo) {
          setTimeout(function () {
            mover.textContent = GLYPH[m.promo];
            mover.classList.add('promoted');
          }, 190);
        }
      }

      if (m.castle) {
        var home = moverSide === 'w' ? 60 : 4;
        var rf = m.castle === 'k' ? home + 3 : home - 4;
        var rt = m.castle === 'k' ? home + 1 : home - 1;
        var rook = pieceEls[rf];
        if (rook) {
          delete pieceEls[rf];
          pieceEls[rt] = rook;
          rook.classList.add('moving');
          place(rook, rt);
          setTimeout(function () { rook.classList.remove('moving'); }, 300);
        }
      }

      lastMove = m;
      sel = -1;
      logMove(text, moverSide);

      if (m.cap || m.promo) blip(moverSide === 'w' ? 300 : 240, 0.14, 'square', 0.2, 140);
      else blip(moverSide === 'w' ? 520 : 420, 0.07, 'triangle', 0.16, 360);

      moves = legal(state);
      marks();
      panelPaint();
      checkEnd();
    }

    function checkEnd() {
      if (over) return true;
      if (!moves.length) {
        if (inCheck(state, state.turn)) {
          over = state.turn === 'w' ? 'lose' : 'win';
          finish(
            over === 'win' ? 'Checkmate' : 'Checkmate',
            over === 'win' ? 'You win. ' + Math.ceil(history.length / 2) + ' moves.' : 'The engine mates. ' + Math.ceil(history.length / 2) + ' moves.'
          );
        } else {
          over = 'draw';
          finish('Stalemate', 'No legal move, no check. A draw.');
        }
        return true;
      }
      if (state.half >= 100) { over = 'draw'; finish('Draw', 'Fifty moves without a pawn or a capture.'); return true; }
      /* Bare kings, or a king and one minor each, cannot mate. */
      var left = state.bd.filter(function (p) { return p !== '.' && p.toLowerCase() !== 'k'; });
      if (!left.length || (left.length === 1 && 'nb'.indexOf(left[0].toLowerCase()) >= 0)) {
        over = 'draw'; finish('Draw', 'Not enough material left to mate.'); return true;
      }
      return false;
    }

    function finish(title, note) {
      bannerH.textContent = title;
      bannerP.textContent = note;
      banner.classList.add('on');
      banner.setAttribute('aria-hidden', 'false');
      stat.textContent = '';
      panelPaint();
      marks();
      blip(over === 'win' ? 660 : 200, 0.4, 'triangle', 0.24, over === 'win' ? 1320 : 90);
      setTimeout(function () { bannerB.focus(); }, 420);
    }

    /* --- the engine's turn ---------------------------------------------- */

    function engineTurn() {
      if (over || state.turn !== 'b') return;
      thinking = true;
      panelPaint();
      stat.textContent = 'thinking…';
      /* Off the click's frame, so the board has painted the human's move and
         the "thinking" state before the search takes the thread. */
      setTimeout(function () {
        if (!game) return;
        var r = think(state, 620, 5);
        thinking = false;
        if (!r || !r.move) { panelPaint(); return; }
        stat.textContent = 'depth ' + r.depth + ' · ' + r.nodes.toLocaleString() + ' positions · ' + r.ms + 'ms';
        apply(r.move);
      }, 130);
    }

    /* --- input ----------------------------------------------------------- */

    function choosePromo(kind) {
      if (!pending) return;
      var m = moves.filter(function (o) {
        return o.from === pending.from && o.to === pending.to && o.promo === kind;
      })[0];
      pending = null;
      promo.classList.remove('on');
      promo.setAttribute('aria-hidden', 'true');
      if (m) { apply(m); if (!over) engineTurn(); }
    }

    function onSquare(i) {
      if (over || thinking || pending || state.turn !== 'w') return;
      var p = state.bd[i];
      if (sel >= 0) {
        var picks = moves.filter(function (m) { return m.from === sel && m.to === i; });
        if (picks.length) {
          if (picks.length > 1 && picks[0].promo) {
            pending = { from: sel, to: i };
            promo.classList.add('on');
            promo.setAttribute('aria-hidden', 'false');
            promo.querySelector('.ch-promo-b').focus();
            return;
          }
          apply(picks[0]);
          if (!over) engineTurn();
          return;
        }
        if (i === sel) { sel = -1; marks(); return; }
      }
      if (p !== '.' && isWhite(p) && moves.some(function (m) { return m.from === i; })) {
        sel = i;
        blip(760, 0.04, 'sine', 0.09);
      } else {
        sel = -1;
      }
      marks();
    }

    squares.forEach(function (sq, i) {
      sq.addEventListener('click', function () { onSquare(i); });
    });

    function reset() {
      state = newGame();
      history = [];
      taken = { w: [], b: [] };
      sel = -1;
      lastMove = null;
      over = '';
      thinking = false;
      pending = null;
      movesList.textContent = '';
      stat.textContent = '';
      banner.classList.remove('on');
      banner.setAttribute('aria-hidden', 'true');
      promo.classList.remove('on');
      moves = legal(state);
      buildPieces();
      marks();
      panelPaint();
      blip(520, 0.18, 'triangle', 0.2, 780);
    }

    /* Take back the pair — yours and the reply — because taking back only
       your own move would hand the engine a free tempo. */
    function takeBack() {
      if (thinking || !history.length) return;
      var target = Math.max(0, history.length - (history.length % 2 === 0 ? 2 : 1));
      var replay = history.slice(0, target);
      var sans = replay.map(function (h) { return h.san; });
      state = newGame();
      taken = { w: [], b: [] };
      lastMove = null;
      over = '';
      sel = -1;
      history = [];
      movesList.textContent = '';
      banner.classList.remove('on');
      banner.setAttribute('aria-hidden', 'true');
      sans.forEach(function (want) {
        var ms = legal(state);
        for (var i = 0; i < ms.length; i++) {
          var before = cloneState(state);
          var u = make(state, ms[i]);
          var got = san(before, ms[i], state);
          if (got === want) {
            var moverSide = before.turn;
            var capSq = ms[i].ep ? ms[i].to + (moverSide === 'w' ? 8 : -8) : ms[i].to;
            var capPiece = before.bd[capSq];
            if (capPiece && capPiece !== '.') taken[moverSide].push(capPiece);
            lastMove = ms[i];
            logMove(got, moverSide);
            return;
          }
          unmake(state, ms[i], u);
        }
      });
      moves = legal(state);
      buildPieces();
      marks();
      stat.textContent = '';
      panelPaint();
      blip(300, 0.12, 'sine', 0.14, 200);
    }

    againBtn.addEventListener('click', reset);
    bannerB.addEventListener('click', reset);
    undoBtn.addEventListener('click', takeBack);
    quitBtn.addEventListener('click', close);

    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'm' || e.key === 'M') {
        muted = !muted;
        stat.textContent = muted ? 'sound off' : 'sound on';
      }
    }
    window.addEventListener('keydown', onKey, true);

    function close() {
      if (!game) return;
      game = null;
      window.removeEventListener('keydown', onKey, true);
      host.classList.add('out');
      document.documentElement.classList.remove('ch-on');
      setTimeout(function () { host.remove(); }, 380);
    }

    moves = legal(state);
    buildPieces();
    marks();
    panelPaint();
    requestAnimationFrame(function () { host.classList.add('in'); });

    return { close: close, state: function () { return state; }, board: function () { return state.bd.join(''); }, over: function () { return over; } };
  }

  /* ---- a read-only seam, for the same reason Operation Bone has one ------
     A chess engine is either legal or it is decoration, and the only way to
     hold that claim to account from a test is to be able to drive it. */
  function fromFen(fen) {
    var parts = String(fen).trim().split(/\s+/);
    var bd = [];
    parts[0].split('/').forEach(function (row) {
      for (var i = 0; i < row.length; i++) {
        var c = row[i];
        if (c >= '1' && c <= '8') { for (var n = 0; n < +c; n++) bd.push('.'); }
        else bd.push(c);
      }
    });
    var cast = parts[2] || '-';
    var epTxt = parts[3] || '-';
    return {
      bd: bd,
      turn: parts[1] === 'b' ? 'b' : 'w',
      cast: {
        K: cast.indexOf('K') >= 0, Q: cast.indexOf('Q') >= 0,
        k: cast.indexOf('k') >= 0, q: cast.indexOf('q') >= 0,
      },
      ep: epTxt === '-' ? -1 : (8 - Number(epTxt[1])) * 8 + FILES.indexOf(epTxt[0]),
      half: Number(parts[4] || 0),
      full: Number(parts[5] || 1),
    };
  }

  window.__chessEgg = {
    open: open,
    isOpen: function () { return !!game; },
    fromFen: fromFen,
    legalCount: function (fen) { return legal(fen || newGame()).length; },
    perft: function (depth, s) {
      s = s || newGame();
      if (depth === 0) return 1;
      var ms = legal(s), n = 0;
      for (var i = 0; i < ms.length; i++) {
        var u = make(s, ms[i]);
        n += perftInner(depth - 1, s);
        unmake(s, ms[i], u);
      }
      return n;
      function perftInner(d, st) {
        if (d === 0) return 1;
        var mm = legal(st), c = 0;
        for (var j = 0; j < mm.length; j++) {
          var uu = make(st, mm[j]);
          c += perftInner(d - 1, st);
          unmake(st, mm[j], uu);
        }
        return c;
      }
    },
  };

  /* ---- the word --------------------------------------------------------- */
  var WORD = 'chess';
  var buf = '';
  document.addEventListener('keydown', function (e) {
    if (game) return;
    var el2 = e.target;
    if (el2 && (el2.tagName === 'INPUT' || el2.tagName === 'TEXTAREA' || el2.isContentEditable)) return;
    var k = String(e.key || '');
    if (k.length !== 1) return;
    buf = (buf + k.toLowerCase()).slice(-WORD.length);
    if (buf === WORD) {
      buf = '';
      if (canPlay) open();
      else {
        var p = el('p', 'cx-toast', 'The board needs a wider screen.');
        p.setAttribute('role', 'status');
        document.body.appendChild(p);
        requestAnimationFrame(function () { p.classList.add('on'); });
        setTimeout(function () { p.classList.remove('on'); setTimeout(function () { p.remove(); }, 400); }, 3000);
      }
    }
  });
})();
