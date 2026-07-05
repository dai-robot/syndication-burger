export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;

export const COLORS = {
  bg: 0xfff8e8,
  tileLight: 0xfff3d0,
  tileDark: 0xf5e6b8,
  uiCard: 0xffffff,
  accent: 0xff6b35,
  sub: 0x4ecdc4,
  text: 0x2d3436,
  textLight: 0x636e72,
  guide: 0xe8a838,
  shadow: 0x5d3a1a,
} as const;

export type IngredientType =
  | 'bottom_bun'
  | 'patty'
  | 'cheese'
  | 'lettuce'
  | 'tomato'
  | 'pickle'
  | 'ketchup'
  | 'top_bun';

export type ComboLabel = 'Nice' | 'Great' | 'Perfect';

export const GAME_TITLE = 'Syndication Burger';
export const GAME_TAGLINE = 'バーガーを積もう。タップでスタート。';

export interface IngredientDef {
  type: IngredientType;
  label: string;
  labelJa: string;
  width: number;
  height: number;
  /** 中心から上面（積み上げ面）まで */
  stackTop: number;
  /** 中心から下面まで */
  stackBottom: number;
  /** 支持面へのめり込み（負で密着） */
  stackGap?: number;
  weight: number;
  friction: number;
  wobble: number;
  scoreWeight: number;
  isOrderable: boolean;
  isSource: boolean;
  isBun: boolean;
  chipColor: number;
}

export const INGREDIENT_DEFS: Record<IngredientType, IngredientDef> = {
  bottom_bun: {
    type: 'bottom_bun',
    label: 'Bottom Bun',
    labelJa: '下バンズ',
    width: 200,
    height: 72,
    stackTop: 18,
    stackBottom: 30,
    stackGap: 0,
    weight: 1.2,
    friction: 0.9,
    wobble: 0.08,
    scoreWeight: 1,
    isOrderable: false,
    isSource: false,
    isBun: true,
    chipColor: 0xe8a838,
  },
  patty: {
    type: 'patty',
    label: 'Patty',
    labelJa: 'パティ',
    width: 172,
    height: 32,
    stackTop: 13,
    stackBottom: 14,
    stackGap: -3,
    weight: 2.0,
    friction: 0.85,
    wobble: 0.04,
    scoreWeight: 1.2,
    isOrderable: true,
    isSource: false,
    isBun: false,
    chipColor: 0x5d3a1a,
  },
  cheese: {
    type: 'cheese',
    label: 'Cheese',
    labelJa: 'チーズ',
    width: 178,
    height: 18,
    stackTop: 7,
    stackBottom: 8,
    stackGap: -4,
    weight: 0.6,
    friction: 0.7,
    wobble: 0.12,
    scoreWeight: 0.8,
    isOrderable: true,
    isSource: false,
    isBun: false,
    chipColor: 0xffd93d,
  },
  lettuce: {
    type: 'lettuce',
    label: 'Lettuce',
    labelJa: 'レタス',
    width: 188,
    height: 26,
    stackTop: 10,
    stackBottom: 11,
    stackGap: -2,
    weight: 0.4,
    friction: 0.6,
    wobble: 0.18,
    scoreWeight: 0.7,
    isOrderable: true,
    isSource: false,
    isBun: false,
    chipColor: 0x7cb342,
  },
  tomato: {
    type: 'tomato',
    label: 'Tomato',
    labelJa: 'トマト',
    width: 132,
    height: 22,
    stackTop: 9,
    stackBottom: 10,
    stackGap: -2,
    weight: 0.8,
    friction: 0.4,
    wobble: 0.1,
    scoreWeight: 1.0,
    isOrderable: true,
    isSource: false,
    isBun: false,
    chipColor: 0xe53935,
  },
  pickle: {
    type: 'pickle',
    label: 'Pickle',
    labelJa: 'ピクルス',
    width: 92,
    height: 18,
    stackTop: 7,
    stackBottom: 8,
    stackGap: -2,
    weight: 0.3,
    friction: 0.5,
    wobble: 0.06,
    scoreWeight: 1.5,
    isOrderable: true,
    isSource: false,
    isBun: false,
    chipColor: 0x558b2f,
  },
  ketchup: {
    type: 'ketchup',
    label: 'Ketchup',
    labelJa: 'ケチャップ',
    width: 160,
    height: 20,
    stackTop: 8,
    stackBottom: 9,
    stackGap: -3,
    weight: 0,
    friction: 0,
    wobble: 0,
    scoreWeight: 1,
    isOrderable: false,
    isSource: true,
    isBun: false,
    chipColor: 0xd32f2f,
  },
  top_bun: {
    type: 'top_bun',
    label: 'Top Bun',
    labelJa: '上バンズ',
    width: 210,
    height: 104,
    stackTop: 50,
    stackBottom: 34,
    stackGap: -4,
    weight: 1.0,
    friction: 0.8,
    wobble: 0.06,
    scoreWeight: 1.5,
    isOrderable: false,
    isSource: false,
    isBun: true,
    chipColor: 0xf5b041,
  },
};

export const ORDERABLE_TYPES: IngredientType[] = (
  Object.values(INGREDIENT_DEFS) as IngredientDef[]
).filter((d) => d.isOrderable).map((d) => d.type);

export const TRAY_Y = 720;
export const PLAY_CENTER_X = GAME_WIDTH / 2;
export const PLAY_AREA_TOP = 160;
export const STACK_LIMIT_Y = PLAY_AREA_TOP + 20;
export const TRAY_WIDTH = 260;
export const TRAY_HEIGHT = 24;
export const TRAY_SPEED = 480;
export const DRAG_ZONE_TOP = 300;
export const BASE_FALL_SPEED = 145;
export const FALL_SPEED_INCREMENT = 18;
export const LAYER_SPEED_INCREMENT = 8;
export const MAX_FALL_SPEED = 520;

export function getSpeedPercent(fallSpeed: number): number {
  return Math.round(
    ((fallSpeed - BASE_FALL_SPEED) / (MAX_FALL_SPEED - BASE_FALL_SPEED)) * 100,
  );
}
export const BUN_DROP_INTERVAL = 4;
export const FALL_WOBBLE_INCREMENT = 0.65;
export const MAX_FALL_WOBBLE = 45;
export const MISS_PENALTY = 100;
export const MISS_COUNT_PENALTY = 200;
export const MAX_MISSES = 3;

export const KETCHUP_TARGET_MIN = 0.45;
export const KETCHUP_TARGET_MAX = 0.75;
export const KETCHUP_FILL_SPEED = 0.32;

export const COMBO_THRESHOLDS = {
  Nice: 0.55,
  Great: 0.35,
  Perfect: 0.15,
} as const;

export const COMBO_COLORS: Record<ComboLabel, number> = {
  Nice: COLORS.sub,
  Great: 0xffd93d,
  Perfect: COLORS.accent,
};

export interface GameResultData {
  totalScore: number;
  maxScore: number;
  stars: number;
  breakdown: ScoreBreakdown;
  missCount: number;
  round: number;
  stackTypes: IngredientType[];
  neatStack?: boolean;
}

export interface ScoreBreakdown {
  layers: number;
  balance: number;
  appearance: number;
  sauce: number;
  height: number;
  penalty: number;
}

export interface LandingResult {
  centerScore: number;
  orderScore: number;
  stabilityScore: number;
  comboLabel?: ComboLabel;
  comboMultiplier: number;
  total: number;
  offsetRatio: number;
}

export interface RoundConfig {
  round: number;
  fallSpeed: number;
  wobbleAmount: number;
  ingredientCount: number;
  ketchupStrictness: number;
}

export function getRoundConfig(round: number): RoundConfig {
  const speedBoost = Math.min((round - 1) * 20, 80);
  const wobble = Math.min((round - 1) * 6, 30);
  const count = Math.min(4 + Math.floor((round - 1) / 2), 7);
  const strictness = Math.min(1 + (round - 1) * 0.06, 1.3);

  return {
    round,
    fallSpeed: BASE_FALL_SPEED + speedBoost,
    wobbleAmount: wobble,
    ingredientCount: count,
    ketchupStrictness: strictness,
  };
}
