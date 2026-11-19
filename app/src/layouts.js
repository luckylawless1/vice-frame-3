// VICE FRAME 3 — cover layouts.
// Panels are fractions of the cover (0..1). A panel is either a rect
// { x, y, w, h } or a polygon { poly: [[x, y], ...] }. Panels later in
// the list draw on top of earlier ones (the close-up insets, say).

function rect(x, y, w, h, extra) {
  return Object.assign({ x, y, w, h }, extra || {});
}
function poly(points) {
  return { poly: points };
}
function grid(cols, rows, gap) {
  const out = [];
  const cw = (1 - gap * (cols + 1)) / cols;
  const ch = (1 - gap * (rows + 1)) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push(rect(gap + c * (cw + gap), gap + r * (ch + gap), cw, ch));
    }
  }
  return out;
}

export const LAYOUTS = [
  {
    id: 'cover-star',
    label: 'Cover Star',
    panels: [rect(0, 0, 1, 0.62), rect(0, 0.62, 0.5, 0.38), rect(0.5, 0.62, 0.5, 0.38)],
  },
  {
    id: 'collage-four',
    label: 'Collage Four',
    panels: [rect(0, 0, 0.5, 0.5), rect(0.5, 0, 0.5, 0.5), rect(0, 0.5, 0.5, 0.5), rect(0.5, 0.5, 0.5, 0.5)],
  },
  {
    id: 'panel-grid',
    label: 'Panel Grid',
    panels: grid(3, 2, 0.012),
  },
  {
    id: 'crew-wide',
    label: 'Crew Wide',
    panels: [
      rect(0, 0, 1, 0.55),
      rect(0, 0.55, 1 / 3, 0.45),
      rect(1 / 3, 0.55, 1 / 3, 0.45),
      rect(2 / 3, 0.55, 1 / 3, 0.45),
    ],
  },
  {
    id: 'cover-closeup',
    label: 'Cover Close-Up',
    panels: [
      rect(0, 0, 1, 1),
      rect(0.695, 0.5, 0.275, 0.215, { border: true }),
      rect(0.695, 0.735, 0.275, 0.215, { border: true }),
    ],
  },
  {
    id: 'angled-grid',
    label: 'Angled Grid',
    panels: [
      poly([[0, 0], [1, 0], [1, 0.34], [0, 0.43]]),
      poly([[0, 0.43], [1, 0.34], [1, 0.67], [0, 0.76]]),
      poly([[0, 0.76], [1, 0.67], [1, 1], [0, 1]]),
    ],
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

/** A panel's bounding box, in cover fractions. */
export function panelBBox(p) {
  if (p.poly) {
    let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
    for (const [x, y] of p.poly) {
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  return { x: p.x, y: p.y, w: p.w, h: p.h };
}

/** Begins a canvas path tracing the panel at render size W x H. */
export function tracePanel(ctx, p, W, H) {
  ctx.beginPath();
  if (p.poly) {
    p.poly.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x * W, y * H);
      else ctx.lineTo(x * W, y * H);
    });
    ctx.closePath();
  } else {
    ctx.rect(p.x * W, p.y * H, p.w * W, p.h * H);
  }
}

/** Hit test in cover fractions; polygons use ray casting. */
export function pointInPanel(p, fx, fy) {
  if (!p.poly) {
    return fx >= p.x && fx <= p.x + p.w && fy >= p.y && fy <= p.y + p.h;
  }
  let inside = false;
  const pts = p.poly;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > fy !== yj > fy && fx < ((xj - xi) * (fy - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}
