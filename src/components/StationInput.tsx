import { useState, useEffect } from 'react';
import { getStationSuggestions, loadCSVData } from '../lib/csvData';

interface StationInputProps {
    lineCd: string;
    onStationAdd: (station: {
        stationCd: string;
        stationName: string;
        startTime: number;
        lat: number;
        lon: number;
    }) => void;
}

export function StationInput({ lineCd, onStationAdd }: StationInputProps) {
    const [csvDataLoaded, setCsvDataLoaded] = useState(false);
    const [stationSuggestions, setStationSuggestions] = useState<Array<{ station_cd: string; station_name: string; lat: string; lon: string }>>([]);
    const [newStation, setNewStation] = useState({
        stationName: '',
        startTime: '0',
    });
    const [csvInput, setCsvInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initializeData = async () => {
            const success = await loadCSVData();
            setCsvDataLoaded(success);
        };
        initializeData();
    }, []);

    const parseTimeToSeconds = (timeStr: string): number => {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        return (hours * 3600) + (minutes * 60) + seconds;
    };

    const handleStationNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewStation(prev => ({ ...prev, stationName: value }));

        if (lineCd && value) {
            const suggestions = getStationSuggestions(value, lineCd);
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

    const handleAddStation = () => {
        const selectedStation = stationSuggestions.find(s => s.station_name === newStation.stationName);
        if (!selectedStation) {
            setError('駅が見つかりません');
            setTimeout(() => setError(null), 3000);
            return;
        }

        onStationAdd({
            stationCd: selectedStation.station_cd,
            stationName: selectedStation.station_name,
            startTime: parseInt(newStation.startTime, 10),
            lat: parseFloat(selectedStation.lat),
            lon: parseFloat(selectedStation.lon),
        });

        setNewStation({
            stationName: '',
            startTime: '0',
        });
    };

    const handleCsvSubmit = () => {
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

                onStationAdd({
                    stationCd: selectedStation.station_cd,
                    stationName: selectedStation.station_name,
                    startTime: parseTimeToSeconds(timeStr),
                    lat: parseFloat(selectedStation.lat),
                    lon: parseFloat(selectedStation.lon),
                });
            }

            setCsvInput('');
        } catch (error) {
            setError(error instanceof Error ? error.message : '駅の登録に失敗しました');
            setTimeout(() => setError(null), 3000);
        }
    };

    return (
        <div>
            {error && (
                <div style={{ padding: '1rem', backgroundColor: '#ffebee', color: '#c62828', marginBottom: '1rem', borderRadius: '4px' }}>
                    {error}
                </div>
            )}

            <div style={{ marginBottom: '1rem', width: '100%', boxSizing: 'border-box', position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', width: '100%' }}>
                    駅名:
                    <input
                        type="text"
                        value={newStation.stationName}
                        onChange={handleStationNameChange}
                        style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
                        placeholder="駅名を入力"
                        required
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
                        {stationSuggestions.map((station, index) => (
                            <div
                                key={index}
                                onClick={() => handleStationSelect(station)}
                                style={{
                                    padding: '0.5rem',
                                    cursor: 'pointer',
                                    backgroundColor: 'white',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                                {station.station_name}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    開始時間:
                    <input
                        type="text"
                        value={newStation.startTime}
                        onChange={(e) => setNewStation(prev => ({ ...prev, startTime: e.target.value }))}
                        style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
                        placeholder="開始時間（秒）"
                        required
                    />
                </label>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    CSV形式で一括登録:
                    <textarea
                        value={csvInput}
                        onChange={(e) => setCsvInput(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            marginTop: '0.5rem',
                            minHeight: '100px',
                            boxSizing: 'border-box'
                        }}
                        placeholder="駅名,時間 (HH:MM:SS)&#10;例:&#10;長町,00:00:00&#10;太子堂,00:01:15"
                    />
                </label>
                <button
                    onClick={handleCsvSubmit}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginTop: '0.5rem'
                    }}
                >
                    一括登録
                </button>
            </div>

            <button
                onClick={handleAddStation}
                style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '0.5rem'
                }}
            >
                駅を追加
            </button>
        </div>
    );
} 