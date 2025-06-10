import L from 'leaflet';
import { StationMapping } from '../types/StationMapping';
import { YouTubePlayer } from '../youtube/YouTubePlayer';
import routeGeojsonUrl from '../data/route.json';

export function initializeMap(elementId: string, stationMappings: StationMapping[] = []): L.Map {
  // データがない場合はデフォルトの位置を使用
  const initialPosition = stationMappings.length > 0
    ? [stationMappings[0].lat, stationMappings[0].lon] as [number, number]
    : [35.681236, 139.767125] as [number, number]; // 東京駅をデフォルトに

  const map = L.map(elementId).setView(initialPosition, 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Add GeoJSON layer for railway routes
  L.geoJSON(routeGeojsonUrl as any, {
    style: {
      color: '#ff7800',
      weight: 5,
      opacity: 0.65
    }
  }).addTo(map);

  // Add station markers
  let player: YouTubePlayer | null = null;

  stationMappings.forEach(station => {
    const marker = L.marker([station.lat, station.lon])
      .addTo(map)
      .bindPopup(`
        <strong>${station.station_name}</strong><br>
        <button class="play-video-btn" data-video-id="${station.video_id}" data-start-time="${station.start_time}">動画を再生</button>
      `);

    marker.on('popupopen', (e) => {
      const popup = e.popup;
      const container = popup.getElement();
      const playButton = container?.querySelector('.play-video-btn');

      if (playButton) {
        playButton.addEventListener('click', () => {
          const videoId = playButton.getAttribute('data-video-id');
          const startTime = parseInt(playButton.getAttribute('data-start-time') || '0', 10);

          if (videoId) {
            if (!player) {
              player = new YouTubePlayer('youtube-player', videoId, startTime);
            } else {
              player.loadVideo(videoId, startTime);
            }
          }
        });
      }
    });
  });

  return map;
}