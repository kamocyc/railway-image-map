import { useEffect, useRef, useState } from 'react';
import { initializeMapWithRailwayData } from '../src/components/MapView';
import { RailwayVideo } from '../src/types/RailwayData';
import Split from 'react-split';

interface MapPageProps {
  loading: boolean;
  railwayData: RailwayVideo[];
}

type LayoutType = 'vertical' | 'horizontal';

function MapPage({ loading, railwayData }: MapPageProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapInitializedRef = useRef<boolean>(false); // マップが初期化されたかどうかを追跡
  const [layout, setLayout_] = useState<LayoutType>('vertical');
  const mapDivRef = useRef<HTMLDivElement>(null);
  const youtubePlayerContainerDivRef = useRef<HTMLDivElement>(null);

  const setLayout = (layout: LayoutType) => {
    setLayout_(layout);
    if (layout === 'vertical') {
      mapDivRef.current?.style.setProperty('width', '100%');
      youtubePlayerContainerDivRef.current?.style.setProperty('width', '100%');
    } else {
      mapDivRef.current?.style.setProperty('height', '100%');
      youtubePlayerContainerDivRef.current?.style.setProperty('height', '100%');
    }
  };

  // マップの初期化と更新
  useEffect(() => {
    import('leaflet').then((L) => {
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

      mapRef.current = initializeMapWithRailwayData('map', railwayData, L);

      mapInitializedRef.current = true;
    });

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
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            display: 'flex',
            gap: '0.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '0.5rem',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <button
              onClick={() => setLayout('vertical')}
              style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: layout === 'vertical' ? '#4CAF50' : '#f0f0f0',
                color: layout === 'vertical' ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              上下
            </button>
            <button
              onClick={() => setLayout('horizontal')}
              style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: layout === 'horizontal' ? '#4CAF50' : '#f0f0f0',
                color: layout === 'horizontal' ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              左右
            </button>
          </div>
          <Split
            direction={layout}
            sizes={[50, 50]}
            minSize={100}
            style={{
              display: 'flex',
              flexDirection: layout === 'vertical' ? 'column' : 'row',
              flexGrow: 1,
              gap: '0.1rem'
            }}
            gutterStyle={() => ({
              backgroundColor: '#aaa',
              backgroundImage: 'linear-gradient(transparent, transparent)',
              backgroundSize: '4px 4px',
              backgroundRepeat: 'repeat',
              backgroundPosition: 'center',
              width: layout === 'vertical' ? '100%' : '4px',
              height: layout === 'vertical' ? '4px' : '100%',
              cursor: layout === 'vertical' ? 'row-resize' : 'col-resize'
            })}
          >
            <div id="map" ref={mapDivRef} style={{
              flexGrow: 1,
              height: '100%',
              width: '100%'
            }}></div>
            <div id="youtube-player-container" ref={youtubePlayerContainerDivRef} style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div id="youtube-player" style={{
                width: '100%',
                height: '100%'
              }}></div>
            </div>
          </Split>
        </>
      )}
    </div>
  );
}

export default MapPage;