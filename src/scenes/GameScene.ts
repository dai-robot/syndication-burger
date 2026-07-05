import Phaser from 'phaser';
import {
  COLORS,
  BASE_FALL_SPEED,
  FALL_SPEED_INCREMENT,
  LAYER_SPEED_INCREMENT,
  MAX_FALL_SPEED,
  FALL_WOBBLE_INCREMENT,
  MAX_FALL_WOBBLE,
  GAME_HEIGHT,
  GAME_WIDTH,
  INGREDIENT_DEFS,
  PLAY_AREA_TOP,
  PLAY_CENTER_X,
  STACK_LIMIT_Y,
  TRAY_HEIGHT,
  TRAY_SPEED,
  TRAY_WIDTH,
  TRAY_Y,
  getRoundConfig,
  type ComboLabel,
  type IngredientType,
} from '../game/GameConfig';
import { STR } from '../i18n/strings';
import { getNextDropType } from '../game/DropSchedule';
import {
  attachFallingShadow,
  createIngredientContainer,
  getBurgerCenterX,
  getBurgerWidth,
  playLandImpact,
  playFinishSquish,
  playKetchupSquirt,
  removeFallingShadow,
  showComboPopup,
  updateFallingShadow,
  type StackItem,
} from '../game/Ingredient';
import {
  checkCollapse,
  computeLandX,
  getStackTilt,
  getSupportItem,
  isCompleteMiss,
  isNeatStack,
} from '../game/StackPhysics';
import { ScoringSystem } from '../game/Scoring';
import { computeLandCenterY, getStackPeakY, shouldLandAt } from '../game/StackLayout';
import { SoundManager } from '../audio/SoundManager';
import { Hud } from '../ui/Hud';
import { clamp } from '../utils/math';

type GamePhase = 'intro' | 'stacking' | 'collapsing' | 'complete';

interface GameSceneData {
  round: number;
}

export class GameScene extends Phaser.Scene {
  private round = 1;
  private phase: GamePhase = 'intro';
  private totalDrops = 0;
  private scoring = new ScoringSystem();
  private hud!: Hud;

  private trayX = PLAY_CENTER_X;
  private trayContainer!: Phaser.GameObjects.Container;
  private stack: StackItem[] = [];
  private falling: Phaser.GameObjects.Container | null = null;
  private fallingType: IngredientType | null = null;
  private fallSpeed = BASE_FALL_SPEED;
  private fallWobble = 0;
  private fallTimer = 0;
  private fallStartY = 140;
  private fallSpawnX = PLAY_CENTER_X;
  private isDragging = false;
  private dragPointerId = -1;
  private dropLabel: Phaser.GameObjects.Text | null = null;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  private burgerGroup!: Phaser.GameObjects.Container;
  private playAreaTop = PLAY_AREA_TOP;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData): void {
    this.round = data.round ?? 1;
  }

  create(): void {
    this.phase = 'intro';
    this.totalDrops = 0;
    this.stack = [];
    this.falling = null;
    this.fallingType = null;
    this.fallSpeed = getRoundConfig(this.round).fallSpeed;
    this.fallWobble = getRoundConfig(this.round).wobbleAmount;
    this.isDragging = false;
    this.dragPointerId = -1;
    this.trayX = PLAY_CENTER_X;

    this.scoring.reset();
    this.drawBackground();
    this.createPlayArea();
    this.createTray();
    this.burgerGroup = this.add.container(0, 0);

    this.hud = new Hud(this);
    this.hud.setInfiniteMode();
    this.hud.updateScore(0);
    this.hud.updateLayers(0, 0);
    this.hud.updateSpeed(this.fallSpeed);

    SoundManager.startGameMusic();

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    }
    this.setupInput();
    this.time.delayedCall(600, () => this.showIntroOverlay());
  }

  private showIntroOverlay(): void {
    const blocker = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.45,
    ).setDepth(300).setInteractive();

    const panel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(301);
    panel.add(this.add.text(0, -40, STR.introTitle, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      align: 'center',
    }).setOrigin(0.5));
    panel.add(this.add.text(0, 0, STR.introDrag, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#FFE0CC',
    }).setOrigin(0.5));
    panel.add(this.add.text(0, 28, STR.introRules, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#FFE0CC',
    }).setOrigin(0.5));

    const continueBtn = this.add.text(0, 72, STR.tapToContinue, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FFD966',
      backgroundColor: 'rgba(255,255,255,0.12)',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(302).setInteractive({ useHandCursor: true });

    const dismiss = () => {
      blocker.destroy();
      panel.destroy();
      continueBtn.destroy();
      this.startDropSequence();
    };

    continueBtn.on('pointerdown', dismiss);
    blocker.on('pointerdown', dismiss);
    this.input.keyboard?.once('keydown-SPACE', dismiss);
    this.input.keyboard?.once('keydown-ENTER', dismiss);
  }

  private drawBackground(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bg);

    const warmGlow = this.add.graphics();
    warmGlow.fillStyle(0xffd966, 0.06);
    warmGlow.fillCircle(GAME_WIDTH / 2, TRAY_Y - 180, 200);

    const frame = this.add.graphics();
    frame.lineStyle(3, 0x8b6914, 0.2);
    frame.strokeRoundedRect(22, this.playAreaTop - 12, GAME_WIDTH - 44, TRAY_Y - this.playAreaTop - 26, 12);
    frame.fillStyle(0xfff3c4, 0.35);
    frame.fillRoundedRect(22, this.playAreaTop - 12, GAME_WIDTH - 44, TRAY_Y - this.playAreaTop - 26, 12);

    const tileSize = 40;
    for (let row = 14; row < Math.ceil(GAME_HEIGHT / tileSize); row++) {
      for (let col = 0; col < Math.ceil(GAME_WIDTH / tileSize); col++) {
        const color = (row + col) % 2 === 0 ? COLORS.tileLight : COLORS.tileDark;
        this.add.rectangle(
          col * tileSize + tileSize / 2,
          row * tileSize + tileSize / 2,
          tileSize - 2,
          tileSize - 2,
          color,
          0.55,
        );
      }
    }

    const counter = this.add.graphics();
    counter.fillStyle(0xd4a574, 1);
    counter.fillRect(0, TRAY_Y - 60, GAME_WIDTH, GAME_HEIGHT - TRAY_Y + 60);
    counter.fillStyle(0x5d3a1a, 0.08);
    for (let x = 0; x < GAME_WIDTH; x += 24) {
      counter.fillRect(x, TRAY_Y + 40, 12, 12);
      counter.fillRect(x + 12, TRAY_Y + 52, 12, 12);
    }
  }

  private createPlayArea(): void {
    const limitLine = this.add.graphics();
    limitLine.lineStyle(2, 0xe8a838, 0.35);
    limitLine.lineBetween(30, STACK_LIMIT_Y, GAME_WIDTH - 30, STACK_LIMIT_Y);
    limitLine.fillStyle(0xfff3c4, 0.25);
    limitLine.fillRect(30, this.playAreaTop - 10, GAME_WIDTH - 60, STACK_LIMIT_Y - this.playAreaTop + 10);
  }

  private createTray(): void {
    this.trayContainer = this.add.container(this.trayX, TRAY_Y).setDepth(10);
    const shadow = this.add.graphics();
    shadow.fillStyle(0x5d3a1a, 0.18);
    shadow.fillEllipse(0, 12, TRAY_WIDTH + 18, TRAY_HEIGHT + 6);
    this.trayContainer.add(shadow);
    const tray = this.add.graphics();
    tray.fillStyle(0x5d4037, 1);
    tray.fillRoundedRect(-TRAY_WIDTH / 2, -TRAY_HEIGHT / 2, TRAY_WIDTH, TRAY_HEIGHT, 10);
    tray.fillStyle(0x8d6e63, 1);
    tray.fillRoundedRect(-TRAY_WIDTH / 2 + 4, -TRAY_HEIGHT / 2 + 2, TRAY_WIDTH - 8, TRAY_HEIGHT * 0.45, 6);
    tray.lineStyle(2, 0x3e2723, 0.45);
    tray.strokeRoundedRect(-TRAY_WIDTH / 2, -TRAY_HEIGHT / 2, TRAY_WIDTH, TRAY_HEIGHT, 10);
    tray.lineStyle(1, 0xffd966, 0.25);
    tray.strokeRoundedRect(-TRAY_WIDTH / 2 + 2, -TRAY_HEIGHT / 2 + 2, TRAY_WIDTH - 4, TRAY_HEIGHT - 4, 8);
    tray.fillStyle(0x8d6e63, 1);
    tray.fillRoundedRect(-TRAY_WIDTH / 2 + 3, -TRAY_HEIGHT / 2, TRAY_WIDTH - 6, TRAY_HEIGHT * 0.55, 8);
    this.trayContainer.add(tray);
  }

  private setupInput(): void {
    const canDrag = (pointer: Phaser.Input.Pointer): boolean =>
      pointer.y >= 130 && pointer.y < GAME_HEIGHT - 20;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y < 120 || this.phase === 'complete' || this.phase === 'collapsing') return;
      if (canDrag(pointer)) {
        this.isDragging = true;
        this.dragPointerId = pointer.id;
        this.moveTrayTo(pointer.x);
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.dragPointerId || this.dragPointerId === -1) {
        this.isDragging = false;
        this.dragPointerId = -1;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || this.phase !== 'stacking') return;
      if (this.dragPointerId !== -1 && pointer.id !== this.dragPointerId) return;
      this.moveTrayTo(pointer.x);
    });
  }

  private moveTrayTo(x: number): void {
    this.trayX = clamp(x, TRAY_WIDTH / 2 + 8, GAME_WIDTH - TRAY_WIDTH / 2 - 8);
    this.trayContainer.setX(this.trayX);
    this.syncStackToTray();
  }

  private syncStackToTray(): void {
    if (this.stack.length === 0) return;
    const base = this.stack[0]!;
    const dx = this.trayX - base.x;
    for (const item of this.stack) {
      item.x += dx;
      item.container.setX(item.x);
    }
  }

  private updateFallDifficulty(): void {
    const roundBase = getRoundConfig(this.round).fallSpeed;
    const t = this.totalDrops - 1;
    const dropBoost = t * FALL_SPEED_INCREMENT + t * t * 0.7;
    const layerBoost = this.stack.length * LAYER_SPEED_INCREMENT;
    this.fallSpeed = clamp(
      roundBase + dropBoost + layerBoost,
      roundBase,
      MAX_FALL_SPEED,
    );
    this.fallWobble = clamp(
      getRoundConfig(this.round).wobbleAmount + (this.totalDrops - 1) * FALL_WOBBLE_INCREMENT,
      0,
      MAX_FALL_WOBBLE,
    );
    this.hud.updateSpeed(this.fallSpeed);
  }

  private startDropSequence(): void {
    this.phase = 'stacking';
    this.spawnNextIngredient();
  }

  private spawnNextIngredient(): void {
    if (this.phase === 'complete' || this.isStackFull()) {
      this.finishGame(true);
      return;
    }

    this.totalDrops++;
    this.updateFallDifficulty();

    const type = getNextDropType(this.totalDrops);
    this.hud.updateLayers(this.scoring.getStackedLayers(), this.totalDrops);
    this.showDropLabel(type);

    if (type === 'bottom_bun' && this.stack.length === 0) {
      const landY = this.getLandingY(type);
      this.falling = createIngredientContainer(this, type, this.trayX, landY);
      this.fallingType = type;
      this.landIngredient();
      return;
    }

    this.fallSpawnX = PLAY_CENTER_X + (Math.random() - 0.5) * 80;
    this.fallStartY = this.playAreaTop - 20;
    this.falling = createIngredientContainer(this, type, this.fallSpawnX, this.fallStartY);
    this.fallingType = type;
    this.fallTimer = 0;
    attachFallingShadow(this, this.falling);
  }

  private showDropLabel(type: IngredientType): void {
    this.dropLabel?.destroy();
    const def = INGREDIENT_DEFS[type];
    this.dropLabel = this.add.text(GAME_WIDTH / 2, 118, def.label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: def.isBun ? '#E8A838' : '#FF6B35',
      stroke: '#FFFFFF',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(150).setScrollFactor(0);
    this.tweens.add({ targets: this.dropLabel, alpha: 0, y: 108, duration: 900, delay: 500 });
  }

  private getStackTopY(): number {
    return getStackPeakY(this.stack);
  }

  private isStackFull(): boolean {
    return this.stack.length > 0 && this.getStackTopY() <= STACK_LIMIT_Y;
  }

  private getLandingY(type: IngredientType): number {
    return computeLandCenterY(type, this.stack);
  }

  private landIngredient(): void {
    if (!this.falling || !this.fallingType) return;

    const type = this.fallingType;
    const def = INGREDIENT_DEFS[type];
    const support = getSupportItem(this.stack);
    const fallX = this.falling.x;

    if (isCompleteMiss(fallX, support, this.trayX, TRAY_WIDTH / 2)) {
      this.handleMiss();
      return;
    }

    const landY = this.getLandingY(type);
    let landX: number;

    if (this.stack.length === 0) {
      landX = this.trayX;
    } else {
      landX = computeLandX(fallX, support, this.trayX, def.friction);
    }

    this.tweens.killTweensOf(this.falling);
    removeFallingShadow(this.falling);
    this.falling.setPosition(landX, landY);
    this.falling.setScale(1);

    const stackItem: StackItem = {
      type, x: landX, y: landY,
      width: def.width, height: def.height,
      container: this.falling, landed: true,
    };
    this.stack.push(stackItem);
    this.burgerGroup.add(this.falling);

    const burgerCenter = getBurgerCenterX(this.stack);
    const offset = Math.abs(landX - burgerCenter);
    const burgerW = getBurgerWidth(this.stack);
    let comboLabel: ComboLabel | undefined;

    const isFirstBottom = type === 'bottom_bun' && this.stack.length === 1;
    if (!isFirstBottom) {
      const result = this.scoring.scoreLanding(type, offset, burgerW);
      this.hud.updateScore(this.scoring.getTotalScore());
      this.hud.updateLayers(this.scoring.getStackedLayers(), this.totalDrops);
      comboLabel = result.comboLabel;
      if (comboLabel) this.hud.showCombo(comboLabel);
    }

    SoundManager.playLand(type);
    playLandImpact(this, this.falling, type, () => {
      this.cameras.main.shake(80, type === 'patty' ? 0.006 : 0.003);
    });

    if (comboLabel) {
      showComboPopup(this, landX, landY, comboLabel);
      SoundManager.playCombo(comboLabel);
      if (comboLabel === 'Perfect' || comboLabel === 'Great') {
        playKetchupSquirt(this, landX, landY - def.height * 0.2, comboLabel === 'Perfect' ? 0.85 : 0.45);
      }
    }

    this.applyStackTilt();
    this.falling = null;
    this.fallingType = null;

    if (this.isStackFull()) {
      this.time.delayedCall(600, () => this.finishGame(true));
      return;
    }

    this.time.delayedCall(500, () => {
      this.processCollapse(() => this.spawnNextIngredient());
    });
  }

  private applyStackTilt(): void {
    const tilt = getStackTilt(this.stack);
    this.tweens.add({
      targets: this.burgerGroup,
      angle: tilt,
      duration: 300,
      ease: 'Sine.easeOut',
    });
  }

  private processCollapse(onDone: () => void): void {
    const result = checkCollapse(this.stack);
    if (result.fallen.length === 0) {
      onDone();
      return;
    }

    this.phase = 'collapsing';
    this.stack = result.remaining;
    this.scoring.registerMiss();
    this.hud.updateScore(this.scoring.getTotalScore());
    this.hud.showMissFlash();
    SoundManager.playFail();

    for (const item of result.fallen) {
      const dir = item.x > (this.stack[0]?.x ?? PLAY_CENTER_X) ? 1 : -1;
      this.tweens.add({
        targets: item.container,
        x: item.x + dir * (80 + Math.random() * 60),
        y: item.y + 120 + Math.random() * 80,
        angle: dir * (25 + Math.random() * 20),
        alpha: 0,
        duration: 650 + Math.random() * 200,
        ease: 'Quad.easeIn',
        onComplete: () => item.container.destroy(),
      });
    }

    this.hud.updateScore(this.scoring.getTotalScore());
    this.hud.updateLayers(this.scoring.getStackedLayers(), this.totalDrops);
    this.applyStackTilt();

    this.time.delayedCall(800, () => {
      if (this.stack.length === 0) {
        this.finishGame(false);
        return;
      }
      this.phase = 'stacking';
      onDone();
    });
  }

  private finishGame(_fullFrame: boolean): void {
    if (this.phase === 'complete') return;
    this.phase = 'complete';

    if (this.stack.length >= 1) {
      const burgerCenter = getBurgerCenterX(this.stack);
      const topItem = this.stack[this.stack.length - 1]!;
      const offset = this.stack.length >= 2
        ? Math.abs(topItem.x - burgerCenter) / (getBurgerWidth(this.stack) * 0.5)
        : 0;
      this.scoring.scoreFinish(this.stack, clamp(offset, 0, 1));
    }

    const resultData = {
      totalScore: this.scoring.getTotalScore(),
      maxScore: this.scoring.getMaxScore(),
      stars: this.scoring.getStars(),
      breakdown: this.scoring.getBreakdown(),
      missCount: this.scoring.getMissCount(),
      round: this.round,
      stackTypes: this.stack.map((s) => s.type),
      neatStack: isNeatStack(this.stack),
    };

    this.registry.set('lastResult', resultData);
    this.hud.updateScore(resultData.totalScore);
    SoundManager.playSquish();

    const msg = resultData.neatStack ? STR.neatStack : STR.complete;
    const completeText = this.add.text(GAME_WIDTH / 2, 280, msg, {
      fontFamily: 'Arial, sans-serif',
      fontSize: resultData.neatStack ? '30px' : '36px',
      fontStyle: 'bold',
      color: '#FF6B35',
      stroke: '#FFFFFF',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(260).setScrollFactor(0).setScale(0);

    playFinishSquish(this, this.burgerGroup, this.getStackTopY(), () => {
      this.cameras.main.shake(220, 0.01);
    });

    this.tweens.add({
      targets: completeText,
      scale: 1,
      duration: 450,
      ease: 'Back.easeOut',
      delay: 180,
      onComplete: () => {
        this.time.delayedCall(800, () => {
          this.scene.start('ResultScene', resultData);
        });
      },
    });
  }

  private handleMiss(): void {
    this.scoring.registerMiss();
    this.hud.updateScore(this.scoring.getTotalScore());
    this.hud.showMissFlash();
    SoundManager.playFail();

    if (this.falling) {
      const container = this.falling;
      this.tweens.killTweensOf(container);
      removeFallingShadow(container);
      this.tweens.add({
        targets: container,
        alpha: 0,
        y: container.y + 80,
        angle: (Math.random() - 0.5) * 30,
        duration: 400,
        onComplete: () => {
          container.destroy();
          this.falling = null;
          this.fallingType = null;
          if (this.stack.length === 0) {
            this.finishGame(false);
          } else {
            this.time.delayedCall(400, () => this.spawnNextIngredient());
          }
        },
      });
    }
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;

    if (this.cursors?.left.isDown) {
      this.moveTrayTo(this.trayX - TRAY_SPEED * dt);
    }
    if (this.cursors?.right.isDown) {
      this.moveTrayTo(this.trayX + TRAY_SPEED * dt);
    }

    if (!this.falling || !this.fallingType || this.phase !== 'stacking') return;

    const def = INGREDIENT_DEFS[this.fallingType];
    this.fallTimer += delta;

    if (this.fallWobble > 0) {
      const drift = Math.sin(this.fallTimer * 0.002) * this.fallWobble * 0.15;
      this.falling.x = this.fallSpawnX + drift;
    }

    const speed = this.fallSpeed * (1 / Math.max(def.weight, 0.5));
    this.falling.y += speed * dt;

    if (shouldLandAt(this.fallingType, this.falling.y, this.stack)) {
      this.landIngredient();
      return;
    }

    const fallProgress = clamp((this.falling.y - this.fallStartY) / (TRAY_Y - this.fallStartY), 0, 1);
    updateFallingShadow(this.falling, fallProgress);

    if (this.falling.y > GAME_HEIGHT + 80) {
      this.handleMiss();
    }
  }
}
