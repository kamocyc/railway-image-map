import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/markers.css';
import { RailwayData } from '../types/RailwayData';
import { YouTubePlayer } from '../youtube/YouTubePlayer';

// マップを初期化し、駅マーカーを追加する関数
export function initializeMapWithRailwayData(elementId: string, railwayData: RailwayData[]): L.Map {
  const firstPosition = railwayData[0]?.stations[0];
  const map = L.map(elementId).setView([firstPosition.lat, firstPosition.lon], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const youtubePlayer = YouTubePlayer.getInstance('youtube-player', railwayData[0].videoId, firstPosition.startTime);

  // 駅マーカーを保持するオブジェクト
  const stationMarkers: { [key: string]: L.Marker[] } = {};

  railwayData.forEach(railway => {
    // 路線の中心位置を計算
    const latSum = railway.stations.reduce((sum, station) => sum + station.lat, 0);
    const lngSum = railway.stations.reduce((sum, station) => sum + station.lon, 0);
    const centerLat = latSum / railway.stations.length;
    const centerLng = lngSum / railway.stations.length;

    // 路線マーカーの作成
    const railwayMarker = L.marker([centerLat, centerLng], {
      icon: L.divIcon({
        className: 'railway-marker',
        html: `<div class="railway-marker-icon">${railway.lineName}</div>`,
        iconSize: [100, 30]
      })
    }).addTo(map);

    // 路線マーカーのポップアップ
    railwayMarker.bindPopup(`
      <b>${railway.lineName}</b><br>
      路線コード: ${railway.lineCd}<br>
      ビデオID: ${railway.videoId}
    `);

    // 駅マーカーの作成と保存
    const markers: L.Marker[] = [];
    railway.stations.forEach(station => {
      const marker = L.marker([station.lat, station.lon], {
        icon: L.divIcon({
          className: 'station-marker',
          html: `<div class="station-marker-icon">${station.stationName}</div>`,
          iconSize: [80, 20]
        })
      });

      marker.bindPopup(`
        <b>${station.stationName}</b><br>
        路線名: ${railway.lineName}<br>
        路線コード: ${railway.lineCd}<br>
        駅コード: ${station.stationCd}<br>
        ビデオID: ${railway.videoId}<br>
        開始時間: ${station.startTime}秒<br>
        <button class="play-button" data-video-id="${railway.videoId}" data-start-time="${station.startTime}">動画を再生</button>
      `);

      markers.push(marker);
    });
    stationMarkers[railway.lineCd] = markers;

    // 路線マーカーのクリックイベント
    railwayMarker.on('click', () => {
      // すべての駅マーカーを非表示
      Object.values(stationMarkers).forEach(markers => {
        markers.forEach(marker => marker.remove());
      });

      // クリックされた路線の駅マーカーを表示
      stationMarkers[railway.lineCd].forEach(marker => marker.addTo(map));
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
