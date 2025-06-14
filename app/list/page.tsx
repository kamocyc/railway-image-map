'use client'

import { useEffect, useState } from 'react'
import Header from '../../src/components/Header'
import ListPage from './ListPage'
import { RailwayVideo } from '../../src/types/RailwayData'
import { getRailwayData } from '../../src/lib/supabase'

export default function List() {
  const [railwayData, setRailwayData] = useState<RailwayVideo[]>([])
  const [dataLoading, setDataLoading] = useState(true)

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
      <Header />
      <main style={{ flexGrow: 1, overflow: 'auto' }}>
        <ListPage railwayData={railwayData} loading={dataLoading} />
      </main>
    </div>
  )
} 