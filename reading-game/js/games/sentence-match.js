/* Sentence Match - BIG track. Read the sentence, then tap the matching picture. */
(function () {
  'use strict';
  var RG = window.RG;
  if (!RG || !RG.registerGame) { return; }

  var STYLE_ID = 'sm-styles';
  var WAIT_MS = 5000;
  var CSS = [
    '.sm-stage{display:flex;flex-direction:column;align-items:center;gap:14px;justify-content:flex-start;padding:8px 10px 16px;width:100%;box-sizing:border-box;}',
    '.sm-card{background:#fff;border:4px solid #4aa3ff;border-radius:24px;padding:16px 14px;max-width:640px;width:100%;',
    ' box-sizing:border-box;text-align:center;display:flex;flex-direction:column;gap:8px;}',
    '.sm-line{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 10px;}',
    '.sm-w{font:inherit;font-size:2rem;font-weight:700;letter-spacing:.06em;color:#1d2b4f;background:transparent;',
    ' border:0;border-bottom:4px dotted #9bc7ff;border-radius:10px;padding:4px 6px;min-height:52px;min-width:44px;cursor:pointer;',
    ' touch-action:manipulation;-webkit-tap-highlight-color:transparent;}',
    '.sm-w.sm-on{background:#ffe97a;border-bottom-color:#f4a62a;}',
    '.sm-read{position:relative;overflow:hidden;min-width:220px;}',
    '.sm-read[disabled]{opacity:1;cursor:default;background:#e6edf7;color:#6b7a99;}',
    '.sm-fill{position:absolute;left:0;top:0;bottom:0;width:0;background:rgba(74,163,255,.45);pointer-events:none;}',
    '.sm-read.sm-wait .sm-fill{animation:sm-fill ' + (WAIT_MS / 1000) + 's linear forwards;}',
    '@keyframes sm-fill{from{width:0}to{width:100%}}',
    '.sm-read-label{position:relative;font-size:1.1rem;}',
    '.sm-read.sm-ready{animation:sm-ready .8s ease 2;}',
    '@keyframes sm-ready{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}',
    '.sm-choices{gap:14px;}',
    '.sm-pic.sm-dim{opacity:.3;}',
    '.sm-pic{font-size:3.6rem;line-height:1;min-width:104px;min-height:104px;padding:8px 12px;}',
    '@media (max-width:480px){.sm-choices{gap:10px;}.sm-pic{font-size:3rem;min-width:94px;min-height:94px;padding:6px;}}'
  ].join('\n');

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) { return; }
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  var LOCAL = [
    { text: 'the cat sat on a mat.', emoji: '🐱', distractors: ['🐶', '🐸'], level: 1 },
    { text: 'a dog can run.', emoji: '🐶', distractors: ['🐱', '🐷'], level: 1 },
    { text: 'i see a big sun.', emoji: '☀️', distractors: ['🌙', '⭐'], level: 1 },
    { text: 'the pig is in the mud.', emoji: '🐷', distractors: ['🐔', '🐮'], level: 1 },
    { text: 'a red bus can go.', emoji: '🚌', distractors: ['🚂', '✈️'], level: 1 },
    { text: 'a hen sat on the nest.', emoji: '\uD83D\uDC14', distractors: ['\uD83D\uDC37', '\uD83D\uDC31'], level: 1 },
    { text: 'the frog can hop.', emoji: '🐸', distractors: ['🐢', '🐟'], level: 2 },
    { text: 'the ship is on the sea.', emoji: '🚢', distractors: ['🚗', '✈️'], level: 2 },
    { text: 'a fish can swim fast.', emoji: '🐟', distractors: ['🐦', '🐈'], level: 2 },
    { text: 'the crab is on the sand.', emoji: '🦀', distractors: ['🐙', '🐚'], level: 2 },
    { text: 'the duck swims in the pond.', emoji: '🦆', distractors: ['🐓', '🐦'], level: 2 },
    { text: 'the duck swims. the duck can quack.', emoji: '\uD83E\uDD86', distractors: ['\uD83D\uDC13', '\uD83D\uDC1F'], level: 2 },
    { text: 'the boy has a kite. it is up in the sky.', emoji: '🪁', distractors: ['⚽', '🎸'], level: 3 },
    { text: 'we ate the cake. it was so good.', emoji: '🎂', distractors: ['🍕', '🍎'], level: 3 },
    { text: 'the snail is slow. it likes the rain.', emoji: '🐌', distractors: ['🐇', '🦋'], level: 3 },
    { text: 'i can ride my bike. it has two wheels.', emoji: '🚲', distractors: ['🚗', '🛴'], level: 3 },
    { text: 'the crab is red. it can walk on the sand.', emoji: '\uD83E\uDD80', distractors: ['\uD83D\uDC19', '\uD83D\uDC1A'], level: 3 },
    { text: 'the sun is hot. i will wear my hat.', emoji: '\u2600\uFE0F', distractors: ['\uD83C\uDF19', '\u2744\uFE0F'], level: 3 }
  ];

  LOCAL.push(
    { text: 'the star is far. it is in the dark sky.', emoji: '⭐', distractors: ['🌞', '🌳'], level: 4 },
    { text: 'the shark swam past the barn dock. the boy ran.', emoji: '🦈', distractors: ['🐮', '🐟'], level: 4 },
    { text: 'a bird sat in the corn. it was a hot day.', emoji: '🐦', distractors: ['🐮', '🐟'], level: 4 },
    { text: 'the coin fell from the boy. clink!', emoji: '🪙', distractors: ['🍎', '🔑'], level: 4 },
    { text: 'mia zipped her coat. flakes fell all night.', emoji: '❄️', distractors: ['☀️', '🌈'], level: 5, hint: 'flakes fall from the sky when it is snowing.' },
    { text: 'jack got his mitts and a hat. he ran to the hill with a sled.', emoji: '🛷', distractors: ['🏖️', '🚲'], level: 5, hint: 'a sled is for sliding down a snowy hill.' },
    { text: 'the pot is on the stove. it is going bubble, bubble, pop. the cook sniffs.', emoji: '🍲', distractors: ['🛁', '🌊'], level: 5, hint: 'a cook, a stove and a pot mean soup.' },
    { text: 'drip, drip, drip. the sky is dark. ben gets his umbrella.', emoji: '🌧️', distractors: ['🌞', '🌈'], level: 5, hint: 'you need an umbrella when it rains.' },
    { text: 'the crowd cheers. the boy kicks the ball past the net.', emoji: '⚽', distractors: ['🏀', '🎾'], level: 5, hint: 'a ball and a net: it is a soccer game.' }
  );

  function clean(w) { return String(w).toLowerCase().replace(/[^a-z0-9']/g, ''); }

  function validSentence(s) {
    return s && typeof s.text === 'string' && s.text && s.emoji;
  }

  function levelsOf(list) {
    var seen = {}, out = [];
    list.forEach(function (x) { var l = x.level || 1; if (!seen[l]) { seen[l] = 1; out.push(l); } });
    return out.sort(function (x, y) { return x - y; });
  }
  function resolveLevel(avail, level) {
    if (!avail.length) { return 0; }
    if (avail.indexOf(level) >= 0) { return level; }
    var lower = avail.filter(function (n) { return n < level; });
    return lower.length ? lower[lower.length - 1] : avail[0];
  }

  function buildPool(level, rounds) {
    var all = (RG.content && RG.content.sentences || []).filter(validSentence);
    var local = LOCAL.filter(validSentence);
    var lv = resolveLevel(levelsOf(all), level);
    var pool = RG.shuffle(all.filter(function (s) { return (s.level || 1) === lv; }));
    var seen = {};
    pool.forEach(function (s) { seen[s.text] = true; });
    if (pool.length < rounds) {
      var more = RG.shuffle(local.filter(function (s) { return s.level === resolveLevel(levelsOf(local), level) && !seen[s.text]; }));
      pool = pool.concat(more);
      more.forEach(function (s) { seen[s.text] = true; });
    }
    if (pool.length < rounds) {
      // pad from the next lower levels (never harder than asked)
      var lower = all.filter(function (s) { return !seen[s.text] && (s.level || 1) < lv; }).sort(function (a, b) { return (b.level || 1) - (a.level || 1); });
      pool = pool.concat(lower);
    }
    if (!pool.length) { pool = RG.shuffle(local); }
    return pool;
  }

  RG.registerGame({
    id: 'sentence-match',
    title: 'Sentence Match',
    emoji: '🖼️',
    tracks: ['big'],
    skill: 'comprehension',
    blurb: 'Read the sentence and find the matching picture!',
    mount: function (container, ctx) {
      injectStyle();
      var dead = false;
      var timers = [];
      var level = Math.max(1, Math.min(5, ctx.level || 1));
      var rounds = ctx.rounds || 5;
      var pool = buildPool(level, rounds);
      var allEmoji = [];
      ((RG.content && RG.content.sentences) || []).concat(LOCAL).forEach(function (s) {
        if (s && s.emoji && allEmoji.indexOf(s.emoji) < 0) { allEmoji.push(s.emoji); }
      });
      var rowSpans = [], roundNo = 0, locked = true, misses = 0, item = null;
      var readBtn = null, modelTimer = null, modeled = false;

      function noop() {}
      function later(fn, ms) {
        var id = setTimeout(function () {
          var k = timers.indexOf(id);
          if (k >= 0) { timers.splice(k, 1); }
          if (!dead) { fn(); }
        }, ms);
        timers.push(id);
        return id;
      }
      function sleep(ms) { return new Promise(function (res) { later(res, ms); }); }
      function say(text, opts) {
        var p;
        try { p = Promise.resolve(RG.speak(text, opts)).catch(noop); } catch (e) { p = Promise.resolve(); }
        return Promise.race([p, sleep(Math.max(2500, text.length * 220))]);
      }
      function quick(text, opts) { try { RG.speak(text, opts); } catch (e) { /* ignore */ } }

      container.innerHTML = '';
      var stage = RG.el('div', { class: 'sm-stage' });
      container.appendChild(stage);

      function startRound() {
        if (dead) { return; }
        locked = false;
        misses = 0; modeled = false;
        item = pool[roundNo % pool.length];
        container.dataset.answer = item.emoji;
        stage.innerHTML = '';

        var prompt = RG.el('div', { class: 'prompt', text: 'Read the sentence. Tap the matching picture!' });
        var card = RG.el('div', { class: 'sm-card' });
        var sentences = (item.text.match(/[^.!?]+[.!?]*/g) || [item.text]).map(function (x) { return x.trim(); }).filter(function (x) { return x; });
        var spans = [];
        rowSpans = spans;
        var nWords = item.text.split(/\s+/).length;
        var fs = nWords > 18 ? '1.35rem' : nWords > 11 ? '1.6rem' : '';
        sentences.forEach(function (sent) {
          var line = RG.el('div', { class: 'sm-line' });
          sent.split(/\s+/).forEach(function (w) {
            if (!w) { return; }
            var sp = RG.el('button', { class: 'sm-w word', type: 'button', text: w });
            if (fs) { sp.style.fontSize = fs; }
            sp.addEventListener('click', function () {
              if (dead) { return; }
              spans.forEach(function (x) { x.classList.remove('sm-on'); });
              sp.classList.add('sm-on');
              later(function () { sp.classList.remove('sm-on'); }, 700);
              quick(clean(w) || w);
            });
            spans.push(sp);
            line.appendChild(sp);
          });
          card.appendChild(line);
        });

        readBtn = RG.el('button', { class: 'btn sm-read sm-wait', type: 'button', disabled: 'disabled' },
          RG.el('span', { class: 'sm-fill' }),
          RG.el('span', { class: 'sm-read-label', text: '🔊 Try reading first...' }));
        var label = readBtn.querySelector('.sm-read-label');
        var btn = readBtn;
        readBtn.addEventListener('click', function () {
          if (btn.disabled || dead) { return; }
          quick(item.text);
        });
        later(function () {
          btn.removeAttribute('disabled');
          btn.disabled = false;
          btn.classList.remove('sm-wait');
          btn.classList.add('sm-ready');
          label.textContent = '🔊 Read it to me';
          var f = btn.querySelector('.sm-fill');
          if (f) { f.style.width = '100%'; }
        }, WAIT_MS);

        // choices
        var ds = (item.distractors || []).filter(function (e) { return e && e !== item.emoji; });
        ds = ds.filter(function (e, i) { return ds.indexOf(e) === i; });
        if (ds.length < 2) {
          var extra = RG.shuffle(allEmoji.filter(function (e) { return e !== item.emoji && ds.indexOf(e) < 0; }));
          while (ds.length < 2 && extra.length) { ds.push(extra.shift()); }
        }
        var opts = RG.shuffle([item.emoji].concat(ds.slice(0, 2)));
        var choices = RG.el('div', { class: 'choices sm-choices' });
        var btns = [];
        opts.forEach(function (em) {
          var b = RG.el('button', { class: 'choice sm-pic', type: 'button', text: em, 'aria-label': 'picture' });
          b.addEventListener('click', function () { onPick(b, em, btns); });
          btns.push(b);
          choices.appendChild(b);
        });

        stage.appendChild(prompt);
        stage.appendChild(card);
        stage.appendChild(readBtn);
        stage.appendChild(choices);

        var intro = 'Read the sentence. Then tap the matching picture.';
        ctx.onReplay = function () { quick(intro); };
        quick(intro);
      }

      function clearHl() { rowSpans.forEach(function (x) { x.classList.remove('sm-on'); }); }

      /* After 2 misses: read the sentence aloud word by word, then say which picture matches (and, for the
         inference level, why), and make the right picture glow. */
      function modelAnswer(btns) {
        modeled = true; locked = true;
        btns.forEach(function (x) { if (x.textContent !== item.emoji) { x.classList.add('sm-dim'); } });
        var words = rowSpans.slice(), i = 0;
        var step = 330;
        (function tick() {
          clearHl();
          if (dead || i >= words.length) { return; }
          words[i].classList.add('sm-on'); i++;
          modelTimer = later(tick, step);
        })();
        var hintText = item.hint || item.why || item.explain || '';
        var why = hintText ? ' ' + hintText : '';
        say('Let me read it. ' + item.text, { mood: 'calm' })
          .then(function () { clearHl(); if (dead) { return; } return say('This picture matches!' + why, { mood: 'gentle' }); })
          .then(function () {
            if (dead) { return; }
            btns.forEach(function (x) { x.classList.remove('sm-dim'); if (x.textContent === item.emoji) { x.classList.add('hint'); } });
            locked = false;
          });
      }

      function onPick(b, em, btns) {
        if (locked || dead) { return; }
        if (em === item.emoji) {
          locked = true;
          ctx.answer(true);
          btns.forEach(function (x) { x.classList.remove('hint'); });
          b.classList.add('correct');
          RG.celebrate(b);
          say(item.text)
            .then(function () { var ht = item.hint || item.why || item.explain; if (!dead && ht && level >= 5) { return say(ht, { mood: 'calm' }); } })
            .then(function () { if (!dead) { return say(RG.praise(), { mood: 'excited' }); } })
            .then(function () { return sleep(350); })
            .then(function () {
              if (dead) { return; }
              roundNo++;
              ctx.roundDone();
              if (roundNo >= rounds) { ctx.finish(); } else { startRound(); }
            });
        } else {
          ctx.answer(false);
          misses++;
          RG.wobble(b);
          if (misses >= 2 && !modeled) {
            modelAnswer(btns);
          } else {
            quick('Try again! Read it slowly, one word at a time.', { mood: 'gentle' });
            if (misses >= 2) {
              btns.forEach(function (x) { if (x.textContent === item.emoji) { x.classList.add('hint'); } });
            }
          }
        }
      }

      startRound();

      return function cleanup() {
        dead = true;
        timers.forEach(clearTimeout);
        timers = [];
        try { RG.stopSpeaking(); } catch (e) { /* ignore */ }
        ctx.onReplay = null;
        try { container.innerHTML = ''; } catch (e2) { /* ignore */ }
      };
    }
  });
})();
