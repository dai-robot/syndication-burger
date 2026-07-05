import Phaser from 'phaser';
import { markOpeningSeen } from '../utils/GameSettings';
import { STR } from '../i18n/strings';

const OPENING_GIF = `${import.meta.env.BASE_URL}syndication_burger_opening.gif?v=5`;
const OPENING_MS = 48 * 90 + 400;

export class OpeningScene extends Phaser.Scene {
  private finished = false;
  private overlay: HTMLElement | null = null;

  constructor() {
    super({ key: 'OpeningScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#FFF8E8');

    const overlay = document.createElement('div');
    overlay.className = 'opening-overlay';
    overlay.innerHTML = `
      <img class="opening-gif" src="${OPENING_GIF}" alt="${STR.title} opening" draggable="false" />
      <button type="button" class="opening-skip">${STR.skip}</button>
    `;
    document.body.appendChild(overlay);
    this.overlay = overlay;

    const img = overlay.querySelector('.opening-gif') as HTMLImageElement | null;
    const skip = overlay.querySelector('.opening-skip') as HTMLButtonElement | null;

    img?.addEventListener('contextmenu', (e) => e.preventDefault());
    img?.addEventListener('error', () => this.finish());

    skip?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.finish();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.overlay?.remove();
      this.overlay = null;
    });

    this.time.delayedCall(OPENING_MS, () => this.finish());
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    markOpeningSeen();
    this.overlay?.remove();
    this.overlay = null;
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.time.delayedCall(200, () => {
      this.scene.start('MenuScene');
    });
  }
}
