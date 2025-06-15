export interface StationVideoTime {
  id?: number;
  stationCd: number;
  stationName: string;
  startTime: number;
  lat: number;
  lon: number;
  userId?: string;
}

export interface RailwayVideo {
  id?: number;
  videoId: string;
  lineName: string;
  lineCd: string;
  stations: StationVideoTime[];
  userId?: string;
}