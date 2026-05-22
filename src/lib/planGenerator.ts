import { addDays, differenceInDays, format, startOfWeek } from 'date-fns'
import type { UserProfile, TrainingSession, TrainingPlan, PlanPhase, TrainingPhase, Sport, SessionType } from '@/types'
import { v4 as uuidv4 } from 'uuid'

const SESSION_TEMPLATES: Record<string, { title: string; type: SessionType; sport: Sport; durationMin: number; description: string }[]> = {
  running: [
    { title: 'Footing EF', type: 'easy_run', sport: 'running', durationMin: 45, description: 'Course en endurance fondamentale, allure conversation' },
    { title: 'Sortie longue', type: 'long_run', sport: 'running', durationMin: 90, description: 'Sortie longue à allure EF/marathon' },
    { title: 'Intervalles VMA', type: 'intervals', sport: 'running', durationMin: 60, description: '10x400m à 100% VMA, récupération 1:30' },
    { title: 'Tempo / Seuil', type: 'tempo', sport: 'running', durationMin: 50, description: '3x10min à allure seuil, récup 3min' },
    { title: 'VO2max', type: 'vo2max', sport: 'running', durationMin: 55, description: '5x1000m à 95-100% VMA' },
    { title: 'Fractionné court', type: 'intervals', sport: 'running', durationMin: 45, description: '15x200m à 105% VMA' },
    { title: 'Récupération active', type: 'recovery', sport: 'running', durationMin: 30, description: 'Footing très léger, allure ultra-cool' },
  ],
  trail: [
    { title: 'Sortie trail EF', type: 'easy_run', sport: 'trail', durationMin: 60, description: 'Trail en endurance fondamentale avec dénivelé' },
    { title: 'Sortie longue trail', type: 'long_run', sport: 'trail', durationMin: 120, description: 'Grande sortie nature avec D+ important' },
    { title: 'Montées trail', type: 'intervals', sport: 'trail', durationMin: 60, description: 'Répétitions en montée, marche active en descente' },
    { title: 'Tempo trail', type: 'tempo', sport: 'trail', durationMin: 60, description: 'Sortie rythmée sur parcours vallonné' },
  ],
  cycling: [
    { title: 'Sortie endurance vélo', type: 'easy_run', sport: 'cycling', durationMin: 90, description: 'Z2, cadence 85-95 rpm' },
    { title: 'Tempo vélo', type: 'tempo', sport: 'cycling', durationMin: 60, description: 'Z3-Z4, 85-95% FTP soutenu' },
    { title: 'Intervalles FTP', type: 'intervals', sport: 'cycling', durationMin: 75, description: '4x10min à 100% FTP, récup 5min' },
    { title: 'Sortie longue vélo', type: 'long_run', sport: 'cycling', durationMin: 180, description: 'Longue sortie Z1-Z2 avec relances' },
    { title: 'VO2max vélo', type: 'vo2max', sport: 'cycling', durationMin: 60, description: '5x5min à 110-120% FTP' },
  ],
  swimming: [
    { title: 'Natation endurance', type: 'easy_run', sport: 'swimming', durationMin: 45, description: '2000m en EN1-EN2' },
    { title: 'Séance technique', type: 'recovery', sport: 'swimming', durationMin: 45, description: 'Exercices de nage, drill technique' },
    { title: 'Seuil natation', type: 'tempo', sport: 'swimming', durationMin: 50, description: '5x400m en EN3, récup 30s' },
    { title: 'Intervalles nage', type: 'intervals', sport: 'swimming', durationMin: 50, description: '10x100m à CSS -2s, récup 20s' },
  ],
  crossfit: [
    { title: 'WOD MetCon', type: 'crossfit', sport: 'crossfit', durationMin: 60, description: 'WOD AMRAP ou For Time haute intensité' },
    { title: 'Strength + WOD', type: 'crossfit', sport: 'crossfit', durationMin: 75, description: 'Force puis MetCon modéré' },
    { title: 'Gymnastic skills', type: 'crossfit', sport: 'crossfit', durationMin: 60, description: 'Travail gymnastics : muscle-ups, HSPU, etc.' },
  ],
  hyrox: [
    { title: 'Hyrox simulation', type: 'race_sim', sport: 'hyrox', durationMin: 90, description: 'Simulation des 8 stations Hyrox + course' },
    { title: 'Ski-erg + SkiRowing', type: 'hyrox', sport: 'hyrox', durationMin: 60, description: 'Travail stations spécifiques Hyrox' },
    { title: 'Hyrox endurance', type: 'easy_run', sport: 'hyrox', durationMin: 75, description: 'Course + stations à intensité modérée' },
  ],
  strength: [
    { title: 'Full body A', type: 'strength', sport: 'strength', durationMin: 60, description: 'Squat, Bench Press, Row — sets lourds' },
    { title: 'Full body B', type: 'strength', sport: 'strength', durationMin: 60, description: 'Deadlift, OHP, Pull-up — sets lourds' },
    { title: 'Hypertrophie', type: 'strength', sport: 'strength', durationMin: 75, description: 'Sets 8-12 reps, charge modérée' },
    { title: 'Force max', type: 'strength', sport: 'strength', durationMin: 60, description: 'Travail 1-5 reps, charges lourdes' },
  ],
  mobility: [
    { title: 'Mobilité générale', type: 'recovery', sport: 'mobility', durationMin: 30, description: 'Étirements, mobilité articulaire' },
    { title: 'Yoga flow', type: 'recovery', sport: 'mobility', durationMin: 45, description: 'Séance yoga récupération' },
  ],
}

function getPhases(startDate: Date, endDate: Date): PlanPhase[] {
  const totalDays = differenceInDays(endDate, startDate)
  const phases: PlanPhase[] = [
    {
      phase: 'reconstruction',
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(addDays(startDate, Math.floor(totalDays * 0.25)), 'yyyy-MM-dd'),
      weeklyVolumeTarget: 0,
      focus: 'Construction progressive du volume'
    },
    {
      phase: 'development',
      startDate: format(addDays(startDate, Math.floor(totalDays * 0.25) + 1), 'yyyy-MM-dd'),
      endDate: format(addDays(startDate, Math.floor(totalDays * 0.65)), 'yyyy-MM-dd'),
      weeklyVolumeTarget: 0,
      focus: 'Volume max + qualité'
    },
    {
      phase: 'maintenance',
      startDate: format(addDays(startDate, Math.floor(totalDays * 0.65) + 1), 'yyyy-MM-dd'),
      endDate: format(addDays(startDate, Math.floor(totalDays * 0.75)), 'yyyy-MM-dd'),
      weeklyVolumeTarget: 0,
      focus: 'Consolidation et décharge'
    },
    {
      phase: 'specific',
      startDate: format(addDays(startDate, Math.floor(totalDays * 0.75) + 1), 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      weeklyVolumeTarget: 0,
      focus: 'Race-pace, affûtage, simulation'
    },
  ]
  return phases
}

function getPhaseForDate(date: Date, phases: PlanPhase[]): PlanPhase {
  const dateStr = format(date, 'yyyy-MM-dd')
  return phases.find(p => dateStr >= p.startDate && dateStr <= p.endDate) ?? phases[0]
}

function getVolumeMultiplier(phase: TrainingPhase, weekIndex: number): number {
  const baseMultipliers: Record<TrainingPhase, number> = {
    reconstruction: 0.60,
    development: 1.0,
    maintenance: 0.70,
    specific: 0.85,
  }
  const isDeloadWeek = weekIndex % 4 === 3
  return baseMultipliers[phase] * (isDeloadWeek ? 0.70 : 1.0)
}

export function generatePlan(profile: UserProfile): TrainingPlan {
  const primaryObjective = profile.objectives.find(o => o.isPrimary) ?? profile.objectives[0]
  if (!primaryObjective) throw new Error('No primary objective')

  const startDate = new Date()
  const endDate = new Date(primaryObjective.targetDate)
  const phases = getPhases(startDate, endDate)

  const primarySports = profile.sports.map(s => s.sport)
  const sessions: TrainingSession[] = []

  let currentDate = new Date(startDate)
  let weekIndex = 0

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay()
    const dayAvailability = profile.availableDays.find(d => d.day === dayOfWeek)

    if (dayAvailability && dayAvailability.activities.length > 0) {
      const phase = getPhaseForDate(currentDate, phases)
      const volumeMultiplier = getVolumeMultiplier(phase.phase, weekIndex)

      // Check if off period
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      const isOffPeriod = profile.offPeriods.some(op => dateStr >= op.startDate && dateStr <= op.endDate)

      if (!isOffPeriod) {
        const sportsToday = dayAvailability.activities.filter(a => a !== 'rest' && primarySports.includes(a))
        // Fallback: if none of the configured activities match the profile sports, take the first non-rest one
        const effectiveSports = sportsToday.length > 0
          ? sportsToday
          : dayAvailability.activities.filter(a => a !== 'rest').slice(0, 1)

        for (const sport of effectiveSports) {
          const templates = SESSION_TEMPLATES[sport] ?? SESSION_TEMPLATES.running
          const template = templates[Math.floor(Math.random() * templates.length)]

          sessions.push({
            id: uuidv4(),
            userId: profile.id,
            date: dateStr,
            sport: template.sport,
            type: template.type,
            phase: phase.phase,
            title: template.title,
            description: template.description,
            plannedDuration: Math.round(template.durationMin * volumeMultiplier),
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        }
      } else {
        sessions.push({
          id: uuidv4(),
          userId: profile.id,
          date: dateStr,
          sport: 'rest',
          type: 'off',
          title: 'Repos (vacances)',
          description: 'Période d\'indisponibilité',
          plannedDuration: 0,
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
    }

    if (dayOfWeek === 0) weekIndex++
    currentDate = addDays(currentDate, 1)
  }

  return {
    id: uuidv4(),
    userId: profile.id,
    objectiveId: primaryObjective.id,
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
    phases,
    sessions,
    generatedAt: new Date().toISOString(),
  }
}
