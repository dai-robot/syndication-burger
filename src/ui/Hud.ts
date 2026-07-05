import Phaser from 'phaser';
import {
  COLORS,
  COMBO_COLORS,
  GAME_HEIGHT,
  GAME_WIDTH,
  getSpeedPercent,
  type ComboLabel,
} from '../game/GameConfig';
import { getComboDisplay, STR } from '../i18n/strings';
import { SoundManager } from '../audio/SoundManager';

export class Hud {
  private scene: Phaser.Scene;
  private scoreText!: Phaser.GameObjects.Text;
  private scoreLabel!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private remainingText!: Phaser.GameObjects.Text;
  private orderChips: Phaser.GameObjects.GameObject[] = [];
  private orderCard!: Phaser.GameObjects.Container;
  private muteBtn!: Phaser.GameObjects.Container;
  private guideText!: Phaser.GameObjects.Text;
  private guideBg!: Phaser.GameObjects.Graphics;
  private ketchupBar!: Phaser.GameObjects.Graphics;
  private ketchupBarBg!: Phaser.GameObjects.Graphics;
  private ketchupLabel!: Phaser.GameObjects.Text;
  private hudDepth = 200;
  private lastScore = 0;
  private layerCount = 0;
  private dropCount = 0;
  private speedLevel = 0;
  private finishBtn!: Phaser.GameObjects.Container;
  private finishCallback: (() => void) | null = null;
  private modeText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  private create(): void {
    this.createOrderCard();
    this.createScoreArea();
    this.createMuteButton();
    this.createGuide();
    this.createKetchupBar();
    this.createFinishButton();
    this.fixHudToCamera();
  }

  private fixHudToCamera(): void {
    const fix = (obj: Phaser.GameObjects.GameObject & { setScrollFactor?: (x: number, y?: number) => void }) => {
      obj.setScrollFactor?.(0);
    };
    fix(this.orderCard);
    fix(this.scoreLabel);
    fix(this.scoreText);
    fix(this.comboText);
    fix(this.remainingText);
    fix(this.muteBtn);
    fix(this.guideText);
    fix(this.guideBg);
    fix(this.ketchupBar);
    fix(this.ketchupBarBg);
    fix(this.ketchupLabel);
    fix(this.finishBtn);
  }

  private createOrderCard(): void {
    this.orderCard = this.scene.add.container(GAME_WIDTH / 2, 78).setDepth(this.hudDepth);

    const shadow = this.scene.add.graphics();
    shadow.fillStyle(0x000000, 0.06);
    shadow.fillRoundedRect(-158, -36, 316, 88, 18);
    this.orderCard.add(shadow);

    const bg = this.scene.add.graphics();
    bg.fillStyle(COLORS.uiCard, 1);
    bg.lineStyle(2, COLORS.accent, 0.25);
    bg.fillRoundedRect(-160, -38, 320, 86, 18);
    bg.strokeRoundedRect(-160, -38, 320, 86, 18);
    this.orderCard.add(bg);

    const accent = this.scene.add.graphics();
    accent.fillStyle(COLORS.accent, 1);
    accent.fillRect(-160, -38, 320, 5);
    this.orderCard.add(accent);

    const title = this.scene.add.text(-140, -24, STR.stack, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#FF6B35',
      letterSpacing: 2,
    });
    this.orderCard.add(title);
  }

  private createScoreArea(): void {
    const panel = this.scene.add.graphics().setDepth(this.hudDepth);
    panel.fillStyle(COLORS.uiCard, 0.92);
    panel.fillRoundedRect(12, 124, GAME_WIDTH - 24, 44, 12);
    panel.setScrollFactor(0);
    panel.lineStyle(1, 0x000000, 0.04);
    panel.strokeRoundedRect(12, 124, GAME_WIDTH - 24, 44, 12);

    this.scoreLabel = this.scene.add.text(28, 132, STR.score, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#636e72',
      letterSpacing: 1,
    }).setDepth(this.hudDepth);

    this.scoreText = this.scene.add.text(28, 146, '0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#2D3436',
    }).setDepth(this.hudDepth);

    this.comboText = this.scene.add.text(GAME_WIDTH / 2, 136, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#4ECDC4',
    }).setOrigin(0.5, 0).setDepth(this.hudDepth);

    this.remainingText = this.scene.add.text(GAME_WIDTH - 28, 146, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#636e72',
    }).setOrigin(1, 0).setDepth(this.hudDepth);
  }

  private createMuteButton(): void {
    this.muteBtn = this.scene.add.container(GAME_WIDTH - 32, 32).setDepth(this.hudDepth);
    const bg = this.scene.add.graphics();
    bg.fillStyle(COLORS.uiCard, 1);
    bg.lineStyle(1, 0x000000, 0.06);
    bg.fillCircle(0, 0, 16);
    bg.strokeCircle(0, 0, 16);
    this.muteBtn.add(bg);

    this.drawMuteIcon(this.muteBtn, SoundManager.isMuted());
    this.muteBtn.setSize(32, 32);
    this.muteBtn.setInteractive({ useHandCursor: true });
    this.muteBtn.on('pointerdown', () => {
      const muted = SoundManager.toggleMute();
      this.muteBtn.removeAll(true);
      const bg2 = this.scene.add.graphics();
      bg2.fillStyle(COLORS.uiCard, 1);
      bg2.lineStyle(1, 0x000000, 0.06);
      bg2.fillCircle(0, 0, 16);
      bg2.strokeCircle(0, 0, 16);
      this.muteBtn.add(bg2);
      this.drawMuteIcon(this.muteBtn, muted);
      this.muteBtn.setInteractive({ useHandCursor: true });
      SoundManager.playTap();
    });
  }

  private drawMuteIcon(container: Phaser.GameObjects.Container, muted: boolean): void {
    const g = this.scene.add.graphics();
    g.lineStyle(2, muted ? 0xb0b0b0 : 0xff6b35, 1);
    if (muted) {
      g.lineBetween(-5, -5, 5, 5);
      g.lineBetween(5, -5, -5, 5);
    } else {
      g.strokeCircle(0, 0, 5);
      g.beginPath();
      g.moveTo(5, -3);
      g.lineTo(8, -6);
      g.lineTo(8, 6);
      g.lineTo(5, 3);
      g.strokePath();
    }
    container.add(g);
  }

  private createGuide(): void {
    this.guideBg = this.scene.add.graphics().setDepth(this.hudDepth);
    this.guideText = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 36, STR.guideKeys, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#636e72',
    }).setOrigin(0.5).setDepth(this.hudDepth);
    this.refreshGuideBg();
  }

  private refreshGuideBg(): void {
    const w = this.guideText.width + 32;
    this.guideBg.clear();
    this.guideBg.fillStyle(COLORS.uiCard, 0.85);
    this.guideBg.fillRoundedRect(GAME_WIDTH / 2 - w / 2, GAME_HEIGHT - 52, w, 32, 16);
  }

  private createKetchupBar(): void {
    this.ketchupBarBg = this.scene.add.graphics().setDepth(this.hudDepth);
    this.ketchupBar = this.scene.add.graphics().setDepth(this.hudDepth);
    this.ketchupLabel = this.scene.add.text(GAME_WIDTH / 2, 660, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#D32F2F',
    }).setOrigin(0.5).setVisible(false).setDepth(this.hudDepth);
    this.ketchupBarBg.setVisible(false);
    this.ketchupBar.setVisible(false);
  }

  private createFinishButton(): void {
    this.finishBtn = this.scene.add.container(GAME_WIDTH / 2, 175).setDepth(this.hudDepth).setVisible(false);
    const bg = this.scene.add.graphics();
    bg.fillStyle(COLORS.sub, 1);
    bg.fillRoundedRect(-55, -16, 110, 32, 16);
    this.finishBtn.add(bg);
    this.finishBtn.add(this.scene.add.text(0, 0, STR.complete, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5));
    this.finishBtn.setSize(110, 32);
    this.finishBtn.setInteractive({ useHandCursor: true });
    this.finishBtn.on('pointerdown', () => {
      SoundManager.playTap();
      this.finishCallback?.();
    });
  }

  onFinish(callback: () => void): void {
    this.finishCallback = callback;
  }

  setFinishVisible(visible: boolean): void {
    this.finishBtn.setVisible(visible);
  }

  setInfiniteMode(): void {
    for (const c of this.orderChips) c.destroy();
    this.orderChips = [];

    this.modeText = this.scene.add.text(0, 8, STR.stackMode, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#2D3436',
    }).setOrigin(0.5);
    this.orderCard.add(this.modeText);
    this.orderChips.push(this.modeText);
    this.setGuide(STR.guidePlay);
    this.setFinishVisible(false);
  }

  updateSpeed(fallSpeed: number): void {
    this.speedLevel = fallSpeed;
    this.refreshStackStatus();
  }

  updateScore(score: number): void {
    this.scoreText.setText(String(score));
    if (score > this.lastScore) {
      this.scene.tweens.add({
        targets: this.scoreText,
        scale: 1.15,
        duration: 80,
        yoyo: true,
      });
    }
    this.lastScore = score;
  }

  updateRemaining(current: number, _total?: number): void {
    this.dropCount = current;
    this.refreshStackStatus();
  }

  updateLayers(count: number, drops?: number): void {
    this.layerCount = count;
    if (drops !== undefined) this.dropCount = drops;
    this.refreshStackStatus();
  }

  private refreshStackStatus(): void {
    const speedPct = getSpeedPercent(this.speedLevel);
    this.remainingText.setText(STR.statusLine(this.layerCount, this.dropCount, speedPct));
  }

  showCombo(label: ComboLabel): void {
    this.comboText.setText(getComboDisplay(label));
    this.comboText.setColor(`#${COMBO_COLORS[label].toString(16).padStart(6, '0')}`);
    this.comboText.setScale(0.4);
    this.comboText.setY(136);
    this.scene.tweens.add({
      targets: this.comboText,
      scale: label === 'Perfect' ? 1.15 : 1.05,
      y: 128,
      duration: 200,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 400,
      onComplete: () => {
        this.comboText.setY(136);
        this.comboText.setText('');
      },
    });
  }

  setGuide(text: string): void {
    this.guideText.setText(text);
    this.refreshGuideBg();
  }

  showKetchupBar(visible: boolean): void {
    this.ketchupBarBg.setVisible(visible);
    this.ketchupBar.setVisible(visible);
    this.ketchupLabel.setVisible(visible);
    if (visible) {
      this.ketchupLabel.setText('長押しでケチャップ！');
      this.setGuide('画面を長押ししてソースをかける');
    } else {
      this.setGuide(STR.guideDrag);
    }
  }

  updateKetchupBar(amount: number): void {
    const barX = GAME_WIDTH / 2 - 110;
    const barY = 690;
    const barW = 220;
    const barH = 18;

    this.ketchupBarBg.clear();
    this.ketchupBarBg.fillStyle(0xeeeeee, 1);
    this.ketchupBarBg.fillRoundedRect(barX, barY, barW, barH, 9);
    this.ketchupBarBg.lineStyle(1, 0x000000, 0.06);
    this.ketchupBarBg.strokeRoundedRect(barX, barY, barW, barH, 9);

    this.ketchupBar.clear();
    if (amount > 0) {
      this.ketchupBar.fillStyle(0xd32f2f, 1);
      this.ketchupBar.fillRoundedRect(barX, barY, barW * amount, barH, 9);
    }

    const tMin = 0.45;
    const tMax = 0.75;
    this.ketchupBarBg.fillStyle(0x4caf50, 0.15);
    this.ketchupBarBg.fillRoundedRect(barX + barW * tMin, barY - 3, barW * (tMax - tMin), barH + 6, 4);
    this.ketchupBarBg.lineStyle(2, 0x4caf50, 0.5);
    this.ketchupBarBg.strokeRoundedRect(barX + barW * tMin, barY - 3, barW * (tMax - tMin), barH + 6, 4);

    if (amount >= tMin && amount <= tMax) {
      this.ketchupLabel.setText('ちょうどいい！');
      this.ketchupLabel.setColor('#4CAF50');
    } else if (amount > tMax) {
      this.ketchupLabel.setText('多すぎ…');
      this.ketchupLabel.setColor('#FF6B35');
    } else if (amount > 0) {
      this.ketchupLabel.setText('もう少し…');
      this.ketchupLabel.setColor('#636E72');
    }
  }

  showMissFlash(): void {
    const flash = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xff6b35, 0.12);
    flash.setDepth(this.hudDepth - 1);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 350,
      onComplete: () => flash.destroy(),
    });
    this.scene.cameras.main.shake(120, 0.004);
  }

  destroy(): void {
    this.scoreText?.destroy();
    this.scoreLabel?.destroy();
    this.comboText?.destroy();
    this.remainingText?.destroy();
    this.orderCard?.destroy();
    this.muteBtn?.destroy();
    this.guideText?.destroy();
    this.guideBg?.destroy();
    this.ketchupBar?.destroy();
    this.ketchupBarBg?.destroy();
    this.ketchupLabel?.destroy();
    this.finishBtn?.destroy();
  }
}
