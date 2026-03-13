const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

// W and H track the canvas's live pixel dimensions
let W = 0,
  H = 0;
let particles = [];
let started = false;

const img = new Image();

function sampleImage() {
  const off = document.createElement("canvas");
  off.width = W;
  off.height = H;
  const oc = off.getContext("2d");
  const iw = img.naturalWidth,
    ih = img.naturalHeight;
  const scale = Math.max(W / iw, H / ih);
  const sw = W / scale,
    sh = H / scale;
  const sx = (iw - sw) / 2,
    sy = (ih - sh) * 0.3;
  oc.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
  return oc.getImageData(0, 0, W, H);
}

class Particle {
  constructor(x, y, brightness, r, g, b) {
    this.ox = x;
    this.oy = y;
    this.brightness = brightness;

    this.r = Math.min(255, r * 0.2 + 240 * 0.9);
    this.g = Math.min(255, g * 0.2 + 185 * 0.8);
    this.b = Math.min(255, b * 0.2 + 40 * 0.7);

    this.baseSize = 0.4 + brightness * 0.65;
    this.baseAlpha = 0.72 + brightness * 0.28;

    this.px = Math.random() * Math.PI * 2;
    this.py = Math.random() * Math.PI * 2;
    this.fx = 0.00004 + Math.random() * 0.0001;
    this.fy = 0.00003 + Math.random() * 0.0001;

    const edginess = 1 - Math.abs(brightness - 0.5) * 1.5;
    const e = Math.max(0, edginess);
    this.ax = 0.3 + e * 1.2 + Math.random() * 0.5;
    this.ay = 0.2 + e * 0.8 + Math.random() * 0.5;

    this.riseSpeed = 0.0008 + Math.random() * 0.005;
    this.maxRise = 6 + Math.random() * 14 + brightness * 10;
    this.riseOffset = Math.random() * this.maxRise;

    const u = Math.random();
    const escapeStrength = u * u * u;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5;
    this.escapeDX = Math.cos(angle) * escapeStrength * 30;
    this.escapeDY = Math.sin(angle) * escapeStrength * 22;

    this.pa = Math.random() * Math.PI * 2;
    this.fa = 0.00008 + Math.random() * 0.0001;
  }

  update(t) {
    const rise = (this.riseOffset + t * this.riseSpeed) % this.maxRise;
    const progress = rise / this.maxRise;
    const escapeProgress = Math.max(0, (progress - 0.65) / 0.35);
    const escapeCurve = escapeProgress * escapeProgress;
    const fadeIn = Math.min(1, progress * 6);
    const fadeOut = Math.min(1, (1 - progress) * 5);
    const swayX = Math.sin(t * this.fx + this.px) * this.ax;
    const swayY = Math.cos(t * this.fy + this.py) * this.ay * 0.4;
    this.x = this.ox + swayX + this.escapeDX * escapeCurve;
    this.y = this.oy + swayY - rise + this.escapeDY * escapeCurve;
    const breathe = 0.88 + 0.12 * Math.sin(t * this.fa + this.pa);
    this.alpha = this.baseAlpha * fadeIn * fadeOut * breathe;
    this.size = this.baseSize * (1 - progress * 0.4);
  }

  draw(ctx) {
    if (this.alpha < 0.006) return;
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = `rgb(${~~this.r},${~~this.g},${~~this.b})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0.1, this.size), 0, 6.2832);
    ctx.fill();
  }
}

function init() {
  if (!W || !H) return;
  const d = sampleImage().data;
  particles = [];
  const stride = 3;
  for (let y = 0; y < H; y += stride) {
    for (let x = 0; x < W; x += stride) {
      const i = (y * W + x) * 4;
      const rv = d[i],
        gv = d[i + 1],
        bv = d[i + 2];
      const br = (rv * 0.299 + gv * 0.587 + bv * 0.114) / 255;
      if (br < 0.035) continue;
      if (Math.random() > Math.min(1, br * 1.4 + 0.18)) continue;
      particles.push(new Particle(x, y, br, rv, gv, bv));
    }
  }
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const newW = Math.round(rect.width);
  const newH = Math.round(rect.height);
  if (newW === W && newH === H) return; // nothing changed
  W = newW;
  H = newH;
  canvas.width = W;
  canvas.height = H;
  if (img.complete && img.naturalWidth > 0) init();
}

function animate(t) {
  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#060604";
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < particles.length; i++) {
    particles[i].update(t);
    particles[i].draw(ctx);
  }
  ctx.globalAlpha = 1;
}

// Re-measure and reinit particles on any layout change (orientation, resize)
let resizeTimer;
const ro = new ResizeObserver(() => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resize, 150);
});
ro.observe(canvas);

img.onload = () => {
  resize();
  if (!started) {
    started = true;
    requestAnimationFrame(animate);
  }
};
img.onerror = (e) => console.error("img failed", e);
img.src = "background.png";
