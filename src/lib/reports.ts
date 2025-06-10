import { supabase } from './supabase';
import { Report } from '../types/Report';

// 通報を作成する
export async function createReport(report: Omit<Report, 'id' | 'created_at' | 'status'>) {
  const { data, error } = await supabase
    .from('reports')
    .insert([{ ...report, status: 'pending' }])
    .select();
  
  if (error) {
    console.error('Error creating report:', error);
    return null;
  }
  
  return data?.[0] as Report;
}

// 通報一覧を取得する（管理者用）
export async function getReports() {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      station_mappings!inner(*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
  
  return data as (Report & { station_mappings: any })[];
}

// 通報のステータスを更新する（管理者用）
export async function updateReportStatus(id: number, status: Report['status']) {
  const { data, error } = await supabase
    .from('reports')
    .update({ status })
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('Error updating report status:', error);
    return null;
  }
  
  return data?.[0] as Report;
}