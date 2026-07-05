const SETTINGS_KEY = 'syndication_burger_settings';

export interface GameSettings {
  /** User opted out of the opening GIF on launch */
  skipOpening: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
  skipOpening: false,
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GameSettings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    /* ignore */
  }

  // Migrate legacy "seen once" flag → still show opening until user opts out
  try {
    if (localStorage.getItem('syndication_burger_seen_opening') === '1') {
      return { ...DEFAULT_SETTINGS };
    }
  } catch {
    /* ignore */
  }

  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export function shouldShowOpening(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('opening') === '1') return true;
  } catch {
    /* ignore */
  }
  return !loadSettings().skipOpening;
}

export function setSkipOpening(skip: boolean): void {
  saveSettings({ ...loadSettings(), skipOpening: skip });
}

export function isSkipOpeningEnabled(): boolean {
  return loadSettings().skipOpening;
}
