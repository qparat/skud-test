import './globals.css'
import type { Metadata } from 'next'
import { LayoutWrapper } from '@/components/LayoutWrapper'

export const metadata: Metadata = {
  title: 'РЎРЉРЈР" РЎРёСЃС‚РµРјР°',
  description: 'РЎРёСЃС‚РµРјР° РєРѕРЅС‚СЂРѕР»СЏ Рё СѓРїСЂР°РІР»РµРЅРёСЏ РґРѕСЃС‚СѓРїРѕРј',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className="font-sans">
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  )
}

