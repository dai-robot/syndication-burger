import Phaser from 'phaser';
import type { ComboLabel, IngredientType } from './GameConfig';
import { COMBO_COLORS, INGREDIENT_DEFS } from './GameConfig';
import { getComboDisplay, STR } from '../i18n/strings';
import { SoundManager } from '../audio/SoundManager';
import { getPartTextureKey } from './art/IngredientArt';
import { getMiniStackStep } from './StackLayout';

export interface StackItem {
  type: IngredientType;
  x: number;
  y: number;
  width: number;
  height: number;
  container: Phaser.GameObjects.Container;
  landed: boolean;
}

/** @deprecated スプライト方式に移行。drawMiniBurger / createIngredientContainer を使用 */
export function drawIngredient(
  _graphics: Phaser.GameObjects.Graphics,
  _type: IngredientType,
  _width: number,
  _height: number,
): void {
  /* no-op */
}

export function createIngredientContainer(
  scene: Phaser.Scene,
  type: IngredientType,
  x: number,
  y: number,
): Phaser.GameObjects.Container {
  const def = INGREDIENT_DEFS[type];
  const container = scene.add.container(x, y);
  const sprite = scene.add.image(0, 0, getPartTextureKey(type));
  sprite.setDisplaySize(def.width, def.height);
  container.add(sprite);

  container.setSize(def.width, def.height);
  container.setData('type', type);
  container.setData('width', def.width);
  container.setData('height', def.height);
  container.setData('sprite', sprite);
  return container;
}

export function attachFallingShadow(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
): Phaser.GameObjects.Ellipse {
  const def = INGREDIENT_DEFS[container.getData('type') as IngredientType];
  const shadow = scene.add.ellipse(
    container.x,
    container.y + def.height * 0.6,
    def.width * 0.7,
    12,
    0x5d3a1a,
    0.12,
  );
  shadow.setDepth(container.depth - 1);
  container.setData('shadow', shadow);
  return shadow;
}

export function updateFallingShadow(
  container: Phaser.GameObjects.Container,
  fallProgress: number,
): void {
  const shadow = container.getData('shadow') as Phaser.GameObjects.Ellipse | undefined;
  if (!shadow) return;
  const def = INGREDIENT_DEFS[container.getData('type') as IngredientType];
  shadow.setPosition(container.x, container.y + def.height * 0.55);
  const scale = 0.5 + fallProgress * 0.5;
  shadow.setScale(scale, 1);
  shadow.setAlpha(0.06 + fallProgress * 0.1);
}

export function removeFallingShadow(container: Phaser.GameObjects.Container): void {
  const shadow = container.getData('shadow') as Phaser.GameObjects.Ellipse | undefined;
  shadow?.destroy();
  container.setData('shadow', null);
}

export function playLandImpact(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  type: IngredientType,
  onShake?: () => void,
): void {
  const def = INGREDIENT_DEFS[type];
  const x = container.x;
  const y = container.y;

  spawnLandDust(scene, x, y + def.height * 0.35, def.width);

  switch (type) {
    case 'patty':
      container.setScale(1.15, 0.65);
      scene.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 380,
        ease: 'Bounce.easeOut',
        onStart: () => onShake?.(),
      });
      break;
    case 'cheese':
      container.setScale(1.08, 0.82);
      scene.tweens.add({
        targets: container,
        scaleX: 1.04,
        scaleY: 0.92,
        y: container.y + 5,
        duration: 120,
        ease: 'Quad.easeIn',
        onComplete: () => {
          scene.tweens.add({
            targets: container,
            scaleX: 1,
            scaleY: 1,
            y: container.y,
            duration: 220,
            ease: 'Back.easeOut',
          });
        },
      });
      break;
    case 'lettuce':
      container.setScale(1.05, 0.78);
      scene.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        angle: { from: -8, to: 6 },
        duration: 240,
        yoyo: true,
        repeat: 1,
        ease: 'Sine.easeInOut',
      });
      break;
    case 'tomato':
      container.setScale(1.1, 0.75);
      scene.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 320,
        ease: 'Bounce.easeOut',
      });
      break;
    case 'top_bun':
      container.setScale(1.08, 0.72);
      scene.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 420,
        ease: 'Bounce.easeOut',
        onStart: () => onShake?.(),
      });
      break;
    case 'bottom_bun':
      container.setScale(1.06, 0.88);
      scene.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 300,
        ease: 'Back.easeOut',
      });
      break;
    default:
      container.setScale(1 + def.wobble, 0.88);
      scene.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 300,
        ease: 'Back.easeOut',
      });
  }
}

function spawnLandDust(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
): void {
  for (let i = 0; i < 6; i++) {
    const p = scene.add.circle(
      x + (Math.random() - 0.5) * width * 0.6,
      y,
      2 + Math.random() * 2,
      0xf5e6b8,
      0.55,
    ).setDepth(8);
    scene.tweens.add({
      targets: p,
      y: y - 8 - Math.random() * 12,
      x: p.x + (Math.random() - 0.5) * 20,
      alpha: 0,
      scale: 0.3,
      duration: 280 + Math.random() * 120,
      onComplete: () => p.destroy(),
    });
  }
}

export function playKetchupSquirt(
  scene: Phaser.Scene,
  x: number,
  y: number,
  intensity = 0.5,
): void {
  const g = scene.add.graphics().setDepth(55);
  const spread = 40 + intensity * 30;
  g.fillStyle(0xd32f2f, 0.85);
  g.fillEllipse(x, y, spread * 1.6, 10 + intensity * 6);
  g.lineStyle(2 + intensity * 2, 0xff5252, 0.95);
  for (let i = -1; i <= 1; i++) {
    g.beginPath();
    g.moveTo(x + i * 14, y - 2);
    g.lineTo(x + i * 22, y - 28 - intensity * 18);
    g.lineTo(x + i * 10, y + 4);
    g.strokePath();
  }
  g.setAlpha(0);
  scene.tweens.add({
    targets: g,
    alpha: 1,
    duration: 80,
    yoyo: true,
    hold: 120,
    onComplete: () => {
      scene.tweens.add({
        targets: g,
        alpha: 0,
        duration: 200,
        onComplete: () => g.destroy(),
      });
    },
  });
  SoundManager.playKetchupDrip();
}

export function playFinishSquish(
  scene: Phaser.Scene,
  burgerGroup: Phaser.GameObjects.Container,
  stackTopY: number,
  onMid?: () => void,
): void {
  scene.tweens.add({
    targets: burgerGroup,
    scaleY: 0.72,
    scaleX: 1.08,
    y: burgerGroup.y + 6,
    duration: 160,
    ease: 'Cubic.easeIn',
    onComplete: () => {
      onMid?.();
      for (let i = 0; i < 5; i++) {
        const steam = scene.add.circle(
          burgerGroup.x + (Math.random() - 0.5) * 80,
          stackTopY + Math.random() * 20,
          3 + Math.random() * 4,
          0xffffff,
          0.35,
        ).setDepth(260);
        scene.tweens.add({
          targets: steam,
          y: steam.y - 40 - Math.random() * 30,
          alpha: 0,
          scale: 2,
          duration: 500 + Math.random() * 300,
          onComplete: () => steam.destroy(),
        });
      }
      scene.tweens.add({
        targets: burgerGroup,
        scaleY: 1,
        scaleX: 1,
        y: burgerGroup.y,
        duration: 280,
        ease: 'Back.easeOut',
      });
    },
  });
}

export function showNeatStackPopup(
  scene: Phaser.Scene,
  x: number,
  y: number,
): void {
  const color = 0xe8a838;
  const hex = '#E8A838';

  const ring = scene.add.circle(x, y - 50, 8, color, 0.3).setDepth(48);
  scene.tweens.add({
    targets: ring,
    scaleX: 7,
    scaleY: 3.5,
    alpha: 0,
    duration: 450,
    ease: 'Cubic.easeOut',
    onComplete: () => ring.destroy(),
  });

  const text = scene.add.text(x, y - 40, STR.neatStack, {
    fontFamily: 'Arial, sans-serif',
    fontSize: '18px',
    fontStyle: 'bold',
    color: hex,
    stroke: '#FFFFFF',
    strokeThickness: 4,
    align: 'center',
    wordWrap: { width: 220 },
  }).setOrigin(0.5).setScale(0.2).setAlpha(0).setDepth(50);

  scene.tweens.add({
    targets: text,
    scale: 1,
    alpha: 1,
    y: y - 78,
    duration: 300,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: text,
        alpha: 0,
        y: text.y - 20,
        duration: 500,
        delay: 350,
        onComplete: () => text.destroy(),
      });
    },
  });
}

export function showComboPopup(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: ComboLabel,
): void {
  const color = COMBO_COLORS[label];
  const hex = `#${color.toString(16).padStart(6, '0')}`;
  const display = getComboDisplay(label);
  const isPerfect = label === 'Perfect';
  const isGreat = label === 'Great';
  const fontSize = isPerfect ? '24px' : isGreat ? '28px' : '26px';

  const ring = scene.add.circle(x, y - 50, 8, color, 0.35).setDepth(48);
  scene.tweens.add({
    targets: ring,
    scaleX: isPerfect ? 8 : 6,
    scaleY: isPerfect ? 4 : 3,
    alpha: 0,
    duration: 400,
    ease: 'Cubic.easeOut',
    onComplete: () => ring.destroy(),
  });

  const text = scene.add.text(x, y - 40, display, {
    fontFamily: 'Arial, sans-serif',
    fontSize,
    fontStyle: 'bold',
    color: hex,
    stroke: '#FFFFFF',
    strokeThickness: 5,
  }).setOrigin(0.5).setScale(0.2).setAlpha(0).setDepth(50);

  scene.tweens.add({
    targets: text,
    scale: isPerfect ? 1.25 : isGreat ? 1.15 : 1.05,
    alpha: 1,
    y: y - (isPerfect ? 85 : 72),
    duration: 280,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: text,
        alpha: 0,
        y: text.y - 24,
        duration: 400,
        delay: isPerfect ? 350 : 220,
        onComplete: () => text.destroy(),
      });
    },
  });

  const sparkCount = isPerfect ? 14 : isGreat ? 10 : 6;
  const sparkColor = isPerfect ? 0xffd93d : isGreat ? 0xff6b35 : 0x4ecdc4;
  for (let i = 0; i < sparkCount; i++) {
    const spark = scene.add.graphics().setDepth(49);
    spark.fillStyle(sparkColor, 1);
    spark.fillCircle(0, 0, 2 + Math.random() * 2);
    spark.setPosition(x, y - 40);
    const angle = (Math.PI * 2 * i) / sparkCount + Math.random() * 0.3;
    const dist = 30 + Math.random() * (isPerfect ? 35 : 20);
    scene.tweens.add({
      targets: spark,
      x: x + Math.cos(angle) * dist,
      y: y - 40 + Math.sin(angle) * dist * 0.6,
      alpha: 0,
      duration: 350 + Math.random() * 150,
      onComplete: () => spark.destroy(),
    });
  }
}

export function drawKetchupLayer(
  scene: Phaser.Scene,
  x: number,
  y: number,
  amount: number,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  const spread = 60 + amount * 50;

  g.fillStyle(0xd32f2f, 0.75);
  g.fillEllipse(x, y, spread * 2, 14 + amount * 8);

  g.lineStyle(3 + amount * 4, 0xff5252, 0.85);
  for (let i = -2; i <= 2; i++) {
    g.beginPath();
    g.moveTo(x + i * 18, y - 5);
    for (let t = 0; t <= 1; t += 0.12) {
      const px = (x + i * 18) * (1 - t) * (1 - t) + (x + i * 28) * 2 * (1 - t) * t + (x + i * 8) * t * t;
      const py = (y - 5) * (1 - t) * (1 - t) + (y - 40 - amount * 30) * 2 * (1 - t) * t + (y + 8) * t * t;
      g.lineTo(px, py);
    }
    g.strokePath();
  }

  for (let i = 0; i < 4 + Math.floor(amount * 6); i++) {
    const dx = (Math.random() - 0.5) * spread * 1.5;
    g.fillStyle(0xff1744, 0.6 + Math.random() * 0.3);
    g.fillCircle(x + dx, y + (Math.random() - 0.5) * 10, 2 + Math.random() * 3);
  }

  return g;
}

export function drawMiniBurger(
  scene: Phaser.Scene,
  x: number,
  y: number,
  types: IngredientType[],
  scale = 0.35,
): Phaser.GameObjects.Container {
  const group = scene.add.container(x, y);
  group.setScale(scale);

  let offsetY = 0;
  for (const type of types) {
    const img = scene.add.image(0, offsetY, getPartTextureKey(type));
    img.setDisplaySize(INGREDIENT_DEFS[type].width, INGREDIENT_DEFS[type].height);
    group.add(img);
    offsetY -= getMiniStackStep(type) * 0.92;
  }

  return group;
}

export function getBurgerCenterX(stack: StackItem[]): number {
  if (stack.length === 0) return 0;
  return stack.reduce((sum, item) => sum + item.x, 0) / stack.length;
}

export function getBurgerWidth(stack: StackItem[]): number {
  if (stack.length === 0) return 200;
  return Math.max(...stack.map((s) => s.width));
}
