'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { SPORT_LABELS, SPORT_ICONS } from '@/lib/utils'
import type { Sport, DayAvailability } from '@/types'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const DAY_INDICES: (0 | 1 | 2 | 3 | 4 | 5 | 6)[] = [1, 2, 3, 4, 5, 6, 0]

const ACTIVITY_GROUPS = [
  {
    label: 'Endurance',
    activities: ['running', 'trail', 'cycling', 'swimming'] as Sport[],
  },
  {
    label: 'Force & Conditioning',
    activities: ['strength', 'crossfit', 'hyrox', 'powerlifting', 'calisthenics'] as Sport[],
  },
  {
    label: 'Sports collectifs & raquette',
    activities: ['team_sports', 'tennis', 'padel', 'combat'] as Sport[],
  },
  {
    label: 'Mobilité & Récupération',
    activities: ['mobility', 'hiking', 'climbing'] as Sport[],
  },
  {
    label: 'Hors activité',
    activities: ['rest'] as Sport[],
  },
]

export function AvailabilitySection() {
  const { profile, updateProfile } = useAppStore()
  const availableDays = profile?.availableDays ?? []
  const [saved, setSaved] = useState(false)

  function getDayData(dayIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6): DayAvailability {
    return availableDays.find(d => d.day === dayIndex) ?? { day: dayIndex, activities: [] }
  }

  function toggleActivity(dayIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6, activity: Sport) {
    const current = getDayData(dayIndex)
    const hasActivity = current.activities.includes(activity)
    const newActivities = hasActivity
      ? current.activities.filter(a => a !== activity)
      : [...current.activities, activity]

    const existing = availableDays.find(d => d.day === dayIndex)
    let next: DayAvailability[]
    if (existing) {
      next = availableDays.map(d => d.day === dayIndex ? { ...d, activities: newActivities } : d)
    } else {
      next = [...availableDays, { day: dayIndex, activities: newActivities }]
    }
    updateProfile({ availableDays: next })
  }

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white font-semibold text-lg mb-1">Disponibilités</h2>
        <p className="text-[#a3a3a3] text-sm">Pour chaque jour, cochez les activités possibles. Le plan respectera ces créneaux.</p>
      </div>

      <div className="space-y-4">
        {DAYS.map((dayName, i) => {
          const dayIndex = DAY_INDICES[i]
          const dayData = getDayData(dayIndex)

          return (
            <div key={dayName} className="border border-[#262626] rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-[#1a1a1a] flex items-center justify-between">
                <span className="text-white font-medium text-sm">{dayName}</span>
                <span className="text-[#a3a3a3] text-xs">
                  {dayData.activities.length > 0
                    ? dayData.activities.map(a => SPORT_ICONS[a]).join(' ')
                    : 'Pas disponible'}
                </span>
              </div>
              <div className="p-3 space-y-3">
                {ACTIVITY_GROUPS.map(group => (
                  <div key={group.label}>
                    <div className="text-[10px] text-[#5a5a5a] uppercase tracking-wide mb-1.5">{group.label}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {group.activities.map(activity => {
                        const selected = dayData.activities.includes(activity)
                        return (
                          <button
                            key={activity}
                            onClick={() => toggleActivity(dayIndex, activity)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                              selected
                                ? 'border-[#ff3b30]/40 bg-[#ff3b30]/10 text-[#ff3b30]'
                                : 'border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#404040]'
                            }`}
                          >
                            {SPORT_ICONS[activity]} {SPORT_LABELS[activity]}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          className="px-5 py-2.5 bg-[#ff3b30] hover:bg-[#ff5a52] text-white font-semibold text-sm rounded-lg transition-colors"
        >
          Sauvegarder
        </button>
        {saved && <span className="text-green-400 text-sm">✓ Sauvegardé</span>}
      </div>
    </div>
  )
}
