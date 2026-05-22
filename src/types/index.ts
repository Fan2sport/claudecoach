export type Sport =
  | 'running'
  | 'trail'
  | 'cycling'
  | 'swimming'
  | 'triathlon'
  | 'crossfit'
  | 'hyrox'
  | 'strength'
  | 'powerlifting'
  | 'calisthenics'
  | 'team_sports'
  | 'tennis'
  | 'padel'
  | 'combat'
  | 'ski'
  | 'climbing'
  | 'hiking'
  | 'mobility'
  | 'rest'

export type Level = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export type SessionType =
  | 'easy_run'
  | 'long_run'
  | 'tempo'
  | 'intervals'
  | 'vo2max'
  | 'recovery'
  | 'strength'
  | 'mobility'
  | 'cycling'
  | 'swimming'
  | 'crossfit'
  | 'hyrox'
  | 'race_sim'
  | 'off'
  | 'custom'

export type TrainingPhase = 'reconstruction' | 'development' | 'maintenance' | 'specific'

export type IntegrationSource =
  | 'manual'
  | 'strava'
  | 'garmin'
  | 'suunto'
  | 'coros'
  | 'polar'
  | 'wahoo'
  | 'apple_health'
  | 'google_fit'

export interface UserProfile {
  id: string
  email: string
  firstName: string
  age: number
  gender: 'male' | 'female' | 'other'
  height: number
  weight: number
  restHR: number
  maxHR: number
  ftp?: number
  css?: string
  injuries?: string
  sports: SportProfile[]
  objectives: Objective[]
  availableDays: DayAvailability[]
  equipment: string[]
  offPeriods: OffPeriod[]
  createdAt: string
  updatedAt: string
}

export interface SportProfile {
  sport: Sport
  level: Level
  currentWeeklyVolume?: number
  maxHistoricalVolume?: number
  prs: PersonalRecords
}

export interface PersonalRecords {
  [key: string]: string | number | undefined
  run5k?: string
  run10k?: string
  runHalf?: string
  runMarathon?: string
  trail10k?: string
  trail30k?: string
  trail50k?: string
  trail100k?: string
  cyclingFTP?: number
  cycling20k?: string
  cycling40k?: string
  cycling100k?: string
  swimCSS?: string
  swim400m?: string
  swim1500m?: string
  triathlonS?: string
  triathlonM?: string
  triathlonL?: string
  triathlonIM?: string
  squat1rm?: number
  bench1rm?: number
  deadlift1rm?: number
  hyroxTime?: string
}

export interface Objective {
  id: string
  sport: Sport
  name: string
  target: string
  targetDate: string
  isPrimary: boolean
}

export interface DayAvailability {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6
  activities: Sport[]
}

export interface OffPeriod {
  id: string
  startDate: string
  endDate: string
  reason?: string
}

export interface TrainingSession {
  id: string
  userId: string
  date: string
  sport: Sport
  type: SessionType
  phase?: TrainingPhase
  title: string
  description?: string
  plannedDuration?: number
  plannedDistance?: number
  targets?: SessionTargets
  completed: boolean
  importedFrom?: IntegrationSource
  report?: SessionReport
  coachNotes?: string[]
  createdAt: string
  updatedAt: string
}

export interface SessionTargets {
  hrZone?: number
  paceTarget?: string
  powerTarget?: number
  rpeTarget?: number
  sets?: number
  reps?: number
}

export interface SessionReport {
  // duration stored in minutes (supports decimals for second precision)
  duration?: number
  distance?: number
  avgPace?: string
  maxPace?: string
  hrAvg?: number
  hrMax?: number
  elevationGain?: number
  elevationLoss?: number
  cadence?: number
  avgSpeed?: number
  maxSpeed?: number
  avgPower?: number
  maxPower?: number
  ftpSession?: number
  swolfScore?: number
  lengths?: number
  strokeType?: string
  exercises?: ExerciseSet[]
  wodName?: string
  wodResults?: string
  rpe?: number
  notes?: string
  weather?: string
  completedAt?: string
  source?: IntegrationSource
  // Running structure
  warmupMin?: number
  warmupDist?: number
  cooldownMin?: number
  sessionStructure?: string
  intervalReps?: number
  intervalDurationMin?: number
  intervalRecoveryMin?: number
  intervalPace?: string
  // Hyrox
  hyroxWorkoutType?: string
  hyroxResult?: string
  detailedExercises?: DetailedExercise[]
}

export interface DetailedExercise {
  id: string
  name: string
  sets?: number
  reps?: number
  weightKg?: number
  durationMin?: number
  meters?: number
  kcal?: number
}

export interface ExerciseSet {
  name: string
  sets: number
  reps: number
  weight?: number
  duration?: number
}

export interface TrainingPlan {
  id: string
  userId: string
  objectiveId: string
  startDate: string
  endDate: string
  phases: PlanPhase[]
  sessions: TrainingSession[]
  generatedAt: string
}

export interface PlanPhase {
  phase: TrainingPhase
  startDate: string
  endDate: string
  weeklyVolumeTarget: number
  focus: string
}

export interface WeekStats {
  weekNumber: number
  startDate: string
  endDate: string
  phase: TrainingPhase
  phaseFocus: string
  plannedSessions: number
  completedSessions: number
  plannedVolume: number
  actualVolume: number
  targetVolume: number
}

export interface ConfidenceScore {
  overall: number
  regularity: number
  volume: number
  intensity: number
  timeMargin: number
  status: 'excellent' | 'on_track' | 'possible' | 'ambitious' | 'risky'
  message: string
}

export interface TrainingZone {
  name: string
  min: number
  max: number
  description: string
  color: string
}

export interface Integration {
  id: string
  userId: string
  source: IntegrationSource
  connected: boolean
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
  connectedAt?: string
}
