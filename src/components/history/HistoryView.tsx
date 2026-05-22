'use client'

import { useState, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { SPORT_COLORS, SPORT_ICONS, SPORT_LABELS, formatDuration } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Sport } from '@/types'
import { SessionModal } from '@/components/calendar/SessionModal'
import type { TrainingSession } from '@/types'

const ALL_SPORTS: Sport[] = ['running', 'trail', 'cycling', 'swimming', 'triathlon', 'crossfit', 'hyrox', 'strength', 'powerlifting', 'calisthenics', 'team_sports', 'tennis', 'combat', 'ski', 'climbing', 'hiking', 'mobility']

export function HistoryView() {
  const { sessions } = useAppStore()
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

  function exportJSON() {
    const data = JSON.stringify(completedSessions, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `athletex-history-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
  }

  function exportCSV() {
    const headers = ['Date', 'Sport', 'Titre', 'Durée (min)', 'Distance (km)', 'FC moy', 'FC max', 'RPE', 'Notes']
    const rows = completedSessions.map(s => [
      s.date,
      SPORT_LABELS[s.sport],
      s.title,
      s.report?.duration ?? s.plannedDuration ?? '',
      s.report?.distance ?? '',
      s.report?.hrAvg ?? '',
      s.report?.hrMax ?? '',
      s.report?.rpe ?? '',
      s.report?.notes ?? '',
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `athletex-history-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Historique</h1>
          <p className="text-[#a3a3a3] text-sm mt-1">{completedSessions.length} séances effectuées</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="px-3 py-1.5 border border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#404040] text-xs rounded-lg transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={exportJSON}
            className="px-3 py-1.5 border border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#404040] text-xs rounded-lg transition-colors"
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Period filter */}
        <div className="flex gap-1">
          {(['all', '7d', '30d', '90d'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriodFilter(p)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                periodFilter === p
                  ? 'border-[#ff3b30]/40 bg-[#ff3b30]/10 text-[#ff3b30]'
                  : 'border-[#262626] text-[#a3a3a3] hover:text-white'
              }`}
            >
              {p === 'all' ? 'Tout' : p === '7d' ? '7 jours' : p === '30d' ? '30 jours' : '90 jours'}
            </button>
          ))}
        </div>

        {/* Sport filter */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setSportFilter('all')}
            className={`px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
              sportFilter === 'all'
                ? 'border-[#ff3b30]/40 bg-[#ff3b30]/10 text-[#ff3b30]'
                : 'border-[#262626] text-[#a3a3a3] hover:text-white'
            }`}
          >
            Tous les sports
          </button>
          {usedSports.map(sport => (
            <button
              key={sport}
              onClick={() => setSportFilter(sport)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                sportFilter === sport
                  ? 'border-[#ff3b30]/40 bg-[#ff3b30]/10 text-[#ff3b30]'
                  : 'border-[#262626] text-[#a3a3a3] hover:text-white'
              }`}
            >
              {SPORT_ICONS[sport]}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions list */}
      {completedSessions.length === 0 ? (
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">📭</div>
          <h3 className="text-white font-semibold mb-2">Aucune séance effectuée</h3>
          <p className="text-[#a3a3a3] text-sm">
            Marquez des séances comme effectuées dans le calendrier pour les voir apparaître ici.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {completedSessions.map(session => {
            const color = SPORT_COLORS[session.sport] ?? '#a3a3a3'
            return (
              <button
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className="w-full text-left bg-[#141414] border border-[#262626] hover:border-[#404040] rounded-xl p-4 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${color}18` }}>
                    {SPORT_ICONS[session.sport]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-white font-medium text-sm">{session.title}</span>
                      {session.importedFrom && session.importedFrom !== 'manual' && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          🔗 {session.importedFrom}
                        </span>
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
                        <span
                          className="font-data px-1.5 py-0.5 rounded-full text-[10px]"
                          style={{ backgroundColor: `${color}15`, color: color }}
                        >
                          RPE {session.report.rpe}/10
                        </span>
                      )}
                    </div>
                    {session.report?.notes && (
                      <p className="text-[#5a5a5a] text-xs mt-1 truncate">{session.report.notes}</p>
                    )}
                  </div>
                  <span className="text-green-500 text-sm flex-shrink-0">✓</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selectedSession && (
        <SessionModal
          session={selectedSession}
          open={true}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  )
}
