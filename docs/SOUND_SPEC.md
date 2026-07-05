# Syndication Burger! — サウンド仕様

## 方針

外部音源なし。Web Audio API（Oscillator + Gain + エンベロープ）で全音を生成。

## BGM

- **雰囲気:** 明るい、軽快、料理ミニゲーム風
- **構成:** C major ペンタトニック、120 BPM、アルペジオ + ベース
- **長さ:** 約32小節（ループ自然）
- **音量:** master × 0.12（控えめ）
- **制御:** HUD右上トグル（ON/OFF、localStorage保存）

## 効果音一覧

| イベント | 音設計 | パラメータ |
|----------|--------|-----------|
| パティ着地 | 低いドスッ | sine 80Hz, 短decay |
| チーズ着地 | 柔らかいぺたっ | triangle 200Hz |
| レタス着地 | 軽いふわっ | sine 400Hz + 短reverb風delay |
| トマト着地 | 弾む | sine 300Hz, pitch bend up |
| ピクルス着地 | 小さいカチッ | square 600Hz, 極短 |
| 下/上バンズ | 柔らかいトン | sine 150Hz |
| ケチャップ | にゅるっ | noise burst + filter sweep |
| コンボ Nice | キラン | sine 880Hz |
| コンボ Great | キラン×2 | 880→1100Hz |
| コンボ Perfect | ファンファーレ短 | 523→659→784Hz |
| 完成 | 明るいファンファーレ | C-E-G-C arpeggio |
| 失敗 | コミカル | descending sine 400→200Hz |
| UIタップ | 軽いクリック | sine 1000Hz, 30ms |

## 実装（SoundManager）

```typescript
class SoundManager {
  init(): void           // AudioContext resume on user gesture
  startBgm(): void
  stopBgm(): void
  toggleMute(): boolean
  playLand(type): void
  playCombo(label): void
  playKetchup(): void
  playComplete(): void
  playFail(): void
  playTap(): void
}
```

## 音量バランス

- SFX master: 0.25
- BGM master: 0.12
- 同時再生上限: 8 voices（古い音をカット）

## モバイル対応

- 初回タップで AudioContext.resume()
- iOS Safari: silent mode でも再生試行
- ミュート状態は localStorage `sb_mute` に保存
