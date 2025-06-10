import L from 'leaflet';
import stationTimes from '../data/station-times.json';

import { StationMapping } from '../types/StationMapping';
import { YouTubePlayer } from '../youtube/YouTubePlayer';

export function initializeMap(elementId: string): L.Map {
  const map = L.map(elementId).setView([35.662152, 139.708713], 14); // 渋谷と表参道の中間あたりを初期表示
  //   var map = L.map('map', {
  //     center: [51.505, -0.09],
  //     zoom: 13
  // });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Add GeoJSON layer for railway routes
  fetch('/src/data/route.geojson')
    .then(response => response.json())
    .then(data => {
      L.geoJSON(data, {
        style: {
          color: '#ff7800',
          weight: 5,
          opacity: 0.65
        }
      }).addTo(map);
    })
    .catch(error => {
      console.error('Error loading GeoJSON:', error);
    });

  // Add station markers
  (stationTimes as StationMapping[]).forEach(station => {
    const marker = L.marker([station.lat, station.lon])
      .addTo(map)
      .bindPopup(station.stationName);

    marker.on('click', () => {
      // Assuming there's a div with id 'youtube-player' in App.tsx
      new YouTubePlayer('youtube-player', station.videoId, station.startTime);
    });
  });

  return map;
}