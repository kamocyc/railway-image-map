'use client'

import Header from '../../src/components/Header'
import SubmitPage from './SubmitPage'

export default function Submit() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <Header />
            <main style={{ flexGrow: 1, overflow: 'auto' }}>
                <SubmitPage />
            </main>
        </div>
    )
} 