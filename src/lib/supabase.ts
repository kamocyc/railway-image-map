// import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { RailwayVideo, StationVideoTime } from '../types/RailwayData';

// Supabaseの環境変数
const supabaseUrl = process.env.SUPABASE_URL || 'https://jdcgyekcofnzrbsvkafo.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkY2d5ZWtjb2ZuenJic3ZrYWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NTA4NzQsImV4cCI6MjA2NTEyNjg3NH0.P5c7spqezGbBFRTz4Y3kL8Rre_YiyMCdQzvKLUeFTS8';

// Supabaseクライアントの作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getRailwayData(): Promise<RailwayVideo[]> {
  try {
    // station_mappingsテーブルからデータを取得
    const { data, error } = await supabase
      .from('station_mappings')
      .select('*');

    if (error) {
      console.error('Error fetching station mappings:', error);
      return [];
    }

    // 取得したデータを新しい構造に変換
    const railwayDataMap = new Map<string, RailwayVideo>();

    data.forEach((mapping: any) => {
      const key = `${mapping.video_id}-${mapping.line_cd}`;

      const station: StationVideoTime = {
        id: mapping.id,
        stationCd: mapping.station_cd,
        stationName: mapping.station_name,
        startTime: mapping.start_time,
        lat: mapping.lat,
        lon: mapping.lon,
      };

      if (railwayDataMap.has(key)) {
        const railwayData = railwayDataMap.get(key)!;
        railwayData.stations.push(station);
      } else {
        railwayDataMap.set(key, {
          videoId: mapping.video_id,
          lineName: mapping.line_name,
          lineCd: mapping.line_cd,
          stations: [station],
        });
      }
    });

    return Array.from(railwayDataMap.values());
  } catch (error) {
    console.error('Error getting railway data:', error);
    return [];
  }
}

// 新しい鉄道データを追加
export async function addRailwayData(data: RailwayVideo) {
  const recordsToInsert = data.stations.map(station => ({
    video_id: data.videoId,
    line_name: data.lineName,
    line_cd: data.lineCd,
    station_cd: station.stationCd,
    station_name: station.stationName,
    start_time: station.startTime,
    lat: station.lat,
    lon: station.lon,
    user_id: data.userId,
  }));

  const { error } = await supabase
    .from('station_mappings')
    .insert(recordsToInsert);

  if (error) {
    console.error('Error adding railway data:', error);
    return false;
  }
  return true;
}

// 鉄道データを削除
export async function deleteRailwayData(id: number) {
  try {
    const { error } = await supabase
      .from('station_mappings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting railway data:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteRailwayData:', error);
    throw error;
  }
}

export async function deleteRailwayLine(videoId: string, lineCd: number) {
  try {
    const { error } = await supabase
      .from('station_mappings')
      .delete()
      .eq('video_id', videoId)
      .eq('line_cd', lineCd);

    if (error) {
      console.error('Error deleting railway line:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteRailwayLine:', error);
    throw error;
  }
}

export async function addStationMapping(mapping: {
  stationCd: string;
  stationName: string;
  videoId: string;
  startTime: number;
  lat: number;
  lon: number;
  lineName: string;
  lineCd: number;
  userId: string;
}) {
  try {
    const { data, error } = await supabase
      .from('station_mappings')
      .insert([{
        station_cd: mapping.stationCd,
        station_name: mapping.stationName,
        video_id: mapping.videoId,
        start_time: mapping.startTime,
        lat: mapping.lat,
        lon: mapping.lon,
        line_name: mapping.lineName,
        line_cd: mapping.lineCd,
        user_id: mapping.userId
      }])
      .select();

    if (error) {
      console.error('Error adding station mapping:', error);
      throw error;
    }

    return data[0];
  } catch (error) {
    console.error('Error in addStationMapping:', error);
    throw error;
  }
}