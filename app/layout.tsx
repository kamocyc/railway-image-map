import '../src/styles/index.css'
import '../src/styles/markers.css'
import { AuthProvider } from '../src/lib/auth'

export const metadata = {
  title: 'Railway Image Map',
  description: '鉄道の画像マップアプリケーション',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
