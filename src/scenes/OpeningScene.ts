import Phaser from 'phaser';
import { markOpeningSeen } from '../utils/GameSettings';

const OPENING_GIF = `${import.meta.env.BASE_URL}syndication_burger_opening.gif`;
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
      <img class="opening-gif" src="${OPENING_GIF}" alt="Syndication Burger opening" draggable="false" />
      <button type="button" class="opening-skip">SKIP</button>
    `;
    document.body.appendChild(overlay);
    this.overlay = overlay;

    const img = overlay.querySelector('.opening-gif') as HTMLImageElement | null;
    const skip = overlay.querySelector('.opening-skip') as HTMLButtonElement | null;

    img?.addEventListener('contextmenu', (e) => e.preventDefault());
    img?.addEventListener('error', () => {
      this.finish();
    });

    const finish = () => this.finish();

    skip?.addEventListener('click', (e) => {
      e.stopPropagation();
      finish();
    });

    overlay.addEventListener('pointerdown', (e) => {
      if (e.target === skip) return;
      finish();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.overlay?.remove();
      this.overlay = null;
    });

    this.time.delayedCall(OPENING_MS, finish);
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    markOpeningSeen();
    this.overlay?.remove();
    this.overlay = null;
    this.scene.start('MenuScene');
  }
}
