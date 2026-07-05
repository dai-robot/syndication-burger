/**
 * Syndication Burger オープニング GIF 生成
 * npm run generate:opening
 *
 * GIF は半透明非対応のため、全ピクセルを不透明で描画し、
 * フレームごとにパレットを生成して色崩れを防ぐ。
 */
import { writeFileSync } from 'node:fs';
import gifenc from 'gifenc';
const { GIFEncoder, quantize, applyPalette } = gifenc;

const W = 195;
const H = 422;
const FRAME_DELAY = 90;
const FRAME_COUNT = 48;
const TRAY_TOP_Y = 354;

const C = {
  bg: [255, 248, 232],
  tileA: [255, 243, 208],
  tileB: [245, 230, 184],
  outline: [93, 58, 26],
  bunDark: [192, 120, 40],
  bunMid: [232, 168, 56],
  bunLight: [255, 217, 102],
  bunCream: [255, 243, 196],
  sesame: [255, 253, 231],
  patty: [107, 58, 24],
  pattyHi: [154, 101, 48],
  cheese: [255, 193, 7],
  cheeseDrip: [255, 152, 0],
  lettuce: [124, 179, 66],
  lettuceHi: [174, 213, 129],
  tomato: [229, 57, 53],
  tomatoInner: [255, 138, 101],
  accent: [255, 107, 53],
  white: [255, 255, 255],
  steam: [255, 252, 240],
  card: [255, 250, 235],
};

class Frame {
  constructor() {
    this.data = new Uint8ClampedArray(W * H * 4);
    this.clear(...C.bg);
  }

  clear(r, g, b) {
    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = 255;
    }
  }

  getPixel(x, y) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return [...C.bg, 255];
    const i = (y * W + x) * 4;
    return [this.data[i], this.data[i + 1], this.data[i + 2], 255];
  }

  setPixel(x, y, r, g, b) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    this.data[i] = r;
    this.data[i + 1] = g;
    this.data[i + 2] = b;
    this.data[i + 3] = 255;
  }

  blendPixel(x, y, r, g, b, t) {
    const [dr, dg, db] = this.getPixel(x, y);
    this.setPixel(
      x,
      y,
      Math.round(r * t + dr * (1 - t)),
      Math.round(g * t + dg * (1 - t)),
      Math.round(b * t + db * (1 - t)),
    );
  }

  fillRect(x, y, w, h, color, opacity = 1) {
    for (let py = Math.floor(y); py < y + h; py++) {
      for (let px = Math.floor(x); px < x + w; px++) {
        if (opacity >= 0.99) this.setPixel(px, py, color[0], color[1], color[2]);
        else this.blendPixel(px, py, color[0], color[1], color[2], opacity);
      }
    }
  }

  fillEllipse(cx, cy, rx, ry, color, opacity = 1) {
    const x0 = Math.floor(cx - rx);
    const x1 = Math.ceil(cx + rx);
    const y0 = Math.floor(cy - ry);
    const y1 = Math.ceil(cy + ry);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const nx = (x - cx) / rx;
        const ny = (y - cy) / ry;
        if (nx * nx + ny * ny <= 1) {
          if (opacity >= 0.99) this.setPixel(x, y, color[0], color[1], color[2]);
          else this.blendPixel(x, y, color[0], color[1], color[2], opacity);
        }
      }
    }
  }

  strokeEllipse(cx, cy, rx, ry, color, line = 1, opacity = 0.55) {
    for (let t = 0; t < Math.PI * 2; t += 0.025) {
      for (let d = 0; d < line; d++) {
        const x = cx + Math.cos(t) * (rx - d * 0.35);
        const y = cy + Math.sin(t) * (ry - d * 0.35);
        this.blendPixel(x, y, color[0], color[1], color[2], opacity);
      }
    }
  }

  roundRect(x, y, w, h, r, color, opacity = 1) {
    this.fillRect(x + r, y, w - r * 2, h, color, opacity);
    this.fillRect(x, y + r, w, h - r * 2, color, opacity);
    this.fillEllipse(x + r, y + r, r, r, color, opacity);
    this.fillEllipse(x + w - r, y + r, r, r, color, opacity);
    this.fillEllipse(x + r, y + h - r, r, r, color, opacity);
    this.fillEllipse(x + w - r, y + h - r, r, r, color, opacity);
  }
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function drawBackground(f, frame) {
  f.clear(...C.bg);
  const tile = 18;
  for (let y = 0; y < H; y += tile) {
    for (let x = 0; x < W; x += tile) {
      const c = ((x / tile + y / tile) % 2 === 0) ? C.tileA : C.tileB;
      f.fillRect(x, y, tile, tile, c);
    }
  }

  const fade = clamp(frame / 10, 0, 1);
  if (fade < 1) {
    f.fillRect(0, 0, W, H, C.bg, 1 - fade * 0.7);
  }

  f.roundRect(14, 52, W - 28, H - 110, 12, C.card, 0.35);
  f.fillEllipse(W / 2, TRAY_TOP_Y + 4, 58, 5, 'rgba(93, 58, 26, 0.15)');
  f.strokeEllipse(W / 2, TRAY_TOP_Y + 2, 56, 4, C.outline, 1, 0.25);
}

function drawTitle(f, frame) {
  const t = clamp((frame - 4) / 12, 0, 1);
  const bounce = easeOutBack(t);
  const y = lerp(-30, 78, bounce);
  const opacity = clamp(t * 1.2, 0, 1);

  if (opacity > 0) {
    f.roundRect(W / 2 - 78, y - 18, 156, 36, 8, C.accent, opacity * 0.18);
    drawBlockText(f, 'SYNDICATION', W / 2, y - 8, 0.55, opacity);
    drawBlockText(f, 'BURGER', W / 2, y + 10, 0.7, opacity);
  }

  if (frame >= 34) {
    const pulse = 0.65 + Math.sin((frame - 34) * 0.45) * 0.35;
    drawBlockText(f, 'TAP TO START', W / 2, H - 42, 0.42, pulse);
  }
}

function drawBlockText(f, text, cx, cy, scale, opacity) {
  const charW = Math.max(2, Math.round(6 * scale));
  const charH = Math.max(3, Math.round(8 * scale));
  const gap = Math.max(1, Math.round(2 * scale));
  const totalW = text.length * charW + (text.length - 1) * gap;
  let x = cx - totalW / 2;
  for (const ch of text) {
    drawChar(f, ch, x, cy - charH / 2, charW, charH, opacity);
    x += charW + gap;
  }
}

function drawChar(f, ch, x, y, w, h, opacity) {
  const glyphs = {
    S: ['1111', '1   ', '111 ', '   1', '1111'],
    Y: ['1   1', ' 1 1 ', '  1  ', '  1  ', '  1  '],
    N: ['1   1', '11  1', '1 1 1', '1  11', '1   1'],
    D: ['111  ', '1   1', '1   1', '1   1', '111  '],
    I: ['111', ' 1 ', ' 1 ', ' 1 ', '111'],
    C: [' 111', '1   ', '1   ', '1   ', ' 111'],
    A: [' 1 ', '1 1', '111', '1 1', '1 1'],
    T: ['11111', '  1  ', '  1  ', '  1  ', '  1  '],
    O: [' 111 ', '1   1', '1   1', '1   1', ' 111 '],
    B: ['1110 ', '1  1 ', '111  ', '1  1 ', '1110 '],
    U: ['1   1', '1   1', '1   1', '1   1', ' 111 '],
    R: ['111 ', '1  1', '111 ', '1 1 ', '1  1'],
    E: ['1111', '1   ', '111 ', '1   ', '1111'],
    P: ['1111', '1  1', '111 ', '1   ', '1   '],
    ' ': ['     '],
  };
  const rows = glyphs[ch] ?? glyphs[' '];
  const px = Math.max(1, Math.floor(w / 5));
  for (let row = 0; row < rows.length; row++) {
    for (let col = 0; col < rows[row].length; col++) {
      if (rows[row][col] !== '1') continue;
      f.fillRect(x + col * px, y + row * px, px, px, C.outline, opacity);
    }
  }
}

function drawBottomBun(f, cx, cy) {
  f.fillEllipse(cx, cy + 6, 46, 15, C.bunDark);
  f.fillEllipse(cx - 21, cy + 2, 4, 12, '#a86220');
  f.fillEllipse(cx + 21, cy + 2, 4, 12, '#a86220');
  f.fillEllipse(cx, cy + 3, 44, 13, C.bunMid);
  f.fillEllipse(cx, cy, 42, 11, C.bunLight);
  f.fillEllipse(cx, cy - 5, 28, 5, C.bunCream);
  f.strokeEllipse(cx, cy + 2, 43, 12, C.outline, 1, 0.45);
}

function drawPatty(f, cx, cy) {
  f.fillEllipse(cx, cy + 3, 40, 9, C.patty);
  f.fillEllipse(cx - 5, cy, 8, 3, C.pattyHi, 0.75);
  f.strokeEllipse(cx, cy + 2, 37, 7, C.outline, 1, 0.35);
}

function drawCheese(f, cx, cy) {
  f.roundRect(cx - 36, cy - 3, 72, 6, 2, C.cheeseDrip);
  f.roundRect(cx - 34, cy - 4, 68, 5, 2, C.cheese);
  for (const d of [-22, 0, 20]) {
    f.fillRect(cx + d - 2, cy + 1, 3, 3, C.cheeseDrip);
  }
}

function drawLettuce(f, cx, cy) {
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const lx = cx - 32 + t * 64;
    const c = i % 2 === 0 ? C.lettuceHi : C.lettuce;
    f.fillEllipse(lx, cy, 14, 7, c);
  }
}

function drawTomato(f, cx, cy) {
  f.fillEllipse(cx, cy, 26, 6, C.tomato);
  f.fillEllipse(cx, cy + 1, 16, 3, C.tomatoInner, 0.8);
}

function drawTopBun(f, cx, cy) {
  f.fillEllipse(cx, cy + 7, 42, 6, C.bunDark);
  f.fillEllipse(cx, cy + 2, 44, 10, C.bunMid);
  f.fillEllipse(cx, cy - 4, 40, 9, C.bunLight);
  f.fillEllipse(cx, cy - 10, 30, 7, C.bunLight);
  for (const [sx, sy] of [[-10, -6], [0, -10], [10, -7], [-5, -3], [7, -4]]) {
    f.fillEllipse(cx + sx, cy + sy, 2, 1.2, C.sesame);
  }
  f.strokeEllipse(cx, cy + 1, 42, 9, C.outline, 1, 0.4);
}

/** ゲーム StackLayout と同じ考え方（GIF は 0.5 倍スケール） */
const LAYERS = [
  { id: 'bottom_bun', stackTop: 9, stackBottom: 15, stackGap: 0, start: 8, draw: drawBottomBun },
  { id: 'patty', stackTop: 6.5, stackBottom: 7, stackGap: -1.5, start: 14, draw: drawPatty },
  { id: 'cheese', stackTop: 3.5, stackBottom: 4, stackGap: -2, start: 19, draw: drawCheese },
  { id: 'lettuce', stackTop: 5, stackBottom: 5.5, stackGap: -1, start: 24, draw: drawLettuce },
  { id: 'tomato', stackTop: 4.5, stackBottom: 5, stackGap: -1, start: 29, draw: drawTomato },
  { id: 'top_bun', stackTop: 25, stackBottom: 17, stackGap: -2, start: 34, draw: drawTopBun },
];

function buildStackLayout() {
  const placed = [];
  const centers = {};
  for (const layer of LAYERS) {
    let y;
    if (placed.length === 0) {
      y = TRAY_TOP_Y - layer.stackBottom;
    } else {
      const support = placed[placed.length - 1];
      const surfaceY = support.y - support.stackTop;
      y = surfaceY - layer.stackBottom + layer.stackGap;
    }
    placed.push({ ...layer, y });
    centers[layer.id] = y;
  }
  return { placed, centers, peakY: placed[placed.length - 1].y - placed[placed.length - 1].stackTop };
}

const STACK = buildStackLayout();

function layerDrop(frame, start) {
  return easeOutBack(clamp((frame - start) / 8, 0, 1));
}

function drawBurger(f, frame) {
  const cx = W / 2;

  for (const layer of STACK.placed) {
    if (frame < layer.start) continue;
    const drop = layerDrop(frame, layer.start);
    const landY = layer.y;
    const cy = landY + (1 - drop) * -75;
    layer.draw(f, cx, cy);
  }

  if (frame >= 38) {
    const steamT = frame - 38;
    const peak = STACK.peakY;
    for (let i = 0; i < 4; i++) {
      const sx = cx + (i - 1.5) * 14;
      const sy = peak - 8 - steamT * 3 - i * 3;
      const opacity = clamp(1 - steamT * 0.12 - i * 0.15, 0, 1);
      if (opacity > 0) f.fillEllipse(sx, sy, 3 + i, 2.5, C.steam, opacity * 0.85);
    }
  }

  if (frame >= 36) {
    for (let i = 0; i < 6; i++) {
      const a = (frame * 0.7 + i * 1.3) % (Math.PI * 2);
      const dist = 48 + Math.sin(frame * 0.2 + i) * 4;
      const px = cx + Math.cos(a) * dist;
      const py = STACK.peakY + 20 + Math.sin(a) * dist * 0.3;
      f.fillEllipse(px, py, 2, 2, C.accent, 0.9);
    }
  }
}

function renderFrame(index) {
  const f = new Frame();
  drawBackground(f, index);
  drawBurger(f, index);
  drawTitle(f, index);
  return f.data;
}

function validateFrame(rgba, frameIndex) {
  let greenish = 0;
  let blackish = 0;
  let creamish = 0;
  for (let i = 0; i < rgba.length; i += 4) {
    const r = rgba[i];
    const g = rgba[i + 1];
    const b = rgba[i + 2];
    if (r < 20 && g < 20 && b < 20) blackish++;
    if (g > 180 && r < 80 && b < 80) greenish++;
    if (r > 230 && g > 220 && b > 170) creamish++;
  }
  const total = rgba.length / 4;
  if (greenish / total > 0.08) {
    throw new Error(`Frame ${frameIndex}: too much green (${(greenish / total * 100).toFixed(1)}%)`);
  }
  if (blackish / total > 0.15) {
    throw new Error(`Frame ${frameIndex}: too much black (${(blackish / total * 100).toFixed(1)}%)`);
  }
  if (creamish / total < 0.25) {
    throw new Error(`Frame ${frameIndex}: background too weak (${(creamish / total * 100).toFixed(1)}%)`);
  }
}

const frames = Array.from({ length: FRAME_COUNT }, (_, i) => renderFrame(i));
for (let i = 0; i < frames.length; i++) {
  validateFrame(frames[i], i);
}

const gif = GIFEncoder({ loop: 1 });
for (const rgba of frames) {
  const palette = quantize(rgba, 256);
  const index = applyPalette(rgba, palette);
  gif.writeFrame(index, W, H, { palette, delay: FRAME_DELAY });
}

gif.finish();
const out = new Uint8Array(gif.bytes());
writeFileSync(new URL('../public/syndication_burger_opening.gif', import.meta.url), out);

console.log(`Wrote public/syndication_burger_opening.gif (${(out.length / 1024).toFixed(1)} KB, ${FRAME_COUNT} frames)`);
console.log('Validation passed for all frames.');
