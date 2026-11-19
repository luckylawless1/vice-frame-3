// VICE FRAME 3 — stickers and editorial marks, all drawn on canvas.
// Original artwork only: a palm silhouette, a star badge, a "NEW!"
// starburst, the wanted-stars row and a magazine barcode block.

export function starPath(ctx, cx, cy, r, rot) {
  const inner = r * 0.48;
  const start = rot === undefined ? -Math.PI / 2 : rot;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : inner;
    const a = start + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** A leaning palm silhouette; (x, y) is the base of the trunk, h its height. */
export function drawPalm(ctx, x, y, h, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  const tx = x + h * 0.12;
  const ty = y - h * 0.97;
  ctx.lineWidth = h * 0.075;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - h * 0.05, y - h * 0.55, tx, ty);
  ctx.stroke();
  ctx.lineWidth = h * 0.042;
  const fronds = [
    [-0.58, -0.26], [-0.34, -0.44], [0.0, -0.5], [0.34, -0.42],
    [0.6, -0.24], [0.64, 0.04], [-0.64, 0.0],
  ];
  for (const [dx, dy] of fronds) {
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + dx * h * 0.55, ty + dy * h * 0.8 - h * 0.1, tx + dx * h, ty + dy * h + h * 0.17);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(tx - h * 0.05, ty + h * 0.055, h * 0.05, 0, Math.PI * 2);
  ctx.arc(tx + h * 0.065, ty + h * 0.065, h * 0.042, 0, Math.PI * 2);
  ctx.fill();
}

/** A gold star badge with a dark outline. */
export function drawStarBadge(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.15);
  starPath(ctx, 0, 0, r);
  ctx.fillStyle = '#ffcf3f';
  ctx.strokeStyle = '#17110a';
  ctx.lineWidth = r * 0.11;
  ctx.fill();
  ctx.stroke();
  starPath(ctx, 0, 0, r * 0.52);
  ctx.fillStyle = '#ff5da2';
  ctx.fill();
  ctx.restore();
}

/** The "NEW!" starburst. The caller keeps its centre inset from the edges. */
export function drawBurst(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.12);
  const spikes = 18;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.78;
    const a = (i * Math.PI) / spikes;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffd21f';
  ctx.strokeStyle = '#17110a';
  ctx.lineWidth = r * 0.055;
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d81b60';
  ctx.font = `900 ${r * 0.62}px "Archivo Black", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NEW!', 0, r * 0.03);
  ctx.restore();
}

/** A centred row of five gold wanted stars; returns the row's height. */
export function drawWantedRow(ctx, cx, top, r) {
  const gap = r * 2.35;
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = r * 0.3;
  for (let i = 0; i < 5; i++) {
    const x = cx + (i - 2) * gap;
    starPath(ctx, x, top + r, r);
    ctx.fillStyle = '#ffcf3f';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(23, 17, 10, 0.9)';
    ctx.lineWidth = r * 0.12;
    ctx.stroke();
    ctx.shadowBlur = r * 0.3;
  }
  ctx.restore();
  return r * 2;
}

// Bar widths for the barcode: a fixed decorative pattern.
const BAR_PATTERN = [3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 1, 2, 3, 1, 1, 2, 1, 1, 3, 2, 1, 1, 2, 1, 3, 1, 1];

/** A magazine barcode block: white card, black bars, digits underneath. */
export function drawBarcode(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#f7f4ec';
  ctx.strokeStyle = 'rgba(10, 10, 16, 0.65)';
  ctx.lineWidth = Math.max(1, h * 0.02);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h * 0.08);
  ctx.fill();
  ctx.stroke();
  const pad = w * 0.07;
  const barsTop = y + h * 0.1;
  const barsH = h * 0.58;
  const unit = (w - pad * 2) / BAR_PATTERN.reduce((a, b) => a + b, 0);
  let bx = x + pad;
  ctx.fillStyle = '#111118';
  for (let i = 0; i < BAR_PATTERN.length; i++) {
    const bw = BAR_PATTERN[i] * unit;
    if (i % 2 === 0) ctx.fillRect(bx, barsTop, Math.max(1, bw * 0.72), barsH);
    bx += bw;
  }
  ctx.fillStyle = '#111118';
  ctx.font = `${h * 0.19}px ui-monospace, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('0 60613 00006 9', x + w / 2, y + h * 0.9);
  ctx.restore();
}
