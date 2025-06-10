import { useEffect } from 'react';
import { initializeMap } from './components/MapView';

function App() {
  useEffect(() => {
    const map = initializeMap('map');

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <h1>Railway Image Map</h1>
      <div id="map" style={{ flexGrow: 1 }}></div>
      <div id="youtube-player" style={{ width: '100%', height: '360px' }}></div>
    </div>
  );
}


export default App