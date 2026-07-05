import type { IngredientType } from './GameConfig';
import { INGREDIENT_DEFS, TRAY_HEIGHT, TRAY_Y } from './GameConfig';
import type { StackItem } from './Ingredient';

/** 支持面上に乗せるときのわずかなめり込み（px） */
const DEFAULT_STACK_GAP = -2;

function def(type: IngredientType) {
  return INGREDIENT_DEFS[type];
}

/** 具材の上面（次の具材が乗る面） */
export function getStackSurfaceY(item: StackItem): number {
  return item.y - def(item.type).stackTop;
}

/** 具材の下面 */
export function getStackFootY(item: StackItem): number {
  return item.y + def(item.type).stackBottom;
}

/** スタック全体の最高点 */
export function getStackPeakY(stack: StackItem[]): number {
  if (stack.length === 0) return TRAY_Y - TRAY_HEIGHT;
  let peak = Infinity;
  for (const item of stack) {
    peak = Math.min(peak, getStackSurfaceY(item));
  }
  return peak;
}

/** 一番上の具材（支持面を提供するもの） */
export function getTopStackItem(stack: StackItem[]): StackItem | null {
  if (stack.length === 0) return null;
  let topItem = stack[0]!;
  let peak = getStackSurfaceY(topItem);
  for (const item of stack) {
    const y = getStackSurfaceY(item);
    if (y < peak) {
      peak = y;
      topItem = item;
    }
  }
  return topItem;
}

/** 着地後の中心Y */
export function computeLandCenterY(type: IngredientType, stack: StackItem[]): number {
  const incoming = def(type);
  if (stack.length === 0) {
    const trayTop = TRAY_Y - TRAY_HEIGHT / 2;
    return trayTop - incoming.stackBottom;
  }
  const support = getTopStackItem(stack)!;
  const surfaceY = getStackSurfaceY(support);
  const gap = incoming.stackGap ?? DEFAULT_STACK_GAP;
  return surfaceY - incoming.stackBottom + gap;
}

/** 落下中：底が支持面に触れたか */
export function shouldLandAt(type: IngredientType, fallCenterY: number, stack: StackItem[]): boolean {
  const incoming = def(type);
  const targetCenter = computeLandCenterY(type, stack);
  return fallCenterY + incoming.stackBottom >= targetCenter + incoming.stackBottom - 2;
}

/** ミニバーガー预览の層間隔 */
export function getMiniStackStep(type: IngredientType): number {
  const d = def(type);
  return d.stackTop + d.stackBottom + (d.stackGap ?? DEFAULT_STACK_GAP);
}
