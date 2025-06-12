import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteRailwayData, addStationMapping } from '../lib/supabase';
import { RailwayData, Station } from '../types/RailwayData';
import { createReport } from '../lib/reports';
import { useAuth } from '../lib/auth';
import { isAdmin } from './AdminPage';
import { getStationSuggestions, loadCSVData } from '../lib/csvData';
import { StationInput } from '../components/StationInput';

interface ListPageProps {
  railwayData: RailwayData[];
  loading: boolean;
}

function ListPage({ railwayData, loading }: ListPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [isAdminFlag, setIsAdminFlag] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [addStationModalOpen, setAddStationModalOpen] = useState(false);
  const [selectedRailway, setSelectedRailway] = useState<RailwayData | null>(null);
  const [newStation, setNewStation] = useState({
    stationName: '',
    startTime: '0',
  });
  const [stationSuggestions, setStationSuggestions] = useState<Array<{ station_cd: string; station_name: string; lat: string; lon: string }>>([]);
  const [csvDataLoaded, setCsvDataLoaded] = useState(false);
  const [csvInput, setCsvInput] = useState('');
  const [csvError, setCsvError] = useState<string | null>(null);

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
      const success = await loadCSVData();
      setCsvDataLoaded(success);
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

  const handleAddStation = (railway: RailwayData) => {
    setSelectedRailway(railway);
    setNewStation({
      stationName: '',
      startTime: '0',
    });
    setStationSuggestions([]);
    setAddStationModalOpen(true);
  };

  const handleStationNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewStation(prev => ({ ...prev, stationName: value }));

    if (selectedRailway && value) {
      const suggestions = getStationSuggestions(value, selectedRailway.lineCd.toString());
      setStationSuggestions(suggestions);
    } else {
      setStationSuggestions([]);
    }
  };

  const handleStationSelect = (station: { station_cd: string; station_name: string; lat: string; lon: string }) => {
    setNewStation(prev => ({
      ...prev,
      stationName: station.station_name
    }));
    setStationSuggestions([]);
  };

  const handleAddStationSubmit = async () => {
    if (!selectedRailway || !newStation.stationName || !user) {
      return;
    }

    try {
      const selectedStation = stationSuggestions.find(s => s.station_name === newStation.stationName);
      if (!selectedStation) {
        throw new Error('駅が見つかりません');
      }

      await addStationMapping({
        stationCd: selectedStation.station_cd,
        stationName: selectedStation.station_name,
        videoId: selectedRailway.videoId,
        startTime: parseInt(newStation.startTime, 10),
        lat: parseFloat(selectedStation.lat),
        lon: parseFloat(selectedStation.lon),
        lineName: selectedRailway.lineName,
        lineCd: selectedRailway.lineCd,
        userId: user.id
      });

      setSuccess('駅の追加が完了しました');
      setAddStationModalOpen(false);
      setSelectedRailway(null);
      setNewStation({
        stationName: '',
        startTime: '0',
      });
      setTimeout(() => setSuccess(null), 3000);
      window.location.reload(); // 一覧を更新
    } catch (error) {
      setError(error instanceof Error ? error.message : '駅の追加に失敗しました');
      setTimeout(() => setError(null), 3000);
    }
  };

  const parseTimeToSeconds = (timeStr: string): number => {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return (hours * 3600) + (minutes * 60) + seconds;
  };

  const handleCsvSubmit = async () => {
    if (!selectedRailway || !user) {
      return;
    }

    try {
      const lines = csvInput.trim().split('\n');
      const stations = [];

      for (const line of lines) {
        const [stationName, timeStr] = line.split(',').map(s => s.trim());
        if (!stationName || !timeStr) {
          throw new Error('駅名と時間をカンマ区切りで入力してください');
        }

        const selectedStation = stationSuggestions.find(s => s.station_name === stationName);
        if (!selectedStation) {
          throw new Error(`駅 "${stationName}" が見つかりません`);
        }

        if (!/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
          throw new Error(`時間 "${timeStr}" の形式が正しくありません (HH:MM:SS)`);
        }

        stations.push({
          stationCd: selectedStation.station_cd,
          stationName: selectedStation.station_name,
          videoId: selectedRailway.videoId,
          startTime: parseTimeToSeconds(timeStr),
          lat: parseFloat(selectedStation.lat),
          lon: parseFloat(selectedStation.lon),
          lineName: selectedRailway.lineName,
          lineCd: selectedRailway.lineCd,
          userId: user.id
        });
      }

      // 一括登録
      for (const station of stations) {
        await addStationMapping(station);
      }

      setSuccess(`${stations.length}件の駅を登録しました`);
      setAddStationModalOpen(false);
      setSelectedRailway(null);
      setNewStation({
        stationName: '',
        startTime: '0',
      });
      setCsvInput('');
      setTimeout(() => setSuccess(null), 3000);
      window.location.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : '駅の登録に失敗しました');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleStationAdd = async (station: {
    stationCd: string;
    stationName: string;
    startTime: number;
    lat: number;
    lon: number;
  }) => {
    if (!selectedRailway || !user) {
      return;
    }

    try {
      await addStationMapping({
        stationCd: station.stationCd,
        stationName: station.stationName,
        videoId: selectedRailway.videoId,
        startTime: station.startTime,
        lat: station.lat,
        lon: station.lon,
        lineName: selectedRailway.lineName,
        lineCd: selectedRailway.lineCd,
        userId: user.id
      });

      setSuccess('駅の追加が完了しました');
      setAddStationModalOpen(false);
      setSelectedRailway(null);
      setTimeout(() => setSuccess(null), 3000);
      window.location.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : '駅の追加に失敗しました');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>読み込み中...</div>;
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
            <h3 style={{ marginTop: 0 }}>通報</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                通報理由:
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    marginTop: '0.5rem',
                    minHeight: '100px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="通報理由を入力してください"
                />
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                onClick={() => {
                  setReportModalOpen(false);
                  setSelectedStationId(null);
                  setReportReason('');
                }}
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

      {/* 駅追加モーダル */}
      {addStationModalOpen && selectedRailway && (
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
            <h3 style={{ marginTop: 0 }}>駅を追加</h3>
            {selectedRailway && (
              <StationInput
                lineCd={selectedRailway.lineCd.toString()}
                onStationAdd={handleStationAdd}
              />
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                onClick={() => {
                  setAddStationModalOpen(false);
                  setSelectedRailway(null);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {railwayData.map((railway) => (
          <div key={`${railway.videoId}-${railway.lineCd}`} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{
              backgroundColor: '#f5f5f5',
              padding: '1rem',
              borderBottom: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0 }}>{railway.lineName}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ color: '#666' }}>
                  動画ID: <a href={`https://www.youtube.com/watch?v=${railway.videoId}`} target="_blank" rel="noopener noreferrer">{railway.videoId}</a>
                </div>
                <button
                  onClick={() => handleAddStation(railway)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  駅を追加
                </button>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fafafa' }}>
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
    </div>
  );
}

export default ListPage;