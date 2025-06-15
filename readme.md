# Railway Image Map

鉄道路線の駅と動画をマッピングするウェブアプリケーションです。

## 機能

- 地図上に駅を表示し、クリックすると対応する動画を再生
- 新しい駅と動画のマッピングを投稿
- 投稿されたマッピングの一覧表示と管理
- ユーザー認証（ログイン/登録）

## 技術スタック

- フロントエンド: React + Vite + TypeScript
- 地図: Leaflet.js
- 動画API: YouTube iframe API
- データ保存: Supabase (PostgreSQL, REST, Auth)

## セットアップ

### 前提条件

- Node.js と npm がインストールされていること
- Supabaseアカウントを持っていること

### インストール

1. リポジトリをクローン

```bash
git clone <repository-url>
cd railway-image-map
```

2. 依存パッケージをインストール

```bash
npm install
```

3. 環境変数の設定

`.env.local.example` ファイルを `.env.local` にコピーし、supabaseの接続情報を設定します。

`.env.example` ファイルを `.env` にコピーし、geminiのAPIキーを設定します。（駅と時間の一覧の整形のみに使用）

4. Supabaseのセットアップ

Supabaseダッシュボードで、supabase/schema.sqlを実行します。

5. 開発サーバーの起動

```bash
npm run dev
```

## 使い方

1. ログインまたはアカウント登録を行います
2. 「投稿」ページから新しい駅と動画のマッピングを追加します
3. 「地図」ページで駅をクリックすると、対応する動画が再生されます
4. 「一覧」ページで投稿されたマッピングを管理できます

## ライセンス

MIT