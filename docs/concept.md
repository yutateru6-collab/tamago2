# Soft Pixel Tamago — product direction

## Core
スマホから離れた時間が、キャラクターの元気と暮らしを育てる。触り続けるほどアプリ内滞在を増やすゲームにはしない。

## Why 2D
Blenderや長い動画レンダーを各状態の前提にしない。少数のスプライトフレームと小物の組み合わせで、状態・反応・季節・家具を高速に増やす。

## Visual rule
- 完全な8bitではなく Soft Pixel / HD Sprite
- キャラは32×32の論理グリッドを基準に、スマホ上で大きく表示
- 1アクション2〜4フレームを標準にする
- 背景と家具は別レイヤー
- スプライトは原則 image-rendering: pixelated
- 動画は必須にしない

## First character states
idle / blink / happy / tired / craft

## Growth loop
30分休む → 自己申告で確定 → 元気が戻る → 小物が1つ増える → 次の小さな目標が見える。

## Web limitation
ブラウザ版は端末全体の利用を検知しない。休息も使いすぎも自己申告。OS計測を導入する場合は別フェーズで扱う。
