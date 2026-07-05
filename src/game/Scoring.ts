import type { ComboLabel, IngredientType, ScoreBreakdown } from './GameConfig';
import {
  COMBO_THRESHOLDS,
  INGREDIENT_DEFS,
  KETCHUP_TARGET_MAX,
  KETCHUP_TARGET_MIN,
  MISS_COUNT_PENALTY,
  MISS_PENALTY,
  MAX_MISSES,
} from './GameConfig';
import type { LandingResult } from './GameConfig';
import type { StackItem } from './Ingredient';
import { evaluateStackAppearance } from './StackAppearance';
import { clamp } from '../utils/math';

export class ScoringSystem {
  private totalScore = 0;
  private breakdown: ScoreBreakdown = {
    layers: 0,
    balance: 0,
    appearance: 0,
    sauce: 0,
    height: 0,
    penalty: 0,
  };
  private comboStreak = 0;
  private cumulativeOffset = 0;
  private landingCount = 0;
  private stackedLayers = 0;
  private missCount = 0;
  private maxPossible = 800;

  reset(): void {
    this.totalScore = 0;
    this.breakdown = { layers: 0, balance: 0, appearance: 0, sauce: 0, height: 0, penalty: 0 };
    this.comboStreak = 0;
    this.cumulativeOffset = 0;
    this.landingCount = 0;
    this.stackedLayers = 0;
    this.missCount = 0;
    this.maxPossible = 800;
  }

  registerMaxLanding(type: IngredientType): void {
    const def = INGREDIENT_DEFS[type];
    if (def.isSource || type === 'bottom_bun') return;
    this.maxPossible += Math.round(100 * def.scoreWeight + 150 + 120);
  }

  scoreLanding(
    type: IngredientType,
    offsetRatio: number,
    burgerWidth: number,
  ): LandingResult {
    const def = INGREDIENT_DEFS[type];
    if (def.isSource || type === 'bottom_bun') {
      return {
        centerScore: 0,
        orderScore: 0,
        stabilityScore: 0,
        comboMultiplier: 1,
        total: 0,
        offsetRatio,
      };
    }

    const normalizedOffset = clamp(offsetRatio / (burgerWidth * 0.5), 0, 1);
    const layerScore = Math.round(100 * def.scoreWeight);
    const balanceScore = Math.round((1 - normalizedOffset) * 150);

    this.stackedLayers++;
    this.cumulativeOffset += normalizedOffset;
    this.landingCount++;

    let comboLabel: ComboLabel | undefined;
    let comboMultiplier = 1;

    if (normalizedOffset <= COMBO_THRESHOLDS.Perfect) {
      this.comboStreak++;
      comboLabel = 'Perfect';
      comboMultiplier = 1.8;
    } else if (normalizedOffset <= COMBO_THRESHOLDS.Great) {
      this.comboStreak++;
      comboLabel = 'Great';
      comboMultiplier = 1.4;
    } else if (normalizedOffset <= COMBO_THRESHOLDS.Nice) {
      this.comboStreak++;
      comboLabel = 'Nice';
      comboMultiplier = 1.15;
    } else {
      this.comboStreak = 0;
    }

    const comboBonus = comboLabel ? Math.round(40 * this.comboStreak) : 0;
    const total = Math.round((layerScore + balanceScore) * comboMultiplier) + comboBonus;

    this.breakdown.layers += layerScore;
    this.breakdown.balance += balanceScore + comboBonus;
    this.totalScore += total;

    return {
      centerScore: layerScore,
      orderScore: 0,
      stabilityScore: balanceScore,
      comboLabel,
      comboMultiplier,
      total,
      offsetRatio: normalizedOffset,
    };
  }

  scoreKetchup(amount: number, strictness: number): number {
    const targetMid = (KETCHUP_TARGET_MIN + KETCHUP_TARGET_MAX) / 2;
    const range = (KETCHUP_TARGET_MAX - KETCHUP_TARGET_MIN) / 2 / strictness;

    let score: number;
    if (amount >= KETCHUP_TARGET_MIN && amount <= KETCHUP_TARGET_MAX) {
      score = Math.round(120 * (1 - Math.abs(amount - targetMid) / range));
    } else if (amount < KETCHUP_TARGET_MIN) {
      score = Math.round(-30 - (KETCHUP_TARGET_MIN - amount) * 60);
    } else {
      score = Math.round(-30 - (amount - KETCHUP_TARGET_MAX) * 50);
    }

    this.breakdown.sauce += score;
    this.totalScore += score;
    this.maxPossible += 120;
    return score;
  }

  scoreFinish(stack: StackItem[], topBunOffset: number): number {
    const appearance = evaluateStackAppearance(stack);
    const topBonus = Math.round((1 - clamp(topBunOffset, 0, 1)) * 150);

    this.breakdown.appearance += appearance.appearanceScore;
    this.breakdown.height += topBonus + appearance.layerCount * 20;
    this.maxPossible += appearance.appearanceScore + 150 + appearance.layerCount * 20;

    const total = appearance.appearanceScore + topBonus + appearance.layerCount * 20;
    this.totalScore += total;
    return total;
  }

  registerMiss(): number {
    this.missCount++;
    let penalty = MISS_PENALTY;
    if (this.missCount >= MAX_MISSES) penalty += MISS_COUNT_PENALTY;
    this.breakdown.penalty -= penalty;
    this.totalScore -= penalty;
    this.comboStreak = 0;
    return penalty;
  }

  getStars(): number {
    const layers = this.stackedLayers;
    const ratio = this.totalScore / Math.max(this.maxPossible, 1);
    if (layers >= 12 && ratio >= 0.55) return 3;
    if (layers >= 8 && ratio >= 0.45) return 2;
    if (layers >= 4) return 1;
    return 0;
  }

  getTotalScore(): number {
    return Math.max(0, this.totalScore);
  }

  getBreakdown(): ScoreBreakdown {
    return { ...this.breakdown };
  }

  getMissCount(): number {
    return this.missCount;
  }

  getMaxScore(): number {
    return this.maxPossible;
  }

  getStackedLayers(): number {
    return this.stackedLayers;
  }

  getComboStreak(): number {
    return this.comboStreak;
  }
}
