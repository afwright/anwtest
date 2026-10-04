# Treasure Island Readers — Build Plan & Interface Contract

A play-based reading game for two kids: a **4-year-old (pre-reader)** and a **7-year-old (early reader)**.
Theme: a sailing adventure. Each child captains a boat, sails to islands (mini-games), and collects
treasure (stars, stickers) for every completed voyage.

## Pedagogy (why it's built this way)

| Track | Child | Skills (in order) | Research basis |
|---|---|---|---|
| `little` | 4 yo | letter names → letter sounds → beginning sounds → rhyme awareness → letter formation | Phonological awareness and alphabet knowledge are the two strongest predictors of later reading |
| `big` | 7 yo | CVC decoding → digraphs/blends → Dolch sight words → sentence comprehension → short stories | Systematic phonics + fluency + comprehension (the "Science of Reading") |

Design rules for every game:
1. **Audio first.** Every prompt is spoken aloud (Web Speech API). Every tappable word/letter speaks itself when tapped. A 🔊 "say it again" button is always visible.
2. **No fail states.** A wrong answer gets a gentle wobble + "Try again!" and the right answer is hinted after 2 misses. Never subtract points.
3. **Short sessions.** One voyage = 5 rounds (about 2–4 minutes). Then a treasure screen.
4. **Adaptive.** The core tracks per-skill accuracy; `ctx.level` (1–3) rises after mastery and drops after struggle. Games scale difficulty from it.
5. **Touch-first.** Targets ≥ 72px, no hover-dependence, drag uses Pointer Events (HTML5 drag-and-drop does not work on iPad).

## Tech constraints (all agents)

- Plain HTML/CSS/JS, **no build step, no frameworks, no ES modules** (must work from `file://` and as a static page). Use classic `<script>` tags and IIFEs.
- No external network resources (no CDNs, no web fonts, no image files). Visuals = emoji + CSS + inline SVG.
- Must work in Safari iPad, Chrome Android, and desktop Chrome. Responsive from 360px wide to desktop.
- `localStorage` wrapped in try/catch everywhere (game must still run if it throws).
- Speech: iOS needs a user gesture before `speechSynthesis` works. The app's "Tap to start" screen handles that.
- Colors as CSS custom properties on `:root`. Bright, friendly, high-contrast. Font: `"Comic Sans MS", "Chalkboard SE", "Comic Neue", system-ui, sans-serif`, with a big base size.
- For reading text, use lowercase by default (as early-reader books do) except where capitals are being taught.

## File layout & ownership

```
reading-game/
  index.html            [CORE agent]  shell; loads scripts in this exact order:
                                       js/content.js, js/core.js, js/games/*.js (listed below), js/app.js
  css/style.css         [CORE agent]  global styles + shared component classes (below)
  js/content.js         [CORE agent]  shared word/letter/story data (schema below)
  js/core.js            [CORE agent]  window.RG API (contract below)
  js/app.js             [CORE agent]  start screen, profile picker, island map hub, game host, treasure screen, grown-ups panel
  js/games/letter-pop.js     [LITTLE agent]
  js/games/sound-hunt.js     [LITTLE agent]
  js/games/letter-trace.js   [LITTLE agent]
  js/games/rhyme-boat.js     [LITTLE agent]  (tracks: little + big)
  js/games/word-builder.js   [BIG agent]
  js/games/sight-fishing.js  [BIG agent]
  js/games/sentence-match.js [BIG agent]
  js/games/story-cove.js     [BIG agent]
```

Game agents may write ONLY their own game files. Game-specific data can live inside the game file;
shared data comes from `RG.content`.

## `window.RG` contract (implemented in core.js)

```js
RG.games                       // array of registered game defs, in registration order
RG.registerGame(def)           // def shape below; called at script load time by each game file

// --- speech ---
RG.speak(text, opts?) -> Promise<void>    // opts: {rate=0.85, pitch=1.1}; cancels any current utterance first;
                                          // resolves on end (or after a timeout fallback if speech is unavailable)
RG.sayLetter(letter) -> Promise           // speaks the letter NAME, e.g. "bee"
RG.sayLetterSound(letter) -> Promise      // speaks the phonics hint, e.g. "b says buh, like ball"
                                          // (uses RG.content.letters[].sound + .word)
RG.stopSpeaking()

// --- feedback ---
RG.sfx.correct(); RG.sfx.wrong(); RG.sfx.pop(); RG.sfx.win()   // short WebAudio tones, no audio files
RG.celebrate(targetEl?)        // confetti/emoji burst over the screen (or from targetEl)
RG.wobble(el)                  // gentle shake animation for wrong answers
RG.praise() -> string          // random: "Great job!", "You did it!", "Awesome reading!", ...  (also spoken by caller if desired)

// --- helpers ---
RG.el(tag, attrs?, ...children) -> HTMLElement  // attrs: {class, text, html, style, on:{click:fn}, ...dataset/aria/other attrs}
RG.shuffle(arr) -> new array
RG.pick(arr, n) -> n random distinct items (new array)
RG.sample(arr) -> one random item
RG.wait(ms) -> Promise
RG.emojiFor(word) -> string | ''          // lookup in RG.content.emoji
RG.makeDraggable(el, {onDrop(el, dropTarget) , dropTargets: () => Element[]})
                                          // Pointer-Events drag; on release over a target calls onDrop, else snaps back

// --- progress (per active profile, persisted in localStorage) ---
RG.profile() -> {id, name, track: 'little'|'big', avatar}
RG.progress.record(skillId, correct:boolean)   // updates rolling accuracy (last 10 attempts)
RG.progress.level(skillId) -> 1|2|3            // starts 1; up when last 8 ≥ 85% correct; down when < 50%
RG.progress.stars() -> number
```

### Game definition & lifecycle

```js
RG.registerGame({
  id: 'letter-pop',             // unique, matches filename
  title: 'Letter Pop',
  emoji: '🎈',                  // island icon on the map
  tracks: ['little'],           // which profiles see it on the map
  skill: 'letters',             // skillId used for RG.progress
  blurb: 'Pop the balloon with the letter you hear!',   // spoken when island is tapped
  mount(container, ctx) {       // container: empty <div class="game-stage"> sized to the play area
    // build UI inside container, run rounds...
    return function cleanup() { /* remove timers/listeners, RG.stopSpeaking() */ };
  }
});
```

`ctx` provided by app.js:
```js
ctx.level        // 1|2|3 from RG.progress.level(def.skill) at mount time
ctx.rounds       // 5
ctx.profile      // RG.profile()
ctx.answer(correct:boolean)   // call once per ATTEMPT; records progress + plays sfx. Does not advance rounds.
ctx.roundDone()  // call when a round is finished (after the correct answer); updates the 5-dot progress bar
ctx.finish()     // call after the last round; app shows the treasure screen (stars awarded = rounds) and unmounts
ctx.exit()       // abandon to map (the app also renders its own ⬅ back button outside the container)
```
The app renders the header (back button, 🔊 replay button, 5-dot round tracker) **outside** `container`.
The 🔊 button calls `ctx.onReplay` if the game sets it: `ctx.onReplay = () => RG.speak(currentPrompt)`.

## Shared CSS classes (style.css, available to all games)

- `.game-stage` — flex column, centered, fills play area
- `.prompt` — big friendly prompt text (≈ 2rem)
- `.choices` — responsive flex-wrap grid of choice buttons, gap 16px
- `.choice` — big rounded tappable card (min 88×88px, ≈ 2.5rem text), white bg, thick colored border, press animation
- `.choice.correct` (green glow), `.choice.wrong` (wobble), `.choice.hint` (pulsing glow)
- `.big-emoji` — ≈ 5rem emoji display
- `.word` — reading-text style (large, wide letter spacing, lowercase)
- `.slot` — empty drop slot (dashed border, same size as `.choice`)
- `.btn` / `.btn.primary` — standard buttons
- `.wobble`, `.bounce`, `.float` — animation utilities

## `RG.content` schema (content.js)

```js
RG.content = {
  letters: [ {letter:'a', sound:'ah', word:'apple', emoji:'🍎'}, ... all 26, short vowel sounds, simple
             speakable sounds: b:'buh', c:'kuh', ... x:'ks', q:'kwuh' ],
  cvcWords: [ {word:'cat', emoji:'🐱'}, ... ≥ 45 picturable CVC words covering all 5 short vowels ],
  digraphWords: [ {word:'ship', emoji:'🚢', pattern:'sh'}, ... ≥ 20 across sh, ch, th, wh, ck, and blends
                  (fr, st, sn, tr, fl, cl, gr, bl) ],
  rhymeFamilies: { at:['cat','hat','bat','mat','rat'], og:['dog','log','frog'], ... ≥ 8 families,
                   every word picturable and present in RG.content.emoji },
  sightWords: { level1:[...Dolch pre-primer], level2:[...primer], level3:[...first grade] },
  sentences: [ {text:'the cat sat on a mat.', emoji:'🐱', distractors:['🐶','🐸'], level:1}, ...
               ≥ 8 per level 1–3; level 1 = CVC + sight words, level 3 = two short sentences ],
  stories: [ { title:'Sam and the Big Fish', level:1, pages:[{text:'sam has a red boat.', emoji:'⛵'}, ...4–6 pages],
               questions:[{q:'what color is the boat?', options:['red','blue','green'], answer:'red'}, ...2–3] },
             ... ≥ 6 stories, 2 per level, sailing/sea/animal themes ],
  emoji: { cat:'🐱', hat:'🎩', ... every picturable word used anywhere above }
};
```

## Game specs

### LITTLE track (4 yo)
- **letter-pop** 🎈 (skill `letters`): balloons with letters float up; voice says "Find the letter B!". Tap the right balloon → pop + celebrate. L1: 3 balloons, uppercase, letters from a starter set (s a t p i n m d). L2: 4 balloons, all letters. L3: 5 balloons, lowercase, with "letter sound" prompts ("Find the letter that says buh").
- **sound-hunt** 🔍 (skill `beginning-sounds`): show a big emoji picture (from `letters[].emoji` / cvcWords); voice: "Ball. What sound does ball start with?" Choose from letter cards (tapping a card says its sound). L1: 2 choices, L2: 3, L3: 4 including similar sounds (b/d/p).
- **letter-trace** ✏️ (skill `writing`): big dotted letter guide drawn on a canvas; the child traces it with a finger and leaves a colorful sparkle trail. Track coverage of guide points (generous tolerance); ≥ 70% coverage → celebrate. Speak the letter name + sound before and after. L1 uppercase straight-line letters (L, T, I, E, F, H), L2 all uppercase, L3 lowercase.
- **rhyme-boat** ⛵ (skill `rhyme`, tracks little+big): a boat shows a picture word ("cat"); 3 picture cards on the dock; "Which one rhymes with cat?" Tap or drag the rhyming one into the boat. For `big` profile, show the written word under each picture and use L2+ distractors that share a first letter.

### BIG track (7 yo)
- **word-builder** 🧱 (skill `phonics`): show an emoji + speak the word ("Build the word: fish"). Letter tiles (shuffled, plus 1–2 extra distractor letters) are dragged into slots (use `RG.makeDraggable`; also support tap-a-tile → it fills the next empty slot). Tapping a tile says its sound. L1 CVC, L2 digraphs/blends, L3 CVCe/longer words (e.g. cake, bike, rope, frog, crab, ship, chest).
- **sight-fishing** 🎣 (skill `sight-words`): fish swim across a sea with words on them; voice: "Catch the word the!" Tap the right fish → it jumps into the bucket. Levels map to sightWords.level1–3. 4–5 fish swimming at a time, CSS animation, slow speed.
- **sentence-match** 🖼️ (skill `comprehension`): show a sentence (each word tappable to hear it; a "read it to me" button reads the whole sentence but only after the child has had about 5 seconds to try first); pick the matching picture from 3 emoji. Uses `RG.content.sentences` filtered by level.
- **story-cove** 📖 (skill `fluency`): a page-turning storybook from `RG.content.stories` by level. Each page: big emoji illustration + text; words are tappable (speak the word); a "🔊 read page" button highlights words karaoke-style as they are spoken (onboundary events with a timer fallback). After the last page, 2–3 comprehension questions (each counts as a round; pad to 5 rounds by counting each page turn as a round if needed, i.e. call roundDone so the 5-dot tracker fills sensibly across the voyage).

## App shell (app.js) behavior
1. **Start screen:** big "Tap to start ⛵" (unlocks speech/audio on iOS).
2. **Profile picker:** two default captains, "Little Captain" (track little, avatar 🐣) and "Big Captain" (track big, avatar 🦊). Grown-ups can rename them and change the avatar and track in the grown-ups panel.
3. **Island map:** an ocean background with islands (game emojis) for that profile's track, laid out on a gently wavy path; star count + treasure chest display; the profile's boat bobs. Tapping an island speaks its blurb and launches it.
4. **Game host:** header with ⬅ back, 🔊 replay, 5-dot round tracker; then `div.game-stage` passed to `mount`.
5. **Treasure screen:** after `ctx.finish()`: chest opens, +5 stars, an awarded random sticker (sea-creature emoji) added to the profile's sticker book; buttons "Play again" / "Back to map".
6. **Sticker book:** a page on the map showing collected stickers (motivation loop).
7. **Grown-ups panel** (gear icon; gate: "hold for 3 seconds"): rename profiles, pick avatar, switch track, speech rate slider, per-skill accuracy + level table, reset progress.

## Definition of done
- Opening `reading-game/index.html` in Chromium shows no console errors; every game can be launched, played to completion (5 rounds), and returns to the map.
- Works at 390×844 (phone) and 1024×768 (iPad) with no horizontal scroll.

---

# ADDENDUM v2 — "Why Reading Matters", Quizzes, and Points (BINDING, supersedes above where it conflicts)

## North star
The game must teach **why** reading is important, not just **how** to read. Every child should repeatedly
feel: *"Because I could read that, I got something / helped someone / stayed safe / had fun."*
Reading is the key that unlocks the island. Points reward what reading *achieves*, not reading itself
(avoids the overjustification trap where kids read only for points).

## Points: Gold Coins 🪙 (core.js / app.js — CORE agent)
```js
RG.coins.balance() -> number          // per profile, persisted
RG.coins.add(n, reason?)              // animates a coin burst + counter tick-up in the header
RG.coins.spend(n) -> boolean          // false if insufficient
RG.rank() -> {name, emoji, next, coinsToNext}   // by lifetime coins earned:
   // 0 Deckhand 🧽, 50 Sailor ⚓, 150 First Mate 🧭, 350 Captain 🏴‍☠️, 700 Admiral 👑
```
- `ctx.answer(correct)` automatically awards coins: **3 for a first-try correct, 1 for a later correct, 0 for wrong (never subtract)**.
- Finishing a voyage (`ctx.finish()`) awards a +5 coin bonus on the treasure screen (stars still awarded as before).
- New optional def field `rounds` (number). If set, `ctx.rounds = def.rounds`, otherwise 5. The header round tracker must render `ctx.rounds` dots.
- New `ctx.award(n, reason)` = `RG.coins.add` for game-specific bonuses (e.g. a quiz perfect-score bonus).
- **Harbor Shop** 🏪 (on map): spend coins on boat colors, sails, flags, pets (a parrot or cat on deck) and hats for the avatar. Bought items show on the map boat. Around 12 items, priced 20–200.
- **Rank badge** on the map + rank-up celebration ("You're now a First Mate!").
- Grown-ups panel: show lifetime coins, quiz history (date, score/total, per-skill breakdown).

## Quizzes & tests (new game file — QUEST agent)
**captains-quiz** 🏆 (`js/games/captains-quiz.js`, skill `quiz`, tracks little+big, `rounds: 10`):
- A mixed 10-question test drawing on every skill for the profile's track, generated from RG.content.
  - little: letter ID, letter sound, beginning sound, rhyme, "which sign says STOP?" (picture-supported).
  - big: decode a word → pick the picture, sight word, missing word in a sentence, rhyme, a short-passage comprehension question, a real-world reading question.
- One attempt per question (it's a test): `ctx.answer(correct)` once, then reveal the right answer kindly, then `ctx.roundDone()`.
- End screen *inside the stage* before `ctx.finish()`: score X/10, a trophy tier (🥉 6+, 🥈 8+, 🥇 10), bonus `ctx.award` (10 for 🥇, 5 for 🥈, 2 for 🥉), and "Skills to practice" (which islands to revisit, mapped from missed question types). Persist the result via `RG.quizLog.add({date, track, score, total, bySkill:{skill:[right,total]}})` (CORE implements RG.quizLog.add/list, persisted per profile).
- Framing is always low-stakes: "Captain's Challenge", never "test" or "grade" in kid-facing text.

## "Why Read?" missions (new game file — QUEST agent)
**reading-quest** 🗺️ (`js/games/reading-quest.js`, skill `real-world`, tracks little+big, rounds 5):
Story-driven scenes where reading is *necessary* to succeed, and the consequence of reading (or not) is shown playfully.
Each scene: a short narrator setup, a piece of real-world text, a choice; the payoff explicitly names why reading helped
("You read the sign, so you found the treasure! Readers find things other people miss.").
Scene types (≥ 15 scenes total, tagged by track/level):
- **Signposts:** a fork in the path with two signs ("treasure →", "← crabs"). Read correctly → treasure; wrong → silly crab pinch, then try again.
- **Safety labels:** two bottles on a ship shelf, "juice" vs "soap", or a door marked "hot", "stop", "danger". Reading keeps you safe.
- **Recipe:** the ship's cook needs help making pancakes; read the recipe card and pick the ingredients in order (cooking).
- **Message in a bottle:** a friend's note ("meet me at the big tree") → go to the right place on a mini-map.
- **Shopping list / market:** read a list and buy the right items at the harbor market.
- **Treasure map directions:** "go past the rock, then dig by the palm" → tap in order.
- **Menu / tickets / names:** read the name on a parcel to deliver it to the right animal.
- little track: 1–2 word signs with picture support, read aloud on tap; the "why" is said by the narrator. big track: phrases and short sentences.
- After each scene, a one-line "Reading Superpower" card (e.g. "🦸 Readers stay safe!", "🦸 Readers can cook!", "🦸 Readers get secret messages!"). The superpowers collected are shown at the end of the voyage.

## Map changes (CORE)
- Islands order: reading-quest and captains-quiz appear on both tracks. captains-quiz is drawn as a special "Challenge Island" at the end of the path.
- A "Why Read?" scroll on the map that lists the Reading Superpowers the child has unlocked (`RG.superpowers.add(id, label, emoji)` / `.list()`, persisted per profile, implemented by CORE, used by reading-quest).

---

# ADDENDUM v3: Full screen, expressive voice, Challenge Island flow (BINDING)

## 1. Full screen on tablets
- A ⛶ full-screen toggle button on the map toolbar and in the game header (icon flips to exit when active).
- "Tap to start" also tries to enter full screen, since it is a user gesture, when `RG.settings.autoFullscreen` is on (default true).
- Use `document.documentElement.requestFullscreen` with the `webkitRequestFullscreen` fallback, and listen for `fullscreenchange` / `webkitfullscreenchange`. Wrap every call in try/catch and handle promise rejection silently.
- If full screen is unsupported or rejected (iPhone Safari, sandboxed iframes): show a one-time friendly toast with the right instructions. On iOS Safari that is "Share → Add to Home Screen". Hide the toggle when `fullscreenEnabled`/`webkitFullscreenEnabled` is false.
- Full screen must survive navigation between screens; the app re-renders inside `#app`, never reloading. Re-check the layout in full screen at 1024x768 and 768x1024.
- Grown-ups panel: an "Open in full screen on start" toggle.

## 2. Expressive voice (core.js RG.speak)
The Web Speech API has no emotion control; we can only control **voice choice, pitch, rate, volume, and phrasing**. Use all of them:
- **Voice ranking:** auto-pick the best natural English voice. Prefer names containing "Natural", "Neural", "Premium", "Enhanced" or "Online", and Google voices; known good voices include Samantha (Enhanced), Ava (Premium), Zoe, Evan, Microsoft Aria/Jenny/Guy Online (Natural) and Google US English. Then prefer en-US, then any en. Avoid novelty voices (Albert, Bad News, Bells, Boing, Bubbles, Cellos, Good News, Jester, Organ, Superstar, Trinoids, Whisper, Wobble, Zarvox, Fred, Junior, Ralph, Kathy). The grown-ups voice picker lists only English voices, best first, with a ▶ test button that speaks an expressive sample.
- **Moods:** `RG.speak(text, {mood})`, where mood is one of `excited | happy | gentle | question | story | calm`. Each mood maps to base pitch/rate/volume. Excited is higher pitch and a bit faster. Gentle (used for "Try again") is softer and slower. Story is warm, with a varied cadence.
- **Auto-mood when none is given:** `!` → excited, `?` → question, and text starting with "Try again"/"Oops"/"Good try" → gentle.
- **Phrasing:** split text into sentences/clauses and speak them as a queue of utterances. Vary pitch per chunk (a question rises on its last chunk; an exclamation gets a pitch lift) with small random jitter (±0.05 pitch, ±0.04 rate) so repeated praise never sounds identical. Pause between chunks: about 120 ms after commas and 250 ms after sentence ends.
- `RG.speak` keeps its contract: it cancels prior speech, returns a Promise that resolves when the WHOLE queue ends (with the timeout fallback), and `opts.rate` / `opts.pitch` / `opts.onboundary` still work. When `onboundary` is passed (story karaoke), speak as ONE utterance so word offsets stay valid.
- **Praise variety:** expand `RG.praise()` to 20+ lines with interjections ("Woohoo!", "Yes! Nailed it!", "Shiver me timbers, that's right!", "High five, Captain!"). Speak praise with mood `excited`.
- Update the game files' calls where a mood clearly fits. Wrong-answer prompts use `gentle`. Story Cove may use `story` for its non-karaoke prompts. Don't restructure the games.
- Grown-ups panel: an "Expressive voice" toggle (default on). Off means the old flat delivery.

## 3. Recommended islands are clickable after Captain's Challenge
- The quiz's "Islands to practice" items become big tappable buttons, filtered to games that exist on the current profile's track.
- Tapping one calls `ctx.finish({ next: gameId })`. The app awards the normal treasure (stars, sticker, +5 coins), and the treasure screen's primary button becomes "⛵ Sail to <Island>", which launches that game. "Back to map" stays.
- Plain "Finish" still calls `ctx.finish()` with no next.
- Persist the latest recommendations per profile: `RG.progress.setRecommended([ids])` and `.recommended()`. On the map, recommended islands show a pulsing "Practice me!" flag until that island's next completed voyage.

## 4. Challenge Island locked until the other islands are done
- New persisted per-profile `RG.progress.markComplete(gameId)` and `RG.progress.completed(gameId)` (a count of finished voyages); app.js calls `markComplete` in the finish → treasure path.
- captains-quiz is **locked** until every other island on the profile's track has at least one completed voyage. While locked:
  - the island is drawn grey/misty with a 🔒 and a "3 of 6" progress badge;
  - tapping it speaks (gently) "Finish all the other islands first! Just N more to go." and gently pulses the not-yet-done islands;
  - the not-yet-done islands show a small ✨ "new" marker.
- When it first unlocks (on return to the map after the final voyage), play a short unlock celebration ("The Challenge Island is open!"). It stays unlocked forever.
- Grown-ups panel: an "Unlock Challenge Island now" override toggle per profile.

---

# ADDENDUM v4: Grade-matched difficulty (BINDING)
Players: Big Captain is a **2nd grader**; Little Captain is a 4-year-old (pre-K).
Problems found in v3: the big track starts at kindergarten and tops out at mid-1st grade; every profile starts at level 1;
the word-builder L2 list contains vowel-team words that haven't been taught yet; and a 10-question quiz is too long for a 4-year-old.

## 1. Levels 1–5 for big-track skills
- `RG.progress.level(skill)` returns 1..`maxLevel(skill, track)`. Big-track skills (`phonics`, `sight-words`, `comprehension`, `fluency`, `real-world`, `quiz`) go to **5**; little-track skills stay at **3**; `rhyme` is 3 for little and 4 for big.
- The promotion/demotion rule is unchanged. Migrate stored data safely.
- Games must handle `ctx.level` up to 5. A game without content for a level uses its highest available level.

## 2. Content by level (big track); every picturable word needs an emoji, and each word may only use patterns taught at or below its level
| Level | phonics (word-builder) | sight-words (Dolch) | comprehension (sentence-match) | fluency (story-cove) |
|---|---|---|---|---|
| 1 | CVC + sh/ch/th/ck (ship, duck, chin) | primer | 1 sentence, CVC + sight words | 25–40 words, literal questions |
| 2 | blends + silent e (frog, crab, cake, kite, rope) | first grade | 1–2 sentences | 40–60 words |
| 3 | vowel teams as ONE tile: ai, ay, ee, ea, oa, ow(snow), oo (rain, tray, seed, leaf, boat, snow, moon) | **second grade** (always, around, because, been, before, best, both, buy, call, cold, does, don't, fast, first, five, found, gave, goes, green, its, made, many, off, or, pull, read, right, sing, sit, sleep, tell, their, these, those, upon, us, use, very, wash, which, why, wish, work, would, write, your) | 2 sentences | 60–100 words; one "why" question |
| 4 | r-controlled (ar, or, er, ir, ur) + diphthongs (oi, oy, ou, ow-cow) as one tile (star, fork, bird, turtle?, coin, boy, house, cow) | **third grade** (about, better, bring, carry, clean, cut, done, draw, drink, eight, fall, far, full, got, grow, hold, hot, hurt, if, keep, kind, laugh, light, long, much, myself, never, only, own, pick, seven, shall, show, six, small, start, ten, today, together, try, warm) | 2–3 sentences; vowel teams/r-controlled | 100–150 words; questions on why, sequence and word meaning |
| 5 | endings (-ing, -ed, -s with no spelling change) + compound/two-syllable words (sunset, rainbow, starfish, cupcake, jumping, sailboat, popcorn, seashell) as syllable/chunk tiles | mixed 2nd–3rd grade + Fry 101–200 | a short paragraph whose picture match needs **inference** (e.g., "Mia zipped her coat. Flakes fell all night." → ❄️) | 150–220 words; inference + "what might happen next" |

- Re-sort the existing lists. Move cheese, sheep, three, tree, wheel, tooth, spoon, train, snail, cloud, flower, grapes and star to their correct levels (3 or 4), or drop any that don't fit.
- **Serial story (why reading is fun):** add "The Secret of Gull Island", a 5-chapter Captain Penny adventure at levels 4–5. Each chapter ends on a cliffhanger, and the next chapter unlocks only by finishing the previous one. Show it in story-cove as a "Chapter book" shelf with locked chapters. Use `RG.progress` to persist the chapters read.
- reading-quest big track: add at least 6 scenes for levels 4–5 with multi-step instructions, a ferry timetable ("which boat leaves first?"), a recipe with amounts, a two-item comparison ("which map shows the shortest way?") and a letter that requires inference.
- captains-quiz (big): draw each question from the player's current level for that skill (min 2, so it's never trivial).

## 3. Placement: "Captain's Check-in"
- Runs the first time a profile opens the map (and from the grown-ups panel via "Re-run check-in"). Grown-ups can skip it.
- It is a playful, game-framed ladder: never "wrong", and stop a ladder after 2 misses at a rung.
  - big: decoding ladder (pick the picture for: cat → crab → cake → rain → bird → jumping), sight words (one each from the primer through third-grade lists), and one level-3 sentence.
  - little: name 4 uppercase letters, 2 letter sounds, 1 rhyme.
- Each skill starts at the highest rung passed (2/2 correct), capped at track max. Unmeasured skills follow phonics.
- Grown-ups panel: a per-skill level override (− / +).

## 4. Little track tweaks
- captains-quiz on the little track is **6** questions. `def.rounds` may be a number or `function(profile) -> number`; app.js resolves it at launch.

## v4.1 AMENDMENT: Big Captain is a 2nd grader reading BELOW grade level (BINDING, overrides v4 where it conflicts)
Design for a struggling reader: content he can decode, but with interests matched to his age, many successes, and no shame.

**Hi-lo content (high interest, low reading level).** Levels 1–3 content must not feel babyish. Use themes a 7–8-year-old respects: sharks, pirates, storms, shipwrecks, sea monsters, robots, treasure, video-game-style challenges, cooking disasters. Big Captain's screens have no baby imagery. Stories at L1–2 are short but genuinely funny or exciting.

**Never show level or grade to the child.** No "Level 1", "grade", or "easy/hard" labels anywhere kid-facing. Levels appear only in the grown-ups panel. The profile picker and map never compare the two siblings (no coin, star or rank totals on the picker), because a younger sister catching up is a real risk to his motivation.

**Strictly decodable text.** Every word in a sentence, story or quest text at level N must be decodable using the patterns taught at levels ≤ N, or be in the sight-word lists of levels ≤ N, or be a story name listed in that item's `names` array. Replace current non-decodable words (e.g. "carried", "worry", "friend" at low levels). Add `tools/check-decodable.js` (node), which validates all content and lists violations, and make it pass.

**Explicit phonics support.**
- word-builder: a 🐢 "Sound it out" button that highlights each tile in turn while speaking its sound, then blends ("sss… ah… t… sat!").
- After 2 misses, don't just pulse a hint. Model the answer explicitly ("This says rain: r… ai… n. Rain!"), then let him build it.
- Vowel teams, digraphs and r-controlled patterns appear as one colored tile in a consistent color per pattern type.

**Tricky Words (spaced review).** Every word missed in any big-track game goes into a per-profile Tricky Words list (`RG.progress.tricky`). Each voyage of word-builder, sight-fishing and the quiz mixes in 1–2 tricky words. A word leaves the list after it is correct on 3 different days. The grown-ups panel shows the current list for offline practice.

**Fluency: repeated and echo reading in story-cove.**
- Each page offers 🔊 "Listen" (karaoke), then 🎤 "My turn" (he reads aloud; there is no mic and no scoring, just a "Done!" button), then praise.
- Rereading an already-finished story earns a "Smooth Sailor" badge on its 2nd and 3rd read, because repeated reading is the evidence-based fluency builder.
- Optional "Beat your time" mode is OFF by default and can be enabled in the grown-ups panel.

**Tuned for success.**
- Big-track promotion stays at ≥85% of the last 8. Demotion happens when below 60% of the last 6, so frustration is caught faster.
- Placement starts at the bottom of the ladder with finer rungs (cat → ship → frog → cake → rain → star → jumping). Place at the highest rung passed 2/2, then **one rung lower**, so the first sessions feel easy.

**Growth, not grades.**
- Kid-facing celebration compares him only to himself: "You learned 6 new words this week!" and "You read 3 stories!"
- Grown-ups panel: a weekly summary of words mastered, Tricky Words, time played and estimated level per skill, with a plain-language "what to practice at home" note.

## v4.2 AMENDMENT: Target his two specific weak spots (BINDING)
The parent reports Big Captain struggles with **(a) consonant combinations** and **(b) long words**.

### New island: blend-cannon 💣 (`js/games/blend-cannon.js`, skill `blends`, track big, levels 1–5)
The typical error is **dropping a consonant from a blend** (frog → "fog", stop → "top", lamp → "lap"). The game drills exactly that.
- **Mode A, Hear it:** an emoji picture is spoken ("frog"). Elkonin sound boxes appear (one box per sound), and he taps a box for each sound he hears (f-r-o-g = 4 boxes). This is the phonemic awareness that underpins blends.
- **Mode B, Read it (main mode):** a picture plus 3 word choices that are minimal pairs differing by the blend consonant (frog / fog / fig; lamp / lap / lamb). Fire the cannon at the right word.
- **Mode C, Build it:** a rime target (-op) and cannonballs with blends (st, fl, dr, cr, ch). Fire the blend that makes the picture word (stop 🛑, drop 💧); use only picturable targets.
- Level progression: L1 initial l-blends and s-blends (fl, sl, pl, st, sp, sn, sw); L2 r-blends (fr, tr, dr, cr, gr, br); L3 final blends (-nd, -nt, -mp, -st, -sk, -ft, -lk) plus digraph review (sh, ch, th, ck, -ng, -nk); L4 3-letter clusters (str, spl, spr, scr, squ, thr, shr) and -tch; L5 blends at both ends (stamp, frost, crust, splint).
- Blend letters render as linked tiles (two letters, one tile, a shared underline) with a consistent color, but each letter's sound is still spoken separately, then together ("f… r… fr!"). A blend is two sounds, unlike a digraph, and the UI must teach that difference: digraph tiles are a single solid color, while blend tiles are two-tone.
- Record the error type: if he picks the dropped-consonant distractor, call `RG.progress.recordError('blends','dropped-consonant', word)`.

### New island: syllable-saw 🪚 (`js/games/syllable-saw.js`, skill `long-words`, track big, levels 1–5)
Teach a repeatable long-word strategy: **find the vowels → saw between syllables → read each chunk → blend the chunks**.
- A long word sits on a wooden log. Vowels glow when he taps "🔍 find the vowels". He taps a gap between letters to saw the log. Accept any valid split; a wrong cut is gently undone with a hint about the rule. The saw animation splits the log into chunks.
- Each chunk is tappable and spoken. Then he blends: the chunks slide together and he picks the matching picture or meaning (3 choices).
- Level progression (each word only uses patterns he's had):
  - L1: compound words (sunset, starfish, cupcake, sandbox, catfish, hotdog, backpack, sailboat).
  - L2: closed syllables VC/CV (napkin, rabbit, magnet, picnic, kitten, muffin, basket, insect).
  - L3: consonant-le (turtle, candle, apple, puzzle, bubble, pickle) and open syllables (robot, tiger, paper, music, zero).
  - L4: suffixes and prefixes as chunks (jumping, helpful, unlock, rewind, sadness, quickly, kindness).
  - L5: 3-syllable words (fantastic, octopus, astronaut, basketball, butterfly, hamburger, computer).
- Teach the syllable "rules" as kid language on a "Saw Tips" card: "Two consonants in the middle? Cut between them!" (rab|bit); "-le grabs the letter before it" (tur|tle).
- Record the error type `RG.progress.recordError('long-words', 'skipped-chunk' | 'wrong-split', word)`.

### Wiring
- Register both new islands for the big track (order: rhyme-boat, word-builder, blend-cannon, syllable-saw, sight-fishing, sentence-match, story-cove, reading-quest, captains-quiz). Both count toward unlocking the Challenge Island.
- Placement ladder rungs include a blend minimal-pair item (frog/fog) and a two-syllable item (napkin), each setting their skill's starting level (then one rung lower per v4.1).
- Captain's Challenge (big) includes at least 2 blend questions and 2 long-word questions per run.
- Tricky Words (v4.1) includes words missed in both new games.
- Grown-ups panel, "Patterns we noticed": counts of recorded error types in plain language. For example, "Often drops the second letter in blends (frog → fog): 7 times this week. Practice: say the word slowly and tap a finger for each sound." This gives the parent and teacher something concrete.
- `RG.progress.recordError(skill, type, word)` and `.errors()` are persisted per profile and implemented in core.js.

## v4.3: Build split and shared interfaces for v4/v4.1/v4.2 (BINDING)
Three agents work in parallel, and **each agent writes ONLY its own files**.

| Agent | Files |
|---|---|
| CORE-4 | js/content.js, js/core.js, js/app.js, index.html, css/style.css, js/games/captains-quiz.js, tools/check-decodable.js |
| NEWGAMES-4 | js/games/blend-cannon.js, js/games/syllable-saw.js (word data local to each file) |
| GAMES-4 | js/games/word-builder.js, sight-fishing.js, sentence-match.js, story-cove.js, reading-quest.js |

### New RG.content fields (CORE-4 writes them; GAMES-4 reads them, with fallbacks)
```js
RG.content.phonicsWords = { 1:[{word:'ship', emoji:'🚢', tiles:['sh','i','p']}], 2:[...], 3:[...], 4:[...], 5:[...] }
   // ≥ 14 per level, per the v4 table. tiles = one string per grapheme unit: digraphs, vowel teams, r-controlled
   // and diphthongs are ONE tile; blends are SEPARATE letters; L5 chunks = syllables/affixes ('jump','ing').
RG.content.sightWords = { level1..level5 }            // per the v4 table
RG.content.sentences  = [{text, emoji, distractors:[e,e], level:1..5, names?:[]}]   // ≥ 8 per level; L5 = inference
RG.content.stories    = [{id, title, level:1..5, pages:[{text, emoji}], questions:[{q, options, answer, type:'literal'|'why'|'sequence'|'vocab'|'inference'}], names?:[]}]
                        // ≥ 2 per level; hi-lo themes; strictly decodable for their level (tools/check-decodable.js)
RG.content.serial     = {id:'gull-island', title:'The Secret of Gull Island', chapters:[{title, level:4|5, pages, questions, names}] }  // 5 chapters, cliffhangers
RG.content.decodable  = { patternsByLevel: {1:[...],2:[...],...}, sightByLevel }  // used by the checker; exported for the games' own checks
```

### New RG.progress API (CORE-4 implements it; everyone else guards with `if (RG.progress.tricky)` etc.)
```js
RG.progress.maxLevel(skill) -> 3|4|5            // by skill and current track, per v4 §1
RG.progress.setLevel(skill, n)                  // placement + grown-ups override
RG.progress.recordError(skill, type, word)      // v4.2
RG.progress.errors() -> [{skill, type, word, at}]
RG.progress.tricky.add(word, skill)             // v4.1 Tricky Words
RG.progress.tricky.correct(word)                // counts a correct answer on a distinct day; removed after 3 days
RG.progress.tricky.list(skill?) -> [{word, skill, days}]
RG.progress.badge(id, label, emoji)  / .badges()   // e.g. Smooth Sailor rereading badge
RG.progress.get(key) / RG.progress.set(key, value) // small per-profile key/value store for game state (chapters read, reread counts)
```
- `ctx.level` can be 1..5. Big-track skills: `phonics`, `blends`, `long-words`, `sight-words`, `comprehension`, `fluency`, `real-world`, `quiz` (max 5); `rhyme` (max 4 on big).
- Games call `RG.progress.tricky.add(word, skill)` on a wrong answer about a specific word, and `.correct(word)` when a tricky word is answered right. Games that pick target words mix in 1–2 tricky words from their own skill when available.
