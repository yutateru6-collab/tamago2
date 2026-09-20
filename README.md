# tamago2 — Soft Pixel Tamago

スマホから離れた時間が、キャラクターの暮らしを少しずつ育てるデジタルデトックスアプリの2D版。

## 方針
- tamago本体は保持し、tamago2は別系統で開発する
- Blender/動画を前提にしない
- Soft Pixel / HD Sprite で、少数フレームを組み合わせて動きを量産する
- Web版は端末全体の使用時間を検知したと主張しない
- 休息は自己申告で確定する
- 30分休むごとに、キャラの表情・部屋・小物が少しずつ豊かになる

## 最初のプロトタイプ
1キャラ、1部屋、idle/blink/happy/tired/craft の軽量状態表現と、30分休息・成長・開発者用早送りを実装する。


## Cloudflare Workers
Cloudflare Workers Static Assets で配信する。公開対象はリポジトリ直下の `index.html` / `app.js` / `styles.css` のみで、`.assetsignore` により `node_modules`、テスト、GitHub Actions、ドキュメント等を除外する。

Deploy command: `npx wrangler deploy`
