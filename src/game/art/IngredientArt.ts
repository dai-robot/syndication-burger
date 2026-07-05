import type { IngredientType } from '../GameConfig';
import { INGREDIENT_DEFS } from '../GameConfig';

const PREFIX = 'part_';
const bakedGames = new WeakSet<Phaser.Game>();

interface RefreshableTexture {
  refresh: () => void;
}

function refreshCanvasTexture(textures: Phaser.Textures.TextureManager, key: string): void {
  if (!textures.exists(key)) return;
  const tex = textures.get(key) as unknown as RefreshableTexture;
  if (typeof tex.refresh === 'function') {
    tex.refresh();
  }
}

/** タイトル画面と同系統のダイナー調パレット */
const C = {
  outline: '#5d3a1a',
  outlineSoft: '#8b6914',
  bunDark: '#c07828',
  bunMid: '#e8a838',
  bunLight: '#ffd966',
  bunCream: '#fff3c4',
  sesame: '#fffde7',
  pattyDark: '#3e2010',
  pattyMid: '#6b3a18',
  pattyLight: '#9a6530',
  cheese: '#ffc107',
  cheeseLight: '#ffe082',
  cheeseDrip: '#ff9800',
  lettuceDark: '#558b2f',
  lettuceMid: '#7cb342',
  lettuceLight: '#aed581',
  tomato: '#e53935',
  tomatoInner: '#ff8a65',
  tomatoSeed: '#ffe082',
  pickleDark: '#33691e',
  pickleMid: '#689f38',
  pickleLight: '#9ccc65',
  ketchup: '#d32f2f',
  ketchupBright: '#ff5252',
  shadow: 'rgba(93, 58, 26, 0.22)',
};

export function getPartTextureKey(type: IngredientType): string {
  return `${PREFIX}${type}`;
}

export function ensureIngredientTextures(scene: Phaser.Scene): void {
  const game = scene.game;
  if (bakedGames.has(game)) return;

  for (const type of Object.keys(INGREDIENT_DEFS) as IngredientType[]) {
    bakePart(game, type);
  }

  bakedGames.add(game);
}

function bakePart(game: Phaser.Game, type: IngredientType): void {
  const textures = game.textures;
  const def = INGREDIENT_DEFS[type];
  const w = def.width;
  const h = def.height;
  const scale = 2;
  const key = getPartTextureKey(type);

  if (textures.exists(key)) {
    refreshCanvasTexture(textures, key);
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(scale, scale);
  ctx.translate(w / 2, h / 2);
  paintPart(ctx, type, w, h);

  textures.addCanvas(key, canvas);
  refreshCanvasTexture(textures, key);
}

function paintPart(
  ctx: CanvasRenderingContext2D,
  type: IngredientType,
  w: number,
  h: number,
): void {
  switch (type) {
    case 'bottom_bun': paintBottomBun(ctx, w, h); break;
    case 'top_bun': paintTopBun(ctx, w, h); break;
    case 'patty': paintPatty(ctx, w, h); break;
    case 'cheese': paintCheese(ctx, w, h); break;
    case 'lettuce': paintLettuce(ctx, w, h); break;
    case 'tomato': paintTomato(ctx, w, h); break;
    case 'pickle': paintPickle(ctx, w, h); break;
    case 'ketchup': paintKetchup(ctx, w, h); break;
  }
}

function ellipse(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, rw: number, rh: number,
): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rw, rh, 0, 0, Math.PI * 2);
}

function fillEllipse(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, rw: number, rh: number,
  color: string,
  alpha = 255,
): void {
  if (alpha >= 250) {
    ellipse(ctx, x, y, rw, rh);
    ctx.fillStyle = color;
    ctx.fill();
    return;
  }
  ctx.save();
  ctx.globalAlpha = alpha / 255;
  ellipse(ctx, x, y, rw, rh);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function strokeEllipse(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, rw: number, rh: number,
  color: string, lineW: number, alpha = 1,
): void {
  ellipse(ctx, x, y, rw, rh);
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = lineW;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function gloss(ctx: CanvasRenderingContext2D, w: number, h: number, alpha = 0.45): void {
  const g = ctx.createRadialGradient(-w * 0.15, -h * 0.15, 2, -w * 0.1, -h * 0.1, w * 0.45);
  g.addColorStop(0, `rgba(255,255,255,${alpha})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ellipse(ctx, -w * 0.12, -h * 0.1, w * 0.35, h * 0.28);
  ctx.fill();
}

function dropShadow(ctx: CanvasRenderingContext2D, w: number, h: number, strength = 1): void {
  fillEllipse(ctx, 0, h * 0.34, w * 0.44 * strength, h * 0.12, C.shadow);
}

function softShadow(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  fillEllipse(ctx, 0, h * 0.3, w * 0.38, h * 0.08, 'rgba(93, 58, 26, 0.12)');
}

function sesame(ctx: CanvasRenderingContext2D, w: number, h: number, yBias = -0.12): void {
  const pts: [number, number, number, number][] = [
    [-0.22, yBias - 0.06, 3.2, 2.2], [-0.05, yBias - 0.12, 3.5, 2.4], [0.16, yBias - 0.08, 3, 2],
    [0.26, yBias + 0.02, 2.8, 1.8], [-0.14, yBias + 0.02, 2.6, 1.8], [0.06, yBias - 0.02, 3, 2],
    [0.2, yBias + 0.04, 2.5, 1.7], [-0.28, yBias - 0.01, 2.4, 1.6],
  ];
  for (const [rx, ry, rw, rh] of pts) {
    ellipse(ctx, w * rx, h * ry, rw, rh);
    ctx.fillStyle = C.sesame;
    ctx.fill();
    ctx.strokeStyle = C.outlineSoft;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

function paintBottomBun(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  dropShadow(ctx, w, h, 1.1);
  // 厚みのある側面
  fillEllipse(ctx, 0, h * 0.22, w * 0.49, h * 0.38, C.bunDark);
  fillEllipse(ctx, -w * 0.42, h * 0.08, w * 0.08, h * 0.28, '#a86220');
  fillEllipse(ctx, w * 0.42, h * 0.08, w * 0.08, h * 0.28, '#a86220');
  // 本体
  fillEllipse(ctx, 0, h * 0.1, w * 0.48, h * 0.34, C.bunMid);
  fillEllipse(ctx, 0, h * 0.04, w * 0.46, h * 0.3, C.bunLight);
  // 上面のくぼみ（具材が乗る部分）
  fillEllipse(ctx, 0, -h * 0.18, w * 0.36, h * 0.14, '#d4922a');
  fillEllipse(ctx, 0, -h * 0.2, w * 0.32, h * 0.1, '#f0c060');
  fillEllipse(ctx, 0, -h * 0.22, w * 0.26, h * 0.06, C.bunCream);
  strokeEllipse(ctx, 0, -h * 0.18, w * 0.34, h * 0.12, C.outline, 1.6, 0.35);
  strokeEllipse(ctx, 0, h * 0.08, w * 0.47, h * 0.32, C.outline, 2, 0.45);
  gloss(ctx, w, h * 1.4, 0.34);
}

function paintTopBun(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  dropShadow(ctx, w, h, 1.05);
  // 底のカット面
  fillEllipse(ctx, 0, h * 0.34, w * 0.47, h * 0.12, C.bunDark);
  fillEllipse(ctx, 0, h * 0.32, w * 0.45, h * 0.1, '#d4922a');
  // ドーム本体（高さを活かす）
  fillEllipse(ctx, 0, h * 0.08, w * 0.49, h * 0.42, C.bunDark);
  fillEllipse(ctx, 0, h * 0.0, w * 0.48, h * 0.38, C.bunMid);
  fillEllipse(ctx, 0, -h * 0.12, w * 0.44, h * 0.34, C.bunLight);
  fillEllipse(ctx, 0, -h * 0.24, w * 0.34, h * 0.22, C.bunLight);
  fillEllipse(ctx, -w * 0.12, -h * 0.18, w * 0.2, h * 0.16, C.bunCream);
  strokeEllipse(ctx, 0, h * 0.02, w * 0.47, h * 0.36, C.outline, 2.2, 0.5);
  sesame(ctx, w, h, -0.28);
  gloss(ctx, w, h * 1.6, 0.4);
}

function paintPatty(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  dropShadow(ctx, w, h);
  fillEllipse(ctx, 0, h * 0.12, w * 0.5, h * 0.42, C.pattyDark);
  fillEllipse(ctx, 0, h * 0.06, w * 0.49, h * 0.38, C.pattyMid);
  fillEllipse(ctx, -w * 0.1, h * 0.0, w * 0.2, h * 0.14, C.pattyLight);
  fillEllipse(ctx, w * 0.12, h * 0.04, w * 0.12, h * 0.08, C.pattyLight, 140);
  strokeEllipse(ctx, 0, h * 0.06, w * 0.47, h * 0.34, C.outline, 1.8, 0.35);
  ctx.strokeStyle = '#2a1508';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.45;
  ellipse(ctx, 0, h * 0.04, w * 0.4, h * 0.24);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#3e2010';
  ctx.lineWidth = 1.4;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-w * 0.3 + i * 16, h * 0.1);
    ctx.lineTo(-w * 0.22 + i * 16, h * 0.46);
    ctx.stroke();
  }
  ctx.fillStyle = '#2a1508';
  for (const [px, py] of [[-0.15, 0.15], [0.1, 0.2], [-0.05, 0.35], [0.18, 0.12]]) {
    ctx.beginPath();
    ctx.arc(w * px, h * py, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function paintCheese(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  softShadow(ctx, w, h);
  const x = -w / 2;
  const y = -h / 2;
  ctx.fillStyle = C.cheeseDrip;
  ctx.beginPath();
  ctx.moveTo(x - 3, y + 1);
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const px = x + w * t;
    const wave = y + Math.sin(t * Math.PI * 3) * 2;
    ctx.lineTo(px, wave);
  }
  ctx.lineTo(x + w + 3, y + h + 4);
  ctx.lineTo(x - 3, y + h + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.cheese;
  roundRect(ctx, x, y, w, h, 3);
  ctx.fill();
  ctx.fillStyle = C.cheeseLight;
  roundRect(ctx, x + 5, y + 1, w * 0.58, h * 0.75, 2);
  ctx.fill();
  ctx.strokeStyle = C.outlineSoft;
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.35;
  roundRect(ctx, x, y, w, h, 3);
  ctx.stroke();
  ctx.globalAlpha = 1;
  const drips = [-0.38, -0.14, 0.12, 0.34];
  for (const d of drips) {
    ctx.fillStyle = C.cheeseDrip;
    ctx.beginPath();
    ctx.moveTo(w * d, h * 0.35);
    ctx.quadraticCurveTo(w * d - 3, h * 0.55, w * d - 1, h * 0.72);
    ctx.quadraticCurveTo(w * d + 2, h * 0.58, w * d + 3, h * 0.38);
    ctx.closePath();
    ctx.fill();
  }
  gloss(ctx, w, h * 1.2, 0.24);
}

function paintLettuce(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  softShadow(ctx, w, h);
  const lobes = 9;
  for (let i = 0; i < lobes; i++) {
    const t = i / (lobes - 1);
    const x = -w / 2 + w * t;
    const wave = Math.sin(t * Math.PI * 3.5) * h * 0.32;
    const lift = Math.cos(t * Math.PI * 2) * h * 0.08;
    const colors = [C.lettuceLight, C.lettuceMid, C.lettuceDark];
    fillEllipse(ctx, x, wave * 0.2 + lift, w / lobes + 14, h * 0.92, colors[i % 3]!);
    fillEllipse(ctx, x, wave * 0.2 - h * 0.08, w / lobes + 8, h * 0.35, C.lettuceLight, 120);
  }
  ctx.strokeStyle = C.lettuceDark;
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    ctx.beginPath();
    ctx.moveTo(-w * 0.38 + t * w * 0.76, -h * 0.05);
    ctx.quadraticCurveTo(-w * 0.2 + t * w * 0.4, h * 0.15, w * 0.38 - t * w * 0.76, -h * 0.02);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  strokeEllipse(ctx, 0, 0, w * 0.45, h * 0.5, C.lettuceDark, 1.6, 0.28);
}

function paintTomato(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  dropShadow(ctx, w, h);
  fillEllipse(ctx, 0, h * 0.04, w * 0.49, h * 0.42, '#7f0000');
  fillEllipse(ctx, 0, 0, w * 0.47, h * 0.4, C.tomato);
  fillEllipse(ctx, 0, h * 0.03, w * 0.36, h * 0.28, C.tomatoInner);
  ctx.strokeStyle = '#ffcdd2';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.03);
    ctx.lineTo(Math.cos(a) * w * 0.22, h * 0.03 + Math.sin(a) * h * 0.16);
    ctx.stroke();
  }
  strokeEllipse(ctx, 0, 0, w * 0.45, h * 0.38, C.outline, 1.5, 0.28);
  ctx.fillStyle = C.tomatoSeed;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * w * 0.11, Math.sin(a) * h * 0.07 + h * 0.03, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  fillEllipse(ctx, w * 0.06, -h * 0.42, 8, 5, C.lettuceDark);
  fillEllipse(ctx, -w * 0.04, -h * 0.44, 5, 3, C.lettuceMid, 180);
  gloss(ctx, w, h, 0.28);
}

function paintPickle(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  softShadow(ctx, w, h);
  for (const cx of [-w * 0.22, w * 0.22]) {
    fillEllipse(ctx, cx, h * 0.04, w * 0.19, h * 0.44, C.pickleDark);
    fillEllipse(ctx, cx, 0, w * 0.17, h * 0.4, C.pickleMid);
    fillEllipse(ctx, cx - w * 0.03, -h * 0.04, w * 0.07, h * 0.22, C.pickleLight);
    strokeEllipse(ctx, cx, 0, w * 0.14, h * 0.3, C.pickleDark, 1.2, 0.4);
    ctx.strokeStyle = C.pickleLight;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 0.8;
    for (let r = 0; r < 4; r++) {
      const ry = -h * 0.18 + r * h * 0.11;
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.09, ry);
      ctx.lineTo(cx + w * 0.09, ry + h * 0.04);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

function paintKetchup(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  fillEllipse(ctx, 0, h * 0.1, w * 0.28, h * 0.28, C.ketchup);
  fillEllipse(ctx, -w * 0.05, -h * 0.02, w * 0.16, h * 0.18, C.ketchupBright);
  ctx.strokeStyle = C.ketchupBright;
  ctx.lineWidth = 2.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const i of [-1, 0, 1]) {
    ctx.beginPath();
    ctx.moveTo(i * 11, h * 0.06);
    ctx.quadraticCurveTo(i * 18, -h * 0.12, i * 14, -h * 0.32);
    ctx.stroke();
  }
  ctx.fillStyle = C.ketchupBright;
  const dots = [[-0.24, -0.04], [0.08, 0.08], [0.24, -0.06], [-0.06, 0.12], [0.16, 0.02]];
  for (const [dx, dy] of dots) {
    ctx.beginPath();
    ctx.arc(w * dx, h * dy, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  fillEllipse(ctx, 0, h * 0.12, w * 0.22, h * 0.08, C.ketchup, 180);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** ランタイムではテクスチャを削除・再生成しない */
export function resetIngredientTextures(): void {
  /* no-op */
}
