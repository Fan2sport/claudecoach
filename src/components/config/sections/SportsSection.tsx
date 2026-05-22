'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { SPORT_LABELS, SPORT_ICONS, SPORT_COLORS } from '@/lib/utils'
import type { Sport, Level, SportProfile } from '@/types'

const ALL_SPORTS: Sport[] = ['running', 'trail', 'cycling', 'swimming', 'triathlon', 'crossfit', 'hyrox', 'strength', 'powerlifting', 'calisthenics', 'team_sports', 'tennis', 'padel', 'combat', 'ski', 'climbing', 'hiking', 'mobility']
const LEVELS: { value: Level; label: string }[] = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
  { value: 'expert', label: 'Expert' },
]

export function SportsSection() {
  const { profile, updateProfile } = useAppStore()
  const sports = profile?.sports ?? []
  const [saved, setSaved] = useState(false)
  const [expanded, setExpanded] = useState<Sport | null>(null)

  function toggleSport(sport: Sport) {
    const existing = sports.find(s => s.sport === sport)
    let next: SportProfile[]
    if (existing) {
      next = sports.filter(s => s.sport !== sport)
    } else {
      next = [...sports, { sport, level: 'intermediate', prs: {} }]
    }
    updateProfile({ sports: next })
  }

  function updateSportField(sport: Sport, field: keyof SportProfile, value: unknown) {
    const next = sports.map(s => s.sport === sport ? { ...s, [field]: value } : s)
    updateProfile({ sports: next })
  }

  function updatePR(sport: Sport, key: string, value: string) {
    const next = sports.map(s => s.sport === sport ? { ...s, prs: { ...s.prs, [key]: value } } : s)
    updateProfile({ sports: next })
  }

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white font-semibold text-lg mb-1">Sports pratiqués</h2>
        <p className="text-[#a3a3a3] text-sm">Sélectionnez vos sports et renseignez votre niveau.</p>
      </div>

      {/* Sport selection grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {ALL_SPORTS.map(sport => {
          const selected = sports.some(s => s.sport === sport)
          const color = SPORT_COLORS[sport]
          return (
            <button
              key={sport}
              onClick={() => toggleSport(sport)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all text-left"
              style={{
                borderColor: selected ? `${color}50` : '#262626',
                backgroundColor: selected ? `${color}12` : '#0a0a0a',
                color: selected ? color : '#a3a3a3',
              }}
            >
              <span className="text-base">{SPORT_ICONS[sport]}</span>
              <span className="font-medium leading-tight">{SPORT_LABELS[sport]}</span>
              {selected && <span className="ml-auto text-xs">✓</span>}
            </button>
          )
        })}
      </div>

      {/* Selected sport details */}
      {sports.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-white font-medium text-sm border-t border-[#262626] pt-4">Détails par sport</h3>
          {sports.map(sp => (
            <div key={sp.sport} className="border border-[#262626] rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === sp.sport ? null : sp.sport)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1a1a1a] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>{SPORT_ICONS[sp.sport]}</span>
                  <span className="text-white font-medium text-sm">{SPORT_LABELS[sp.sport]}</span>
                  <span className="text-xs text-[#a3a3a3] ml-1">
                    {LEVELS.find(l => l.value === sp.level)?.label}
                  </span>
                </div>
                <span className="text-[#a3a3a3] text-xs">{expanded === sp.sport ? '▲' : '▼'}</span>
              </button>

              {expanded === sp.sport && (
                <div className="px-4 pb-4 space-y-3 bg-[#0a0a0a]/30 border-t border-[#262626]">
                  <div className="pt-3">
                    <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wide block mb-1.5">Niveau</label>
                    <div className="flex gap-2 flex-wrap">
                      {LEVELS.map(l => (
                        <button
                          key={l.value}
                          onClick={() => updateSportField(sp.sport, 'level', l.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                            sp.level === l.value
                              ? 'bg-[#ff3b30]/15 border-[#ff3b30]/40 text-[#ff3b30]'
                              : 'border-[#262626] text-[#a3a3a3] hover:text-white'
                          }`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wide block mb-1">Vol. hebdo actuel (km ou h)</label>
                      <input
                        type="number"
                        value={sp.currentWeeklyVolume ?? ''}
                        onChange={e => updateSportField(sp.sport, 'currentWeeklyVolume', parseFloat(e.target.value))}
                        placeholder="ex: 40"
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#404040] focus:outline-none focus:border-[#ff3b30]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wide block mb-1">Vol. max historique</label>
                      <input
                        type="number"
                        value={sp.maxHistoricalVolume ?? ''}
                        onChange={e => updateSportField(sp.sport, 'maxHistoricalVolume', parseFloat(e.target.value))}
                        placeholder="ex: 70"
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#404040] focus:outline-none focus:border-[#ff3b30]"
                      />
                    </div>
                  </div>

                  <PRFields sport={sp.sport} prs={sp.prs} onChange={(key, val) => updatePR(sp.sport, key, val)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={save}
        className="px-5 py-2.5 bg-[#ff3b30] hover:bg-[#ff5a52] text-white font-semibold text-sm rounded-lg transition-colors"
      >
        Sauvegarder
      </button>
      {saved && <span className="text-green-400 text-sm ml-3">✓ Sauvegardé</span>}
    </div>
  )
}

function PRInput({ label, value, onChange, placeholder }: { label: string; value: string | number | undefined; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] text-[#a3a3a3] block mb-1">{label}</label>
      <input
        type="text"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-2.5 py-1.5 text-white text-xs font-data placeholder:text-[#404040] focus:outline-none focus:border-[#ff3b30]"
      />
    </div>
  )
}

function PRFields({ sport, prs, onChange }: { sport: Sport; prs: Record<string, string | number | undefined>; onChange: (k: string, v: string) => void }) {
  if (sport === 'running') return (
    <div className="grid grid-cols-2 gap-2">
      <PRInput label="5km" value={prs.run5k as string} onChange={v => onChange('run5k', v)} placeholder="ex: 22:30" />
      <PRInput label="10km" value={prs.run10k as string} onChange={v => onChange('run10k', v)} placeholder="ex: 47:00" />
      <PRInput label="Semi" value={prs.runHalf as string} onChange={v => onChange('runHalf', v)} placeholder="ex: 1:45:00" />
      <PRInput label="Marathon" value={prs.runMarathon as string} onChange={v => onChange('runMarathon', v)} placeholder="ex: 3:45:00" />
    </div>
  )
  if (sport === 'trail') return (
    <div className="grid grid-cols-2 gap-2">
      <PRInput label="10km trail" value={prs.trail10k as string} onChange={v => onChange('trail10k', v)} placeholder="ex: 58:00" />
      <PRInput label="30km trail" value={prs.trail30k as string} onChange={v => onChange('trail30k', v)} placeholder="ex: 3:20:00" />
      <PRInput label="50km trail" value={prs.trail50k as string} onChange={v => onChange('trail50k', v)} placeholder="ex: 6:30:00" />
      <PRInput label="100km trail" value={prs.trail100k as string} onChange={v => onChange('trail100k', v)} placeholder="ex: 15:00:00" />
    </div>
  )
  if (sport === 'cycling') return (
    <div className="grid grid-cols-2 gap-2">
      <PRInput label="FTP (W)" value={prs.cyclingFTP as string} onChange={v => onChange('cyclingFTP', v)} placeholder="ex: 250" />
      <PRInput label="20km CLM" value={prs.cycling20k as string} onChange={v => onChange('cycling20k', v)} placeholder="ex: 28:00" />
      <PRInput label="40km CLM" value={prs.cycling40k as string} onChange={v => onChange('cycling40k', v)} placeholder="ex: 58:00" />
      <PRInput label="100km" value={prs.cycling100k as string} onChange={v => onChange('cycling100k', v)} placeholder="ex: 2:45:00" />
    </div>
  )
  if (sport === 'swimming') return (
    <div className="grid grid-cols-2 gap-2">
      <PRInput label="CSS (/100m)" value={prs.swimCSS as string} onChange={v => onChange('swimCSS', v)} placeholder="ex: 1:45" />
      <PRInput label="400m" value={prs.swim400m as string} onChange={v => onChange('swim400m', v)} placeholder="ex: 5:30" />
      <PRInput label="1500m" value={prs.swim1500m as string} onChange={v => onChange('swim1500m', v)} placeholder="ex: 22:00" />
    </div>
  )
  if (sport === 'triathlon') return (
    <div className="grid grid-cols-2 gap-2">
      <PRInput label="Sprint" value={prs.triathlonS as string} onChange={v => onChange('triathlonS', v)} placeholder="ex: 1:05:00" />
      <PRInput label="Olympique" value={prs.triathlonM as string} onChange={v => onChange('triathlonM', v)} placeholder="ex: 2:10:00" />
      <PRInput label="Half IronMan" value={prs.triathlonL as string} onChange={v => onChange('triathlonL', v)} placeholder="ex: 4:45:00" />
      <PRInput label="IronMan" value={prs.triathlonIM as string} onChange={v => onChange('triathlonIM', v)} placeholder="ex: 10:30:00" />
    </div>
  )
  if (sport === 'hyrox') return (
    <div className="grid grid-cols-2 gap-2">
      <PRInput label="Hyrox solo" value={prs.hyroxTime as string} onChange={v => onChange('hyroxTime', v)} placeholder="ex: 1:05:00" />
    </div>
  )
  if (sport === 'strength' || sport === 'powerlifting') return (
    <div className="grid grid-cols-2 gap-2">
      <PRInput label="Squat 1RM (kg)" value={prs.squat1rm as string} onChange={v => onChange('squat1rm', v)} placeholder="ex: 120" />
      <PRInput label="Bench 1RM (kg)" value={prs.bench1rm as string} onChange={v => onChange('bench1rm', v)} placeholder="ex: 90" />
      <PRInput label="Deadlift 1RM (kg)" value={prs.deadlift1rm as string} onChange={v => onChange('deadlift1rm', v)} placeholder="ex: 150" />
    </div>
  )
  return null
}
