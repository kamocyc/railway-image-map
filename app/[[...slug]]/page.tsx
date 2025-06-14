import '../../src/styles/index.css'
import '../../src/styles/markers.css'
import { ClientOnly } from './client'

export function generateStaticParams() {
    return [{ slug: [''] }]
}

export default function Page() {
    return <ClientOnly />
} 