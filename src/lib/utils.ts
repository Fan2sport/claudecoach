import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Sport, TrainingZone } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const SPORT_COLORS: Record<Sport, string> = {
  running: '#ef4444',
  trail: '#f97316',
  cycling: '#3b82f6',
  swimming: '#06b6d4',
  triathlon: '#8b5cf6',
  crossfit: '#f59e0b',
  hyrox: '#ec4899',
  strength: '#f97316',
  powerlifting: '#84cc16',
  calisthenics: '#14b8a6',
  team_sports: '#22c55e',
  tennis: '#eab308',
  padel: '#a3e635',
  combat: '#dc2626',
  ski: '#93c5fd',
  climbing: '#a3a3a3',
  hiking: '#65a30d',
  mobility: '#c084fc',
  rest: '#6b7280',
}

export const SPORT_LABELS: Record<Sport, string> = {
  running: 'Course à pied',
  trail: 'Trail',
  cycling: 'Cyclisme',
  swimming: 'Natation',
  triathlon: 'Triathlon',
  crossfit: 'CrossFit',
  hyrox: 'Hyrox',
  strength: 'Musculation',
  powerlifting: 'Powerlifting',
  calisthenics: 'Callisthénie',
  team_sports: 'Sports collectifs',
  tennis: 'Tennis/Padel',
  padel: 'Padel',
  combat: 'Sports de combat',
  ski: 'Ski',
  climbing: 'Escalade',
  hiking: 'Randonnée',
  mobility: 'Mobilité/Yoga',
  rest: 'Repos',
}

export const SPORT_ICONS: Record<Sport, string> = {
  running: '🏃',
  trail: '🏔️',
  cycling: '🚴',
  swimming: '🏊',
  triathlon: '🥇',
  crossfit: '🏋️',
  hyrox: '⚡',
  strength: '💪',
  powerlifting: '🏋️',
  calisthenics: '🤸',
  team_sports: '⚽',
  tennis: '🎾',
  padel: '🏓',
  combat: '🥊',
  ski: '⛷️',
  climbing: '🧗',
  hiking: '🥾',
  mobility: '🧘',
  rest: '😴',
}

export function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60)
  const seconds = Math.round(secondsPerKm % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}/km`
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m}min`
}

export function paceToSeconds(pace: string): number {
  const parts = pace.replace('/km', '').split(':')
  if (parts.length !== 2) return 0
  return parseInt(parts[0]) * 60 + parseInt(parts[1])
}

export function calculateRunningZones(bestPace: string): TrainingZone[] {
  const paceSeconds = paceToSeconds(bestPace)
  if (!paceSeconds) return []

  return [
    { name: 'EF (Endurance Fondamentale)', min: paceSeconds * 1.25, max: paceSeconds * 1.35, description: 'Conversation possible', color: '#22c55e' },
    { name: 'Endurance', min: paceSeconds * 1.10, max: paceSeconds * 1.25, description: 'Effort modéré', color: '#84cc16' },
    { name: 'Marathon', min: paceSeconds * 1.00, max: paceSeconds * 1.10, description: 'Allure marathon', color: '#eab308' },
    { name: 'Seuil', min: paceSeconds * 0.90, max: paceSeconds * 1.00, description: 'Effort soutenu', color: '#f97316' },
    { name: 'VO2max', min: paceSeconds * 0.82, max: paceSeconds * 0.90, description: 'Effort difficile', color: '#ef4444' },
    { name: 'VMA', min: paceSeconds * 0.76, max: paceSeconds * 0.82, description: 'Sprint', color: '#dc2626' },
  ]
}

export function calculateCyclingZones(ftp: number): TrainingZone[] {
  return [
    { name: 'Z1 - Récupération', min: 0, max: Math.round(ftp * 0.55), description: '<55% FTP', color: '#22c55e' },
    { name: 'Z2 - Endurance', min: Math.round(ftp * 0.56), max: Math.round(ftp * 0.75), description: '56-75% FTP', color: '#84cc16' },
    { name: 'Z3 - Tempo', min: Math.round(ftp * 0.76), max: Math.round(ftp * 0.90), description: '76-90% FTP', color: '#eab308' },
    { name: 'Z4 - Seuil', min: Math.round(ftp * 0.91), max: Math.round(ftp * 1.05), description: '91-105% FTP', color: '#f97316' },
    { name: 'Z5 - VO2max', min: Math.round(ftp * 1.06), max: Math.round(ftp * 1.20), description: '106-120% FTP', color: '#ef4444' },
    { name: 'Z6 - Anaérobie', min: Math.round(ftp * 1.21), max: Math.round(ftp * 1.50), description: '121-150% FTP', color: '#dc2626' },
    { name: 'Z7 - Neuromusculaire', min: Math.round(ftp * 1.51), max: 9999, description: '>150% FTP', color: '#991b1b' },
  ]
}

export function calculateSwimmingZones(css: string): TrainingZone[] {
  const cssSeconds = paceToSeconds(css)
  if (!cssSeconds) return []
  return [
    { name: 'EN1 - Endurance', min: cssSeconds * 1.30, max: cssSeconds * 1.40, description: 'Récup / Aérobie extensif', color: '#22c55e' },
    { name: 'EN2 - Développement', min: cssSeconds * 1.10, max: cssSeconds * 1.30, description: 'Aérobie', color: '#84cc16' },
    { name: 'EN3 - Seuil', min: cssSeconds * 1.00, max: cssSeconds * 1.10, description: 'CSS ± 5s', color: '#eab308' },
    { name: 'VLA - Lactate', min: cssSeconds * 0.90, max: cssSeconds * 1.00, description: 'Supra-seuil', color: '#f97316' },
    { name: 'VO2 - Max', min: cssSeconds * 0.80, max: cssSeconds * 0.90, description: 'Effort max', color: '#ef4444' },
  ]
}

export function calculateConfidenceScore(params: {
  completedSessions: number
  plannedSessions: number
  actualVolume: number
  targetVolume: number
  qualitySessions: number
  plannedQuality: number
  daysRemaining: number
  totalDays: number
}) {
  const { completedSessions, plannedSessions, actualVolume, targetVolume, qualitySessions, plannedQuality, daysRemaining, totalDays } = params

  const regularity = plannedSessions > 0 ? Math.min(100, (completedSessions / plannedSessions) * 100) : 0
  const volume = targetVolume > 0 ? Math.min(100, (actualVolume / targetVolume) * 100) : 0
  const intensity = plannedQuality > 0 ? Math.min(100, (qualitySessions / plannedQuality) * 100) : 0
  const timeMargin = totalDays > 0 ? Math.max(0, (daysRemaining / totalDays) * 100) : 0

  const overall = regularity * 0.30 + volume * 0.25 + intensity * 0.25 + timeMargin * 0.20

  let status: 'excellent' | 'on_track' | 'possible' | 'ambitious' | 'risky'
  let message: string

  if (overall >= 75) {
    status = 'excellent'
    message = 'Excellent progression ! Continuez ainsi.'
  } else if (overall >= 60) {
    status = 'on_track'
    message = 'En bonne voie. Maintenez le cap.'
  } else if (overall >= 40) {
    status = 'possible'
    message = 'Atteignable avec de la régularité.'
  } else if (overall >= 20) {
    status = 'ambitious'
    message = 'Objectif ambitieux, rehaussez l\'intensité.'
  } else {
    status = 'risky'
    message = 'Révision de l\'objectif recommandée.'
  }

  return { overall: Math.round(overall), regularity: Math.round(regularity), volume: Math.round(volume), intensity: Math.round(intensity), timeMargin: Math.round(timeMargin), status, message }
}
