import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RailwayData } from '../types/RailwayData';
import { YouTubePlayer } from '../youtube/YouTubePlayer';

// Leafletのデフォルトアイコン設定
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// マップを初期化し、駅マーカーを追加する関数
export function initializeMapWithRailwayData(elementId: string, railwayData: RailwayData[]): L.Map {
  const firstPosition = railwayData[0]?.stations[0];
  const map = L.map(elementId).setView([firstPosition.lat, firstPosition.lon], 13); // 東京駅を中心に設定

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const youtubePlayer = new YouTubePlayer('youtube-player', railwayData[0].videoId, firstPosition.startTime);

  railwayData.forEach(railway => {
    // 路線名ラベルの追加
    if (railway.stations.length > 0) {
      const latSum = railway.stations.reduce((sum, station) => sum + station.lat, 0);
      const lngSum = railway.stations.reduce((sum, station) => sum + station.lon, 0);
      const centerLat = latSum / railway.stations.length;
      const centerLng = lngSum / railway.stations.length;

      L.marker([centerLat, centerLng], { opacity: 0.01 }) // 透明なマーカー
        .bindTooltip(`${railway.lineName} (${railway.lineCd})`, { permanent: true, direction: 'right', className: 'line-label' })
        .addTo(map);
    }

    railway.stations.forEach(station => {
      const marker = L.marker([station.lat, station.lon]).addTo(map);
      marker.bindPopup(`
        <b>${station.stationName}</b><br>
        路線名: ${railway.lineName}<br>
        路線コード: ${railway.lineCd}<br>
        駅コード: ${station.stationCd}<br>
        ビデオID: ${railway.videoId}<br>
        開始時間: ${station.startTime}秒<br>
        <button class="play-button" data-video-id="${railway.videoId}" data-start-time="${station.startTime}">動画を再生</button>
      `);
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
