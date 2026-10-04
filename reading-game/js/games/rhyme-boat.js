/* Rhyme Boat - little + big tracks. Which picture rhymes with the boat's word? */
(function () {
  'use strict';
  var RG = window.RG;
  if (!RG || !RG.registerGame) return;

  var STYLE_ID = 'rb-style';
  var CSS = [
    '.rb-wrap{width:100%;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;padding:6px 12px 14px;box-sizing:border-box;overflow:hidden}',
    '.rb-wrap .prompt{margin:4px 0 0;text-align:center}',
    '.rb-sea{position:relative;width:100%;max-width:520px;display:flex;justify-content:center;padding:6px 0 0}',
    '.rb-sea::after{content:"";position:absolute;left:0;right:0;bottom:0;height:34px;border-radius:50% 50% 24px 24px/30% 30% 24px 24px;background:repeating-radial-gradient(circle at 20px 0,#4dabf7 0 14px,#74c0fc 15px 28px);opacity:.92;z-index:2;pointer-events:none}',
    '.rb-boat{position:relative;z-index:1;width:clamp(170px,50vw,230px);display:flex;flex-direction:column;align-items:center;margin-bottom:22px;animation:rb-rock 3s ease-in-out infinite;transform-origin:50% 90%}',
    '.rb-sail{position:relative;width:clamp(104px,30vw,136px);height:clamp(104px,30vw,136px);background:#fff;border:4px solid #ffa94d;border-radius:14px 14px 14px 60%;box-shadow:0 4px 0 rgba(0,0,0,.1);display:flex;align-items:center;justify-content:center;margin-bottom:6px}',
    '.rb-sail::after{content:"";position:absolute;left:50%;bottom:-8px;width:6px;height:10px;background:#7a4a1a;transform:translateX(-50%)}',
    '.rb-pic{font-size:clamp(3rem,15vw,4.6rem);line-height:1;pointer-events:none}',
    '.rb-hull{width:100%;min-height:50px;padding:4px 10px;border-radius:6px 6px 60px 60px;background:#c2762e;border-top:6px solid #9a5a1e;color:#fff;font-weight:800;font-size:1.5rem;text-align:center;display:flex;align-items:center;justify-content:center;gap:8px;box-sizing:border-box;letter-spacing:.06em}',
    '.rb-boat.rb-happy{animation:rb-hop .6s ease-in-out 2}',
    '@keyframes rb-rock{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg) translateY(-4px)}}',
    '@keyframes rb-hop{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px) rotate(4deg)}}',
    '.rb-dock{width:100%;max-width:640px;display:flex;flex-wrap:wrap;gap:14px;justify-content:center;align-items:flex-end;padding:12px;border-radius:20px;background:#e8c58a;border-bottom:8px solid #b78647;box-sizing:border-box}',
    '.rb-wrap .choice.rb-card{position:relative;min-width:96px;min-height:96px;width:clamp(96px,26vw,128px);padding:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;touch-action:none;-webkit-user-select:none;user-select:none;cursor:grab;-webkit-tap-highlight-color:transparent}',
    '.rb-card .rb-emoji{font-size:clamp(2.8rem,12vw,4rem);line-height:1;pointer-events:none}',
    '.rb-card .rb-w{font-size:1.3rem;font-weight:800;letter-spacing:.05em;pointer-events:none}',
    '.rb-card.rb-drag{z-index:20;cursor:grabbing;box-shadow:0 14px 24px rgba(0,0,0,.3);transition:none}',
    '.rb-card.rb-snap{transition:transform .25s ease-out}',
    '.rb-card.rb-in{z-index:20;transition:transform .5s ease-in-out;pointer-events:none}'
  ].join('\n');

  var FALLBACK_EMOJI = { cat: '🐱', hat: '🎩', bat: '🦇', dog: '🐶', log: '🪵', frog: '🐸', pig: '🐷', wig: '👩‍🦰', car: '🚗', star: '⭐', jar: '🫙', cake: '🎂', lake: '🏞️', snake: '🐍', box: '📦', fox: '🦊', bee: '🐝', tree: '🌳', key: '🔑', boat: '⛵', goat: '🐐', coat: '🧥', sun: '☀️', run: '🏃' };
  var FALLBACK_FAMILIES = {
    at: ['cat', 'hat', 'bat'], og: ['dog', 'log', 'frog'], ig: ['pig', 'wig'], ar: ['car', 'star', 'jar'],
    ake: ['cake', 'lake', 'snake'], ox: ['box', 'fox'], ee: ['bee', 'tree', 'key'], oat: ['boat', 'goat', 'coat']
  };

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function emojiOf(w) {
    var e = '';
    try { e = (RG.emojiFor && RG.emojiFor(w)) || ''; } catch (x) {}
    return e || FALLBACK_EMOJI[w] || '';
  }

  // returns {key: [words with emoji]} with at least 2 words each
  function families() {
    var src = (RG.content && RG.content.rhymeFamilies) || {};
    var out = {}, any = false;
    function take(obj) {
      Object.keys(obj).forEach(function (k) {
        var ws = (obj[k] || []).filter(function (w) { return emojiOf(w); });
        if (ws.length >= 2) { out[k] = ws; any = true; }
      });
    }
    take(src);
    if (!any) take(FALLBACK_FAMILIES);
    return out;
  }

  RG.registerGame({
    id: 'rhyme-boat',
    title: 'Rhyme Boat',
    emoji: '⛵',
    tracks: ['little', 'big'],
    skill: 'rhyme',
    blurb: 'Which picture rhymes? Put it in the boat!',
    mount: function (container, ctx) {
      injectStyle();
      var sawPtr = false, alive = true, locked = true, misses = 0, round = 0, sp = 0;
      var lastWord = null, lastFam = null, usedFam = [];
      var boatWord = null, answerWord = null;
      var timers = [], cleanups = [];
      var level = Math.max(1, Math.min(3, ctx.level || 1));
      var rounds = ctx.rounds || 5;
      var big = false;
      try { big = !!(ctx.profile && ctx.profile.track === 'big'); } catch (e) {}
      var FAM = families();
      var famKeys = Object.keys(FAM);

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

      var wrap = RG.el('div', { class: 'rb-wrap' });
      var prompt = RG.el('div', { class: 'prompt' });
      var sea = RG.el('div', { class: 'rb-sea' });
      var boat = RG.el('div', { class: 'rb-boat' });
      var sail = RG.el('div', { class: 'rb-sail' });
      var pic = RG.el('div', { class: 'rb-pic' });
      sail.appendChild(pic);
      var hull = RG.el('div', { class: 'rb-hull' });
      boat.appendChild(sail);
      boat.appendChild(hull);
      sea.appendChild(boat);
      var dock = RG.el('div', { class: 'rb-dock' });
      wrap.appendChild(prompt);
      wrap.appendChild(sea);
      wrap.appendChild(dock);
      container.appendChild(wrap);

      function pickRound() {
        var keys = famKeys.filter(function (k) { return k !== lastFam && usedFam.indexOf(k) < 0; });
        if (!keys.length) keys = famKeys.filter(function (k) { return k !== lastFam; });
        if (!keys.length) keys = famKeys;
        var fk = RG.sample(keys);
        usedFam.push(fk);
        lastFam = fk;
        var ws = FAM[fk].filter(function (w) { return w !== lastWord; });
        if (ws.length < 2) ws = FAM[fk];
        var bw = RG.sample(ws);
        var aw = RG.sample(FAM[fk].filter(function (w) { return w !== bw; }));
        lastWord = bw;
        var n = level === 3 ? 4 : 3;
        var confusable = level === 3 || (big && level >= 2);
        var pool = [];
        famKeys.forEach(function (k) {
          if (k === fk) return;
          FAM[k].forEach(function (w) { if (w !== bw && w !== aw) pool.push(w); });
        });
        var picks = [];
        if (confusable) {
          var same = pool.filter(function (w) { return w[0] === bw[0] || w[0] === aw[0]; });
          picks = RG.pick(same, Math.min(n - 1, same.length));
        }
        var rest = pool.filter(function (w) { return picks.indexOf(w) < 0; });
        // at most one distractor per family keeps cards visually varied
        picks = picks.concat(RG.pick(rest, n - 1 - picks.length));
        return { fam: fk, boat: bw, answer: aw, words: RG.shuffle([aw].concat(picks)) };
      }

      function speakPrompt() {
        return seq(say('Which one rhymes with ' + boatWord + '?'));
      }

      function startRound() {
        misses = 0;
        var r = pickRound();
        boatWord = r.boat;
        answerWord = r.answer;
        boat.classList.remove('rb-happy');
        pic.textContent = emojiOf(boatWord);
        hull.textContent = big ? boatWord : '\u2693';
                prompt.textContent = 'Which one rhymes with ' + boatWord + '?';
        dock.innerHTML = '';
        r.words.forEach(function (w) { dock.appendChild(makeCard(w)); });
        container.dataset.target = answerWord;
        ctx.onReplay = function () { speakPrompt(); };
        locked = false;
        seq(say(boatWord), say('Which one rhymes with ' + boatWord + '?'));
      }

      function makeCard(w) {
        var b = RG.el('button', { class: 'choice rb-card', type: 'button', 'data-word': w, 'aria-label': w });
        b.appendChild(RG.el('span', { class: 'rb-emoji', text: emojiOf(w) }));
        if (big) b.appendChild(RG.el('span', { class: 'rb-w', text: w }));
        var st = { dx: 0, dy: 0, id: null, sx: 0, sy: 0, drag: false };
        b.__st = st;
        function apply() { b.style.transform = 'translate(' + st.dx + 'px,' + st.dy + 'px)'; }
        b.addEventListener('pointerdown', function (e) {
          sawPtr = true;
          if (locked || st.id !== null) return;
          if (e.pointerType === 'mouse' && e.button !== 0) return;
          e.preventDefault();
          st.id = e.pointerId; st.sx = e.clientX - st.dx; st.sy = e.clientY - st.dy;
          st.x0 = e.clientX; st.y0 = e.clientY; st.drag = false;
          b.classList.remove('rb-snap');
          try { b.setPointerCapture(e.pointerId); } catch (x) {}
        });
        b.addEventListener('pointermove', function (e) {
          if (e.pointerId !== st.id) return;
          if (!st.drag && Math.hypot(e.clientX - st.x0, e.clientY - st.y0) > 10) { st.drag = true; b.classList.add('rb-drag'); }
          if (st.drag) { st.dx = e.clientX - st.sx; st.dy = e.clientY - st.sy; apply(); }
        });
        function end(e, cancelled) {
          if (e.pointerId !== st.id) return;
          st.id = null;
          b.classList.remove('rb-drag');
          if (cancelled) { snapBack(); return; }
          if (!st.drag) { attempt(b, w); return; }
          var r = boat.getBoundingClientRect(), c = b.getBoundingClientRect();
          var cx = c.left + c.width / 2, cy = c.top + c.height / 2, m = 24;
          var over = cx > r.left - m && cx < r.right + m && cy > r.top - m && cy < r.bottom + m;
          if (over) attempt(b, w); else snapBack();
        }
        function snapBack() {
          st.dx = 0; st.dy = 0;
          b.classList.add('rb-snap');
          apply();
        }
        b.snapBack = snapBack;
        b.addEventListener('pointerup', function (e) { end(e, false); });
        b.addEventListener('pointercancel', function (e) { end(e, true); });
        b.addEventListener('click', function () { if (sawPtr) { sawPtr = false; return; } attempt(b, w); });
        return b;
      }

      function attempt(card, w) {
        if (!alive || locked) return;
        if (w === answerWord) correct(card, w);
        else wrong(card, w);
      }

      function wrong(card, w) {
        misses++;
        ctx.answer(false);
        if (card.snapBack) card.snapBack();
        RG.wobble(card);
        seq(say(w), say('Try again!'));
        if (misses >= 2) {
          var cs = dock.querySelectorAll('.rb-card');
          for (var i = 0; i < cs.length; i++) if (cs[i].getAttribute('data-word') === answerWord) cs[i].classList.add('hint');
        }
      }

      function correct(card, w) {
        locked = true;
        ctx.answer(true);
        card.classList.remove('hint', 'rb-drag', 'rb-snap');
        card.classList.add('correct', 'rb-in');
        var st = card.__st;
        var br = boat.getBoundingClientRect(), cr = card.getBoundingClientRect();
        var tx = br.left + br.width / 2 - (cr.left + cr.width / 2 - st.dx);
        var ty = br.top + br.height * 0.35 - (cr.top + cr.height / 2 - st.dy);
        card.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(.6)';
        later(function () { boat.classList.add('rb-happy'); RG.celebrate(boat); }, 450);
        var s = seq(say(w + ' rhymes with ' + boatWord + '!'), function () { return RG.speak(RG.praise()); });
        Promise.all([wait(1700), Promise.race([s, wait(5000)])]).then(function () {
          if (!alive) return;
          round++;
          ctx.roundDone();
          if (round >= rounds) ctx.finish();
          else startRound();
        });
      }

      if (!famKeys.length) { // nothing to play with: end gracefully
        later(function () { ctx.finish(); }, 50);
      } else startRound();

      return function cleanup() {
        alive = false;
        locked = true;
        sp++;
        timers.forEach(clearTimeout);
        timers = [];
        cleanups.forEach(function (f) { try { f(); } catch (e) {} });
        if (ctx.onReplay) ctx.onReplay = null;
        try { RG.stopSpeaking(); } catch (e) {}
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      };
    }
  });
})();
