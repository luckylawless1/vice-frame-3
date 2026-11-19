// VICE FRAME 3 — editor wiring: state, photo strip, panel interaction,
// text and sticker controls, PNG export, and the screenshot modes the
// kit asks for (?shot=cover / ?shot=editor, ?photo=, ?caption=).

import { GRADES } from './grades.js';
import { LAYOUTS, layoutById, panelBBox, pointInPanel } from './layouts.js';
import { renderCover } from './cover.js';

const SAMPLE_NAMES = [
  'boulevard', 'pier', 'woman-pink-car', 'man-boardwalk', 'duo-rooftop',
  'neon-boulevard', 'yacht-sunset', 'hero-portrait', 'casino-drift',
];
const SIZES = [
  [1080, 1080],
  [1080, 1350],
  [1920, 1080],
];

const params = new URLSearchParams(location.search);
const shotMode = params.get('shot'); // 'cover' | 'editor' | null

const photos = new Map(); // id -> { id, name, img }
let uploadCount = 0;

const state = {
  layout: 'cover-closeup',
  sizeIndex: 0,
  title: 'VICE CITY HEAT',
  tagline: 'TWO CREWS. ONE CITY.',
  caption: 'EVERY SUNSET HAS A PRICE',
  stickers: { palm: true, star: true, burst: true, wanted: true },
  grain: false,
  selected: 0,
  panels: [
    { photo: 'hero-portrait', zoom: 1, ox: 0, oy: 0, grade: 'neon-night' },
    { photo: 'casino-drift', zoom: 1, ox: 0, oy: 0, grade: 'clean' },
    { photo: 'neon-boulevard', zoom: 1, ox: 0, oy: 0, grade: 'clean' },
    { photo: 'duo-rooftop', zoom: 1, ox: 0, oy: 0, grade: 'vice-sunset' },
    { photo: 'woman-pink-car', zoom: 1, ox: 0, oy: 0, grade: 'golden-hour' },
    { photo: 'yacht-sunset', zoom: 1, ox: 0, oy: 0, grade: 'clean' },
  ],
};

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const stageWrap = document.getElementById('stage-wrap');

function currentLayout() {
  return layoutById(state.layout);
}
function selectedPanel() {
  return state.panels[state.selected];
}

function render() {
  renderCover(ctx, canvas.width, canvas.height, state, photos, {
    selection: shotMode !== 'cover',
  });
}

// Keeps the preview canvas at the chosen export aspect, long side 1080.
function fitStage() {
  if (shotMode === 'cover') {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    return;
  }
  const [sw, sh] = SIZES[state.sizeIndex];
  const scale = 1080 / Math.max(sw, sh);
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  const availW = Math.max(320, stageWrap.clientWidth - 28);
  const availH = Math.max(320, stageWrap.clientHeight - 54);
  const fit = Math.min(availW / canvas.width, availH / canvas.height);
  canvas.style.width = `${Math.round(canvas.width * fit)}px`;
  canvas.style.height = `${Math.round(canvas.height * fit)}px`;
}

function refresh() {
  fitStage();
  render();
}

// --- photo strip -------------------------------------------------------------
const thumbsEl = document.getElementById('thumbs');

function addThumb(id) {
  const entry = photos.get(id);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'thumb';
  btn.dataset.photo = id;
  const img = document.createElement('img');
  img.src = entry.img.src;
  img.alt = entry.name;
  const label = document.createElement('span');
  label.textContent = entry.name;
  btn.append(img, label);
  btn.addEventListener('click', () => {
    selectedPanel().photo = id;
    syncPanelControls();
    render();
  });
  thumbsEl.append(btn);
}

function markThumbs() {
  const current = selectedPanel().photo;
  thumbsEl.querySelectorAll('.thumb').forEach((el) => {
    el.classList.toggle('active', el.dataset.photo === current);
  });
}

function loadPhoto(id, name, src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      photos.set(id, { id, name, img });
      resolve(true);
    };
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

// --- panel controls ------------------------------------------------------------
const gradeSelect = document.getElementById('grade-select');
const zoomRange = document.getElementById('zoom');

function syncPanelControls() {
  gradeSelect.value = selectedPanel().grade;
  zoomRange.value = String(selectedPanel().zoom);
  document.getElementById('panel-label').textContent =
    `Panel ${state.selected + 1} of ${currentLayout().panels.length}`;
  markThumbs();
}

for (const g of GRADES) {
  const opt = document.createElement('option');
  opt.value = g.id;
  opt.textContent = g.label;
  gradeSelect.append(opt);
}
gradeSelect.addEventListener('change', () => {
  selectedPanel().grade = gradeSelect.value;
  render();
});
document.getElementById('grade-all').addEventListener('click', () => {
  for (const p of state.panels) p.grade = gradeSelect.value;
  render();
});
zoomRange.addEventListener('input', () => {
  selectedPanel().zoom = Number(zoomRange.value);
  render();
});

// --- layout buttons --------------------------------------------------------------
const layoutBtns = document.getElementById('layout-btns');
for (const l of LAYOUTS) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = l.label;
  btn.dataset.layout = l.id;
  btn.classList.toggle('active', l.id === state.layout);
  btn.addEventListener('click', () => {
    state.layout = l.id;
    if (state.selected >= l.panels.length) state.selected = 0;
    layoutBtns.querySelectorAll('button').forEach((b) =>
      b.classList.toggle('active', b.dataset.layout === l.id));
    syncPanelControls();
    render();
  });
  layoutBtns.append(btn);
}

// --- text + stickers ---------------------------------------------------------------
function bindText(id, key) {
  const el = document.getElementById(id);
  el.value = state[key];
  el.addEventListener('input', () => {
    state[key] = el.value;
    render();
  });
}
bindText('in-title', 'title');
bindText('in-tagline', 'tagline');
bindText('in-caption', 'caption');

function bindSticker(id, key) {
  const el = document.getElementById(id);
  el.checked = state.stickers[key];
  el.addEventListener('change', () => {
    state.stickers[key] = el.checked;
    render();
  });
}
bindSticker('st-palm', 'palm');
bindSticker('st-star', 'star');
bindSticker('st-burst', 'burst');
bindSticker('st-wanted', 'wanted');
const grainBox = document.getElementById('st-grain');
grainBox.checked = state.grain;
grainBox.addEventListener('change', () => {
  state.grain = grainBox.checked;
  render();
});

// --- upload ---------------------------------------------------------------------------
const fileInput = document.getElementById('file-input');
document.getElementById('upload-btn').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  addFiles(fileInput.files);
  fileInput.value = '';
});
async function addFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const id = `upload-${++uploadCount}`;
    const ok = await loadPhoto(id, file.name.replace(/\.[^.]+$/, ''), URL.createObjectURL(file));
    if (ok) {
      addThumb(id);
      selectedPanel().photo = id;
    }
  }
  syncPanelControls();
  render();
}
document.getElementById('editor').addEventListener('dragover', (e) => e.preventDefault());
document.getElementById('editor').addEventListener('drop', (e) => {
  e.preventDefault();
  if (e.dataTransfer) addFiles(e.dataTransfer.files);
});

// --- canvas interaction ------------------------------------------------------------------
function canvasFraction(e) {
  const r = canvas.getBoundingClientRect();
  return { fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height };
}
function panelAt(fx, fy) {
  const panels = currentLayout().panels;
  for (let i = panels.length - 1; i >= 0; i--) {
    if (pointInPanel(panels[i], fx, fy)) return i;
  }
  return -1;
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const { fx, fy } = canvasFraction(e);
  const hit = panelAt(fx, fy);
  if (hit >= 0) {
    state.selected = hit;
    syncPanelControls();
  }
  const p = selectedPanel();
  drag = { fx, fy, ox: p.ox, oy: p.oy };
  canvas.setPointerCapture(e.pointerId);
  render();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const { fx, fy } = canvasFraction(e);
  const bb = panelBBox(currentLayout().panels[state.selected]);
  const p = selectedPanel();
  p.ox = drag.ox + (fx - drag.fx) / bb.w;
  p.oy = drag.oy + (fy - drag.fy) / bb.h;
  render();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = selectedPanel();
  p.zoom = Math.min(5, Math.max(1, p.zoom * Math.exp(-e.deltaY * 0.0012)));
  zoomRange.value = String(p.zoom);
  render();
}, { passive: false });
canvas.addEventListener('dblclick', (e) => {
  const { fx, fy } = canvasFraction(e);
  const hit = panelAt(fx, fy);
  if (hit < 0) return;
  const p = state.panels[hit];
  p.zoom = 1;
  p.ox = 0;
  p.oy = 0;
  state.selected = hit;
  syncPanelControls();
  render();
});

window.addEventListener('keydown', (e) => {
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  const step = e.shiftKey ? 0.05 : 0.01;
  const p = selectedPanel();
  if (e.key === 'ArrowLeft') p.ox -= step;
  else if (e.key === 'ArrowRight') p.ox += step;
  else if (e.key === 'ArrowUp') p.oy -= step;
  else if (e.key === 'ArrowDown') p.oy += step;
  else return;
  e.preventDefault();
  render();
});

// --- export ----------------------------------------------------------------------------------
function exportPNG(w, h) {
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  renderCover(out.getContext('2d'), w, h, state, photos, { selection: false });
  out.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-frame-3-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, 'image/png');
}
for (const [i, [w, h]] of SIZES.entries()) {
  document.getElementById(`exp-${w}x${h}`).addEventListener('click', () => {
    state.sizeIndex = i;
    refresh();
    exportPNG(w, h);
  });
}
document.getElementById('exp-all').addEventListener('click', () => {
  SIZES.forEach(([w, h], i) => {
    setTimeout(() => exportPNG(w, h), i * 400);
  });
});

// --- boot --------------------------------------------------------------------------------------
async function boot() {
  await Promise.all(SAMPLE_NAMES.map((name) => loadPhoto(name, name, `samples/${name}.jpg`)));
  for (const name of SAMPLE_NAMES) if (photos.has(name)) addThumb(name);
  try {
    await Promise.all([
      document.fonts.load('80px "Anton"'),
      document.fonts.load('24px "Archivo Black"'),
    ]);
  } catch {
    // Fonts fall back to sans-serif; the cover still renders.
  }
  const photoParam = params.get('photo');
  if (photoParam && photos.has(photoParam)) state.panels[0].photo = photoParam;
  const captionParam = params.get('caption');
  if (captionParam !== null) {
    state.caption = captionParam;
    document.getElementById('in-caption').value = captionParam;
  }
  if (shotMode === 'cover') document.body.classList.add('shot-cover');
  syncPanelControls();
  refresh();
  window.__SHOT_READY = true;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render());
}
window.addEventListener('resize', refresh);
boot();
