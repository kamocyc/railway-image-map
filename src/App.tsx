import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import MapPage from './pages/MapPage';
import SubmitPage from './pages/SubmitPage';
import ListPage from './pages/ListPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import { supabase } from './lib/supabase';
import { StationMapping } from './types/StationMapping';

function App() {
  const [stationMappings, setStationMappings] = useState<StationMapping[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // データの初期ロード
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from('station_mappings')
          .select('*');

        if (error) {
          console.error('Error loading data:', error);
        } else {
          setStationMappings(data || []);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        // 開発中はローカルのJSONデータを使用
        const localData = await import('./data/station-times.json');
        setStationMappings(localData.default);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <header style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
            <h1>Railway Image Map</h1>
            <nav>
              <ul style={{ display: 'flex', gap: '1rem', listStyle: 'none', padding: 0 }}>
                <li><Link to="/">地図</Link></li>
                <li><Link to="/submit">投稿</Link></li>
                <li><Link to="/list">一覧</Link></li>
                <li><Link to="/admin">管理</Link></li>
                <li><Link to="/login">ログイン</Link></li>
              </ul>
            </nav>
          </header>

          <main style={{ flexGrow: 1, overflow: 'auto' }}>
            <Routes>
              <Route path="/" element={<MapPage stationMappings={stationMappings} loading={loading} />} />
              <Route path="/submit" element={<SubmitPage />} />
              <Route path="/list" element={<ListPage stationMappings={stationMappings} loading={loading} />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;