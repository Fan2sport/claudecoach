'use client'

import { useState, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { SPORT_COLORS, SPORT_ICONS, SPORT_LABELS, formatDuration } from '@/lib/utils'
import { format, startOfWeek, addDays, subWeeks, getWeek, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Sport } from '@/types'
import { SessionModal } from '@/components/calendar/SessionModal'
import type { TrainingSession } from '@/types'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, BarChart, Bar, Legend,
} from 'recharts'
import { calculatePMC } from '@/lib/trainingLoad'

const ALL_SPORTS: Sport[] = ['running', 'trail', 'cycling', 'swimming', 'triathlon', 'crossfit', 'hyrox', 'strength', 'powerlifting', 'calisthenics', 'team_sports', 'tennis', 'combat', 'ski', 'climbing', 'hiking', 'mobility']

type View = 'list' | 'trends' | 'charge' | 'records'

export function HistoryView() {
  const { sessions } = useAppStore()
  const [view, setView] = useState<View>('list')
  const [sportFilter, setSportFilter] = useState<Sport | 'all'>('all')
  const [periodFilter, setPeriodFilter] = useState<'all' | '7d' | '30d' | '90d'>('all')
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null)

  const completedSessions = useMemo(() => {
    const now = new Date()
    let filtered = sessions.filter(s => s.completed)
    if (sportFilter !== 'all') filtered = filtered.filter(s => s.sport === sportFilter)
    if (periodFilter !== 'all') {
      const days = { '7d': 7, '30d': 30, '90d': 90 }[periodFilter]
      const cutoff = new Date(now.getTime() - days * 86400000)
      filtered = filtered.filter(s => new Date(s.date) >= cutoff)
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [sessions, sportFilter, periodFilter])

  const usedSports = useMemo(() => {
    const sports = new Set(sessions.filter(s => s.completed).map(s => s.sport))
    return ALL_SPORTS.filter(s => sports.has(s))
  }, [sessions])

  // Weekly volume trend (last 12 weeks)
  const weeklyTrend = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const weekStart = startOfWeek(subWeeks(now, 11 - i), { weekStartsOn: 1 })
      const weekEnd = addDays(weekStart, 6)
      const weekSessions = sessions.filter(s => {
        const d = new Date(s.date)
        return d >= weekStart && d <= weekEnd && s.completed
      })
      const totalMin = weekSessions.reduce((acc, s) => acc + (s.report?.duration ?? s.plannedDuration ?? 0), 0)
      return {
        label: `S${getWeek(weekStart, { weekStartsOn: 1 })}`,
        heures: Math.round(totalMin / 60 * 10) / 10,
        séances: weekSessions.length,
      }
    })
  }, [sessions])

  // Running pace progression
  const paceTrend = useMemo(() => {
    return sessions
      .filter(s => (s.sport === 'running' || s.sport === 'trail') && s.completed && s.report?.avgPace && s.report?.distance && s.report.distance >= 3)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-15)
      .map(s => {
        const pace = s.report!.avgPace!
        const [m, sec] = pace.split(':').map(Number)
        const totalSec = (m || 0) * 60 + (sec || 0)
        return {
          date: format(new Date(s.date), 'd MMM', { locale: fr }),
          allure_sec: totalSec,
          allure: pace,
        }
      })
  }, [sessions])

  // CTL/ATL/TSB (PMC)
  const pmcData = useMemo(() => calculatePMC(sessions, 90), [sessions])

  // Personal records from history
  const personalRecords = useMemo(() => {
    const records: { label: string; value: string; date: string; sport: string; icon: string }[] = []
    const running = sessions.filter(s => (s.sport === 'running' || s.sport === 'trail') && s.completed && s.report)
    const cycling = sessions.filter(s => s.sport === 'cycling' && s.completed && s.report)

    // Longest run
    const longestRun = running.reduce((best, s) => (!best || (s.report!.distance ?? 0) > (best.report!.distance ?? 0)) ? s : best, null as typeof running[0] | null)
    if (longestRun?.report?.distance) records.push({ label: 'Plus longue course', value: `${longestRun.report.distance} km`, date: longestRun.date, sport: longestRun.sport, icon: '📏' })

    // Fastest pace (on runs >= 5km)
    const fastestPaceRun = running.filter(s => (s.report?.distance ?? 0) >= 5 && s.report?.avgPace).reduce((best, s) => {
      if (!best) return s
      const [bm, bs] = (best.report!.avgPace!).split(':').map(Number)
      const [sm, ss] = (s.report!.avgPace!).split(':').map(Number)
      return (sm * 60 + ss) < (bm * 60 + bs) ? s : best
    }, null as typeof running[0] | null)
    if (fastestPaceRun?.report?.avgPace) records.push({ label: 'Meilleure allure', value: `${fastestPaceRun.report.avgPace}/km`, date: fastestPaceRun.date, sport: fastestPaceRun.sport, icon: '⚡' })

    // Longest ride
    const longestRide = cycling.reduce((best, s) => (!best || (s.report!.distance ?? 0) > (best.report!.distance ?? 0)) ? s : best, null as typeof cycling[0] | null)
    if (longestRide?.report?.distance) records.push({ label: 'Plus longue sortie vélo', value: `${longestRide.report.distance} km`, date: longestRide.date, sport: 'cycling', icon: '📏' })

    // Highest power (cycling)
    const bestPower = cycling.reduce((best, s) => (!best || (s.report!.avgPower ?? 0) > (best.report!.avgPower ?? 0)) ? s : best, null as typeof cycling[0] | null)
    if (bestPower?.report?.avgPower) records.push({ label: 'Puissance moyenne max', value: `${bestPower.report.avgPower} W`, date: bestPower.date, sport: 'cycling', icon: '⚡' })

    // Max HR overall
    const maxHRSession = sessions.filter(s => s.completed && s.report?.hrMax).reduce((best, s) => (!best || (s.report!.hrMax ?? 0) > (best.report!.hrMax ?? 0)) ? s : best, null as typeof sessions[0] | null)
    if (maxHRSession?.report?.hrMax) records.push({ label: 'FC max enregistrée', value: `${maxHRSession.report.hrMax} bpm`, date: maxHRSession.date, sport: maxHRSession.sport, icon: '❤️' })

    // Best RPE (highest = hardest session)
    const hardestSession = sessions.filter(s => s.completed && s.report?.rpe).sort((a, b) => (b.report!.rpe! - a.report!.rpe!)).at(0)
    if (hardestSession?.report?.rpe) records.push({ label: 'Séance la plus dure', value: `RPE ${hardestSession.report.rpe}/10`, date: hardestSession.date, sport: hardestSession.sport, icon: '🔥' })

    // Most sessions in a week
    const weekCounts: Record<string, number> = {}
    sessions.filter(s => s.completed).forEach(s => {
      const wk = `${new Date(s.date).getFullYear()}-W${getWeek(new Date(s.date), { weekStartsOn: 1 })}`
      weekCounts[wk] = (weekCounts[wk] ?? 0) + 1
    })
    const bestWeek = Object.entries(weekCounts).sort((a, b) => b[1] - a[1]).at(0)
    if (bestWeek) records.push({ label: 'Meilleure semaine', value: `${bestWeek[1]} séances`, date: bestWeek[0], sport: 'running', icon: '📅' })

    return records
  }, [sessions])

  // RPE by sport
  const rpeData = useMemo(() => {
    const sportRpe: Record<string, number[]> = {}
    sessions.filter(s => s.completed && s.report?.rpe).forEach(s => {
      if (!sportRpe[s.sport]) sportRpe[s.sport] = []
      sportRpe[s.sport].push(s.report!.rpe!)
    })
    return Object.entries(sportRpe).map(([sport, values]) => ({
      name: SPORT_LABELS[sport as Sport] ?? sport,
      rpe: Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10,
      color: SPORT_COLORS[sport as Sport] ?? '#a3a3a3',
    })).sort((a, b) => b.rpe - a.rpe)
  }, [sessions])

  function exportJSON() {
    const data = JSON.stringify(completedSessions, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `athletex-history-${format(new Date(), 'yyyy-MM-dd')}.json`; a.click()
  }

  function exportCSV() {
    const headers = ['Date', 'Sport', 'Titre', 'Durée (min)', 'Distance (km)', 'FC moy', 'FC max', 'RPE', 'Notes']
    const rows = completedSessions.map(s => [
      s.date, SPORT_LABELS[s.sport], s.title,
      s.report?.duration ?? s.plannedDuration ?? '',
      s.report?.distance ?? '', s.report?.hrAvg ?? '',
      s.report?.hrMax ?? '', s.report?.rpe ?? '', s.report?.notes ?? '',
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `athletex-history-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click()
  }

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Historique</h1>
          <p className="text-[#a3a3a3] text-sm mt-1">{sessions.filter(s => s.completed).length} séances effectuées</p>
        </div>
        <div className="flex gap-2">
          {/* View toggle */}
          <div className="flex gap-1 bg-[#141414] border border-[#262626] rounded-lg p-1">
            {([['list', 'Liste'], ['trends', 'Tendances'], ['charge', 'Charge'], ['records', 'Records']] as [View, string][]).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${view === v ? 'bg-[#ff3b30]/20 text-[#ff3b30]' : 'text-[#a3a3a3] hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {view === 'list' && (
            <>
              <button onClick={exportCSV} className="px-3 py-1.5 border border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#404040] text-xs rounded-lg transition-colors">
                Export CSV
              </button>
              <button onClick={exportJSON} className="px-3 py-1.5 border border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#404040] text-xs rounded-lg transition-colors">
                Export JSON
              </button>
            </>
          )}
        </div>
      </div>

      {view === 'list' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1">
              {(['all', '7d', '30d', '90d'] as const).map(p => (
                <button key={p} onClick={() => setPeriodFilter(p)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${periodFilter === p ? 'border-[#ff3b30]/40 bg-[#ff3b30]/10 text-[#ff3b30]' : 'border-[#262626] text-[#a3a3a3] hover:text-white'}`}>
                  {p === 'all' ? 'Tout' : p === '7d' ? '7 jours' : p === '30d' ? '30 jours' : '90 jours'}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setSportFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${sportFilter === 'all' ? 'border-[#ff3b30]/40 bg-[#ff3b30]/10 text-[#ff3b30]' : 'border-[#262626] text-[#a3a3a3] hover:text-white'}`}>
                Tous les sports
              </button>
              {usedSports.map(sport => (
                <button key={sport} onClick={() => setSportFilter(sport)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${sportFilter === sport ? 'border-[#ff3b30]/40 bg-[#ff3b30]/10 text-[#ff3b30]' : 'border-[#262626] text-[#a3a3a3] hover:text-white'}`}>
                  {SPORT_ICONS[sport]}
                </button>
              ))}
            </div>
          </div>

          {completedSessions.length === 0 ? (
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-8 text-center">
              <div className="text-4xl mb-3">📭</div>
              <h3 className="text-white font-semibold mb-2">Aucune séance effectuée</h3>
              <p className="text-[#a3a3a3] text-sm">Marquez des séances comme effectuées dans le calendrier.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedSessions.map(session => {
                const color = SPORT_COLORS[session.sport] ?? '#a3a3a3'
                return (
                  <button key={session.id} onClick={() => setSelectedSession(session)}
                    className="w-full text-left bg-[#141414] border border-[#262626] hover:border-[#404040] rounded-xl p-4 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${color}18` }}>
                        {SPORT_ICONS[session.sport]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-white font-medium text-sm">{session.title}</span>
                          {session.importedFrom && session.importedFrom !== 'manual' && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">🔗 {session.importedFrom}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-[#a3a3a3]">
                          <span className="font-data">{format(new Date(session.date), 'EEE d MMM yyyy', { locale: fr })}</span>
                          {session.report?.duration && <span className="font-data">{formatDuration(session.report.duration)}</span>}
                          {session.report?.distance && <span className="font-data">{session.report.distance}km</span>}
                          {session.report?.hrAvg && <span className="font-data">♥ {session.report.hrAvg}bpm</span>}
                          {session.report?.avgPace && <span className="font-data">⏱ {session.report.avgPace}</span>}
                          {session.report?.avgPower && <span className="font-data">⚡ {session.report.avgPower}W</span>}
                          {session.report?.rpe && (
                            <span className="font-data px-1.5 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: `${color}15`, color }}>
                              RPE {session.report.rpe}/10
                            </span>
                          )}
                        </div>
                        {session.report?.notes && <p className="text-[#5a5a5a] text-xs mt-1 truncate">{session.report.notes}</p>}
                      </div>
                      <span className="text-green-500 text-sm flex-shrink-0">✓</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {view === 'trends' && (
        <div className="space-y-5">
          {/* Weekly volume */}
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
            <h3 className="text-white font-medium text-sm mb-4">Volume hebdomadaire — 12 dernières semaines (heures)</h3>
            {weeklyTrend.some(d => d.heures > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={weeklyTrend}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff3b30" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ff3b30" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis dataKey="label" tick={{ fill: '#a3a3a3', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#a3a3a3', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#fff' }} />
                  <Area type="monotone" dataKey="heures" stroke="#ff3b30" fill="url(#volGrad)" strokeWidth={2} dot={{ r: 3, fill: '#ff3b30' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 flex items-center justify-center text-[#404040] text-sm">Pas encore de données</div>
            )}
          </div>

          {/* Running pace */}
          {paceTrend.length >= 3 && (
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
              <h3 className="text-white font-medium text-sm mb-1">Progression allure course (s/km — plus bas = plus rapide)</h3>
              <p className="text-[#5a5a5a] text-xs mb-4">Allure moyenne sur séances ≥ 3km</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={paceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis dataKey="date" tick={{ fill: '#a3a3a3', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#a3a3a3', fontSize: 10 }} axisLine={false} tickLine={false} reversed />
                  <Tooltip
                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                    formatter={(val) => {
                      const v = typeof val === 'number' ? val : 0
                      const m = Math.floor(v / 60); const s = v % 60
                      return [`${m}:${String(s).padStart(2, '0')}/km`, 'Allure']
                    }}
                  />
                  <Line type="monotone" dataKey="allure_sec" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* RPE by sport */}
          {rpeData.length > 0 && (
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
              <h3 className="text-white font-medium text-sm mb-4">RPE moyen par sport</h3>
              <ResponsiveContainer width="100%" height={Math.max(160, rpeData.length * 36)}>
                <BarChart data={rpeData} layout="vertical">
                  <XAxis type="number" domain={[0, 10]} tick={{ fill: '#a3a3a3', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="rpe" radius={[0, 4, 4, 0]} fill="#ff3b30" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weekly sessions count */}
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
            <h3 className="text-white font-medium text-sm mb-4">Nombre de séances par semaine</h3>
            {weeklyTrend.some(d => d.séances > 0) ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weeklyTrend} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis dataKey="label" tick={{ fill: '#a3a3a3', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#a3a3a3', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="séances" fill="#ff3b30" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-36 flex items-center justify-center text-[#404040] text-sm">Pas encore de données</div>
            )}
          </div>
        </div>
      )}

      {/* Charge d'entraînement CTL/ATL/TSB */}
      {view === 'charge' && (
        <div className="space-y-5">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
            <h3 className="text-white font-medium text-sm mb-1">Charge d&apos;entraînement — 90 jours</h3>
            <p className="text-[#5a5a5a] text-xs mb-4">CTL = forme (42j) · ATL = fatigue (7j) · TSB = fraîcheur = CTL − ATL</p>
            {pmcData.some(d => d.CTL > 0 || d.ATL > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={pmcData.filter((_, i) => i % 2 === 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis dataKey="label" tick={{ fill: '#a3a3a3', fontSize: 9 }} axisLine={false} tickLine={false} interval={6} />
                  <YAxis tick={{ fill: '#a3a3a3', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#a3a3a3' }} />
                  <Line type="monotone" dataKey="CTL" stroke="#3b82f6" strokeWidth={2} dot={false} name="Forme (CTL)" />
                  <Line type="monotone" dataKey="ATL" stroke="#ef4444" strokeWidth={2} dot={false} name="Fatigue (ATL)" />
                  <Line type="monotone" dataKey="TSB" stroke="#22c55e" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Fraîcheur (TSB)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 flex items-center justify-center text-[#404040] text-sm">
                Complétez des séances avec RPE pour voir la charge
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(() => {
              const latest = pmcData[pmcData.length - 1]
              return [
                { label: 'Forme (CTL)', value: latest.CTL, color: '#3b82f6', desc: 'Charge chronique 42j' },
                { label: 'Fatigue (ATL)', value: latest.ATL, color: '#ef4444', desc: 'Charge aiguë 7j' },
                { label: 'Fraîcheur (TSB)', value: latest.TSB, color: latest.TSB >= 0 ? '#22c55e' : '#f97316', desc: latest.TSB >= 5 ? 'Frais — bon moment pour performer' : latest.TSB >= -10 ? 'Chargé — entraîner normalement' : 'Très fatigué — récupérer' },
              ].map(card => (
                <div key={card.label} className="bg-[#141414] border border-[#262626] rounded-xl p-3">
                  <div className="text-[10px] text-[#a3a3a3] uppercase tracking-wide mb-1">{card.label}</div>
                  <div className="font-data text-2xl font-bold" style={{ color: card.color }}>{card.value}</div>
                  <div className="text-[10px] text-[#5a5a5a] mt-1 leading-snug">{card.desc}</div>
                </div>
              ))
            })()}
          </div>
        </div>
      )}

      {/* Records personnels */}
      {view === 'records' && (
        <div className="space-y-3">
          {personalRecords.length === 0 ? (
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-8 text-center">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="text-white font-semibold mb-2">Aucun record encore</h3>
              <p className="text-[#a3a3a3] text-sm">Complétez des séances et remplissez les compte-rendus pour voir vos records apparaître ici.</p>
            </div>
          ) : (
            personalRecords.map((rec, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-[#141414] border border-[#262626] rounded-xl">
                <span className="text-2xl flex-shrink-0">{rec.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[#a3a3a3] text-xs uppercase tracking-wide mb-0.5">{rec.label}</div>
                  <div className="text-white font-semibold font-data text-lg">{rec.value}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-[#5a5a5a] font-data">
                    {rec.date.includes('W')
                      ? rec.date
                      : format(parseISO(rec.date), 'd MMM yyyy', { locale: fr })
                    }
                  </div>
                  <div className="text-lg mt-0.5">{SPORT_ICONS[rec.sport as Sport] ?? ''}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedSession && (
        <SessionModal session={selectedSession} open={true} onClose={() => setSelectedSession(null)} />
      )}
    </div>
  )
}
