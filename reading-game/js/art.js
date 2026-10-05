/* Treasure Island Readers: hand-made SVG art (ART-5).
 * Classic script. Loaded after core.js and before the games.
 *
 * API (every function returns an HTML string: an inline <svg>, or an <img> if window.RG_IMAGES overrides it)
 *   RG.art.ship(id, {sail, hull, flag, pet, sailMark})
 *   RG.art.island(gameId)       RG.art.building(id, {avatar})   RG.art.badge(rankIndex 0..10)
 *   RG.art.chest(open)          RG.art.coin()                   RG.art.scene()
 *   RG.art.has(kind, id)        RG.art.waterline(kind, id)   RG.art.WATERLINE                RG.art.ids (lists of every id)
 *
 * SHIP WATERLINE: every ship viewBox is 240 x 200 and the hull waterline sits at y = 150,
 * so RG.art.WATERLINE = 0.75 (fraction of the height from the top). Hulls reach down to about
 * y = 168 and the keel is meant to be hidden by the water. To seat a ship, place its box so that
 * the box's top + 0.75 * height lines up with the water surface (e.g. bottom: -25% of the box
 * height sinks it correctly), the same for all ten ships.
 *
 * Ship opts use the same values as the shop cosmetics: sail = '#hex' or 'rainbow', hull = '#hex',
 * flag = an emoji (shop flag) or a '#hex' pennant colour, pet = an emoji, sailMark = an emoji on the main sail.
 *
 * Raster override: if window.RG_IMAGES (from the optional img/manifest.js; value is a path or {src, waterline}) has a key such as
 * 'ship:galleon', 'island:word-builder', 'building:library', 'badge:6', 'chest:open', 'chest:closed',
 * 'coin' or 'scene', the call returns <img src=... alt=""> instead of the SVG.
 *
 * Style: flat fills, 3px #14365a rounded outlines, one soft highlight per major shape, no text.
 */
(function () {
  'use strict';
  var RG = window.RG = window.RG || {};

  var INK = '#14365a', WOOD = '#b9783a', WOOD_D = '#7a4a1e', SAND = '#ffe3a3', SAND_D = '#f2c46b',
      GREEN = '#2fbf5b', GREEN_D = '#1f9544', SUN = '#ffc93c', GOLD = '#ffc93c', GOLD_D = '#e0a21a',
      RED = '#ff5e5e', SKY = '#9be3ff', SEA = '#2aa7e8', CREAM = '#fff6df';
  var WATERLINE_Y = 150, SHIP_W = 240, SHIP_H = 200;
  var uidN = 0;
  function uid() { return 'ra' + (++uidN); }

  /* ---------- tiny drawing helpers (strings) ---------- */
  function P(d, f, x) { return '<path d="' + d + '" fill="' + (f || 'none') + '"' + (x || '') + '/>'; }
  function R(x, y, w, h, f, rx, ex) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (rx || 0) + '" fill="' + f + '"' + (ex || '') + '/>'; }
  function C(x, y, r, f, ex) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '"' + (ex || '') + '/>'; }
  function E(x, y, rx, ry, f, ex) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '"' + (ex || '') + '/>'; }
  function L(d, col, w) { return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + (w || 3) + '"/>'; }
  function HL(d, w) { return '<path d="' + d + '" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="' + (w || 4) + '" stroke-linecap="round"/>'; }
  function T(x, y, size, ch) { return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" text-anchor="middle" stroke="none">' + ch + '</text>'; }
  function G(tf, inner) { return '<g transform="' + tf + '">' + inner + '</g>'; }
  function NS(inner) { return inner; }
  function wrap(vb, defs, inner) {
    return '<svg class="rg-art" viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
      (defs ? '<defs>' + defs + '</defs>' : '') +
      '<g stroke="' + INK + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">' + inner + '</g></svg>';
  }
  function img(src) {
    return '<img class="rg-art" src="' + String(src).replace(/"/g, '&quot;') + '" alt="" draggable="false" style="display:block;width:100%;height:100%;object-fit:contain">';
  }
  function star(cx, cy, r, f, ex) {
    var d = '', i, a, rr;
    for (i = 0; i < 10; i++) {
      a = -Math.PI / 2 + i * Math.PI / 5; rr = i % 2 ? r * 0.45 : r;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1);
    }
    return P(d + 'Z', f, ex);
  }
  function spark(x, y, s) { return P('M' + x + ' ' + (y - s) + 'Q' + x + ' ' + y + ' ' + (x + s) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y + s) + 'Q' + x + ' ' + y + ' ' + (x - s) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y - s) + 'Z', '#fff', ' stroke-width="1.5"'); }

  /* ================================================================ SHIPS */
  var SHIPS = ['little-sailboat', 'fishing-boat', 'sloop', 'tugboat', 'schooner', 'submarine', 'brigantine', 'galleon', 'royal-flagship', 'golden-legend'];

  // generic hull (bow to the right, bow higher than stern). kb = keel y.
  function hull(xl, xr, dl, dr, kb, col) {
    return P('M' + xl + ' ' + dl + 'L' + xr + ' ' + dr + 'C' + (xr - 2) + ' ' + (dr + 30) + ' ' + (xr - 26) + ' ' + kb + ' ' + (xr - 42) + ' ' + kb +
      'H' + (xl + 34) + 'C' + (xl + 14) + ' ' + kb + ' ' + (xl + 4) + ' ' + (dl + 26) + ' ' + xl + ' ' + dl + 'Z', col, ' stroke-width="4"');
  }
  function hullHL(xl, xr, dl, dr) { return HL('M' + (xl + 18) + ' ' + (dl + 10) + 'L' + (xr - 22) + ' ' + (dr + 10)); }
  function porthole(x, y, r) { return C(x, y, r || 5, '#bfeaff', ' stroke-width="2.5"'); }
  function mast(x, y1, y2, w) { return R(x - (w || 3), y1, (w || 3) * 2, y2 - y1, WOOD_D, 2, ' stroke-width="2.5"'); }

  function shipCtx(o) {
    var ctx = { defs: '', sail: null, jib: null, mark: o.sailMark || '' };
    if (o.sail) {
      var f = o.sail;
      if (f === 'rainbow') {
        var id = uid();
        ctx.defs = '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5e7e"/><stop offset=".25" stop-color="#ffc93c"/><stop offset=".5" stop-color="#34c759"/><stop offset=".75" stop-color="#4cc3ff"/><stop offset="1" stop-color="#a77bff"/></linearGradient>';
        f = 'url(#' + id + ')';
      }
      ctx.sail = ctx.jib = f;
    }
    return ctx;
  }
  function isColor(s) { return /^(#|rgb|hsl)/i.test(s || ''); }
  // pennant or emoji flag on a pole whose tip is (x, y)
  function flagAt(o, x, y, big) {
    var s = big ? 1.3 : 1;
    if (o.flag && !isColor(o.flag)) return T(x + 14 * s, y + 20 * s, 24 * s, o.flag);
    var col = o.flag || RED;
    return P('M' + x + ' ' + y + 'L' + (x + 26 * s) + ' ' + (y + 7 * s) + 'L' + x + ' ' + (y + 15 * s) + 'Z', col, ' stroke-width="2.5"');
  }
  function petAt(o, x, y, size) {
    if (!o.pet) return '';
    if (o.pet === '🐬') return T(214, 176, 38, o.pet); // dolphin swims at the bow
    return T(x, y, size || 30, o.pet);
  }
  function mk(ctx, x, y, s) { return ctx.mark ? T(x, y, s || 26, ctx.mark) : ''; }

  function shipSvg(id, o) {
    var c = shipCtx(o), s = '', hc;
    var sm = c.sail || '#ffffff', sj = c.jib || '#ffe9a8';
    switch (id) {
      case 'little-sailboat':
        hc = o.hull || WOOD;
        s = mast(130, 30, 120) +
          P('M124 38L124 112L58 112Z', sm) + P('M136 50L136 110L192 110Z', sj) + mk(c, 100, 102, 22) +
          flagAt(o, 130, 22) + hull(38, 206, 122, 114, 166, hc) + hullHL(38, 206, 122, 114) +
          porthole(96, 140) + porthole(128, 140) + petAt(o, 168, 114, 28);
        break;
      case 'fishing-boat':
        hc = o.hull || '#e8553d';
        s = mast(172, 40, 112) + L('M172 48L214 100', INK, 2.5) + L('M172 48C196 60 204 84 206 100', '#ff9a3c', 2.5) +
          R(70, 78, 66, 40, '#ffffff', 5) + R(62, 68, 82, 14, '#ff9a3c', 5) + R(80, 88, 18, 16, '#bfeaff', 3, ' stroke-width="2.5"') + R(106, 88, 18, 16, '#bfeaff', 3, ' stroke-width="2.5"') +
          flagAt(o, 172, 32) + hull(34, 210, 120, 110, 166, hc) + R(34, 120, 0.1, 0.1, 'none') +
          P('M42 130L204 126', '', ' stroke="#ffffff" stroke-width="6" fill="none"') + hullHL(34, 210, 120, 110) +
          C(152, 100, 9, '#ffffff', ' stroke-width="2.5"') + C(152, 100, 3.5, RED, ' stroke-width="0"') + petAt(o, 190, 112, 26);
        break;
      case 'sloop':
        hc = o.hull || WOOD;
        s = mast(124, 14, 120) + P('M118 20C98 52 88 82 50 112L118 112Z', sm) + P('M132 30L204 110L132 110Z', sj) + mk(c, 92, 98, 22) +
          flagAt(o, 124, 8) + hull(32, 208, 120, 110, 167, hc) + hullHL(32, 208, 120, 110) +
          P('M36 128L206 120', '', ' stroke="' + GOLD + '" stroke-width="5" fill="none"') + porthole(92, 142) + porthole(124, 142) + porthole(156, 142) + petAt(o, 168, 112, 28);
        break;
      case 'tugboat':
        hc = o.hull || '#d9423b';
        s = C(84, 28, 10, '#e8f4fb', ' stroke-width="2.5"') + C(70, 14, 7, '#e8f4fb', ' stroke-width="2.5"') +
          R(86, 44, 24, 38, '#2b3340', 4) + R(86, 56, 24, 9, '#ff5e5e', 0) +
          R(76, 78, 90, 42, '#ffffff', 6) + R(112, 58, 44, 22, '#ffffff', 5) + R(66, 70, 108, 10, '#2b3340', 5) +
          R(122, 64, 24, 11, '#bfeaff', 3, ' stroke-width="2.5"') + R(84, 90, 18, 14, '#bfeaff', 3, ' stroke-width="2.5"') + R(112, 90, 18, 14, '#bfeaff', 3, ' stroke-width="2.5"') + R(140, 90, 18, 14, '#bfeaff', 3, ' stroke-width="2.5"') +
          mast(134, 36, 60, 2.5) + flagAt(o, 134, 30) +
          hull(34, 210, 118, 112, 166, hc) + R(40, 118, 168, 9, '#2b3340', 3, ' stroke-width="2.5"') + hullHL(34, 210, 118, 112) +
          C(186, 138, 9, '#ffffff', ' stroke-width="3"') + C(186, 138, 3.5, RED, ' stroke-width="0"') + C(60, 142, 8, '#3a3f4a', ' stroke-width="2.5"') + C(60, 142, 3, '#8a93a0', ' stroke-width="0"') + petAt(o, 98, 78, 24);
        break;
      case 'schooner':
        hc = o.hull || '#2f9a9a';
        s = mast(92, 24, 120) + mast(152, 36, 120) +
          P('M86 28L86 112L38 112Z', sm) + P('M146 42L146 112L98 112Z', sm) + P('M158 36L214 108L158 108Z', sj) + mk(c, 118, 100, 20) +
          flagAt(o, 92, 12) + flagAt(o, 152, 24) + hull(30, 212, 124, 108, 167, hc) + hullHL(30, 212, 124, 108) +
          P('M34 130L208 114', '', ' stroke="' + GOLD + '" stroke-width="5" fill="none"') + porthole(80, 144) + porthole(110, 144) + porthole(140, 144) + porthole(170, 141) + petAt(o, 190, 106, 26);
        break;
      case 'submarine':
        hc = o.hull || '#ffd23c';
        s = R(100, 104, 44, 34, hc, 10) + L('M124 104V68H146', INK, 6) + L('M124 104V68H146', '#8a93a0', 2.5) + R(146, 63, 8, 11, '#bfeaff', 2, ' stroke-width="2.5"') +
          P('M40 138L22 112L48 108Z', hc) + E(28, 148, 8, 18, '#e8f4fb', ' stroke-width="2.5"') + E(120, 148, 92, 32, hc, ' stroke-width="4"') +
          HL('M54 134Q120 112 186 134', 5) + C(80, 150, 10, '#bfeaff', ' stroke-width="3"') + C(118, 150, 10, '#bfeaff', ' stroke-width="3"') + C(156, 150, 10, '#bfeaff', ' stroke-width="3"') +
          HL('M76 147L80 144', 3) + P('M104 112H144', '', ' stroke="#ff9a3c" stroke-width="5" fill="none"') +
          flagAt(o, 124, 52, false).replace(/<path/, '<path') + petAt(o, 78, 108, 26);
        break;
      case 'brigantine':
        hc = o.hull || '#7a4a2a';
        s = mast(92, 28, 118) + mast(150, 16, 118) +
          P('M86 34L50 50L40 110L86 110Z', sm) + P('M128 30Q150 40 172 30L168 70Q150 78 132 70Z', sm) + P('M126 76Q150 84 176 76L180 110Q150 118 122 110Z', sm) + P('M174 56L212 108L174 108Z', sj) + mk(c, 150, 100, 20) +
          flagAt(o, 150, 4) + flagAt(o, 92, 16) + hull(30, 214, 122, 108, 167, hc) + hullHL(30, 214, 122, 108) +
          P('M34 128L210 114', '', ' stroke="' + GOLD + '" stroke-width="5" fill="none"') + porthole(70, 142) + porthole(100, 142) + porthole(130, 142) + porthole(160, 140) + petAt(o, 196, 106, 24);
        break;
      case 'galleon': case 'royal-flagship': case 'golden-legend':
        s = galleon(id, o, c);
        break;
    }
    return wrap('0 0 ' + SHIP_W + ' ' + SHIP_H, c.defs, s);
  }

  function galleon(id, o, c) {
    var royal = id === 'royal-flagship', legend = id === 'golden-legend';
    var hc = o.hull || (legend ? '#ffc93c' : royal ? '#f6f1e6' : '#8a5a2b');
    var trim = (royal || legend) ? GOLD : '#d6a24a';
    var sm = c.sail || (legend ? '#ffe27a' : royal ? '#ffffff' : CREAM);
    var sj = c.jib || sm;
    var s = '';
    if (legend) s += C(120, 92, 74, '#fff3b0', ' stroke="none" opacity=".7"') + C(120, 92, 54, '#ffe27a', ' stroke="none" opacity=".7"');
    s += mast(66, 52, 100, 2.5) + mast(118, 14, 116) + mast(170, 30, 106) +
      P('M60 56L66 54L66 98Q40 96 30 90Q52 82 60 56Z', sj) +
      P('M96 20Q118 30 140 20L142 62Q118 72 94 62Z', sm) + P('M92 66Q118 76 144 66L148 106Q118 116 88 106Z', sm) +
      P('M148 36Q170 46 192 36L192 70Q170 78 148 70Z', sm) + P('M150 74Q170 82 192 74L196 100Q170 108 146 100Z', sm);
    if (royal || legend) {
      s += star(118, 90, 11, legend ? '#ff9a3c' : '#4a7be0', ' stroke-width="2.5"') + star(118, 42, 8, legend ? '#ff9a3c' : '#4a7be0', ' stroke-width="2"');
      s += P('M108 14L111 4L114 10L118 2L122 10L125 4L128 14Z', GOLD, ' stroke-width="2.5"');
    }
    if (c.mark) s += T(118, 96, 22, c.mark);
    s += flagAt(o, 118, royal || legend ? -2 : 0).replace(/^/, '') + flagAt(o, 170, 14) + flagAt(o, 66, 38);
    // hull with stern castle and forecastle
    s += P('M26 94H84V116H184L190 104H214Q212 140 190 160Q180 168 166 168H72Q48 168 34 140Q26 120 26 94Z', hc, ' stroke-width="4"');
    s += P('M28 104H214', '', ' stroke="' + trim + '" stroke-width="5" fill="none"') +
      P('M30 126C60 132 150 132 206 124', '', ' stroke="' + trim + '" stroke-width="5" fill="none"');
    s += R(36, 106, 10, 9, '#ffe27a', 2, ' stroke-width="2"') + R(54, 106, 10, 9, '#ffe27a', 2, ' stroke-width="2"') +
      porthole(96, 140, 5) + porthole(126, 140, 5) + porthole(156, 140, 5) + porthole(60, 142, 5) + HL('M44 100H78', 3) + HL('M96 124H170', 3);
    if (legend || royal) s += star(46, 150, 6, GOLD, ' stroke-width="2"') + star(190, 140, 6, GOLD, ' stroke-width="2"');
    s += petAt(o, 62, 90, 24);
    s = G('translate(12 15) scale(.9)', s);
    if (legend) s += spark(24, 36, 9) + spark(216, 44, 8) + spark(30, 120, 6) + spark(206, 14, 7);
    return s;
  }

  /* ================================================================ ISLANDS */
  var ISLANDS = ['letter-pop', 'sound-hunt', 'letter-trace', 'rhyme-boat', 'word-builder', 'blend-cannon', 'syllable-saw', 'sight-fishing', 'sentence-match', 'story-cove', 'reading-quest', 'captains-quiz'];

  function islandBase(big) {
    var s = P('M6 142Q8 118 50 114Q100 106 152 114Q194 118 194 142Q194 160 170 160H30Q6 160 6 142Z', SAND, ' stroke-width="4"') +
      P('M20 148Q50 156 100 154Q160 156 182 146', '', ' stroke="' + SAND_D + '" stroke-width="5" fill="none"') +
      P('M22 124Q28 108 62 108Q100 100 140 108Q174 108 178 124Q140 134 100 131Q60 134 22 124Z', GREEN) +
      HL('M38 118Q60 112 82 113', 3);
    if (big) s = P('M0 142Q2 116 40 112Q100 100 160 112Q198 116 200 142Q200 160 176 162H24Q0 162 0 142Z', SAND, ' stroke-width="4"') + P('M14 150Q50 158 100 156Q160 158 188 148', '', ' stroke="' + SAND_D + '" stroke-width="5" fill="none"');
    return s;
  }
  function palm(x, y, s) { // trunk base at (x,y); height ~ 62*s
    var t = 'translate(' + x + ' ' + y + ') scale(' + (s || 1) + ')';
    return G(t, P('M0 0Q-6 -28 4 -58', '', ' stroke="' + INK + '" stroke-width="11"') + P('M0 0Q-6 -28 4 -58', '', ' stroke="' + WOOD + '" stroke-width="5"') +
      P('M4 -58Q-12 -76 -34 -62Q-16 -68 4 -58Z', GREEN) + P('M4 -58Q20 -80 42 -68Q22 -68 4 -58Z', GREEN) +
      P('M4 -58Q-4 -84 -22 -86Q-8 -76 4 -58Z', GREEN_D) + P('M4 -58Q14 -80 32 -86Q20 -74 4 -58Z', GREEN_D) + P('M4 -58Q-24 -50 -34 -36Q-12 -44 4 -58Z', GREEN) + P('M4 -58Q30 -50 38 -36Q16 -44 4 -58Z', GREEN) +
      C(0, -54, 4.5, '#8a5a2b', ' stroke-width="2"') + C(9, -53, 4.5, '#8a5a2b', ' stroke-width="2"'));
  }
  function cloudPuff(x, y, r) { return C(x, y, r, '#fff', ' stroke="none"'); }

  function landmark(id) {
    var s = '';
    switch (id) {
      case 'letter-pop':
        s = L('M72 108L54 64M72 108L88 52M72 108L120 68', INK, 2) +
          E(54, 52, 17, 21, '#ff5e7e') + E(88, 40, 17, 21, '#ffc93c') + E(120, 56, 17, 21, '#4cc3ff') +
          E(48, 44, 4, 7, '#fff', ' stroke="none" opacity=".7"') + E(82, 32, 4, 7, '#fff', ' stroke="none" opacity=".7"') + E(114, 48, 4, 7, '#fff', ' stroke="none" opacity=".7"') +
          star(88, 80, 0.1, 'none') + C(72, 108, 4, '#ff9a3c', ' stroke-width="2"');
        break;
      case 'sound-hunt':
        s = P('M96 82L122 112', '', ' stroke="' + INK + '" stroke-width="14"') + P('M96 82L122 112', '', ' stroke="' + WOOD + '" stroke-width="8"') +
          C(78, 62, 28, '#bfeaff', ' stroke-width="5"') + C(78, 62, 28, 'none', ' stroke="' + SUN + '" stroke-width="2" opacity=".0"') +
          L('M66 62Q70 52 78 62T90 62', '#2a8fd0', 3) + L('M64 72Q74 64 80 72T92 72', '#2a8fd0', 2.5) + HL('M62 48Q68 40 78 38', 4);
        break;
      case 'letter-trace':
        s = G('rotate(-14 84 112)', R(70, 56, 28, 50, '#ffd23c', 2) + P('M70 106L98 106L84 124Z', '#f2c46b') + P('M80 116L88 116L84 124Z', '#3a3f4a', ' stroke-width="1.5"') +
          R(70, 44, 28, 14, '#ff8fb0', 4) + R(70, 54, 28, 6, '#c8d2dc', 0, ' stroke-width="2.5"') + HL('M76 62V100', 4)) +
          P('M112 100Q122 70 134 96T150 82', '', ' stroke="#ff5e5e" stroke-width="3" stroke-dasharray="1 7" fill="none"');
        break;
      case 'rhyme-boat':
        s = P('M52 98H118L106 118H64Z', '#e8553d', ' stroke-width="3"') + R(84, 66, 4, 34, WOOD_D, 1) + P('M90 68L90 96L116 96Z', '#fff') + P('M82 74L82 96L62 96Z', '#ffe9a8') +
          HL('M58 104H110', 3) + P('M104 20H152Q160 20 160 28V44Q160 52 152 52H128L116 62L118 52H104Q96 52 96 44V28Q96 20 104 20Z', '#fff') +
          star(112, 36, 8, '#ff5e7e', ' stroke-width="2"') + star(142, 36, 8, '#4cc3ff', ' stroke-width="2"');
        break;
      case 'word-builder':
        s = P('M58 112V54H66V46H78V54H90V46H102V54H110V112Z', '#e2674a') +
          L('M58 70H110M58 86H110M58 100H110M78 54V70M96 70V86M70 86V100M92 100V112', '#a8442c', 2) + R(76, 90, 18, 22, '#6a3a1e', 9, ' stroke-width="2.5"') +
          HL('M64 60V104', 3) + mast(84, 20, 46, 1.5) + P('M85 20L104 26L85 32Z', '#ffc93c', ' stroke-width="2"') + R(118, 98, 20, 14, '#4cc3ff', 3, ' stroke-width="2.5"') + R(124, 88, 18, 12, '#ffc93c', 3, ' stroke-width="2.5"');
        break;
      case 'blend-cannon':
        s = G('rotate(-24 76 92)', R(50, 78, 70, 26, '#4a5568', 10)) + E(46, 92, 0.1, 0.1, 'none') +
          G('rotate(-24 76 92)', R(104, 74, 16, 34, '#7b879a', 6, ' stroke-width="3"')) + HL('M58 82L100 70', 4) +
          C(70, 108, 20, WOOD, ' stroke-width="4"') + C(70, 108, 6, WOOD_D, ' stroke-width="2.5"') + L('M70 90V126M52 108H88', WOOD_D, 2) +
          C(128, 108, 8, '#3a3f4a', ' stroke-width="2.5"') + C(142, 108, 8, '#3a3f4a', ' stroke-width="2.5"') + C(135, 96, 8, '#3a3f4a', ' stroke-width="2.5"') +
          star(34, 56, 8, '#ffc93c', ' stroke-width="2"') + C(122, 54, 6, '#ff9a3c', ' stroke-width="2.5"');
        break;
      case 'syllable-saw':
        s = R(34, 82, 96, 32, '#a9692e', 8) + E(130, 98, 12, 16, '#e0b070', ' stroke-width="3"') + E(130, 98, 5, 8, 'none', ' stroke="#a9692e" stroke-width="2"') +
          HL('M44 90H116', 4) + P('M64 82L62 56L96 52L98 82Z', '#d6e2ee') + P('M62 82L66 78L70 82L74 78L78 82L82 78L86 82L90 78L94 82L98 82', '', ' stroke-width="2"') +
          P('M60 56Q56 40 70 38L88 36Q98 38 96 52', '', ' stroke="' + INK + '" stroke-width="12" fill="none"') + P('M60 56Q56 40 70 38L88 36Q98 38 96 52', '', ' stroke="#ff9a3c" stroke-width="6" fill="none"');
        break;
      case 'sight-fishing':
        s = P('M48 112L112 34', '', ' stroke="' + INK + '" stroke-width="9"') + P('M48 112L112 34', '', ' stroke="' + WOOD + '" stroke-width="4"') +
          L('M112 34Q130 44 128 78', INK, 2) + E(128, 90, 16, 10, '#ff9a3c') + P('M142 90L154 80L154 100Z', '#ff9a3c') + C(122, 88, 2.6, INK, ' stroke="none"') + HL('M118 84Q128 80 136 84', 3) +
          P('M32 112L36 96H62L66 112Z', '#4cc3ff', ' stroke-width="3"') + P('M40 96Q49 86 58 96', '', ' stroke-width="2.5"') + L('M118 100Q124 108 134 104', '#4cc3ff', 3);
        break;
      case 'sentence-match':
        s = L('M70 112L82 78M112 112L100 78', WOOD_D, 5) + R(48, 38, 80, 62, '#ffc93c', 5, ' stroke-width="4"') + R(58, 48, 60, 42, '#9be3ff', 2, ' stroke-width="2.5"') +
          C(76, 62, 8, '#ffe27a', ' stroke-width="2.5"') + P('M58 90L78 70L92 82L102 74L118 90Z', GREEN, ' stroke-width="2.5"') + HL('M52 44H120', 3);
        break;
      case 'story-cove':
        s = P('M36 104Q36 74 84 82Q132 74 132 104Q84 96 36 104Z', '#e24a5a', ' stroke-width="4"') +
          P('M40 98L40 66Q62 58 84 70L84 100Q62 88 40 98Z', '#fff') + P('M128 98L128 66Q106 58 84 70L84 100Q106 88 128 98Z', '#fff6df') +
          L('M48 74Q62 70 76 78M48 84Q62 80 76 88M92 78Q106 70 120 74M92 88Q106 80 120 84', '#8aa4c0', 2) + spark(110, 40, 9) + spark(60, 46, 6);
        break;
      case 'reading-quest':
        s = G('rotate(-8 84 80)', R(44, 56, 80, 52, '#ffe9a8', 4) + C(44, 82, 10, '#f2c46b') + C(124, 82, 10, '#f2c46b') + L('M56 96Q70 70 84 90T112 70', '#e24a5a', 2.5).replace('fill="none"', 'fill="none" stroke-dasharray="1 6"') +
          L('M104 62L116 74M116 62L104 74', '#e24a5a', 4) + P('M54 68L60 60L66 68Z', GREEN, ' stroke-width="2"')) + HL('M52 66H100', 3);
        break;
      case 'captains-quiz':
        s = R(24, 76, 28, 42, '#c8d2dc', 3) + R(120, 76, 28, 42, '#c8d2dc', 3) + R(46, 90, 80, 28, '#d6dee8', 3) +
          P('M20 76V68H28V72H36V68H44V72H52V76Z', '#c8d2dc', ' stroke-width="2.5"') + P('M116 76V68H124V72H132V68H140V72H148V76Z', '#c8d2dc', ' stroke-width="2.5"') +
          P('M46 90V82H56V86H66V82H76V86H86V82H96V86H106V82H116V90Z', '#d6dee8', ' stroke-width="2.5"') + R(74, 98, 24, 20, '#6a3a1e', 12, ' stroke-width="3"') +
          mast(38, 40, 68, 1.5) + P('M39 40L56 46L39 52Z', RED, ' stroke-width="2"') + mast(134, 40, 68, 1.5) + P('M135 40L152 46L135 52Z', '#4cc3ff', ' stroke-width="2"') +
          HL('M28 82V110', 3) +
          '<g transform="translate(-21.5 -19) scale(1.25)">' + P('M72 74H100L98 56Q86 54 74 56Z', GOLD) + P('M72 60Q60 60 62 68Q64 74 76 72M100 60Q112 60 110 68Q108 74 96 72', '', ' stroke="' + GOLD_D + '" stroke-width="3" fill="none"') +
          R(80, 74, 12, 6, GOLD_D, 1, ' stroke-width="2.5"') + R(74, 80, 24, 6, '#ff9a3c', 2, ' stroke-width="2.5"') + HL('M78 58V68', 3) + '</g>' + spark(118, 34, 8) + spark(52, 40, 6);
        break;
    }
    return s;
  }
  function islandSvg(id) {
    var big = id === 'captains-quiz';
    return wrap('0 0 200 170', '', islandBase(big) + landmark(id) + (big ? palm(176, 126, 0.78) : palm(160, 122, 0.95)) +
      C(24, 134, 3, SAND_D, ' stroke="none"') + C(176, 146, 3, SAND_D, ' stroke="none"'));
  }

  /* ================================================================ BUILDINGS */
  var BUILDINGS = ['dock', 'lighthouse', 'fish-market', 'library', 'shipyard', 'treasure-vault', 'map-room', 'sea-fort', 'golden-statue'];

  function buildingSvg(id, o) {
    var s = '', g = E(80, 148, 66, 8, 'rgba(10,60,110,.22)', ' stroke="none"');
    switch (id) {
      case 'dock':
        s = R(28, 118, 8, 32, WOOD_D, 2) + R(80, 118, 8, 32, WOOD_D, 2) + R(124, 118, 8, 32, WOOD_D, 2) + R(14, 96, 134, 24, WOOD, 4) +
          L('M44 98V118M76 98V118M108 98V118M136 98V118', WOOD_D, 2) + HL('M20 102H142', 3) +
          R(104, 70, 26, 28, '#a9692e', 5) + L('M104 80H130M104 90H130', WOOD_D, 2.5) +
          R(30, 64, 6, 34, WOOD_D, 2) + C(33, 62, 7, '#ffe27a', ' stroke-width="2.5"') + P('M60 96C56 84 70 84 66 96', '', ' stroke="#e8c98a" stroke-width="4" fill="none"') +
          P('M56 96Q62 84 74 88Q80 96 56 96Z', '#e8c98a', ' stroke-width="2.5"');
        break;
      case 'lighthouse':
        s = P('M30 148Q32 128 56 126H104Q128 128 130 148Z', '#8aa0b4') + P('M58 126L66 52H94L102 126Z', '#ffffff') +
          P('M62 98L97 98L99.5 110L60.5 110Z', '#ff5e5e', ' stroke-width="2.5"') + P('M65 66L95 66L93 78L67 78Z', '#ff5e5e', ' stroke-width="2.5"') + P('M60 118L100 118L102 126L58 126Z', '#ff5e5e', ' stroke-width="2.5"') +
          R(60, 46, 40, 8, '#4a5568', 3) + R(68, 26, 24, 22, '#fff3a0', 4) + P('M64 26L80 8L96 26Z', '#e24a5a') + C(80, 6, 3, '#4a5568', ' stroke-width="2"') +
          R(74, 100, 12, 0.1, 'none') + R(72, 128, 16, 20, '#6a3a1e', 8, ' stroke-width="2.5"') + HL('M68 60L62 110', 3) +
          P('M104 36L140 24L140 46Z', '#ffe27a', ' stroke="none" opacity=".7"') + P('M56 36L20 24L20 46Z', '#ffe27a', ' stroke="none" opacity=".7"');
        break;
      case 'fish-market':
        s = R(24, 70, 8, 80, WOOD_D, 2) + R(128, 70, 8, 80, WOOD_D, 2) + R(30, 100, 100, 30, WOOD, 4) + R(24, 130, 112, 18, WOOD_D, 4) + HL('M36 106H122', 3) +
          P('M18 70L30 40H130L142 70Z', '#ffffff') + P('M30 40H50L46 70H18Z M70 40H90L90 70H70Z M110 40H130L142 70H114Z', '#ff5e5e', ' stroke-width="2.5"') +
          P('M18 70Q30 82 42 70Q54 82 66 70Q78 82 90 70Q102 82 114 70Q126 82 142 70', '', ' stroke="' + INK + '" stroke-width="3" fill="none"') +
          E(50, 96, 14, 7, '#4cc3ff') + P('M62 96L72 88L72 104Z', '#4cc3ff', ' stroke-width="2.5"') + E(100, 94, 13, 7, '#ff9a3c') + P('M111 94L120 87L120 101Z', '#ff9a3c', ' stroke-width="2.5"') +
          L('M80 40V54', INK, 2) + E(80, 64, 8, 4, '#4cc3ff', ' stroke-width="2.5"') + P('M72 64L66 58V70Z', '#4cc3ff', ' stroke-width="2"');
        break;
      case 'library':
        s = R(20, 62, 120, 86, '#d98a5a', 4) + P('M14 62L80 22L146 62Z', '#8a5cf5') + HL('M26 58L80 28', 4) +
          C(80, 46, 11, '#fff6df', ' stroke-width="3"') + P('M80 52L80 40M80 40Q74 38 70 40V50Q74 48 80 52Q86 48 90 50V40Q86 38 80 40', '', ' stroke="#e24a5a" stroke-width="2.5" fill="none"') +
          R(28, 74, 28, 36, '#fff6df', 14, ' stroke-width="3"') + R(104, 74, 28, 36, '#fff6df', 14, ' stroke-width="3"') +
          R(33, 86, 5, 20, '#e24a5a', 1, ' stroke-width="1.8"') + R(40, 82, 5, 24, '#ffc93c', 1, ' stroke-width="1.8"') + R(47, 90, 5, 16, '#4cc3ff', 1, ' stroke-width="1.8"') +
          R(109, 90, 5, 16, '#2fbf5b', 1, ' stroke-width="1.8"') + R(116, 84, 5, 22, '#8a5cf5', 1, ' stroke-width="1.8"') + R(123, 88, 5, 18, '#ff9a3c', 1, ' stroke-width="1.8"') +
          R(66, 100, 28, 48, '#6a3a1e', 14, ' stroke-width="3"') + C(88, 126, 2.5, GOLD, ' stroke="none"') + R(14, 142, 132, 8, '#e8dcc6', 3, ' stroke-width="2.5"');
        break;
      case 'shipyard':
        s = P('M10 148L10 126L150 126L150 148Z', '#c9a66b', ' stroke-width="3"') + P('M34 126Q34 96 60 100L118 104Q132 112 138 126Z', WOOD) +
          L('M50 100V126M70 102V126M90 104V126M110 108V126', WOOD_D, 3) + HL('M42 108Q80 106 126 114', 3) +
          L('M24 126V66M24 66H92', '#7a4a1e', 7) + L('M24 126V66M24 66H92', WOOD, 3) + L('M24 80L40 66', WOOD_D, 3) + L('M86 66V84', INK, 2.5) + R(80, 84, 12, 10, '#ffc93c', 2, ' stroke-width="2.5"') +
          R(118, 52, 12, 74, '#e8553d', 2) + R(104, 48, 40, 8, '#e8553d', 2) + L('M104 56V70', INK, 2.5) + C(104, 74, 4, GOLD, ' stroke-width="2"');
        break;
      case 'treasure-vault':
        s = P('M14 148V74Q14 36 80 36Q146 36 146 74V148Z', '#9aa7b6') + HL('M26 78Q28 52 60 46', 4) + R(14, 128, 132, 20, '#8896a6', 3) +
          C(80, 92, 36, '#d6e2ee', ' stroke-width="4"') + C(80, 92, 26, '#8aa0b4', ' stroke-width="3"') + C(80, 92, 8, GOLD, ' stroke-width="3"') +
          L('M80 92V70M80 92V114M80 92H58M80 92H102', GOLD_D, 4) + C(80, 92, 8, GOLD, ' stroke-width="3"') + HL('M60 78Q66 68 76 66', 3) +
          E(34, 140, 14, 6, GOLD, ' stroke-width="2.5"') + E(126, 140, 14, 6, GOLD, ' stroke-width="2.5"') + E(126, 132, 10, 5, '#ffe27a', ' stroke-width="2.5"') + spark(132, 112, 8);
        break;
      case 'map-room':
        s = R(26, 76, 86, 72, '#e8c98a', 4) + P('M18 78L69 28L120 78Z', '#2f9a9a') + HL('M30 70L66 36', 4) +
          R(40, 90, 30, 30, '#bfeaff', 4, ' stroke-width="3"') + L('M40 105H70M55 90V120', INK, 2) + R(80, 100, 22, 48, '#6a3a1e', 11, ' stroke-width="3"') +
          C(124, 112, 24, '#4cc3ff', ' stroke-width="3.5"') + P('M110 100Q122 94 130 104Q124 112 114 112Z M128 118Q140 114 144 122Q136 132 128 126Z', GREEN, ' stroke-width="2"') + HL('M112 100Q118 94 126 94', 3) +
          L('M124 136V148M110 148H138', WOOD_D, 5) + star(69, 52, 8, GOLD, ' stroke-width="2"');
        break;
      case 'sea-fort':
        s = R(14, 84, 40, 64, '#c8d2dc', 3) + R(106, 84, 40, 64, '#c8d2dc', 3) + R(44, 98, 72, 50, '#d6dee8', 3) +
          P('M10 84V72H20V78H28V72H38V78H46V72H56V84Z', '#c8d2dc', ' stroke-width="2.5"') + P('M104 84V72H114V78H122V72H132V78H140V72H150V84Z', '#c8d2dc', ' stroke-width="2.5"') +
          P('M44 98V90H54V94H64V90H74V94H84V90H94V94H104V90H116V98Z', '#d6dee8', ' stroke-width="2.5"') +
          R(66, 112, 28, 36, '#6a3a1e', 14, ' stroke-width="3"') + L('M80 112V148M66 128H94', WOOD_D, 2.5) + R(24, 98, 6, 18, '#4a5568', 3, ' stroke-width="2"') + R(124, 98, 6, 18, '#4a5568', 3, ' stroke-width="2"') +
          mast(80, 52, 96, 1.8) + P('M81 52L106 60L81 68Z', RED, ' stroke-width="2.5"') + C(80, 100, 0.1, 'none') + HL('M20 90V140', 3) +
          C(72, 104, 7, '#3a3f4a', ' stroke-width="2.5"') + C(88, 104, 7, '#3a3f4a', ' stroke-width="2.5"');
        break;
      case 'golden-statue':
        s = R(30, 126, 100, 22, GOLD_D, 4) + R(42, 106, 76, 22, GOLD, 4) + R(54, 90, 52, 18, '#ffe27a', 4) + HL('M38 134H122', 3) + HL('M48 112H110', 3) +
          P('M42 92Q44 70 80 66Q116 70 118 92Z', GOLD) + HL('M52 84Q60 76 74 74', 4) +
          (o && o.avatar ? C(80, 46, 26, '#fff3b0', ' stroke="' + GOLD_D + '" stroke-width="5"') + T(80, 58, 36, o.avatar) : C(80, 46, 24, GOLD) + HL('M68 36Q74 30 84 30', 4)) +
          spark(34, 52, 9) + spark(128, 40, 7) + spark(122, 98, 6);
        break;
    }
    return wrap('0 0 160 160', '', g + s);
  }

  /* ================================================================ BADGES */
  function disc(f, ring) { return C(50, 50, 38, f, ' stroke-width="4"') + C(50, 50, 30, 'none', ' stroke="' + (ring || '#fff') + '" stroke-opacity=".55" stroke-width="2.5"') + HL('M26 38Q32 24 48 20', 4); }
  function ribbon(c) { return P('M34 82L28 100L40 94L46 98L48 84Z', c, ' stroke-width="3"') + P('M66 82L72 100L60 94L54 98L52 84Z', c, ' stroke-width="3"'); }
  function crown(x, y, s, jew) {
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', P('M-22 12L-26 -14L-12 -2L0 -18L12 -2L26 -14L22 12Z', GOLD) + R(-22, 12, 44, 8, GOLD_D, 2) +
      C(-26, -16, 4, '#ff5e7e', ' stroke-width="2"') + C(0, -20, 4.5, jew || '#4cc3ff', ' stroke-width="2"') + C(26, -16, 4, '#ff5e7e', ' stroke-width="2"') + HL('M-16 8L-18 -6', 3));
  }
  function badgeSvg(n) {
    var s = '';
    switch (n) {
      case 0:
        s = C(50, 48, 36, '#bfeaff', ' stroke-width="3"') + C(50, 48, 36, 'none', ' stroke="' + INK + '" stroke-width="15"') + C(50, 48, 36, 'none', ' stroke="#e8c98a" stroke-width="9" stroke-dasharray="6 3.5"') +
          P('M42 84Q50 98 58 84L58 96Q50 104 42 96Z', '#e8c98a', ' stroke-width="3"') + HL('M28 34Q34 22 48 18', 4) + L('M40 50Q50 40 60 50', '#4cc3ff', 4);
        break;
      case 1:
        s = disc('#4cc3ff') + L('M50 26V72M38 40H62', INK, 11) + L('M50 26V72M38 40H62', '#e8f1fa', 5) + C(50, 24, 6, '#e8f1fa', ' stroke-width="3"') + P('M28 56Q34 76 50 76Q66 76 72 56', '', ' stroke="' + INK + '" stroke-width="11" fill="none"') + P('M28 56Q34 76 50 76Q66 76 72 56', '', ' stroke="#e8f1fa" stroke-width="5" fill="none"');
        break;
      case 2:
        s = disc('#b9c4d0') + P('M30 58A18 18 0 0 0 66 58A18 18 0 0 0 30 58Z', GOLD) + P('M60 46L76 34L78 40L66 52Z', GOLD_D) + C(48, 58, 5, INK, ' stroke="none"') + L('M32 46Q22 32 40 30', INK, 3) + HL('M36 52Q40 46 48 46', 3);
        break;
      case 3:
        s = disc('#2fbf5b') + C(50, 50, 24, '#fff6df', ' stroke-width="3"') + P('M50 28L56 50L50 72L44 50Z', RED, ' stroke-width="2.5"') + P('M50 50L56 50L50 72Z', '#e8f1fa', ' stroke-width="0"') + P('M28 50L50 44L72 50L50 56Z', '#4a7be0', ' stroke-width="2.5"') + C(50, 50, 4, GOLD, ' stroke-width="2"');
        break;
      case 4:
        s = disc('#ffc93c', '#fff') + G('rotate(-35 50 50)', R(18, 42, 20, 16, GOLD_D, 3, ' stroke-width="3"') + R(36, 44, 26, 12, WOOD, 2) + R(60, 40, 8, 20, '#e8f1fa', 2, ' stroke-width="2.5"') + R(66, 38, 12, 24, WOOD_D, 3, ' stroke-width="3"') + HL('M40 48H58', 3));
        break;
      case 5:
        s = disc('#2b5da8') + ribbon('#e24a5a') + P('M24 56Q24 40 50 38Q76 40 76 56Q50 62 24 56Z', '#fff') + P('M30 40Q50 20 70 40Q50 32 30 40Z', '#fff') + P('M26 54Q50 62 74 54L74 62Q50 70 26 62Z', '#14365a', ' stroke-width="2.5"') + star(50, 47, 8, GOLD, ' stroke-width="2"');
        break;
      case 6:
        s = ribbon('#e24a5a') + disc('#ffc93c', '#fff6df') + star(50, 50, 24, '#fff6df', ' stroke-width="3.5"') + star(50, 50, 12, '#ff5e5e', ' stroke-width="2.5"') + spark(76, 24, 6);
        break;
      case 7:
        s = ribbon('#8a5cf5') + disc('#8a5cf5', '#ffc93c') + crown(50, 52, 1.05) + spark(76, 24, 6);
        break;
      case 8:
        s = ribbon('#e24a5a') + disc('#d9423b', '#ffc93c') + crown(50, 36, 0.78, '#2fbf5b') + crown(50, 56, 1.05, '#4cc3ff') + star(26, 28, 5, GOLD, ' stroke-width="2"') + star(74, 28, 5, GOLD, ' stroke-width="2"') + star(50, 74, 6, GOLD, ' stroke-width="2"');
        break;
      case 9:
        s = ribbon('#2f9a9a') + disc('#2f9a9a', '#ffc93c') + laurel() + crown(50, 52, 1.05, '#ff5e7e') + star(50, 74, 5, GOLD, ' stroke-width="2"');
        break;
      case 10:
        s = P('M50 0L56 14L68 4L70 18L84 12L82 26L96 26L88 38L100 46L88 54L96 66L82 70L84 84L70 80L66 92L56 84L50 98L44 84L34 92L30 80L16 84L18 70L4 66L12 54L0 46L12 38L4 26L18 26L16 12L30 18L32 4L44 14Z', GOLD, ' stroke-width="3"') +
          ribbon('#8a5cf5').replace(/L28 100/, 'L30 98') + C(50, 48, 30, '#ffe27a', ' stroke-width="4"') + C(50, 48, 23, '#ffc93c', ' stroke-width="3"') + crown(50, 50, 0.95, '#ff5e7e') + spark(22, 20, 7) + spark(80, 76, 6);
        break;
    }
    return wrap('0 0 100 104', '', s);
  }
  function laurel() {
    var s = '', i, y, a;
    for (i = 0; i < 5; i++) {
      y = 70 - i * 11; a = 18 + i * 3;
      s += E(24 - i * 0.3, y, 9, 4, '#7ddc8a', ' stroke-width="2" transform="rotate(' + (-40 + i * 8) + ' ' + (24 - i * 0.3) + ' ' + y + ')"') +
        E(76 + i * 0.3, y, 9, 4, '#7ddc8a', ' stroke-width="2" transform="rotate(' + (40 - i * 8) + ' ' + (76 + i * 0.3) + ' ' + y + ')"');
    }
    return s;
  }

  /* ================================================================ CHEST, COIN, SCENE */
  function chestSvg(open) {
    var s;
    if (!open) {
      s = P('M14 52Q14 20 60 20Q106 20 106 52Z', WOOD) + R(10, 50, 100, 42, '#a9692e', 6) + R(10, 50, 100, 10, WOOD_D, 3, ' stroke-width="2.5"') +
        R(26, 22, 12, 70, GOLD, 3, ' stroke-width="2.5"') + R(82, 22, 12, 70, GOLD, 3, ' stroke-width="2.5"') + R(50, 48, 20, 22, GOLD, 4) + C(60, 58, 4, INK, ' stroke="none"') + HL('M22 34Q40 24 56 24', 4);
    } else {
      s = P('M14 40Q10 6 56 6Q96 6 100 30L96 36Z', WOOD, ' transform="rotate(-8 60 40)"') + R(10, 50, 100, 42, '#a9692e', 6) + R(10, 50, 100, 10, WOOD_D, 3, ' stroke-width="2.5"') +
        R(26, 60, 12, 32, GOLD, 3, ' stroke-width="2.5"') + R(82, 60, 12, 32, GOLD, 3, ' stroke-width="2.5"') +
        P('M14 52Q20 30 40 34Q50 20 70 32Q92 28 106 52Z', GOLD) + C(40, 40, 8, '#ffe27a', ' stroke-width="2.5"') + C(66, 36, 8, '#ffe27a', ' stroke-width="2.5"') + C(86, 44, 7, '#ffe27a', ' stroke-width="2.5"') +
        C(54, 48, 7, GOLD, ' stroke-width="2.5"') + spark(30, 20, 8) + spark(90, 14, 7) + spark(60, 8, 5);
    }
    return wrap('0 0 120 100', '', s);
  }
  function coinSvg() {
    return wrap('0 0 60 60', '', C(30, 30, 25, GOLD, ' stroke-width="4"') + C(30, 30, 18, 'none', ' stroke="' + GOLD_D + '" stroke-width="3"') + star(30, 30, 11, '#ffe27a', ' stroke-width="2.5"') + HL('M14 22Q18 14 28 11', 4));
  }
  function sceneSvg() {
    var s = '', i, r;
    for (i = 0; i < 8; i++) { r = i * Math.PI / 4; s += L('M' + (66 + Math.cos(r) * 42).toFixed(1) + ' ' + (62 + Math.sin(r) * 42).toFixed(1) + 'L' + (66 + Math.cos(r) * 58).toFixed(1) + ' ' + (62 + Math.sin(r) * 58).toFixed(1), SUN, 6); }
    s += C(66, 62, 34, SUN, ' stroke-width="3"') + HL('M48 50Q54 40 68 37', 5) +
      G('translate(150 30) scale(1.7)', P('M20 50Q8 50 8 40Q8 28 24 28Q28 12 46 16Q58 8 72 20Q90 18 92 36Q92 50 82 50Z', '#fff')) +
      G('translate(268 4) scale(1.3)', P('M20 50Q8 50 8 40Q8 28 24 28Q28 12 46 16Q58 8 72 20Q90 18 92 36Q92 50 82 50Z', '#fff')) +
      P('M300 140Q314 122 330 140Q346 122 360 140', '', ' stroke-width="5" fill="none"') + P('M200 150Q210 138 222 150Q234 138 244 150', '', ' stroke-width="4" fill="none"') + P('M370 84Q378 76 386 84', '', ' stroke-width="3.5" fill="none"');
    return wrap('0 0 400 180', '', s);
  }

  /* ================================================================ public API */
  // RG_IMAGES values are either a path string or {src, waterline}
  function raster(key) {
    var m = window.RG_IMAGES, v = m && typeof m === 'object' ? m[key] : null;
    if (!v) return null;
    if (typeof v === 'string') return { src: v };
    return v.src ? v : null;
  }
  // Raster ships: sail/hull recolor are NOT applied (the picture is fixed); the pet and an emoji flag are overlaid as
  // absolutely positioned spans. The golden-statue raster gets opts.avatar overlaid the same way.
  var cssDone = false;
  function ensureCss() {
    if (cssDone) return; cssDone = true;
    try {
      var st = document.createElement('style');
      st.textContent = '.rg-art-wrap{position:relative;display:block;width:100%;height:100%;container-type:size}' +
        '.rg-art-wrap>.rg-ov{position:absolute;line-height:1;font-size:15cqmin;transform:translate(-50%,-50%);pointer-events:none}';
      document.head.appendChild(st);
    } catch (e) {}
  }
  function ov(x, y, size, ch) { return '<span class="rg-ov" style="left:' + x + '%;top:' + y + '%;font-size:' + size + 'cqmin">' + ch + '</span>'; }
  function overlay(r, spans) {
    if (!spans) return img(r.src);
    ensureCss();
    return '<span class="rg-art-wrap">' + img(r.src) + spans + '</span>';
  }
  function known(kind, id) {
    if (kind === 'ship') return SHIPS.indexOf(id) >= 0;
    if (kind === 'island') return ISLANDS.indexOf(id) >= 0;
    if (kind === 'building') return BUILDINGS.indexOf(id) >= 0;
    if (kind === 'badge') { var n = +id; return n === Math.floor(n) && n >= 0 && n <= 10; }
    if (kind === 'chest') return id === 'open' || id === 'closed' || id === true || id === false || id === undefined;
    if (kind === 'coin' || kind === 'scene') return true;
    return false;
  }
  function guard(fn) { try { return fn(); } catch (e) { return ''; } }

  RG.art = {
    WATERLINE: WATERLINE_Y / SHIP_H,
    SHIP_VIEWBOX: [SHIP_W, SHIP_H],
    ids: { ship: SHIPS.slice(), island: ISLANDS.slice(), building: BUILDINGS.slice(), badge: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    // waterline (fraction of height) for a ship: the raster's own value, or WATERLINE for the SVG art
    waterline: function (kind, id) {
      var r = kind === 'ship' ? raster('ship:' + id) : null;
      return r && r.waterline ? r.waterline : WATERLINE_Y / SHIP_H;
    },
    has: function (kind, id) { return known(kind, id) || !!raster(kind + ':' + id); },
    ship: function (id, opts) {
      var r = raster('ship:' + id);
      if (r) {
        var wl = (r.waterline || 0.88) * 100, op = opts || {}, sp = '';
        if (op.pet) sp += op.pet === '\uD83D\uDC2C' ? ov(88, wl + 4, 16, op.pet) : ov(62, wl - 30, 14, op.pet);
        if (op.flag && !isColor(op.flag)) sp += ov(54, 8, 10, op.flag);
        return overlay(r, sp);
      }
      if (SHIPS.indexOf(id) < 0) id = 'little-sailboat';
      return guard(function () { return shipSvg(id, opts || {}); });
    },
    island: function (id) {
      var r = raster('island:' + id); if (r) return img(r.src);
      if (ISLANDS.indexOf(id) < 0) return '';
      return guard(function () { return islandSvg(id); });
    },
    building: function (id, opts) {
      var r = raster('building:' + id);
      if (r) return overlay(r, id === 'golden-statue' && opts && opts.avatar ? ov(50, 30, 22, opts.avatar) : '');
      if (BUILDINGS.indexOf(id) < 0) return '';
      return guard(function () { return buildingSvg(id, opts || {}); });
    },
    badge: function (n) {
      n = Math.max(0, Math.min(10, Math.floor(+n) || 0));
      var r = raster('badge:' + n); if (r) return img(r.src);
      return guard(function () { return badgeSvg(n); });
    },
    chest: function (open) {
      var r = raster('chest:' + (open ? 'open' : 'closed')); if (r) return img(r.src);
      return guard(function () { return chestSvg(!!open); });
    },
    coin: function () { var r = raster('coin'); return r ? img(r.src) : guard(coinSvg); },
    scene: function () { var r = raster('scene'); return r ? img(r.src) : guard(sceneSvg); }
  };
})();
