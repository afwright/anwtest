#!/usr/bin/env node
/* Decodability checker for Treasure Island Readers content.
   Usage:  node tools/check-decodable.js            check everything (exit 1 on violations)
           node tools/check-decodable.js --word frog 2    explain one word at a level
   A word at level N passes if it is (a) in a sight list of level <= N, (b) in the item's `names`,
   or (c) decodable with the patterns taught at levels <= N (greedy onset + vowel + coda rules,
   plus the endings allowed at that level). Nothing else is whitelisted. The only exception
   lists below are *irregular spellings that look regular* (have, love, one ...) and vowel-team
   words with the "other" sound; those must be sight words, so they can never sneak in as phonics. */
'use strict';
var fs = require('fs'), path = require('path'), vm = require('vm');

var sandbox = { console: console };
sandbox.window = sandbox;                      // browser-like global
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'content.js'), 'utf8'), sandbox);
var content = sandbox.RG.content;

/* ---------------- sight words ---------------- */
var sightByLevel = (content.decodable && content.decodable.sightByLevel) || {};
function sightSet(N) {
  var s = {}, i;
  for (i = 1; i <= N; i++) (sightByLevel[i] || []).forEach(function (w) { s[String(w).toLowerCase()] = 1; });
  return s;
}
var SIGHT = {};
[1, 2, 3, 4, 5].forEach(function (n) { SIGHT[n] = sightSet(n); });

/* ---------------- grapheme inventory ---------------- */
var ONSET1 = ['', 'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'y', 'z', 'qu', 'sh', 'ch', 'th', 'wh'];
var ONSET2 = 'bl cl fl gl pl sl br cr dr fr gr pr tr sc sk sm sn sp st sw tw'.split(' ');
var ONSET4 = 'str spl spr scr squ thr shr'.split(' ');
var CODA1 = ['', 'b', 'd', 'f', 'g', 'k', 'l', 'm', 'n', 'p', 's', 't', 'x', 'z', 'ck', 'sh', 'ch', 'th', 'll', 'ss', 'ff', 'zz', 'gg', 'dd', 'tt'];
var CODA2 = 'nd nt mp st sk ft lk lt lp lf lm nk ng sp ct pt xt'.split(' ');
var CODA3 = ['ld', 'nch', 'nth'];
var CODA4 = ['tch', 'dge'];
var CODA_E2 = ['nce', 'nse', 'lse', 'nge'];            // short vowel + silent e (dance, else, range)
var R_CODA_E = ['e', 'se', 'ce', 'ge'];               // r-controlled + e (care, more, horse, large)
var VCE = /^(b|c|d|f|g|k|l|m|n|p|s|t|v|z|th)e$/;

var IRREGULAR = 'chef whole have give live love move lose come some done none one once gone dove glove shove above put pull push full bush son ton won wash want watch wasp swan swap swat wand wolf word work worm world worse worth sure whose tongue young touch double blood flood door floor poor great break steak bread head dead breath sweat spread thread heavy ready steady tread meant health wealth wear bear pear tear swear'.split(' ');
var IRREG = {}; IRREGULAR.forEach(function (w) { IRREG[w] = 1; });
var LONG_OW = 'snow slow blow grow flow glow show low row crow bowl own blown grown shown throw know mow tow'.split(' ');
var HARD_G = 'get gets gift gifts girl gill gull'.split(' ');
var LONGV = /(ild|ind|old|olt|ost|oll)$/;
var SHORT_EXCEPTION = { wind: 1, winds: 1 };      // wind (the weather) is a short-i word even though it ends in -ind
// spelling-changing -ing/-ed forms whose bare stem would be misread (com + ing is not "coming")
var NEVER = {}; 'coming having giving loving moving losing shoved shovel lemon cover finish river robin visit limit habit comic money honey monkey women wagon wizard'.split(' ').forEach(function (w) { NEVER[w] = 1; });
var OU_BAD = /^(you|your|could|would|should|soup|group|four|pour|tour|touch|young|double|trouble|country|cousin)$/;

function arr() { return Array.prototype.concat.apply([], arguments); }
function onsets(N) { return arr(ONSET1, N >= 2 ? ONSET2 : [], N >= 4 ? ONSET4 : []); }
function closedCodas(N) { return arr(CODA1, N >= 2 ? CODA2 : [], N >= 3 ? CODA3 : []); }

/* single-syllable parse: onset + nucleus + coda */
function mono(w, N) {
  if (!/^[a-z]+$/.test(w)) return false;
  if (IRREG[w]) return false;
  if (N < 3 && LONGV.test(w) && !SHORT_EXCEPTION[w]) return false;
  var sc = w.match(/c(?=[eiy])/g), sg = w.match(/g(?=[eiy])/g);
  if (N < 3 && sc && !(sc.length === 1 && /ce$/.test(w))) return false;                    // soft c is taught at level 3
  if (N < 3 && sg && HARD_G.indexOf(w) < 0 && !(sg.length === 1 && /ge$/.test(w))) return false;
  var on = onsets(N), codas = closedCodas(N), i, o, rest;
  for (i = 0; i < on.length; i++) {
    o = on[i];
    if (w.slice(0, o.length) !== o) continue;
    rest = w.slice(o.length);
    if (nucleusOK(rest, N, codas, w, o)) return true;
  }
  return false;
}
function codaStartsR(c) { return c.charAt(0) === 'r'; }
function nucleusOK(rest, N, codas, w, onset) {
  var v, coda;
  // short vowels
  if (/^[aeiou]/.test(rest)) {
    v = rest.charAt(0); coda = rest.slice(1);
    var waBlock = v === 'a' && /(^|s)w$|qu$/.test(onset) && ['g', 'x', 'ck', 'm', 'nk', 'ng', 'ff', 'll'].indexOf(coda) < 0; // wa-/qua- say "wo"
    if (!waBlock && coda.length && codas.indexOf(coda) >= 0) return true;                       // closed syllable
    if (N >= 2 && VCE.test(coda)) return true;                                                  // silent e
    if (!waBlock && N >= 2 && CODA_E2.indexOf(coda) >= 0) return true;
    if (!waBlock && N >= 4 && CODA4.indexOf(coda) >= 0) return true;
    if (N >= 4 && coda === 're' && /^[aio]$/.test(v)) return true;                              // care, more, fire
  }
  var teams = [];
  if (N >= 3) teams.push('ai', 'ay', 'ee', 'ea', 'oa', 'ow', 'oo');
  if (N >= 4) teams.push('oi', 'oy', 'ou', 'aw', 'au', 'ew', 'igh', 'ar', 'or', 'er', 'ir', 'ur');
  for (var t = 0; t < teams.length; t++) {
    var tm = teams[t];
    if (rest.slice(0, tm.length) !== tm) continue;
    coda = rest.slice(tm.length);
    if (tm === 'ow') {
      if (N < 4 && LONG_OW.indexOf(w) < 0) continue;
    }
    if (tm === 'ay' || tm === 'oy' || tm === 'ew') { if (coda === '') return true; continue; }
    if (tm === 'igh') { if (coda === '' || coda === 't') return true; continue; }
    if (tm === 'ou' && OU_BAD.test(w)) continue;
    if (/^(ar|or|er|ir|ur)$/.test(tm)) {
      if (tm === 'ar' && /w$/.test(onset)) continue;                                           // war, warm
      if (tm === 'or' && onset === 'w') continue;                                              // work, worry, word
      if (coda === 'e' && (tm === 'ur' || tm === 'er')) continue;                              // no "ure"/"ere" (sure, were)
      if (coda === '' || R_CODA_E.indexOf(coda) >= 0) return true;
      if (codas.indexOf(coda) >= 0 || arr(CODA4).indexOf(coda) >= 0) return true;
      if (/^(r)?(se)$/.test(coda)) return true;
      continue;
    }
    if (coda === '') { if (tm !== 'ai') return true; continue; }
    if (codas.indexOf(coda) >= 0 && !codaStartsR(coda)) return true;
    if (tm === 'ou' || tm === 'oi') { if (coda === 'se' || coda === 'ce' || coda === 'nce' || coda === 'ge') return true; }
    if (tm === 'ai' && coda === 'se') return true;
  }
  return false;
}

/* ---------------- chunks (level 5 two/three-syllable words) ---------------- */
var AFFIX_FIRST = /^(un|re|pre|dis|en)$/, AFFIX_LAST = /^(ing|ed|er|est|ly|ful|less|ness)$/;
var DIGRAPH_PAIRS = /^(sh|ch|th|ph|wh|ck|ng|gh|qu)$/, VOWELS = /[aeiou]/;
function cutOK(w, a) {                          // never saw through a digraph or a vowel team
  var pair = w.charAt(a - 1) + w.charAt(a);
  if (DIGRAPH_PAIRS.test(pair)) return false;
  if (VOWELS.test(pair.charAt(0)) && VOWELS.test(pair.charAt(1))) return false;
  return true;
}
function chunkOK(c, first, last, nextStart) {
  if (c.length < 2) return false;
  if (c.length >= 3 && SIGHT[5][c]) return true;
  if (first && AFFIX_FIRST.test(c)) return true;
  if (last && AFFIX_LAST.test(c)) return true;
  if (mono(c, 4)) return true;
  if (!last && nextStart && !VOWELS.test(nextStart)) {
    var m = c.match(/^(.*?)([aeiou])$/);                                                       // open syllable: ro, ti, mu
    if (m && onsets(4).indexOf(m[1]) >= 0 && !/^(w|qu|squ)$/.test(m[1])) return true;
  }
  if (last && /^[bcdfgkpstz]le$/.test(c)) return true;                                          // consonant-le
  if (last) { var y = c.match(/^(.*?)y$/); if (y && y[1] && onsets(4).indexOf(y[1]) >= 0) return true; }  // funny, happy
  return false;
}
function chunks(w) {
  var n = w.length, a, b;
  for (a = 2; a <= n - 2; a++) {
    if (!cutOK(w, a)) continue;
    var c1 = w.slice(0, a), r1 = w.slice(a);
    if (chunkOK(c1, true, false, r1.charAt(0))) {
      if (chunkOK(r1, false, true)) return true;
      for (b = 2; b <= r1.length - 2; b++) {
        if (!cutOK(r1, b)) continue;
        if (chunkOK(r1.slice(0, b), false, false, r1.charAt(b)) && chunkOK(r1.slice(b), false, true)) return true;
      }
    }
  }
  return false;
}
var SILENT = /isl|^kn|^wr|^gn|mb$|mbs$|ough|tion|sion|ph|^ps|^ho(ur|nest)/;           // silent-letter spellings are never decodable
function base(w, N) { if (SILENT.test(w)) return false; return mono(w, N) || (N >= 5 && chunks(w)); }

/* ---------------- morphology ---------------- */
function stemOK(stem, N, d) { return stem.length >= 2 && (!!SIGHT[N][stem] || decodeMorph(stem, N, d + 1)); }
function decodeMorph(w, N, d) {
  d = d || 0;
  if (NEVER[w]) return false;
  if (base(w, N)) return true;
  if (d > 2) return false;
  var m = w.match(/^(.+)('s|'m|'ll|n't)$/);
  if (m) {
    var st = m[1], suf = m[2];
    if (suf === "n't") { st = st === 'ca' ? 'can' : st; if (N >= 3 && stemOK(st, N, d)) return true; }
    else if (suf === "'ll") { if (N >= 3 && stemOK(st, N, d)) return true; }
    else if (N >= 2 && (SIGHT[N][st] || stemOK(st, N, d))) return true;
    return false;
  }
  if (N >= 4) {
    var p = w.match(/^(un|re)(.{3,})$/);
    if (p && stemOK(p[2], N, d)) return true;
  }
  var s;
  if (N >= 1 && /s$/.test(w) && !/ss$/.test(w)) { s = w.slice(0, -1); if (stemOK(s, N, d)) return true; }
  if (N >= 2 && /es$/.test(w)) { s = w.slice(0, -2); if (/(s|x|z|sh|ch)$/.test(s) && stemOK(s, N, d)) return true; }
  if (N >= 3 && /ed$/.test(w)) { s = w.slice(0, -2); if (stemOK(s, N, d)) return true; }
  if (N >= 3 && /[^e]ed$|ed$/.test(w) && /ed$/.test(w)) { s = w.slice(0, -1); if (/e$/.test(s) && stemOK(s, N, d)) return true; }
  if (N >= 3 && /ing$/.test(w)) { s = w.slice(0, -3); if (stemOK(s, N, d)) return true; }
  if (N >= 4) {
    var ends = [['ly', 2], ['ful', 3], ['less', 4], ['ness', 4], ['est', 3], ['er', 2]];
    for (var i = 0; i < ends.length; i++) if (w.slice(-ends[i][1]) === ends[i][0]) { s = w.slice(0, -ends[i][1]); if (stemOK(s, N, d)) return true; }
  }
  return false;
}
function wordOK(w, N, names) {
  w = w.toLowerCase();
  if (names && names[w]) return true;
  if (SIGHT[N][w]) return true;
  return decodeMorph(w, N, 0);
}
function tokens(text) { return (String(text).toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || []); }

/* ---------------- run ---------------- */
if (process.argv[2] === '--word') {
  var ww = process.argv[3], lv = +process.argv[4] || 1;
  console.log(ww, 'level', lv, wordOK(ww, lv, {}) ? 'OK' : 'NOT decodable');
  process.exit(0);
}

var problems = [], checked = 0, checkedWords = 0;
function nameSet(list) { var o = {}; (list || []).forEach(function (n) { tokens(n).forEach(function (t) { o[t] = 1; }); }); return o; }
function checkText(label, text, N, names) {
  checked++;
  tokens(text).forEach(function (t) {
    checkedWords++;
    if (!wordOK(t, N, names)) problems.push(label + ' [L' + N + '] "' + t + '"  in: ' + String(text).slice(0, 70));
  });
}
function checkQuestions(label, qs, N, names) {
  (qs || []).forEach(function (q, i) {
    checkText(label + ' q' + (i + 1), q.q, N, names);
    (q.options || []).forEach(function (o) { checkText(label + ' q' + (i + 1) + ' option', o, N, names); });
    if (q.options && q.options.indexOf(q.answer) < 0) problems.push(label + ' q' + (i + 1) + ': answer is not one of the options');
    if (!q.type) problems.push(label + ' q' + (i + 1) + ': missing type');
  });
}
var counts = { sentences: {}, stories: {}, phonics: {} };
(content.sentences || []).forEach(function (s, i) {
  counts.sentences[s.level] = (counts.sentences[s.level] || 0) + 1;
  checkText('sentence #' + i, s.text, s.level, nameSet(s.names));
  if (!s.emoji || !s.distractors || s.distractors.length < 2) problems.push('sentence #' + i + ': needs emoji and 2 distractors');
});
(content.stories || []).forEach(function (st) {
  counts.stories[st.level] = (counts.stories[st.level] || 0) + 1;
  var nm = nameSet(st.names), words = 0;
  checkText('story "' + st.title + '" title', st.title, st.level, nm);
  st.pages.forEach(function (p, i) { checkText('story "' + st.title + '" p' + (i + 1), p.text, st.level, nm); words += tokens(p.text).length; });
  checkQuestions('story "' + st.title + '"', st.questions, st.level, nm);
  st.words = words;
});
var serial = content.serial;
if (serial) (serial.chapters || []).forEach(function (ch, ci) {
  var nm = nameSet((serial.names || []).concat(ch.names || [])), words = 0, label = 'serial ch' + (ci + 1);
  checkText(label + ' title', ch.title, ch.level, nm);
  ch.pages.forEach(function (p, i) { checkText(label + ' p' + (i + 1), p.text, ch.level, nm); words += tokens(p.text).length; });
  checkQuestions(label, ch.questions, ch.level, nm);
  // "Your line" for the listen-along chapter book: one per page, 3-7 words, decodable at LEVEL 2
  var kl = ch.kidLines || [];
  if (kl.length !== ch.pages.length) problems.push(label + ': kidLines needs one line per page (' + kl.length + ' lines, ' + ch.pages.length + ' pages)');
  kl.forEach(function (ln, i) {
    var wc = tokens(ln).length;
    if (wc < 3 || wc > 7) problems.push(label + ' kidLine ' + (i + 1) + ': needs 3-7 words, has ' + wc + ' ("' + ln + '")');
    checkText(label + ' kidLine ' + (i + 1), ln, 2, nm);
  });
  ch.words = words;
});
var pw = content.phonicsWords || {}, inventory = content.decodable && content.decodable.tilesByLevel;
Object.keys(pw).forEach(function (L) {
  var N = +L;
  counts.phonics[L] = pw[L].length;
  pw[L].forEach(function (it) {
    if (it.tiles.join('') !== it.word) problems.push('phonics L' + L + ' "' + it.word + '": tiles do not spell the word');
    if (!content.emoji[it.word] || content.emoji[it.word] !== it.emoji) problems.push('phonics L' + L + ' "' + it.word + '": emoji missing or mismatched in RG.content.emoji');
    if (N < 5 && !wordOK(it.word, N, {})) problems.push('phonics L' + L + ' "' + it.word + '" is not decodable at level ' + L);
    if (N === 5 && !wordOK(it.word, 5, {})) problems.push('phonics L5 "' + it.word + '" is not decodable even as chunks');
    if (N > 1 && N < 5 && wordOK(it.word, N - 1, {})) problems.push('phonics L' + L + ' "' + it.word + '" belongs at a lower level');
  });
});
(content.digraphWords || []).forEach(function (d) {
  if (d.level && !wordOK(d.word, d.level, {})) problems.push('digraphWords "' + d.word + '" not decodable at its level ' + d.level);
});
['letters'].forEach(function () {});
var sw = content.sightWords || {};
for (var n = 1; n <= 5; n++) if (!sw['level' + n] || sw['level' + n].length < 20) problems.push('sightWords.level' + n + ' missing or too short');
Object.keys(content.rhymeFamilies || {}).forEach(function (k) {
  content.rhymeFamilies[k].forEach(function (w) { if (!content.emoji[w]) problems.push('rhyme word "' + w + '" has no emoji'); });
});

console.log('Checked', checked, 'texts,', checkedWords, 'words.');
console.log('sentences per level:', JSON.stringify(counts.sentences), ' stories per level:', JSON.stringify(counts.stories), ' phonicsWords:', JSON.stringify(counts.phonics));
(content.stories || []).forEach(function (s) { console.log('  story L' + s.level + ' "' + s.title + '" ' + s.words + ' words'); });
if (serial) serial.chapters.forEach(function (c, i) { console.log('  serial ch' + (i + 1) + ' L' + c.level + ' "' + c.title + '" ' + c.words + ' words'); });
if (problems.length) {
  console.log('\n' + problems.length + ' VIOLATION(S):');
  problems.forEach(function (p) { console.log('  - ' + p); });
  process.exit(1);
}
console.log('PASS: all content is decodable at its level.');
