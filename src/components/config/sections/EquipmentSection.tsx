'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'

const EQUIPMENT_LIST = [
  { id: 'gym', label: 'Salle de sport / Box CrossFit', icon: '🏢' },
  { id: 'dumbbells', label: 'Haltères', icon: '🏋️' },
  { id: 'kettlebells', label: 'Kettlebells', icon: '⚙️' },
  { id: 'barbell', label: 'Barre olympique + poids', icon: '🥇' },
  { id: 'bench', label: 'Banc de musculation', icon: '🪑' },
  { id: 'pullup_bar', label: 'Barre de traction', icon: '🔩' },
  { id: 'bands', label: 'Élastiques de résistance', icon: '🔶' },
  { id: 'rower', label: 'Rameur (Concept2)', icon: '🚣' },
  { id: 'ski_erg', label: 'Ski-Erg', icon: '⛷️' },
  { id: 'air_bike', label: 'Air Bike', icon: '🚲' },
  { id: 'road_bike', label: 'Vélo route / gravel / VTT', icon: '🚴' },
  { id: 'trainer', label: 'Home trainer / Tapis de course', icon: '🏠' },
  { id: 'pool_25', label: 'Piscine 25m', icon: '🏊' },
  { id: 'pool_50', label: 'Piscine 50m', icon: '🏊' },
  { id: 'sled', label: 'Sled / Traîneau', icon: '🛷' },
  { id: 'sandbags', label: 'Sandbags / Wall balls', icon: '🎯' },
  { id: 'trx', label: 'TRX / Sangles', icon: '🔧' },
  { id: 'climbing_wall', label: 'Mur d\'escalade', icon: '🧗' },
  { id: 'ski_gear', label: 'Matériel ski', icon: '⛷️' },
]

export function EquipmentSection() {
  const { profile, updateProfile } = useAppStore()
  const equipment = profile?.equipment ?? []
  const [saved, setSaved] = useState(false)

  function toggle(id: string) {
    const next = equipment.includes(id) ? equipment.filter(e => e !== id) : [...equipment, id]
    updateProfile({ equipment: next })
  }

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white font-semibold text-lg mb-1">Matériel disponible</h2>
        <p className="text-[#a3a3a3] text-sm">Sélectionnez le matériel auquel vous avez accès pour adapter les séances.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {EQUIPMENT_LIST.map(item => {
          const selected = equipment.includes(item.id)
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left text-sm transition-all ${
                selected
                  ? 'border-[#ff3b30]/40 bg-[#ff3b30]/8 text-white'
                  : 'border-[#262626] bg-[#0a0a0a] text-[#a3a3a3] hover:text-white hover:border-[#404040]'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {selected && <span className="text-[#ff3b30] text-xs">✓</span>}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          className="px-5 py-2.5 bg-[#ff3b30] hover:bg-[#ff5a52] text-white font-semibold text-sm rounded-lg transition-colors"
        >
          Sauvegarder
        </button>
        {saved && <span className="text-green-400 text-sm">✓ Sauvegardé</span>}
      </div>
    </div>
  )
}
