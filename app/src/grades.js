// VICE FRAME 3 — colour grades.
// A grade is applied to one panel's photo on an offscreen canvas:
// first a CSS-style filter while the photo is drawn, then an optional
// per-pixel pass, then an optional painted overlay (tints, vignettes).

function luma(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// --- duotone-heat: luminance mapped through a teal -> pink ramp ------------
const DUOTONE_STOPS = [
  [0.0, 6, 26, 40],
  [0.35, 10, 112, 122],
  [0.55, 148, 42, 132],
  [0.78, 255, 45, 130],
  [1.0, 255, 216, 232],
];
const DUOTONE_LUT = (() => {
  const lut = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = DUOTONE_STOPS[0];
    let b = DUOTONE_STOPS[DUOTONE_STOPS.length - 1];
    for (let s = 0; s < DUOTONE_STOPS.length - 1; s++) {
      if (t >= DUOTONE_STOPS[s][0] && t <= DUOTONE_STOPS[s + 1][0]) {
        a = DUOTONE_STOPS[s];
        b = DUOTONE_STOPS[s + 1];
        break;
      }
    }
    const f = (t - a[0]) / Math.max(0.0001, b[0] - a[0]);
    lut[i * 3] = a[1] + (b[1] - a[1]) * f;
    lut[i * 3 + 1] = a[2] + (b[2] - a[2]) * f;
    lut[i * 3 + 2] = a[3] + (b[3] - a[3]) * f;
  }
  return lut;
})();

function duotoneHeat(img) {
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const y = Math.round(luma(d[i], d[i + 1], d[i + 2]));
    d[i] = DUOTONE_LUT[y * 3];
    d[i + 1] = DUOTONE_LUT[y * 3 + 1];
    d[i + 2] = DUOTONE_LUT[y * 3 + 2];
  }
}

// --- split-tone: warm highlights, cool shadows ------------------------------
function splitTone(img) {
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const t = luma(d[i], d[i + 1], d[i + 2]) / 255;
    const warm = t * t * 0.38;
    const cool = (1 - t) * (1 - t) * 0.38;
    d[i] = d[i] + (252 - d[i]) * warm + (58 - d[i]) * cool;
    d[i + 1] = d[i + 1] + (186 - d[i + 1]) * warm + (96 - d[i + 1]) * cool;
    d[i + 2] = d[i + 2] + (110 - d[i + 2]) * warm + (196 - d[i + 2]) * cool;
  }
}

// --- ink-poster: posterize + edge darkening; halftone is painted after ------
function inkPoster(img, w, h) {
  const d = img.data;
  const lum = new Float32Array(w * h);
  for (let p = 0, i = 0; p < w * h; p++, i += 4) {
    lum[p] = luma(d[i], d[i + 1], d[i + 2]);
  }
  const levels = 4; // 5 tones per channel
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      const i = p * 4;
      for (let c = 0; c < 3; c++) {
        d[i + c] = Math.round((d[i + c] / 255) * levels) * (255 / levels);
      }
      const right = x + 1 < w ? lum[p + 1] : lum[p];
      const down = y + 1 < h ? lum[p + w] : lum[p];
      const edge = Math.max(Math.abs(right - lum[p]), Math.abs(down - lum[p]));
      if (edge > 40) {
        d[i] *= 0.42;
        d[i + 1] *= 0.42;
        d[i + 2] *= 0.42;
      }
    }
  }
  return lum; // the caller paints halftone dots from the luminance field
}

function paintHalftone(ctx, lum, w, h) {
  const step = Math.max(5, Math.round(w / 110));
  ctx.fillStyle = 'rgba(8, 6, 14, 0.55)';
  ctx.beginPath();
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      const l = lum[Math.min(h - 1, Math.round(y)) * w + Math.min(w - 1, Math.round(x))];
      if (l < 112) {
        const r = ((112 - l) / 112) * step * 0.44;
        if (r > 0.4) {
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, Math.PI * 2);
        }
      }
    }
  }
  ctx.fill();
}

// --- painted overlays --------------------------------------------------------
function viceSunsetOverlay(ctx, w, h) {
  let g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(255, 64, 120, 0.20)');
  g.addColorStop(0.42, 'rgba(255, 120, 60, 0.05)');
  g.addColorStop(1, 'rgba(30, 10, 70, 0.38)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  g = ctx.createRadialGradient(w * 0.72, h * 0.2, 0, w * 0.72, h * 0.2, w * 0.7);
  g.addColorStop(0, 'rgba(255, 190, 90, 0.22)');
  g.addColorStop(1, 'rgba(255, 190, 90, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function neonNightOverlay(ctx, w, h) {
  let g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, 'rgba(0, 240, 255, 0.16)');
  g.addColorStop(0.5, 'rgba(0, 240, 255, 0)');
  g.addColorStop(1, 'rgba(255, 0, 128, 0.16)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  g = ctx.createLinearGradient(0, h * 0.55, 0, h);
  g.addColorStop(0, 'rgba(0, 0, 12, 0)');
  g.addColorStop(1, 'rgba(0, 0, 12, 0.38)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function goldenHourOverlay(ctx, w, h) {
  let g = ctx.createRadialGradient(w * 0.5, h * 0.16, 0, w * 0.5, h * 0.16, w * 0.95);
  g.addColorStop(0, 'rgba(255, 176, 66, 0.30)');
  g.addColorStop(1, 'rgba(255, 176, 66, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  g = ctx.createLinearGradient(0, h * 0.6, 0, h);
  g.addColorStop(0, 'rgba(255, 96, 0, 0)');
  g.addColorStop(1, 'rgba(255, 96, 0, 0.16)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export const GRADES = [
  { id: 'clean', label: 'Clean', filter: 'saturate(1.06) contrast(1.03)', pixel: null, overlay: null },
  { id: 'vice-sunset', label: 'Vice Sunset', filter: 'saturate(1.35) contrast(1.08) brightness(1.03) sepia(0.22)', pixel: null, overlay: viceSunsetOverlay },
  { id: 'neon-night', label: 'Neon Night', filter: 'saturate(1.32) contrast(1.16) brightness(0.92)', pixel: null, overlay: neonNightOverlay },
  { id: 'ink-poster', label: 'Ink Poster', filter: 'contrast(1.22) saturate(0.92)', pixel: inkPoster, overlay: null, halftone: true },
  { id: 'duotone-heat', label: 'Duotone Heat', filter: 'contrast(1.05)', pixel: duotoneHeat, overlay: null },
  { id: 'split-tone', label: 'Split Tone', filter: 'saturate(1.08)', pixel: splitTone, overlay: null },
  { id: 'golden-hour', label: 'Golden Hour', filter: 'sepia(0.34) saturate(1.28) brightness(1.06) contrast(1.02)', pixel: null, overlay: goldenHourOverlay },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// Applies a grade to a panel-sized offscreen context whose photo is drawn.
export function applyGrade(ctx, w, h, grade) {
  let lum = null;
  if (grade.pixel) {
    const img = ctx.getImageData(0, 0, w, h);
    lum = grade.pixel(img, w, h) || null;
    ctx.putImageData(img, 0, 0);
  }
  if (grade.halftone && lum) paintHalftone(ctx, lum, w, h);
  if (grade.overlay) grade.overlay(ctx, w, h);
}
