'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import type { OffPeriod } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export function OffPeriodSection() {
  const { profile, updateProfile } = useAppStore()
  const offPeriods = profile?.offPeriods ?? []
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [reason, setReason] = useState('')

  function add() {
    if (!start || !end) return
    const newPeriod: OffPeriod = { id: uuidv4(), startDate: start, endDate: end, reason: reason || undefined }
    updateProfile({ offPeriods: [...offPeriods, newPeriod] })
    setStart('')
    setEnd('')
    setReason('')
  }

  function remove(id: string) {
    updateProfile({ offPeriods: offPeriods.filter(p => p.id !== id) })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white font-semibold text-lg mb-1">Périodes d&apos;indisponibilité</h2>
        <p className="text-[#a3a3a3] text-sm">Vacances, déplacements, blessure… Le plan sera allégé à 30% sur ces périodes.</p>
      </div>

      {offPeriods.length > 0 && (
        <div className="space-y-2">
          {offPeriods.map(period => (
            <div key={period.id} className="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl">
              <span className="text-lg">✈️</span>
              <div className="flex-1">
                <div className="text-white text-sm font-medium font-data">
                  {format(new Date(period.startDate), 'd MMM yyyy', { locale: fr })} → {format(new Date(period.endDate), 'd MMM yyyy', { locale: fr })}
                </div>
                {period.reason && <div className="text-[#a3a3a3] text-xs">{period.reason}</div>}
              </div>
              <button onClick={() => remove(period.id)} className="text-[#404040] hover:text-red-400 transition-colors">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="border border-[#262626] rounded-xl p-4 space-y-3">
        <h3 className="text-white font-medium text-sm">Ajouter une période</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wide block mb-1">Date de début</label>
            <input
              type="date"
              value={start}
              onChange={e => setStart(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ff3b30]"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wide block mb-1">Date de fin</label>
            <input
              type="date"
              value={end}
              onChange={e => setEnd(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ff3b30]"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wide block mb-1">Motif (optionnel)</label>
          <input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="ex: Vacances en famille"
            className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#404040] focus:outline-none focus:border-[#ff3b30]"
          />
        </div>
        <button
          onClick={add}
          className="px-4 py-2 bg-[#ff3b30] hover:bg-[#ff5a52] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + Ajouter la période
        </button>
      </div>
    </div>
  )
}
