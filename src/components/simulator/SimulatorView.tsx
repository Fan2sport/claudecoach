'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { calculateRunningZones, calculateCyclingZones, calculateSwimmingZones, paceToSeconds, formatPace, SPORT_LABELS, SPORT_ICONS } from '@/lib/utils'
import type { Sport } from '@/types'

const AVAILABLE_SPORTS: Sport[] = ['running', 'trail', 'cycling', 'swimming', 'strength']

function SectionTitle({ title }: { title: string }) {
  return <h3 className="text-white font-semibold text-sm mb-3 border-b border-[#262626] pb-2">{title}</h3>
}

function ZoneRow({ zone, unit = '' }: { zone: { name: string; min: number; max: number; description: string; color: string }; unit?: string }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: `${zone.color}10`, border: `1px solid ${zone.color}25` }}>
      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: zone.color }} />
      <div className="flex-1 min-w-0">
        <div className="text-white text-xs font-medium">{zone.name}</div>
        <div className="text-[#a3a3a3] text-[10px]">{zone.description}</div>
      </div>
      <div className="font-data text-xs text-right flex-shrink-0" style={{ color: zone.color }}>
        {unit === 'pace'
          ? `${formatPace(zone.min)} – ${formatPace(zone.max)}`
          : unit === 'W'
          ? zone.max === 9999 ? `>${zone.min}W` : `${zone.min}–${zone.max}W`
          : `${formatPace(zone.min)} – ${formatPace(zone.max)}`
        }
      </div>
    </div>
  )
}

function RunningSimulator({ bestPace }: { bestPace: string }) {
  const zones = calculateRunningZones(bestPace)
  const paceSeconds = paceToSeconds(bestPace)

  const distances = [
    { name: '1km', time: paceSeconds },
    { name: '5km', time: paceSeconds * 1.02 * 5 },
    { name: '10km', time: paceSeconds * 1.06 * 10 },
    { name: 'Semi', time: paceSeconds * 1.12 * 21.1 },
    { name: 'Marathon', time: paceSeconds * 1.18 * 42.2 },
  ]

  function secondsToTime(s: number) {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.round(s % 60)
    if (h > 0) return `${h}h${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      <div>
        <SectionTitle title="Zones d'allure course" />
        <div className="space-y-1.5">
          {zones.map(z => <ZoneRow key={z.name} zone={z} unit="pace" />)}
        </div>
      </div>
      <div>
        <SectionTitle title="Temps estimés par distance (Riegel)" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {distances.map(d => (
            <div key={d.name} className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-2.5">
              <div className="text-[#a3a3a3] text-xs mb-1">{d.name}</div>
              <div className="font-data text-white font-medium">{secondsToTime(d.time)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CyclingSimulator({ ftp }: { ftp: number }) {
  const zones = calculateCyclingZones(ftp)

  const tests = [
    { name: '20km CLM', wkg: ftp / 70, time: (20 / (ftp / 200 * 40)) * 3600 },
    { name: '40km CLM', wkg: ftp / 70 * 0.95, time: (40 / (ftp / 200 * 38)) * 3600 },
  ]

  function secondsToTime(s: number) {
    const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = Math.round(s % 60)
    return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      <div>
        <SectionTitle title="Zones de puissance Coggan" />
        <div className="space-y-1.5">
          {zones.map(z => <ZoneRow key={z.name} zone={z} unit="W" />)}
        </div>
      </div>
      <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-3">
        <div className="text-[#a3a3a3] text-xs mb-2">Données FTP</div>
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-[10px] text-[#5a5a5a]">FTP</div><div className="font-data text-white font-medium">{ftp}W</div></div>
          <div><div className="text-[10px] text-[#5a5a5a]">W/kg (70kg)</div><div className="font-data text-white font-medium">{(ftp/70).toFixed(1)}</div></div>
          <div><div className="text-[10px] text-[#5a5a5a]">FTPHR ~</div><div className="font-data text-white font-medium">~85%FCmax</div></div>
        </div>
      </div>
    </div>
  )
}

function SwimmingSimulator({ css }: { css: string }) {
  const zones = calculateSwimmingZones(css)
  const cssSeconds = paceToSeconds(css)

  function formatSwimPace(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = Math.round(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}/100m`
  }

  const distances = [
    { name: '100m', time: cssSeconds },
    { name: '400m', time: cssSeconds * 4 * 1.04 },
    { name: '1500m', time: cssSeconds * 15 * 1.08 },
    { name: '3800m (IM)', time: cssSeconds * 38 * 1.12 },
  ]

  function secondsToTime(s: number) {
    const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = Math.round(s % 60)
    return h > 0 ? `${h}h${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}` : `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      <div>
        <SectionTitle title="Zones d'allure natation" />
        <div className="space-y-1.5">
          {zones.map(z => (
            <div key={z.name} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: `${z.color}10`, border: `1px solid ${z.color}25` }}>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: z.color }} />
              <div className="flex-1"><div className="text-white text-xs font-medium">{z.name}</div><div className="text-[#a3a3a3] text-[10px]">{z.description}</div></div>
              <div className="font-data text-xs text-right" style={{ color: z.color }}>
                {formatSwimPace(z.min)} – {formatSwimPace(z.max)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <SectionTitle title="Temps estimés" />
        <div className="grid grid-cols-2 gap-2">
          {distances.map(d => (
            <div key={d.name} className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-2.5">
              <div className="text-[#a3a3a3] text-xs mb-1">{d.name}</div>
              <div className="font-data text-white font-medium">{secondsToTime(d.time)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StrengthSimulator() {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')

  const oneRm = weight && reps ? Math.round(parseFloat(weight) * (1 + parseInt(reps) / 30)) : null

  const percentages = [100, 95, 90, 85, 80, 75, 70, 65, 60]
  const repRanges: Record<number, string> = {
    100: '1',
    95: '2-3',
    90: '3-4',
    85: '4-6',
    80: '6-8',
    75: '8-10',
    70: '10-12',
    65: '12-15',
    60: '15-20',
  }

  return (
    <div className="space-y-4">
      <div>
        <SectionTitle title="Calculateur 1RM (formule Epley)" />
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wide block mb-1">Charge soulevée (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="ex: 80"
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#404040] focus:outline-none focus:border-[#ff3b30]"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wide block mb-1">Nombre de répétitions</label>
            <input
              type="number"
              value={reps}
              onChange={e => setReps(e.target.value)}
              placeholder="ex: 5"
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#404040] focus:outline-none focus:border-[#ff3b30]"
            />
          </div>
        </div>
        {oneRm && (
          <div className="mb-4 p-3 bg-[#ff3b30]/10 border border-[#ff3b30]/30 rounded-xl text-center">
            <div className="text-[#a3a3a3] text-xs">1RM estimé</div>
            <div className="font-display text-4xl text-[#ff3b30]">{oneRm} kg</div>
          </div>
        )}
      </div>
      {oneRm && (
        <div>
          <SectionTitle title="Zones d'entraînement par % 1RM" />
          <div className="space-y-1.5">
            {percentages.map(pct => {
              const load = Math.round(oneRm * pct / 100)
              const colors = { 100: '#dc2626', 95: '#ef4444', 90: '#f97316', 85: '#f59e0b', 80: '#eab308', 75: '#84cc16', 70: '#22c55e', 65: '#14b8a6', 60: '#06b6d4' }
              const color = colors[pct as keyof typeof colors] ?? '#a3a3a3'
              return (
                <div key={pct} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: `${color}10`, border: `1px solid ${color}25` }}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <div className="flex-1 text-white text-xs font-medium">{pct}% 1RM — {repRanges[pct]} reps</div>
                  <div className="font-data text-xs" style={{ color }}>{load} kg</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function SimulatorView() {
  const { profile } = useAppStore()
  const [activeSport, setActiveSport] = useState<Sport>('running')
  const [customPace, setCustomPace] = useState('')
  const [customFTP, setCustomFTP] = useState('')
  const [customCSS, setCustomCSS] = useState('')

  const userSports = profile?.sports?.map(s => s.sport).filter(s => AVAILABLE_SPORTS.includes(s)) ?? []
  const displaySports = userSports.length > 0 ? userSports : AVAILABLE_SPORTS

  const best10k = profile?.sports?.find(s => s.sport === 'running')?.prs?.run10k as string | undefined
  const bestPace = customPace || (best10k ? (() => {
    const parts = best10k.split(':')
    if (parts.length < 2) return ''
    const totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1])
    const perKm = totalSeconds / 10
    return `${Math.floor(perKm / 60)}:${Math.round(perKm % 60).toString().padStart(2, '0')}`
  })() : '')

  const ftp = parseInt(customFTP) || profile?.ftp || 0
  const css: string = customCSS || profile?.css || ''

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-white">Simulateur</h1>
        <p className="text-[#a3a3a3] text-sm mt-1">Calculez vos zones d&apos;entraînement par sport</p>
      </div>

      {/* Sport tabs */}
      <div className="flex gap-2 flex-wrap">
        {AVAILABLE_SPORTS.map(sport => (
          <button
            key={sport}
            onClick={() => setActiveSport(sport)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
              activeSport === sport
                ? 'bg-[#ff3b30]/10 border-[#ff3b30]/40 text-[#ff3b30]'
                : 'border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#404040]'
            }`}
          >
            {SPORT_ICONS[sport]} {SPORT_LABELS[sport]}
          </button>
        ))}
      </div>

      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
        {/* Input fields per sport */}
        {activeSport === 'running' && (
          <div className="mb-5">
            <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wide block mb-1.5">
              Allure de référence (mm:ss/km) — utilisé pour calculer vos zones
            </label>
            <input
              value={customPace}
              onChange={e => setCustomPace(e.target.value)}
              placeholder={bestPace || 'ex: 5:00 (allure 10km)'}
              className="w-full sm:w-64 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm font-data placeholder:text-[#404040] focus:outline-none focus:border-[#ff3b30]"
            />
            {bestPace && !customPace && (
              <p className="text-[10px] text-[#5a5a5a] mt-1">Calculé depuis votre RP 10km</p>
            )}
          </div>
        )}

        {activeSport === 'cycling' && (
          <div className="mb-5">
            <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wide block mb-1.5">FTP (Watts)</label>
            <input
              value={customFTP}
              onChange={e => setCustomFTP(e.target.value)}
              placeholder={ftp ? `${ftp}W (depuis profil)` : 'ex: 250'}
              type="number"
              className="w-full sm:w-64 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm font-data placeholder:text-[#404040] focus:outline-none focus:border-[#ff3b30]"
            />
          </div>
        )}

        {activeSport === 'swimming' && (
          <div className="mb-5">
            <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wide block mb-1.5">CSS (mm:ss/100m)</label>
            <input
              value={customCSS}
              onChange={e => setCustomCSS(e.target.value)}
              placeholder={css ? css : 'ex: 1:45'}
              className="w-full sm:w-64 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm font-data placeholder:text-[#404040] focus:outline-none focus:border-[#ff3b30]"
            />
          </div>
        )}

        {/* Sport-specific simulator */}
        {activeSport === 'running' && (
          bestPace
            ? <RunningSimulator bestPace={bestPace} />
            : <p className="text-[#a3a3a3] text-sm">Entrez une allure de référence ou renseignez votre RP 10km dans votre profil.</p>
        )}
        {activeSport === 'trail' && (
          bestPace
            ? <RunningSimulator bestPace={bestPace} />
            : <p className="text-[#a3a3a3] text-sm">Entrez une allure de référence ou renseignez votre RP trail dans votre profil.</p>
        )}
        {activeSport === 'cycling' && (
          ftp > 0
            ? <CyclingSimulator ftp={ftp} />
            : <p className="text-[#a3a3a3] text-sm">Entrez votre FTP ou renseignez-le dans votre profil.</p>
        )}
        {activeSport === 'swimming' && (
          css
            ? <SwimmingSimulator css={css} />
            : <p className="text-[#a3a3a3] text-sm">Entrez votre CSS (allure critique de nage) ou renseignez-la dans votre profil.</p>
        )}
        {activeSport === 'strength' && <StrengthSimulator />}
      </div>
    </div>
  )
}
