// VICE FRAME 3 — the cover renderer.
// Draws the whole cover (panels, grades, masthead, stickers, caption,
// editorial marks, grain) onto any 2D context at any size, so the
// editor preview and the PNG exports share one code path.

import { gradeById, applyGrade } from './grades.js';
import { layoutById, panelBBox, tracePanel } from './layouts.js';
import { drawPalm, drawStarBadge, drawBurst, drawWantedRow, drawBarcode } from './stickers.js';

const ANTON = '"Anton", sans-serif';
const ARCHIVO = '"Archivo Black", sans-serif';
const ISSUE_LINE = 'ISSUE 06 · LAS LUMEN · $6.99';

const panelCanvas = document.createElement('canvas');
const grainTile = document.createElement('canvas');

function grainPattern(ctx) {
  if (!grainTile.width) {
    grainTile.width = 256;
    grainTile.height = 256;
    const g = grainTile.getContext('2d');
    const img = g.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 96 + Math.floor(Math.random() * 96);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  return ctx.createPattern(grainTile, 'repeat');
}

// Draws one panel's graded photo into the offscreen panel canvas.
function paintPanel(panel, st, photos, pw, ph) {
  panelCanvas.width = Math.max(2, Math.round(pw));
  panelCanvas.height = Math.max(2, Math.round(ph));
  const c = panelCanvas.getContext('2d');
  const w = panelCanvas.width;
  const h = panelCanvas.height;
  const entry = photos.get(st.photo);
  const img = entry && entry.img && entry.img.complete && entry.img.naturalWidth > 0 ? entry.img : null;
  if (img) {
    const grade = gradeById(st.grade);
    const base = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const scale = base * (st.zoom || 1);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = (w - dw) / 2 + (st.ox || 0) * w;
    const dy = (h - dh) / 2 + (st.oy || 0) * h;
    c.save();
    if (grade.filter) c.filter = grade.filter;
    c.drawImage(img, dx, dy, dw, dh);
    c.restore();
    applyGrade(c, w, h, grade);
  } else {
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#123a4a');
    g.addColorStop(1, '#3a1140');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255, 255, 255, 0.75)';
    c.font = `${Math.max(11, w * 0.05)}px ${ARCHIVO}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText((st.photo || 'NO PHOTO').toUpperCase(), w / 2, h / 2);
  }
  return panelCanvas;
}

// Greedy word wrap for the masthead title; shrinks the font until the
// wrapped lines fit maxWidth in at most maxLines lines.
function fitTitle(ctx, title, maxWidth, startSize, maxLines) {
  let size = startSize;
  const words = title.split(/\s+/).filter(Boolean);
  for (;;) {
    ctx.font = `${size}px ${ANTON}`;
    const lines = [];
    let line = '';
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width <= maxWidth || !line) line = next;
      else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if ((lines.length <= maxLines && widest <= maxWidth) || size <= 18) {
      return { lines, size };
    }
    size *= 0.93;
  }
}

/**
 * Renders the cover described by `state` into ctx at W x H.
 * photos: Map of photo id -> { img }. opts.selection draws the editor's
 * selection outline (preview only, never on exports or shots).
 */
export function renderCover(ctx, W, H, state, photos, opts) {
  const layout = layoutById(state.layout);
  const showSelection = !!(opts && opts.selection);

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#16121f');
  bg.addColorStop(1, '#07070d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Panels, in layout order (later panels sit on top).
  layout.panels.forEach((panel, i) => {
    const st = state.panels[i] || state.panels[0];
    const bb = panelBBox(panel);
    const painted = paintPanel(panel, st, photos, bb.w * W, bb.h * H);
    ctx.save();
    tracePanel(ctx, panel, W, H);
    ctx.clip();
    ctx.drawImage(painted, bb.x * W, bb.y * H);
    ctx.restore();
    if (panel.border) {
      tracePanel(ctx, panel, W, H);
      ctx.strokeStyle = '#f7f2e7';
      ctx.lineWidth = Math.max(2, W * 0.006);
      ctx.stroke();
      tracePanel(ctx, panel, W, H);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.lineWidth = Math.max(1, W * 0.002);
      ctx.stroke();
    }
  });

  // Legibility scrims behind the masthead and the caption.
  let scrim = ctx.createLinearGradient(0, 0, 0, H * 0.34);
  scrim.addColorStop(0, 'rgba(5, 5, 12, 0.58)');
  scrim.addColorStop(1, 'rgba(5, 5, 12, 0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, W, H * 0.34);
  scrim = ctx.createLinearGradient(0, H * 0.8, 0, H);
  scrim.addColorStop(0, 'rgba(5, 5, 12, 0)');
  scrim.addColorStop(1, 'rgba(5, 5, 12, 0.5)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, H * 0.8, W, H * 0.2);

  // --- Masthead ------------------------------------------------------------
  const burstOn = state.stickers.burst;
  const maxTitleW = (burstOn ? 0.78 : 0.92) * W;
  const { lines, size } = fitTitle(ctx, state.title || '', maxTitleW, W * 0.165, 2);
  const lineH = size * 0.98;
  let cursorY = H * 0.032;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const grad = ctx.createLinearGradient(W * 0.14, 0, W * 0.86, 0);
  grad.addColorStop(0, '#ff2e88');
  grad.addColorStop(0.55, '#b45cff');
  grad.addColorStop(1, '#19e3c2');
  for (const line of lines) {
    ctx.font = `${size}px ${ANTON}`;
    ctx.lineWidth = size * 0.07;
    ctx.strokeStyle = 'rgba(10, 4, 20, 0.92)';
    ctx.strokeText(line, W / 2, cursorY);
    ctx.fillStyle = grad;
    ctx.fillText(line, W / 2, cursorY);
    cursorY += lineH;
  }
  const titleBottom = cursorY;

  // The wanted-stars row hangs from the measured bottom of the wrapped
  // title, plus a fixed gap — it can never overlap the title.
  if (state.stickers.wanted) {
    const starR = W * 0.024;
    drawWantedRow(ctx, W / 2, titleBottom + H * 0.016, starR);
    cursorY = titleBottom + H * 0.016 + starR * 2;
  } else {
    cursorY = titleBottom;
  }

  // Tagline with a neon glow.
  if (state.tagline) {
    const tSize = W * 0.027;
    ctx.font = `${tSize}px ${ARCHIVO}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.save();
    ctx.shadowColor = '#19e3c2';
    ctx.shadowBlur = W * 0.022;
    ctx.fillStyle = '#eafffa';
    const ty = cursorY + H * 0.014;
    ctx.fillText(state.tagline, W / 2, ty);
    ctx.fillText(state.tagline, W / 2, ty);
    ctx.restore();
    cursorY = ty + tSize;
  }

  // --- Stickers --------------------------------------------------------------
  const captionH = state.caption ? H * 0.078 : 0;
  const captionTop = H - captionH;
  if (state.stickers.palm) {
    drawPalm(ctx, W * 0.014, captionTop - H * 0.004, H * 0.3, 'rgba(8, 10, 16, 0.88)');
  }
  if (state.stickers.star) {
    drawStarBadge(ctx, W * 0.058, H * 0.345, W * 0.042);
  }
  if (burstOn) {
    const r = W * 0.072;
    const inset = Math.max(W * 0.024, H * 0.02);
    drawBurst(ctx, W - inset - r, inset + r, r);
  }

  // --- Editorial marks ---------------------------------------------------------
  ctx.save();
  ctx.font = `${Math.max(9, W * 0.0155)}px ${ARCHIVO}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 4;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.fillText(ISSUE_LINE, W * 0.022, H * 0.014);
  ctx.restore();

  const bw = W * 0.105;
  const bh = Math.max(30, H * 0.05);
  drawBarcode(ctx, W - W * 0.02 - bw, captionTop - bh - H * 0.012, bw, bh);

  // --- Caption bar -------------------------------------------------------------
  if (state.caption) {
    ctx.fillStyle = 'rgba(8, 6, 16, 0.9)';
    ctx.fillRect(0, captionTop, W, captionH);
    const rule = ctx.createLinearGradient(0, 0, W, 0);
    rule.addColorStop(0, '#ff2e88');
    rule.addColorStop(1, '#19e3c2');
    ctx.fillStyle = rule;
    ctx.fillRect(0, captionTop, W, Math.max(2, H * 0.004));
    let cSize = H * 0.033;
    ctx.font = `${cSize}px ${ARCHIVO}`;
    while (ctx.measureText(state.caption).width > W * 0.92 && cSize > 10) {
      cSize *= 0.94;
      ctx.font = `${cSize}px ${ARCHIVO}`;
    }
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.caption, W / 2, captionTop + captionH / 2 + H * 0.002);
  }

  // --- Film grain ----------------------------------------------------------------
  if (state.grain) {
    ctx.save();
    ctx.globalAlpha = 0.055;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grainPattern(ctx);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // --- Editor selection outline ----------------------------------------------------
  if (showSelection) {
    const panel = layout.panels[state.selected] || layout.panels[0];
    tracePanel(ctx, panel, W, H);
    ctx.save();
    ctx.setLineDash([12, 9]);
    ctx.strokeStyle = '#19e3c2';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);
    const bb = panelBBox(panel);
    ctx.font = `${Math.max(11, W * 0.016)}px ${ARCHIVO}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#19e3c2';
    ctx.fillText(`PANEL ${state.selected + 1}`, bb.x * W + 8, bb.y * H - 6 > 14 ? bb.y * H - 6 : (bb.y + bb.h) * H - 8);
    ctx.restore();
  }
}
