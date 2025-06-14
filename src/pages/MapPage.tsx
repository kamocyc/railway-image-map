import { useEffect, useRef } from 'react';
import { initializeMapWithRailwayData } from '../components/MapView';
import { RailwayVideo } from '../types/RailwayData';

interface MapPageProps {
  loading: boolean;
  railwayData: RailwayVideo[];
}

function MapPage({ loading, railwayData }: MapPageProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapInitializedRef = useRef<boolean>(false); // マップが初期化されたかどうかを追跡

  // マップの初期化と更新
  useEffect(() => {
    // データがロード中の場合は何もしない
    if (loading) return;

    // データが利用可能かチェック
    const hasNewData = railwayData.length > 0;

    if (!hasNewData) return; // 新しいデータがない場合は何もしない

    // マップがすでに初期化されている場合は、既存のマップを削除
    if (mapInitializedRef.current && mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    mapRef.current = initializeMapWithRailwayData('map', railwayData);

    mapInitializedRef.current = true;

    // コンポーネントのアンマウント時にマップをクリーンアップ
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      mapInitializedRef.current = false;
    };
  }, [loading, railwayData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {(loading) ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>地図データを読み込み中...</div>
      ) : (
        <>
          <div id="map" style={{ flexGrow: 1 }}></div>
          <div id="youtube-player" style={{ width: '100%', height: '360px' }}></div>
        </>
      )}
    </div>
  );
}

export default MapPage;