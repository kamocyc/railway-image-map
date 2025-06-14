'use client'

import Link from 'next/link'
import { useAuth } from '../lib/auth'

export default function Header() {
  const { user } = useAuth()

  return (
    <header style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
      <h1>Railway Image Map</h1>
      <nav>
        <ul style={{ display: 'flex', gap: '1rem', listStyle: 'none', padding: 0 }}>
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
        </ul>
      </nav>
    </header>
  )
} 