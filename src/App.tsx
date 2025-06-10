import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import MapPage from './pages/MapPage';
import SubmitPage from './pages/SubmitPage';
import ListPage from './pages/ListPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import { useEffect, useState } from 'react';
import { RailwayData } from './types/RailwayData';
import { getRailwayData } from './lib/supabase';

function App() {
  const [railwayData, setRailwayData] = useState<RailwayData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function loadRailwayData() {
      setDataLoading(true);
      try {
        const data = await getRailwayData();
        setRailwayData(data);
      } catch (error) {
        console.error('Failed to load railway data:', error);
      } finally {
        setDataLoading(false);
      }
    }

    loadRailwayData();
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
              <Route path="/" element={<MapPage loading={dataLoading} railwayData={railwayData} />} />
              <Route path="/submit" element={<SubmitPage />} />
              <Route path="/list" element={<ListPage railwayData={railwayData} loading={dataLoading} />} />
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