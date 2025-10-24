import './globals.css'
import type { Metadata } from 'next'
import { LayoutWrapper } from '@/components/LayoutWrapper'

export const metadata: Metadata = {
  title: 'СКУД Система',
  description: 'Система контроля и управления доступом',
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

