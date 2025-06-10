import { createClient } from '@supabase/supabase-js';
import { StationMapping } from '../types/StationMapping';

// Supabaseの環境変数
// 実際のプロジェクトでは.envファイルなどで管理することをお勧めします
// @ts-ignore
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
// @ts-ignore
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Supabaseクライアントの作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 駅マッピングデータの取得
export async function getStationMappings() {
  const { data, error } = await supabase
    .from('station_mappings')
    .select('*');

  if (error) {
    console.error('Error fetching station mappings:', error);
    return [];
  }

  return data as StationMapping[];
}

// 駅マッピングデータの追加
export async function addStationMapping(mapping: Omit<StationMapping, 'id'>) {
  const { data, error } = await supabase
    .from('station_mappings')
    .insert([mapping])
    .select();

  if (error) {
    console.error('Error adding station mapping:', error);
    return null;
  }

  return data?.[0] as StationMapping;
}

// 駅マッピングデータの更新
export async function updateStationMapping(id: number, mapping: Partial<StationMapping>) {
  const { data, error } = await supabase
    .from('station_mappings')
    .update(mapping)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating station mapping:', error);
    return null;
  }

  return data?.[0] as StationMapping;
}

// 駅マッピングデータの削除
export async function deleteStationMapping(id: number) {
  const { error } = await supabase
    .from('station_mappings')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting station mapping:', error);
    return false;
  }

  return true;
}