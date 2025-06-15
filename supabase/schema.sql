-- Supabaseのテーブル定義

-- 駅マッピングテーブル
CREATE TABLE station_mappings (
  id SERIAL PRIMARY KEY,
  station_cd TEXT NOT NULL,
  station_name TEXT NOT NULL,
  video_id TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  lat FLOAT NOT NULL,
  lon FLOAT NOT NULL,
  line_name TEXT,           -- 追加: 路線名
  line_cd TEXT,          -- 追加: 路線コード
  user_id UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(station_cd, video_id)
);

-- レポートテーブル（不適切なマッピングの報告用）
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  mapping_id INTEGER REFERENCES station_mappings(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 管理者ユーザーテーブル
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS (Row Level Security) ポリシーの設定

-- station_mappingsテーブルのポリシー
ALTER TABLE station_mappings ENABLE ROW LEVEL SECURITY;

-- 誰でも閲覧可能
CREATE POLICY "Station mappings are viewable by everyone" 
  ON station_mappings FOR SELECT USING (true);

-- 認証済みユーザーのみ追加可能
CREATE POLICY "Authenticated users can insert their own mappings" 
  ON station_mappings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 自分の投稿または管理者は更新可能
CREATE POLICY "Users can update their own mappings" 
  ON station_mappings FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- 自分の投稿または管理者は削除可能
CREATE POLICY "Users can delete their own mappings" 
  ON station_mappings FOR DELETE USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- admin_usersテーブルのポリシー
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 自分のユーザIDのadmin_usersは閲覧可能
CREATE POLICY "Users can view their own admin_users" 
  ON admin_users FOR SELECT USING (
    auth.uid() = user_id
  );