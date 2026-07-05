import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/GameConfig';
import { SoundManager } from '../audio/SoundManager';

const TITLE_BG_KEY = 'titleBg';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload(): void {
    this.load.image(TITLE_BG_KEY, '/top.png?v=2');
  }

  create(): void {
    this.drawTitleBackground();
    this.createStartZone();
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

  private createStartZone(): void {
    const zone = this.add.zone(GAME_WIDTH / 2, 728, 310, 76);
    zone.setDepth(10);
    zone.setInteractive({ useHandCursor: true });

    zone.on('pointerdown', async () => {
      SoundManager.playTap();
      await SoundManager.resume();
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.time.delayedCall(250, () => {
        this.scene.start('GameScene', { round: 1 });
      });
    });
  }

  private createMuteButton(): void {
    const btn = this.add.container(GAME_WIDTH - 36, 36).setDepth(20);
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.9);
    bg.lineStyle(1, 0x5d3a1a, 0.12);
    bg.fillCircle(0, 0, 18);
    bg.strokeCircle(0, 0, 18);
    btn.add(bg);

    const muted = SoundManager.isMuted();
    btn.add(this.add.text(0, 0, muted ? '🔇' : '🔊', {
      fontSize: '16px',
    }).setOrigin(0.5));

    btn.setSize(36, 36);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => {
      const nowMuted = SoundManager.toggleMute();
      btn.removeAll(true);
      const bg2 = this.add.graphics();
      bg2.fillStyle(0xffffff, 0.9);
      bg2.lineStyle(1, 0x5d3a1a, 0.12);
      bg2.fillCircle(0, 0, 18);
      bg2.strokeCircle(0, 0, 18);
      btn.add(bg2);
      btn.add(this.add.text(0, 0, nowMuted ? '🔇' : '🔊', {
        fontSize: '16px',
      }).setOrigin(0.5));
      btn.setInteractive({ useHandCursor: true });
      SoundManager.playTap();
    });
  }
}
