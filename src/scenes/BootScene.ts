import Phaser from 'phaser';
import { SoundManager } from '../audio/SoundManager';
import { ensureIngredientTextures } from '../game/art/IngredientArt';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    SoundManager.init();
    document.getElementById('boot-msg')?.classList.add('hidden');
    ensureIngredientTextures(this);
    this.scene.start('MenuScene');
  }
}
