'use client'

import { useState, useCallback } from 'react'
import { format, addWeeks, subWeeks, startOfWeek, addDays, isSameDay, isToday, isPast, getWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAppStore } from '@/lib/store'
import { SessionCard } from './SessionCard'
import { SessionModal } from './SessionModal'
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { DroppableDay } from './DroppableDay'
import type { TrainingSession } from '@/types'
import { generatePlan } from '@/lib/planGenerator'

const PHASE_LABELS = {
  reconstruction: { label: 'Reconstruction', color: '#22c55e' },
  development: { label: 'Développement', color: '#3b82f6' },
  maintenance: { label: 'Maintenance', color: '#f59e0b' },
  specific: { label: 'Spécifique', color: '#ef4444' },
}

export function CalendarView() {
  const { sessions, plan, profile, updateSession, setSessions, setPlan, currentWeekOffset, setWeekOffset } = useAppStore()
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const weekStart = startOfWeek(addWeeks(new Date(), currentWeekOffset), { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = days[6]
  const weekNumber = getWeek(weekStart, { weekStartsOn: 1 })

  const weekSessions = days.map(day =>
    sessions.filter(s => isSameDay(new Date(s.date), day))
  )

  const currentPhase = plan?.phases.find(p =>
    format(weekStart, 'yyyy-MM-dd') >= p.startDate && format(weekStart, 'yyyy-MM-dd') <= p.endDate
  ) ?? plan?.phases[0]

  const weekVolume = weekSessions.flat().reduce((acc, s) => acc + (s.report?.distance ?? s.plannedDuration ?? 0), 0)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const sessionId = active.id as string
    const newDate = over.id as string
    updateSession(sessionId, { date: newDate })
  }

  function openSession(session: TrainingSession) {
    setSelectedSession(session)
    setModalOpen(true)
  }

  function handleGeneratePlan() {
    if (!profile || !profile.objectives?.length) {
      alert('Configurez d\'abord votre profil et vos objectifs dans la section Configuration.')
      return
    }
    const newPlan = generatePlan(profile)
    setPlan(newPlan)
    setSessions(newPlan.sessions)
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-4 pb-20 md:pb-0">
        {/* Header week */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Calendrier</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="font-data text-xs text-[#a3a3a3]">S{weekNumber}</span>
              <span className="text-xs text-[#a3a3a3]">
                {format(weekStart, 'd MMM', { locale: fr })} — {format(weekEnd, 'd MMM yyyy', { locale: fr })}
              </span>
              {currentPhase && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    color: PHASE_LABELS[currentPhase.phase]?.color,
                    backgroundColor: `${PHASE_LABELS[currentPhase.phase]?.color}15`,
                    border: `1px solid ${PHASE_LABELS[currentPhase.phase]?.color}30`,
                  }}
                >
                  {PHASE_LABELS[currentPhase.phase]?.label} — {currentPhase.focus}
                </span>
              )}
              {weekVolume > 0 && (
                <span className="font-data text-xs text-[#a3a3a3]">
                  {weekVolume} {weekVolume < 300 ? 'min' : 'km'} cette semaine
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(currentWeekOffset - 1)}
              className="p-2 rounded-lg border border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#404040] transition-colors text-sm"
            >
              ←
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-1.5 rounded-lg border border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#404040] transition-colors text-xs"
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={() => setWeekOffset(currentWeekOffset + 1)}
              className="p-2 rounded-lg border border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#404040] transition-colors text-sm"
            >
              →
            </button>
            {profile?.objectives?.length ? (
              <button
                onClick={() => {
                  if (plan && sessions.length > 0 && !confirm('Regénérer efface le plan actuel et toutes les séances. Continuer ?')) return
                  handleGeneratePlan()
                }}
                className="ml-2 px-3 py-1.5 bg-[#ff3b30] hover:bg-[#ff5a52] text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {plan && sessions.length > 0 ? 'Regénérer le plan' : 'Générer le plan'}
              </button>
            ) : null}
          </div>
        </div>

        {/* No plan state */}
        {sessions.length === 0 && (
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">🏋️</div>
            <h3 className="text-white font-semibold mb-2">Aucun plan d&apos;entraînement</h3>
            <p className="text-[#a3a3a3] text-sm mb-4">
              Configurez votre profil, vos sports et vos objectifs pour générer automatiquement votre plan.
            </p>
            {!profile?.objectives?.length ? (
              <a
                href="/config"
                className="inline-block px-4 py-2 bg-[#ff3b30] hover:bg-[#ff5a52] text-white text-sm font-medium rounded-lg transition-colors"
              >
                Configurer mon profil
              </a>
            ) : (
              <button
                onClick={handleGeneratePlan}
                className="px-4 py-2 bg-[#ff3b30] hover:bg-[#ff5a52] text-white text-sm font-medium rounded-lg transition-colors"
              >
                Générer mon plan
              </button>
            )}
          </div>
        )}

        {/* Week grid */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
            {days.map((day, idx) => {
              const daySessions = weekSessions[idx]
              const dayStr = format(day, 'yyyy-MM-dd')
              const isCurrentDay = isToday(day)
              const isPastDay = isPast(day) && !isCurrentDay

              return (
                <DroppableDay key={dayStr} id={dayStr}>
                  <div
                    className={`rounded-xl border p-2 min-h-[120px] transition-colors ${
                      isCurrentDay
                        ? 'border-[#ff3b30]/40 bg-[#ff3b30]/5'
                        : 'border-[#262626] bg-[#141414]'
                    } ${isPastDay ? 'opacity-60' : ''}`}
                  >
                    {/* Day header */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className={`text-xs font-medium uppercase tracking-wide ${isCurrentDay ? 'text-[#ff3b30]' : 'text-[#a3a3a3]'}`}>
                          {format(day, 'EEE', { locale: fr })}
                        </div>
                        <div className={`text-sm font-bold ${isCurrentDay ? 'text-white' : 'text-[#e5e5e5]'}`}>
                          {format(day, 'd')}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newSession: TrainingSession = {
                            id: crypto.randomUUID(),
                            userId: profile?.id ?? '',
                            date: dayStr,
                            sport: 'running',
                            type: 'easy_run',
                            title: 'Nouvelle séance',
                            completed: false,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                          }
                          setSelectedSession(newSession)
                          setModalOpen(true)
                        }}
                        className="w-5 h-5 rounded-full border border-[#262626] text-[#404040] hover:text-white hover:border-[#ff3b30] text-xs flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>

                    {/* Sessions */}
                    <div className="space-y-1.5">
                      {daySessions.map(session => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          onClick={() => openSession(session)}
                        />
                      ))}
                    </div>
                  </div>
                </DroppableDay>
              )
            })}
          </div>
        )}
      </div>

      {selectedSession && (
        <SessionModal
          session={selectedSession}
          open={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedSession(null) }}
        />
      )}
    </DndContext>
  )
}
