import { createClient } from '@supabase/supabase-js';
import { RailwayData, Station } from '../types/RailwayData';

// Supabaseの環境変数
// 実際のプロジェクトでは.envファイルなどで管理することをお勧めします
// @ts-ignore
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
// @ts-ignore
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Supabaseクライアントの作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getRailwayData(): Promise<RailwayData[]> {
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
    const railwayDataMap = new Map<string, RailwayData>();

    data.forEach((mapping: any) => {
      const key = `${mapping.video_id}-${mapping.line_name}-${mapping.line_cd}`;

      const station: Station = {
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
export async function addRailwayData(data: RailwayData) {
  const recordsToInsert = data.stations.map(station => ({
    video_id: data.videoId,
    line_name: data.lineName,
    line_cd: data.lineCd,
    station_cd: station.stationCd,
    station_name: station.stationName,
    start_time: station.startTime,
    latitude: station.lat,
    longitude: station.lon,
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
  const { error } = await supabase
    .from('station_mappings')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting railway data:', error);
    return false;
  }
  return true;
}