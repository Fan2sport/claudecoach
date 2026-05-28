import type { TrainingSession, SessionReport, Sport, SessionType } from '@/types'
import { v4 as uuidv4 } from 'uuid'

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function detectSport(avgSpeedKph: number, name: string): { sport: Sport; type: SessionType } {
  const n = name.toLowerCase()
  if (n.includes('vélo') || n.includes('bike') || n.includes('cycl') || n.includes('velo') || avgSpeedKph > 22)
    return { sport: 'cycling', type: 'easy_run' }
  if (n.includes('trail') || n.includes('rando'))
    return { sport: 'trail', type: 'easy_run' }
  if (n.includes('nata') || n.includes('swim'))
    return { sport: 'swimming', type: 'easy_run' }
  if (n.includes('ski') || n.includes('snow'))
    return { sport: 'ski', type: 'custom' }
  if (avgSpeedKph >= 4 && avgSpeedKph <= 22)
    return { sport: 'running', type: 'easy_run' }
  return { sport: 'hiking', type: 'custom' }
}

function sportTitle(sport: Sport, date: string): string {
  const labels: Partial<Record<Sport, string>> = {
    running: 'Course', cycling: 'Vélo', trail: 'Trail',
    swimming: 'Natation', hiking: 'Randonnée', ski: 'Ski',
  }
  return `${labels[sport] ?? 'Séance'} — ${date}`
}

export type ParseResult = { session: TrainingSession } | { error: string }

export function parseGPX(content: string, userId: string): ParseResult {
  try {
    const doc = new DOMParser().parseFromString(content, 'application/xml')
    if (doc.querySelector('parsererror')) return { error: 'Fichier GPX invalide' }

    const trkpts = Array.from(doc.querySelectorAll('trkpt'))
    if (trkpts.length < 2) return { error: 'Pas de points GPS dans ce fichier' }

    const name = doc.querySelector('trk > name, metadata > name')?.textContent?.trim() ?? ''

    const times = trkpts
      .map(p => p.querySelector('time')?.textContent)
      .filter(Boolean)
      .map(t => new Date(t!).getTime())

    const durationMin = times.length >= 2 ? (times[times.length - 1] - times[0]) / 60000 : 0

    let distance = 0
    let elevGain = 0
    let prevEle: number | null = null

    for (let i = 1; i < trkpts.length; i++) {
      const prev = trkpts[i - 1]
      const curr = trkpts[i]
      distance += haversineKm(
        parseFloat(prev.getAttribute('lat') ?? '0'),
        parseFloat(prev.getAttribute('lon') ?? '0'),
        parseFloat(curr.getAttribute('lat') ?? '0'),
        parseFloat(curr.getAttribute('lon') ?? '0'),
      )
      const ele = parseFloat(curr.querySelector('ele')?.textContent ?? 'NaN')
      if (!isNaN(ele)) {
        if (prevEle !== null && ele > prevEle) elevGain += ele - prevEle
        prevEle = ele
      }
    }

    const hrValues = trkpts.flatMap(p => {
      const hrEl = p.getElementsByTagNameNS('*', 'hr')[0]
      const v = hrEl ? parseInt(hrEl.textContent ?? '0') : 0
      return v > 30 && v < 250 ? [v] : []
    })
    const hrAvg = hrValues.length ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length) : undefined
    const hrMax = hrValues.length ? Math.max(...hrValues) : undefined

    const avgSpeedKph = durationMin > 0 ? distance / (durationMin / 60) : 0
    const { sport, type } = detectSport(avgSpeedKph, name)

    const avgPaceSec = distance > 0 && durationMin > 0 ? (durationMin * 60) / distance : 0
    const paceStr = avgPaceSec > 0
      ? `${Math.floor(avgPaceSec / 60)}:${String(Math.round(avgPaceSec % 60)).padStart(2, '0')}`
      : undefined

    const startDate = times[0] ? new Date(times[0]) : new Date()
    const dateStr = startDate.toISOString().split('T')[0]

    const report: SessionReport = {
      duration: Math.round(durationMin),
      distance: Math.round(distance * 100) / 100,
      hrAvg,
      hrMax,
      elevationGain: elevGain > 0 ? Math.round(elevGain) : undefined,
      avgPace: (sport === 'running' || sport === 'trail') ? paceStr : undefined,
      completedAt: startDate.toISOString(),
      source: 'manual',
    }

    return {
      session: {
        id: uuidv4(), userId, date: dateStr, sport, type,
        title: name || sportTitle(sport, dateStr),
        completed: true, report,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  } catch (e) {
    return { error: `Erreur GPX : ${e instanceof Error ? e.message : String(e)}` }
  }
}

export function parseTCX(content: string, userId: string): ParseResult {
  try {
    const doc = new DOMParser().parseFromString(content, 'application/xml')
    if (doc.querySelector('parsererror')) return { error: 'Fichier TCX invalide' }

    const activity = doc.querySelector('Activity')
    if (!activity) return { error: 'Aucune activité trouvée dans ce fichier' }

    const laps = Array.from(doc.querySelectorAll('Lap'))
    const totalSec = laps.reduce((acc, l) => acc + parseFloat(l.querySelector('TotalTimeSeconds')?.textContent ?? '0'), 0)
    const totalDistM = laps.reduce((acc, l) => acc + parseFloat(l.querySelector('DistanceMeters')?.textContent ?? '0'), 0)

    const hrValues = Array.from(doc.querySelectorAll('HeartRateBpm Value'))
      .map(v => parseInt(v.textContent ?? '0'))
      .filter(v => v > 30 && v < 250)
    const hrAvg = hrValues.length ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length) : undefined
    const hrMax = hrValues.length ? Math.max(...hrValues) : undefined

    const startStr = activity.querySelector('Id')?.textContent ?? laps[0]?.getAttribute('StartTime')
    const startDate = startStr ? new Date(startStr) : new Date()
    const dateStr = startDate.toISOString().split('T')[0]

    const durationMin = totalSec / 60
    const distKm = totalDistM / 1000
    const avgSpeedKph = durationMin > 0 ? distKm / (durationMin / 60) : 0
    const sportAttr = activity.getAttribute('Sport') ?? ''
    const { sport, type } = detectSport(avgSpeedKph, sportAttr)

    const avgPaceSec = distKm > 0 && durationMin > 0 ? (durationMin * 60) / distKm : 0
    const paceStr = avgPaceSec > 0
      ? `${Math.floor(avgPaceSec / 60)}:${String(Math.round(avgPaceSec % 60)).padStart(2, '0')}`
      : undefined

    const report: SessionReport = {
      duration: Math.round(durationMin),
      distance: Math.round(distKm * 100) / 100,
      hrAvg, hrMax,
      avgPace: (sport === 'running' || sport === 'trail') ? paceStr : undefined,
      completedAt: startDate.toISOString(),
      source: 'manual',
    }

    return {
      session: {
        id: uuidv4(), userId, date: dateStr, sport, type,
        title: sportTitle(sport, dateStr),
        completed: true, report,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  } catch (e) {
    return { error: `Erreur TCX : ${e instanceof Error ? e.message : String(e)}` }
  }
}
