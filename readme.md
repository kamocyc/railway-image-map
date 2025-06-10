# 🚆 鉄道前面展望 × 地図連携Webアプリ 要件定義書

## 🎯 概要

本アプリは、**前面展望YouTube動画**と**地図上の鉄道路線情報**を連携させ、ユーザーが地図上で路線を辿りながら、動画と連動した体験を提供するWebアプリです。

- 地図上に路線と駅を表示
- 駅クリックで該当動画を再生
- TypeScriptで構築し、保守性・拡張性を重視

---

## 🧩 技術スタック

| 項目 | 使用技術・サービス |
|------|--------------------|
| 言語 | TypeScript |
| UIフレームワーク | React |
| 地図表示 | [Leaflet](https://leafletjs.com/) |
| 地図タイル | OpenStreetMap |
| 路線データ | OSMのRelation / Node（GeoJSON変換） |
| 動画再生 | YouTube iframe API |
| 配信 | GitHub Pages / Vercel / Netlify（無料ホスティング） |

---

## 📁 データ構造

### 1. 鉄道路線データ

```json
[
    {
        "lineName": "JR横須賀線",
        "lineNameKana": "ヨコスカセン",
        "lineCd": 1110100,
        "stations": [
            {
                "stationCd": 1110121,
                "stationName": "渋谷",
                "stationNameKana": "シブヤ",
                "lat": 41.773709,
                "lon": 140.726413
            },
            {
                "stationCd": 1110101,
                "stationName": "表参道",
                "stationNameKana": "オモテサンドウ",
                "lat": 41.776835,
                "lon": 140.729262
            }
        ]
    }
]
```

### 2. 駅 ↔ 動画再生位置マッピングデータ（JSON）

```json
[
  {
    "stationCd": 1110121,
    "stationName": "渋谷",
    "videoId": "xxxxxxxxxxx",
    "startTime": 0
  },
  {
    "stationCd": 1110101,
    "stationName": "表参道",
    "videoId": "xxxxxxxxxxx",
    "startTime": 75
  }
]
```

## 機能一覧
### 地図表示
Leafletを用いて、OSMタイルと鉄道路線データを表示

駅ごとにマーカー表示

### 動画連携
駅マーカークリックで、該当YouTube動画を指定の秒数から再生

YouTube iframe API を使用し、時間を取得

## ディレクトリ構成（例）
project-root/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── MapView.ts
│   ├── data/
│   │   ├── route.geojson
│   │   └── station-times.json
│   ├── utils/
│   │   └── geo.ts
│   ├── youtube/
│   │   └── YouTubePlayer.ts
│   └── main.ts
├── types/
│   └── StationMapping.ts
├── vite.config.ts
├── tsconfig.json
└── package.json