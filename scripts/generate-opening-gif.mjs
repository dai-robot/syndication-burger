/**
 * Syndication Burger オープニング GIF 生成
 * npm run generate:opening
 */
import { writeFileSync } from 'node:fs';
import gifenc from 'gifenc';
const { GIFEncoder, quantize, applyPalette } = gifenc;

const W = 195;
const H = 422;
const FRAME_DELAY = 90;
const FRAME_COUNT = 48;

const C = {
  bg: [255, 248, 232],
  tileA: [255, 243, 208],
  tileB: [245, 230, 184],
  outline: [93, 58, 26],
  bunDark: [192, 120, 40],
  bunMid: [232, 168, 56],
  bunLight: [255, 217, 102],
  sesame: [255, 253, 231],
  patty: [107, 58, 24],
  pattyHi: [154, 101, 48],
  cheese: [255, 193, 7],
  cheeseDrip: [255, 152, 0],
  lettuce: [124, 179, 66],
  lettuceHi: [174, 213, 129],
  tomato: [229, 57, 53],
  accent: [255, 107, 53],
  white: [255, 255, 255],
  steam: [255, 255, 255],
};

class Frame {
  constructor() {
    this.data = new Uint8ClampedArray(W * H * 4);
  }

  clear(r, g, b) {
    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = 255;
    }
  }

  setPixel(x, y, r, g, b, a = 255) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    if (a >= 250) {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = 255;
      return;
    }
    const srcA = a / 255;
    const dstA = this.data[i + 3] / 255;
    const outA = srcA + dstA * (1 - srcA);
    if (outA <= 0) return;
    this.data[i] = Math.round((r * srcA + this.data[i] * dstA * (1 - srcA)) / outA);
    this.data[i + 1] = Math.round((g * srcA + this.data[i + 1] * dstA * (1 - srcA)) / outA);
    this.data[i + 2] = Math.round((b * srcA + this.data[i + 2] * dstA * (1 - srcA)) / outA);
    this.data[i + 3] = Math.round(outA * 255);
  }

  fillRect(x, y, w, h, color, alpha = 255) {
    for (let py = Math.floor(y); py < y + h; py++) {
      for (let px = Math.floor(x); px < x + w; px++) {
        this.setPixel(px, py, color[0], color[1], color[2], alpha);
      }
    }
  }

  fillEllipse(cx, cy, rx, ry, color, alpha = 255) {
    const x0 = Math.floor(cx - rx);
    const x1 = Math.ceil(cx + rx);
    const y0 = Math.floor(cy - ry);
    const y1 = Math.ceil(cy + ry);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const nx = (x - cx) / rx;
        const ny = (y - cy) / ry;
        if (nx * nx + ny * ny <= 1) {
          this.setPixel(x, y, color[0], color[1], color[2], alpha);
        }
      }
    }
  }

  strokeEllipse(cx, cy, rx, ry, color, line = 1, alpha = 180) {
    for (let t = 0; t < Math.PI * 2; t += 0.02) {
      for (let d = 0; d < line; d++) {
        const x = cx + Math.cos(t) * (rx - d * 0.4);
        const y = cy + Math.sin(t) * (ry - d * 0.4);
        this.setPixel(x, y, color[0], color[1], color[2], alpha);
      }
    }
  }

  roundRect(x, y, w, h, r, color, alpha = 255) {
    this.fillRect(x + r, y, w - r * 2, h, color, alpha);
    this.fillRect(x, y + r, w, h - r * 2, color, alpha);
    this.fillEllipse(x + r, y + r, r, r, color, alpha);
    this.fillEllipse(x + w - r, y + r, r, r, color, alpha);
    this.fillEllipse(x + r, y + h - r, r, r, color, alpha);
    this.fillEllipse(x + w - r, y + h - r, r, r, color, alpha);
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
  f.fillRect(0, 0, W, H, C.bg, Math.round((1 - fade) * 180));

  f.roundRect(14, 52, W - 28, H - 110, 12, C.white, 40);
  f.strokeEllipse(W / 2, H - 58, 62, 10, C.outline, 1, 50);
}

function drawTitle(f, frame) {
  const t = clamp((frame - 4) / 12, 0, 1);
  const bounce = easeOutBack(t);
  const y = lerp(-30, 78, bounce);
  const alpha = Math.round(255 * clamp(t * 1.2, 0, 1));

  f.roundRect(W / 2 - 78, y - 18, 156, 36, 8, C.accent, Math.round(alpha * 0.15));
  drawBlockText(f, 'SYNDICATION', W / 2, y - 8, 0.55, alpha);
  drawBlockText(f, 'BURGER', W / 2, y + 10, 0.7, alpha);

  if (frame >= 34) {
    const pulse = 0.65 + Math.sin((frame - 34) * 0.45) * 0.35;
    const tapAlpha = Math.round(220 * pulse);
    drawBlockText(f, 'TAP TO START', W / 2, H - 42, 0.42, tapAlpha);
  }
}

function drawBlockText(f, text, cx, cy, scale, alpha) {
  const charW = Math.round(6 * scale);
  const charH = Math.round(8 * scale);
  const gap = Math.round(2 * scale);
  const totalW = text.length * charW + (text.length - 1) * gap;
  let x = cx - totalW / 2;
  for (const ch of text) {
    drawChar(f, ch, x, cy - charH / 2, charW, charH, alpha);
    x += charW + gap;
  }
}

function drawChar(f, ch, x, y, w, h, alpha) {
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
      f.fillRect(x + col * px, y + row * px, px, px, C.outline, alpha);
    }
  }
}

function drawBottomBun(f, cx, baseY, drop) {
  const y = baseY + (1 - drop) * -80;
  f.fillEllipse(cx, y + 8, 46, 12, C.bunDark);
  f.fillEllipse(cx, y + 4, 44, 10, C.bunMid);
  f.fillEllipse(cx, y, 42, 9, C.bunLight);
  f.strokeEllipse(cx, y + 3, 43, 9, C.outline, 1, 120);
}

function drawPatty(f, cx, baseY, drop) {
  const y = baseY + (1 - drop) * -90;
  f.fillEllipse(cx, y + 4, 40, 9, C.patty);
  f.fillEllipse(cx - 6, y + 1, 10, 4, C.pattyHi, 160);
  f.strokeEllipse(cx, y + 3, 38, 8, C.outline, 1, 100);
}

function drawCheese(f, cx, baseY, drop) {
  const y = baseY + (1 - drop) * -85;
  f.roundRect(cx - 38, y - 4, 76, 8, 2, C.cheeseDrip, 220);
  f.roundRect(cx - 36, y - 5, 72, 7, 2, C.cheese);
  for (const d of [-24, 0, 22]) {
    f.fillRect(cx + d - 2, y + 2, 4, 5, C.cheeseDrip);
  }
}

function drawLettuce(f, cx, baseY, drop) {
  const y = baseY + (1 - drop) * -88;
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const lx = cx - 34 + t * 68;
    const c = i % 2 === 0 ? C.lettuceHi : C.lettuce;
    f.fillEllipse(lx, y, 16, 9, c);
  }
}

function drawTomato(f, cx, baseY, drop) {
  const y = baseY + (1 - drop) * -86;
  f.fillEllipse(cx, y, 28, 7, C.tomato);
  f.fillEllipse(cx, y + 1, 18, 4, [255, 138, 101], 180);
}

function drawTopBun(f, cx, baseY, drop) {
  const y = baseY + (1 - drop) * -95;
  f.fillEllipse(cx, y + 10, 44, 10, C.bunDark);
  f.fillEllipse(cx, y + 2, 46, 14, C.bunMid);
  f.fillEllipse(cx, y - 2, 42, 12, C.bunLight);
  for (const [sx, sy] of [[-12, -4], [0, -8], [12, -5], [-6, -2], [8, -3]]) {
    f.fillEllipse(cx + sx, y + sy, 2, 1.5, C.sesame);
  }
  f.strokeEllipse(cx, y + 2, 44, 12, C.outline, 1, 120);
}

function layerDrop(frame, start) {
  return easeOutBack(clamp((frame - start) / 8, 0, 1));
}

function drawBurger(f, frame) {
  const cx = W / 2;
  const baseY = 250;
  const layers = [
    { start: 8, draw: drawBottomBun },
    { start: 14, draw: drawPatty },
    { start: 19, draw: drawCheese },
    { start: 24, draw: drawLettuce },
    { start: 29, draw: drawTomato },
    { start: 34, draw: drawTopBun },
  ];

  for (const layer of layers) {
    if (frame < layer.start) continue;
    const drop = layerDrop(frame, layer.start);
    layer.draw(f, cx, baseY, drop);
  }

  if (frame >= 38) {
    const steamT = frame - 38;
    for (let i = 0; i < 4; i++) {
      const sx = cx + (i - 1.5) * 16;
      const sy = baseY - 70 - steamT * 3 - i * 4;
      const a = Math.max(0, 180 - steamT * 18 - i * 20);
      f.fillEllipse(sx, sy, 4 + i, 3, C.steam, a);
    }
  }

  if (frame >= 36) {
    for (let i = 0; i < 6; i++) {
      const a = (frame * 0.7 + i * 1.3) % (Math.PI * 2);
      const dist = 52 + Math.sin(frame * 0.2 + i) * 4;
      const px = cx + Math.cos(a) * dist;
      const py = baseY - 40 + Math.sin(a) * dist * 0.35;
      f.fillEllipse(px, py, 2, 2, C.accent, 160);
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

const frames = Array.from({ length: FRAME_COUNT }, (_, i) => renderFrame(i));
const combined = new Uint8ClampedArray(frames.reduce((sum, f) => sum + f.length, 0));
let offset = 0;
for (const rgba of frames) {
  combined.set(rgba, offset);
  offset += rgba.length;
}
const palette = quantize(combined, 256);

const gif = GIFEncoder({ loop: 1 });
for (const rgba of frames) {
  const index = applyPalette(rgba, palette);
  gif.writeFrame(index, W, H, { palette, delay: FRAME_DELAY });
}

gif.finish();
const out = new Uint8Array(gif.bytes());
writeFileSync(new URL('../public/syndication_burger_opening.gif', import.meta.url), out);

console.log(`Wrote public/syndication_burger_opening.gif (${(out.length / 1024).toFixed(1)} KB, ${FRAME_COUNT} frames)`);
