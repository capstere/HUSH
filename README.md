# HUSH. — Love is a light sleeper.

**5.0.0 · SECOND CHANCES · 2026-10-13**

Play: https://capstere.github.io/HUSH/?v=5

A tiny top-down midnight game based on Jesper's bedroom drawing. The sleeper is on the left; you are on the right. Get through the night without running out of patience. A normal night runs from 02:00 to 07:00 in 150 seconds, with extra recovery time at dawn when necessary.

## New: waking up is not game over

An open eye still means **FREEZE**: another nudge is risky. But a fully awake partner now starts a playable recovery phase instead of ending the game. The sleeper leans up, protests, gets drowsy and can drift back to sleep. The wake-risk meter becomes **Back to sleep** progress, and the same bottom dock changes to three gentle controls:

- **Stroke:** hold the button, or slowly drag across the sleeper's hair. The arm reaches over and follows the soothing motion. Scrubbing fast is counterproductive.
- **Hum:** hold a quiet, locally synthesized lullaby. Release to stop.
- **Breathe:** let go as the ring expands; hold as it contracts. Only the shared exhale builds progress.

The gold-marked favourite gives a modest bonus and changes on later awakenings. All three methods work on their own. The cool-side pillow and a duvet tuck also help, with cooldowns. Hitting an already awake partner reverses progress and costs patience. Headphones dock automatically during recovery.

**Fair interruptions:** an existing disaster is parked, not falsely solved or discarded. Its progress and countdown resume after the sleeper settles, with a six-second grace period and at least eight seconds left. This includes a bathroom trip: recovery returns to the bedroom, then the trip resumes without a stuck hold. New interruptions cannot overlap recovery.

Dawn waits until the sleeper is asleep. Running out of patience remains the real loss condition: you both give up and make tea. Practice never produces a score or a game over.

## New: Borrowed Moonlight

An original **45-second stereo nocturne**, at 64 beats per minute: soft felt-piano-style partials, warm sustained chords, a sparse melody and a quiet stereo echo. It loops with wrapped note tails rather than an abrupt restart. It is procedural synthesis, not a recording of a piano or a borrowed commercial song.

The mix now softens the snoring and sharper effects, fades short sounds instead of cutting them, and adds a gentle hum, sigh and goodnight phrase. Music becomes quieter during recovery and ducks further under the nonsense audiobook.

In the help/pause menu, **Night music**, **Music level**, **Bedroom sounds** and **Master volume** are independent. The top speaker mutes everything. Audio starts on a user gesture, fades on pause and suspends the audio context while paused or muted; resume reuses the existing loops. All game actions still work silently. Device routing and real-phone audio need hands-on testing.

## The room is still the controller

Grab your hand or sock and drag left towards the sleeper. Faster contact is stronger and riskier. One drag produces one contact. Headphones can be dragged between your head and the right charging stand, or controlled with **Listen / Dock & charge**. A full charge lasts about 15 seconds and takes about 22 seconds to restore. Hold **Shhh** for a short respite.

Pull the mint pillow tab slowly right for the cool side. Nine interruptions remain: fan a fart cloud, pop three dream creatures, tiptoe to the bathroom, catch a sneeze with a tissue, shut the window, silence the phone, relocate the cat to the rug, reclaim the duvet and catch the mosquito. Only one interruption is active at a time.

## Try the new part immediately

**Try the chaos → Oops. Both eyes.** opens the new recovery practice. There are eleven practice scenes, including the pillow and all nine interruptions. **Scenes** switches exercises; **Start a real night** creates a fresh scored round. The original hands-on first-play lesson remains available.

Animation keeps the sketch's blue linen and overhead perspective. The new recovery has gradual eyelids, yawns, a leaning pose, a caressing arm, a tiny sheep, restrained hearts and a breathing ring. Reduced motion removes decorative particles and waves but retains essential control feedback. Recovery replaces controls rather than adding a permanent panel.

## Files and development

`index.html` and `style.css` stay at the root. Keep `src/` and `assets/` intact. GitHub Pages remains **main → / (root)**. No installation, build, remote game assets, account, microphone, API key or tracking is needed to play. Settings are stored locally, with migration from the previous version when available.

`src/engine.js` contains deterministic rules; `app.js` handles input and lifecycle; `scene.js` renders the room; `motion.js` supplies bounded presentation-only physics; `audio.js` mixes original synthesis from `assets/audio/`. `nocturne.js` contains the new composition. Test hooks are gated to local development, never enabled on the public site.

```sh
python -m http.server 8765 --bind 127.0.0.1
node --test tests/*.test.cjs
python tests/browser.test.py --inline
python tests/after-midnight.test.py --inline
python tests/second-chances.test.py --inline
python tools/build.py
node tools/render-audio.cjs
python tests/production-smoke.py
```

Playwright with Chromium is needed only for browser checks. Omit `--inline` for the HTTP browser-test path when navigation is allowed. The build creates `dist/HUSH.html`; audio export creates 24 optional WAV files, including the nocturne. Exported WAVs are not runtime dependencies.

**Verified locally:** 91 Node tests, 177 distinct Chromium checks, twelve viewport sizes, ten HTTP resources and an unmodified standalone recovery smoke. This is not physical-device, Safari/Firefox or live-site gameplay verification. See [test details](docs/TESTING.md). Only the standalone `capstere/HUSH` game is maintained here; `capstere/sw` is untouched.
