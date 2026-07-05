import type { IngredientType } from './GameConfig';
import { INGREDIENT_DEFS, ORDERABLE_TYPES } from './GameConfig';
import { randomPick, shuffle } from '../utils/math';

export interface Order {
  id: string;
  ingredients: IngredientType[];
  displayNames: string[];
  difficulty: number;
}

export function generateOrder(round: number, count: number): Order {
  const pool = [...ORDERABLE_TYPES];
  const shuffled = shuffle(pool);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  if (round === 1) {
    return {
      id: `order-r${round}`,
      ingredients: ['patty', 'cheese', 'lettuce', 'tomato'],
      displayNames: ['パティ', 'チーズ', 'レタス', 'トマト'],
      difficulty: 1,
    };
  }

  return {
    id: `order-r${round}-${Date.now()}`,
    ingredients: selected,
    displayNames: selected.map((t) => INGREDIENT_DEFS[t].labelJa),
    difficulty: round,
  };
}

export function buildDropQueue(order: Order): IngredientType[] {
  const queue: IngredientType[] = ['bottom_bun'];

  for (const ing of order.ingredients) {
    queue.push(ing);
  }

  queue.push('ketchup');
  queue.push('top_bun');
  return queue;
}

export function isOrderMatch(type: IngredientType, order: Order): boolean {
  return order.ingredients.includes(type);
}

export function getExtraIngredient(type: IngredientType, order: Order): boolean {
  return INGREDIENT_DEFS[type].isOrderable && !order.ingredients.includes(type);
}

export function randomOrderableType(): IngredientType {
  return randomPick(ORDERABLE_TYPES);
}
