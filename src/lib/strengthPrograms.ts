import { v4 as uuidv4 } from 'uuid'
import type { PlannedExercise, MuscleGroup, StrengthGoal, StrengthSplit } from '@/types'

// ── Exercise library ──────────────────────────────────────────────────────────

type ExTpl = { name: string; muscleGroup: MuscleGroup; priority: 1 | 2 | 3 }

const LIBRARY: Record<string, ExTpl[]> = {
  chest: [
    { name: 'Développé couché barre', muscleGroup: 'chest', priority: 1 },
    { name: 'Développé couché haltères', muscleGroup: 'chest', priority: 1 },
    { name: 'Développé incliné haltères', muscleGroup: 'chest', priority: 2 },
    { name: 'Écarté poulie haute', muscleGroup: 'chest', priority: 3 },
    { name: 'Pompes lestées', muscleGroup: 'chest', priority: 2 },
  ],
  back: [
    { name: 'Tractions (lestées)', muscleGroup: 'back', priority: 1 },
    { name: 'Rowing barre', muscleGroup: 'back', priority: 1 },
    { name: 'Tirage vertical poulie', muscleGroup: 'back', priority: 2 },
    { name: 'Rowing haltère unilatéral', muscleGroup: 'back', priority: 2 },
    { name: 'Tirage horizontal poulie', muscleGroup: 'back', priority: 3 },
  ],
  shoulders: [
    { name: 'Développé militaire barre', muscleGroup: 'shoulders', priority: 1 },
    { name: 'Développé militaire haltères', muscleGroup: 'shoulders', priority: 1 },
    { name: 'Élévations latérales', muscleGroup: 'shoulders', priority: 2 },
    { name: 'Oiseau / Face pull', muscleGroup: 'shoulders', priority: 3 },
  ],
  biceps: [
    { name: 'Curl barre EZ', muscleGroup: 'biceps', priority: 1 },
    { name: 'Curl haltères alterné', muscleGroup: 'biceps', priority: 1 },
    { name: 'Curl marteau', muscleGroup: 'biceps', priority: 2 },
    { name: 'Curl concentré', muscleGroup: 'biceps', priority: 3 },
  ],
  triceps: [
    { name: 'Pushdown poulie', muscleGroup: 'triceps', priority: 1 },
    { name: 'Extension overhead haltère', muscleGroup: 'triceps', priority: 1 },
    { name: 'Dips triceps', muscleGroup: 'triceps', priority: 2 },
    { name: 'Skullcrusher barre EZ', muscleGroup: 'triceps', priority: 2 },
  ],
  quads: [
    { name: 'Squat barre', muscleGroup: 'quads', priority: 1 },
    { name: 'Leg press', muscleGroup: 'quads', priority: 2 },
    { name: 'Fentes avant barre', muscleGroup: 'quads', priority: 2 },
    { name: 'Hack squat', muscleGroup: 'quads', priority: 2 },
    { name: 'Leg extension', muscleGroup: 'quads', priority: 3 },
  ],
  hamstrings: [
    { name: 'Romanian Deadlift', muscleGroup: 'hamstrings', priority: 1 },
    { name: 'Leg curl couché', muscleGroup: 'hamstrings', priority: 2 },
    { name: 'Good morning', muscleGroup: 'hamstrings', priority: 2 },
  ],
  glutes: [
    { name: 'Hip thrust barre', muscleGroup: 'glutes', priority: 1 },
    { name: 'Fentes arrière haltères', muscleGroup: 'glutes', priority: 2 },
    { name: 'Abducteurs poulie', muscleGroup: 'glutes', priority: 3 },
  ],
  calves: [
    { name: 'Mollets debout à la presse', muscleGroup: 'calves', priority: 1 },
    { name: 'Mollets assis', muscleGroup: 'calves', priority: 2 },
  ],
  core: [
    { name: 'Gainage planche', muscleGroup: 'core', priority: 1 },
    { name: 'Ab roller', muscleGroup: 'core', priority: 1 },
    { name: 'Crunch câble', muscleGroup: 'core', priority: 2 },
    { name: 'Russian twist leste', muscleGroup: 'core', priority: 3 },
  ],
}

// ── Goal parameters ───────────────────────────────────────────────────────────

type GoalParams = { sets: number; reps: string; isolationReps: string; restSec: number; rpe: number }

const GOAL_PARAMS: Record<StrengthGoal, GoalParams> = {
  strength:    { sets: 5, reps: '3-5',   isolationReps: '5-8',   restSec: 180, rpe: 9 },
  hypertrophy: { sets: 4, reps: '8-12',  isolationReps: '12-15', restSec: 90,  rpe: 8 },
  endurance:   { sets: 3, reps: '15-20', isolationReps: '15-20', restSec: 45,  rpe: 6 },
  power:       { sets: 5, reps: '3-5',   isolationReps: '6-8',   restSec: 180, rpe: 8 },
}

function makeExercise(tpl: ExTpl, goal: StrengthGoal): PlannedExercise {
  const p = GOAL_PARAMS[goal]
  const isIsolation = tpl.priority === 3
  const isCompound = tpl.priority === 1
  return {
    id: uuidv4(),
    name: tpl.name,
    muscleGroup: tpl.muscleGroup,
    sets: isIsolation ? Math.max(2, p.sets - 2) : isCompound ? p.sets : p.sets - 1,
    reps: isIsolation ? p.isolationReps : p.reps,
    rpe: isIsolation ? Math.max(5, p.rpe - 1) : p.rpe,
    restSec: isIsolation ? Math.max(45, p.restSec - 60) : p.restSec,
  }
}

function pick(group: string, count: number, goal: StrengthGoal): PlannedExercise[] {
  const list = LIBRARY[group] ?? []
  const filtered = goal === 'strength' ? list.filter(e => e.priority <= 2) : list
  return filtered.slice(0, count).map(e => makeExercise(e, goal))
}

// ── Focus assignment ──────────────────────────────────────────────────────────

export type SessionFocus = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full'

export const FOCUS_LABELS: Record<SessionFocus, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  upper: 'Haut du corps',
  lower: 'Bas du corps',
  full: 'Full body',
}

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Pectoraux', back: 'Dos', shoulders: 'Épaules', biceps: 'Biceps',
  triceps: 'Triceps', quads: 'Quadriceps', hamstrings: 'Ischio-jambiers',
  glutes: 'Fessiers', calves: 'Mollets', core: 'Abdominaux',
}

export function getSessionFocus(split: StrengthSplit, dayIndex: number): SessionFocus {
  const cycles: Record<StrengthSplit, SessionFocus[]> = {
    push_pull_legs: ['push', 'pull', 'legs'],
    push_pull:      ['push', 'pull'],
    upper_lower:    ['upper', 'lower'],
    full_body:      ['full'],
  }
  const cycle = cycles[split]
  return cycle[dayIndex % cycle.length]
}

// ── Workout generation ────────────────────────────────────────────────────────

export function generateStrengthWorkout(
  split: StrengthSplit,
  goal: StrengthGoal,
  dayIndex: number,
): PlannedExercise[] {
  const focus = getSessionFocus(split, dayIndex)

  switch (focus) {
    case 'push':
      return [...pick('chest', 2, goal), ...pick('shoulders', 2, goal), ...pick('triceps', 2, goal)]
    case 'pull':
      return [...pick('back', 3, goal), ...pick('biceps', 2, goal)]
    case 'legs':
      return [...pick('quads', 2, goal), ...pick('hamstrings', 1, goal), ...pick('glutes', 1, goal), ...pick('calves', 1, goal), ...pick('core', 1, goal)]
    case 'upper':
      return [...pick('chest', 1, goal), ...pick('back', 2, goal), ...pick('shoulders', 1, goal), ...pick('biceps', 1, goal), ...pick('triceps', 1, goal)]
    case 'lower':
      return [...pick('quads', 2, goal), ...pick('hamstrings', 1, goal), ...pick('glutes', 1, goal), ...pick('calves', 1, goal)]
    case 'full':
    default:
      return [...pick('chest', 1, goal), ...pick('back', 2, goal), ...pick('shoulders', 1, goal), ...pick('quads', 1, goal), ...pick('hamstrings', 1, goal), ...pick('triceps', 1, goal), ...pick('biceps', 1, goal)]
  }
}

export const GOAL_LABELS: Record<StrengthGoal, string> = {
  hypertrophy: 'Hypertrophie',
  strength: 'Force',
  endurance: 'Endurance musculaire',
  power: 'Puissance',
}

export const SPLIT_LABELS: Record<StrengthSplit, string> = {
  push_pull_legs: 'Push / Pull / Legs',
  push_pull: 'Push / Pull',
  upper_lower: 'Haut / Bas',
  full_body: 'Full body',
}
