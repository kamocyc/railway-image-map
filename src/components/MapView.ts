import type LType from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/markers.css';
import { RailwayVideo } from '../types/RailwayData';
import { StationVideoTime } from '../types/RailwayData';
import { YouTubePlayer } from '../youtube/YouTubePlayer';

// マップを初期化し、駅マーカーを追加する関数
export function initializeMapWithRailwayData(
  elementId: string,
  railwayVideos: RailwayVideo[],
  L: typeof LType,
): L.Map {
  // 日本の中心付近の座標（東京）と、日本全体が表示されるズームレベル（5）を設定
  const map = L.map(elementId).setView([35.6812, 139.7671], 5);

  let resizeTimer: NodeJS.Timeout | null = null;

  const resizeObserver = new ResizeObserver(entries => {
    // debounce
    if (resizeTimer) {
      clearTimeout(resizeTimer);
    }
    resizeTimer = setTimeout(() => {
      for (let entry of entries) {
        if (entry.target.id === elementId) {
          map.invalidateSize();
        }
      }
    }, 250);
  });
  resizeObserver.observe(document.getElementById(elementId)!);

  // Fix for default marker icons
  const defaultIcon = L.icon({
    iconUrl: '/images/marker-icon.png',
    iconRetinaUrl: '/images/marker-icon-2x.png',
    shadowUrl: '/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Set default icon
  L.Marker.prototype.options.icon = defaultIcon;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const firstStation = railwayVideos[0]?.stations[0];
  const youtubePlayer = YouTubePlayer.getInstance('youtube-player', railwayVideos[0].videoId, firstStation.startTime);

  // 駅マーカーを保持するオブジェクト
  const stationMarkers: { [key: string]: L.Marker[] } = {};
  let selectedVideoIdAndLineCd: null | string = null;

  // マップのクリックイベントを追加
  map.on('click', (e) => {
    const clickedLatLng = e.latlng;
    const threshold = 100; // meters

    let closestStation: {
      station: StationVideoTime;
      distance: number;
      railwayVideo: RailwayVideo;
    } | null = null;

    // すべての路線と駅をチェックして最も近い駅を見つける
    // TODO: これだと、駅が多いと重いので、インデックスとかで高速化するあるいはoverpass-apiを使う
    for (const railwayVideo of railwayVideos) {
      for (const station of railwayVideo.stations) {
        const stationLatLng = L.latLng(station.lat, station.lon);
        const distance = clickedLatLng.distanceTo(stationLatLng);

        if (distance < threshold && (!closestStation || distance < closestStation.distance)) {
          closestStation = {
            station,
            distance,
            railwayVideo
          };
        }
      }
    }

    // 最も近い駅が見つかった場合
    if (closestStation) {
      // すべての駅マーカーを非表示
      Object.values(stationMarkers).forEach(markers => {
        markers.forEach(marker => marker.remove());
      });

      // 最も近い駅の路線の駅マーカーを表示
      const key = closestStation.railwayVideo.videoId + '-' + closestStation.railwayVideo.lineCd;
      stationMarkers[key].forEach(marker => marker.addTo(map));

      selectedVideoIdAndLineCd = key;

      // 動画を再生
      youtubePlayer.loadVideo(closestStation.railwayVideo.videoId, closestStation.station.startTime);
    } else {

      if (selectedVideoIdAndLineCd) {
        const [videoId, lineCd] = selectedVideoIdAndLineCd.split('-');
        const selectedRailway = railwayVideos.find(r => r.videoId === videoId && r.lineCd === lineCd);

        if (selectedRailway) {
          // クリック位置に最も近い2つの駅を見つける
          let closestStations = selectedRailway.stations
            .map(station => ({
              station,
              distance: clickedLatLng.distanceTo(L.latLng(station.lat, station.lon))
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 2);

          if (closestStations.length === 2) {
            const [station1, station2] = closestStations;
            const totalDistance = station1.distance + station2.distance;
            const ratio = station1.distance / totalDistance;

            // 2つの駅の間の時間を等分して計算
            // 駅の停車時間がある場合に不正確になるが、データが整っていないのであきらめる
            const timeDiff = station2.station.startTime - station1.station.startTime;
            const interpolatedTime = station1.station.startTime + (timeDiff * ratio);

            // 動画を再生
            youtubePlayer.loadVideo(selectedRailway.videoId, Math.round(interpolatedTime));
          }
        }
      }
    }
  });

  const railwayMarkerPositions: { [key: string]: { lat: number, lng: number } } = {};

  railwayVideos.forEach(railwayVideo => {
    const firstStation = railwayVideo.stations[0];

    // 路線の最初の駅の位置を計算
    let railwayLat = firstStation.lat;
    let railwayLng = firstStation.lon;

    // 既存の路線マーカーと重なる場合は、このマーカーの位置をずらす
    const nearRailwayMarkerPositions = Object.values(railwayMarkerPositions).filter(position => position.lat === railwayLat && position.lng === railwayLng);
    if (nearRailwayMarkerPositions.length > 0) {
      railwayLat += 0.005;
      railwayLng += 0.02;
    }

    railwayMarkerPositions[railwayVideo.videoId + '-' + railwayVideo.lineCd] = { lat: railwayLat, lng: railwayLng };

    // 路線マーカーの作成
    const railwayMarker = L.marker([railwayLat, railwayLng], {
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
      ビデオID: ${railwayVideo.videoId}<br>
      <button class="play-button" data-video-id="${railwayVideo.videoId}" data-start-time="${firstStation.startTime}">動画を再生</button>
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
      `);

      marker.on('click', () => {
        youtubePlayer.loadVideo(railwayVideo.videoId, station.startTime);
      });

      markers.push(marker);
    });
    stationMarkers[railwayVideo.videoId + '-' + railwayVideo.lineCd] = markers;

    // 路線マーカーのクリックイベント
    railwayMarker.on('click', () => {
      // すべての駅マーカーを非表示
      Object.values(stationMarkers).forEach(markers => {
        markers.forEach(marker => marker.remove());
      });

      // クリックされた路線の駅マーカーを表示
      stationMarkers[railwayVideo.videoId + '-' + railwayVideo.lineCd].forEach(marker => marker.addTo(map));

      selectedVideoIdAndLineCd = railwayVideo.videoId + '-' + railwayVideo.lineCd;
    });
  });

  // 動画再生
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
