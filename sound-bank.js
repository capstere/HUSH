/* Original procedural sound assets for HUSH. No downloads, microphone or recordings.
   Buffers are created once after the first audio gesture, not in the render loop. */
(function (root) {
  'use strict';
  function noise(seed) { let x = seed; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 2147483648 - 1; }; }
  function makeBank(ctx) {
    const rate = ctx.sampleRate;
    function buffer(seconds, channels, synth) {
      const b = ctx.createBuffer(channels, Math.floor(rate * seconds), rate);
      for (let ch = 0; ch < channels; ch++) { const out = b.getChannelData(ch); synth(out, ch); }
      return b;
    }
    const bank = {};
    for (let variation = 0; variation < 3; variation++) {
      bank['snore' + variation] = buffer(1.78, 1, a => {
        const r = noise(4271 + variation * 973); let lp = 0, soft = 0, phase = 0;
        for (let i = 0; i < a.length; i++) {
          const t = i / rate, p = t / 1.78;
          const env = Math.pow(Math.sin(Math.PI * p), 1.35) * Math.min(1, t * 12);
          const f = 59 + variation * 5 + 11 * Math.sin(p * Math.PI) + 2.5 * Math.sin(t * 17);
          phase += f * 2 * Math.PI / rate;
          const raw = r(); lp += .055 * (raw - lp); soft += .014 * (raw - soft);
          const flutter = .45 + .55 * Math.pow(Math.max(0, Math.sin(phase)), 2);
          const nasal = Math.sin(phase) * .035 + Math.sin(phase * 3.03) * .025;
          a[i] = env * ((lp - soft) * 2.5 * flutter + nasal + soft * .6);
        }
      });
    }
    bank.breath = buffer(1.85, 1, a => { const r = noise(3191); let lp = 0; for (let i = 0; i < a.length; i++) { lp += .06 * (r() - lp); a[i] = lp * Math.sin(Math.PI * i / a.length) * .17; } });
    bank.shush = buffer(.85, 1, a => { const r = noise(8743); let lp = 0; for (let i = 0; i < a.length; i++) { const n = r(); lp += .4 * (n - lp); a[i] = (n - lp) * Math.pow(Math.sin(Math.PI * i / a.length), 1.5) * .2; } });
    bank.fabric = buffer(.9, 1, a => { const r = noise(12311); let lp = 0; for (let i = 0; i < a.length; i++) { const p = i / a.length; lp += .16 * (r() - lp); a[i] = lp * .34 * Math.sin(Math.PI * p) * (.55 + .45 * Math.sin(p * 21) ** 2); } });
    bank.pat = buffer(.23, 1, a => { const r = noise(5119); let lp = 0; for (let i = 0; i < a.length; i++) { const t = i / rate; lp += .035 * (r() - lp); a[i] = (lp * .4 + Math.sin(2 * Math.PI * 95 * t) * .05) * Math.exp(-t * 24) * Math.min(1, t * 400); } });
    bank.rain = buffer(8, 2, (a, ch) => { const r = noise(12571 + ch * 211); let lp = 0; for (let i = 0; i < a.length; i++) { lp += .21 * (r() - lp); a[i] = lp * .26; } // Crossfade the seam for an unobtrusive loop.
      const n = Math.floor(rate * .08); for (let i = 0; i < n; i++) a[a.length - n + i] = a[a.length - n + i] * (1 - i / n) + a[i] * (i / n);
    });
    bank.room = buffer(6, 2, (a, ch) => { const r = noise(98713 + ch * 971); let lp = 0; for (let i = 0; i < a.length; i++) { lp += .005 * (r() - lp); a[i] = lp * .24; } const n = Math.floor(rate * .1); for (let i = 0; i < n; i++) a[a.length - n + i] = a[a.length - n + i] * (1 - i / n) + a[i] * i / n; });
    return bank;
  }
  root.HushSoundBank = makeBank;
})(typeof globalThis !== 'undefined' ? globalThis : this);
