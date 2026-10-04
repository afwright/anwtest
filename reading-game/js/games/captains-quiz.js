/* Captain's Challenge - a friendly mixed quiz (10 questions) generated from RG.content.
   One try per question, kind reveal, trophy screen with islands to practice. */
(function () {
  'use strict';
  var RG = window.RG;
  if (!RG || !RG.registerGame) { return; }

  var STYLE_ID = 'cq-style';
  var CSS = `
.cq-wrap{width:100%;max-width:680px;margin:0 auto;padding:6px 10px 22px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;color:#3b2a1a}
.cq-top{display:flex;justify-content:space-between;align-items:center;width:100%;font-weight:800;font-size:1.05rem}
.cq-count{background:#fff;border:3px solid #ffb703;border-radius:16px;padding:4px 14px}
.cq-prompt{margin:0}
.cq-show{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}
.cq-bigword{font-size:2.6rem;font-weight:800;letter-spacing:.12em;background:#fff;border:4px solid #4cc3ff;border-radius:18px;padding:8px 22px}
.cq-sentence{font-size:1.6rem;font-weight:800;line-height:1.5;background:#fff;border:4px solid #4cc3ff;border-radius:18px;padding:10px 18px;letter-spacing:.03em}
.cq-blank{display:inline-block;min-width:80px;border-bottom:5px solid #ff8c42;margin:0 4px}
.cq-passage{text-align:left;background:#fff3d1;border:3px solid #c9a35a;border-radius:8px 16px 10px 18px;padding:12px 16px;font-size:1.25rem;line-height:1.5;font-weight:700;width:100%;box-sizing:border-box;box-shadow:inset 0 0 18px rgba(201,163,90,.5)}
.cq-passage p{margin:2px 0}
.cq-signcard{font-size:1.7rem;font-weight:800;background:#fff3d1;border:5px solid #8a5a2b;border-radius:14px;padding:12px 20px;display:flex;align-items:center;gap:12px;box-shadow:0 5px 0 rgba(0,0,0,.2)}
.cq-signcard span:first-child{font-size:2.6rem}
.cq-choices{width:100%}
.cq-opt{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:96px}
.cq-oe{font-size:3rem;line-height:1.1}
.cq-ol{font-size:1.5rem;font-weight:800;line-height:1.15}
.cq-opt.cq-wide{min-width:140px}
.cq-opt.cq-wordopt .cq-ol{font-size:2rem;letter-spacing:.08em}
.cq-opt.cq-txt .cq-ol{font-size:1.25rem;letter-spacing:0}
.cq-opt.cq-plate{min-width:120px;background:#fff3d1;border-color:#8a5a2b}
.cq-opt.cq-plate .cq-ol{font-size:1.8rem;letter-spacing:.05em}
.cq-opt.cq-soft{opacity:.5;filter:grayscale(.4)}
.cq-opt.cq-reveal{animation:cq-pulse 1s ease-in-out 2}
.cq-opt[disabled]{pointer-events:none}
.cq-fb{min-height:2.6rem;font-size:1.3rem;font-weight:800;display:flex;align-items:center;justify-content:center;gap:6px}
.cq-fb.good{color:#1f8a43}
.cq-fb.kind{color:#1d6fd1}
.cq-next{min-height:72px}
.cq-end{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}
.cq-trophy{font-size:6rem;line-height:1.05;animation:cq-pop .7s;filter:drop-shadow(0 6px 0 rgba(0,0,0,.15))}
.cq-end h2{margin:0;font-size:1.8rem}
.cq-score{font-size:1.5rem;font-weight:800;background:#fff;border:4px solid #ffb703;border-radius:20px;padding:6px 22px}
.cq-bonus{font-size:1.25rem;font-weight:800;color:#8a5a00}
.cq-isles-h{font-size:1.3rem;font-weight:800;margin-top:6px}
.cq-isles{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;width:100%}
.cq-isle{background:#fff;border:4px solid #4cc3ff;border-radius:18px;padding:8px 14px;min-width:130px;display:flex;flex-direction:column;align-items:center;gap:2px;font-weight:800}
.cq-isle b{font-size:2.2rem;line-height:1.1}
.cq-isle small{font-size:.8rem;opacity:.7;font-weight:700}
.cq-isle-btn{font-family:inherit;color:inherit;cursor:pointer;min-height:96px;min-width:140px;box-shadow:0 6px 0 rgba(10,60,110,.22);transition:transform .12s,box-shadow .12s;border-color:#ffb703}
.cq-isle-btn:active{transform:translateY(4px) scale(.97);box-shadow:0 2px 0 rgba(10,60,110,.22)}
.cq-isle-btn .cq-sail{font-size:.95rem;color:#1d6fd1;font-weight:800;opacity:1}
.cq-isle-btn span{font-size:1.1rem}
.cq-isle-btn[disabled]{opacity:.6;pointer-events:none}
.cq-isles-tip{font-size:1rem;font-weight:700;opacity:.8;margin-top:-6px}
@keyframes cq-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
@keyframes cq-pop{0%{transform:scale(.3) rotate(-10deg)}70%{transform:scale(1.15) rotate(4deg)}100%{transform:scale(1) rotate(0)}}
@media (prefers-reduced-motion:reduce){.cq-wrap *{animation-duration:.01s!important;animation-iteration-count:1!important}}
`;

  /* ---------------- fallbacks ---------------- */
  var FB_EMOJI = {
    cat: '🐱', hat: '🎩', bat: '🦇', dog: '🐶', log: '🪵', frog: '🐸', can: '🥫', pan: '🍳', man: '👨',
    bug: '🐛', mug: '☕', rug: '🧶', sun: '☀️', bus: '🚌', pig: '🐷', bed: '🛏️', fox: '🦊', box: '📦',
    ship: '🚢', fish: '🐟', chick: '🐤', crab: '🦀', duck: '🦆', whale: '🐳'
  };
  var FB_LETTERS = [
    { letter: 's', sound: 'sss', word: 'sun', emoji: '☀️' }, { letter: 'a', sound: 'ah', word: 'apple', emoji: '🍎' },
    { letter: 't', sound: 'tuh', word: 'tiger', emoji: '🐯' }, { letter: 'p', sound: 'puh', word: 'pig', emoji: '🐷' },
    { letter: 'n', sound: 'nuh', word: 'nest', emoji: '🪺' }, { letter: 'm', sound: 'mmm', word: 'moon', emoji: '🌙' },
    { letter: 'd', sound: 'duh', word: 'dog', emoji: '🐶' }, { letter: 'b', sound: 'buh', word: 'ball', emoji: '⚽' },
    { letter: 'f', sound: 'fff', word: 'fish', emoji: '🐟' }, { letter: 'g', sound: 'guh', word: 'goat', emoji: '🐐' },
    { letter: 'h', sound: 'huh', word: 'hat', emoji: '🎩' }, { letter: 'c', sound: 'kuh', word: 'cat', emoji: '🐱' }
  ];
  var FB_RHYME = { at: ['cat', 'hat', 'bat'], og: ['dog', 'log', 'frog'], an: ['can', 'pan', 'man'], ug: ['bug', 'mug', 'rug'] };
  var FB_CVC = ['cat', 'dog', 'sun', 'bus', 'pig', 'hat', 'bug', 'bed', 'fox', 'box', 'log', 'mug'];
  var FB_DIGRAPH = ['ship', 'fish', 'chick', 'frog', 'crab', 'duck', 'whale'];
  var FB_SIGHT = {
    level1: ['the', 'and', 'you', 'look', 'run', 'see', 'go', 'blue'],
    level2: ['are', 'that', 'this', 'what', 'with', 'they', 'want', 'good'],
    level3: ['after', 'again', 'from', 'could', 'then', 'when', 'were', 'some']
  };
  var FB_SENT = [
    { text: 'the cat is on a bed.', emoji: '🐱', level: 1 }, { text: 'a dog can run.', emoji: '🐶', level: 1 },
    { text: 'the pig is big.', emoji: '🐷', level: 1 }, { text: 'the sun is up.', emoji: '☀️', level: 1 },
    { text: 'the frog sat on a log.', emoji: '🐸', level: 2 }, { text: 'the ship is on the sea.', emoji: '🚢', level: 2 }
  ];
  var FB_STORY = {
    title: 'Sam and the Big Fish', level: 1,
    pages: [{ text: 'sam has a red boat.' }, { text: 'sam sees a big fish.' }, { text: 'the fish jumps up!' }],
    questions: [{ q: 'what color is the boat?', options: ['red', 'blue', 'green'], answer: 'red' },
      { q: 'what does sam see?', options: ['a big fish', 'a dog', 'a bus'], answer: 'a big fish' }]
  };
  var SIGNS = [
    { w: 'stop', e: '🛑' }, { w: 'exit', e: '🚪' }, { w: 'hot', e: '🔥' }, { w: 'open', e: '🟢' },
    { w: 'go', e: '🚶' }, { w: 'cold', e: '🧊' }, { w: 'in', e: '➡️' }
  ];
  var REAL = [
    { e: '🏪', text: 'closed. back at 3.', q: 'when will the shop open again?', opts: ['at 3', 'at noon', 'never'], a: 'at 3' },
    { e: '🎨', text: 'wet paint! do not touch.', q: 'what should you not do?', opts: ['touch the paint', 'look at it', 'walk by'], a: 'touch the paint' },
    { e: '🍦', text: 'ice cream: 2 coins.', q: 'how many coins is the ice cream?', opts: ['2', '5', '10'], a: '2' },
    { e: '⛴️', text: 'the ferry leaves at 9. do not be late!', q: 'when does the ferry leave?', opts: ['at 9', 'at 6', 'at 12'], a: 'at 9' },
    { e: '🐉', text: 'keep out! a dragon is sleeping.', q: 'who is sleeping?', opts: ['a dragon', 'a cat', 'a pirate'], a: 'a dragon' },
    { e: '🐟', text: 'please feed the fish at noon.', q: 'when do the fish get food?', opts: ['at noon', 'at night', 'at 3'], a: 'at noon' }
  ];

  var ISLANDS = {
    'letter-pop': { title: 'Letter Pop', emoji: '🎈' }, 'sound-hunt': { title: 'Sound Hunt', emoji: '🔍' },
    'rhyme-boat': { title: 'Rhyme Boat', emoji: '⛵' }, 'word-builder': { title: 'Word Builder', emoji: '🧱' },
    'sight-fishing': { title: 'Sight Fishing', emoji: '🎣' }, 'sentence-match': { title: 'Sentence Match', emoji: '🖼️' },
    'story-cove': { title: 'Story Cove', emoji: '📖' }, 'reading-quest': { title: 'Reading Quest', emoji: '🗺️' }
  };
  var SKILL_ISLANDS = {
    letters: ['letter-pop'], 'letter-sounds': ['letter-pop', 'sound-hunt'], 'beginning-sounds': ['sound-hunt'],
    rhyme: ['rhyme-boat'], signs: ['reading-quest'], decoding: ['word-builder'], 'sight-words': ['sight-fishing'],
    sentences: ['sentence-match'], comprehension: ['story-cove'], 'real-world': ['reading-quest']
  };
  var SKILL_NAMES = {
    letters: 'letters', 'letter-sounds': 'letter sounds', 'beginning-sounds': 'first sounds', rhyme: 'rhymes',
    signs: 'signs', decoding: 'reading words', 'sight-words': 'sight words', sentences: 'sentences',
    comprehension: 'stories', 'real-world': 'real-world reading'
  };

  /* ---------------- helpers ---------------- */
  function shuffle(a) { return RG.shuffle ? RG.shuffle(a) : a.slice().sort(function () { return Math.random() - 0.5; }); }
  function pick(a, n) { return shuffle(a).slice(0, n); }
  function sample(a) { return a[Math.floor(Math.random() * a.length)]; }
  function C() { return RG.content || {}; }
  function arr(x) { return Array.isArray(x) ? x : []; }
  function emojiOf(w) {
    var e = '';
    try { e = RG.emojiFor ? RG.emojiFor(w) : ''; } catch (x) { e = ''; }
    return e || FB_EMOJI[String(w).toLowerCase()] || '';
  }
  function say(t) {
    try { return Promise.resolve(RG.speak(t)).catch(function () {}); } catch (e) { return Promise.resolve(); }
  }
  function el(tag, cls, text, attrs) {
    var a = attrs || {};
    if (cls) { a['class'] = cls; }
    if (text != null && text !== '') { a.text = text; }
    return RG.el(tag, a);
  }
  function clean(w) { return String(w).replace(/[^a-zA-Z']/g, '').toLowerCase(); }

  function lettersList() {
    var l = arr(C().letters).filter(function (x) { return x && x.letter && x.sound && x.word && x.emoji; });
    return l.length >= 8 ? l : FB_LETTERS;
  }
  function cvcList() {
    var l = arr(C().cvcWords).filter(function (x) { return x && x.word && x.emoji; });
    return l.length >= 8 ? l : FB_CVC.map(function (w) { return { word: w, emoji: FB_EMOJI[w] }; });
  }
  function digraphList() {
    var l = arr(C().digraphWords).filter(function (x) { return x && x.word && x.emoji; });
    return l.length >= 6 ? l : FB_DIGRAPH.map(function (w) { return { word: w, emoji: FB_EMOJI[w] }; });
  }
  function rhymeFams() {
    var src = C().rhymeFamilies, out = [];
    if (src && typeof src === 'object') {
      Object.keys(src).forEach(function (k) {
        var ws = arr(src[k]).filter(function (w) { return emojiOf(w); });
        if (ws.length >= 2) { out.push(ws); }
      });
    }
    if (out.length < 3) {
      out = Object.keys(FB_RHYME).map(function (k) { return FB_RHYME[k]; });
    }
    return out;
  }

  /* ---------------- question builders ---------------- */
  // Each returns {skill, prompt, ask(), show, opts:[{label,emoji,cls,correct,say}], reveal}
  function Gen(track, level) {
    var used = {};
    function fresh(key) { if (used[key]) { return false; } used[key] = 1; return true; }
    function letterCase(l) { return (track === 'little' && level >= 3) ? l.toLowerCase() : l.toUpperCase(); }

    function pickLetters(n, distinctSound, forceFirst) {
      var all = lettersList();
      var pool = all;
      if (level === 1 && track === 'little') {
        var starter = all.filter(function (x) { return 'satpinmd'.indexOf(x.letter) >= 0; });
        if (starter.length >= n + 2) { pool = starter; }
      }
      var target = null, tries = 0;
      do { target = sample(pool); tries++; } while (!fresh('L' + target.letter) && tries < 30);
      var others = shuffle(pool).filter(function (x) { return x.letter !== target.letter && x.sound !== target.sound; });
      var chosen = [target];
      others.forEach(function (x) {
        if (chosen.length < n && chosen.every(function (c) { return c.sound !== x.sound; })) { chosen.push(x); }
      });
      return { target: target, list: shuffle(chosen) };
    }
    function letterOpts(r) {
      return r.list.map(function (x) {
        return { label: letterCase(x.letter), cls: 'cq-wide', correct: x === r.target, say: 'the letter ' + x.letter, aria: 'letter ' + x.letter };
      });
    }
    var nOpts = level >= 3 ? 4 : 3;

    var G = {};
    G.letters = function () {
      var r = pickLetters(nOpts), t = r.target;
      return { skill: 'letters', prompt: 'Find the letter ' + letterCase(t.letter) + '!',
        ask: function () { return say('Find the letter').then(function () { return RG.sayLetter ? RG.sayLetter(t.letter) : say(t.letter); }); },
        opts: letterOpts(r), reveal: 'the letter ' + t.letter };
    };
    G['letter-sounds'] = function () {
      var r = pickLetters(nOpts), t = r.target;
      var q = 'Which letter says ' + t.sound + '?';
      return { skill: 'letter-sounds', prompt: q, ask: function () { return say(q); }, opts: letterOpts(r), reveal: 'the letter ' + t.letter };
    };
    G['beginning-sounds'] = function () {
      var r = pickLetters(nOpts), t = r.target, again = 0;
      // x is taught with "fox", which does not START with x: pick another letter
      while (String(t.word).charAt(0).toLowerCase() !== t.letter && again++ < 20) { r = pickLetters(nOpts); t = r.target; }
      var q = t.word + '. What sound does ' + t.word + ' start with?';
      return { skill: 'beginning-sounds', prompt: q, ask: function () { return say(q); },
        show: el('div', 'big-emoji', t.emoji), opts: letterOpts(r), reveal: 'the letter ' + t.letter };
    };
    G.rhyme = function () {
      var fams = rhymeFams();
      var fi = Math.floor(Math.random() * fams.length), fam = fams[fi];
      var tries = 0;
      while (!fresh('R' + fam.join()) && tries < 20) { fi = Math.floor(Math.random() * fams.length); fam = fams[fi]; tries++; }
      var two = pick(fam, 2), target = two[0], right = two[1];
      var others = [];
      fams.forEach(function (f, i) { if (i !== fi) { others = others.concat(f); } });
      others = others.filter(function (w) { return fam.indexOf(w) < 0; });
      var wrong = pick(others, 2);
      var showWords = track === 'big';
      var opts = shuffle([right].concat(wrong)).map(function (w) {
        return { emoji: emojiOf(w), label: showWords ? w : '', cls: showWords ? 'cq-wide' : '', correct: w === right, say: w, aria: w };
      });
      var q = 'Which one rhymes with ' + target + '?';
      var show = el('div', 'cq-show');
      show.appendChild(el('div', 'big-emoji', emojiOf(target)));
      if (showWords) { show.appendChild(el('div', 'word', target)); }
      return { skill: 'rhyme', prompt: q, ask: function () { return say(q); }, show: show, opts: opts, reveal: right };
    };
    G.signs = function () {
      var pool = pick(SIGNS, 3), t = pool[0];
      var tries = 0;
      while (!fresh('S' + t.w) && tries < 20) { pool = pick(SIGNS, 3); t = pool[0]; tries++; }
      var q = 'Which sign says ' + t.w.toUpperCase() + '?';
      var opts = shuffle(pool).map(function (s) {
        return { emoji: s.e, label: s.w, cls: 'cq-plate cq-wide', correct: s === t, say: s.w, aria: s.w };
      });
      return { skill: 'signs', prompt: q, ask: function () { return say('Which sign says ' + t.w + '?'); }, opts: opts, reveal: t.w };
    };
    G.decoding = function () {
      var pool = level === 1 ? cvcList() : (level === 2 ? digraphList() : digraphList().concat(cvcList()));
      var seenE = {}, uniq = pool.filter(function (x) { if (seenE[x.emoji]) { return false; } seenE[x.emoji] = 1; return true; });
      var t, tries = 0;
      do { t = sample(uniq); tries++; } while (!fresh('D' + t.word) && tries < 30);
      var wrong = pick(uniq.filter(function (x) { return x.emoji !== t.emoji; }), 2);
      var opts = shuffle([t].concat(wrong)).map(function (x) {
        return { emoji: x.emoji, cls: 'cq-wide', correct: x === t, say: x.word, aria: x.word };
      });
      var q = 'Read the word. Which picture matches?';
      return { skill: 'decoding', prompt: q, ask: function () { return say(q); },
        show: el('div', 'cq-bigword word', t.word), opts: opts, reveal: t.word };
    };
    G['sight-words'] = function () {
      var sw = C().sightWords || FB_SIGHT;
      var pool = [];
      for (var i = 1; i <= level; i++) { pool = pool.concat(arr(sw['level' + i])); }
      if (pool.length < 6) { pool = FB_SIGHT.level1.concat(FB_SIGHT.level2); }
      var seenW = {}; pool = pool.filter(function (w) { var k = w.toLowerCase(); if (seenW[k]) { return false; } seenW[k] = 1; return true; });
      var t, tries = 0;
      do { t = sample(pool); tries++; } while (!fresh('W' + t.toLowerCase()) && tries < 30);
      var wrong = pick(pool.filter(function (w) { return w.toLowerCase() !== t.toLowerCase(); }), 3);
      var opts = shuffle([t].concat(wrong)).map(function (w) {
        return { label: w, cls: 'cq-wordopt cq-wide', correct: w === t, say: w, aria: w };
      });
      var q = 'Find the word ' + t + '!';
      return { skill: 'sight-words', prompt: q, ask: function () { return say(q); }, opts: opts, reveal: t };
    };
    G.sentences = function () {
      var all = arr(C().sentences).filter(function (s) { return s && s.text && s.emoji; });
      if (all.length < 4) { all = FB_SENT; }
      var okLvl = all.filter(function (s) { return (s.level || 1) <= level; });
      var cands = shuffle(okLvl.length >= 3 ? okLvl : all);
      var found = null, blankIdx = -1;
      for (var i = 0; i < cands.length && !found; i++) {
        var words = cands[i].text.split(' ');
        for (var j = 0; j < words.length; j++) {
          var cw = clean(words[j]);
          if (cw.length >= 3 && emojiOf(cw) === cands[i].emoji && fresh('C' + cands[i].text)) { found = cands[i]; blankIdx = j; break; }
        }
      }
      if (!found) { found = FB_SENT[0]; blankIdx = 1; }
      var words2 = found.text.split(' ');
      var ans = clean(words2[blankIdx]);
      var trail = words2[blankIdx].replace(/[a-zA-Z']/g, '');
      var distract = [];
      all.forEach(function (s) {
        s.text.split(' ').forEach(function (w) {
          var c = clean(w);
          if (c.length >= 3 && c !== ans && distract.indexOf(c) < 0 && emojiOf(c) !== found.emoji) { distract.push(c); }
        });
      });
      if (distract.length < 2) { distract = ['red', 'run', 'jump']; }
      var wrong = pick(distract, 2);
      var opts = shuffle([ans].concat(wrong)).map(function (w) {
        return { label: w, cls: 'cq-wordopt cq-wide', correct: w === ans, say: w, aria: w };
      });
      var show = el('div', 'cq-show');
      show.appendChild(el('div', 'big-emoji', found.emoji));
      var sent = el('div', 'cq-sentence');
      words2.forEach(function (w, k) {
        if (k === blankIdx) {
          sent.appendChild(el('span', 'cq-blank', '     '));
          if (trail) { sent.appendChild(document.createTextNode(trail)); }
        } else { sent.appendChild(document.createTextNode(w)); }
        if (k < words2.length - 1) { sent.appendChild(document.createTextNode(' ')); }
      });
      show.appendChild(sent);
      var q = 'Which word is missing? The picture can help.';
      return { skill: 'sentences', prompt: q, ask: function () { return say(q); }, show: show, opts: opts,
        reveal: ans, after: found.text };
    };
    G.comprehension = function () {
      var all = arr(C().stories).filter(function (s) { return s && arr(s.pages).length && arr(s.questions).length; });
      if (!all.length) { all = [FB_STORY]; }
      var okLvl = all.filter(function (s) { return (s.level || 1) <= level; });
      var story = sample(okLvl.length ? okLvl : all);
      var qq = sample(story.questions);
      var show = el('div', 'cq-passage');
      story.pages.forEach(function (p) { show.appendChild(el('p', '', p.text)); });
      var opts = shuffle(arr(qq.options)).map(function (o) {
        return { label: String(o), cls: 'cq-txt cq-wide', correct: o === qq.answer, say: String(o), aria: String(o) };
      });
      var q = 'Read the story. ' + qq.q;
      var wrap = el('div', 'cq-show');
      wrap.appendChild(show);
      wrap.appendChild(el('div', 'prompt cq-prompt', qq.q));
      return { skill: 'comprehension', prompt: 'Read the story. Then answer the question.', ask: function () { return say(q); },
        show: wrap, opts: opts, reveal: String(qq.answer) };
    };
    G['real-world'] = function () {
      var r = sample(REAL), tries = 0;
      while (!fresh('X' + r.text) && tries < 20) { r = sample(REAL); tries++; }
      var show = el('div', 'cq-show');
      var card = el('div', 'cq-signcard');
      card.appendChild(el('span', '', r.e));
      card.appendChild(el('span', '', r.text));
      show.appendChild(card);
      show.appendChild(el('div', 'prompt cq-prompt', r.q));
      var opts = shuffle(r.opts).map(function (o) {
        return { label: o, cls: 'cq-txt cq-wide', correct: o === r.a, say: o, aria: o };
      });
      var q = 'Read the sign. ' + r.q;
      return { skill: 'real-world', prompt: 'Read the sign. Then answer.', ask: function () { return say(q); },
        show: show, opts: opts, reveal: r.a };
    };
    return G;
  }

  var PLAN = {
    little: ['letters', 'letter-sounds', 'beginning-sounds', 'rhyme', 'signs'],
    big: ['decoding', 'sight-words', 'sentences', 'rhyme', 'comprehension', 'real-world']
  };
  var BIG_EXTRA = ['decoding', 'sight-words', 'sentences', 'real-world'];

  function buildQuiz(track, level, total) {
    var G = Gen(track, level);
    var types = PLAN[track].slice();
    var seq = [];
    if (track === 'little') {
      while (seq.length < total) {
        var round = shuffle(types);
        if (seq.length && round[0] === seq[seq.length - 1]) { round.push(round.shift()); }
        seq = seq.concat(round);
      }
    } else {
      seq = shuffle(types).concat(shuffle(BIG_EXTRA));
      while (seq.length < total) { seq = seq.concat(shuffle(types)); }
    }
    seq = seq.slice(0, total);
    var qs = [];
    seq.forEach(function (t) {
      var q = null;
      try { q = G[t](); } catch (e) { q = null; }
      if (!q) { try { q = G[track === 'little' ? 'letters' : 'sight-words'](); } catch (e2) { q = null; } }
      if (q) { qs.push(q); }
    });
    return qs;
  }

  /* ---------------- game ---------------- */
  RG.registerGame({
    id: 'captains-quiz',
    title: "Captain's Challenge",
    emoji: '🏆',
    tracks: ['little', 'big'],
    skill: 'quiz',
    rounds: 10,
    blurb: "Show what you know in the Captain's Challenge! Ten questions, and a trophy to win!",
    mount: function (container, ctx) {
      if (!document.getElementById(STYLE_ID)) {
        var st = document.createElement('style');
        st.id = STYLE_ID; st.textContent = CSS; document.head.appendChild(st);
      }
      var track = (ctx.profile && ctx.profile.track === 'big') ? 'big' : 'little';
      var level = ctx.level || 1;
      var total = ctx.rounds || 10;
      var alive = true, timers = [], listeners = [];
      var qs = buildQuiz(track, level, total);
      total = qs.length;
      var idx = -1, score = 0, bySkill = {}, locked = false, answered = false, finished = false;
      var root = el('div', 'cq-wrap');
      container.appendChild(root);

      function later(fn, ms) {
        var id = setTimeout(function () {
          var i = timers.indexOf(id); if (i >= 0) { timers.splice(i, 1); }
          if (alive) { fn(); }
        }, ms);
        timers.push(id);
        return id;
      }
      function on(node, ev, fn) { node.addEventListener(ev, fn); listeners.push([node, ev, fn]); }

      function next() {
        idx++;
        if (idx >= qs.length) { endScreen(); } else { showQuestion(qs[idx]); }
      }

      function optNode(o, q, choices) {
        var b = el('button', 'choice cq-opt' + (o.cls ? ' ' + o.cls : ''), '', { type: 'button', 'aria-label': o.aria || o.label || o.emoji });
        b.setAttribute('data-correct', o.correct ? '1' : '0');
        if (o.emoji) { b.appendChild(el('span', 'cq-oe', o.emoji)); }
        if (o.label) { b.appendChild(el('span', 'cq-ol', o.label)); }
        on(b, 'click', function () { pick1(o, b, q, choices); });
        return b;
      }

      function showQuestion(q) {
        answered = false; locked = false;
        root.innerHTML = '';
        var top = el('div', 'cq-top');
        top.appendChild(el('span', 'cq-count', 'Question ' + (idx + 1) + ' of ' + total));
        top.appendChild(el('span', '', '🏆'));
        root.appendChild(top);
        root.appendChild(el('div', 'prompt cq-prompt', q.prompt));
        if (q.show) {
          if (q.show.className === 'cq-show') { root.appendChild(q.show); }
          else { var s = el('div', 'cq-show'); s.appendChild(q.show); root.appendChild(s); }
        }
        var choices = el('div', 'choices cq-choices');
        q.opts.forEach(function (o) { choices.appendChild(optNode(o, q, choices)); });
        root.appendChild(choices);
        var fb = el('div', 'cq-fb', '', { 'aria-live': 'polite' });
        fb.id = 'cq-fb';
        root.appendChild(fb);
        var slot = el('div', 'cq-nextslot');
        root.appendChild(slot);
        ctx.onReplay = function () { q.ask(); };
        q.ask();
      }

      function pick1(o, btn, q, choices) {
        if (locked || answered || !alive) { return; }
        answered = true; locked = true;
        var ok = !!o.correct;
        try { ctx.answer(ok); } catch (e) { /* ignore */ }
        if (ok) { score++; }
        var rec = bySkill[q.skill] || (bySkill[q.skill] = [0, 0]);
        rec[1]++; if (ok) { rec[0]++; }
        var btns = choices.querySelectorAll('.cq-opt');
        Array.prototype.forEach.call(btns, function (b) {
          b.disabled = true;
          if (b.getAttribute('data-correct') === '1') { b.classList.add('correct'); if (!ok) { b.classList.add('cq-reveal'); } }
          else if (b === btn) { b.classList.add('cq-soft'); }
          else { b.classList.add('cq-soft'); }
        });
        var fb = root.querySelector('.cq-fb');
        var msg;
        if (ok) {
          msg = (RG.praise ? RG.praise() : 'You did it!');
          fb.className = 'cq-fb good'; fb.textContent = '⭐ ' + msg;
          try { RG.celebrate(btn); } catch (e2) { /* ignore */ }
          say(msg);
        } else {
          msg = 'Good try! It was ' + q.reveal + '.';
          fb.className = 'cq-fb kind'; fb.textContent = '🌊 ' + msg;
          say(msg + (q.after ? ' ' + q.after : ''));
        }
        try { ctx.roundDone(); } catch (e3) { /* ignore */ }
        var last = idx >= qs.length - 1;
        later(function () {
          var slot = root.querySelector('.cq-nextslot');
          if (!slot) { return; }
          var nb = el('button', 'btn primary cq-next', last ? 'See my trophy ▶' : 'Next ▶', { type: 'button' });
          nb.id = 'cq-next';
          on(nb, 'click', function () { if (nb.disabled) { return; } nb.disabled = true; next(); });
          slot.appendChild(nb);
        }, 900);
      }

      function islandInfo(id) {
        var g = null;
        try { (RG.games || []).forEach(function (x) { if (x && x.id === id) { g = x; } }); } catch (e) { g = null; }
        var fb = ISLANDS[id] || { title: id, emoji: '🏝️' };
        return { id: id, title: (g && g.title) || fb.title, emoji: (g && g.emoji) || fb.emoji };
      }

      // only islands that are registered for this profile's track can be recommended
      function onTrack(id) {
        if (id === 'captains-quiz') { return false; }
        var ok = false;
        try { (RG.games || []).forEach(function (g) { if (g && g.id === id && (!g.tracks || g.tracks.indexOf(track) >= 0)) { ok = true; } }); } catch (e) { ok = false; }
        return ok;
      }

      function endScreen() {
        root.innerHTML = '';
        var tier, title, bonus;
        if (score >= total && total > 0) { tier = '🥇'; title = 'Gold Trophy!'; bonus = 10; }
        else if (score >= 8) { tier = '🥈'; title = 'Silver Trophy!'; bonus = 5; }
        else if (score >= 6) { tier = '🥉'; title = 'Bronze Trophy!'; bonus = 2; }
        else { tier = '⭐'; title = 'Brave Sailor!'; bonus = 0; }
        if (bonus > 0 && ctx.award) { try { ctx.award(bonus, "Captain's Challenge trophy"); } catch (e) { /* ignore */ } }
        // practice islands from missed skills
        var practice = [], seenI = {};
        Object.keys(bySkill).forEach(function (sk) {
          if (bySkill[sk][0] < bySkill[sk][1]) {
            (SKILL_ISLANDS[sk] || []).forEach(function (id) {
              if (!seenI[id] && onTrack(id)) { seenI[id] = { info: islandInfo(id), skills: [] }; practice.push(seenI[id]); }
              if (seenI[id]) { seenI[id].skills.push(SKILL_NAMES[sk] || sk); }
            });
          }
        });
        if (RG.quizLog && RG.quizLog.add) {
          try { RG.quizLog.add({ date: new Date().toISOString(), track: track, score: score, total: total, bySkill: bySkill }); } catch (e2) { /* ignore */ }
        }
        if (RG.progress && RG.progress.setRecommended) {
          try { RG.progress.setRecommended(practice.map(function (p) { return p.info.id; })); } catch (e4) { /* ignore */ }
        }
        var box = el('div', 'cq-end');
        box.appendChild(el('div', 'cq-trophy', tier));
        box.appendChild(el('h2', '', title));
        box.appendChild(el('div', 'cq-score', 'You got ' + score + ' out of ' + total + '!'));
        if (bonus > 0) { box.appendChild(el('div', 'cq-bonus', '+' + bonus + ' 🪙 trophy bonus')); }
        box.appendChild(el('div', 'cq-isles-h', 'Islands to practice'));
        var isles = el('div', 'cq-isles');
        if (practice.length) {
          box.appendChild(el('div', 'cq-isles-tip', 'Tap an island to sail there next!'));
          practice.forEach(function (p) {
            var c = el('button', 'cq-isle cq-isle-btn', '', { type: 'button', 'aria-label': 'Sail to ' + p.info.title });
            c.setAttribute('data-island', p.info.id);
            c.appendChild(el('b', '', p.info.emoji));
            c.appendChild(el('span', '', p.info.title));
            c.appendChild(el('small', '', p.skills.join(', ')));
            c.appendChild(el('small', 'cq-sail', '⛵ Sail there'));
            on(c, 'click', function () {
              if (finished) { return; }
              finished = true;
              Array.prototype.forEach.call(root.querySelectorAll('button'), function (x) { x.disabled = true; });
              ctx.finish({ next: p.info.id });
            });
            isles.appendChild(c);
          });
        } else {
          isles.appendChild(el('div', 'cq-isle', 'Every island is shining! Visit any island for fun.'));
        }
        box.appendChild(isles);
        var fin = el('button', 'btn primary cq-next', '⚓ Finish', { type: 'button' });
        fin.id = 'cq-finish';
        on(fin, 'click', function () { if (finished) { return; } finished = true; fin.disabled = true; ctx.finish(); });
        box.appendChild(fin);
        root.appendChild(box);
        var line = 'You got ' + score + ' out of ' + total + '! ' + title.replace('!', '') + '. ' +
          (practice.length ? 'Islands to practice: ' + practice.map(function (p) { return p.info.title; }).join(', ') + '.' : 'Every island is shining!');
        ctx.onReplay = function () { say(line); };
        try { RG.sfx.win(); RG.celebrate(); } catch (e3) { /* ignore */ }
        say(line);
      }

      next();

      return function cleanup() {
        alive = false;
        timers.forEach(function (t) { clearTimeout(t); });
        timers = [];
        listeners.forEach(function (l) { try { l[0].removeEventListener(l[1], l[2]); } catch (e) { /* ignore */ } });
        listeners = [];
        try { RG.stopSpeaking(); } catch (e) { /* ignore */ }
      };
    }
  });
})();
