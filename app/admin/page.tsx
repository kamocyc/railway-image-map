'use client'

import Header from '../components/Header'
import AdminPage from '../../src/pages/AdminPage'

export default function Admin() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <Header />
            <main style={{ flexGrow: 1, overflow: 'auto' }}>
                <AdminPage />
            </main>
        </div>
    )
} 