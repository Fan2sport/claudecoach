'use client'

import { useState } from 'react'
import type { TrainingSession, SessionReport, Sport, DetailedExercise, SessionTemplate, PlannedExercise, PlannedWorkout, MuscleGroup } from '@/types'
import { useAppStore } from '@/lib/store'
import { SPORT_COLORS, SPORT_ICONS, SPORT_LABELS } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'

const SPORTS_LIST: Sport[] = ['running', 'trail', 'cycling', 'swimming', 'triathlon', 'crossfit', 'hyrox', 'strength', 'powerlifting', 'calisthenics', 'team_sports', 'tennis', 'combat', 'ski', 'climbing', 'hiking', 'mobility', 'rest']
const WEATHER_OPTIONS = ['Ensoleillé', 'Nuageux', 'Pluie', 'Vent fort', 'Chaud', 'Froid', 'Neige']
const STROKE_TYPES = ['Crawl', 'Dos', 'Brasse', 'Papillon', 'Mixte']
const HYROX_EXERCISES = ['SkiErg', 'Sled Push', 'Sled Pull', 'Burpee Broad Jump', 'Rowing', 'Farmers Carry', 'Sandbag Lunges', 'Wall Balls', 'Course 1km', 'Course 500m', 'Kettlebell Swing', 'Box Jump', 'Double Unders', 'Pull-ups', 'Thruster', 'Deadlift', 'Squat', 'Autre']

type Tab = 'details' | 'report' | 'coach'

// ─── Time helpers ───────────────────────────────────────────────────────────
function parseHMS(s: string): number {
  if (!s.trim()) return 0
  const parts = s.trim().split(':').map(x => parseFloat(x) || 0)
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60
  if (parts.length === 2) return parts[0] + parts[1] / 60
  return parts[0]
}

function fmtMin(min?: number): string {
  if (min == null || min === 0) return ''
  const totalSec = Math.round(min * 60)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── Pre-fill report from planned workout ────────────────────────────────────
function buildInitialReport(session: TrainingSession): Partial<SessionReport> {
  if (session.report) return session.report
  const pw = session.plannedWorkout
  if (!pw) return {}

  if (pw.runBlocks && pw.runBlocks.length > 0) {
    const warmup = pw.runBlocks.find(b => b.type === 'warmup')
    const cooldown = pw.runBlocks.find(b => b.type === 'cooldown')
    const intervals = pw.runBlocks.find(b => b.type === 'intervals')
    const tempo = pw.runBlocks.find(b => b.type === 'tempo')
    const prefill: Partial<SessionReport> = {}
    if (warmup?.durationMin) prefill.warmupMin = warmup.durationMin
    if (cooldown?.durationMin) prefill.cooldownMin = cooldown.durationMin
    if (intervals) {
      prefill.sessionStructure = 'intervals'
      if (intervals.reps) prefill.intervalReps = intervals.reps
      if (intervals.repDurationMin) prefill.intervalDurationMin = intervals.repDurationMin
      if (intervals.repPace) prefill.intervalPace = intervals.repPace
      if (intervals.recoveryMin) prefill.intervalRecoveryMin = intervals.recoveryMin
    } else if (tempo) {
      prefill.sessionStructure = 'tempo'
      if (tempo.durationMin) prefill.intervalDurationMin = tempo.durationMin
      if (tempo.pace) prefill.intervalPace = tempo.pace
    } else {
      prefill.sessionStructure = 'endurance'
    }
    if (session.plannedDuration) prefill.duration = session.plannedDuration
    return prefill
  }

  if (pw.exercises && pw.exercises.length > 0) {
    const detailedExercises: DetailedExercise[] = pw.exercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      sets: ex.sets,
      reps: parseInt(ex.reps.split('-')[0]) || undefined,
      weightKg: ex.weightKg,
    }))
    const base: Partial<SessionReport> = { detailedExercises }
    if (session.plannedDuration) base.duration = session.plannedDuration
    return base
  }

  return {}
}

// ─── Modal ───────────────────────────────────────────────────────────────────
export function SessionModal({ session, open, onClose }: { session: TrainingSession; open: boolean; onClose: () => void }) {
  const { updateSession, addSession, removeSession, addTemplate, profile, sessions } = useAppStore()
  const [tab, setTab] = useState<Tab>('details')
  const [editing, setEditing] = useState(!session.id || session.title === 'Nouvelle séance')
  const [alreadyAdded, setAlreadyAdded] = useState(false)
  const [title, setTitle] = useState(session.title)
  const [description, setDescription] = useState(session.description ?? '')
  const [sport, setSport] = useState<Sport>(session.sport)
  const [report, setReport] = useState<Partial<SessionReport>>(buildInitialReport(session))
  const [editedWorkout, setEditedWorkout] = useState<PlannedWorkout | undefined>(session.plannedWorkout)
  const [coachQuestion, setCoachQuestion] = useState('')
  const [saved, setSaved] = useState(false)
  const [prBanner, setPrBanner] = useState<string | null>(null)
  const [templateSaved, setTemplateSaved] = useState(false)

  if (!open) return null

  const color = SPORT_COLORS[sport] ?? '#a3a3a3'
  const isNew = !session.createdAt || session.title === 'Nouvelle séance'

  function detectPR(): string | null {
    if (!report.completedAt) return null
    if (!profile) return null
    const sportProfile = profile.sports.find(s => s.sport === sport)
    if (!sportProfile) return null
    const prs = sportProfile.prs

    if ((sport === 'running' || sport === 'trail') && report.avgPace && report.distance) {
      const dist = report.distance
      const paceStr = report.avgPace
      const [m, s] = paceStr.split(':').map(Number)
      const paceSec = (m || 0) * 60 + (s || 0)
      if (paceSec <= 0) return null

      const totalMin = Math.round(dist * paceSec / 60)
      const hh = Math.floor(totalMin / 60)
      const mm = totalMin % 60
      const timeStr = hh > 0 ? `${hh}h${String(mm).padStart(2, '0')}` : `${mm}min`

      if (dist >= 4.8 && dist <= 5.2 && !prs.run5k) return `Record sur 5km potentiel : ${timeStr} (${paceStr}/km)`
      if (dist >= 9.5 && dist <= 10.5 && !prs.run10k) return `Record sur 10km potentiel : ${timeStr} (${paceStr}/km)`
      if (dist >= 20.5 && dist <= 21.5 && !prs.runHalf) return `Record semi-marathon potentiel : ${timeStr} (${paceStr}/km)`
      if (dist >= 41.5 && dist <= 42.5 && !prs.runMarathon) return `Record marathon potentiel : ${timeStr} (${paceStr}/km)`

      const parseTime = (t?: string): number => {
        if (!t) return Infinity
        const p = t.replace('h', ':').split(':').map(Number)
        return p.length === 2 ? p[0] * 60 + p[1] : p[0]
      }
      if (dist >= 4.8 && dist <= 5.2 && totalMin < parseTime(prs.run5k)) return `Nouveau record 5km ! ${timeStr} 🏆`
      if (dist >= 9.5 && dist <= 10.5 && totalMin < parseTime(prs.run10k)) return `Nouveau record 10km ! ${timeStr} 🏆`
      if (dist >= 20.5 && dist <= 21.5 && totalMin < parseTime(prs.runHalf)) return `Nouveau record semi-marathon ! ${timeStr} 🏆`
      if (dist >= 41.5 && dist <= 42.5 && totalMin < parseTime(prs.runMarathon)) return `Nouveau record marathon ! ${timeStr} 🏆`
    }

    if (sport === 'cycling' && report.avgPower) {
      const currentFTP = prs.cyclingFTP ?? profile.ftp
      if (currentFTP && report.avgPower > currentFTP * 0.95) {
        return `Puissance élevée : ${report.avgPower}W — potentiellement proche de ton FTP ! 💪`
      }
    }

    return null
  }

  function saveSession() {
    const updated: TrainingSession = {
      ...session,
      title,
      description,
      sport,
      plannedWorkout: editedWorkout,
      completed: !!report.completedAt || session.completed,
      report: Object.keys(report).length > 0 ? report as SessionReport : undefined,
      updatedAt: new Date().toISOString(),
    }
    if (isNew && !alreadyAdded) {
      addSession(updated)
      setAlreadyAdded(true)
    } else {
      updateSession(session.id, updated)
    }
    const pr = detectPR()
    if (pr) setPrBanner(pr)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
    setEditing(false)
  }

  function saveAsTemplate() {
    const tpl: SessionTemplate = {
      id: uuidv4(),
      name: title,
      sport,
      type: session.type,
      duration: session.plannedDuration ?? 60,
      description,
      createdAt: new Date().toISOString(),
    }
    addTemplate(tpl)
    setTemplateSaved(true)
    setTimeout(() => setTemplateSaved(false), 2000)
  }

  function markComplete() {
    const updatedReport = { ...report, completedAt: new Date().toISOString() }
    setReport(updatedReport)
    updateSession(session.id, { completed: true, report: updatedReport as SessionReport, updatedAt: new Date().toISOString() })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  function deleteSession() {
    if (confirm('Supprimer cette séance ?')) {
      removeSession(session.id)
      onClose()
    }
  }

  function copyToClaudeAI() {
    const profile = useAppStore.getState().profile
    const text = `Profil athlète:
- Sport principal: ${SPORT_LABELS[sport]}
- Objectifs: ${profile?.objectives?.map(o => `${o.name} le ${o.targetDate}`).join(', ') ?? 'Non définis'}
- Niveau: ${profile?.sports?.find(s => s.sport === sport)?.level ?? 'Non précisé'}

Séance: ${title}
${description ? `Description: ${description}` : ''}
${report.duration ? `Durée: ${fmtMin(report.duration)}` : ''}
${report.distance ? `Distance: ${report.distance}km` : ''}
${report.hrAvg ? `FC moy: ${report.hrAvg}bpm` : ''}
${report.rpe ? `RPE: ${report.rpe}/10` : ''}
${report.notes ? `Notes: ${report.notes}` : ''}

Question: ${coachQuestion || 'Analyse cette séance et donne-moi des conseils pour optimiser ma progression.'}`

    navigator.clipboard.writeText(text).then(() => {
      window.open('https://claude.ai/new', '_blank')
    })
  }

  const SUGGESTED_QUESTIONS = [
    'Comment optimiser ma récupération après cette séance ?',
    'Est-ce que cette intensité est adaptée à mon niveau ?',
    'Comment améliorer ma technique ?',
    'Que faire si je ressens de la fatigue cette semaine ?',
    'Quels exercices complémentaires recommandes-tu ?',
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#262626]" style={{ borderTop: `3px solid ${color}` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{SPORT_ICONS[sport]}</span>
              {editing ? (
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="bg-[#0a0a0a] border border-[#404040] rounded px-2 py-1 text-white text-sm font-semibold focus:outline-none focus:border-[#ff3b30]"
                />
              ) : (
                <h2 className="text-white font-semibold">{title}</h2>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isNew && (
                <button onClick={deleteSession} className="text-[#a3a3a3] hover:text-red-400 text-xs transition-colors">
                  Supprimer
                </button>
              )}
              <button onClick={onClose} className="text-[#a3a3a3] hover:text-white transition-colors text-lg leading-none">×</button>
            </div>
          </div>

          {editing && (
            <div className="mb-2">
              <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wide block mb-1">Sport</label>
              <select
                value={sport}
                onChange={e => setSport(e.target.value as Sport)}
                className="bg-[#0a0a0a] border border-[#404040] rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-[#ff3b30] w-full"
              >
                {SPORTS_LIST.map(s => (
                  <option key={s} value={s}>{SPORT_ICONS[s]} {SPORT_LABELS[s]}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-1">
            {(['details', 'report', 'coach'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${tab === t ? 'text-white' : 'text-[#a3a3a3] hover:text-white'}`}
                style={tab === t ? { backgroundColor: `${color}20`, color } : {}}
              >
                {t === 'details' ? 'Détails' : t === 'report' ? 'Compte-rendu' : 'Coach IA'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'details' && (
            <div className="space-y-3">
              {editing ? (
                <div>
                  <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wide block mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-[#0a0a0a] border border-[#404040] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ff3b30] resize-none"
                    placeholder="Description de la séance..."
                  />
                </div>
              ) : (
                description && (
                  <div className="p-3 bg-[#0a0a0a] rounded-lg">
                    <p className="text-[#e5e5e5] text-sm leading-relaxed">{description}</p>
                  </div>
                )
              )}

              {session.plannedDuration && (
                <div className="flex gap-3">
                  <div className="flex-1 p-3 bg-[#0a0a0a] rounded-lg">
                    <div className="text-[10px] text-[#a3a3a3] uppercase tracking-wide mb-1">Durée prévue</div>
                    <div className="font-data text-white font-medium">{fmtMin(session.plannedDuration)}</div>
                  </div>
                  {session.plannedDistance && (
                    <div className="flex-1 p-3 bg-[#0a0a0a] rounded-lg">
                      <div className="text-[10px] text-[#a3a3a3] uppercase tracking-wide mb-1">Distance prévue</div>
                      <div className="font-data text-white font-medium">{session.plannedDistance} km</div>
                    </div>
                  )}
                </div>
              )}

              {session.phase && (
                <div className="p-3 bg-[#0a0a0a] rounded-lg">
                  <div className="text-[10px] text-[#a3a3a3] uppercase tracking-wide mb-1">Phase</div>
                  <div className="text-white text-sm capitalize">{session.phase}</div>
                </div>
              )}

              {editing && (sport === 'strength' || sport === 'powerlifting' || sport === 'calisthenics') && editedWorkout?.exercises?.length ? (
                <EditablePlannedExercises
                  exercises={editedWorkout.exercises}
                  onChange={exs => setEditedWorkout(prev => prev ? { ...prev, exercises: exs } : { exercises: exs })}
                />
              ) : (
                <PlannedWorkoutDisplay session={{ ...session, plannedWorkout: editedWorkout }} />
              )}

              <SimilarSessions current={session} sessions={sessions} />

              <div className="flex gap-2 pt-1">
                {!session.completed && !isNew && (
                  <button
                    onClick={markComplete}
                    className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                    style={{ backgroundColor: `${color}30`, border: `1px solid ${color}50` }}
                  >
                    ✓ Marquer comme effectuée
                  </button>
                )}
                <button
                  onClick={() => setEditing(!editing)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-[#a3a3a3] border border-[#262626] hover:text-white hover:border-[#404040] transition-colors"
                >
                  {editing ? 'Annuler' : 'Modifier'}
                </button>
              </div>
            </div>
          )}

          {tab === 'report' && (
            <ReportForm sport={sport} report={report} onChange={setReport} />
          )}

          {tab === 'coach' && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wide block mb-2">Questions suggérées</label>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_QUESTIONS.map(q => (
                    <button
                      key={q}
                      onClick={() => setCoachQuestion(q)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                        coachQuestion === q
                          ? 'border-[#ff3b30]/50 bg-[#ff3b30]/10 text-[#ff3b30]'
                          : 'border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#404040]'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wide block mb-1.5">Question personnalisée</label>
                <textarea
                  value={coachQuestion}
                  onChange={e => setCoachQuestion(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0a0a0a] border border-[#404040] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ff3b30] resize-none"
                  placeholder="Pose ta question au coach IA..."
                />
              </div>
              <button
                onClick={copyToClaudeAI}
                className="w-full py-2.5 bg-[#ff3b30] hover:bg-[#ff5a52] text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>💬</span>
                Copier et ouvrir Claude.ai
              </button>
              <p className="text-[#a3a3a3] text-xs text-center">
                Copie ton contexte dans le presse-papier puis ouvre Claude.ai pour la réponse IA.
              </p>
            </div>
          )}
        </div>

        {/* PR banner */}
        {prBanner && (
          <div className="mx-4 mb-0 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-2">
            <span className="text-lg flex-shrink-0">🏆</span>
            <div className="flex-1">
              <p className="text-yellow-400 text-xs font-medium">{prBanner}</p>
              <p className="text-[#a3a3a3] text-[10px] mt-0.5">Tu peux mettre à jour tes records dans Configuration → Sports</p>
            </div>
            <button onClick={() => setPrBanner(null)} className="text-[#5a5a5a] hover:text-white text-sm">×</button>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-[#262626] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {session.completed && <span className="flex items-center gap-1 text-xs text-green-400"><span>✓</span> Effectuée</span>}
            {saved && <span className="text-xs text-green-400">Sauvegardé ✓</span>}
            {templateSaved && <span className="text-xs text-blue-400">Modèle sauvegardé ✓</span>}
          </div>
          <div className="flex items-center gap-2">
            {!isNew && (
              <button
                onClick={saveAsTemplate}
                className="px-3 py-1.5 text-xs text-[#a3a3a3] border border-[#262626] hover:text-white hover:border-[#404040] rounded-lg transition-colors"
                title="Sauvegarder comme modèle réutilisable"
              >
                + Modèle
              </button>
            )}
            {(editing || isNew) && (
              <button onClick={saveSession} className="px-4 py-2 bg-[#ff3b30] hover:bg-[#ff5a52] text-white text-sm font-semibold rounded-lg transition-colors">
                {isNew && !alreadyAdded ? 'Créer la séance' : 'Sauvegarder'}
              </button>
            )}
            {!editing && tab === 'report' && (
              <button onClick={saveSession} className="px-4 py-2 bg-[#ff3b30] hover:bg-[#ff5a52] text-white text-sm font-semibold rounded-lg transition-colors">
                Sauvegarder
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Shared primitives ───────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wide block mb-1">{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }: { value: string | number | undefined; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-[#0a0a0a] border border-[#404040] rounded-lg px-3 py-2 text-white text-sm font-data focus:outline-none focus:border-[#ff3b30] placeholder:text-[#404040]"
    />
  )
}

function SmallInput({ value, onChange, placeholder, type = 'text' }: { value: string | number | undefined; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-[#0a0a0a] border border-[#404040] rounded px-2 py-1.5 text-white text-xs font-data focus:outline-none focus:border-[#ff3b30] placeholder:text-[#404040]"
    />
  )
}

function DurationInput({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  const totalSec = Math.round((value ?? 0) * 60)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const noValue = !value
  const upd = (nh: number, nm: number, ns: number) => onChange(nh * 60 + nm + ns / 60)
  const cls = 'w-full bg-[#0a0a0a] border border-[#404040] rounded-lg py-2 text-white text-sm font-data text-center focus:outline-none focus:border-[#ff3b30]'
  return (
    <div className="grid grid-cols-3 gap-2">
      <div>
        <input type="number" min={0} max={99} value={noValue ? '' : h} onChange={e => upd(parseInt(e.target.value) || 0, m, s)} placeholder="0" className={cls} />
        <p className="text-[10px] text-[#5a5a5a] text-center mt-0.5">heures</p>
      </div>
      <div>
        <input type="number" min={0} max={59} value={noValue ? '' : m} onChange={e => upd(h, Math.min(59, parseInt(e.target.value) || 0), s)} placeholder="00" className={cls} />
        <p className="text-[10px] text-[#5a5a5a] text-center mt-0.5">min</p>
      </div>
      <div>
        <input type="number" min={0} max={59} value={noValue ? '' : s} onChange={e => upd(h, m, Math.min(59, parseInt(e.target.value) || 0))} placeholder="00" className={cls} />
        <p className="text-[10px] text-[#5a5a5a] text-center mt-0.5">sec</p>
      </div>
    </div>
  )
}

function SectionBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#262626] rounded-lg overflow-hidden">
      <div className="bg-[#1c1c1c] px-3 py-1.5">
        <span className="text-[10px] text-[#a3a3a3] uppercase tracking-wider font-medium">{title}</span>
      </div>
      <div className="p-3 space-y-2">{children}</div>
    </div>
  )
}

function RpeSlider({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  const v = value ?? 5
  return (
    <Field label="RPE (1-10)">
      <input type="range" min={1} max={10} value={v} onChange={e => onChange(parseInt(e.target.value))} className="w-full accent-[#ff3b30]" />
      <div className="flex justify-between text-[10px] text-[#a3a3a3] mt-0.5">
        <span>Très facile</span>
        <span className="font-data font-medium text-white">{v}/10</span>
        <span>Max</span>
      </div>
    </Field>
  )
}

function WeatherPicker({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return (
    <Field label="Météo (optionnel)">
      <div className="flex flex-wrap gap-1.5">
        {WEATHER_OPTIONS.map(w => (
          <button
            key={w}
            onClick={() => onChange(w)}
            className={`text-xs px-2 py-1 rounded-lg border transition-colors ${value === w ? 'border-[#ff3b30]/50 bg-[#ff3b30]/10 text-[#ff3b30]' : 'border-[#262626] text-[#a3a3a3] hover:text-white'}`}
          >
            {w}
          </button>
        ))}
      </div>
    </Field>
  )
}

function NotesField({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return (
    <Field label="Notes / Ressenti">
      <textarea
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        rows={3}
        placeholder="Comment tu t'es senti ? Points à améliorer ?"
        className="w-full bg-[#0a0a0a] border border-[#404040] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ff3b30] resize-none placeholder:text-[#404040]"
      />
    </Field>
  )
}

function CompletedCheckbox({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="completed"
        checked={!!value}
        onChange={e => onChange(e.target.checked ? new Date().toISOString() : '')}
        className="accent-[#ff3b30]"
      />
      <label htmlFor="completed" className="text-sm text-[#e5e5e5] cursor-pointer">Marquer comme effectuée</label>
    </div>
  )
}

// ─── Exercise row (Hyrox) ────────────────────────────────────────────────────
function ExerciseRow({ exercise, onChange, onRemove }: {
  exercise: DetailedExercise
  onChange: (u: Partial<DetailedExercise>) => void
  onRemove: () => void
}) {
  const isCardio = exercise.name === 'Rowing' || exercise.name === 'SkiErg' || exercise.name === 'Course 1km' || exercise.name === 'Course 500m'

  return (
    <div className="bg-[#0a0a0a] border border-[#333] rounded-lg p-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={exercise.name}
          onChange={e => onChange({ name: e.target.value })}
          className="flex-1 bg-[#141414] border border-[#404040] rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-[#ff3b30]"
        >
          {HYROX_EXERCISES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <button onClick={onRemove} className="text-[#a3a3a3] hover:text-red-400 text-xs px-1 transition-colors">✕</button>
      </div>

      {isCardio ? (
        <div className="grid grid-cols-3 gap-1.5">
          <div>
            <p className="text-[9px] text-[#a3a3a3] uppercase tracking-wide mb-0.5">Mètres</p>
            <SmallInput value={exercise.meters} onChange={v => onChange({ meters: parseInt(v) })} placeholder="2000" type="number" />
          </div>
          <div>
            <p className="text-[9px] text-[#a3a3a3] uppercase tracking-wide mb-0.5">kcal</p>
            <SmallInput value={exercise.kcal} onChange={v => onChange({ kcal: parseInt(v) })} placeholder="80" type="number" />
          </div>
          <div>
            <p className="text-[9px] text-[#a3a3a3] uppercase tracking-wide mb-0.5">Durée</p>
            <SmallInput value={fmtMin(exercise.durationMin)} onChange={v => onChange({ durationMin: parseHMS(v) })} placeholder="07:30" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1.5">
          <div>
            <p className="text-[9px] text-[#a3a3a3] uppercase tracking-wide mb-0.5">Séries</p>
            <SmallInput value={exercise.sets} onChange={v => onChange({ sets: parseInt(v) })} placeholder="3" type="number" />
          </div>
          <div>
            <p className="text-[9px] text-[#a3a3a3] uppercase tracking-wide mb-0.5">Reps</p>
            <SmallInput value={exercise.reps} onChange={v => onChange({ reps: parseInt(v) })} placeholder="15" type="number" />
          </div>
          <div>
            <p className="text-[9px] text-[#a3a3a3] uppercase tracking-wide mb-0.5">Poids kg</p>
            <SmallInput value={exercise.weightKg} onChange={v => onChange({ weightKg: parseFloat(v) })} placeholder="20" type="number" />
          </div>
          <div>
            <p className="text-[9px] text-[#a3a3a3] uppercase tracking-wide mb-0.5">Durée</p>
            <SmallInput value={fmtMin(exercise.durationMin)} onChange={v => onChange({ durationMin: parseHMS(v) })} placeholder="05:00" />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Report router ───────────────────────────────────────────────────────────
function ReportForm({ sport, report, onChange }: { sport: Sport; report: Partial<SessionReport>; onChange: (r: Partial<SessionReport>) => void }) {
  switch (sport) {
    case 'running':
    case 'trail':
      return <RunReportForm report={report} onChange={onChange} />
    case 'hyrox':
      return <HyroxReportForm report={report} onChange={onChange} />
    case 'cycling':
      return <CyclingReportForm report={report} onChange={onChange} />
    case 'swimming':
      return <SwimReportForm report={report} onChange={onChange} />
    case 'strength':
    case 'powerlifting':
    case 'calisthenics':
      return <StrengthReportForm report={report} onChange={onChange} />
    case 'crossfit':
      return <CrossfitReportForm report={report} onChange={onChange} />
    default:
      return <GenericReportForm report={report} onChange={onChange} />
  }
}

// ─── Running / Trail ─────────────────────────────────────────────────────────
function RunReportForm({ report, onChange }: { report: Partial<SessionReport>; onChange: (r: Partial<SessionReport>) => void }) {
  const set = (key: keyof SessionReport, val: string | number | undefined) => onChange({ ...report, [key]: val })
  const structure = report.sessionStructure ?? 'endurance'

  return (
    <div className="space-y-3">
      <SectionBox title="Échauffement">
        <Field label="Durée">
          <DurationInput value={report.warmupMin} onChange={v => set('warmupMin', v)} />
        </Field>
        <Field label="Distance (km)">
          <Input value={report.warmupDist} onChange={v => set('warmupDist', parseFloat(v))} placeholder="2.0" type="number" />
        </Field>
      </SectionBox>

      <SectionBox title="Corps de séance">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {[
            { key: 'endurance', label: 'Endurance' },
            { key: 'intervals', label: 'Intervalles' },
            { key: 'tempo', label: 'Tempo' },
            { key: 'fartlek', label: 'Fartlek' },
            { key: 'custom', label: 'Libre' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => set('sessionStructure', key)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${structure === key ? 'border-[#ff3b30]/50 bg-[#ff3b30]/10 text-[#ff3b30]' : 'border-[#262626] text-[#a3a3a3] hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {structure === 'intervals' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Nb répétitions">
                <Input value={report.intervalReps} onChange={v => set('intervalReps', parseInt(v))} placeholder="8" type="number" />
              </Field>
              <Field label="Allure cible (/km)">
                <Input value={report.intervalPace} onChange={v => set('intervalPace', v)} placeholder="4:30" />
              </Field>
            </div>
            <Field label="Durée/rép">
              <DurationInput value={report.intervalDurationMin} onChange={v => set('intervalDurationMin', v)} />
            </Field>
            <Field label="Récupération">
              <DurationInput value={report.intervalRecoveryMin} onChange={v => set('intervalRecoveryMin', v)} />
            </Field>
          </div>
        )}

        {structure === 'tempo' && (
          <div className="space-y-2">
            <Field label="Durée au seuil">
              <DurationInput value={report.intervalDurationMin} onChange={v => set('intervalDurationMin', v)} />
            </Field>
            <Field label="Allure seuil (/km)">
              <Input value={report.intervalPace} onChange={v => set('intervalPace', v)} placeholder="4:15" />
            </Field>
          </div>
        )}
      </SectionBox>

      <SectionBox title="Cool-down">
        <Field label="Durée">
          <DurationInput value={report.cooldownMin} onChange={v => set('cooldownMin', v)} />
        </Field>
      </SectionBox>

      <SectionBox title="Données globales">
        <Field label="Durée totale">
          <DurationInput value={report.duration} onChange={v => set('duration', v)} />
        </Field>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Field label="Distance (km)">
            <Input value={report.distance} onChange={v => set('distance', parseFloat(v))} placeholder="10.5" type="number" />
          </Field>
          <Field label="Allure moy (/km)">
            <Input value={report.avgPace} onChange={v => set('avgPace', v)} placeholder="5:30" />
          </Field>
          <Field label="Allure max (/km)">
            <Input value={report.maxPace} onChange={v => set('maxPace', v)} placeholder="4:10" />
          </Field>
          <Field label="FC moy (bpm)">
            <Input value={report.hrAvg} onChange={v => set('hrAvg', parseInt(v))} placeholder="145" type="number" />
          </Field>
          <Field label="FC max (bpm)">
            <Input value={report.hrMax} onChange={v => set('hrMax', parseInt(v))} placeholder="172" type="number" />
          </Field>
          <Field label="D+ (m)">
            <Input value={report.elevationGain} onChange={v => set('elevationGain', parseInt(v))} placeholder="320" type="number" />
          </Field>
          <Field label="Cadence (spm)">
            <Input value={report.cadence} onChange={v => set('cadence', parseInt(v))} placeholder="178" type="number" />
          </Field>
        </div>
      </SectionBox>

      <RpeSlider value={report.rpe} onChange={v => set('rpe', v)} />
      <WeatherPicker value={report.weather} onChange={v => set('weather', v)} />
      <NotesField value={report.notes} onChange={v => set('notes', v)} />
      <CompletedCheckbox value={report.completedAt} onChange={v => set('completedAt', v)} />
    </div>
  )
}

// ─── Hyrox ───────────────────────────────────────────────────────────────────
function HyroxReportForm({ report, onChange }: { report: Partial<SessionReport>; onChange: (r: Partial<SessionReport>) => void }) {
  const set = (key: keyof SessionReport, val: string | number | DetailedExercise[] | undefined) => onChange({ ...report, [key]: val })
  const workoutType = report.hyroxWorkoutType ?? 'for_time'
  const exercises: DetailedExercise[] = report.detailedExercises ?? []

  function addExercise() {
    const newEx: DetailedExercise = { id: crypto.randomUUID(), name: 'SkiErg' }
    onChange({ ...report, detailedExercises: [...exercises, newEx] })
  }

  function updateExercise(id: string, updates: Partial<DetailedExercise>) {
    onChange({ ...report, detailedExercises: exercises.map(e => e.id === id ? { ...e, ...updates } : e) })
  }

  function removeExercise(id: string) {
    onChange({ ...report, detailedExercises: exercises.filter(e => e.id !== id) })
  }

  const WORKOUT_TYPES = [
    { key: 'for_time', label: 'For Time' },
    { key: 'amrap', label: 'AMRAP' },
    { key: 'emom', label: 'EMOM' },
    { key: 'intervals', label: 'Intervalles' },
    { key: 'strength', label: 'Strength' },
    { key: 'custom', label: 'Libre' },
  ]

  return (
    <div className="space-y-3">
      <SectionBox title="Type de séance">
        <div className="flex flex-wrap gap-1.5">
          {WORKOUT_TYPES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => set('hyroxWorkoutType', key)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors font-medium ${workoutType === key ? 'border-[#ff3b30]/50 bg-[#ff3b30]/10 text-[#ff3b30]' : 'border-[#262626] text-[#a3a3a3] hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </SectionBox>

      <SectionBox title="Résultat">
        {workoutType === 'for_time' && (
          <Field label="Temps total">
            <DurationInput value={report.duration} onChange={v => set('duration', v)} />
          </Field>
        )}
        {workoutType === 'amrap' && (
          <div className="space-y-2">
            <Field label="Durée AMRAP">
              <DurationInput value={report.duration} onChange={v => set('duration', v)} />
            </Field>
            <Field label="Rounds + reps">
              <Input value={report.hyroxResult} onChange={v => set('hyroxResult', v)} placeholder="ex: 5 rounds + 12" />
            </Field>
          </div>
        )}
        {workoutType === 'emom' && (
          <div className="space-y-2">
            <Field label="Durée EMOM">
              <DurationInput value={report.duration} onChange={v => set('duration', v)} />
            </Field>
            <Field label="Rounds complétés">
              <Input value={report.hyroxResult} onChange={v => set('hyroxResult', v)} placeholder="ex: 20/20" />
            </Field>
          </div>
        )}
        {(workoutType === 'intervals' || workoutType === 'strength' || workoutType === 'custom') && (
          <div className="space-y-2">
            <Field label="Durée totale">
              <DurationInput value={report.duration} onChange={v => set('duration', v)} />
            </Field>
            {workoutType === 'intervals' && (
              <Field label="Résultat">
                <Input value={report.hyroxResult} onChange={v => set('hyroxResult', v)} placeholder="ex: 6 rounds" />
              </Field>
            )}
          </div>
        )}
      </SectionBox>

      <SectionBox title="Exercices">
        <div className="flex justify-end mb-1">
          <button
            onClick={addExercise}
            className="text-xs px-2.5 py-1 bg-[#ff3b30]/10 text-[#ff3b30] border border-[#ff3b30]/30 rounded-lg hover:bg-[#ff3b30]/20 transition-colors"
          >
            + Ajouter un exercice
          </button>
        </div>
        {exercises.length === 0 && (
          <p className="text-[#404040] text-xs py-1 text-center">Aucun exercice — cliquez sur Ajouter</p>
        )}
        <div className="space-y-2">
          {exercises.map(ex => (
            <ExerciseRow
              key={ex.id}
              exercise={ex}
              onChange={updates => updateExercise(ex.id, updates)}
              onRemove={() => removeExercise(ex.id)}
            />
          ))}
        </div>
      </SectionBox>

      <SectionBox title="Données générales">
        <div className="grid grid-cols-2 gap-2">
          <Field label="FC moy (bpm)">
            <Input value={report.hrAvg} onChange={v => set('hrAvg', parseInt(v))} placeholder="155" type="number" />
          </Field>
          <Field label="FC max (bpm)">
            <Input value={report.hrMax} onChange={v => set('hrMax', parseInt(v))} placeholder="178" type="number" />
          </Field>
        </div>
      </SectionBox>

      <RpeSlider value={report.rpe} onChange={v => set('rpe', v)} />
      <WeatherPicker value={report.weather} onChange={v => set('weather', v)} />
      <NotesField value={report.notes} onChange={v => set('notes', v)} />
      <CompletedCheckbox value={report.completedAt} onChange={v => set('completedAt', v)} />
    </div>
  )
}

// ─── Cycling ─────────────────────────────────────────────────────────────────
function CyclingReportForm({ report, onChange }: { report: Partial<SessionReport>; onChange: (r: Partial<SessionReport>) => void }) {
  const set = (key: keyof SessionReport, val: string | number | undefined) => onChange({ ...report, [key]: val })
  return (
    <div className="space-y-3">
      <Field label="Durée">
        <DurationInput value={report.duration} onChange={v => set('duration', v)} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Distance (km)">
          <Input value={report.distance} onChange={v => set('distance', parseFloat(v))} placeholder="60" type="number" />
        </Field>
        <Field label="Vitesse moy (km/h)">
          <Input value={report.avgSpeed} onChange={v => set('avgSpeed', parseFloat(v))} placeholder="32" type="number" />
        </Field>
        <Field label="Puissance moy (W)">
          <Input value={report.avgPower} onChange={v => set('avgPower', parseInt(v))} placeholder="210" type="number" />
        </Field>
        <Field label="Puissance max (W)">
          <Input value={report.maxPower} onChange={v => set('maxPower', parseInt(v))} placeholder="480" type="number" />
        </Field>
        <Field label="FC moy (bpm)">
          <Input value={report.hrAvg} onChange={v => set('hrAvg', parseInt(v))} placeholder="145" type="number" />
        </Field>
        <Field label="FC max (bpm)">
          <Input value={report.hrMax} onChange={v => set('hrMax', parseInt(v))} placeholder="172" type="number" />
        </Field>
        <Field label="D+ (m)">
          <Input value={report.elevationGain} onChange={v => set('elevationGain', parseInt(v))} placeholder="800" type="number" />
        </Field>
        <Field label="Cadence (rpm)">
          <Input value={report.cadence} onChange={v => set('cadence', parseInt(v))} placeholder="90" type="number" />
        </Field>
      </div>
      <RpeSlider value={report.rpe} onChange={v => set('rpe', v)} />
      <WeatherPicker value={report.weather} onChange={v => set('weather', v)} />
      <NotesField value={report.notes} onChange={v => set('notes', v)} />
      <CompletedCheckbox value={report.completedAt} onChange={v => set('completedAt', v)} />
    </div>
  )
}

// ─── Swimming ────────────────────────────────────────────────────────────────
function SwimReportForm({ report, onChange }: { report: Partial<SessionReport>; onChange: (r: Partial<SessionReport>) => void }) {
  const set = (key: keyof SessionReport, val: string | number | undefined) => onChange({ ...report, [key]: val })
  return (
    <div className="space-y-3">
      <Field label="Durée">
        <DurationInput value={report.duration} onChange={v => set('duration', v)} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Distance (m)">
          <Input value={report.distance} onChange={v => set('distance', parseFloat(v))} placeholder="2000" type="number" />
        </Field>
        <Field label="Nb longueurs">
          <Input value={report.lengths} onChange={v => set('lengths', parseInt(v))} placeholder="40" type="number" />
        </Field>
        <Field label="SWOLF">
          <Input value={report.swolfScore} onChange={v => set('swolfScore', parseInt(v))} placeholder="38" type="number" />
        </Field>
        <Field label="FC moy (bpm)">
          <Input value={report.hrAvg} onChange={v => set('hrAvg', parseInt(v))} placeholder="145" type="number" />
        </Field>
      </div>
      <Field label="Type de nage">
        <select
          value={report.strokeType ?? ''}
          onChange={e => set('strokeType', e.target.value)}
          className="w-full bg-[#0a0a0a] border border-[#404040] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ff3b30]"
        >
          <option value="">-- Choisir --</option>
          {STROKE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <RpeSlider value={report.rpe} onChange={v => set('rpe', v)} />
      <NotesField value={report.notes} onChange={v => set('notes', v)} />
      <CompletedCheckbox value={report.completedAt} onChange={v => set('completedAt', v)} />
    </div>
  )
}

// ─── Strength exercise row (report form) ─────────────────────────────────────
function StrengthExRow({ exercise, onChange }: {
  exercise: DetailedExercise
  onChange: (u: Partial<DetailedExercise>) => void
}) {
  return (
    <div className="bg-[#0a0a0a] border border-[#333] rounded-lg p-2.5">
      <div className="text-xs font-medium text-white mb-2">{exercise.name}</div>
      <div className="grid grid-cols-3 gap-1.5">
        <div>
          <p className="text-[9px] text-[#a3a3a3] uppercase tracking-wide mb-0.5">Séries</p>
          <SmallInput value={exercise.sets} onChange={v => onChange({ sets: parseInt(v) })} placeholder="4" type="number" />
        </div>
        <div>
          <p className="text-[9px] text-[#a3a3a3] uppercase tracking-wide mb-0.5">Reps</p>
          <SmallInput value={exercise.reps} onChange={v => onChange({ reps: parseInt(v) })} placeholder="10" type="number" />
        </div>
        <div>
          <p className="text-[9px] text-[#a3a3a3] uppercase tracking-wide mb-0.5">Poids (kg)</p>
          <SmallInput value={exercise.weightKg} onChange={v => onChange({ weightKg: parseFloat(v) })} placeholder="60" type="number" />
        </div>
      </div>
    </div>
  )
}

// ─── Strength ────────────────────────────────────────────────────────────────
function StrengthReportForm({ report, onChange }: { report: Partial<SessionReport>; onChange: (r: Partial<SessionReport>) => void }) {
  const set = (key: keyof SessionReport, val: string | number | undefined) => onChange({ ...report, [key]: val })
  const exercises: DetailedExercise[] = report.detailedExercises ?? []

  function updateExercise(id: string, updates: Partial<DetailedExercise>) {
    onChange({ ...report, detailedExercises: exercises.map(e => e.id === id ? { ...e, ...updates } : e) })
  }

  return (
    <div className="space-y-3">
      {exercises.length > 0 && (
        <SectionBox title="Exercices réalisés">
          <div className="space-y-2">
            {exercises.map(ex => (
              <StrengthExRow key={ex.id} exercise={ex} onChange={updates => updateExercise(ex.id, updates)} />
            ))}
          </div>
        </SectionBox>
      )}
      <Field label="Durée">
        <DurationInput value={report.duration} onChange={v => set('duration', v)} />
      </Field>
      <RpeSlider value={report.rpe} onChange={v => set('rpe', v)} />
      <NotesField value={report.notes} onChange={v => set('notes', v)} />
      <CompletedCheckbox value={report.completedAt} onChange={v => set('completedAt', v)} />
    </div>
  )
}

// ─── Crossfit ────────────────────────────────────────────────────────────────
function CrossfitReportForm({ report, onChange }: { report: Partial<SessionReport>; onChange: (r: Partial<SessionReport>) => void }) {
  const set = (key: keyof SessionReport, val: string | number | undefined) => onChange({ ...report, [key]: val })
  return (
    <div className="space-y-3">
      <Field label="Durée">
        <DurationInput value={report.duration} onChange={v => set('duration', v)} />
      </Field>
      <Field label="Nom du WOD">
        <Input value={report.wodName} onChange={v => set('wodName', v)} placeholder="ex: Fran, Murph..." />
      </Field>
      <Field label="Résultats (temps, reps, charges)">
        <textarea
          value={report.wodResults ?? ''}
          onChange={e => set('wodResults', e.target.value)}
          rows={2}
          placeholder="ex: 4:32 Rx, 21-15-9 Thrusters 43kg"
          className="w-full bg-[#0a0a0a] border border-[#404040] rounded-lg px-3 py-2 text-white text-sm font-data focus:outline-none focus:border-[#ff3b30] resize-none placeholder:text-[#404040]"
        />
      </Field>
      <RpeSlider value={report.rpe} onChange={v => set('rpe', v)} />
      <WeatherPicker value={report.weather} onChange={v => set('weather', v)} />
      <NotesField value={report.notes} onChange={v => set('notes', v)} />
      <CompletedCheckbox value={report.completedAt} onChange={v => set('completedAt', v)} />
    </div>
  )
}

// ─── Generic fallback ────────────────────────────────────────────────────────
function GenericReportForm({ report, onChange }: { report: Partial<SessionReport>; onChange: (r: Partial<SessionReport>) => void }) {
  const set = (key: keyof SessionReport, val: string | number | undefined) => onChange({ ...report, [key]: val })
  return (
    <div className="space-y-3">
      <Field label="Durée">
        <DurationInput value={report.duration} onChange={v => set('duration', v)} />
      </Field>
      <Field label="FC moy (bpm)">
        <Input value={report.hrAvg} onChange={v => set('hrAvg', parseInt(v))} placeholder="145" type="number" />
      </Field>
      <RpeSlider value={report.rpe} onChange={v => set('rpe', v)} />
      <NotesField value={report.notes} onChange={v => set('notes', v)} />
      <CompletedCheckbox value={report.completedAt} onChange={v => set('completedAt', v)} />
    </div>
  )
}

// ─── Editable planned exercises (muscu) ─────────────────────────────────────
const MUSCLE_OPTIONS = [
  { key: 'chest', label: 'Pectoraux' }, { key: 'back', label: 'Dos' },
  { key: 'shoulders', label: 'Épaules' }, { key: 'biceps', label: 'Biceps' },
  { key: 'triceps', label: 'Triceps' }, { key: 'quads', label: 'Cuisses' },
  { key: 'hamstrings', label: 'Ischio' }, { key: 'glutes', label: 'Fessiers' },
  { key: 'calves', label: 'Mollets' }, { key: 'core', label: 'Abdos' },
]

function EditablePlannedExRow({ exercise, onChange, onRemove }: {
  exercise: PlannedExercise
  onChange: (u: Partial<PlannedExercise>) => void
  onRemove: () => void
}) {
  return (
    <div className="bg-[#0a0a0a] border border-[#333] rounded-lg p-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <input
          value={exercise.name}
          onChange={e => onChange({ name: e.target.value })}
          className="flex-1 bg-[#141414] border border-[#404040] rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-[#ff3b30] min-w-0"
          placeholder="Nom de l'exercice"
        />
        <select
          value={exercise.muscleGroup ?? ''}
          onChange={e => onChange({ muscleGroup: (e.target.value as MuscleGroup) || undefined })}
          className="bg-[#141414] border border-[#404040] rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-[#ff3b30] shrink-0"
        >
          <option value="">Muscle</option>
          {MUSCLE_OPTIONS.map(({ key, label }) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <button onClick={onRemove} className="text-[#a3a3a3] hover:text-red-400 text-xs shrink-0 transition-colors">✕</button>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <div>
          <p className="text-[9px] text-[#a3a3a3] uppercase tracking-wide mb-0.5">Séries</p>
          <SmallInput value={exercise.sets} onChange={v => onChange({ sets: parseInt(v) || 1 })} placeholder="4" type="number" />
        </div>
        <div>
          <p className="text-[9px] text-[#a3a3a3] uppercase tracking-wide mb-0.5">Reps</p>
          <SmallInput value={exercise.reps} onChange={v => onChange({ reps: v })} placeholder="8-12" />
        </div>
        <div>
          <p className="text-[9px] text-[#a3a3a3] uppercase tracking-wide mb-0.5">Poids kg</p>
          <SmallInput value={exercise.weightKg} onChange={v => onChange({ weightKg: parseFloat(v) || undefined })} placeholder="60" type="number" />
        </div>
        <div>
          <p className="text-[9px] text-[#a3a3a3] uppercase tracking-wide mb-0.5">Repos s</p>
          <SmallInput value={exercise.restSec} onChange={v => onChange({ restSec: parseInt(v) || undefined })} placeholder="90" type="number" />
        </div>
      </div>
    </div>
  )
}

function EditablePlannedExercises({ exercises, onChange }: {
  exercises: PlannedExercise[]
  onChange: (exercises: PlannedExercise[]) => void
}) {
  function updateEx(id: string, updates: Partial<PlannedExercise>) {
    onChange(exercises.map(e => e.id === id ? { ...e, ...updates } : e))
  }
  function removeEx(id: string) {
    onChange(exercises.filter(e => e.id !== id))
  }
  function addEx() {
    onChange([...exercises, { id: crypto.randomUUID(), name: '', sets: 3, reps: '10' }])
  }
  return (
    <div className="border border-[#262626] rounded-lg overflow-hidden">
      <div className="bg-[#1c1c1c] px-3 py-1.5 flex items-center justify-between">
        <span className="text-[10px] text-[#a3a3a3] uppercase tracking-wider font-medium">Programme muscu</span>
        <button
          onClick={addEx}
          className="text-xs px-2 py-0.5 bg-[#ff3b30]/10 text-[#ff3b30] border border-[#ff3b30]/30 rounded hover:bg-[#ff3b30]/20 transition-colors"
        >
          + Ajouter
        </button>
      </div>
      <div className="p-3 space-y-2">
        {exercises.map(ex => (
          <EditablePlannedExRow
            key={ex.id}
            exercise={ex}
            onChange={u => updateEx(ex.id, u)}
            onRemove={() => removeEx(ex.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Planned workout display ─────────────────────────────────────────────────
const RUN_BLOCK_LABELS: Record<string, string> = {
  warmup: 'Échauffement', easy: 'Endurance', tempo: 'Tempo / Seuil',
  intervals: 'Intervalles', cooldown: 'Récupération', custom: 'Bloc libre',
}
const RUN_BLOCK_COLORS: Record<string, string> = {
  warmup: '#f59e0b', easy: '#22c55e', tempo: '#3b82f6',
  intervals: '#ff3b30', cooldown: '#8b5cf6', custom: '#a3a3a3',
}
const MUSCLE_SHORT: Record<string, string> = {
  chest: 'Pecto', back: 'Dos', shoulders: 'Épaules', biceps: 'Biceps',
  triceps: 'Triceps', quads: 'Cuisses', hamstrings: 'Ischio',
  glutes: 'Fessiers', calves: 'Mollets', core: 'Abdos',
}

function PlannedWorkoutDisplay({ session }: { session: TrainingSession }) {
  const pw = session.plannedWorkout
  if (!pw) return null

  if (pw.runBlocks && pw.runBlocks.length > 0) {
    return (
      <div className="border border-[#262626] rounded-lg overflow-hidden">
        <div className="bg-[#1c1c1c] px-3 py-1.5 flex items-center justify-between">
          <span className="text-[10px] text-[#a3a3a3] uppercase tracking-wider font-medium">Séance planifiée</span>
          {pw.focusLabel && <span className="text-[10px] text-[#a3a3a3]">{pw.focusLabel}</span>}
        </div>
        <div className="divide-y divide-[#1a1a1a]">
          {pw.runBlocks.map(block => {
            const color = RUN_BLOCK_COLORS[block.type] ?? '#a3a3a3'
            const label = RUN_BLOCK_LABELS[block.type] ?? block.type
            return (
              <div key={block.id} className="p-2.5 flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium" style={{ color }}>{label}</span>
                    {block.durationMin != null && (
                      <span className="text-xs text-[#a3a3a3] font-data">{block.durationMin} min</span>
                    )}
                    {block.reps != null && block.repDistanceM != null && (
                      <span className="text-xs text-white font-data">{block.reps}×{block.repDistanceM}m</span>
                    )}
                    {block.reps != null && block.repDurationMin != null && !block.repDistanceM && (
                      <span className="text-xs text-white font-data">{block.reps}×{block.repDurationMin} min</span>
                    )}
                    {block.repPace && (
                      <span className="text-xs text-[#a3a3a3] font-data">@ {block.repPace}/km</span>
                    )}
                    {block.pace && !block.repPace && (
                      <span className="text-xs text-[#a3a3a3] font-data">@ {block.pace}/km</span>
                    )}
                    {block.recoveryMin != null && (
                      <span className="text-xs text-[#a3a3a3]">
                        récup {block.recoveryMin < 1 ? `${Math.round(block.recoveryMin * 60)}s` : `${block.recoveryMin} min`}
                      </span>
                    )}
                    {block.hrZone != null && (
                      <span className="text-xs text-[#a3a3a3]">Z{block.hrZone}</span>
                    )}
                  </div>
                  {block.notes && (
                    <p className="text-[11px] text-[#666] mt-0.5 leading-snug">{block.notes}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (pw.exercises && pw.exercises.length > 0) {
    return (
      <div className="border border-[#262626] rounded-lg overflow-hidden">
        <div className="bg-[#1c1c1c] px-3 py-1.5 flex items-center justify-between">
          <span className="text-[10px] text-[#a3a3a3] uppercase tracking-wider font-medium">Programme muscu</span>
          {pw.focusLabel && <span className="text-[10px] text-[#ff3b30] font-medium">{pw.focusLabel}</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                <th className="text-left px-3 py-1.5 text-[#a3a3a3] font-medium">Exercice</th>
                <th className="text-center px-2 py-1.5 text-[#a3a3a3] font-medium">Séries</th>
                <th className="text-center px-2 py-1.5 text-[#a3a3a3] font-medium">Reps</th>
                <th className="text-center px-2 py-1.5 text-[#a3a3a3] font-medium">Repos</th>
                <th className="text-center px-2 py-1.5 text-[#a3a3a3] font-medium">RPE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {pw.exercises.map(ex => (
                <tr key={ex.id}>
                  <td className="px-3 py-2">
                    <div className="text-white font-medium leading-snug">{ex.name}</div>
                    {ex.muscleGroup && (
                      <div className="text-[10px] text-[#666] mt-0.5">{MUSCLE_SHORT[ex.muscleGroup] ?? ex.muscleGroup}</div>
                    )}
                  </td>
                  <td className="text-center px-2 py-2 font-data text-white">{ex.sets}</td>
                  <td className="text-center px-2 py-2 font-data text-[#e5e5e5]">{ex.reps}</td>
                  <td className="text-center px-2 py-2 font-data text-[#a3a3a3]">{ex.restSec != null ? `${ex.restSec}s` : '—'}</td>
                  <td className="text-center px-2 py-2 font-data text-[#a3a3a3]">{ex.rpe != null ? ex.rpe : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pw.coachNotes && (
          <div className="px-3 py-2 bg-[#0a0a0a] border-t border-[#1a1a1a]">
            <p className="text-[11px] text-[#a3a3a3]">{pw.coachNotes}</p>
          </div>
        )}
      </div>
    )
  }

  return null
}

// ─── Similar sessions comparison ─────────────────────────────────────────────
function SimilarSessions({ current, sessions }: { current: TrainingSession; sessions: TrainingSession[] }) {
  const similar = sessions
    .filter(s => s.id !== current.id && s.sport === current.sport && s.type === current.type && s.report?.completedAt)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  if (similar.length === 0) return null

  return (
    <div className="border border-[#262626] rounded-lg overflow-hidden">
      <div className="bg-[#1c1c1c] px-3 py-1.5">
        <span className="text-[10px] text-[#a3a3a3] uppercase tracking-wider font-medium">Séances similaires</span>
      </div>
      <div className="divide-y divide-[#1a1a1a]">
        {similar.map(s => (
          <div key={s.id} className="px-3 py-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-white font-medium truncate">{s.title}</div>
              <div className="text-[10px] text-[#666] mt-0.5">
                {new Date(s.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {s.report?.duration != null && (
                <div className="text-right">
                  <div className="text-xs font-data text-[#e5e5e5]">{fmtMin(s.report.duration)}</div>
                  <div className="text-[10px] text-[#666]">durée</div>
                </div>
              )}
              {s.report?.distance != null && (
                <div className="text-right">
                  <div className="text-xs font-data text-[#e5e5e5]">{s.report.distance} km</div>
                  <div className="text-[10px] text-[#666]">dist.</div>
                </div>
              )}
              {s.report?.rpe != null && (
                <div className="text-right">
                  <div className="text-xs font-data text-[#e5e5e5]">{s.report.rpe}/10</div>
                  <div className="text-[10px] text-[#666]">RPE</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
