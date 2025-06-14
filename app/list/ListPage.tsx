import { useEffect, useState } from 'react';
import { useRouter } from 'next/compat/router';
import { deleteRailwayData, deleteRailwayLine } from '../../src/lib/supabase';
import { RailwayVideo } from '../../src/types/RailwayData';
import { createReport } from '../../src/lib/reports';
import { useAuth } from '../../src/lib/auth';
import { isAdmin } from '../../app/admin/AdminPage';
import { loadCSVData } from '../../src/lib/csvData';

interface ListPageProps {
  railwayData: RailwayVideo[];
  loading: boolean;
}

function ListPage({ railwayData, loading }: ListPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [deleteLineLoading, setDeleteLineLoading] = useState<string | null>(null);
  const [isAdminFlag, setIsAdminFlag] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const adminStatus = await isAdmin(user.id);
        setIsAdminFlag(adminStatus);
      }
    };
    checkAdmin();
  }, [user]);

  useEffect(() => {
    const initializeData = async () => {
      await loadCSVData();
    };
    initializeData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('本当に削除しますか？')) {
      return;
    }

    setDeleteLoading(id);
    try {
      await deleteRailwayData(id);
      setSuccess('削除が完了しました');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('削除に失敗しました');
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleReport = (id: number) => {
    setSelectedStationId(id);
    setReportModalOpen(true);
  };

  const handleReportSubmit = async () => {
    if (!selectedStationId || !reportReason.trim() || !user) {
      return;
    }

    try {
      await createReport({
        mappingId: selectedStationId,
        reporterId: user.id,
        reason: reportReason.trim()
      });
      setSuccess('通報が完了しました');
      setReportModalOpen(false);
      setSelectedStationId(null);
      setReportReason('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('通報に失敗しました');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteLine = async (videoId: string, lineCd: number) => {
    if (!window.confirm('この路線の全ての駅データを削除しますか？')) {
      return;
    }

    const lineKey = `${videoId}-${lineCd}`;
    setDeleteLineLoading(lineKey);
    try {
      await deleteRailwayLine(videoId, lineCd);
      setSuccess('路線の削除が完了しました');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('路線の削除に失敗しました');
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeleteLineLoading(null);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>読み込み中...</div>;
  }

  // 動画IDごとにデータをグループ化
  const videoGroups = railwayData.reduce((acc, railway) => {
    if (!acc[railway.videoId]) {
      acc[railway.videoId] = {
        videoId: railway.videoId,
        lines: []
      };
    }
    acc[railway.videoId].lines.push(railway);
    return acc;
  }, {} as { [key: string]: { videoId: string; lines: RailwayVideo[] } });

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>駅マッピング一覧</h2>
        <button
          onClick={() => {
            if (router) {
              router.push('/submit');
            }
          }}
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
      {reportModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h3>問題を報告</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              style={{
                width: '100%',
                height: '150px',
                marginBottom: '1rem',
                padding: '0.5rem',
                boxSizing: 'border-box'
              }}
              placeholder="問題の内容を入力してください"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                onClick={() => setReportModalOpen(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#9e9e9e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleReportSubmit}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                報告する
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {Object.values(videoGroups).map((videoGroup) => (
          <div key={videoGroup.videoId} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
            <div
              style={{
                backgroundColor: '#f5f5f5',
                padding: '1rem',
                borderBottom: '1px solid #ddd',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedVideoId(selectedVideoId === videoGroup.videoId ? null : videoGroup.videoId)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {videoGroup.lines.map((line) => (
                    <div key={line.lineCd} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontWeight: 'bold' }}>{line.lineName}</span>
                      <span>
                        {line.stations[0]?.stationName} ～ {line.stations[line.stations.length - 1]?.stationName}
                      </span>
                      {(user && user.id === line.userId) || (user && isAdminFlag) ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLine(line.videoId, line.lineCd);
                          }}
                          disabled={deleteLineLoading === `${line.videoId}-${line.lineCd}`}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: deleteLineLoading === `${line.videoId}-${line.lineCd}` ? 'not-allowed' : 'pointer',
                            opacity: deleteLineLoading === `${line.videoId}-${line.lineCd}` ? 0.7 : 1,
                            fontSize: '0.8rem'
                          }}
                        >
                          {deleteLineLoading === `${line.videoId}-${line.lineCd}` ? '削除中...' : '路線を削除'}
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
                  <div style={{ color: '#666' }}>
                    動画ID: {videoGroup.videoId}
                  </div>
                  <a
                    href={`https://www.youtube.com/watch?v=${videoGroup.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: '#2196f3' }}
                  >
                    YouTubeで見る
                  </a>
                </div>
              </div>
            </div>

            {selectedVideoId === videoGroup.videoId && (
              <div style={{ padding: '1rem' }}>
                {videoGroup.lines.map((railway) => (
                  <div key={`${railway.videoId}-${railway.lineCd}`} style={{ marginBottom: '2rem' }}>
                    <h4 style={{ marginBottom: '1rem' }}>{railway.lineName}</h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f5f5f5' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>駅コード</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>駅名</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>開始時間</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>緯度</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>経度</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {railway.stations.map((station) => (
                            <tr key={station.id || station.stationCd} style={{ borderBottom: '1px solid #ddd' }}>
                              <td style={{ padding: '0.75rem' }}>{station.stationCd}</td>
                              <td style={{ padding: '0.75rem' }}>{station.stationName}</td>
                              <td style={{ padding: '0.75rem' }}>
                                <a
                                  href={`https://www.youtube.com/watch?v=${railway.videoId}&t=${station.startTime}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {station.startTime}秒
                                </a>
                              </td>
                              <td style={{ padding: '0.75rem' }}>{station.lat}</td>
                              <td style={{ padding: '0.75rem' }}>{station.lon}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                  {(user && user.id === station.userId) || (user && isAdminFlag) ? (
                                    <button
                                      onClick={() => handleDelete(station.id!)}
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
                                  ) : null}
                                  <button
                                    onClick={() => handleReport(station.id!)}
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
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ListPage;