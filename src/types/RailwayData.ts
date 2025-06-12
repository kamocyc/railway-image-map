export interface Station {
  id?: number;
  stationCd: number;
  stationName: string;
  startTime: number;
  lat: number;
  lon: number;
  userId?: string;
}

export interface RailwayData {
  id?: number;
  videoId: string;
  lineName: string;
  lineCd: number;
  stations: Station[];
  userId?: string;
}