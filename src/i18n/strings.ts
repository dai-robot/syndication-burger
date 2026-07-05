/** 日本語 UI 文言 */
export const STR = {
  title: 'Syndication Burger',
  tagline: 'バーガーを積もう。タップでスタート',
  loading: '読み込み中…',
  skip: 'スキップ',
  tapToStart: 'TAP TO START',
  tapToContinue: 'タップして続ける',

  stack: 'スタック',
  score: 'スコア',
  stackMode: '4回に1回バンズ · 枠いっぱいでクリア',

  guideDrag: 'ドラッグでトレーを動かす',
  guidePlay: '左右にドラッグ · ズレると崩れる',
  guideKeys: 'ドラッグまたは ← → キー',

  introTitle: 'しっかり積もう！',
  introDrag: '左右にドラッグして受け止める',
  introRules: '4回に1回バンズ · 枠いっぱいでクリア',

  complete: '完成！',
  neatStack: '美しいアロケーション',

  retry: '▶ もう一度',
  nextRound: (round: number) => `難易度アップ (R${round})`,
  backToTitle: 'タイトルへ',
  starAlmost: 'あと少しで★3！',

  breakdownLayers: (n: number) => `積み上げ      +${n}`,
  breakdownBalance: (n: number) => `バランス      +${n}`,
  breakdownLook: (n: number) => `見た目        +${n}`,
  breakdownHeight: (n: number) => `高さボーナス  +${n}`,
  breakdownPenalty: (n: number) => `ミス          ${n}`,

  statusLine: (layers: number, drops: number, speedPct: number) =>
    `${layers}層 · #${drops} · 速度 ${Math.max(speedPct, 0)}%`,

  maxScore: (max: number) => `/ ${max} 点`,

  starLabels: ['', 'いい感じ！', 'すばらしい！', '完璧！'] as const,
} as const;

export function getComboDisplay(label: 'Nice' | 'Great' | 'Perfect'): string {
  switch (label) {
    case 'Nice': return 'ナイス！';
    case 'Great': return 'グレート！';
    case 'Perfect': return 'パーフェクト！';
  }
}

export function getResultMessage(stars: number, missCount: number): string {
  if (stars >= 3) return '完璧！プロ級の技！';
  if (stars >= 2) return 'おいしそう！あと一歩！';
  if (stars >= 1) return 'いい感じ！もっと高得点を目指そう';
  if (missCount >= 2) return '落としすぎ…手を安定させよう';
  return '練習あるのみ！';
}
