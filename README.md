# HUSH. — Love is a light sleeper.

A mobile-first, English-language browser game: quiet your snoring partner without waking them up.

**Play:** https://capstere.github.io/HUSH/

## GitHub Pages

This repository is the standalone public game (separate from `capstere/sw`). Publish from **Settings → Pages → Deploy from a branch → main → / (root)**.

`index.html` must stay at the **repository root**. Keep the following paths intact:

```text
HUSH/
├── index.html                 # Browser entry point
├── style.css                  # Mobile layout and visual styles
├── src/
│   ├── engine.js              # Rules, timers, win / loss
│   ├── app.js                 # Controls, events and UI
│   ├── scene.js               # Animated canvas bedroom
│   └── audio.js               # Web Audio playback and mute
└── assets/
    ├── icon.svg               # Browser tab icon
    └── audio/
        └── sound-bank.js      # Procedural snoring, rain and foley
```

No `npm install`, server back end, audio downloads or build process are required. Original sounds are generated in-browser; external MP3/WAV files are not needed. **Do not put the files from `src/` or `assets/` loose in the root**, because `index.html` references their relative paths.

## Try it on your phone

1. Open https://capstere.github.io/HUSH/ in Safari on iPhone or Chrome on Android.
2. Tap **Save the night** to begin and unlock sound (browser audio requires a user gesture).
3. Try **Shhh**, **Pillow**, **Roll over** and **More**. Your objective: reach 07:00 without waking your partner.
4. Toggle the speaker icon to check sound. Use your device volume; for iPhones also check silent-mode / audio routing if necessary.

If you changed files and still see an old version, reload the page, or try a private tab after GitHub Pages finishes updating. If you see a blank scene, check that `src/` and `assets/` were published with the same spelling and paths.

## Notes

- Sound, graphics and gameplay use plain HTML / CSS / JavaScript. Scores and preferences are saved only in your browser if storage is available.
- The original project passed **25 rule tests and 114 Chromium checks** using simulated screen sizes. This public deployment has not been certified on physical iPhone/Android devices, Safari or Firefox yet.
- You can now test the site and share feedback on animation, sound, difficulty and controls before the next version.
