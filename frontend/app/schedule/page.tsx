import { EmployeeSchedule } from '@/components/EmployeeSchedule'

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          рџ“‹ Р Р°СЃРїРёСЃР°РЅРёРµ СЃРѕС‚СЂСѓРґРЅРёРєРѕРІ
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          РџСЂРѕСЃРјРѕС‚СЂ СЂР°СЃРїРёСЃР°РЅРёСЏ СЂР°Р±РѕС‚С‹ СЃРѕС‚СЂСѓРґРЅРёРєРѕРІ РїРѕ РґРЅСЏРј
        </p>
      </div>
      
      <EmployeeSchedule />
    </div>
  )
}

