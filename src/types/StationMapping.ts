export interface StationMapping {
  id?: number; // Supabaseで自動生成されるID
  station_cd: string;
  station_name: string;
  video_id: string;
  start_time: number;
  lat: number;
  lon: number;
  created_at?: string; // 作成日時
  user_id?: string; // 投稿者ID
}