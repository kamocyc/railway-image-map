'use client'

import { useEffect, useState } from 'react'
import Header from '../src/components/Header'
import MapPage from './MapPage'
import { RailwayVideo } from '../src/types/RailwayData'
import { getRailwayData } from '../src/lib/supabase'

export default function Home() {
  const [railwayData, setRailwayData] = useState<RailwayVideo[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    async function loadRailwayData() {
      setDataLoading(true)
      try {
        const data = await getRailwayData()
        setRailwayData(data)
      } catch (error) {
        console.error('Failed to load railway data:', error)
      } finally {
        setDataLoading(false)
      }
    }

    loadRailwayData()
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header showControls={showControls} setShowControls={setShowControls} />
      <main style={{ flexGrow: 1, overflow: 'auto', padding: '0' }}>
        <MapPage loading={dataLoading} railwayData={railwayData} showControls={showControls} />
      </main>
    </div>
  )
} 