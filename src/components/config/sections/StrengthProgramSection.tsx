'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import type { StrengthSplit, StrengthGoal } from '@/types'
import {
  SPLIT_LABELS, GOAL_LABELS, FOCUS_LABELS,
  getSessionFocus, generateStrengthWorkout, MUSCLE_GROUP_LABELS,
} from '@/lib/strengthPrograms'

const SPLITS: StrengthSplit[] = ['push_pull_legs', 'push_pull', 'upper_lower', 'full_body']
const GOALS: StrengthGoal[] = ['hypertrophy', 'strength', 'endurance', 'power']

const GOAL_DESCRIPTIONS: Record<StrengthGoal, string> = {
  hypertrophy: '4×8-12 reps, 90s repos — volume musculaire',
  strength: '5×3-5 reps, 3 min repos — force maximale',
  endurance: '3×15-20 reps, 45s repos — endurance musculaire',
  power: '5×3-5 reps, 3 min repos — vitesse et explosivité',
}

const SPLIT_DESCRIPTIONS: Record<StrengthSplit, string> = {
  push_pull_legs: 'Push / Pull / Legs — 3 séances par rotation',
  push_pull: 'Push / Pull — 2 séances par rotation',
  upper_lower: 'Haut du corps / Bas du corps — 2 séances',
  full_body: 'Full body — même programme chaque séance',
}

export function StrengthProgramSection() {
  const { profile, updateProfile } = useAppStore()
  const prog = profile?.strengthProgram
  const [split, setSplit] = useState<StrengthSplit>(prog?.split ?? 'push_pull_legs')
  const [goal, setGoal] = useState<StrengthGoal>(prog?.goal ?? 'hypertrophy')
  const [sessionsPerWeek, setSessionsPerWeek] = useState(prog?.sessionsPerWeek ?? 3)
  const [saved, setSaved] = useState(false)
  const [previewDay, setPreviewDay] = useState(0)

  function save() {
    updateProfile({ strengthProgram: { split, goal, sessionsPerWeek } })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  // Build rotation days for preview
  const cycleLen = split === 'push_pull_legs' ? 3 : split === 'full_body' ? 1 : 2
  const cycleDays = Array.from({ length: cycleLen }, (_, i) => i)

  const previewExercises = generateStrengthWorkout(split, goal, previewDay)
  const previewFocus = getSessionFocus(split, previewDay)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white font-semibold text-lg">Programme de musculation</h2>
        <p className="text-[#a3a3a3] text-sm mt-1">
          Configurez votre split et votre objectif. Les séances muscu de votre plan seront auto-générées avec les exercices correspondants.
        </p>
      </div>

      {/* Split */}
      <div>
        <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wider font-medium block mb-2">
          Type de split
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SPLITS.map(s => (
            <button
              key={s}
              onClick={() => { setSplit(s); setPreviewDay(0) }}
              className={`text-left p-3 rounded-xl border transition-colors ${
                split === s
                  ? 'border-[#ff3b30]/50 bg-[#ff3b30]/10'
                  : 'border-[#262626] hover:border-[#404040]'
              }`}
            >
              <div className={`text-sm font-semibold ${split === s ? 'text-[#ff3b30]' : 'text-white'}`}>
                {SPLIT_LABELS[s]}
              </div>
              <div className="text-[11px] text-[#a3a3a3] mt-0.5">{SPLIT_DESCRIPTIONS[s]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Goal */}
      <div>
        <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wider font-medium block mb-2">
          Objectif
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {GOALS.map(g => (
            <button
              key={g}
              onClick={() => setGoal(g)}
              className={`text-left p-3 rounded-xl border transition-colors ${
                goal === g
                  ? 'border-[#ff3b30]/50 bg-[#ff3b30]/10'
                  : 'border-[#262626] hover:border-[#404040]'
              }`}
            >
              <div className={`text-sm font-semibold ${goal === g ? 'text-[#ff3b30]' : 'text-white'}`}>
                {GOAL_LABELS[g]}
              </div>
              <div className="text-[11px] text-[#a3a3a3] mt-0.5">{GOAL_DESCRIPTIONS[g]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Sessions per week */}
      <div>
        <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wider font-medium block mb-2">
          Séances par semaine
        </label>
        <div className="flex gap-2">
          {[2, 3, 4, 5, 6].map(n => (
            <button
              key={n}
              onClick={() => setSessionsPerWeek(n)}
              className={`w-10 h-10 rounded-xl text-sm font-semibold border transition-colors ${
                sessionsPerWeek === n
                  ? 'border-[#ff3b30]/50 bg-[#ff3b30]/10 text-[#ff3b30]'
                  : 'border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#404040]'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Workout preview */}
      <div>
        <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wider font-medium block mb-2">
          Aperçu du programme
        </label>

        {cycleLen > 1 && (
          <div className="flex gap-1.5 mb-3">
            {cycleDays.map(i => {
              const focus = getSessionFocus(split, i)
              return (
                <button
                  key={i}
                  onClick={() => setPreviewDay(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    previewDay === i
                      ? 'border-[#ff3b30]/50 bg-[#ff3b30]/10 text-[#ff3b30]'
                      : 'border-[#262626] text-[#a3a3a3] hover:text-white'
                  }`}
                >
                  {FOCUS_LABELS[focus]}
                </button>
              )
            })}
          </div>
        )}

        <div className="border border-[#262626] rounded-xl overflow-hidden">
          <div className="bg-[#1c1c1c] px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-white">{FOCUS_LABELS[previewFocus]}</span>
            <span className="text-[10px] text-[#a3a3a3]">{GOAL_LABELS[goal]}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  <th className="text-left px-3 py-1.5 text-[#a3a3a3] font-medium">Exercice</th>
                  <th className="text-center px-2 py-1.5 text-[#a3a3a3] font-medium">Groupe</th>
                  <th className="text-center px-2 py-1.5 text-[#a3a3a3] font-medium">Séries</th>
                  <th className="text-center px-2 py-1.5 text-[#a3a3a3] font-medium">Reps</th>
                  <th className="text-center px-2 py-1.5 text-[#a3a3a3] font-medium">Repos</th>
                  <th className="text-center px-2 py-1.5 text-[#a3a3a3] font-medium">RPE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {previewExercises.map(ex => (
                  <tr key={ex.id} className="hover:bg-[#0a0a0a] transition-colors">
                    <td className="px-3 py-2 text-white font-medium">{ex.name}</td>
                    <td className="text-center px-2 py-2 text-[#a3a3a3]">
                      {ex.muscleGroup ? MUSCLE_GROUP_LABELS[ex.muscleGroup] : '—'}
                    </td>
                    <td className="text-center px-2 py-2 font-data text-white">{ex.sets}</td>
                    <td className="text-center px-2 py-2 font-data text-[#e5e5e5]">{ex.reps}</td>
                    <td className="text-center px-2 py-2 font-data text-[#a3a3a3]">
                      {ex.restSec != null ? `${ex.restSec}s` : '—'}
                    </td>
                    <td className="text-center px-2 py-2 font-data text-[#a3a3a3]">
                      {ex.rpe != null ? ex.rpe : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={save}
        className="w-full py-2.5 bg-[#ff3b30] hover:bg-[#ff5a52] text-white text-sm font-semibold rounded-xl transition-colors"
      >
        {saved ? 'Sauvegardé ✓' : 'Enregistrer le programme'}
      </button>
    </div>
  )
}
