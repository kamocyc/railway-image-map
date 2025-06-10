import L from 'leaflet';
import stationTimesJson from '../data/station-times.json';
import routeGeojsonUrl from '../data/route.json';

import { StationMapping } from '../types/StationMapping';
import { YouTubePlayer } from '../youtube/YouTubePlayer';

export function initializeMap(elementId: string): L.Map {
  const stationTimes = stationTimesJson as StationMapping[];
  const initialStationPosition = [stationTimes[0].lat, stationTimes[0].lon] as [number, number];
  const map = L.map(elementId).setView(initialStationPosition, 13);
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

  (stationTimes as StationMapping[]).forEach(station => {
    const marker = L.marker([station.lat, station.lon])
      .addTo(map)
      .bindPopup(station.stationName);

    marker.on('click', () => {
      if (!player) {
        player = new YouTubePlayer('youtube-player', station.videoId, station.startTime);
      } else {
        player.loadVideo(station.videoId, station.startTime);
      }
    });
  });

  return map;
}