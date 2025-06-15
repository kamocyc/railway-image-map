'use client'

import Link from 'next/link'
import { useAuth } from '../lib/auth'

export default function Header({ showControls, setShowControls }: { showControls?: boolean, setShowControls?: (show: boolean) => void }) {
  const { user } = useAuth();
  if (showControls === undefined) {
    showControls = true;
  }

  return (
    <>
      <header style={{ padding: '0.5rem', borderBottom: '1px solid #eee', display: showControls ? 'block' : 'none' }}>
        <nav>
          <ul style={{ display: 'flex', gap: '1rem', listStyle: 'none', padding: 0 }}>
            <h3 style={{ fontWeight: 'bold' }}>Railway Image Map</h3>
            <li><Link href="/">地図</Link></li>
            {user ? (
              <>
                <li><Link href="/submit">投稿</Link></li>
                <li><Link href="/list">一覧</Link></li>
                <li><Link href="/admin">管理</Link></li>
              </>
            ) : (
              <></>
            )}
            <li><Link href="/login">ログイン</Link></li>
            <li><a style={{ color: 'gray', fontSize: '0.8rem' }} href="/licenses.json">OSS License</a></li>
          </ul>
        </nav>
      </header>
      {/* 右端にフローティングでトグルボタンを設置する */}
      {setShowControls !== undefined && (
        <div style={{
          position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 1000
        }}>
          <button onClick={() => setShowControls(!showControls)} style={{
            padding: '0.2rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}>
            {showControls ? '▲' : '▼'}
          </button>
        </div>
      )}
    </>
  )
} 