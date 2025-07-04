import { useState, useEffect } from 'react';
import { useRouter } from 'next/compat/router';
import { addRailwayData } from '../../src/lib/supabase';
import { RailwayVideo, StationVideoTime } from '../../src/types/RailwayData';
import { useAuth } from '../../src/lib/auth';
import { loadCSVData, getLineSuggestions, getStationSuggestions, findLineByName, findStationByName } from '../../src/lib/csvData';
import { processStationText } from '@/lib/api';

function SubmitPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [csvDataLoaded, setCsvDataLoaded] = useState(false);
  const [csvInput, setCsvInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [railwayData, setRailwayData] = useState({
    videoId: '',
    lineName: '',
    lineCd: '',
  });

  const [lineSuggestions, setLineSuggestions] = useState<Array<{ line_cd: string; line_name: string }>>([]);
  const [stationSuggestions, setStationSuggestions] = useState<Array<{ station_cd: string; station_name: string; lat: string; lon: string }>>([]);

  const [stations, setStations] = useState<Array<{
    stationCd: string;
    stationName: string;
    startTime: string;
    lat: string;
    lon: string;
  }>>([{
    stationCd: '',
    stationName: '',
    startTime: '0',
    lat: '',
    lon: '',
  }]);

  useEffect(() => {
    const initializeData = async () => {
      const success = await loadCSVData();
      setCsvDataLoaded(success);
    };
    initializeData();
  }, []);

  const handleRailwayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRailwayData(prev => ({ ...prev, [name]: value }));

    if (name === 'lineName') {
      const suggestions = getLineSuggestions(value);
      setLineSuggestions(suggestions);
    }
  };

  const handleLineSelect = (line: { line_cd: string; line_name: string }) => {
    setRailwayData(prev => ({
      ...prev,
      lineName: line.line_name,
      lineCd: line.line_cd
    }));
    setLineSuggestions([]);
  };

  const handleStationChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStations(prev => prev.map((station, i) =>
      i === index ? { ...station, [name]: value } : station
    ));

    if (name === 'stationName' && railwayData.lineCd) {
      const suggestions = getStationSuggestions(value, railwayData.lineCd);
      setStationSuggestions(suggestions);
    }
  };

  const handleStationSelect = (index: number, station: { station_cd: string; station_name: string; lat: string; lon: string }) => {
    setStations(prev => prev.map((s, i) =>
      i === index ? {
        ...s,
        stationCd: station.station_cd,
        stationName: station.station_name,
        lat: station.lat,
        lon: station.lon
      } : s
    ));
    setStationSuggestions([]);
  };

  const addStation = () => {
    setStations(prev => [...prev, {
      stationCd: '',
      stationName: '',
      startTime: '0',
      lat: '',
      lon: '',
    }]);
  };

  const removeStation = (index: number) => {
    setStations(prev => prev.filter((_, i) => i !== index));
  };

  const handleGeminiProcess = async () => {
    if (!csvInput.trim()) {
      setError('テキストを入力してください');
      return;
    }

    setIsProcessing(true);
    try {
      const processedText = await processStationText(csvInput);
      setCsvInput(processedText);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'テキストの処理に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCsvSubmit = async () => {
    if (!railwayData.lineCd) {
      setError('路線を選択してください');
      return;
    }

    try {
      const lines = csvInput.trim().split('\n');
      const newStations = lines.map(line => {
        const [timeStr, stationName] = line.split(',').map(s => s.trim());
        if (!stationName || !timeStr) {
          throw new Error('CSVの形式が正しくありません');
        }

        const stationData = findStationByName(stationName, railwayData.lineCd);
        if (!stationData) {
          throw new Error(`駅 "${stationName}" は指定された路線に存在しません`);
        }

        // 時間文字列のバリデーション
        const validateTimeString = (timeStr: string): void => {
          // 基本的なフォーマットチェック
          if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(timeStr)) {
            throw new Error('時間は "MM:SS" または "HH:MM:SS" 形式で入力してください');
          }

          const elements = timeStr.split(':').map(Number);

          // 数値の範囲チェック
          if (elements.length === 2) {
            // MM:SS形式
            if (elements[0] < 0 || elements[0] > 59) {
              throw new Error('分は0から59の間で入力してください');
            }
            if (elements[1] < 0 || elements[1] > 59) {
              throw new Error('秒は0から59の間で入力してください');
            }
          } else {
            // HH:MM:SS形式
            if (elements[0] < 0 || elements[0] > 23) {
              throw new Error('時間は0から23の間で入力してください');
            }
            if (elements[1] < 0 || elements[1] > 59) {
              throw new Error('分は0から59の間で入力してください');
            }
            if (elements[2] < 0 || elements[2] > 59) {
              throw new Error('秒は0から59の間で入力してください');
            }
          }
        };

        // 時間文字列のバリデーションを実行
        validateTimeString(timeStr);

        // 時間を秒に変換
        const elements = timeStr.split(':').map(Number);
        const startTime = elements.length === 2 ? elements[0] * 60 + elements[1] : elements[0] * 3600 + elements[1] * 60 + elements[2];

        return {
          stationCd: stationData.station_cd,
          stationName: stationData.station_name,
          startTime: startTime.toString(),
          lat: stationData.lat,
          lon: stationData.lon,
        };
      });

      setStations(newStations);
      setCsvInput('');
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'CSVの処理に失敗しました');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 路線データの検証
      const line = findLineByName(railwayData.lineName);
      if (!line) {
        throw new Error('指定された路線名は存在しません');
      }

      if (!railwayData.videoId) {
        throw new Error('YouTube ビデオIDは必須です');
      }

      // YouTubeのビデオIDの検証
      if (!/^[\w-]{11}$/.test(railwayData.videoId)) {
        throw new Error('無効なYouTubeビデオIDです');
      }

      // 駅データの検証
      const validatedStations: StationVideoTime[] = stations.map(station => {
        const stationData = findStationByName(station.stationName, railwayData.lineCd);
        if (!stationData) {
          throw new Error(`駅 "${station.stationName}" は指定された路線に存在しません`);
        }

        const startTime = parseInt(station.startTime, 10);
        if (isNaN(startTime)) {
          throw new Error('開始時間は数値で入力してください');
        }

        return {
          stationCd: parseInt(stationData.station_cd, 10),
          stationName: stationData.station_name,
          startTime,
          lat: parseFloat(stationData.lat),
          lon: parseFloat(stationData.lon),
        };
      });

      const newMapping: RailwayVideo = {
        videoId: railwayData.videoId,
        lineName: railwayData.lineName,
        lineCd: railwayData.lineCd,
        stations: validatedStations,
        userId: user?.id,
      };

      const result = await addRailwayData(newMapping);

      if (result) {
        setSuccess(true);
        // フォームをリセット
        setRailwayData({
          videoId: '',
          lineName: '',
          lineCd: '',
        });
        setStations([{
          stationCd: '',
          stationName: '',
          startTime: '0',
          lat: '',
          lon: '',
        }]);
        setCsvInput('');
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
        <button onClick={() => {
          if (router) {
            router.push('/login');
          }
        }} style={{ padding: '0.5rem 1rem' }}>
          ログインページへ
        </button>
      </div>
    );
  }

  if (!csvDataLoaded) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h2>データを読み込み中...</h2>
        <p>路線・駅データを読み込んでいます。しばらくお待ちください。</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', boxSizing: 'border-box' }}>
      <h2>新しい路線マッピングを追加</h2>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#ffebee', color: '#c62828', marginBottom: '1rem', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '1rem', backgroundColor: '#e8f5e9', color: '#2e7d32', marginBottom: '1rem', borderRadius: '4px' }}>
          マッピングが正常に保存されました！
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ width: '100%', boxSizing: 'border-box' }}>
        {/* 路線情報セクション */}
        <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', width: '100%', boxSizing: 'border-box' }}>
          <h3 style={{ marginTop: 0 }}>路線情報</h3>

          <div style={{ marginBottom: '1rem', width: '100%', boxSizing: 'border-box' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', width: '100%' }}>
              YouTube ビデオID:
              <input
                type="text"
                name="videoId"
                value={railwayData.videoId}
                onChange={handleRailwayChange}
                style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
                placeholder="例: dQw4w9WgXcQ"
                required
              />
            </label>
            <small style={{ display: 'block', color: '#666' }}>
              YouTubeの動画URLの「v=」の後の部分です (例: https://www.youtube.com/watch?v=dQw4w9WgXcQ)
            </small>
          </div>

          <div style={{ marginBottom: '1rem', width: '100%', boxSizing: 'border-box', position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', width: '100%' }}>
              路線名:
              <input
                type="text"
                name="lineName"
                value={railwayData.lineName}
                onChange={handleRailwayChange}
                style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
                placeholder="例: JR東北本線"
                required
              />
            </label>
            {lineSuggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000
              }}>
                {lineSuggestions.map((line, index) => (
                  <div
                    key={index}
                    onClick={() => handleLineSelect(line)}
                    style={{
                      padding: '0.5rem',
                      cursor: 'pointer',
                      backgroundColor: 'white',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    {line.line_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1rem', width: '100%', boxSizing: 'border-box' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', width: '100%' }}>
              路線コード:
              <input
                type="text"
                name="lineCd"
                value={railwayData.lineCd}
                readOnly
                style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box', backgroundColor: '#f5f5f5' }}
              />
            </label>
          </div>
        </div>

        {/* 駅情報セクション */}
        <div style={{ marginBottom: '2rem', width: '100%', boxSizing: 'border-box' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>駅情報</h3>
          </div>

          {/* CSV一括登録セクション */}
          <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', width: '100%', boxSizing: 'border-box' }}>
            <h4 style={{ marginTop: 0 }}>CSV形式で駅を一括登録</h4>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                <textarea
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  disabled={isProcessing}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    marginTop: '0.5rem',
                    minHeight: '200px',
                    cursor: isProcessing ? 'not-allowed' : 'text',
                    boxSizing: 'border-box'
                  }}
                  placeholder="時間 (HH:MM:SS),駅名&#10;例:&#10;00:00:00,長町&#10;00:01:15,太子堂"
                />
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleGeminiProcess}
                  disabled={isProcessing}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.7 : 1
                  }}
                >
                  {isProcessing ? '処理中...' : 'Geminiで整形'}
                </button>
                <button
                  type="button"
                  onClick={handleCsvSubmit}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  一括登録
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>駅一覧</h3>
            <button
              type="button"
              onClick={addStation}
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

          {stations.map((station, index) => (
            <div key={index} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0 }}>駅 {index + 1}</h4>
                {stations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStation(index)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    削除
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', width: '100%' }}>
                <div style={{ width: '100%', boxSizing: 'border-box', position: 'relative' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', width: '100%' }}>
                    駅名:
                    <input
                      type="text"
                      name="stationName"
                      value={station.stationName}
                      onChange={(e) => handleStationChange(index, e)}
                      style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
                      required
                      disabled={!railwayData.lineCd}
                    />
                  </label>
                  {stationSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000
                    }}>
                      {stationSuggestions.map((s, i) => (
                        <div
                          key={i}
                          onClick={() => handleStationSelect(index, s)}
                          style={{
                            padding: '0.5rem',
                            cursor: 'pointer',
                            backgroundColor: 'white',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                          {s.station_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ width: '100%', boxSizing: 'border-box' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', width: '100%' }}>
                    駅コード:
                    <input
                      type="text"
                      name="stationCd"
                      value={station.stationCd}
                      readOnly
                      style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box', backgroundColor: '#f5f5f5' }}
                    />
                  </label>
                </div>

                <div style={{ width: '100%', boxSizing: 'border-box' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', width: '100%' }}>
                    開始時間 (秒):
                    <input
                      type="number"
                      name="startTime"
                      value={station.startTime}
                      onChange={(e) => handleStationChange(index, e)}
                      style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
                      min="0"
                      required
                    />
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SubmitPage;