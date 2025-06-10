## ☁️ バックエンド & データ保存（無料）
項目	無料で使える選択肢	備考
データベース	Supabase（PostgreSQL互換、無料枠あり）	Firebaseと違ってSQLが使える
バックエンド	Supabase API（自動でRESTとGraphQL生成）	ほぼノーコード運用可
認証	Supabase Auth（GitHub, Googleログインなど）	権限制御も無料枠でOK

## ✅ この構成のメリット
すべて無料枠で始められる

Supabaseはデータブラウザ・認証・自動API付きで便利

データの閲覧は静的にキャッシュすることで高速表示も可能

自分だけで完結可能、インフラ構築不要

## 🧪 こんな画面構成が想定できます
画面	機能
地図画面	駅・路線表示、クリックで動画再生
投稿画面	駅名・位置・YouTube ID・開始秒数の登録
一覧画面	投稿されたマッピング一覧（編集・削除可能）
管理画面（任意）	投稿者ごとの管理や通報など（認証ありの場合）

## 🔚 まとめ：最終的なおすすめ構成
カテゴリ	技術
フロント	React + Vite + TypeScript
地図	Leaflet.js
動画API	YouTube iframe API
データ保存	Supabase (PostgreSQL, REST, Auth)
ホスティング	Netlify

## DBに入れるデータ構造をJSONで表したもの
```
[
  {
    "stationCd": 1123142,
    "stationName": "長町",
    "videoId": "zBtJUyfPh5E",
    "startTime": 0,
    "lat": 38.226797,
    "lon": 140.885986
  },
  {
    "stationCd": 1123141,
    "stationName": "太子堂",
    "videoId": "zBtJUyfPh5E",
    "startTime": 75,
    "lat": 38.21711,
    "lon": 140.883436
  }
]
```
