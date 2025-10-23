'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  
  // РЎС‚СЂР°РЅРёС†С‹, РєРѕС‚РѕСЂС‹Рµ РґРѕР»Р¶РЅС‹ РѕС‚РѕР±СЂР°Р¶Р°С‚СЊСЃСЏ Р±РµР· Sidebar (С‚РѕР»СЊРєРѕ РіР»Р°РІРЅР°СЏ)
  const fullWidthPages = ['/']
  
  const isFullWidth = fullWidthPages.includes(pathname)

  if (isFullWidth) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    )
  }

  // РЎС‚СЂР°РЅРёС†С‹ РѕС‚РґРµР»СЊРЅС‹С… СЃРѕС‚СЂСѓРґРЅРёРєРѕРІ РЅРµ РёСЃРїРѕР»СЊР·СѓСЋС‚ СЃС‚Р°РЅРґР°СЂС‚РЅС‹Р№ layout
  if (pathname.startsWith('/employees/') && pathname !== '/employees') {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

