import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, COLORS } from '../game/GameConfig';
import { STR } from '../i18n/strings';
import { SoundManager } from '../audio/SoundManager';

const TITLE_BG_KEY = 'titleBg';

export class MenuScene extends Phaser.Scene {
  private titleBgReady = false;

  constructor() {
    super({ key: 'MenuScene' });
  }

  preload(): void {
    this.load.on(`filecomplete-image-${TITLE_BG_KEY}`, () => {
      this.titleBgReady = true;
    });
    this.load.image(TITLE_BG_KEY, `${import.meta.env.BASE_URL}top.png?v=2`);
  }

  create(): void {
    const hasTitleArt = this.titleBgReady && this.textures.exists(TITLE_BG_KEY);

    if (hasTitleArt) {
      this.drawTitleBackground();
    } else {
      if (this.textures.exists(TITLE_BG_KEY)) {
        this.textures.remove(TITLE_BG_KEY);
      }
      this.drawFallbackBackground();
    }
    this.createStartZone(hasTitleArt);
    this.createMuteButton();

    SoundManager.startMenuMusic();
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  private drawTitleBackground(): void {
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TITLE_BG_KEY);
    const scale = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height);
    bg.setScale(scale);
    bg.setDepth(0);
  }

  private drawFallbackBackground(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bg);
    this.add.text(GAME_WIDTH / 2, 120, STR.title, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '34px',
      fontStyle: 'bold',
      color: '#FF6B35',
      stroke: '#FFFFFF',
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 170, STR.tagline, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#636e72',
    }).setOrigin(0.5);
  }

  private startGame(): void {
    SoundManager.playTap();
    void SoundManager.resume();
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.time.delayedCall(250, () => {
      this.scene.start('GameScene', { round: 1 });
    });
  }

  private createStartZone(hasTitleArt: boolean): void {
    const zone = this.add.zone(GAME_WIDTH / 2, 728, GAME_WIDTH, 160);
    zone.setDepth(10);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.startGame());

    if (!hasTitleArt) {
      this.add.text(GAME_WIDTH / 2, 728, STR.tapToStart, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#5D3A1A',
        backgroundColor: 'rgba(255,255,255,0.75)',
        padding: { x: 14, y: 8 },
      }).setOrigin(0.5).setDepth(11);
    }

    this.input.keyboard?.once('keydown-SPACE', () => this.startGame());
    this.input.keyboard?.once('keydown-ENTER', () => this.startGame());
  }

  private createMuteButton(): void {
    const btn = this.add.container(GAME_WIDTH - 36, 36).setDepth(20);
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.92);
    bg.lineStyle(1, 0x5d3a1a, 0.12);
    bg.fillCircle(0, 0, 18);
    bg.strokeCircle(0, 0, 18);
    btn.add(bg);
    this.drawMuteIcon(btn, SoundManager.isMuted());
    btn.setSize(36, 36);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => {
      const muted = SoundManager.toggleMute();
      btn.removeAll(true);
      const bg2 = this.add.graphics();
      bg2.fillStyle(0xffffff, 0.92);
      bg2.lineStyle(1, 0x5d3a1a, 0.12);
      bg2.fillCircle(0, 0, 18);
      bg2.strokeCircle(0, 0, 18);
      btn.add(bg2);
      this.drawMuteIcon(btn, muted);
      btn.setInteractive({ useHandCursor: true });
      SoundManager.playTap();
    });
  }

  private drawMuteIcon(container: Phaser.GameObjects.Container, muted: boolean): void {
    const g = this.add.graphics();
    g.lineStyle(2, muted ? 0xb0b0b0 : 0xff6b35, 1);
    if (muted) {
      g.lineBetween(-5, -5, 5, 5);
      g.lineBetween(5, -5, -5, 5);
    } else {
      g.strokeCircle(0, 0, 5);
    }
    container.add(g);
  }
}
