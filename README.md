# Exhibition Bot

Go TOKYOの美術展情報をLINEで通知するBotです。

## 機能

- 直近30日以内に始まる or 開催中の展示を抽出
- 「Tickets / 予約 / 公式サイト」リンクを最優先
- Flex Messageカルーセルで画像付きカード送信
- 送信済み展示は`sent_history.json`に記録し、次回以降除外
- 週1回（日曜 08:00 JST）GitHub Actionsが実行し、履歴ファイルを自動コミット

## セットアップ

1. リポジトリをクローン
```bash
git clone https://github.com/spago-official/exhibitionbot.git
cd exhibitionbot
```

2. 依存関係のインストール
```bash
npm install
```

3. 環境変数の設定
`.env`ファイルを作成し、以下の内容を設定：
```
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here
LINE_CHANNEL_SECRET=your_channel_secret_here
LINE_USER_ID=your_user_id_here
TOKYO_EXHIB_URL=https://www.gotokyo.org/jp/see-and-do/arts-and-design/art-and-exhibitions/index.html
MAX_ITEMS=6
```

4. GitHub Secretsの設定
リポジトリのSettings > Secrets and variables > Actionsで以下のシークレットを設定：
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`
- `LINE_USER_ID`
- `TOKYO_EXHIB_URL`
- `MAX_ITEMS`

## 開発

```bash
# 開発モードで実行
npm run dev

# ビルド
npm run build

# 本番モードで実行
npm start
```

## カスタマイズ

- `MAX_ITEMS`: 送信する展示の最大数（デフォルト: 6）
- `TOKYO_EXHIB_URL`: スクレイピング対象のURL
- GitHub Actionsの実行スケジュール: `.github/workflows/weekly.yml`の`cron`設定を変更

## ライセンス

MIT 