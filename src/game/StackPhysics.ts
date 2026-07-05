import type { StackItem } from './Ingredient';
import { getBurgerCenterX, getBurgerWidth } from './Ingredient';
import { INGREDIENT_DEFS } from './GameConfig';
import { getStackSurfaceY } from './StackLayout';
import { clamp } from '../utils/math';

export interface StackAppearance {
  layerCount: number;
  avgOffset: number;
  maxOffset: number;
  symmetry: number;
  tiltAngle: number;
  appearanceScore: number;
}

export interface CollapseResult {
  fallen: StackItem[];
  remaining: StackItem[];
  collapseIndex: number;
}

/** 支持面（一番上の具材）を取得 */
export function getSupportItem(stack: StackItem[]): StackItem | null {
  if (stack.length === 0) return null;
  let topIdx = 0;
  let minY = Infinity;
  for (let i = 0; i < stack.length; i++) {
    const top = getStackSurfaceY(stack[i]!);
    if (top < minY) {
      minY = top;
      topIdx = i;
    }
  }
  return stack[topIdx]!;
}

/** 落下Xが支持面の上にあるか（はみ出し量 0〜1） */
export function getOverhangRatio(landX: number, support: StackItem): number {
  const halfW = support.width * 0.48;
  const overhang = Math.abs(landX - support.x) - halfW;
  if (overhang <= 0) return 0;
  return overhang / halfW;
}

/** 完全に乗らない → ミス */
export function isCompleteMiss(landX: number, support: StackItem | null, trayX: number, trayHalfW: number): boolean {
  if (!support) {
    return Math.abs(landX - trayX) > trayHalfW * 0.55;
  }
  return getOverhangRatio(landX, support) > 1.0;
}

/** 着地X：プレイヤーが合わせた位置を基本に、具材の摩擦で僅かに滑る */
export function computeLandX(
  fallX: number,
  support: StackItem | null,
  trayX: number,
  friction: number,
): number {
  const anchorX = support ? support.x : trayX;
  const slide = (1 - friction) * 12;
  const diff = anchorX - fallX;
  return fallX + clamp(diff, -slide, slide);
}

/** 積み上がりが不安定なら上から崩れる */
export function checkCollapse(stack: StackItem[]): CollapseResult {
  if (stack.length < 2) {
    return { fallen: [], remaining: stack, collapseIndex: -1 };
  }

  const base = stack[0]!;
  const baseX = base.x;
  const baseHalf = base.width * 0.42;

  for (let i = stack.length - 1; i >= 1; i--) {
    const item = stack[i]!;
    const offset = Math.abs(item.x - baseX);
    const heightFactor = i / stack.length;
    const allowed = baseHalf * (1 - heightFactor * 0.35) + item.width * 0.15;

    if (offset > allowed) {
      return {
        fallen: stack.slice(i),
        remaining: stack.slice(0, i),
        collapseIndex: i,
      };
    }
  }

  return { fallen: [], remaining: stack, collapseIndex: -1 };
}

export function evaluateStackAppearance(stack: StackItem[]): StackAppearance {
  if (stack.length === 0) {
    return { layerCount: 0, avgOffset: 0, maxOffset: 0, symmetry: 1, tiltAngle: 0, appearanceScore: 0 };
  }

  const base = stack[0]!;
  const center = base.x;
  const burgerW = getBurgerWidth(stack);
  const offsets = stack.map((s) => Math.abs(s.x - center));
  const avgOffset = offsets.reduce((a, b) => a + b, 0) / offsets.length;
  const maxOffset = Math.max(...offsets);
  const normalizedAvg = clamp(avgOffset / (burgerW * 0.35), 0, 1);
  const normalizedMax = clamp(maxOffset / (burgerW * 0.45), 0, 1);

  const symmetry = 1 - normalizedAvg;
  const layerCount = stack.filter(
    (s) => !INGREDIENT_DEFS[s.type].isSource && s.type !== 'bottom_bun',
  ).length;

  const appearanceScore =
    Math.round(symmetry * 300) +
    Math.round((1 - normalizedMax) * 200) +
    layerCount * 80 +
    stack.length * 35;

  return {
    layerCount,
    avgOffset: normalizedAvg,
    maxOffset: normalizedMax,
    symmetry,
    tiltAngle: clamp((center - getBurgerCenterX(stack)) * 0.02 + normalizedAvg * 5, -12, 12),
    appearanceScore,
  };
}

export function getStackTilt(stack: StackItem[]): number {
  return evaluateStackAppearance(stack).tiltAngle;
}

/** きれいに積み上がっているか */
export function isNeatStack(stack: StackItem[]): boolean {
  if (stack.length < 3) return false;
  const app = evaluateStackAppearance(stack);
  return app.symmetry >= 0.72 && app.maxOffset <= 0.38;
}
