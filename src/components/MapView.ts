import type LType from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/markers.css';
import { RailwayVideo } from '../types/RailwayData';
import { YouTubePlayer } from '../youtube/YouTubePlayer';

// マップを初期化し、駅マーカーを追加する関数
export function initializeMapWithRailwayData(elementId: string, railwayVideos: RailwayVideo[], L: typeof LType): L.Map {
  const firstPosition = railwayVideos[0]?.stations[0];
  // 日本の中心付近の座標（東京）と、日本全体が表示されるズームレベル（5）を設定
  const map = L.map(elementId).setView([35.6812, 139.7671], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const youtubePlayer = YouTubePlayer.getInstance('youtube-player', railwayVideos[0].videoId, firstPosition.startTime);

  // 駅マーカーを保持するオブジェクト
  const stationMarkers: { [key: string]: L.Marker[] } = {};

  railwayVideos.forEach(railwayVideo => {
    // 路線の中心位置を計算
    const latSum = railwayVideo.stations.reduce((sum, station) => sum + station.lat, 0);
    const lngSum = railwayVideo.stations.reduce((sum, station) => sum + station.lon, 0);
    const centerLat = latSum / railwayVideo.stations.length;
    const centerLng = lngSum / railwayVideo.stations.length;

    // 路線マーカーの作成
    const railwayMarker = L.marker([centerLat, centerLng], {
      icon: L.divIcon({
        className: 'railway-marker',
        html: `<div class="railway-marker-icon">${railwayVideo.lineName}</div>`,
        iconSize: [100, 30]
      })
    }).addTo(map);

    // 路線マーカーのポップアップ
    railwayMarker.bindPopup(`
      <b>${railwayVideo.lineName}</b><br>
      路線コード: ${railwayVideo.lineCd}<br>
      ビデオID: ${railwayVideo.videoId}
    `);

    // 駅マーカーの作成と保存
    const markers: L.Marker[] = [];
    railwayVideo.stations.forEach(station => {
      const marker = L.marker([station.lat, station.lon]).bindTooltip(`${station.stationName}`, { permanent: true, direction: 'right', className: 'line-label' });

      marker.bindPopup(`
        <b>${station.stationName}</b><br>
        路線名: ${railwayVideo.lineName}<br>
        路線コード: ${railwayVideo.lineCd}<br>
        駅コード: ${station.stationCd}<br>
        ビデオID: ${railwayVideo.videoId}<br>
        開始時間: ${station.startTime}秒<br>
        <button class="play-button" data-video-id="${railwayVideo.videoId}" data-start-time="${station.startTime}">動画を再生</button>
      `);

      markers.push(marker);
    });
    stationMarkers[railwayVideo.videoId] = markers;

    // 路線マーカーのクリックイベント
    railwayMarker.on('click', () => {
      // すべての駅マーカーを非表示
      Object.values(stationMarkers).forEach(markers => {
        markers.forEach(marker => marker.remove());
      });

      // クリックされた路線の駅マーカーを表示
      stationMarkers[railwayVideo.videoId].forEach(marker => marker.addTo(map));
    });
  });

  map.on('popupopen', (e) => {
    const popup = e.popup;
    const playButton = popup.getElement()?.querySelector('.play-button');
    if (playButton) {
      playButton.addEventListener('click', () => {
        const videoId = playButton.getAttribute('data-video-id');
        const startTime = parseInt(playButton.getAttribute('data-start-time') || '0', 10);
        if (videoId) {
          youtubePlayer.loadVideo(videoId, startTime);
        }
      });
    }
  });

  return map;
}
