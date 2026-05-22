'use client'

import { useState } from 'react'
import type { TrainingSession, SessionReport, Sport } from '@/types'
import { useAppStore } from '@/lib/store'
import { SPORT_COLORS, SPORT_ICONS, SPORT_LABELS } from '@/lib/utils'

const SPORTS_LIST: Sport[] = ['running', 'trail', 'cycling', 'swimming', 'triathlon', 'crossfit', 'hyrox', 'strength', 'powerlifting', 'calisthenics', 'team_sports', 'tennis', 'combat', 'ski', 'climbing', 'hiking', 'mobility', 'rest']
const WEATHER_OPTIONS = ['Ensoleillé', 'Nuageux', 'Pluie', 'Vent fort', 'Chaud', 'Froid', 'Neige']
const STROKE_TYPES = ['Crawl', 'Dos', 'Brasse', 'Papillon', 'Mixte']

type Tab = 'details' | 'report' | 'coach'

export function SessionModal({ session, open, onClose }: { session: TrainingSession; open: boolean; onClose: () => void }) {
  const { updateSession, addSession, removeSession } = useAppStore()
  const [tab, setTab] = useState<Tab>('details')
  const [editing, setEditing] = useState(!session.id || session.title === 'Nouvelle séance')
  const [alreadyAdded, setAlreadyAdded] = useState(false)
  const [title, setTitle] = useState(session.title)
  const [description, setDescription] = useState(session.description ?? '')
  const [sport, setSport] = useState<Sport>(session.sport)
  const [report, setReport] = useState<Partial<SessionReport>>(session.report ?? {})
  const [coachQuestion, setCoachQuestion] = useState('')
  const [saved, setSaved] = useState(false)

  if (!open) return null

  const color = SPORT_COLORS[sport] ?? '#a3a3a3'
  const isNew = !session.createdAt || session.title === 'Nouvelle séance'

  function saveSession() {
    const updated: TrainingSession = {
      ...session,
      title,
      description,
      sport,
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
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
    setEditing(false)
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
${session.plannedDuration ? `Durée prévue: ${session.plannedDuration}min` : ''}
${report.duration ? `Durée réelle: ${report.duration}min` : ''}
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

          {/* Tabs */}
          <div className="flex gap-1">
            {(['details', 'report', 'coach'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  tab === t ? 'text-white' : 'text-[#a3a3a3] hover:text-white'
                }`}
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
                    <div className="font-data text-white font-medium">{session.plannedDuration} min</div>
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

              {session.importedFrom && session.importedFrom !== 'manual' && (
                <div className="flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <span>🔗</span>
                  <span className="text-blue-400 text-xs">Importé de {session.importedFrom}</span>
                </div>
              )}

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

              {session.coachNotes?.length ? (
                <div>
                  <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wide block mb-2">Notes sauvegardées</label>
                  {session.coachNotes.map((note, i) => (
                    <div key={i} className="p-3 bg-[#0a0a0a] rounded-lg text-sm text-[#e5e5e5] mb-2">{note}</div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {session.completed && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <span>✓</span> Effectuée
              </span>
            )}
            {saved && <span className="text-xs text-green-400">Sauvegardé ✓</span>}
          </div>
          {(editing || isNew) && (
            <button
              onClick={saveSession}
              className="px-4 py-2 bg-[#ff3b30] hover:bg-[#ff5a52] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {isNew ? 'Créer la séance' : 'Sauvegarder'}
            </button>
          )}
          {!editing && tab === 'report' && (
            <button
              onClick={saveSession}
              className="px-4 py-2 bg-[#ff3b30] hover:bg-[#ff5a52] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Sauvegarder
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

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

function ReportForm({ sport, report, onChange }: { sport: Sport; report: Partial<SessionReport>; onChange: (r: Partial<SessionReport>) => void }) {
  const set = (key: keyof SessionReport, val: string | number) => onChange({ ...report, [key]: val })

  const commonFields = (
    <>
      <Field label="Durée (min)">
        <Input value={report.duration} onChange={v => set('duration', parseFloat(v))} placeholder="ex: 45" type="number" />
      </Field>
      <Field label="FC moyenne (bpm)">
        <Input value={report.hrAvg} onChange={v => set('hrAvg', parseInt(v))} placeholder="ex: 145" type="number" />
      </Field>
      <Field label="FC max (bpm)">
        <Input value={report.hrMax} onChange={v => set('hrMax', parseInt(v))} placeholder="ex: 172" type="number" />
      </Field>
      <Field label="RPE (1-10)">
        <input
          type="range" min={1} max={10} value={report.rpe ?? 5}
          onChange={e => set('rpe', parseInt(e.target.value))}
          className="w-full accent-[#ff3b30]"
        />
        <div className="flex justify-between text-[10px] text-[#a3a3a3] mt-0.5">
          <span>Très facile</span><span className="font-data font-medium text-white">{report.rpe ?? 5}/10</span><span>Max</span>
        </div>
      </Field>
    </>
  )

  const runFields = (
    <>
      <Field label="Distance (km)">
        <Input value={report.distance} onChange={v => set('distance', parseFloat(v))} placeholder="ex: 10.5" type="number" />
      </Field>
      <Field label="Allure moyenne (mm:ss/km)">
        <Input value={report.avgPace} onChange={v => set('avgPace', v)} placeholder="ex: 5:30" />
      </Field>
      <Field label="Allure max (mm:ss/km)">
        <Input value={report.maxPace} onChange={v => set('maxPace', v)} placeholder="ex: 4:10" />
      </Field>
      <Field label="D+ (m)">
        <Input value={report.elevationGain} onChange={v => set('elevationGain', parseInt(v))} placeholder="ex: 320" type="number" />
      </Field>
      <Field label="Cadence (spm)">
        <Input value={report.cadence} onChange={v => set('cadence', parseInt(v))} placeholder="ex: 178" type="number" />
      </Field>
    </>
  )

  const cyclingFields = (
    <>
      <Field label="Distance (km)">
        <Input value={report.distance} onChange={v => set('distance', parseFloat(v))} placeholder="ex: 60" type="number" />
      </Field>
      <Field label="Vitesse moyenne (km/h)">
        <Input value={report.avgSpeed} onChange={v => set('avgSpeed', parseFloat(v))} placeholder="ex: 32" type="number" />
      </Field>
      <Field label="Puissance moyenne (W)">
        <Input value={report.avgPower} onChange={v => set('avgPower', parseInt(v))} placeholder="ex: 210" type="number" />
      </Field>
      <Field label="Puissance max (W)">
        <Input value={report.maxPower} onChange={v => set('maxPower', parseInt(v))} placeholder="ex: 480" type="number" />
      </Field>
      <Field label="D+ (m)">
        <Input value={report.elevationGain} onChange={v => set('elevationGain', parseInt(v))} placeholder="ex: 800" type="number" />
      </Field>
      <Field label="Cadence (rpm)">
        <Input value={report.cadence} onChange={v => set('cadence', parseInt(v))} placeholder="ex: 90" type="number" />
      </Field>
    </>
  )

  const swimFields = (
    <>
      <Field label="Distance totale (m)">
        <Input value={report.distance} onChange={v => set('distance', parseFloat(v))} placeholder="ex: 2000" type="number" />
      </Field>
      <Field label="Nombre de longueurs">
        <Input value={report.lengths} onChange={v => set('lengths', parseInt(v))} placeholder="ex: 40" type="number" />
      </Field>
      <Field label="SWOLF">
        <Input value={report.swolfScore} onChange={v => set('swolfScore', parseInt(v))} placeholder="ex: 38" type="number" />
      </Field>
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
    </>
  )

  const strengthFields = (
    <>
      <Field label="Charge perçue (1-10)">
        <input
          type="range" min={1} max={10} value={report.rpe ?? 7}
          onChange={e => set('rpe', parseInt(e.target.value))}
          className="w-full accent-[#ff3b30]"
        />
        <div className="flex justify-between text-[10px] text-[#a3a3a3] mt-0.5">
          <span>Léger</span><span className="font-data font-medium text-white">{report.rpe ?? 7}/10</span><span>Max</span>
        </div>
      </Field>
    </>
  )

  const crossfitFields = (
    <>
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
    </>
  )

  const renderSportFields = () => {
    switch (sport) {
      case 'running': case 'trail': return runFields
      case 'cycling': return cyclingFields
      case 'swimming': return swimFields
      case 'strength': case 'powerlifting': case 'calisthenics': return strengthFields
      case 'crossfit': case 'hyrox': return crossfitFields
      default: return null
    }
  }

  return (
    <div className="space-y-3">
      {renderSportFields()}
      {commonFields}

      {sport !== 'running' && sport !== 'trail' && sport !== 'cycling' && (
        <></>
      )}

      <Field label="Météo (optionnel)">
        <div className="flex flex-wrap gap-1.5">
          {WEATHER_OPTIONS.map(w => (
            <button
              key={w}
              onClick={() => set('weather', w)}
              className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                report.weather === w
                  ? 'border-[#ff3b30]/50 bg-[#ff3b30]/10 text-[#ff3b30]'
                  : 'border-[#262626] text-[#a3a3a3] hover:text-white'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Notes / Ressenti">
        <textarea
          value={report.notes ?? ''}
          onChange={e => set('notes', e.target.value)}
          rows={3}
          placeholder="Comment tu t'es senti ? Des points à améliorer ?"
          className="w-full bg-[#0a0a0a] border border-[#404040] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ff3b30] resize-none placeholder:text-[#404040]"
        />
      </Field>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="completed"
          checked={!!report.completedAt}
          onChange={e => set('completedAt', e.target.checked ? new Date().toISOString() : '')}
          className="accent-[#ff3b30]"
        />
        <label htmlFor="completed" className="text-sm text-[#e5e5e5] cursor-pointer">
          Marquer comme effectuée
        </label>
      </div>
    </div>
  )
}
