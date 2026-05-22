import { addDays, differenceInDays, format, startOfWeek } from 'date-fns'
import type { UserProfile, TrainingSession, TrainingPlan, PlanPhase, TrainingPhase, Sport, SessionType } from '@/types'
import { v4 as uuidv4 } from 'uuid'

type IntensityLabel = 'easy' | 'quality' | 'long' | 'recovery'

interface Tpl {
  title: string
  type: SessionType
  sport: Sport
  durationMin: number
  description: string
}

const TEMPLATES: Partial<Record<Sport, Record<IntensityLabel, Tpl[]>>> = {
  running: {
    easy: [
      { title: 'Footing EF', type: 'easy_run', sport: 'running', durationMin: 45, description: 'Course en endurance fondamentale, allure conversation' },
      { title: 'Footing récupération', type: 'recovery', sport: 'running', durationMin: 35, description: 'Footing léger pour récupérer les jambes' },
    ],
    quality: [
      { title: 'Intervalles VMA', type: 'intervals', sport: 'running', durationMin: 60, description: '10×400m à 100% VMA, récupération 1:30' },
      { title: 'Tempo / Seuil', type: 'tempo', sport: 'running', durationMin: 55, description: '3×10min à allure seuil, récup 3min' },
      { title: 'VO2max', type: 'vo2max', sport: 'running', durationMin: 55, description: '5×1000m à 95-100% VMA' },
      { title: 'Fractionné court', type: 'intervals', sport: 'running', durationMin: 50, description: '15×200m à 105% VMA, récup 45s' },
    ],
    long: [
      { title: 'Sortie longue', type: 'long_run', sport: 'running', durationMin: 90, description: 'Sortie longue à allure EF/marathon, conversation possible' },
    ],
    recovery: [
      { title: 'Récupération active', type: 'recovery', sport: 'running', durationMin: 30, description: 'Footing très léger, allure ultra-cool — récupération active' },
    ],
  },
  trail: {
    easy: [
      { title: 'Sortie trail EF', type: 'easy_run', sport: 'trail', durationMin: 60, description: 'Trail en endurance fondamentale avec dénivelé' },
    ],
    quality: [
      { title: 'Montées trail', type: 'intervals', sport: 'trail', durationMin: 60, description: 'Répétitions en montée, marche active en descente' },
      { title: 'Tempo trail', type: 'tempo', sport: 'trail', durationMin: 60, description: 'Sortie rythmée sur parcours vallonné' },
    ],
    long: [
      { title: 'Sortie longue trail', type: 'long_run', sport: 'trail', durationMin: 120, description: 'Grande sortie nature avec D+ important, ravitaillement' },
    ],
    recovery: [
      { title: 'Trail récupération', type: 'recovery', sport: 'trail', durationMin: 40, description: 'Très facile, flat, récupération active' },
    ],
  },
  cycling: {
    easy: [
      { title: 'Endurance vélo', type: 'easy_run', sport: 'cycling', durationMin: 90, description: 'Zone 2, cadence 85-95 rpm, conversation possible' },
    ],
    quality: [
      { title: 'Intervalles FTP', type: 'intervals', sport: 'cycling', durationMin: 75, description: '4×10min à 100% FTP, récup 5min' },
      { title: 'VO2max vélo', type: 'vo2max', sport: 'cycling', durationMin: 60, description: '5×5min à 110-120% FTP' },
      { title: 'Tempo vélo', type: 'tempo', sport: 'cycling', durationMin: 65, description: 'Zone 3-4, 85-95% FTP soutenu' },
    ],
    long: [
      { title: 'Sortie longue vélo', type: 'long_run', sport: 'cycling', durationMin: 180, description: 'Longue sortie Zone 1-2 avec quelques relances' },
    ],
    recovery: [
      { title: 'Récup vélo', type: 'recovery', sport: 'cycling', durationMin: 45, description: 'Zone 1, très facile, récupération active' },
    ],
  },
  swimming: {
    easy: [
      { title: 'Natation endurance', type: 'easy_run', sport: 'swimming', durationMin: 45, description: '2000m en EN1-EN2, allure confortable' },
    ],
    quality: [
      { title: 'Seuil natation', type: 'tempo', sport: 'swimming', durationMin: 50, description: '5×400m en EN3, récup 30s' },
      { title: 'Intervalles nage', type: 'intervals', sport: 'swimming', durationMin: 50, description: '10×100m à CSS -2s, récup 20s' },
    ],
    long: [
      { title: 'Natation longue', type: 'long_run', sport: 'swimming', durationMin: 70, description: '3000m en continu, allure EN2' },
    ],
    recovery: [
      { title: 'Technique nage', type: 'recovery', sport: 'swimming', durationMin: 40, description: 'Exercices de nage, drill technique, faible intensité' },
    ],
  },
  triathlon: {
    easy: [
      { title: 'Brique tri (vélo-run)', type: 'easy_run', sport: 'triathlon', durationMin: 90, description: 'Vélo Z2 + run 20min de transition' },
    ],
    quality: [
      { title: 'Brique qualité', type: 'intervals', sport: 'triathlon', durationMin: 90, description: 'Vélo tempo + run seuil' },
    ],
    long: [
      { title: 'Simulation triathlon', type: 'race_sim', sport: 'triathlon', durationMin: 150, description: 'Enchaînement natation + vélo + course à pied' },
    ],
    recovery: [
      { title: 'Récup natation', type: 'recovery', sport: 'triathlon', durationMin: 40, description: 'Natation technique légère' },
    ],
  },
  crossfit: {
    easy: [
      { title: 'Strength + WOD léger', type: 'crossfit', sport: 'crossfit', durationMin: 75, description: 'Force puis MetCon à intensité modérée' },
    ],
    quality: [
      { title: 'WOD MetCon', type: 'crossfit', sport: 'crossfit', durationMin: 60, description: 'WOD AMRAP ou For Time haute intensité' },
      { title: 'WOD Chipper', type: 'crossfit', sport: 'crossfit', durationMin: 75, description: 'Long WOD chipper — volume total élevé' },
    ],
    long: [
      { title: 'Hero WOD', type: 'crossfit', sport: 'crossfit', durationMin: 90, description: 'Hero WOD ou WOD longue durée' },
    ],
    recovery: [
      { title: 'Gymnastic skills', type: 'crossfit', sport: 'crossfit', durationMin: 60, description: 'Travail gymnastics : muscle-ups, HSPU — technique' },
    ],
  },
  hyrox: {
    easy: [
      { title: 'Hyrox endurance', type: 'easy_run', sport: 'hyrox', durationMin: 75, description: 'Course + stations à intensité modérée' },
    ],
    quality: [
      { title: 'Stations Hyrox', type: 'hyrox', sport: 'hyrox', durationMin: 60, description: 'Travail stations spécifiques : Ski-erg, Rowing, Sled...' },
    ],
    long: [
      { title: 'Simulation Hyrox', type: 'race_sim', sport: 'hyrox', durationMin: 90, description: 'Simulation complète : 8 stations Hyrox + course' },
    ],
    recovery: [
      { title: 'Cardio léger Hyrox', type: 'recovery', sport: 'hyrox', durationMin: 45, description: 'Cardio très léger + mobilité' },
    ],
  },
  strength: {
    easy: [
      { title: 'Full body A', type: 'strength', sport: 'strength', durationMin: 60, description: 'Squat, Bench Press, Row — sets modérés' },
    ],
    quality: [
      { title: 'Force max', type: 'strength', sport: 'strength', durationMin: 65, description: '1-5 reps, charges lourdes — développement force' },
      { title: 'Hypertrophie', type: 'strength', sport: 'strength', durationMin: 75, description: '8-12 reps, charge modérée — volume musculaire' },
    ],
    long: [
      { title: 'Full body B', type: 'strength', sport: 'strength', durationMin: 70, description: 'Deadlift, OHP, Pull-up — volume complet' },
    ],
    recovery: [
      { title: 'Mobilité & récup', type: 'recovery', sport: 'mobility', durationMin: 30, description: 'Étirements, foam roller, mobilité articulaire' },
    ],
  },
  powerlifting: {
    easy: [
      { title: 'Technique powerlifting', type: 'strength', sport: 'powerlifting', durationMin: 60, description: 'Travail technique sur les 3 mouvements' },
    ],
    quality: [
      { title: 'Intensité powerlifting', type: 'strength', sport: 'powerlifting', durationMin: 75, description: 'Squat, Bench, Deadlift à 80-90% 1RM' },
    ],
    long: [
      { title: 'Volume powerlifting', type: 'strength', sport: 'powerlifting', durationMin: 90, description: 'Session volume complète, 5×5 sur les 3 mouvements' },
    ],
    recovery: [
      { title: 'Accessoires', type: 'recovery', sport: 'powerlifting', durationMin: 45, description: 'Exercices accessoires et mobilité' },
    ],
  },
  calisthenics: {
    easy: [
      { title: 'Skills calisthenics', type: 'strength', sport: 'calisthenics', durationMin: 60, description: 'Travail technique : L-sit, handstand, muscle-up' },
    ],
    quality: [
      { title: 'Force callisthénie', type: 'strength', sport: 'calisthenics', durationMin: 60, description: 'Progressions de force : pseudo planche, front lever' },
    ],
    long: [
      { title: 'Volume callisthénie', type: 'strength', sport: 'calisthenics', durationMin: 75, description: 'Session complète : traction, dips, tractions lestées' },
    ],
    recovery: [
      { title: 'Mobilité articulaire', type: 'recovery', sport: 'calisthenics', durationMin: 30, description: 'Mobilité épaules, hanches, poignets' },
    ],
  },
  mobility: {
    easy: [
      { title: 'Mobilité générale', type: 'recovery', sport: 'mobility', durationMin: 30, description: 'Étirements, mobilité articulaire' },
    ],
    quality: [
      { title: 'Yoga flow', type: 'recovery', sport: 'mobility', durationMin: 45, description: 'Vinyasa flow, respiration, équilibre' },
    ],
    long: [
      { title: 'Yoga long', type: 'recovery', sport: 'mobility', durationMin: 60, description: 'Séance yoga complète — hatha ou yin' },
    ],
    recovery: [
      { title: 'Mobilité légère', type: 'recovery', sport: 'mobility', durationMin: 20, description: 'Quelques étirements doux' },
    ],
  },
}

function getFallback(sport: Sport, intensity: IntensityLabel): Tpl {
  const titles: Record<IntensityLabel, string> = { easy: 'Séance légère', quality: 'Séance qualité', long: 'Longue séance', recovery: 'Récupération' }
  const types: Record<IntensityLabel, SessionType> = { easy: 'easy_run', quality: 'intervals', long: 'long_run', recovery: 'recovery' }
  const durations: Record<IntensityLabel, number> = { easy: 45, quality: 60, long: 90, recovery: 30 }
  return { title: titles[intensity], type: types[intensity], sport, durationMin: durations[intensity], description: '' }
}

function pickTemplate(sport: Sport, intensity: IntensityLabel): Tpl {
  const list = TEMPLATES[sport]?.[intensity] ?? TEMPLATES[sport]?.easy
  if (!list || list.length === 0) return getFallback(sport, intensity)
  return list[Math.floor(Math.random() * list.length)]
}

function getPhases(startDate: Date, endDate: Date): PlanPhase[] {
  const totalDays = differenceInDays(endDate, startDate)
  return [
    {
      phase: 'reconstruction',
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(addDays(startDate, Math.floor(totalDays * 0.25)), 'yyyy-MM-dd'),
      weeklyVolumeTarget: 0,
      focus: 'Construction progressive du volume',
    },
    {
      phase: 'development',
      startDate: format(addDays(startDate, Math.floor(totalDays * 0.25) + 1), 'yyyy-MM-dd'),
      endDate: format(addDays(startDate, Math.floor(totalDays * 0.65)), 'yyyy-MM-dd'),
      weeklyVolumeTarget: 0,
      focus: 'Volume max + séances qualité',
    },
    {
      phase: 'maintenance',
      startDate: format(addDays(startDate, Math.floor(totalDays * 0.65) + 1), 'yyyy-MM-dd'),
      endDate: format(addDays(startDate, Math.floor(totalDays * 0.75)), 'yyyy-MM-dd'),
      weeklyVolumeTarget: 0,
      focus: 'Consolidation et décharge',
    },
    {
      phase: 'specific',
      startDate: format(addDays(startDate, Math.floor(totalDays * 0.75) + 1), 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      weeklyVolumeTarget: 0,
      focus: 'Race-pace, affûtage, simulation',
    },
  ]
}

function getPhaseForDate(date: Date, phases: PlanPhase[]): PlanPhase {
  const dateStr = format(date, 'yyyy-MM-dd')
  return phases.find(p => dateStr >= p.startDate && dateStr <= p.endDate) ?? phases[0]
}

function getVolumeMultiplier(phase: TrainingPhase, globalWeekIndex: number, weekIndexInPhase: number): number {
  const base: Record<TrainingPhase, number> = { reconstruction: 0.60, development: 0.85, maintenance: 0.70, specific: 0.80 }
  const isDeload = globalWeekIndex % 4 === 3
  if (isDeload) return base[phase] * 0.65
  const progression = Math.min(1.30, Math.pow(1.08, weekIndexInPhase))
  return base[phase] * progression
}

function assignIntensities(count: number, phase: TrainingPhase, isDeload: boolean): IntensityLabel[] {
  if (count === 0) return []
  if (isDeload) return Array(count).fill('recovery' as IntensityLabel)
  if (count === 1) return ['easy']
  if (count === 2) return phase === 'reconstruction' ? ['easy', 'easy'] : ['easy', 'long']
  if (count === 3) {
    if (phase === 'reconstruction') return ['easy', 'easy', 'long']
    if (phase === 'specific') return ['quality', 'easy', 'quality']
    return ['easy', 'quality', 'long']
  }
  if (count === 4) {
    if (phase === 'reconstruction') return ['easy', 'easy', 'easy', 'long']
    return ['recovery', 'quality', 'easy', 'long']
  }
  const result: IntensityLabel[] = ['recovery', 'quality', 'easy']
  for (let i = 3; i < count - 1; i++) result.push(i % 2 === 0 ? 'easy' : 'quality')
  result.push('long')
  return result
}

export function generatePlan(profile: UserProfile): TrainingPlan {
  const primaryObjective = profile.objectives.find(o => o.isPrimary) ?? profile.objectives[0]
  if (!primaryObjective) throw new Error('No primary objective')

  const startDate = new Date()
  const endDate = new Date(primaryObjective.targetDate)
  const phases = getPhases(startDate, endDate)
  const primarySportSet = new Set(profile.sports.map(s => s.sport))
  const sessions: TrainingSession[] = []

  let globalWeekIndex = 0
  const phaseWeekCount: Record<TrainingPhase, number> = { reconstruction: 0, development: 0, maintenance: 0, specific: 0 }

  let weekStart = startOfWeek(startDate, { weekStartsOn: 1 })

  while (weekStart <= endDate) {
    const phase = getPhaseForDate(weekStart, phases)
    const currentPhase = phase.phase
    const isDeload = globalWeekIndex % 4 === 3
    const volumeMultiplier = getVolumeMultiplier(currentPhase, globalWeekIndex, phaseWeekCount[currentPhase])

    type DayInfo = { date: Date; sports: Sport[]; isOff: boolean }
    const weekDays: DayInfo[] = []

    for (let d = 0; d < 7; d++) {
      const day = addDays(weekStart, d)
      if (day < startDate || day > endDate) {
        weekDays.push({ date: day, sports: [], isOff: false })
        continue
      }
      const dayOfWeek = day.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
      const dayAvailability = profile.availableDays.find(a => a.day === dayOfWeek)
      if (!dayAvailability || dayAvailability.activities.length === 0) {
        weekDays.push({ date: day, sports: [], isOff: false })
        continue
      }
      const dateStr = format(day, 'yyyy-MM-dd')
      const isOff = profile.offPeriods.some(op => dateStr >= op.startDate && dateStr <= op.endDate)
      if (isOff) {
        weekDays.push({ date: day, sports: [], isOff: true })
        continue
      }
      const available = dayAvailability.activities.filter(a => a !== 'rest')
      const matched = available.filter(a => primarySportSet.has(a as Sport)) as Sport[]
      const effectiveSports = matched.length > 0 ? matched : (available.slice(0, 1) as Sport[])
      weekDays.push({ date: day, sports: effectiveSports, isOff: false })
    }

    // Count sessions per sport this week for intensity pre-assignment
    const sportCount: Record<string, number> = {}
    weekDays.forEach(({ sports }) => sports.forEach(s => { sportCount[s] = (sportCount[s] ?? 0) + 1 }))

    const sportIntensities: Record<string, IntensityLabel[]> = {}
    const sportIdx: Record<string, number> = {}
    Object.entries(sportCount).forEach(([sport, count]) => {
      sportIntensities[sport] = assignIntensities(count, currentPhase, isDeload)
    })

    for (const { date, sports, isOff } of weekDays) {
      const dateStr = format(date, 'yyyy-MM-dd')
      if (isOff) {
        sessions.push({
          id: uuidv4(),
          userId: profile.id,
          date: dateStr,
          sport: 'rest',
          type: 'off',
          phase: currentPhase,
          title: 'Repos (vacances)',
          description: 'Période d\'indisponibilité',
          plannedDuration: 0,
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        continue
      }
      for (const sport of sports) {
        const idx = sportIdx[sport] ?? 0
        sportIdx[sport] = idx + 1
        const intensity = sportIntensities[sport]?.[idx] ?? 'easy'
        const tpl = pickTemplate(sport, intensity)
        sessions.push({
          id: uuidv4(),
          userId: profile.id,
          date: dateStr,
          sport: tpl.sport,
          type: tpl.type,
          phase: currentPhase,
          title: tpl.title,
          description: tpl.description,
          plannedDuration: Math.round(tpl.durationMin * volumeMultiplier),
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
    }

    phaseWeekCount[currentPhase]++
    globalWeekIndex++
    weekStart = addDays(weekStart, 7)
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
