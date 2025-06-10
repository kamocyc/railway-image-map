export interface Report {
  id?: number;
  mapping_id: number;
  reporter_id: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  created_at?: string;
}