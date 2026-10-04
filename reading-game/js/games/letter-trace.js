/* Letter Trace - little track. Trace the dotted letter with a finger. */
(function () {
  'use strict';
  var RG = window.RG;
  if (!RG || !RG.registerGame) return;

  var STYLE_ID = 'lt-style';
  var CSS = [
    '.lt-wrap{width:100%;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:6px 12px 12px;box-sizing:border-box;overflow:hidden}',
    '.lt-wrap .prompt{margin:0;text-align:center}',
    '.lt-board{position:relative;border-radius:28px;background:#fff;border:6px solid #74c0fc;box-shadow:0 8px 0 rgba(0,0,0,.1);overflow:hidden;box-sizing:content-box;background-image:linear-gradient(transparent calc(25% - 1px),#e7f5ff calc(25% - 1px),#e7f5ff 25%,transparent 25%),linear-gradient(transparent calc(50% - 1px),#ffc9c9 calc(50% - 1px),#ffc9c9 calc(50% + 1px),transparent calc(50% + 1px)),linear-gradient(transparent calc(75% - 1px),#e7f5ff calc(75% - 1px),#e7f5ff 75%,transparent 75%)}',
    '.lt-board.lt-wrong{animation:lt-shake .4s}',
    '@keyframes lt-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}',
    '.lt-canvas{display:block;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}',
    '.lt-row{display:flex;gap:12px;align-items:center;justify-content:center}',
    '.lt-wrap .btn.lt-clear{min-height:64px;min-width:140px;font-size:1.5rem;touch-action:manipulation}'
  ].join('\n');

  var FALLBACK_SOUND = { a: 'ah', b: 'buh', c: 'kuh', d: 'duh', e: 'eh', f: 'fff', g: 'guh', h: 'huh', i: 'ih', j: 'juh', k: 'kuh', l: 'lll', m: 'mmm', n: 'nnn', o: 'aw', p: 'puh', q: 'kwuh', r: 'rrr', s: 'sss', t: 'tuh', u: 'uh', v: 'vvv', w: 'wuh', x: 'ks', y: 'yuh', z: 'zzz' };

  // ---- glyph definitions: polylines in a 0..1 box (y down) ----
  function arc(cx, cy, rx, ry, a0, a1) {
    var pts = [], n = Math.max(6, Math.ceil(Math.abs(a1 - a0) / 12));
    for (var i = 0; i <= n; i++) {
      var a = (a0 + (a1 - a0) * i / n) * Math.PI / 180;
      pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    return pts;
  }
  function cat() { var r = []; for (var i = 0; i < arguments.length; i++) r = r.concat(arguments[i]); return r; }

  var G = {};
  // uppercase
  G.A = [[[.5, 0], [.15, 1]], [[.5, 0], [.85, 1]], [[.28, .64], [.72, .64]]];
  G.B = [[[.2, 0], [.2, 1]], cat([[.2, 0]], arc(.55, .25, .27, .25, -90, 90), [[.2, .5]], [[.6, .5]], arc(.6, .75, .28, .25, -90, 90), [[.2, 1]])];
  G.C = [arc(.55, .5, .38, .5, -40, -320)];
  G.D = [[[.2, 0], [.2, 1]], cat([[.2, 0]], [[.42, 0]], arc(.42, .5, .4, .5, -90, 90), [[.2, 1]])];
  G.E = [[[.8, 0], [.2, 0], [.2, 1], [.8, 1]], [[.2, .5], [.65, .5]]];
  G.F = [[[.8, 0], [.2, 0], [.2, 1]], [[.2, .5], [.65, .5]]];
  G.G = [cat(arc(.52, .5, .38, .5, -40, -360), [[.55, .5]])];
  G.H = [[[.2, 0], [.2, 1]], [[.8, 0], [.8, 1]], [[.2, .5], [.8, .5]]];
  G.I = [[[.5, 0], [.5, 1]], [[.3, 0], [.7, 0]], [[.3, 1], [.7, 1]]];
  G.J = [cat([[.72, 0]], [[.72, .65]], arc(.47, .65, .25, .35, 0, 160))];
  G.K = [[[.2, 0], [.2, 1]], [[.8, 0], [.2, .55], [.8, 1]]];
  G.L = [[[.2, 0], [.2, 1], [.8, 1]]];
  G.M = [[[.12, 1], [.12, 0], [.5, .65], [.88, 0], [.88, 1]]];
  G.N = [[[.2, 1], [.2, 0], [.8, 1], [.8, 0]]];
  G.O = [arc(.5, .5, .4, .5, -90, -450)];
  G.P = [[[.2, 0], [.2, 1]], cat([[.2, 0]], [[.5, 0]], arc(.5, .27, .3, .27, -90, 90), [[.2, .54]])];
  G.Q = [arc(.48, .48, .38, .46, -90, -450), [[.58, .68], [.85, 1]]];
  G.R = [[[.2, 0], [.2, 1]], cat([[.2, 0]], [[.5, 0]], arc(.5, .27, .3, .27, -90, 90), [[.2, .54]]), [[.45, .54], [.8, 1]]];
  G.S = [cat(arc(.5, .25, .3, .25, -35, -270), arc(.5, .75, .33, .25, -90, 150))];
  G.T = [[[.15, 0], [.85, 0]], [[.5, 0], [.5, 1]]];
  G.U = [cat([[.2, 0]], [[.2, .6]], arc(.5, .6, .3, .4, 180, 0), [[.8, 0]])];
  G.V = [[[.15, 0], [.5, 1], [.85, 0]]];
  G.W = [[[.08, 0], [.29, 1], [.5, .35], [.71, 1], [.92, 0]]];
  G.X = [[[.2, 0], [.8, 1]], [[.8, 0], [.2, 1]]];
  G.Y = [[[.2, 0], [.5, .5], [.8, 0]], [[.5, .5], [.5, 1]]];
  G.Z = [[[.2, 0], [.8, 0], [.2, 1], [.8, 1]]];
  // lowercase (x-height .35 to .75, ascender 0, descender 1)
  function bowl(cx, dir) { return dir ? arc(cx, .55, .24, .2, 180, -180) : arc(cx, .55, .24, .2, -20, -380); }
  G.a = [bowl(.45, 0), [[.69, .35], [.69, .75]]];
  G.b = [[[.3, 0], [.3, .75]], bowl(.54, 1)];
  G.c = [arc(.56, .55, .26, .2, -40, -320)];
  G.d = [bowl(.46, 1), [[.7, 0], [.7, .75]]];
  G.e = [cat([[.3, .55], [.8, .55]], arc(.55, .55, .25, .2, 0, -320))];
  G.f = [[[.75, .08], [.65, .02], [.55, .04], [.5, .15], [.5, .75]], [[.28, .38], [.75, .38]]];
  G.g = [bowl(.46, 1), cat([[.7, .35]], [[.7, .85]], arc(.47, .85, .23, .15, 0, 150))];
  G.h = [[[.3, 0], [.3, .75]], cat([[.3, .5]], arc(.5, .5, .2, .15, 180, 360), [[.7, .75]])];
  G.i = [[[.5, .35], [.5, .75]], [[.5, .12], [.5, .16]]];
  G.j = [cat([[.58, .35]], [[.58, .85]], arc(.36, .85, .22, .13, 0, 150)), [[.58, .12], [.58, .16]]];
  G.k = [[[.3, 0], [.3, .75]], [[.72, .35], [.3, .6], [.74, .75]]];
  G.l = [[[.5, 0], [.5, .75]]];
  G.m = [[[.12, .35], [.12, .75]], cat([[.12, .5]], arc(.3, .5, .18, .15, 180, 360), [[.48, .75]]), cat([[.48, .5]], arc(.66, .5, .18, .15, 180, 360), [[.84, .75]])];
  G.n = [[[.3, .35], [.3, .75]], cat([[.3, .5]], arc(.5, .5, .2, .15, 180, 360), [[.7, .75]])];
  G.o = [arc(.5, .55, .26, .2, -90, -450)];
  G.p = [[[.3, .35], [.3, 1]], bowl(.54, 1)];
  G.q = [bowl(.46, 1), [[.7, .35], [.7, 1]]];
  G.r = [[[.35, .35], [.35, .75]], cat([[.35, .5]], arc(.52, .5, .17, .15, 180, 300))];
  G.s = [cat(arc(.5, .45, .2, .1, -35, -270), arc(.5, .65, .22, .1, -90, 150))];
  G.t = [[[.45, .1], [.45, .7], [.55, .75], [.7, .72]], [[.25, .37], [.7, .37]]];
  G.u = [cat([[.3, .35]], [[.3, .6]], arc(.5, .6, .2, .15, 180, 0)), [[.7, .35], [.7, .75]]];
  G.v = [[[.25, .35], [.5, .75], [.75, .35]]];
  G.w = [[[.1, .35], [.3, .75], [.5, .45], [.7, .75], [.9, .35]]];
  G.x = [[[.25, .35], [.75, .75]], [[.75, .35], [.25, .75]]];
  G.y = [[[.25, .35], [.5, .75]], [[.75, .35], [.45, .98]]];
  G.z = [[[.25, .35], [.75, .35], [.25, .75], [.75, .75]]];

  // fit every glyph (uniformly) into the 0..1 box, centred, so lowercase letters are big enough to trace
  Object.keys(G).forEach(function (k) {
    var x0 = 9, x1 = -9, y0 = 9, y1 = -9;
    G[k].forEach(function (st) { st.forEach(function (p) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }); });
    var sc = 1 / Math.max(x1 - x0, y1 - y0, 0.01);
    if (sc > 1.7) sc = 1.7;
    var ox = 0.5 - (x0 + x1) / 2 * sc, oy = 0.5 - (y0 + y1) / 2 * sc;
    G[k] = G[k].map(function (st) { return st.map(function (p) { return [p[0] * sc + ox, p[1] * sc + oy]; }); });
  });

  var L1 = ['L', 'T', 'I', 'E', 'F', 'H'];
  var UP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  var LOW = 'abcdefghijklmnopqrstuvwxyz'.split('');

  function sample(strokes, step) {
    var out = [];
    strokes.forEach(function (st, si) {
      var pts = [];
      for (var i = 0; i < st.length - 1; i++) {
        var a = st[i], b = st[i + 1];
        var d = Math.hypot(b[0] - a[0], b[1] - a[1]);
        var n = Math.max(1, Math.ceil(d / step));
        for (var k = 0; k < n; k++) pts.push({ x: a[0] + (b[0] - a[0]) * k / n, y: a[1] + (b[1] - a[1]) * k / n, s: si });
      }
      var e = st[st.length - 1];
      pts.push({ x: e[0], y: e[1], s: si });
      out = out.concat(pts);
    });
    return out;
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function soundOf(l) {
    try {
      var L = RG.content && RG.content.letters;
      if (L) for (var i = 0; i < L.length; i++) if (String(L[i].letter).toLowerCase() === l.toLowerCase() && L[i].sound) return L[i].sound;
    } catch (e) {}
    return FALLBACK_SOUND[l.toLowerCase()] || '';
  }

  RG.registerGame({
    id: 'letter-trace',
    title: 'Letter Trace',
    emoji: '✏️',
    tracks: ['little'],
    skill: 'writing',
    blurb: 'Trace the letter with your finger!',
    mount: function (container, ctx) {
      injectStyle();
      var alive = true, locked = true, misses = 0, round = 0, sp = 0;
      var last = null, used = [], letter = null;
      var timers = [], raf = 0, hintRaf = 0;
      var level = Math.max(1, Math.min(3, ctx.level || 1));
      var rounds = ctx.rounds || 5;
      var PAD = 0.14, RADIUS = 0.11, OFF = 0.17, THRESH = 0.7;

      function later(fn, ms) {
        var t = setTimeout(function () {
          timers = timers.filter(function (x) { return x !== t; });
          if (alive) fn();
        }, ms);
        timers.push(t);
        return t;
      }
      function wait(ms) { return new Promise(function (res) { later(res, ms); }); }
      function seq() {
        var steps = Array.prototype.slice.call(arguments);
        var s = ++sp;
        var p = Promise.resolve();
        steps.forEach(function (st) {
          p = p.then(function () { if (!alive || s !== sp) return; return st(); }).catch(function () {});
        });
        return p;
      }
      function say(t) { return function () { return RG.speak(t); }; }

      var wrap = RG.el('div', { class: 'lt-wrap' });
      var prompt = RG.el('div', { class: 'prompt' });
      var board = RG.el('div', { class: 'lt-board' });
      var canvas = RG.el('canvas', { class: 'lt-canvas' });
      canvas.style.touchAction = 'none';
      board.appendChild(canvas);
      var clearBtn = RG.el('button', { class: 'btn lt-clear', type: 'button', text: '🧹 Clear' });
      var row = RG.el('div', { class: 'lt-row' }, clearBtn);
      wrap.appendChild(prompt);
      wrap.appendChild(board);
      wrap.appendChild(row);
      container.appendChild(wrap);
      var g2 = canvas.getContext('2d');

      var size = 300, dpr = 1;
      var strokes = [], guide = [], covered = [], trail = [], cur = null, hintOn = false;

      function pool() { return level === 1 ? L1 : level === 2 ? UP : LOW; }
      function pickLetter() {
        var p = pool().filter(function (l) { return l !== last && used.indexOf(l) < 0; });
        if (!p.length) p = pool().filter(function (l) { return l !== last; });
        var l = RG.sample(p);
        used.push(l);
        last = l;
        return l;
      }

      function layout() {
        var w = container.clientWidth || window.innerWidth;
        var h = container.clientHeight || window.innerHeight * 0.7;
        var s = Math.min(w - 40, h - 150, 460);
        s = Math.max(200, Math.floor(s));
        size = s;
        dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
        canvas.width = Math.round(size * dpr);
        canvas.height = Math.round(size * dpr);
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        board.style.width = size + 'px';
        board.style.height = size + 'px';
        render();
      }

      function toPx(x, y) { var b = size * (1 - 2 * PAD); return [size * PAD + x * b, size * PAD + y * b]; }
      function toBox(px, py) { var b = size * (1 - 2 * PAD); return [(px - size * PAD) / b, (py - size * PAD) / b]; }

      function coverage() {
        var c = 0;
        for (var i = 0; i < covered.length; i++) if (covered[i]) c++;
        return guide.length ? c / guide.length : 0;
      }
      function strokeDone(si) {
        for (var i = 0; i < guide.length; i++) if (guide[i].s === si && !covered[i]) return false;
        return true;
      }
      function nextStroke() {
        for (var i = 0; i < strokes.length; i++) if (!strokeDone(i)) return i;
        return -1;
      }

      function render() {
        if (!alive) return;
        var w = size, lw = size * 0.075;
        g2.setTransform(dpr, 0, 0, dpr, 0, 0);
        g2.clearRect(0, 0, w, w);
        g2.lineCap = 'round';
        g2.lineJoin = 'round';
        // dotted light guide
        g2.strokeStyle = '#c5d3f5';
        g2.lineWidth = lw;
        g2.setLineDash([0, lw * 1.35]);
        strokes.forEach(function (st) {
          g2.beginPath();
          st.forEach(function (p, i) { var q = toPx(p[0], p[1]); if (i) g2.lineTo(q[0], q[1]); else g2.moveTo(q[0], q[1]); });
          g2.stroke();
        });
        g2.setLineDash([]);
        // covered guide points
        g2.fillStyle = '#8ce99a';
        for (var i = 0; i < guide.length; i++) {
          if (!covered[i]) continue;
          var q = toPx(guide[i].x, guide[i].y);
          g2.beginPath();
          g2.arc(q[0], q[1], lw * 0.42, 0, 6.283);
          g2.fill();
        }
        // child's rainbow trail
        trail.concat(cur ? [cur] : []).forEach(function (t) {
          for (var j = 1; j < t.pts.length; j++) {
            var a = toPx(t.pts[j - 1][0], t.pts[j - 1][1]), b = toPx(t.pts[j][0], t.pts[j][1]);
            g2.strokeStyle = 'hsl(' + ((t.hue + j * 6) % 360) + ',90%,58%)';
            g2.lineWidth = size * 0.045;
            g2.beginPath();
            g2.moveTo(a[0], a[1]);
            g2.lineTo(b[0], b[1]);
            g2.stroke();
          }
          g2.fillStyle = '#fff59d';
          for (var k = 0; k < t.sparks.length; k++) {
            var sp2 = t.sparks[k], c = toPx(sp2[0], sp2[1]);
            g2.save();
            g2.translate(c[0], c[1]);
            g2.rotate(sp2[2]);
            var r = size * 0.02 * sp2[3];
            g2.beginPath();
            g2.moveTo(0, -r * 2); g2.lineTo(r * 0.5, -r * 0.5); g2.lineTo(r * 2, 0); g2.lineTo(r * 0.5, r * 0.5);
            g2.lineTo(0, r * 2); g2.lineTo(-r * 0.5, r * 0.5); g2.lineTo(-r * 2, 0); g2.lineTo(-r * 0.5, -r * 0.5);
            g2.closePath();
            g2.fill();
            g2.restore();
          }
        });
        // start dots
        var multi = strokes.length > 1;
        strokes.forEach(function (st, si) {
          if (strokeDone(si)) return;
          var q = toPx(st[0][0], st[0][1]);
          var r = lw * 0.85;
          g2.fillStyle = '#40c057';
          g2.strokeStyle = '#fff';
          g2.lineWidth = 3;
          g2.beginPath();
          g2.arc(q[0], q[1], r, 0, 6.283);
          g2.fill();
          g2.stroke();
          if (multi) {
            g2.fillStyle = '#fff';
            g2.font = 'bold ' + Math.round(r * 1.2) + 'px sans-serif';
            g2.textAlign = 'center';
            g2.textBaseline = 'middle';
            g2.fillText(String(si + 1), q[0], q[1] + 1);
          }
        });
        // hint pulse
        if (hintOn) {
          var ns = nextStroke();
          if (ns >= 0) {
            var h = toPx(strokes[ns][0][0], strokes[ns][0][1]);
            var ph = (Date.now() % 900) / 900;
            g2.strokeStyle = 'rgba(255,146,43,' + (1 - ph) + ')';
            g2.lineWidth = 5;
            g2.beginPath();
            g2.arc(h[0], h[1], lw * (0.9 + ph * 1.6), 0, 6.283);
            g2.stroke();
          }
        }
      }

      function schedule() {
        if (raf) return;
        raf = requestAnimationFrame(function () { raf = 0; render(); });
      }
      function hintLoop() {
        if (!alive || !hintOn) { hintRaf = 0; return; }
        render();
        hintRaf = requestAnimationFrame(hintLoop);
      }
      function setHint(on) {
        hintOn = on;
        if (on && !hintRaf) hintRaf = requestAnimationFrame(hintLoop);
        if (!on && hintRaf) { cancelAnimationFrame(hintRaf); hintRaf = 0; }
      }

      function mark(bx, by) {
        for (var i = 0; i < guide.length; i++) {
          if (covered[i]) continue;
          if (Math.hypot(guide[i].x - bx, guide[i].y - by) <= RADIUS) covered[i] = true;
        }
      }
      function nearGuide(bx, by) {
        for (var i = 0; i < guide.length; i++) if (Math.hypot(guide[i].x - bx, guide[i].y - by) <= OFF) return true;
        return false;
      }

      function addPoint(e) {
        var r = canvas.getBoundingClientRect();
        var sx = r.width ? size / r.width : 1;
        var bp = toBox((e.clientX - r.left) * sx, (e.clientY - r.top) * sx);
        var prev = cur.pts[cur.pts.length - 1];
        if (prev) {
          var d = Math.hypot(bp[0] - prev[0], bp[1] - prev[1]);
          var n = Math.max(1, Math.ceil(d / 0.03));
          for (var k = 1; k <= n; k++) {
            var x = prev[0] + (bp[0] - prev[0]) * k / n, y = prev[1] + (bp[1] - prev[1]) * k / n;
            cur.pts.push([x, y]);
            mark(x, y);
            if (cur.pts.length % 3 === 0) cur.sparks.push([x + (Math.random() - 0.5) * 0.06, y + (Math.random() - 0.5) * 0.06, Math.random() * 3, 0.5 + Math.random() * 0.8]);
          }
        } else {
          cur.pts.push(bp);
          mark(bp[0], bp[1]);
        }
        if (cur.sparks.length > 60) cur.sparks.splice(0, cur.sparks.length - 60);
      }

      function onDown(e) {
        if (!alive || locked) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
        cur = { pts: [], sparks: [], hue: Math.floor(Math.random() * 360), id: e.pointerId };
        addPoint(e);
        schedule();
      }
      function onMove(e) {
        if (!cur || e.pointerId !== cur.id) return;
        e.preventDefault();
        addPoint(e);
        schedule();
      }
      function onUp(e) {
        if (!cur || e.pointerId !== cur.id) return;
        var t = cur;
        cur = null;
        if (locked) return;
        trail.push(t);
        if (coverage() >= THRESH) { succeed(); return; }
        // judge only clearly off-target strokes as wrong attempts
        if (t.pts.length >= 6) {
          var on = 0;
          t.pts.forEach(function (p) { if (nearGuide(p[0], p[1])) on++; });
          if (on / t.pts.length < 0.5) {
            trail.pop();
            misses++;
            ctx.answer(false);
            board.classList.remove('lt-wrong');
            void board.offsetWidth;
            board.classList.add('lt-wrong');
            seq(say('Try again!'));
            if (misses >= 2) setHint(true);
          }
        }
        schedule();
      }

      canvas.addEventListener('pointerdown', onDown);
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerup', onUp);
      canvas.addEventListener('pointercancel', onUp);
      function noCtx(e) { e.preventDefault(); }
      canvas.addEventListener('contextmenu', noCtx);
      function onClear() {
        if (!alive || locked) return;
        trail = [];
        cur = null;
        covered = guide.map(function () { return false; });
        render();
      }
      clearBtn.addEventListener('click', onClear);
      var onResize = function () { if (alive) layout(); };
      window.addEventListener('resize', onResize);
      var ro = null;
      try { if (window.ResizeObserver) { ro = new ResizeObserver(onResize); ro.observe(container); } } catch (e) {}

      function introSteps() {
        var name = letter;
        var snd = soundOf(letter);
        var steps = [say('Trace the letter'), function () { return RG.sayLetter(name); }];
        if (snd) steps.push(function () { return RG.sayLetterSound(name); });
        return steps;
      }

      function startRound() {
        misses = 0;
        trail = [];
        cur = null;
        setHint(false);
        letter = pickLetter();
        strokes = G[letter] || G[letter.toUpperCase()] || G.L;
        guide = sample(strokes, 0.03);
        covered = guide.map(function () { return false; });
        prompt.textContent = 'Trace the letter ' + (level === 3 ? letter : letter.toUpperCase()) + '!';
        container.dataset.target = letter;
        ctx.onReplay = function () { seq.apply(null, introSteps()); };
        layout();
        locked = false;
        seq.apply(null, introSteps());
      }

      function succeed() {
        locked = true;
        setHint(false);
        for (var i = 0; i < covered.length; i++) covered[i] = true;
        render();
        ctx.answer(true);
        RG.celebrate(board);
        var snd = soundOf(letter);
        var s = seq(function () { return RG.sayLetter(letter); }, function () { return snd ? RG.sayLetterSound(letter) : null; }, function () { return RG.speak(RG.praise()); });
        Promise.all([wait(1500), Promise.race([s, wait(6000)])]).then(function () {
          if (!alive) return;
          round++;
          ctx.roundDone();
          if (round >= rounds) ctx.finish();
          else startRound();
        });
      }

      // test/debug hook: guide polyline in CSS px relative to canvas
      container.__ltGuide = function () {
        return strokes.map(function (st) { return st.map(function (p) { var q = toPx(p[0], p[1]); return { x: q[0], y: q[1] }; }); });
      };
      container.__ltCanvas = canvas;

      startRound();

      return function cleanup() {
        alive = false;
        locked = true;
        sp++;
        timers.forEach(clearTimeout);
        timers = [];
        if (raf) cancelAnimationFrame(raf);
        if (hintRaf) cancelAnimationFrame(hintRaf);
        raf = hintRaf = 0;
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerup', onUp);
        canvas.removeEventListener('pointercancel', onUp);
        canvas.removeEventListener('contextmenu', noCtx);
        clearBtn.removeEventListener('click', onClear);
        window.removeEventListener('resize', onResize);
        if (ro) { try { ro.disconnect(); } catch (e) {} }
        if (ctx.onReplay) ctx.onReplay = null;
        try { RG.stopSpeaking(); } catch (e) {}
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      };
    }
  });
})();
