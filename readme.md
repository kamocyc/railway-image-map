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

`.env.example` ファイルを `.env` にコピーし、Supabaseの接続情報を設定します。

```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key
```

4. Supabaseのセットアップ

Supabaseダッシュボードで以下のテーブルを作成します：

```sql
CREATE TABLE station_mappings (
  id SERIAL PRIMARY KEY,
  station_cd INTEGER NOT NULL,
  station_name TEXT NOT NULL,
  video_id TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  lat FLOAT NOT NULL,
  lon FLOAT NOT NULL,
  user_id UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

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