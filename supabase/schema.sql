-- Supabaseのテーブル定義

-- 駅マッピングテーブル
CREATE TABLE station_mappings (
  id SERIAL PRIMARY KEY,
  station_cd INTEGER NOT NULL,
  station_name TEXT NOT NULL,
  video_id TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  lat FLOAT NOT NULL,
  lon FLOAT NOT NULL,
  user_id UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_station_mappings_station_cd ON station_mappings(station_cd);
CREATE INDEX idx_station_mappings_user_id ON station_mappings(user_id);

-- RLS (Row Level Security) ポリシー
-- 誰でも読み取り可能
ALTER TABLE station_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read station_mappings" ON station_mappings
  FOR SELECT USING (true);

-- 認証済みユーザーのみ挿入可能
CREATE POLICY "Authenticated users can insert" ON station_mappings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 自分が作成したデータのみ更新・削除可能
CREATE POLICY "Users can update their own mappings" ON station_mappings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mappings" ON station_mappings
  FOR DELETE USING (auth.uid() = user_id);

-- 通報テーブル
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  mapping_id INTEGER REFERENCES station_mappings(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, reviewed, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_reports_mapping_id ON reports(mapping_id);
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_status ON reports(status);

-- RLS (Row Level Security) ポリシー
-- 管理者のみ全ての通報を読み取り可能
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read all reports" ON reports
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- 自分が作成した通報のみ読み取り可能
CREATE POLICY "Users can read their own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- 認証済みユーザーのみ挿入可能
CREATE POLICY "Authenticated users can insert reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- 管理者のみ更新可能
CREATE POLICY "Admins can update reports" ON reports
  FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- 管理者テーブル
CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) ポリシー
-- 管理者のみ読み取り可能
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read admin_users" ON admin_users
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM admin_users));