'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { calculateConfidenceScore, SPORT_COLORS, SPORT_LABELS, SPORT_ICONS, formatDuration } from '@/lib/utils'
import { format, startOfWeek, addDays, subWeeks, getWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts'
import type { TrainingPhase } from '@/types'

const PHASE_LABELS: Record<TrainingPhase, { label: string; color: string }> = {
  reconstruction: { label: 'Reconstruction', color: '#22c55e' },
  development: { label: 'Développement', color: '#3b82f6' },
  maintenance: { label: 'Maintenance', color: '#f59e0b' },
  specific: { label: 'Spécifique', color: '#ef4444' },
}

const CONFIDENCE_COLORS = {
  excellent: '#22c55e',
  on_track: '#84cc16',
  possible: '#f59e0b',
  ambitious: '#f97316',
  risky: '#ef4444',
}

const CONFIDENCE_STATUS_LABELS = {
  excellent: 'Excellent',
  on_track: 'En bonne voie',
  possible: 'Atteignable avec effort',
  ambitious: 'Ambitieux',
  risky: 'Risqué',
}

export function OverviewView() {
  const { profile, sessions, plan } = useAppStore()

  const now = new Date()
  const primaryObjective = profile?.objectives?.find(o => o.isPrimary) ?? profile?.objectives?.[0]

  // Compute confidence inputs
  const pastSessions = sessions.filter(s => new Date(s.date) <= now)
  const completedSessions = pastSessions.filter(s => s.completed).length
  const plannedSessions = pastSessions.length
  const actualVolume = sessions.filter(s => s.completed).reduce((acc, s) => acc + (s.report?.distance ?? (s.plannedDuration ? s.plannedDuration / 60 : 0)), 0)
  const targetVolume = sessions.reduce((acc, s) => acc + (s.plannedDistance ?? (s.plannedDuration ? s.plannedDuration / 60 : 0)), 0)
  const qualitySessions = sessions.filter(s => s.completed && ['intervals', 'vo2max', 'tempo', 'race_sim'].includes(s.type)).length
  const plannedQuality = sessions.filter(s => ['intervals', 'vo2max', 'tempo', 'race_sim'].includes(s.type)).length
  const totalDays = plan ? Math.max(1, Math.round((new Date(plan.endDate).getTime() - new Date(plan.startDate).getTime()) / 86400000)) : 365
  const daysRemaining = primaryObjective ? Math.max(0, Math.round((new Date(primaryObjective.targetDate).getTime() - now.getTime()) / 86400000)) : 365

  const confidence = calculateConfidenceScore({ completedSessions, plannedSessions, actualVolume, targetVolume, qualitySessions, plannedQuality, daysRemaining, totalDays })
  const confidenceColor = CONFIDENCE_COLORS[confidence.status]

  // Weekly volume chart data (last 8 weeks)
  const weeklyData = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const weekStart = startOfWeek(subWeeks(now, 7 - i), { weekStartsOn: 1 })
      const weekEnd = addDays(weekStart, 6)
      const weekSessions = sessions.filter(s => {
        const d = new Date(s.date)
        return d >= weekStart && d <= weekEnd
      })
      const planned = weekSessions.reduce((acc, s) => acc + (s.plannedDuration ?? 0), 0)
      const actual = weekSessions.filter(s => s.completed).reduce((acc, s) => acc + (s.report?.duration ?? s.plannedDuration ?? 0), 0)
      return {
        label: `S${getWeek(weekStart, { weekStartsOn: 1 })}`,
        Prévu: Math.round(planned / 60 * 10) / 10,
        Réel: Math.round(actual / 60 * 10) / 10,
      }
    })
  }, [sessions])

  // Sport distribution
  const sportDistrib = useMemo(() => {
    const counts: Record<string, number> = {}
    sessions.filter(s => s.completed).forEach(s => {
      counts[s.sport] = (counts[s.sport] ?? 0) + 1
    })
    return Object.entries(counts).map(([sport, count]) => ({
      name: SPORT_LABELS[sport as keyof typeof SPORT_LABELS] ?? sport,
      value: count,
      color: SPORT_COLORS[sport as keyof typeof SPORT_COLORS] ?? '#a3a3a3',
    }))
  }, [sessions])

  // Streak
  const streak = useMemo(() => {
    let count = 0
    const today = format(now, 'yyyy-MM-dd')
    let checkDate = new Date(now)
    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd')
      const hasSess = sessions.some(s => s.date === dateStr && s.completed)
      if (!hasSess) break
      count++
      checkDate = addDays(checkDate, -1)
    }
    return count
  }, [sessions])

  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 })
  const thisWeekSessions = sessions.filter(s => new Date(s.date) >= thisWeekStart && new Date(s.date) <= addDays(thisWeekStart, 6))
  const thisWeekCompleted = thisWeekSessions.filter(s => s.completed).length

  const CRITERIA = [
    { label: 'Régularité', weight: 30, score: confidence.regularity, desc: `${completedSessions}/${plannedSessions} séances effectuées` },
    { label: 'Volume', weight: 25, score: confidence.volume, desc: `${Math.round(actualVolume * 10) / 10}/${Math.round(targetVolume * 10) / 10} h cumulées` },
    { label: 'Intensité', weight: 25, score: confidence.intensity, desc: `${qualitySessions}/${plannedQuality} séances qualité` },
    { label: 'Marge temps', weight: 20, score: confidence.timeMargin, desc: `${daysRemaining} jours restants` },
  ]

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-white">Vue d&apos;ensemble</h1>
        {primaryObjective && (
          <p className="text-[#a3a3a3] text-sm mt-1">
            Objectif : <span className="text-white">{primaryObjective.name}</span> — {format(new Date(primaryObjective.targetDate), 'd MMMM yyyy', { locale: fr })}
          </p>
        )}
      </div>

      {/* Confidence index */}
      <div className="bg-[#141414] border rounded-2xl p-5 space-y-5" style={{ borderColor: `${confidenceColor}30` }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[#a3a3a3] text-xs uppercase tracking-wide mb-1">Indice de confiance</div>
            <div className="flex items-center gap-3">
              <span className="font-display text-6xl" style={{ color: confidenceColor }}>{confidence.overall}%</span>
              <div>
                <div className="font-medium" style={{ color: confidenceColor }}>{CONFIDENCE_STATUS_LABELS[confidence.status]}</div>
                <div className="text-[#a3a3a3] text-sm">{confidence.message}</div>
              </div>
            </div>
          </div>
          {primaryObjective && (
            <div className="text-right">
              <div className="text-[#a3a3a3] text-xs">Échéance</div>
              <div className="font-data text-white font-medium">{daysRemaining}j restants</div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${confidence.overall}%`, backgroundColor: confidenceColor }}
          />
        </div>

        {/* Criteria cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CRITERIA.map(c => {
            const color = c.score >= 75 ? '#22c55e' : c.score >= 60 ? '#84cc16' : c.score >= 40 ? '#f59e0b' : '#ef4444'
            return (
              <div key={c.label} className="bg-[#0a0a0a] rounded-xl p-3 border border-[#262626]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#a3a3a3]">{c.label}</span>
                  <span className="text-xs text-[#5a5a5a]">{c.weight}%</span>
                </div>
                <div className="font-data text-lg font-medium" style={{ color }}>{c.score}%</div>
                <div className="text-[10px] text-[#5a5a5a] mt-0.5">{c.desc}</div>
                <div className="h-1 bg-[#1a1a1a] rounded-full mt-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${c.score}%`, backgroundColor: color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Cette semaine', value: `${thisWeekCompleted}/${thisWeekSessions.length}`, unit: 'séances', icon: '📅' },
          { label: 'Total séances', value: completedSessions, unit: 'effectuées', icon: '✅' },
          { label: 'Streak actuel', value: streak, unit: streak > 1 ? 'jours consécutifs' : 'jour', icon: '🔥' },
          { label: 'Volume cumulé', value: `${Math.round(actualVolume * 10) / 10}`, unit: 'heures', icon: '⏱️' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#141414] border border-[#262626] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span>{stat.icon}</span>
              <span className="text-[#a3a3a3] text-xs">{stat.label}</span>
            </div>
            <div className="font-data text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-[#5a5a5a] text-xs">{stat.unit}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekly volume */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
          <h3 className="text-white font-medium text-sm mb-4">Volume hebdomadaire (heures)</h3>
          {weeklyData.some(d => d.Prévu > 0 || d.Réel > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="label" tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="Prévu" fill="#262626" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Réel" fill="#ff3b30" radius={[3, 3, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#a3a3a3' }} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-[#404040] text-sm">
              Aucune donnée disponible
            </div>
          )}
        </div>

        {/* Sport distribution */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
          <h3 className="text-white font-medium text-sm mb-4">Répartition par sport</h3>
          {sportDistrib.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={180}>
                <PieChart>
                  <Pie
                    data={sportDistrib}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sportDistrib.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5 overflow-hidden">
                {sportDistrib.slice(0, 6).map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-xs text-[#a3a3a3] truncate">{d.name}</span>
                    <span className="text-xs font-data text-white ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-[#404040] text-sm">
              Complétez des séances pour voir la répartition
            </div>
          )}
        </div>
      </div>

      {/* Plan phases roadmap */}
      {plan && (
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
          <h3 className="text-white font-medium text-sm mb-4">Roadmap du plan</h3>
          <div className="space-y-2">
            {plan.phases.map(phase => {
              const phaseInfo = PHASE_LABELS[phase.phase]
              const start = new Date(phase.startDate)
              const end = new Date(phase.endDate)
              const total = plan.phases.reduce((acc, p) => acc + (new Date(p.endDate).getTime() - new Date(p.startDate).getTime()), 0)
              const phaseLength = end.getTime() - start.getTime()
              const widthPct = (phaseLength / total) * 100
              const isActive = now >= start && now <= end
              return (
                <div key={phase.phase} className="flex items-center gap-3">
                  <div className="w-28 flex-shrink-0 text-xs text-[#a3a3a3]">{phaseInfo.label}</div>
                  <div className="flex-1 h-6 bg-[#0a0a0a] rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all ${isActive ? 'ring-1 ring-offset-0' : ''}`}
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: `${phaseInfo.color}40`,
                        border: `1px solid ${phaseInfo.color}50`,
                        boxShadow: isActive ? `0 0 8px ${phaseInfo.color}60` : undefined,
                      }}
                    />
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-medium" style={{ color: phaseInfo.color }}>EN COURS</span>
                      </div>
                    )}
                  </div>
                  <div className="w-24 flex-shrink-0 text-xs text-[#5a5a5a] font-data text-right">
                    {format(start, 'dd/MM')} → {format(end, 'dd/MM')}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="text-xs text-[#a3a3a3] mt-3">
            Plan du {format(new Date(plan.startDate), 'd MMM yyyy', { locale: fr })} au {format(new Date(plan.endDate), 'd MMM yyyy', { locale: fr })}
          </div>
        </div>
      )}

      {/* Objectives progress */}
      {profile?.objectives && profile.objectives.length > 0 && (
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
          <h3 className="text-white font-medium text-sm mb-4">Progression des objectifs</h3>
          <div className="space-y-3">
            {profile.objectives.map(obj => {
              const startPlan = plan ? new Date(plan.startDate) : now
              const endDate = new Date(obj.targetDate)
              const totalMs = endDate.getTime() - startPlan.getTime()
              const doneMs = now.getTime() - startPlan.getTime()
              const timePct = Math.max(0, Math.min(100, (doneMs / totalMs) * 100))
              const dRemain = Math.max(0, Math.round((endDate.getTime() - now.getTime()) / 86400000))

              return (
                <div key={obj.id} className="p-3 bg-[#0a0a0a] rounded-xl border border-[#262626]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {obj.isPrimary && <span className="text-[#ff3b30] text-xs">⭐</span>}
                      <span className="text-white text-sm font-medium">{obj.name}</span>
                    </div>
                    <span className="font-data text-xs text-[#a3a3a3]">{dRemain}j</span>
                  </div>
                  <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#ff3b30] to-[#ff5a52] transition-all"
                      style={{ width: `${timePct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#5a5a5a] mt-1">
                    <span>Début</span>
                    <span className="text-[#a3a3a3]">{Math.round(timePct)}% du temps écoulé</span>
                    <span>{format(endDate, 'd MMM yyyy', { locale: fr })}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
