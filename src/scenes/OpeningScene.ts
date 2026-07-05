import Phaser from 'phaser';
import { STR } from '../i18n/strings';

const OPENING_GIF = `${import.meta.env.BASE_URL}syndication_burger_opening.gif?v=6`;
const OPENING_MS = 48 * 90 + 400;
const MIN_OPENING_MS = 2200;

export class OpeningScene extends Phaser.Scene {
  private finished = false;
  private overlay: HTMLElement | null = null;
  private startedAt = 0;
  private finishTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: 'OpeningScene' });
  }

  create(): void {
    this.startedAt = this.time.now;
    this.cameras.main.setBackgroundColor('#FFF8E8');

    const overlay = document.createElement('div');
    overlay.className = 'opening-overlay';
    overlay.innerHTML = `
      <img class="opening-gif" src="${OPENING_GIF}" alt="${STR.title} opening" draggable="false" />
      <div class="opening-fallback" hidden>
        <p class="opening-fallback-title">${STR.title}</p>
        <p class="opening-fallback-copy">${STR.tagline}</p>
      </div>
      <button type="button" class="opening-skip">${STR.skip}</button>
    `;
    document.body.appendChild(overlay);
    this.overlay = overlay;

    const img = overlay.querySelector('.opening-gif') as HTMLImageElement | null;
    const fallback = overlay.querySelector('.opening-fallback') as HTMLElement | null;
    const skip = overlay.querySelector('.opening-skip') as HTMLButtonElement | null;

    img?.addEventListener('contextmenu', (e) => e.preventDefault());
    img?.addEventListener('error', () => {
      if (img) img.style.display = 'none';
      fallback?.removeAttribute('hidden');
    });

    skip?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.finish();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.finishTimer?.remove(false);
      this.finishTimer = null;
      this.overlay?.remove();
      this.overlay = null;
    });

    this.finishTimer = this.time.delayedCall(OPENING_MS, () => this.finish());
  }

  private finish(): void {
    if (this.finished) return;

    const elapsed = this.time.now - this.startedAt;
    if (elapsed < MIN_OPENING_MS) {
      this.finishTimer?.remove(false);
      this.finishTimer = this.time.delayedCall(MIN_OPENING_MS - elapsed, () => this.finish());
      return;
    }

    this.finished = true;
    this.finishTimer?.remove(false);
    this.finishTimer = null;
    this.overlay?.remove();
    this.overlay = null;
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.time.delayedCall(200, () => {
      this.scene.start('MenuScene');
    });
  }
}
