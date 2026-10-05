/* Reading Quest - "Why Read?" missions. Reading is NECESSARY and FUN.
   Each scene: narrator setup, a real-world text drawn with CSS, a choice or a sequence,
   a silly (never scary) consequence for a misread, a payoff line, then a Reading Superpower card. */
(function () {
  'use strict';
  var RG = window.RG;
  if (!RG || !RG.registerGame) { return; }

  var STYLE_ID = 'rq-style';
  var CSS = `
.rq-wrap{position:relative;width:100%;max-width:640px;margin:0 auto;padding:6px 10px 22px;box-sizing:border-box;display:flex;flex-direction:column;gap:12px;color:#4a3320;--rq-teal:#2a9d8f}
.rq-narr{display:flex;gap:10px;align-items:flex-start}
.rq-parrot{font-size:2.6rem;line-height:1;flex:none;animation:rq-bob 2.4s ease-in-out infinite}
.rq-bubble{flex:1;background:#fff;border:3px solid var(--rq-teal);border-radius:18px;padding:10px 14px;font-size:1.1rem;line-height:1.35;font-weight:600}
.rq-tip{display:block;margin-top:6px;font-size:.95rem;font-weight:800;color:#1f7a6f}
.rq-art{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}
.rq-ow{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:6px;filter:drop-shadow(0 3px 2px rgba(0,0,0,.35))}
.rq-ow.sel{filter:drop-shadow(0 0 9px #ffd60a)}
.rq-ow.rq-hint{animation:rq-pulse 1s ease-in-out infinite;filter:drop-shadow(0 0 12px #ffd60a)}
.rq-ow.rq-correct{filter:drop-shadow(0 0 14px #2ecc40);animation:rq-pop .5s}
.rq-opt,.rq-tok,.rq-hear,.rq-go{font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.rq-go{display:none;min-height:56px;min-width:110px;border:3px solid #fff;border-radius:28px;background:#2fbf5b;color:#fff;font-size:1.3rem;font-weight:800;padding:0 18px;box-shadow:0 4px 0 rgba(0,0,0,.25)}
.rq-ow.sel .rq-go{display:block}
/* signpost */
.rq-signpost{position:relative;width:100%;padding:16px 0 30px;display:flex;flex-direction:column;gap:14px;align-items:center;background:linear-gradient(#bfe9ff 70%,#7ccf6b 70%);border-radius:18px;overflow:hidden}
.rq-signpost::before{content:'';position:absolute;left:50%;top:0;bottom:0;width:22px;margin-left:-11px;background:linear-gradient(90deg,#7a4d22,#b97a3e,#7a4d22);border-radius:6px}
.rq-signpost .rq-ow{width:86%}
.rq-plank{width:100%;min-height:78px;border:0;color:#3b2412;font-size:1.6rem;font-weight:800;padding:10px 14px;display:flex;align-items:center;justify-content:center;gap:10px;background:repeating-linear-gradient(0deg,rgba(0,0,0,.07) 0 2px,transparent 2px 9px),linear-gradient(#e0a76b,#bd7f43)}
.rq-plank.r{clip-path:polygon(0 0,91% 0,100% 50%,91% 100%,0 100%);padding-right:12%}
.rq-plank.l{clip-path:polygon(9% 0,100% 0,100% 100%,9% 100%,0 50%);padding-left:12%}
.rq-plank .rq-pe{font-size:2.2rem}
.rq-plank .rq-pt{line-height:1.1}
/* bottles */
.rq-shelf{width:100%;display:flex;justify-content:center;align-items:flex-end;gap:clamp(14px,6vw,40px);padding:18px 10px 0;box-sizing:border-box;border-bottom:16px solid #8a5a2b;background:linear-gradient(#cfe8ef,#eaf7fa);border-radius:16px 16px 0 0}
.rq-bottle{border:0;background:none;padding:0;display:flex;flex-direction:column;align-items:center}
.rq-cork{width:30px;height:18px;background:#b07a45;border-radius:4px 4px 0 0}
.rq-neck{width:38px;height:28px;background:rgba(255,255,255,.55);border:3px solid #7aa7b3;border-bottom:0}
.rq-body{width:clamp(110px,30vw,150px);min-height:150px;border:3px solid #7aa7b3;border-radius:26px 26px 18px 18px;background:var(--liq,#ff9f1c);display:flex;align-items:center;justify-content:center;padding:8px;box-sizing:border-box}
.rq-blabel{background:#fffdf2;border:2px solid #6b4a2b;border-radius:8px;padding:6px 8px;font-weight:800;font-size:1.05rem;text-align:center;line-height:1.15;width:100%;box-sizing:border-box;color:#3b2412}
.rq-blabel .rq-be{display:block;font-size:1.7rem}
/* plates (door and pot signs) */
.rq-plates{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;width:100%}
.rq-plate{min-width:140px;min-height:104px;border:6px solid #fff;border-radius:16px;background:var(--pc,#d62828);color:#fff;font-size:1.5rem;font-weight:800;padding:10px 14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;box-shadow:0 0 0 4px var(--pc,#d62828),0 5px 0 4px rgba(0,0,0,.25)}
.rq-plate .rq-pe{font-size:2.4rem;line-height:1}
.rq-plate.dark{color:#3b2412}
/* cards (note, parcel tag, recipe, list, map) */
.rq-card{position:relative;width:100%;box-sizing:border-box;background:#fff3d1;border:3px solid #c9a35a;border-radius:6px 16px 10px 18px;padding:12px 78px 14px 16px;box-shadow:0 4px 0 rgba(0,0,0,.18),inset 0 0 20px rgba(201,163,90,.55);font-size:1.5rem;line-height:1.45;text-align:left;color:#4a3320}
.rq-ctitle{font-size:.95rem;font-weight:800;opacity:.7;margin-bottom:4px}
.rq-line{font-weight:800;letter-spacing:.04em}
.rq-card-recipe{background:repeating-linear-gradient(#fffdf6 0 31px,#cfe6ff 31px 32px);border-color:#e07a5f;border-left:14px solid #e07a5f}
.rq-card-market{background:#fff;border:3px dashed #4ab3d8;box-shadow:0 4px 0 rgba(0,0,0,.15)}
.rq-card-parcel{background:#d9a56a;border:4px solid #8a5a2b;text-align:center}
.rq-card-parcel .rq-line{display:inline-block;background:#fff;border-radius:6px;padding:4px 12px;border:2px solid #8a5a2b;margin:2px 0}
.rq-card-parcel::before{content:'';position:absolute;left:14px;right:78px;top:50%;height:10px;margin-top:-5px;background:rgba(214,40,40,.55);z-index:0}
.rq-card-parcel>*{position:relative;z-index:1}
.rq-hear{position:absolute;right:8px;top:8px;width:64px;height:64px;border-radius:50%;border:3px solid var(--rq-teal);background:#fff;font-size:1.6rem;box-shadow:0 3px 0 rgba(0,0,0,.2)}
.rq-hear.rq-hide{display:none}
.rq-card.rq-nohear{padding-right:16px}
.rq-toks.rq-wide .rq-ow{flex:1 1 40%;max-width:48%}
.rq-toks.rq-wide .rq-tok{width:100%;min-width:0}
.rq-toks.rq-wide .rq-tl{font-size:1.05rem;text-align:center}
.rq-hear.rq-hint{animation:rq-pulse 1s infinite}
/* map spots and houses */
.rq-isle{width:100%;box-sizing:border-box;display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:14px;border-radius:20px;background:radial-gradient(circle at 30% 30%,#9be09f,#5fb36a);border:5px solid #4ab3d8}
.rq-isle .rq-ow{width:100%}
.rq-spot{width:100%;min-height:96px;border:4px solid #fff;border-radius:18px;background:rgba(255,255,255,.6);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px}
.rq-spe{font-size:3rem;line-height:1.05}
.rq-spl{font-weight:800;font-size:1.15rem;color:#3b2412}
/* sequences (recipe, market, map) */
.rq-slots{display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap}
.rq-slotpre{font-size:2.4rem}
.rq-st{width:64px;height:64px;border:4px dashed #b08a4a;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:2rem;background:rgba(255,255,255,.7);box-sizing:border-box}
.rq-st.full{border-style:solid;border-color:#2a9d3f;background:#e5f9e7;animation:rq-pop .35s}
.rq-toks{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;width:100%;box-sizing:border-box;padding:14px 10px;border-radius:18px}
.rq-toks-recipe{background:#fde7c8;border:3px solid #f2c48d}
.rq-toks-market{background:repeating-linear-gradient(90deg,#fff 0 22px,#ff6b6b 22px 44px);padding-top:30px;border:3px solid #ff6b6b}
.rq-toks-map{background:radial-gradient(circle at 70% 30%,#9be09f,#5fb36a);border:5px solid #4ab3d8}
.rq-toks .rq-ow{width:auto}
.rq-tok{min-width:92px;min-height:92px;border:4px solid #fff;border-radius:18px;background:rgba(255,255,255,.85);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 8px;box-shadow:0 4px 0 rgba(0,0,0,.2)}
.rq-te{font-size:2.6rem;line-height:1.05}
.rq-tl{font-size:1.15rem;font-weight:800;color:#3b2412}
.rq-tok.used{opacity:.35;pointer-events:none}
/* levels 4-5 skins */
.rq-card-steps{background:#eef3ff;border-color:#6a7fd1;border-left:14px solid #6a7fd1}
.rq-toks-steps{background:#dfe6ff;border:3px solid #9fb1f2}
.rq-card-times{background:#f4fbff;border-color:#4ab3d8}
.rq-table{width:100%;border-collapse:collapse;font-size:1.2rem;font-weight:800;letter-spacing:.03em}
.rq-table th{font-size:.95rem;opacity:.65;text-align:left;padding:2px 6px;border-bottom:3px solid #4ab3d8}
.rq-table td{padding:6px;border-bottom:2px dashed #b8dff0}
.rq-mapgrid{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:12px}
.rq-mapgrid .rq-ow{width:100%}
.rq-mapbtn{width:100%;border:4px solid #fff;border-radius:16px;background:#fff8dc;padding:8px;display:flex;flex-direction:column;align-items:center;gap:4px;box-shadow:0 4px 0 rgba(0,0,0,.2)}
.rq-mapbtn svg{width:100%;height:auto;max-width:200px}
.rq-mapbtn .rq-spl{font-size:1.2rem}
/* consequence overlay */
.rq-oops{position:absolute;left:0;right:0;top:0;bottom:0;z-index:10;background:rgba(255,255,255,.92);border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:20px;text-align:center;overflow:hidden;animation:rq-fade .2s}
.rq-oemoji{font-size:5rem;line-height:1.1;animation:rq-wig .5s ease-in-out 3}
.rq-otext{font-size:1.3rem;font-weight:800;max-width:420px}
.rq-fx span{position:absolute;bottom:-10%;font-size:2rem;opacity:.85;animation:rq-rise 2.2s ease-in infinite}
/* payoff and superpower */
.rq-after{display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center;padding-top:6px}
.rq-payoff{background:#e8fff1;border:3px solid #2a9d3f;border-radius:18px;padding:12px 16px;font-size:1.25rem;font-weight:800;line-height:1.35}
.rq-power{background:linear-gradient(135deg,#ffe066,#ffb703);border:4px solid #fff;outline:3px solid #f08c00;border-radius:22px;padding:14px 22px;display:flex;align-items:center;gap:12px;font-size:1.4rem;font-weight:800;animation:rq-pop .6s;box-shadow:0 6px 0 rgba(0,0,0,.2);color:#5a2a00}
.rq-pe2{font-size:3rem;line-height:1}
.rq-pcap{font-size:.9rem;font-weight:800;color:#8a5a2b}
.rq-next{min-height:72px}
.rq-final{display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center}
.rq-final h2{margin:0;font-size:1.7rem}
.rq-powers{display:flex;flex-wrap:wrap;gap:12px;justify-content:center}
.rq-powers .rq-power{font-size:1.1rem;padding:10px 14px}
.rq-powers .rq-pe2{font-size:2.2rem}
.rq-new{font-size:.75rem;background:#e63946;color:#fff;border-radius:10px;padding:2px 8px;margin-left:4px}
@keyframes rq-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes rq-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
@keyframes rq-pop{0%{transform:scale(.6)}70%{transform:scale(1.1)}100%{transform:scale(1)}}
@keyframes rq-fade{from{opacity:0}to{opacity:1}}
@keyframes rq-wig{0%,100%{transform:rotate(0)}25%{transform:rotate(-12deg)}75%{transform:rotate(12deg)}}
@keyframes rq-rise{0%{transform:translateY(0)}100%{transform:translateY(-420px)}}
@media (prefers-reduced-motion:reduce){.rq-wrap *{animation-duration:.01s!important;animation-iteration-count:1!important}}
@media (max-width:420px){.rq-card{font-size:1.3rem;padding-right:74px}.rq-plank{font-size:1.4rem}}
`;

  /* ---------------- scene data ---------------- */
  var POW = {
    finder: ['finder', 'Readers find treasure!', '💎'],
    safe: ['safe', 'Readers stay safe!', '🦺'],
    cook: ['cook', 'Readers can cook!', '🧑‍🍳'],
    secret: ['secret', 'Readers get secret messages!', '💌'],
    shop: ['shop', 'Readers shop smart!', '🛒'],
    helper: ['helper', 'Readers help their friends!', '📦'],
    plan: ['plan', 'Readers plan the trip!', '🧭'],
    fixer: ['fixer', 'Readers fix things!', '🔧']
  };
  var CRAB = [['🦀', 'Pinch pinch! A silly crab nipped your sock! Let us try again.']];
  var BUBBLES = [['🫧', 'Bloop bloop! Soapy bubbles! That was the soap. Pop pop pop! Try again.']];
  var STEAM = [['♨️', 'Whoosh! Hot steam! Wiggle your fingers and blow. Try again.']];
  var INK = [['🐙', 'Splosh! An octopus squirted ink! That was not on the list. Try again.']];
  var PENGUIN = [['🐧', 'Waddle waddle! Only a penguin is here. The note said somewhere else. Try again.']];
  var DOG = [['🐶', 'Woof! The dog sniffs it. Not for me! Try again.']];
  var FLOUR = [['💨', 'Poof! A cloud of flour! The cook sneezes. Achoo! Try again.']];
  var PAYOFF_SIGN = 'You read the sign, so you found the treasure! Readers find things other people miss.';
  var PAYOFF_LABEL = 'You read the label, so you stayed safe! Readers stay safe.';
  var PAYOFF_NOTE = 'You read the note, so you met your friend! Readers get secret messages.';
  var PAYOFF_PARCEL = 'You read the name, so the parcel got to the right friend! Readers help their friends.';
  var PAYOFF_LIST = 'You read the list, so you bought just the right things! Readers shop smart.';
  var PAYOFF_COOK = 'You read the recipe, so the pancakes got made! Readers can cook.';
  var PAYOFF_MAP = 'You read the map, so you found the treasure! Readers find things other people miss.';

  var SCENES = [
    /* ---------- LITTLE ---------- */
    { id: 'l-sign-treasure', t: 'little', lv: 1, skin: 'sign', kind: 'pick', read: 'opts',
      setup: 'Ahoy, Captain! The path splits in two. We want the treasure! Which sign shows the way?',
      opts: [{ text: 'treasure', emoji: '💎', dir: 'r', ok: 1 }, { text: 'crabs', emoji: '🦀', dir: 'l' }],
      oops: CRAB, payoff: PAYOFF_SIGN, power: POW.finder },
    { id: 'l-bottle-juice', t: 'little', lv: 1, skin: 'bottle', kind: 'pick', read: 'opts',
      setup: 'The ship cook is thirsty! Two bottles look the same. Which bottle is juice?',
      opts: [{ text: 'soap', emoji: '🧼', col: '#ff9f1c' }, { text: 'juice', emoji: '🧃', col: '#ff9f1c', ok: 1 }],
      oops: BUBBLES, payoff: 'You read the label, so you picked the juice and stayed safe! Readers stay safe.', power: POW.safe },
    { id: 'l-note-rock', t: 'little', lv: 1, skin: 'note', kind: 'pick', read: 'card',
      setup: 'A bottle washed up with a note inside! A friend wants to meet us. Where do we go?',
      title: '💌 a note', lines: ['the rock'],
      opts: [{ emoji: '🌴', label: 'palm' }, { emoji: '🪨', label: 'rock', ok: 1 }, { emoji: '🏠', label: 'hut' }, { emoji: '⛺', label: 'tent' }],
      oops: PENGUIN, payoff: PAYOFF_NOTE, power: POW.secret },
    { id: 'l-parcel-fox', t: 'little', lv: 1, skin: 'parcel', kind: 'pick', read: 'card',
      setup: 'Postman Captain! This parcel has a name on it. Who is it for?',
      title: '📦', lines: ['fox'],
      opts: [{ emoji: '🐶', label: 'dog' }, { emoji: '🦊', label: 'fox', ok: 1 }, { emoji: '🐸', label: 'frog' }],
      oops: DOG, payoff: PAYOFF_PARCEL, power: POW.helper },
    { id: 'l-market-fish', t: 'little', lv: 1, skin: 'market', kind: 'seq', ordered: false,
      setup: 'We are at the harbor market! The shopping list says what to buy.',
      title: '🛒 list', lines: ['fish', 'apple'], pre: '🧺',
      items: [{ id: 'fish', label: 'fish', emoji: '🐟' }, { id: 'sock', label: 'sock', emoji: '🧦' }, { id: 'apple', label: 'apple', emoji: '🍎' }, { id: 'carrot', label: 'carrot', emoji: '🥕' }],
      order: ['fish', 'apple'], oops: INK, payoff: PAYOFF_LIST, power: POW.shop },
    { id: 'l-recipe-eggmilk', t: 'little', lv: 2, skin: 'recipe', kind: 'seq', ordered: true,
      setup: 'The cook needs help making pancakes! Follow the recipe card, one by one.',
      title: '🥞 recipe', lines: ['egg', 'milk'], pre: '🥣',
      items: [{ id: 'milk', label: 'milk', emoji: '🥛' }, { id: 'sock', label: 'sock', emoji: '🧦' }, { id: 'egg', label: 'egg', emoji: '🥚' }, { id: 'fish', label: 'fish', emoji: '🐟' }],
      order: ['egg', 'milk'], oops: FLOUR, payoff: PAYOFF_COOK, power: POW.cook },
    { id: 'l-pot-cool', t: 'little', lv: 2, skin: 'plate', kind: 'pick', read: 'opts',
      setup: 'Two pots sit by the stove. Which pot is safe to touch?',
      opts: [{ text: 'hot', emoji: '🔥', col: '#d62828' }, { text: 'cool', emoji: '❄️', col: '#1d6fd1', ok: 1 }],
      oops: STEAM, payoff: 'You read the sign, so your fingers stayed safe! Readers stay safe.', power: POW.safe },
    { id: 'l-parcel-frog', t: 'little', lv: 2, skin: 'parcel', kind: 'pick', read: 'card',
      setup: 'Another parcel for the post! Read the name and find the right house.',
      title: '📦', lines: ['frog'],
      opts: [{ emoji: '🐱', label: 'cat' }, { emoji: '🐰', label: 'rabbit' }, { emoji: '🐸', label: 'frog', ok: 1 }, { emoji: '🐶', label: 'dog' }],
      oops: DOG, payoff: PAYOFF_PARCEL, power: POW.helper },
    { id: 'l-map-rockpalm', t: 'little', lv: 2, skin: 'map', kind: 'seq', ordered: true,
      setup: 'Here is the treasure map! Follow the words in order.',
      title: '🗺️ map', lines: ['rock', 'palm'], pre: '🧭',
      items: [{ id: 'palm', label: 'palm', emoji: '🌴' }, { id: 'shell', label: 'shell', emoji: '🐚' }, { id: 'rock', label: 'rock', emoji: '🪨' }, { id: 'cactus', label: 'cactus', emoji: '🌵' }],
      order: ['rock', 'palm'], oops: CRAB, payoff: PAYOFF_MAP, power: POW.finder },
    { id: 'l-sign-stop', t: 'little', lv: 3, skin: 'plate', kind: 'pick', read: 'opts',
      setup: 'Beep beep! A wheelbarrow is rolling down the dock. Which sign says to wait?',
      opts: [{ text: 'go', emoji: '🟢', col: '#2a9d3f' }, { text: 'stop', emoji: '🛑', col: '#d62828', ok: 1 }],
      oops: [['🛒', 'Whoosh! The wheelbarrow zoomed past your nose! Wheee! Try again.']],
      payoff: 'You read STOP, so you stayed safe on the dock! Readers stay safe.', power: POW.safe },
    { id: 'l-market-three', t: 'little', lv: 3, skin: 'market', kind: 'seq', ordered: false,
      setup: 'Back at the market! This list is longer. Read it and fill the basket.',
      title: '🛒 list', lines: ['fish', 'egg', 'apple'], pre: '🧺',
      items: [{ id: 'bread', label: 'bread', emoji: '🍞' }, { id: 'egg', label: 'egg', emoji: '🥚' }, { id: 'fish', label: 'fish', emoji: '🐟' }, { id: 'sock', label: 'sock', emoji: '🧦' }, { id: 'apple', label: 'apple', emoji: '🍎' }, { id: 'carrot', label: 'carrot', emoji: '🥕' }],
      order: ['fish', 'egg', 'apple'], oops: INK, payoff: PAYOFF_LIST, power: POW.shop },

    /* ---------- BIG (hi-lo: older-kid themes, text decodable for the scene level; names[] lists proper names) ---------- */
    { id: 'b-sign-cove', t: 'big', lv: 1, skin: 'sign', kind: 'pick', read: 'opts',
      setup: 'A ship hit a rock! The cash is in the pit. Tap the one with the cash.',
      opts: [{ text: 'bat den', dir: 'l' }, { text: 'cash pit', dir: 'r', ok: 1 }],
      oops: [['🦇', 'Zip zip! A mad bat! Not that one. Tap the cash.']],
      payoff: 'You did it! You got the cash!', cap: 'You got the cash!', power: POW.finder },
    { id: 'b-bottle-juice', t: 'big', lv: 1, skin: 'bottle', kind: 'pick', read: 'opts',
      setup: 'The chef has a pot of mud and a pot of jam. Tap the one to eat!',
      opts: [{ text: 'mud', col: '#7a4dd8' }, { text: 'jam', col: '#7a4dd8', ok: 1 }],
      oops: [['🟤', 'Yuck! Mud on the bun! Tap the jam.']],
      payoff: 'You did it! The bun has jam on it!', cap: 'Yum yum!', power: POW.safe },
    { id: 'b-note-tree', t: 'big', lv: 1, skin: 'note', kind: 'pick', read: 'card',
      setup: 'A tin can hit the dock! A pad is in it. Look at the pad!',
      title: '💌 a pad', lines: ['the cash is in the pit.'],
      opts: [{ emoji: '🛖', label: 'hut' }, { emoji: '🚢', label: 'ship' }, { emoji: '🕳️', label: 'pit', ok: 1 }, { emoji: '🚐', label: 'van' }],
      oops: [['🐛', 'A bug is in the hut! Not the cash. Look at the pad.']],
      payoff: 'Yes! You got the cash! You did it!', cap: 'You did it!', power: POW.secret },
    { id: 'b-parcel-pond', t: 'big', lv: 1, skin: 'parcel', kind: 'pick', read: 'card',
      setup: 'A box is on the dock! Look at the tag. Who is it for?',
      title: '📦 box', lines: ['for the hen.'],
      opts: [{ emoji: '🐷', label: 'pig' }, { emoji: '🐔', label: 'hen', ok: 1 }, { emoji: '🦊', label: 'fox' }, { emoji: '🐱', label: 'cat' }],
      oops: [['🐶', 'Yap yap! Not for me! Tap the hen.']],
      payoff: 'The box got to the hen! Yes!', cap: 'Yes!', power: POW.helper },
    { id: 'b-recipe-eggmilk', t: 'big', lv: 1, skin: 'recipe', kind: 'seq', ordered: true, names: ['ben'],
      setup: 'The pan is hot! Help Ben fix the bun. Look at the tag.',
      title: '🍞 the tag', lines: ['get the bun.', 'add the jam.'], pre: '🍽️',
      items: [{ id: 'jam', label: 'jam', emoji: '🍓' }, { id: 'ham', label: 'ham', emoji: '🥓' }, { id: 'bun', label: 'bun', emoji: '🍞' }, { id: 'mud', label: 'mud', emoji: '🟫' }],
      order: ['bun', 'jam'], oops: [['💥', 'Not that one! Get the bun. Add the jam.']],
      payoff: 'Yum! Ben has a bun with jam!', cap: 'Yum!', power: POW.cook },
    { id: 'b-market-list', t: 'big', lv: 2, skin: 'market', kind: 'seq', ordered: false,
      setup: 'Get set! Pick up the stuff on the list.',
      title: '🛒 the list', lines: ['a flag, a rope and a drum.'], pre: '🧺',
      items: [{ id: 'cake', label: 'cake', emoji: '🎂' }, { id: 'flag', label: 'flag', emoji: '🚩' }, { id: 'kite', label: 'kite', emoji: '🪁' }, { id: 'rope', label: 'rope', emoji: '🪢' }, { id: 'brick', label: 'brick', emoji: '🧱' }, { id: 'drum', label: 'drum', emoji: '🥁' }],
      order: ['flag', 'rope', 'drum'], oops: [['🦑', 'Not on the list! Grab a flag, a rope and a drum.']],
      payoff: 'Yes! The ship has a flag, a rope and a drum!', cap: 'You got the stuff!', power: POW.shop },
    { id: 'b-map-rockpalm', t: 'big', lv: 2, skin: 'map', kind: 'seq', ordered: true,
      setup: 'Here is a map! Tap the spots, step by step.',
      title: '🗺️ the map', lines: ['go to the rock.', 'then go to the hut.', 'dig in the pit.'], pre: '🧭',
      items: [{ id: 'pit', label: 'pit', emoji: '🕳️' }, { id: 'crab', label: 'crab', emoji: '🦀' }, { id: 'rock', label: 'rock', emoji: '🪨' }, { id: 'hut', label: 'hut', emoji: '🛖' }, { id: 'ship', label: 'ship', emoji: '🚢' }],
      order: ['rock', 'hut', 'pit'], oops: [['🦀', 'Snap! A crab! Not that spot. Go step by step.']],
      payoff: 'You did it! The cash is in the pit!', cap: 'You can use a map!', power: POW.finder },
    { id: 'b-door-pantry', t: 'big', lv: 2, skin: 'plate', kind: 'pick', read: 'opts',
      setup: 'Get a snack! Tap the safe one.',
      opts: [{ text: 'stop: hot pan', emoji: '🔥', col: '#d62828' }, { text: 'snacks: go in', emoji: '🍪', col: '#2a9d3f', ok: 1 }],
      oops: [['♨️', 'Hot! Hot! Back up. Tap the safe one.']],
      payoff: 'Yes! You got a snack!', cap: 'You are safe!', power: POW.safe },
    { id: 'b-parcel-boat', t: 'big', lv: 2, skin: 'parcel', kind: 'pick', read: 'card',
      setup: 'Two of them are on the ship! Look at all of the tag.',
      title: '📦 box', lines: ['for the cat on the ship.'],
      opts: [{ emoji: '🐱', label: 'hill' }, { emoji: '🐶', label: 'ship' }, { emoji: '🐸', label: 'pond' }, { emoji: '🐱', label: 'ship', ok: 1 }],
      oops: [['🐶', 'Yap yap! That is a dog, not a cat!']],
      payoff: 'The cat got the box! Yes!', cap: 'Yes!', power: POW.helper },
    { id: 'b-recipe-pancakes', t: 'big', lv: 3, skin: 'recipe', kind: 'seq', ordered: true, names: ['max'],
      setup: 'Chef Max made a mess! Help him fix the cake. Read the steps and tap them one by one.',
      title: '🥞 the steps', lines: ['mix the eggs and the milk.', 'put it in the hot pan.', 'flip the cake!'], pre: '🥣',
      items: [{ id: 'flip', label: 'flip', emoji: '🥞' }, { id: 'sock', label: 'sock', emoji: '🧦' }, { id: 'mix', label: 'mix', emoji: '🥣' }, { id: 'pan', label: 'pan', emoji: '🍳' }],
      order: ['mix', 'pan', 'flip'], oops: [['💨', 'Poof! Dust! Not the right step. Look at the steps.']],
      payoff: 'You did it! Max can eat the cake!', cap: 'Max can eat!', power: POW.cook },
    { id: 'b-note-palm', t: 'big', lv: 3, skin: 'note', kind: 'pick', read: 'card',
      setup: 'A note from the sea! Read all of it. The first spot is a trap!',
      title: '💌 the note', lines: ['the loot is not by the rock.', 'dig deep, by the tree.'],
      opts: [{ emoji: '🪨', label: 'rock' }, { emoji: '🌳', label: 'tree', ok: 1 }, { emoji: '⛺', label: 'tent' }, { emoji: '🛖', label: 'hut' }],
      oops: [['🐸', 'Plop! Just a frog in the mud! Read it again.']],
      payoff: 'You read it all, so you got the loot!', cap: 'You got the loot!', power: POW.secret },
    { id: 'b-sign-open', t: 'big', lv: 3, skin: 'sign', kind: 'pick', read: 'opts',
      setup: 'A sea beast is in the cave! Look at the two ways. Pick the way that is open.',
      opts: [{ text: 'beast cave: shut', dir: 'r' }, { text: 'loot path: open', dir: 'l', ok: 1 }],
      oops: [['🦖', 'Boom! The beast woke up! That way is shut. Pick the way that is open.']],
      payoff: 'You read it, so you got the loot!', cap: 'You got the loot!', power: POW.finder },
    { id: 'b-bottle-water', t: 'big', lv: 3, skin: 'bottle', kind: 'pick', read: 'opts',
      setup: 'We need a drink! One jug is bad, and one is good. Read each one.',
      opts: [{ text: 'sea: bad to drink', col: '#4cc3ff' }, { text: 'tea: good to drink', col: '#4cc3ff', ok: 1 }],
      oops: [['🧂', 'Yuck! That is bad! Read it again.']],
      payoff: 'You read it, so you can drink! Yum!', cap: 'Yum!', power: POW.safe },

    /* ----- levels 4-5: multi-step instructions, a boat timetable, a recipe with amounts, the shorter of two maps, a note that needs inference ----- */
    { id: 'b-steps-sub', t: 'big', lv: 4, skin: 'steps', kind: 'seq', ordered: true,
      setup: 'Fix the sub! Read each step and tap them in order.',
      title: '🛠️ the steps', lines: ['first, turn the switch.', 'then, pull the cord.', 'last, hit start.'], pre: '🚤',
      items: [{ id: 'start', label: 'start', emoji: '▶️' }, { id: 'horn', label: 'horn', emoji: '📯' }, { id: 'switch', label: 'switch', emoji: '🎛️' }, { id: 'fork', label: 'fork', emoji: '🍴' }, { id: 'cord', label: 'cord', emoji: '🔌' }],
      order: ['switch', 'cord', 'start'], oops: [['💥', 'Zap! Sparks! Not yet! Try the steps in order.']],
      payoff: 'You read each step, so the sub can start! Zoom!', cap: 'You can fix the sub!', power: POW.fixer },
    { id: 'b-times-fort', t: 'big', lv: 4, skin: 'times', kind: 'pick', read: 'card',
      setup: 'We must get to the fort. Read the boat times. Take the first boat to the fort!',
      title: '⛴️ boat times', head: ['boat', 'go', 'to'],
      lines: ['red boat | 9:45 | fort', 'blue boat | 9:15 | farm', 'green boat | 10:00 | fort'],
      opts: [{ emoji: '🔴', label: 'red boat', ok: 1 }, { emoji: '🔵', label: 'blue boat' }, { emoji: '🟢', label: 'green boat' }],
      oops: [['🌊', 'Splash! That boat goes to the farm! Look at the times.']],
      payoff: 'You read the times, so you got to the fort!', cap: 'You can plan a trip!', power: POW.plan },
    { id: 'b-maps-short', t: 'big', lv: 4, skin: 'maps', kind: 'pick', read: 'opts',
      setup: 'Two maps show the way to the fort. Which map has the short way? Read the steps on each map.',
      opts: [{ text: 'map 1: 9 steps', n: 9 }, { text: 'map 2: 5 steps', n: 5, ok: 1 }],
      oops: [['🦀', 'Snap! A crab! That way is far! Look at the steps.']],
      payoff: 'You read the steps, so you took the short way!', cap: 'You took the short way!', power: POW.plan },
    { id: 'b-recipe-amounts', t: 'big', lv: 5, skin: 'recipe', kind: 'seq', ordered: false, names: ['mark'],
      setup: 'Chef Mark made a mess! Read the card. Get the right stuff, and how much to get.',
      title: '🍳 the card', lines: ['3 eggs', '2 cups of milk', '1 cup of corn'], pre: '🥘',
      items: [{ id: 'e2', label: '2 eggs', emoji: '🥚' }, { id: 'e3', label: '3 eggs', emoji: '🥚' }, { id: 'm3', label: '3 cups of milk', emoji: '🥛' }, { id: 'm2', label: '2 cups of milk', emoji: '🥛' }, { id: 'c2', label: '2 cups of corn', emoji: '🌽' }, { id: 'c1', label: '1 cup of corn', emoji: '🌽' }],
      order: ['e3', 'm2', 'c1'], oops: [['💥', 'Boom! Too much! Look at the card.']],
      payoff: 'You read the card, so the cake is just right!', cap: 'You can cook!', power: POW.cook },
    { id: 'b-note-cave', t: 'big', lv: 5, skin: 'note', kind: 'pick', read: 'card', names: ['max', 'jen'],
      setup: 'A note from a pal! Where is Jen? Read it and think.',
      title: '💌 the note', lines: ['to max:', 'it is dark and cold in here.', 'drip, drip, drip! bats zip past me.', 'i can not find my way out. help!', 'your pal, jen'],
      opts: [{ emoji: '🏖️', label: 'beach' }, { emoji: '⛰️', label: 'cave', ok: 1 }, { emoji: '🚜', label: 'farm' }, { emoji: '🚢', label: 'ship' }],
      oops: [['🦇', 'Flap flap! Not there! Read the note. Think!']],
      payoff: 'The note did not say cave, but you did the thinking! Good work!', cap: 'You can think!', power: POW.secret },
    { id: 'b-steps-loot', t: 'big', lv: 5, skin: 'steps', kind: 'seq', ordered: true, names: ['jack'],
      setup: 'Jack hid his loot! Read the steps and tap each spot in order.',
      title: '🗺️ the steps', lines: ['first, walk to the rock.', 'then, turn left at the barn.', 'then, go up the hill.', 'last, dig in the sand.'], pre: '🧭',
      items: [{ id: 'fort', label: 'fort', emoji: '🏰' }, { id: 'hill', label: 'hill', emoji: '⛰️' }, { id: 'rock', label: 'rock', emoji: '🪨' }, { id: 'sand', label: 'sand', emoji: '🏖️' }, { id: 'barn', label: 'barn', emoji: '🏚️' }, { id: 'park', label: 'park', emoji: '🌳' }],
      order: ['rock', 'barn', 'hill', 'sand'], oops: [['🦀', 'Snap! A crab! Not that spot! Read the steps again.']],
      payoff: 'You read all four steps, so you got the loot!', cap: 'You got the loot!', power: POW.finder },
    { id: 'b-times-home', t: 'big', lv: 5, skin: 'times', kind: 'pick', read: 'card',
      setup: 'We must get to the fort fast! Read the times. Which boat gets in first?',
      title: '⛴️ boat times', head: ['boat', 'go', 'in'],
      lines: ['red boat | 3:00 | 4:30', 'blue boat | 3:30 | 4:15', 'green boat | 4:00 | 5:15'],
      opts: [{ emoji: '🔴', label: 'red boat' }, { emoji: '🔵', label: 'blue boat', ok: 1 }, { emoji: '🟢', label: 'green boat' }],
      oops: [['🌊', 'Splash! That boat gets in last! Look at the last time.']],
      payoff: 'You read the times, so you got there first!', cap: 'You can plan a trip!', power: POW.plan }
  ];

  /* ---------------- helpers ---------------- */
  function h(tag, cls, text, attrs) {
    var a = attrs || {};
    if (cls) { a['class'] = cls; }
    if (text != null && text !== '') { a.text = text; }
    return RG.el(tag, a);
  }
  function shuffle(a) { return RG.shuffle ? RG.shuffle(a) : a.slice().sort(function () { return Math.random() - 0.5; }); }

  function seenKey(ctx) {
    var id = (ctx.profile && ctx.profile.id) || 'x';
    return 'rq_seen_' + id;
  }
  function loadSeen(ctx) {
    try { return JSON.parse(localStorage.getItem(seenKey(ctx)) || '[]') || []; } catch (e) { return []; }
  }
  function saveSeen(ctx, list) {
    try { localStorage.setItem(seenKey(ctx), JSON.stringify(list.slice(-40))); } catch (e) { /* ignore */ }
  }

  function chooseScenes(track, level, count, seen) {
    var pool = SCENES.filter(function (s) { return s.t === track && s.lv <= level; });
    if (pool.length < count) { pool = SCENES.filter(function (s) { return s.t === track; }); }
    var scored = pool.map(function (s) {
      // big track: prefer scenes right at his level, so levels 4-5 get the new multi-step scenes
      var gap = track === 'big' ? (level - s.lv) * 0.6 : (s.lv < level ? 1 : 0);
      return { s: s, sc: (seen.indexOf(s.id) >= 0 ? 2 : 0) + gap + Math.random() * 0.9 };
    }).sort(function (a, b) { return a.sc - b.sc; });
    var out = [], skins = {};
    scored.forEach(function (x) {
      if (out.length < count && !skins[x.s.skin]) { out.push(x.s); skins[x.s.skin] = 1; }
    });
    scored.forEach(function (x) {
      if (out.length < count && out.indexOf(x.s) < 0) { out.push(x.s); }
    });
    return out.sort(function (a, b) { return a.lv - b.lv; });
  }

  /* a small treasure map: n footprints along a winding path from the hut to the fort */
  function mapSvg(n) {
    var cols = 4, rows = 3, all = [], r, c, i;
    for (r = 0; r < rows; r++) { for (c = 0; c < cols; c++) { all.push([22 + (r % 2 ? (cols - 1 - c) : c) * 42, 22 + r * 34]); } }
    var pts = all.slice(0, Math.min(n + 1, all.length));
    var d = pts.map(function (p, k) { return (k ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join(' ');
    var out = '<svg viewBox="0 0 170 100" aria-hidden="true"><rect x="2" y="2" width="166" height="96" rx="12" fill="#bfe9a8" stroke="#6aa84f" stroke-width="3"/>' +
      '<path d="' + d + '" fill="none" stroke="#8a5a2b" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/>';
    for (i = 1; i < pts.length - 1; i++) { out += '<circle cx="' + pts[i][0] + '" cy="' + pts[i][1] + '" r="3.5" fill="#8a5a2b"/>'; }
    out += '<text x="' + pts[0][0] + '" y="' + (pts[0][1] + 6) + '" font-size="18" text-anchor="middle">🛖</text>';
    out += '<text x="' + pts[pts.length - 1][0] + '" y="' + (pts[pts.length - 1][1] + 6) + '" font-size="18" text-anchor="middle">🏰</text></svg>';
    return out;
  }

  /* ---------------- the game ---------------- */
  RG.registerGame({
    id: 'reading-quest',
    title: 'Reading Quest',
    emoji: '🗺️',
    tracks: ['little', 'big'],
    skill: 'real-world',
    blurb: 'Read the signs, notes and recipes to win each mission!',
    mount: function (container, ctx) {
      if (!document.getElementById(STYLE_ID)) {
        var st = document.createElement('style');
        st.id = STYLE_ID; st.textContent = CSS; document.head.appendChild(st);
      }
      var track = (ctx.profile && ctx.profile.track === 'big') ? 'big' : 'little';
      var little = track === 'little';
      var alive = true, timers = [], listeners = [];
      var seen = loadSeen(ctx);
      var total = ctx.rounds || 5;
      var scenes = chooseScenes(track, ctx.level || 1, total, seen);
      total = scenes.length;
      var wrap = h('div', 'rq-wrap');
      container.appendChild(wrap);

      var collected = [];
      var before = [];
      try { if (RG.superpowers && RG.superpowers.list) { before = (RG.superpowers.list() || []).map(function (p) { return p && p.id; }); } } catch (e) { before = []; }

      // per-round state
      var ri = -1, rid = 0, sc = null, misses = 0, done = false, locked = false, readDone = false;
      var selected = null, pos = 0, entries = [], slotEls = [], hearBtn = null, oopsEl = null, finished = false;

      function later(fn, ms) {
        var id = setTimeout(function () {
          var i = timers.indexOf(id); if (i >= 0) { timers.splice(i, 1); }
          if (alive) { fn(); }
        }, ms);
        timers.push(id);
        return id;
      }
      function on(el, ev, fn) { el.addEventListener(ev, fn); listeners.push([el, ev, fn]); }
      function say(t) {
        try { return Promise.resolve(RG.speak(t)).catch(function () {}); } catch (e) { return Promise.resolve(); }
      }
      function sfx(n) { try { RG.sfx[n](); } catch (e) { /* ignore */ } }

      function tipText() {
        if (sc.read === 'opts') { return 'Tap one to hear it, then press Go!'; }
        if (sc.kind === 'seq') { return 'Tap the card to hear it!'; }
        return 'Tap the card to hear it!';
      }
      function readText() {
        if (sc.read === 'opts') {
          return sc.opts.map(function (o, i) { return (i === 0 ? 'The first one says: ' : 'The next one says: ') + o.text + '.'; }).join(' ');
        }
        return 'Let me read it for you. ' + sc.lines.join(' ').replace(/\|/g, ',');
      }
      function spoken(lines) { return lines.join(' ').replace(/\|/g, ',').replace(/(\d+):(\d\d)/g, '$1 $2'); }
      /* after 2 misses: say the answer out loud, step by step */
      function modelText() {
        var ok, i;
        if (sc.kind === 'seq') {
          var labels = sc.order.map(function (id) { for (var k = 0; k < sc.items.length; k++) { if (sc.items[k].id === id) { return sc.items[k].label; } } return id; });
          return 'Let me show you. ' + spoken(sc.lines) + ' So tap ' + labels.join(sc.ordered === false ? ', and ' : ', then ') + '.';
        }
        for (i = 0; i < sc.opts.length; i++) { if (sc.opts[i].ok) { ok = sc.opts[i]; } }
        if (sc.read === 'opts') {
          if (ok.n != null) {
            var other = sc.opts.filter(function (o) { return !o.ok; })[0];
            return 'Let me show you. This map says ' + ok.n + ' steps. The other map says ' + (other ? other.n : 'more') + ' steps. ' + ok.n + ' is less, so this is the short way!';
          }
          return 'Let me show you. This one says ' + ok.text + '. ' + ok.text + '! That is the one.';
        }
        return 'Let me show you. ' + spoken(sc.lines) + ' So the answer is ' + (ok.label || '') + '!';
      }
      function setupSpeech() { return sc.setup + (little ? ' ' + tipText() : ''); }

      /* ---- card ---- */
      function cardEl() {
        var card = h('div', 'rq-card rq-card-' + sc.skin + (little ? '' : ' rq-nohear'));
        card.appendChild(h('div', 'rq-ctitle', sc.title));
        if (sc.skin === 'times') {
          var tb = h('table', 'rq-table');
          if (sc.head) {
            var hr = h('tr', '');
            sc.head.forEach(function (c) { hr.appendChild(h('th', '', c)); });
            tb.appendChild(hr);
          }
          sc.lines.forEach(function (l) {
            var tr = h('tr', '');
            l.split('|').forEach(function (c) { tr.appendChild(h('td', '', c.trim())); });
            tb.appendChild(tr);
          });
          card.appendChild(tb);
        } else {
          sc.lines.forEach(function (l) { card.appendChild(h('div', 'rq-line', l)); });
        }
        hearBtn = h('button', 'rq-hear' + (little ? '' : ' rq-hide'), '🔊', { type: 'button', 'aria-label': 'hear it' });
        on(hearBtn, 'click', function () { say(spoken(sc.lines)); });
        card.appendChild(hearBtn);
        if (little) { on(card, 'click', function (e) { if (e.target !== hearBtn) { say(spoken(sc.lines)); } }); }
        return card;
      }

      /* ---- pick scenes ---- */
      function optButton(o) {
        var b, inner;
        if (sc.skin === 'sign') {
          b = h('button', 'rq-opt rq-plank ' + (o.dir === 'l' ? 'l' : 'r'), '', { type: 'button' });
          if (little && o.emoji) { b.appendChild(h('span', 'rq-pe', o.emoji)); }
          b.appendChild(h('span', 'rq-pt', o.text));
        } else if (sc.skin === 'bottle') {
          b = h('button', 'rq-opt rq-bottle', '', { type: 'button', 'aria-label': 'bottle ' + o.text });
          b.style.setProperty('--liq', o.col || '#ff9f1c');
          inner = h('div', 'rq-blabel');
          if (little && o.emoji) { inner.appendChild(h('span', 'rq-be', o.emoji)); }
          inner.appendChild(document.createTextNode(o.text));
          b.appendChild(h('div', 'rq-cork')); b.appendChild(h('div', 'rq-neck'));
          var body = h('div', 'rq-body'); body.appendChild(inner); b.appendChild(body);
        } else if (sc.skin === 'maps') {
          b = h('button', 'rq-opt rq-mapbtn', '', { type: 'button', 'aria-label': o.text });
          b.innerHTML = mapSvg(o.n || 5);
          b.appendChild(h('span', 'rq-spl', o.text));
        } else if (sc.skin === 'plate') {
          b = h('button', 'rq-opt rq-plate' + (o.col === '#f4b400' ? ' dark' : ''), '', { type: 'button' });
          b.style.setProperty('--pc', o.col || '#d62828');
          if (o.emoji) { b.appendChild(h('span', 'rq-pe', o.emoji)); }
          b.appendChild(h('span', '', o.text));
        } else {
          b = h('button', 'rq-opt rq-spot', '', { type: 'button', 'aria-label': o.label });
          b.appendChild(h('span', 'rq-spe', o.emoji));
          if (!little) { b.appendChild(h('span', 'rq-spl', o.label)); }
        }
        b.setAttribute('data-ok', o.ok ? '1' : '0');
        return b;
      }

      function buildPick() {
        var art = h('div', 'rq-art');
        var holder;
        if (sc.read === 'opts') {
          holder = h('div', sc.skin === 'sign' ? 'rq-signpost' : (sc.skin === 'bottle' ? 'rq-shelf' : (sc.skin === 'maps' ? 'rq-mapgrid' : 'rq-plates')));
        } else {
          art.appendChild(cardEl());
          holder = h('div', 'rq-isle');
        }
        var opts = sc.opts.slice();
        opts.forEach(function (o) {
          var b = optButton(o);
          var ow = h('div', 'rq-ow');
          ow.appendChild(b);
          var go = null;
          if (little && sc.read === 'opts') {
            go = h('button', 'rq-go', '✔ Go!', { type: 'button' });
            ow.appendChild(go);
          }
          var entry = { o: o, ow: ow, btn: b };
          entries.push(entry);
          on(b, 'click', function () {
            if (locked || done) { return; }
            if (little && sc.read === 'opts') {
              entries.forEach(function (x) { x.ow.classList.remove('sel'); });
              ow.classList.add('sel'); selected = entry;
              say(o.text);
              return;
            }
            commit(entry);
          });
          if (go) { on(go, 'click', function () { if (!locked && !done) { commit(entry); } }); }
          holder.appendChild(ow);
        });
        art.appendChild(holder);
        return art;
      }

      function commit(entry) {
        if (entry.o.ok) { correct(entry.ow); } else { miss(entry.ow); }
      }

      /* ---- seq scenes ---- */
      function buildSeq() {
        var art = h('div', 'rq-art');
        art.appendChild(cardEl());
        var slots = h('div', 'rq-slots');
        slots.appendChild(h('span', 'rq-slotpre', sc.pre));
        slotEls = [];
        sc.order.forEach(function () { var s = h('div', 'rq-st', ''); slotEls.push(s); slots.appendChild(s); });
        art.appendChild(slots);
        var toks = h('div', 'rq-toks rq-toks-' + sc.skin + (sc.items.some(function (it) { return it.label.length > 8; }) ? ' rq-wide' : ''));
        sc.items.forEach(function (it) {
          var idx = sc.order.indexOf(it.id);
          var b = h('button', 'rq-tok', '', { type: 'button', 'aria-label': it.label });
          b.appendChild(h('span', 'rq-te', it.emoji));
          b.appendChild(h('span', 'rq-tl', it.label));
          b.setAttribute('data-seq', idx < 0 ? 'x' : (sc.ordered === false ? '0' : String(idx)));
          var ow = h('div', 'rq-ow'); ow.appendChild(b);
          var entry = { it: it, ow: ow, btn: b };
          entries.push(entry);
          on(b, 'click', function () { seqTap(entry); });
          toks.appendChild(ow);
        });
        art.appendChild(toks);
        return art;
      }

      function seqTap(entry) {
        if (locked || done || entry.btn.classList.contains('used')) { return; }
        var id = entry.it.id;
        var ok = sc.ordered === false ? sc.order.indexOf(id) >= 0 : sc.order[pos] === id;
        if (little) { say(entry.it.label); }
        if (!ok) { miss(entry.ow); return; }
        entry.btn.classList.add('used');
        var s = slotEls[pos];
        if (s) { s.textContent = entry.it.emoji; s.classList.add('full'); }
        pos++;
        sfx('pop');
        if (pos >= sc.order.length) { correct(entry.ow); } else { applyHint(); }
      }

      /* ---- hints and outcomes ---- */
      function applyHint() {
        entries.forEach(function (e) { e.ow.classList.remove('rq-hint'); });
        if (hearBtn) { hearBtn.classList.remove('rq-hint'); }
        if (misses < 2 || done) { return; }
        if (sc.kind === 'pick') {
          entries.forEach(function (e) { if (e.o.ok) { e.ow.classList.add('rq-hint'); } });
        } else {
          entries.forEach(function (e) {
            if (e.btn.classList.contains('used')) { return; }
            var want = sc.ordered === false ? sc.order.indexOf(e.it.id) >= 0 : sc.order[pos] === e.it.id;
            if (want) { e.ow.classList.add('rq-hint'); }
          });
        }
      }

      function showOops() {
        var list = (sc.oops && sc.oops.length) ? sc.oops : CRAB;
        var o = list[(misses - 1) % list.length];
        oopsEl = h('div', 'rq-oops');
        var fx = h('div', 'rq-fx');
        for (var i = 0; i < 6; i++) {
          var sp = h('span', '', o[0]);
          sp.style.left = (6 + i * 16) + '%';
          sp.style.animationDelay = (i * 0.3) + 's';
          fx.appendChild(sp);
        }
        oopsEl.appendChild(fx);
        oopsEl.appendChild(h('div', 'rq-oemoji', o[0]));
        oopsEl.appendChild(h('div', 'rq-otext', o[1]));
        wrap.appendChild(oopsEl);
        try { RG.speak(o[1], { mood: 'gentle' }); } catch (e) { /* ignore */ }
      }

      function miss(ow) {
        misses++; locked = true;
        try { ctx.answer(false); } catch (e) { /* ignore */ }
        try { RG.wobble(ow); } catch (e2) { /* ignore */ }
        showOops();
        var my = rid;
        later(function () {
          if (my !== rid) { return; }
          if (oopsEl && oopsEl.parentNode) { oopsEl.parentNode.removeChild(oopsEl); }
          oopsEl = null;
          locked = false;
          if (misses >= 2) {
            if (hearBtn) { hearBtn.classList.remove('rq-hide'); if (hearBtn.parentNode) { hearBtn.parentNode.classList.remove('rq-nohear'); } }
            if (!readDone) { readDone = true; say(modelText()); }
            applyHint();
          }
        }, 2400);
      }

      function correct(ow) {
        if (done) { return; }
        done = true; locked = true;
        try { ctx.answer(true); } catch (e) { /* ignore */ }
        ow.classList.remove('rq-hint'); ow.classList.add('rq-correct');
        try { RG.celebrate(ow); } catch (e2) { /* ignore */ }
        try { ctx.roundDone(); } catch (e3) { /* ignore */ }
        if (seen.indexOf(sc.id) < 0) { seen.push(sc.id); saveSeen(ctx, seen); }
        var p = sc.power;
        if (!collected.some(function (c) { return c.id === p[0]; })) {
          collected.push({ id: p[0], label: p[1], emoji: p[2], cap: sc.cap || 'You did it!' });
        }
        if (RG.superpowers) { try { RG.superpowers.add(p[0], p[1], p[2]); } catch (e4) { /* ignore */ } }
        var my = rid;
        later(function () { if (my === rid) { showAfter(); } }, 1100);
      }

      function showAfter() {
        wrap.innerHTML = '';
        var p = sc.power;
        var last = ri >= scenes.length - 1;
        var after = h('div', 'rq-after');
        after.appendChild(h('div', 'rq-parrot', '🦜'));
        after.appendChild(h('div', 'rq-payoff', sc.payoff));
        var card = h('div', 'rq-power');
        card.appendChild(h('span', 'rq-pe2', p[2]));
        var tx = h('div', '');
        tx.appendChild(h('div', 'rq-pcap', '🦸 Reading Superpower!'));
        tx.appendChild(h('div', '', little ? p[1] : (sc.cap || p[1])));
        card.appendChild(tx);
        after.appendChild(card);
        var nb = h('button', 'btn primary rq-next', little ? (last ? 'See my superpowers ▶' : 'Next mission ▶') : (last ? 'Go on ▶' : 'Go on ▶'), { type: 'button' });
        on(nb, 'click', function () { nb.disabled = true; nextRound(); });
        after.appendChild(nb);
        wrap.appendChild(after);
        var my = rid;
        var tail = little ? p[1] : (sc.cap || p[1]);
        ctx.onReplay = function () { say(sc.payoff + ' ' + tail); };
        try { RG.speak(sc.payoff, { mood: 'excited' }).then(function () { if (alive && my === rid) { return say(tail); } }); } catch (e5) { /* ignore */ }
      }

      /* ---- rounds ---- */
      function startScene(s) {
        rid++; sc = s; misses = 0; done = false; locked = false; readDone = false;
        selected = null; pos = 0; entries = []; slotEls = []; hearBtn = null; oopsEl = null;
        wrap.innerHTML = '';
        var narr = h('div', 'rq-narr');
        narr.appendChild(h('div', 'rq-parrot', '🦜'));
        var bub = h('div', 'rq-bubble', sc.setup);
        if (little) { bub.appendChild(h('span', 'rq-tip', tipText())); }
        narr.appendChild(bub);
        wrap.appendChild(narr);
        wrap.appendChild(sc.kind === 'seq' ? buildSeq() : buildPick());
        ctx.onReplay = function () {
          say(setupSpeech() + (misses >= 2 ? ' ' + readText() : ''));
        };
        say(setupSpeech());
      }

      function nextRound() {
        ri++;
        if (ri >= scenes.length) { finale(); } else { startScene(scenes[ri]); }
      }

      function finale() {
        rid++;
        wrap.innerHTML = '';
        var box = h('div', 'rq-final');
        box.appendChild(h('div', 'rq-parrot', '🦜'));
        box.appendChild(h('h2', '', little ? '🦸 Your Reading Superpowers!' : '🦸 You did it!'));
        var grid = h('div', 'rq-powers');
        collected.forEach(function (c) {
          var card = h('div', 'rq-power');
          card.appendChild(h('span', 'rq-pe2', c.emoji));
          var tx = h('div', '', little ? c.label : c.cap);
          if (before.indexOf(c.id) < 0) { tx.appendChild(h('span', 'rq-new', 'NEW')); }
          card.appendChild(tx);
          grid.appendChild(card);
        });
        box.appendChild(grid);
        var totalUnlocked = collected.length;
        try {
          if (RG.superpowers && RG.superpowers.list) { totalUnlocked = Math.max(totalUnlocked, (RG.superpowers.list() || []).length); }
        } catch (e) { /* ignore */ }
        box.appendChild(h('div', 'rq-payoff', !little ? 'Yes! You can read to win!' : 'You have ' + totalUnlocked + ' reading superpower' + (totalUnlocked === 1 ? '' : 's') + '! Reading helps you find, cook, stay safe and share secrets.'));
        var fb = h('button', 'btn primary rq-next', '⚓ Finish', { type: 'button' });
        on(fb, 'click', function () {
          if (finished) { return; }
          finished = true; fb.disabled = true;
          ctx.finish();
        });
        box.appendChild(fb);
        wrap.appendChild(box);
        var line = !little ? 'Yes! You can read to win! ' + collected.map(function (c) { return c.cap; }).join(' ') : 'You collected ' + collected.length + ' reading superpower' + (collected.length === 1 ? '' : 's') + '. ' +
          collected.map(function (c) { return c.label; }).join(' ') + ' Reading is a real superpower!';
        ctx.onReplay = function () { say(line); };
        try { RG.sfx.win(); RG.celebrate(); } catch (e2) { /* ignore */ }
        say(line);
      }

      nextRound();

      return function cleanup() {
        alive = false;
        timers.forEach(function (t) { clearTimeout(t); });
        timers = [];
        listeners.forEach(function (l) { try { l[0].removeEventListener(l[1], l[2]); } catch (e) { /* ignore */ } });
        listeners = [];
        try { RG.stopSpeaking(); } catch (e) { /* ignore */ }
        try { ctx.onReplay = null; } catch (e1) { /* ignore */ }
        try { container.innerHTML = ''; } catch (e2) { /* ignore */ }
      };
    }
  });
})();
