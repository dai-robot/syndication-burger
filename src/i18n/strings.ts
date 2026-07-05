/** Global English UI copy for Syndication Burger */
export const STR = {
  title: 'Syndication Burger',
  tagline: 'Stack the burger. Tap to start.',
  loading: 'Loading…',
  skip: 'Skip',
  tapToStart: 'TAP TO START',
  tapToContinue: 'Tap to continue',

  stack: 'STACK',
  score: 'SCORE',
  stackMode: 'Bun every 4 drops · Fill the frame',

  guideDrag: 'Drag to move the tray',
  guidePlay: 'Drag left/right · Misalign and it topples',
  guideKeys: 'Drag or use ← → keys',

  introTitle: 'Stack it steady!',
  introDrag: 'Drag left and right to catch',
  introRules: 'Bun every 4 drops · Fill the frame to finish',

  complete: 'Complete!',
  neatStack: 'Beautiful Allocation',

  retry: '▶  Play Again',
  nextRound: (round: number) => `Harder Mode (R${round})`,
  backToTitle: 'Back to Title',
  starAlmost: 'Almost ★3!',

  breakdownLayers: (n: number) => `Layers        +${n}`,
  breakdownBalance: (n: number) => `Balance       +${n}`,
  breakdownLook: (n: number) => `Presentation  +${n}`,
  breakdownHeight: (n: number) => `Height bonus  +${n}`,
  breakdownPenalty: (n: number) => `Misses        ${n}`,

  statusLine: (layers: number, drops: number, speedPct: number) =>
    `${layers} layers · #${drops} · SPD ${Math.max(speedPct, 0)}%`,

  maxScore: (max: number) => `/ ${max} pts`,
} as const;

export function getComboDisplay(label: 'Nice' | 'Great' | 'Perfect'): string {
  return label;
}

export function getResultMessage(stars: number, missCount: number): string {
  if (stars >= 3) return 'Flawless! Chef-level skills!';
  if (stars >= 2) return 'Looks delicious — almost perfect!';
  if (stars >= 1) return 'Nice stack! Go for a higher score.';
  if (missCount >= 2) return 'Too many drops — steady your hands.';
  return 'Keep practicing — you’ve got this!';
}
