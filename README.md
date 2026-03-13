# VIBEHATON

Landing page for the Vibehaton weekend — a 48h vibecoding hackathon in Bern, CH (27–29 March 2026).

## Files

| File | Role |
|---|---|
| `index.html` | Markup + CSS |
| `scene.js` | Particle animation |
| `background.png` | Source image sampled by the particle system |

## Local development

```bash
python3 -m http.server 8181 --directory /path/to/vibehaton
# open http://localhost:8181
```

> Must be served over HTTP — opening `index.html` directly via `file://` blocks canvas pixel access (`getImageData`) for security reasons.

---

## Particle system — `scene.js`

### Sampling — how many particles exist (`init`)

```js
const stride = 3;          // sample every Nth pixel — lower = more particles (try 2–5)
if (br < 0.035) continue;  // skip near-black pixels — raise to 0.1+ to thin out dark areas
if (Math.random() > Math.min(1, br * 1.4 + 0.18)) continue;
//  probability of spawning a particle at this pixel
//  bright pixels: ~1.0 probability, dark pixels: ~0.18
//  raise 1.4 to keep more mid-tones, lower 0.18 to drop more dim pixels
```

### Color tint

```js
this.r = Math.min(255, r * 0.2 + 240 * 0.8);  // 80% towards R=240 (warm)
this.g = Math.min(255, g * 0.2 + 185 * 0.8);  // 80% towards G=185 (golden)
this.b = Math.min(255, b * 0.2 +  40 * 0.8);  // 80% towards B=40  (amber)
// first factor (0.2) = how much original image color bleeds through
// target values (240, 185, 40) = the tint colour — change these to shift the palette
```

### Size & opacity

```js
this.baseSize  = 0.4 + brightness * 0.65;  // bright pixels → bigger dots (max ~1.05px)
this.baseAlpha = 0.72 + brightness * 0.28; // bright pixels → more opaque (max 1.0)
// raise 0.65 for larger dots overall, raise 0.72 for a brighter/denser look
```

### Sway (lateral drift while rising)

```js
this.fx = 0.00004 + Math.random() * 0.00006; // sway frequency X — higher = faster wiggle
this.fy = 0.00003 + Math.random() * 0.00005; // sway frequency Y

this.ax = 0.3 + e * 1.2 + Math.random() * 0.5; // sway amplitude X — higher = wider drift
this.ay = 0.2 + e * 0.8 + Math.random() * 0.4; // sway amplitude Y (×0.4 in update, so small)
// 'e' (edginess) = mid-brightness pixels sway more — they sit on edges/contours
```

### Rise (upward movement)

```js
this.riseSpeed = 0.0008 + Math.random() * 0.0012; // how fast each particle rises
                                                   // raise for faster overall drift
this.maxRise   = 6 + Math.random() * 14 + brightness * 8;
// total vertical distance before looping — bright pixels travel further (max ~28px)
// raise 14 for a longer, lazier float; raise 8 to make bright spots rise more
```

### Escape (particles that break free near end of life)

```js
const escapeStrength = u * u * u; // cubic — most don't escape; a few shoot far
const angle = -Math.PI/2 + (Math.random() - 0.5) * Math.PI * 1.2;
// angle spread: ±108° around straight up — widen PI * 1.2 for more chaotic scatter

this.escapeDX = Math.cos(angle) * escapeStrength * 30; // horizontal escape distance (px)
this.escapeDY = Math.sin(angle) * escapeStrength * 22; // vertical escape distance (px)
// raise 30/22 for more dramatic escape; lower for tighter, calmer effect

// escape triggers at 65% through a particle's life:
const escapeProgress = Math.max(0, (progress - 0.65) / 0.35);
// lower 0.65 to start escaping earlier
```

### Fade in / out

```js
const fadeIn  = Math.min(1, progress * 6);      // full opacity reached at 1/6 of life
const fadeOut = Math.min(1, (1 - progress) * 5); // starts fading at 4/5 of life
// raise 6 to snap in faster; lower 5 to start fading earlier
```

### Breathing (opacity pulse)

```js
this.fa = 0.00008 + Math.random() * 0.0001;     // pulse frequency — raise for faster flicker
const breathe = 0.88 + 0.12 * Math.sin(...);    // oscillates between 0.88 and 1.0
// raise 0.12 to 0.3 for more pronounced pulsing; lower for a steadier glow
```

### Quick recipes

| Effect | Change |
|---|---|
| Denser cloud | `stride = 2`, raise `0.18` → `0.3` |
| Faster / more energetic | `riseSpeed`: `0.002 + random * 0.003` |
| Bigger particles | `baseSize`: `1.0 + brightness * 1.5` |
| More escaping | `u * u * u` → `u * u`, raise `30`/`22` |
| Cool blue palette | target tint `(180, 220, 255)` |
