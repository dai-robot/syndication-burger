const SEEN_KEY = 'syndication_burger_seen_opening';

export function shouldShowOpening(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('opening') === '1') return true;
  } catch {
    /* ignore */
  }
  return !hasSeenOpening();
}

export function hasSeenOpening(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markOpeningSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function resetOpeningSeen(): void {
  try {
    localStorage.removeItem(SEEN_KEY);
  } catch {
    /* ignore */
  }
}
