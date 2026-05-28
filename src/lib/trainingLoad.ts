import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { TrainingSession, SessionType } from '@/types'

function intensityFactor(rpe?: number, type?: SessionType): number {
  if (rpe) return rpe / 10
  switch (type) {
    case 'intervals': case 'vo2max': case 'race_sim': return 0.90
    case 'tempo': return 0.80
    case 'long_run': return 0.65
    case 'recovery': return 0.45
    default: return 0.65
  }
}

export function tss(durationMin: number, rpe?: number, type?: SessionType): number {
  if (!durationMin) return 0
  const h = durationMin / 60
  const if_ = intensityFactor(rpe, type)
  return Math.round(h * if_ * if_ * 100)
}

export interface PMCPoint {
  date: string
  label: string
  CTL: number
  ATL: number
  TSB: number
  TSS: number
}

export function calculatePMC(sessions: TrainingSession[], days = 90): PMCPoint[] {
  const decayCTL = Math.exp(-1 / 42)
  const decayATL = Math.exp(-1 / 7)
  const gainCTL = 1 - decayCTL
  const gainATL = 1 - decayATL
  let ctl = 0
  let atl = 0
  const result: PMCPoint[] = []

  for (let i = days; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayTSS = sessions
      .filter(s => s.date === dateStr && s.completed)
      .reduce((acc, s) => acc + tss(s.report?.duration ?? s.plannedDuration ?? 0, s.report?.rpe, s.type), 0)

    ctl = ctl * decayCTL + dayTSS * gainCTL
    atl = atl * decayATL + dayTSS * gainATL

    result.push({
      date: dateStr,
      label: format(d, 'd MMM', { locale: fr }),
      CTL: Math.round(ctl * 10) / 10,
      ATL: Math.round(atl * 10) / 10,
      TSB: Math.round((ctl - atl) * 10) / 10,
      TSS: dayTSS,
    })
  }

  return result
}
