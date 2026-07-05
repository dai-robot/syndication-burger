import type { IngredientType } from '../GameConfig';
import { INGREDIENT_DEFS } from '../GameConfig';

const PREFIX = 'part_';

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

let baked = false;

export function getPartTextureKey(type: IngredientType): string {
  return `${PREFIX}${type}`;
}

export function ensureIngredientTextures(scene: Phaser.Scene): void {
  if (baked) return;
  for (const type of Object.keys(INGREDIENT_DEFS) as IngredientType[]) {
    bakePart(scene, type);
  }
  baked = true;
}

function bakePart(scene: Phaser.Scene, type: IngredientType): void {
  const def = INGREDIENT_DEFS[type];
  const w = def.width;
  const h = def.height;
  const scale = 2;

  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(scale, scale);
  ctx.translate(w / 2, h / 2);
  paintPart(ctx, type, w, h);

  const key = getPartTextureKey(type);
  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }
  scene.textures.addCanvas(key, canvas);
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
): void {
  ellipse(ctx, x, y, rw, rh);
  ctx.fillStyle = color;
  ctx.fill();
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

function dropShadow(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  fillEllipse(ctx, 0, h * 0.28, w * 0.44, h * 0.14, C.shadow);
}

function sesame(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const pts: [number, number][] = [
    [-0.2, -0.14], [-0.04, -0.22], [0.14, -0.17], [0.24, -0.08],
    [-0.12, -0.05], [0.08, -0.08], [0.2, -0.02],
  ];
  for (const [rx, ry] of pts) {
    ellipse(ctx, w * rx, h * ry, 3, 2);
    ctx.fillStyle = C.sesame;
    ctx.fill();
    ctx.strokeStyle = C.outlineSoft;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
}

function paintBottomBun(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  dropShadow(ctx, w, h);
  fillEllipse(ctx, 0, h * 0.14, w * 0.48, h * 0.32, C.bunDark);
  fillEllipse(ctx, 0, h * 0.08, w * 0.47, h * 0.3, C.bunMid);
  fillEllipse(ctx, 0, h * 0.02, w * 0.45, h * 0.27, C.bunLight);
  fillEllipse(ctx, -w * 0.08, h * 0.01, w * 0.2, h * 0.12, C.bunCream);
  strokeEllipse(ctx, 0, h * 0.08, w * 0.46, h * 0.3, C.outline, 2, 0.5);
  gloss(ctx, w, h, 0.38);
}

function paintTopBun(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  dropShadow(ctx, w, h);
  fillEllipse(ctx, 0, h * 0.22, w * 0.46, h * 0.24, C.bunDark);
  fillEllipse(ctx, 0, h * 0.08, w * 0.48, h * 0.34, C.bunMid);
  fillEllipse(ctx, 0, h * 0.02, w * 0.44, h * 0.3, C.bunLight);
  fillEllipse(ctx, -w * 0.1, -h * 0.04, w * 0.18, h * 0.14, C.bunCream);
  strokeEllipse(ctx, 0, h * 0.08, w * 0.46, h * 0.32, C.outline, 2.2, 0.55);
  sesame(ctx, w, h);
  gloss(ctx, w, h, 0.42);
}

function paintPatty(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  dropShadow(ctx, w, h);
  fillEllipse(ctx, 0, h * 0.1, w * 0.5, h * 0.38, C.pattyDark);
  fillEllipse(ctx, 0, h * 0.06, w * 0.48, h * 0.35, C.pattyMid);
  fillEllipse(ctx, -w * 0.08, h * 0.02, w * 0.18, h * 0.12, C.pattyLight);
  strokeEllipse(ctx, 0, h * 0.06, w * 0.46, h * 0.32, C.outline, 1.8, 0.35);
  ctx.strokeStyle = '#2a1508';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5;
  ellipse(ctx, 0, h * 0.04, w * 0.38, h * 0.22);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1.2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-w * 0.28 + i * 18, h * 0.08);
    ctx.lineTo(-w * 0.2 + i * 18, h * 0.42);
    ctx.stroke();
  }
}

function paintCheese(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  dropShadow(ctx, w, h);
  const x = -w / 2;
  const y = -h / 2;
  ctx.fillStyle = C.cheeseDrip;
  roundRect(ctx, x - 2, y - 1, w + 4, h + 3, 4);
  ctx.fill();
  ctx.fillStyle = C.cheese;
  roundRect(ctx, x, y, w, h, 3);
  ctx.fill();
  ctx.fillStyle = C.cheeseLight;
  roundRect(ctx, x + 4, y, w * 0.55, h * 0.72, 2);
  ctx.fill();
  ctx.strokeStyle = C.outlineSoft;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.4;
  roundRect(ctx, x, y, w, h, 3);
  ctx.stroke();
  ctx.globalAlpha = 1;
  const dripY = h * 0.38;
  const drips = [-0.36, -0.1, 0.16, 0.36];
  for (const d of drips) {
    ctx.fillStyle = C.cheeseDrip;
    ctx.beginPath();
    ctx.moveTo(w * d, dripY - 2);
    ctx.lineTo(w * d - 4, dripY + 4);
    ctx.lineTo(w * d + 4, dripY + 5);
    ctx.closePath();
    ctx.fill();
  }
  gloss(ctx, w, h, 0.28);
}

function paintLettuce(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  dropShadow(ctx, w, h);
  const lobes = 8;
  for (let i = 0; i < lobes; i++) {
    const t = i / (lobes - 1);
    const x = -w / 2 + w * t;
    const wave = Math.sin(t * Math.PI * 3) * h * 0.28;
    const colors = [C.lettuceLight, C.lettuceMid, C.lettuceDark];
    fillEllipse(ctx, x, wave * 0.25, w / lobes + 12, h * 0.85, colors[i % 3]!);
  }
  fillEllipse(ctx, 0, 0, w * 0.28, h * 0.35, 'rgba(174, 213, 129, 0.45)');
  strokeEllipse(ctx, 0, 0, w * 0.44, h * 0.48, C.lettuceDark, 1.8, 0.3);
}

function paintTomato(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  dropShadow(ctx, w, h);
  fillEllipse(ctx, 0, h * 0.02, w * 0.48, h * 0.4, '#8b0000');
  fillEllipse(ctx, 0, 0, w * 0.46, h * 0.38, C.tomato);
  fillEllipse(ctx, 0, h * 0.02, w * 0.34, h * 0.26, C.tomatoInner);
  strokeEllipse(ctx, 0, 0, w * 0.44, h * 0.36, C.outline, 1.5, 0.25);
  ctx.strokeStyle = '#ffccbc';
  ctx.lineWidth = 1.2;
  ellipse(ctx, 0, h * 0.02, w * 0.26, h * 0.18);
  ctx.stroke();
  ctx.fillStyle = C.tomatoSeed;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * w * 0.1, Math.sin(a) * h * 0.06 + h * 0.02, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  fillEllipse(ctx, w * 0.08, -h * 0.38, 7, 4, C.lettuceDark);
  gloss(ctx, w, h, 0.3);
}

function paintPickle(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  dropShadow(ctx, w, h);
  for (const cx of [-w * 0.22, w * 0.22]) {
    fillEllipse(ctx, cx, h * 0.02, w * 0.18, h * 0.42, C.pickleDark);
    fillEllipse(ctx, cx, 0, w * 0.16, h * 0.38, C.pickleMid);
    fillEllipse(ctx, cx - w * 0.02, -h * 0.02, w * 0.06, h * 0.2, C.pickleLight);
    strokeEllipse(ctx, cx, 0, w * 0.13, h * 0.28, C.pickleDark, 1.2, 0.45);
    for (let r = 0; r < 3; r++) {
      const ry = -h * 0.16 + r * h * 0.14;
      ctx.strokeStyle = C.pickleDark;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.08, ry);
      ctx.lineTo(cx + w * 0.08, ry + h * 0.03);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

function paintKetchup(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  fillEllipse(ctx, 0, h * 0.08, w * 0.26, h * 0.26, C.ketchup);
  fillEllipse(ctx, -w * 0.04, -h * 0.02, w * 0.14, h * 0.16, C.ketchupBright);
  ctx.strokeStyle = C.ketchupBright;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  for (const i of [-1, 0, 1]) {
    ctx.beginPath();
    ctx.moveTo(i * 10, h * 0.04);
    ctx.lineTo(i * 16, -h * 0.28);
    ctx.stroke();
  }
  ctx.fillStyle = C.ketchupBright;
  const dots = [[-0.22, -0.05], [0.1, 0.06], [0.22, -0.08], [-0.05, 0.1]];
  for (const [dx, dy] of dots) {
    ctx.beginPath();
    ctx.arc(w * dx, h * dy, 2, 0, Math.PI * 2);
    ctx.fill();
  }
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

/** テスト・再生成用 */
export function resetIngredientTextures(): void {
  baked = false;
}
