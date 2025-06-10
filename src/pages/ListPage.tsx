import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StationMapping } from '../types/StationMapping';
import { deleteStationMapping } from '../lib/supabase';
import { createReport } from '../lib/reports';
import { useAuth } from '../lib/auth';

interface ListPageProps {
  stationMappings: StationMapping[];
  loading: boolean;
}

function ListPage({ stationMappings, loading }: ListPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState('');

  const handleDelete = async (id?: number) => {
    if (!id) return;

    if (window.confirm('このマッピングを削除してもよろしいですか？')) {
      setDeleteLoading(id);
      setError(null);

      try {
        const success = await deleteStationMapping(id);
        if (!success) {
          throw new Error('削除に失敗しました');
        }
        // 削除成功後、ページをリロード
        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
        setDeleteLoading(null);
      }
    }
  };

  const handleReport = (id?: number) => {
    if (!id) return;
    if (!user) {
      navigate('/login');
      return;
    }
    setReportingId(id);
    setReportReason('');
    setError(null);
    setSuccess(null);
  };

  const submitReport = async () => {
    if (!reportingId || !user || !reportReason.trim()) return;

    try {
      const report = await createReport({
        mapping_id: reportingId,
        reporter_id: user.id,
        reason: reportReason.trim()
      });

      if (report) {
        setSuccess('通報が送信されました。管理者が確認します。');
        setReportingId(null);
        setReportReason('');
      } else {
        throw new Error('通報の送信に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>データを読み込み中...</div>;
  }

  if (stationMappings.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>マッピングがありません</h2>
        <p>新しいマッピングを追加してください。</p>
        <button
          onClick={() => navigate('/submit')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          新規追加
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>駅マッピング一覧</h2>
        <button
          onClick={() => navigate('/submit')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          新規追加
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#ffebee', color: '#c62828', marginBottom: '1rem', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '1rem', backgroundColor: '#e8f5e9', color: '#2e7d32', marginBottom: '1rem', borderRadius: '4px' }}>
          {success}
        </div>
      )}

      {/* 通報モーダル */}
      {reportingId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h3>コンテンツを通報</h3>
            <p>このコンテンツを通報する理由を教えてください：</p>

            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '0.5rem',
                marginBottom: '1rem',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
              placeholder="通報理由を入力してください"
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                onClick={() => setReportingId(null)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f5f5f5',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={submitReport}
                disabled={!reportReason.trim()}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: reportReason.trim() ? 'pointer' : 'not-allowed',
                  opacity: reportReason.trim() ? 1 : 0.7
                }}
              >
                通報する
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>駅コード</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>駅名</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>動画ID</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>開始時間</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>緯度</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>経度</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {stationMappings.map((station) => (
              <tr key={station.id || station.station_cd} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '0.75rem' }}>{station.station_cd}</td>
                <td style={{ padding: '0.75rem' }}>{station.station_name}</td>
                <td style={{ padding: '0.75rem' }}>
                  <a
                    href={`https://www.youtube.com/watch?v=${station.video_id}&t=${station.start_time}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {station.video_id}
                  </a>
                </td>
                <td style={{ padding: '0.75rem' }}>{station.start_time}秒</td>
                <td style={{ padding: '0.75rem' }}>{station.lat}</td>
                <td style={{ padding: '0.75rem' }}>{station.lon}</td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                    {user && user.id === station.user_id && (
                      <button
                        onClick={() => handleDelete(station.id)}
                        disabled={deleteLoading === station.id}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: deleteLoading === station.id ? 'not-allowed' : 'pointer',
                          opacity: deleteLoading === station.id ? 0.7 : 1
                        }}
                      >
                        {deleteLoading === station.id ? '削除中...' : '削除'}
                      </button>
                    )}
                    <button
                      onClick={() => handleReport(station.id)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#ff9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      通報
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ListPage;