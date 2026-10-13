# HUSH. — Love is a light sleeper.

**3.0.0 · The hands-on edition · 2026-10-13**

**Play:** https://capstere.github.io/HUSH/?v=3

A mobile-first, top-down midnight game based on Jesper's bedroom sketch. The sleeper is on the left; you are on the right. Survive from 02:00 until 07:00 in 150 seconds, without waking your partner or losing your patience.

## What to try first

**Grab your hand and drag left onto their shoulder.** Your arm follows your finger. A fast swipe is stronger and riskier. You can also grab your sock and drag it left towards their leg. One gesture produces one contact, even when held against the target. These are gentle cartoon nudges and kicks, with no injuries.

**When one eye opens: FREEZE.** A countdown shows when it is safe to nudge again. You are not prevented from making a bad decision: another hit while the partner is stirring sharply raises wake-up risk and can end the game.

**Headphones offer borrowed peace.** Drag them from the right bedside stand onto your head, or tap Listen. You hear a low, muffled nonsense audiobook while the snoring fades into the background. They run flat in about 15 seconds from full. Return them to the stand to recharge; a full recharge takes about 22 seconds. They protect your patience, not the sleeper's wake-up risk. An empty pair returns automatically to the stand.

**Hold Shhh for a small, safe respite.** It lasts up to 2.5 seconds, followed by a recovery period. Tugging the duvet is another small comfort move.

The first play starts with a short, hands-on lesson without a running night clock. It teaches hand, foot, waiting and headphones. Skip it at any time. The menu can replay the lesson.

## Seven bedroom interruptions

Only one interruption is active at a time. The fart, nightmare and bathroom visit appear before the optional events, in a shuffled order; a short round does not necessarily show every event.

| Event | What you do |
|---|---|
| An unexpected fart | Swipe the green cloud back and forth. The arm fans and the cloud disperses. |
| A nightmare | Tap three tiny dream monsters. Hitting the sleeper instead is especially risky. |
| A bathroom visit | Tap the right-hand door. Hold Tiptoe on green, release on creaky red boards. The sock avatar walks to the loo and returns to the bedroom. |
| A buzzing phone | Tap the phone on the left bedside table. |
| A kneading cat | Drag the cat onto the little rug. It settles there. |
| A stolen duvet | Pull the right-hand blue edge back towards your side. |
| A mosquito | Tap the flying nuisance. Its touch area is larger than the drawing. |

## Mobile design

The bedroom is the main controller. Two thumb controls remain at the bottom: headphones and a context-sensitive hold button. Patience and wake-up risk are always visible. There is one instruction area, not a bank of competing minigame buttons.

The scene scales into the available screen, with a side layout on short landscape screens, safe-area padding and visual-viewport height handling. Pointer capture, pointer cancellation, single-pointer ownership and tab-switch pausing prevent stuck gestures. The settings include reduced motion and **Tap instead of drag**. Keyboard support: A / K for hand / foot, H for headphones, Space to shush or tiptoe, P to pause.

## Files and publishing

```text
index.html                 Entry point; keep at repository root
style.css                  Responsive layout and controls
src/engine.js              Rules, battery, event scheduling, win/loss
src/app.js                 Gestures, tutorial, UI, settings, lifecycle
src/scene.js               Canvas illustration, jointed limbs, animation
src/audio.js               Playback, gesture unlocking, audio mixing
assets/audio/sound-bank.js Original breath, snore and cloth sounds
assets/audio/night-sounds.js Nonsense narrator, fart, creak, flush, cat, pop
assets/icon.svg            Site icon
tests/                     Reproducible checks and result summary
tools/                     Optional single-file and WAV export tools
docs/                      Release and testing notes
```

Keep **Settings → Pages → Deploy from a branch → main → / (root)** as before. No build, npm packages, account, microphone, API key or server backend is required to play. There are no remote game assets or tracking requests. Audio is synthesized locally, not downloaded speech or a copyrighted audiobook. WAV exports are optional, not runtime dependencies.

Versioned resource URLs prevent mixing cached 2.0 scripts with the 3.0 entry point. If the old version remains visible after deployment, reopen the play link above or reload the page. Do not copy files back into `capstere/sw`; the standalone game now lives in this repository.

## Develop and verify

```sh
python -m http.server 8765 --bind 127.0.0.1
node --test tests/engine.test.cjs
python tests/browser.test.py
python tools/build.py
node tools/render-audio.cjs
```

Playwright is only needed to run browser tests. `tools/build.py` creates `dist/HUSH.html`; `tools/render-audio.cjs` exports WAV previews into `dist/audio/`. The public game never exposes the local test controls.

**Verification:** 34 rule tests; 88 distinct Chromium browser checks across the functional and layout runs; eight local HTTP resource checks. See [testing details and limitations](docs/TESTING.md). Physical iPhones/Android phones, Safari, Firefox, real mobile audio routing, and subjective sound quality still need hands-on verification.
