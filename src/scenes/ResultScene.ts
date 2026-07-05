import Phaser from 'phaser';
import type { GameResultData, IngredientType } from '../game/GameConfig';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../game/GameConfig';
import { getResultMessage, STR } from '../i18n/strings';
import { drawMiniBurger } from '../game/Ingredient';
import { SoundManager } from '../audio/SoundManager';

interface ResultSceneData extends GameResultData {
  round: number;
  stackTypes: IngredientType[];
}

export class ResultScene extends Phaser.Scene {
  private data_!: ResultSceneData;

  constructor() {
    super({ key: 'ResultScene' });
  }

  init(data: ResultSceneData): void {
    this.data_ = data?.totalScore !== undefined
      ? data
      : this.registry.get('lastResult') as ResultSceneData;
  }

  create(): void {
    SoundManager.playComplete();

    this.drawBackground();
    this.showTitle();
    this.showBurgerPreview();
    this.showStars();
    this.showScore();
    this.showBreakdown();
    this.createButtons();
  }

  private drawBackground(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bg);

    const glow = this.add.graphics();
    glow.fillStyle(0xffd93d, 0.06);
    glow.fillCircle(GAME_WIDTH / 2, 320, 180);

    const confetti = this.add.graphics();
    const colors = [0xff6b35, 0xffd93d, 0x4ecdc4, 0xe53935, 0x7cb342];
    for (let i = 0; i < 24; i++) {
      confetti.fillStyle(colors[i % colors.length]!, 0.25 + Math.random() * 0.35);
      confetti.fillCircle(Math.random() * GAME_WIDTH, Math.random() * 220, 3 + Math.random() * 5);
    }
  }

  private showTitle(): void {
    const title = this.data_.neatStack ? STR.neatStack : STR.complete;
    const titleText = this.add.text(GAME_WIDTH / 2, 52, title, {
      fontFamily: 'Arial, sans-serif',
      fontSize: this.data_.neatStack ? '28px' : '38px',
      fontStyle: 'bold',
      color: '#FF6B35',
      stroke: '#FFFFFF',
      strokeThickness: 4,
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: titleText,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut',
      delay: 200,
    });

    const msg = getResultMessage(this.data_.stars, this.data_.missCount);
    const msgText = this.add.text(GAME_WIDTH / 2, 98, msg, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#636e72',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: msgText, alpha: 1, duration: 400, delay: 500 });
  }

  private showBurgerPreview(): void {
    const burger = drawMiniBurger(this, GAME_WIDTH / 2, 340, this.data_.stackTypes, 0.32);
    burger.setAlpha(0).setScale(0);

    if (this.data_.neatStack) {
      const halo = this.add.circle(GAME_WIDTH / 2, 340, 90, 0xffd93d, 0.12).setDepth(-1);
      this.tweens.add({
        targets: halo,
        scale: 1.15,
        alpha: 0.06,
        duration: 900,
        yoyo: true,
        repeat: -1,
      });
    }

    this.tweens.add({
      targets: burger,
      alpha: 1,
      scale: 0.32,
      duration: 550,
      delay: 500,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: burger,
      y: 330,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 800,
    });
  }

  private showStars(): void {
    const starY = 198;
    const starLabel = STR.starLabels[this.data_.stars] ?? '';

    for (let i = 0; i < 3; i++) {
      const filled = i < this.data_.stars;
      const star = this.add.text(
        GAME_WIDTH / 2 + (i - 1) * 68,
        starY,
        filled ? '★' : '☆',
        {
          fontSize: '56px',
          color: filled ? '#FFD93D' : '#DFE6E9',
          stroke: filled ? '#FF6B35' : undefined,
          strokeThickness: filled ? 2 : 0,
        },
      ).setOrigin(0.5).setScale(0);

      this.tweens.add({
        targets: star,
        scale: filled ? 1.25 : 0.85,
        duration: 500,
        delay: 700 + i * 280,
        ease: 'Back.easeOut',
        onComplete: () => {
          if (filled) {
            SoundManager.playStar(i + 1);
            this.tweens.add({ targets: star, scale: 1, duration: 180 });
            this.spawnStarBurst(star.x, star.y);
          }
        },
      });
    }

    if (starLabel) {
      const label = this.add.text(GAME_WIDTH / 2, starY + 52, starLabel, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#FF6B35',
      }).setOrigin(0.5).setAlpha(0).setScale(0.8);

      this.tweens.add({
        targets: label,
        alpha: 1,
        scale: 1,
        duration: 350,
        delay: 1500,
        ease: 'Back.easeOut',
      });
    }

    if (this.data_.stars === 2) {
      this.time.delayedCall(2000, () => {
        const hint = this.add.text(GAME_WIDTH / 2, starY + 80, STR.starAlmost, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#636e72',
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: hint, alpha: 1, duration: 400, yoyo: true, hold: 1000 });
      });
    }
  }

  private spawnStarBurst(x: number, y: number): void {
    for (let i = 0; i < 10; i++) {
      const s = this.add.graphics();
      s.fillStyle(0xffd93d, 1);
      s.fillCircle(0, 0, 2 + Math.random());
      s.setPosition(x, y);
      const angle = (Math.PI * 2 * i) / 10;
      this.tweens.add({
        targets: s,
        x: x + Math.cos(angle) * (28 + Math.random() * 12),
        y: y + Math.sin(angle) * (28 + Math.random() * 12),
        alpha: 0,
        duration: 450,
        onComplete: () => s.destroy(),
      });
    }
  }

  private showScore(): void {
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.uiCard, 1);
    panel.fillRoundedRect(GAME_WIDTH / 2 - 108, 398, 216, 76, 16);
    panel.lineStyle(2, COLORS.accent, 0.15);
    panel.strokeRoundedRect(GAME_WIDTH / 2 - 108, 398, 216, 76, 16);

    this.add.text(GAME_WIDTH / 2, 410, STR.score, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#636e72',
      letterSpacing: 2,
    }).setOrigin(0.5);

    const scoreText = this.add.text(GAME_WIDTH / 2, 442, '0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '44px',
      fontStyle: 'bold',
      color: '#2D3436',
    }).setOrigin(0.5);

    const target = Math.max(0, this.data_.totalScore ?? 0);
    scoreText.setText(String(target));

    if (target > 0) {
      const counter = { score: 0 };
      scoreText.setText('0');
      this.tweens.add({
        targets: counter,
        score: target,
        duration: 900,
        delay: 400,
        ease: 'Cubic.easeOut',
        onUpdate: () => scoreText.setText(String(Math.round(counter.score))),
        onComplete: () => scoreText.setText(String(target)),
      });
    }

    this.add.text(GAME_WIDTH / 2, 466, STR.maxScore(this.data_.maxScore), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#636e72',
    }).setOrigin(0.5);
  }

  private showBreakdown(): void {
    const b = this.data_.breakdown;
    const lines = [
      STR.breakdownLayers(b.layers),
      STR.breakdownBalance(b.balance),
      STR.breakdownLook(b.appearance),
      STR.breakdownHeight(b.height),
    ];
    if (b.penalty < 0) lines.push(STR.breakdownPenalty(b.penalty));

    const card = this.add.container(GAME_WIDTH / 2, 558).setAlpha(0);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.uiCard, 1);
    bg.lineStyle(1, 0x000000, 0.05);
    bg.fillRoundedRect(-140, -76, 280, 152, 14);
    bg.strokeRoundedRect(-140, -76, 280, 152, 14);
    card.add(bg);

    lines.forEach((line, i) => {
      card.add(this.add.text(-120, -64 + i * 22, line, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#2D3436',
      }));
    });

    this.tweens.add({ targets: card, alpha: 1, duration: 400, delay: 1300 });
  }

  private createButtons(): void {
    this.createButton(GAME_WIDTH / 2, 676, STR.retry, COLORS.accent, true, () => {
      SoundManager.playTap();
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.time.delayedCall(200, () => {
        this.scene.start('GameScene', { round: this.data_.round });
      });
    });

    this.createButton(GAME_WIDTH / 2, 738, STR.nextRound(this.data_.round + 1), COLORS.sub, false, () => {
      SoundManager.playTap();
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.time.delayedCall(200, () => {
        this.scene.start('GameScene', { round: this.data_.round + 1 });
      });
    });

    const titleBtn = this.add.text(GAME_WIDTH / 2, 788, STR.backToTitle, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#636e72',
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

    titleBtn.on('pointerdown', () => {
      SoundManager.playTap();
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.time.delayedCall(200, () => {
        this.scene.start('MenuScene');
      });
    });

    this.tweens.add({ targets: titleBtn, alpha: 1, duration: 300, delay: 1600 });
  }

  private createButton(
    x: number, y: number, label: string, color: number,
    primary: boolean, onClick: () => void,
  ): void {
    const btn = this.add.container(x, y);
    const w = primary ? 260 : 270;
    const h = primary ? 56 : 44;

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    if (primary) {
      bg.lineStyle(3, 0xffffff, 0.3);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
      const shine = this.add.graphics();
      shine.fillStyle(0xffffff, 0.12);
      shine.fillRoundedRect(-w / 2 + 8, -h / 2 + 6, w - 16, h * 0.35, 10);
      btn.add(shine);
    }
    btn.add(bg);

    btn.add(this.add.text(0, 0, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: primary ? '22px' : '15px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5));

    btn.setSize(w, h);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', onClick);
    btn.on('pointerover', () => this.tweens.add({ targets: btn, scale: 1.05, duration: 80 }));
    btn.on('pointerout', () => this.tweens.add({ targets: btn, scale: 1, duration: 80 }));

    btn.setScale(0);
    this.tweens.add({
      targets: btn,
      scale: 1,
      duration: 480,
      delay: primary ? 1400 : 1550,
      ease: 'Back.easeOut',
    });

    if (primary) {
      this.tweens.add({
        targets: btn,
        scale: 1.04,
        duration: 750,
        yoyo: true,
        repeat: -1,
        delay: 2200,
        ease: 'Sine.easeInOut',
      });
    }
  }
}
