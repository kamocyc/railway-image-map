import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addStationMapping } from '../lib/supabase';
import { useAuth } from '../lib/auth';

function SubmitPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    stationCd: '',
    stationName: '',
    videoId: '',
    startTime: '0',
    lat: '',
    lon: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 入力値の検証
      const stationCd = parseInt(formData.stationCd, 10);
      const startTime = parseInt(formData.startTime, 10);
      const lat = parseFloat(formData.lat);
      const lon = parseFloat(formData.lon);

      if (isNaN(stationCd) || isNaN(startTime) || isNaN(lat) || isNaN(lon)) {
        throw new Error('数値フィールドに無効な値が入力されています');
      }

      if (!formData.stationName || !formData.videoId) {
        throw new Error('すべての必須フィールドを入力してください');
      }

      // YouTubeのビデオIDの検証（簡易版）
      if (!/^[\w-]{11}$/.test(formData.videoId)) {
        throw new Error('無効なYouTubeビデオIDです');
      }

      const newMapping = {
        station_cd: '' + stationCd,
        station_name: formData.stationName,
        video_id: formData.videoId,
        start_time: startTime,
        lat,
        lon,
        user_id: user?.id
      };

      const result = await addStationMapping(newMapping);

      if (result) {
        setSuccess(true);
        // フォームをリセット
        setFormData({
          stationCd: '',
          stationName: '',
          videoId: '',
          startTime: '0',
          lat: '',
          lon: ''
        });

        // 3秒後に地図ページに遷移
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        throw new Error('データの保存に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h2>投稿するにはログインが必要です</h2>
        <p>ログインページからログインしてください。</p>
        <button onClick={() => navigate('/login')} style={{ padding: '0.5rem 1rem' }}>
          ログインページへ
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>新しい駅マッピングを追加</h2>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#ffebee', color: '#c62828', marginBottom: '1rem', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '1rem', backgroundColor: '#e8f5e9', color: '#2e7d32', marginBottom: '1rem', borderRadius: '4px' }}>
          マッピングが正常に保存されました！地図ページに戻ります...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            駅コード (数字):
            <input
              type="text"
              name="stationCd"
              value={formData.stationCd}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem' }}
              required
            />
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            駅名:
            <input
              type="text"
              name="stationName"
              value={formData.stationName}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem' }}
              required
            />
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            YouTube ビデオID:
            <input
              type="text"
              name="videoId"
              value={formData.videoId}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem' }}
              placeholder="例: dQw4w9WgXcQ"
              required
            />
          </label>
          <small style={{ display: 'block', color: '#666' }}>
            YouTubeの動画URLの「v=」の後の部分です (例: https://www.youtube.com/watch?v=dQw4w9WgXcQ)
          </small>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            開始時間 (秒):
            <input
              type="number"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem' }}
              min="0"
              required
            />
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            緯度:
            <input
              type="text"
              name="lat"
              value={formData.lat}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem' }}
              placeholder="例: 35.681236"
              required
            />
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            経度:
            <input
              type="text"
              name="lon"
              value={formData.lon}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem' }}
              placeholder="例: 139.767125"
              required
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || success}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading || success ? 'not-allowed' : 'pointer',
            opacity: loading || success ? 0.7 : 1
          }}
        >
          {loading ? '保存中...' : '保存'}
        </button>
      </form>
    </div>
  );
}

export default SubmitPage;