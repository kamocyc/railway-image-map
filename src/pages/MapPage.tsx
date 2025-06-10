import { useEffect, useRef } from 'react';
import { initializeMap } from '../components/MapView';
import { StationMapping } from '../types/StationMapping';

interface MapPageProps {
  stationMappings: StationMapping[];
  loading: boolean;
}

function MapPage({ stationMappings, loading }: MapPageProps) {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!loading && stationMappings.length > 0) {
      // マップの初期化
      mapRef.current = initializeMap('map', stationMappings);

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
        }
      };
    }
  }, [stationMappings, loading]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {loading ? (
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