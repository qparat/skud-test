import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { LayoutWrapper } from '@/components/LayoutWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'РЎРљРЈР” РЎРёСЃС‚РµРјР°',
  description: 'РЎРёСЃС‚РµРјР° РєРѕРЅС‚СЂРѕР»СЏ Рё СѓРїСЂР°РІР»РµРЅРёСЏ РґРѕСЃС‚СѓРїРѕРј',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  )
}

