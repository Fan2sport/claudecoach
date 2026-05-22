'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { SPORT_LABELS, SPORT_ICONS } from '@/lib/utils'
import type { Objective, Sport } from '@/types'
import { v4 as uuidv4 } from 'uuid'

const PRESET_OBJECTIVES: { sport: Sport; name: string; target: string }[] = [
  // Running
  { sport: 'running', name: 'Sub 30 au 5km', target: '5km en moins de 30min' },
  { sport: 'running', name: 'Sub 25 au 5km', target: '5km en moins de 25min' },
  { sport: 'running', name: 'Sub 20 au 5km', target: '5km en moins de 20min' },
  { sport: 'running', name: 'Sub 1h au 10km', target: '10km en moins de 60min' },
  { sport: 'running', name: 'Sub 50min au 10km', target: '10km en moins de 50min' },
  { sport: 'running', name: 'Sub 45min au 10km', target: '10km en moins de 45min' },
  { sport: 'running', name: 'Sub 40min au 10km', target: '10km en moins de 40min' },
  { sport: 'running', name: 'Sub 35min au 10km', target: '10km en moins de 35min' },
  { sport: 'running', name: 'Sub 2h au semi', target: 'Semi-marathon en moins de 2h' },
  { sport: 'running', name: 'Sub 1h45 au semi', target: 'Semi-marathon en moins de 1h45' },
  { sport: 'running', name: 'Sub 1h30 au semi', target: 'Semi-marathon en moins de 1h30' },
  { sport: 'running', name: 'Sub 1h20 au semi', target: 'Semi-marathon en moins de 1h20' },
  { sport: 'running', name: 'Sub 4h30 au marathon', target: 'Marathon en moins de 4h30' },
  { sport: 'running', name: 'Sub 4h au marathon', target: 'Marathon en moins de 4h' },
  { sport: 'running', name: 'Sub 3h30 au marathon', target: 'Marathon en moins de 3h30' },
  { sport: 'running', name: 'Sub 3h au marathon', target: 'Marathon en moins de 3h' },
  { sport: 'running', name: 'Sub 2h50 au marathon', target: 'Marathon en moins de 2h50' },
  // Trail
  { sport: 'trail', name: 'Terminer 10km trail', target: 'Finisher 10km trail' },
  { sport: 'trail', name: 'Terminer 30km trail', target: 'Finisher 30km trail' },
  { sport: 'trail', name: 'Terminer 50km trail', target: 'Finisher 50km trail' },
  { sport: 'trail', name: 'Terminer 100km ultra', target: 'Finisher ultra 100km' },
  // Hyrox
  { sport: 'hyrox', name: 'Terminer Hyrox solo', target: 'Finisher Hyrox solo' },
  { sport: 'hyrox', name: 'Sub 1h30 Hyrox', target: 'Hyrox en moins de 1h30' },
  { sport: 'hyrox', name: 'Sub 1h15 Hyrox', target: 'Hyrox en moins de 1h15' },
  { sport: 'hyrox', name: 'Sub 1h Hyrox', target: 'Hyrox en moins de 1h' },
  // Cycling
  { sport: 'cycling', name: 'Augmenter FTP +10%', target: '+10% sur le FTP actuel' },
  { sport: 'cycling', name: 'Cyclosportive 100km', target: 'Terminer cyclosportive 100km' },
  // Triathlon
  { sport: 'triathlon', name: 'Terminer triathlon Sprint', target: 'Finisher triathlon Sprint' },
  { sport: 'triathlon', name: 'Terminer triathlon M', target: 'Finisher triathlon Olympique' },
  { sport: 'triathlon', name: 'Terminer Half IronMan', target: 'Finisher Half IronMan' },
  { sport: 'triathlon', name: 'Terminer IronMan', target: 'Finisher IronMan' },
  // Strength
  { sport: 'strength', name: 'Squat 100kg', target: 'Squat 1RM 100kg' },
  { sport: 'strength', name: 'Deadlift 2x poids de corps', target: 'Deadlift 2x son poids' },
  { sport: 'strength', name: 'Prise de masse +3kg', target: '+3kg de masse musculaire' },
  // Health
  { sport: 'mobility', name: 'Santé générale', target: 'Maintien forme générale' },
  { sport: 'mobility', name: 'Reprise après blessure', target: 'Retour progressif à l\'activité' },
]

export function ObjectivesSection() {
  const { profile, updateProfile } = useAppStore()
  const objectives = profile?.objectives ?? []
  const [saved, setSaved] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customSport, setCustomSport] = useState<Sport>('running')
  const [customTarget, setCustomTarget] = useState('')
  const [customDate, setCustomDate] = useState('')
  const [filterSport, setFilterSport] = useState<Sport | 'all'>('all')

  const sportFilter = Array.from(new Set(PRESET_OBJECTIVES.map(o => o.sport))) as Sport[]

  function addPreset(preset: typeof PRESET_OBJECTIVES[0]) {
    const existing = objectives.find(o => o.name === preset.name)
    if (existing) return
    const minDate = new Date()
    minDate.setMonth(minDate.getMonth() + 3)
    const newObj: Objective = {
      id: uuidv4(),
      sport: preset.sport,
      name: preset.name,
      target: preset.target,
      targetDate: minDate.toISOString().split('T')[0],
      isPrimary: objectives.length === 0,
    }
    updateProfile({ objectives: [...objectives, newObj] })
  }

  function addCustom() {
    if (!customName || !customDate) return
    const newObj: Objective = {
      id: uuidv4(),
      sport: customSport,
      name: customName,
      target: customTarget || customName,
      targetDate: customDate,
      isPrimary: objectives.length === 0,
    }
    updateProfile({ objectives: [...objectives, newObj] })
    setCustomName('')
    setCustomTarget('')
    setCustomDate('')
  }

  function removeObjective(id: string) {
    updateProfile({ objectives: objectives.filter(o => o.id !== id) })
  }

  function setPrimary(id: string) {
    updateProfile({ objectives: objectives.map(o => ({ ...o, isPrimary: o.id === id })) })
  }

  function updateDate(id: string, date: string) {
    updateProfile({ objectives: objectives.map(o => o.id === id ? { ...o, targetDate: date } : o) })
  }

  const filtered = filterSport === 'all' ? PRESET_OBJECTIVES : PRESET_OBJECTIVES.filter(o => o.sport === filterSport)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white font-semibold text-lg mb-1">Objectifs</h2>
        <p className="text-[#a3a3a3] text-sm">Définissez vos objectifs. L&apos;objectif primaire pilote le calcul de confiance.</p>
      </div>

      {/* Current objectives */}
      {objectives.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-white font-medium text-sm">Mes objectifs</h3>
          {objectives.map(obj => (
            <div
              key={obj.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                obj.isPrimary ? 'border-[#ff3b30]/40 bg-[#ff3b30]/5' : 'border-[#262626] bg-[#0a0a0a]'
              }`}
            >
              <span className="text-lg">{SPORT_ICONS[obj.sport]}</span>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium">{obj.name}</div>
                <div className="text-[#a3a3a3] text-xs">{obj.target}</div>
              </div>
              <input
                type="date"
                value={obj.targetDate}
                onChange={e => updateDate(obj.id, e.target.value)}
                className="bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-[#ff3b30]"
              />
              {!obj.isPrimary && (
                <button
                  onClick={() => setPrimary(obj.id)}
                  title="Définir comme objectif principal"
                  className="text-[#a3a3a3] hover:text-[#ff3b30] text-xs transition-colors px-1.5"
                >
                  ⭐
                </button>
              )}
              {obj.isPrimary && <span className="text-[#ff3b30] text-xs">⭐ Principal</span>}
              <button
                onClick={() => removeObjective(obj.id)}
                className="text-[#404040] hover:text-red-400 transition-colors text-sm"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preset selector */}
      <div>
        <h3 className="text-white font-medium text-sm mb-3">Ajouter un objectif prédéfini</h3>

        {/* Sport filter */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <button
            onClick={() => setFilterSport('all')}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${filterSport === 'all' ? 'border-[#ff3b30]/50 bg-[#ff3b30]/10 text-[#ff3b30]' : 'border-[#262626] text-[#a3a3a3] hover:text-white'}`}
          >
            Tous
          </button>
          {sportFilter.map(s => (
            <button
              key={s}
              onClick={() => setFilterSport(s)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${filterSport === s ? 'border-[#ff3b30]/50 bg-[#ff3b30]/10 text-[#ff3b30]' : 'border-[#262626] text-[#a3a3a3] hover:text-white'}`}
            >
              {SPORT_ICONS[s]} {SPORT_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-60 overflow-y-auto pr-1">
          {filtered.map(preset => {
            const already = objectives.some(o => o.name === preset.name)
            return (
              <button
                key={preset.name}
                onClick={() => addPreset(preset)}
                disabled={already}
                className={`text-left flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  already
                    ? 'border-[#262626] text-[#404040] cursor-not-allowed'
                    : 'border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#ff3b30]/30 hover:bg-[#ff3b30]/5'
                }`}
              >
                <span className="text-base flex-shrink-0">{SPORT_ICONS[preset.sport]}</span>
                <span className="truncate">{preset.name}</span>
                {already && <span className="ml-auto text-green-500 flex-shrink-0">✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom objective */}
      <div className="border-t border-[#262626] pt-4">
        <h3 className="text-white font-medium text-sm mb-3">Objectif personnalisé</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wide block mb-1">Nom de l&apos;objectif</label>
            <input
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="ex: Terminer Spartan Beast"
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#404040] focus:outline-none focus:border-[#ff3b30]"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wide block mb-1">Sport</label>
            <select
              value={customSport}
              onChange={e => setCustomSport(e.target.value as Sport)}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ff3b30]"
            >
              {sportFilter.map(s => <option key={s} value={s}>{SPORT_ICONS[s]} {SPORT_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wide block mb-1">Cible (description)</label>
            <input
              value={customTarget}
              onChange={e => setCustomTarget(e.target.value)}
              placeholder="ex: Finisher en moins de 5h"
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#404040] focus:outline-none focus:border-[#ff3b30]"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wide block mb-1">Date cible</label>
            <input
              type="date"
              value={customDate}
              onChange={e => setCustomDate(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ff3b30]"
            />
          </div>
        </div>
        <button
          onClick={addCustom}
          className="mt-3 px-4 py-2 border border-[#ff3b30]/40 text-[#ff3b30] hover:bg-[#ff3b30]/10 text-sm font-medium rounded-lg transition-colors"
        >
          + Ajouter l&apos;objectif
        </button>
      </div>
    </div>
  )
}
