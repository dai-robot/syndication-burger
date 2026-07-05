import type { IngredientType } from './GameConfig';
import { BUN_DROP_INTERVAL, INGREDIENT_DEFS, ORDERABLE_TYPES } from './GameConfig';
import { randomPick } from '../utils/math';

/**
 * 4回に1回だけバンズ（1=下, 5=上, 9=下 … と交互）
 * それ以外は具材のみ
 */
export function getNextDropType(dropNumber: number): IngredientType {
  if ((dropNumber - 1) % BUN_DROP_INTERVAL !== 0) {
    return randomPick(ORDERABLE_TYPES);
  }

  const bunCycle = Math.floor((dropNumber - 1) / BUN_DROP_INTERVAL);
  return bunCycle % 2 === 0 ? 'bottom_bun' : 'top_bun';
}

export function isBunDrop(dropNumber: number): boolean {
  return (dropNumber - 1) % BUN_DROP_INTERVAL === 0;
}

export function getDropLabel(dropNumber: number): string {
  return INGREDIENT_DEFS[getNextDropType(dropNumber)].labelJa;
}
