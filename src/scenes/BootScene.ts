import Phaser from 'phaser';
import { SoundManager } from '../audio/SoundManager';
import { ensureIngredientTextures } from '../game/art/IngredientArt';
import { shouldShowOpening } from '../utils/GameSettings';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    SoundManager.init();
    document.getElementById('boot-msg')?.classList.add('hidden');
    ensureIngredientTextures(this);
    this.time.delayedCall(0, () => {
      this.scene.start(shouldShowOpening() ? 'OpeningScene' : 'MenuScene');
    });
  }
}
