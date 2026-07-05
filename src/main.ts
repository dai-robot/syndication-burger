import Phaser from 'phaser';
import './style.css';
import { GAME_HEIGHT, GAME_WIDTH } from './game/GameConfig';
import { BootScene } from './scenes/BootScene';
import { OpeningScene } from './scenes/OpeningScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';

let game: Phaser.Game | null = null;

function destroyGame(): void {
  if (game) {
    game.destroy(true);
    game = null;
  }
}

function showFatalError(message: string, title = 'エラー'): void {
  const el = document.getElementById('boot-msg');
  if (!el) return;
  el.classList.remove('hidden');
  el.innerHTML =
    `<div><p style="font-size:18px;font-weight:bold;color:#FF6B35;margin-bottom:12px;">${title}</p>` +
    `<p style="font-size:14px;line-height:1.6;">${message}</p>` +
    `<p style="margin-top:16px;font-size:13px;color:#636e72;">ページを再読み込みしてください。開発時は <code>npm run dev</code> で<br>` +
    `<code>http://127.0.0.1:5173/</code> を開いてください。</p></div>`;
}

window.addEventListener('error', (event) => {
  showFatalError(event.message || '不明なエラー');
});

window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason instanceof Error ? event.reason.message : String(event.reason);
  showFatalError(msg);
});

try {
  destroyGame();

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'app',
    backgroundColor: '#FFF8E8',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, OpeningScene, MenuScene, GameScene, ResultScene],
    input: {
      activePointers: 2,
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: true,
    },
  };

  game = new Phaser.Game(config);
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error);
  showFatalError(msg, '起動エラー');
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    destroyGame();
  });
}
