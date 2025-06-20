'use client'

import Header from '../../src/components/Header'
import LoginPage from './LoginPage'

export default function Login() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <main style={{ flexGrow: 1, overflow: 'auto' }}>
        <LoginPage />
      </main>
    </div>
  )
} 