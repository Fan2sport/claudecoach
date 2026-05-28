'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import { generatePlan } from '@/lib/planGenerator'
import { SPORT_LABELS, SPORT_ICONS } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'
import type { Sport, Level, SportProfile, Objective, DayAvailability, UserProfile } from '@/types'

const SELECTABLE_SPORTS: Sport[] = [
  'running', 'trail', 'cycling', 'swimming', 'triathlon',
  'hyrox', 'crossfit', 'strength', 'powerlifting', 'calisthenics',
  'tennis', 'combat', 'mobility',
]
const LEVELS: { value: Level; label: string }[] = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
  { value: 'expert', label: 'Expert' },
]
const DAYS: { idx: 0 | 1 | 2 | 3 | 4 | 5 | 6; label: string }[] = [
  { idx: 1, label: 'Lun' }, { idx: 2, label: 'Mar' }, { idx: 3, label: 'Mer' },
  { idx: 4, label: 'Jeu' }, { idx: 5, label: 'Ven' }, { idx: 6, label: 'Sam' }, { idx: 0, label: 'Dim' },
]

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all ${i === current ? 'w-4 h-2 bg-[#ff3b30]' : i < current ? 'w-2 h-2 bg-[#ff3b30]/50' : 'w-2 h-2 bg-[#262626]'}`}
        />
      ))}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wide block mb-1">{children}</label>
}

function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-[#0a0a0a] border border-[#404040] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ff3b30] placeholder:text-[#404040]"
    />
  )
}

export function OnboardingWizard() {
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [generating, setGenerating] = useState(false)

  // Step 1
  const [firstName, setFirstName] = useState('')
  const [age, setAge] = useState('28')
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male')
  const [height, setHeight] = useState('175')
  const [weight, setWeight] = useState('70')
  const [restHR, setRestHR] = useState('55')
  const [maxHR, setMaxHR] = useState('')

  // Step 2
  const [sports, setSports] = useState<SportProfile[]>([])

  // Step 3
  const [objName, setObjName] = useState('')
  const [objSport, setObjSport] = useState<Sport>('running')
  const [objDate, setObjDate] = useState('')

  // Step 4
  const [availDays, setAvailDays] = useState<DayAvailability[]>([])

  const { setProfile, setSessions, setPlan, sessions: existingSessions } = useAppStore()

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) { setEmail(user.email ?? ''); setUserId(user.id) }
    })
  }, [])

  const computedMaxHR = maxHR || String(220 - (parseInt(age) || 0))

  function toggleSport(sport: Sport) {
    setSports(prev => {
      const existing = prev.find(s => s.sport === sport)
      if (existing) return prev.filter(s => s.sport !== sport)
      return [...prev, { sport, level: 'intermediate', prs: {} }]
    })
    if (!objSport || sports.length === 0) setObjSport(sport)
  }

  function setSportLevel(sport: Sport, level: Level) {
    setSports(prev => prev.map(s => s.sport === sport ? { ...s, level } : s))
  }

  function toggleDay(dayIdx: 0 | 1 | 2 | 3 | 4 | 5 | 6) {
    setAvailDays(prev => {
      const existing = prev.find(d => d.day === dayIdx)
      if (existing) return prev.filter(d => d.day !== dayIdx)
      const defaultSports = sports.length > 0 ? [sports[0].sport] : []
      return [...prev, { day: dayIdx, activities: defaultSports }]
    })
  }

  function setDaySports(dayIdx: 0 | 1 | 2 | 3 | 4 | 5 | 6, sport: Sport) {
    setAvailDays(prev => prev.map(d => {
      if (d.day !== dayIdx) return d
      const has = d.activities.includes(sport)
      return { ...d, activities: has ? d.activities.filter(a => a !== sport) : [...d.activities, sport] }
    }))
  }

  function handleFinish() {
    setGenerating(true)
    const objective: Objective = {
      id: uuidv4(),
      sport: objSport,
      name: objName || 'Mon objectif',
      target: '',
      targetDate: objDate,
      isPrimary: true,
    }
    const profile: UserProfile = {
      id: userId || uuidv4(),
      email,
      firstName: firstName || 'Athlète',
      age: parseInt(age) || 25,
      gender,
      height: parseInt(height) || 170,
      weight: parseInt(weight) || 70,
      restHR: parseInt(restHR) || 55,
      maxHR: parseInt(computedMaxHR) || 190,
      sports: sports.length > 0 ? sports : [{ sport: 'running', level: 'intermediate', prs: {} }],
      objectives: objDate ? [objective] : [],
      availableDays: availDays,
      equipment: [],
      offPeriods: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setProfile(profile)
    if (objDate && profile.objectives.length > 0) {
      try {
        const plan = generatePlan(profile)
        const completed = existingSessions.filter(s => s.completed)
        const completedKeys = new Set(completed.map(s => `${s.date}|${s.sport}`))
        const fresh = plan.sessions.filter(s => !completedKeys.has(`${s.date}|${s.sport}`))
        const merged = [...completed, ...fresh].sort((a, b) => a.date.localeCompare(b.date))
        setPlan(plan)
        setSessions(merged)
      } catch {
        // ignore plan errors
      }
    }
    setGenerating(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0a]">
      <div className="w-full max-w-lg">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center space-y-6">
            <div>
              <div className="text-6xl mb-4">🏆</div>
              <h1 className="font-display text-4xl text-white tracking-wider mb-3">ATHLETEX</h1>
              <p className="text-[#a3a3a3] text-lg">Ton coach IA personnel</p>
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 text-left space-y-3">
              {[
                { icon: '📅', text: 'Plan d\'entraînement personnalisé avec périodisation progressive' },
                { icon: '📊', text: 'Suivi complet de tes séances et de ta progression' },
                { icon: '💬', text: 'Analyse et conseils IA après chaque entraînement' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{icon}</span>
                  <span className="text-sm text-[#e5e5e5]">{text}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              className="w-full py-3 bg-[#ff3b30] hover:bg-[#ff5a52] text-white font-semibold rounded-xl transition-colors text-lg"
            >
              Commencer →
            </button>
          </div>
        )}

        {/* Step 1: Basic profile */}
        {step === 1 && (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-[#262626]">
              <StepDots total={4} current={0} />
              <h2 className="text-white font-bold text-xl mt-3">Ton profil</h2>
              <p className="text-[#a3a3a3] text-sm mt-1">Quelques informations de base pour personnaliser ton suivi</p>
            </div>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label>Prénom</Label>
                <TextInput value={firstName} onChange={setFirstName} placeholder="Ex: Thomas" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Âge</Label>
                  <TextInput value={age} onChange={setAge} type="number" placeholder="28" />
                </div>
                <div>
                  <Label>Genre</Label>
                  <select value={gender} onChange={e => setGender(e.target.value as typeof gender)}
                    className="w-full bg-[#0a0a0a] border border-[#404040] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ff3b30]">
                    <option value="male">Homme</option>
                    <option value="female">Femme</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Taille (cm)</Label>
                  <TextInput value={height} onChange={setHeight} type="number" placeholder="175" />
                </div>
                <div>
                  <Label>Poids (kg)</Label>
                  <TextInput value={weight} onChange={setWeight} type="number" placeholder="70" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>FC repos (bpm)</Label>
                  <TextInput value={restHR} onChange={setRestHR} type="number" placeholder="55" />
                </div>
                <div>
                  <Label>FC max (bpm)</Label>
                  <TextInput value={maxHR} onChange={setMaxHR} type="number" placeholder={computedMaxHR} />
                  <p className="text-[10px] text-[#5a5a5a] mt-0.5">Estimé : 220 − âge = {computedMaxHR}</p>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-[#262626] flex justify-between">
              <button onClick={() => setStep(0)} className="text-[#a3a3a3] hover:text-white text-sm transition-colors">← Retour</button>
              <button onClick={() => setStep(2)} disabled={!firstName} className="px-5 py-2 bg-[#ff3b30] hover:bg-[#ff5a52] disabled:opacity-40 text-white font-semibold rounded-lg transition-colors text-sm">
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Sports */}
        {step === 2 && (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-[#262626]">
              <StepDots total={4} current={1} />
              <h2 className="text-white font-bold text-xl mt-3">Tes sports</h2>
              <p className="text-[#a3a3a3] text-sm mt-1">Sélectionne tes disciplines et ton niveau</p>
            </div>
            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-2">
                {SELECTABLE_SPORTS.map(sport => {
                  const selected = sports.some(s => s.sport === sport)
                  return (
                    <button
                      key={sport}
                      onClick={() => toggleSport(sport)}
                      className={`p-2 rounded-xl border text-center transition-colors ${selected ? 'border-[#ff3b30]/50 bg-[#ff3b30]/10 text-white' : 'border-[#262626] text-[#a3a3a3] hover:border-[#404040] hover:text-white'}`}
                    >
                      <div className="text-xl mb-0.5">{SPORT_ICONS[sport]}</div>
                      <div className="text-[10px] leading-tight">{SPORT_LABELS[sport].split(' ')[0]}</div>
                    </button>
                  )
                })}
              </div>
              {sports.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#262626]">
                  <p className="text-[10px] text-[#a3a3a3] uppercase tracking-wide">Niveau par sport</p>
                  {sports.map(sp => (
                    <div key={sp.sport} className="flex items-center gap-3">
                      <span className="text-sm w-6">{SPORT_ICONS[sp.sport]}</span>
                      <span className="text-sm text-[#e5e5e5] flex-1">{SPORT_LABELS[sp.sport]}</span>
                      <div className="flex gap-1">
                        {LEVELS.map(l => (
                          <button
                            key={l.value}
                            onClick={() => setSportLevel(sp.sport, l.value)}
                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${sp.level === l.value ? 'border-[#ff3b30]/50 bg-[#ff3b30]/10 text-[#ff3b30]' : 'border-[#333] text-[#5a5a5a] hover:text-white'}`}
                          >
                            {l.label.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-5 border-t border-[#262626] flex justify-between">
              <button onClick={() => setStep(1)} className="text-[#a3a3a3] hover:text-white text-sm transition-colors">← Retour</button>
              <button onClick={() => setStep(3)} disabled={sports.length === 0} className="px-5 py-2 bg-[#ff3b30] hover:bg-[#ff5a52] disabled:opacity-40 text-white font-semibold rounded-lg transition-colors text-sm">
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Objective */}
        {step === 3 && (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-[#262626]">
              <StepDots total={4} current={2} />
              <h2 className="text-white font-bold text-xl mt-3">Ton objectif</h2>
              <p className="text-[#a3a3a3] text-sm mt-1">Donne un cap à ton entraînement</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <Label>Nom de l&apos;objectif</Label>
                <TextInput value={objName} onChange={setObjName} placeholder="Ex: Marathon de Paris, Hyrox Berlin..." />
              </div>
              <div>
                <Label>Sport principal</Label>
                <div className="flex flex-wrap gap-1.5">
                  {sports.map(sp => (
                    <button
                      key={sp.sport}
                      onClick={() => setObjSport(sp.sport)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-sm transition-colors ${objSport === sp.sport ? 'border-[#ff3b30]/50 bg-[#ff3b30]/10 text-white' : 'border-[#262626] text-[#a3a3a3] hover:text-white'}`}
                    >
                      {SPORT_ICONS[sp.sport]} {SPORT_LABELS[sp.sport]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Date cible</Label>
                <input
                  type="date"
                  value={objDate}
                  onChange={e => setObjDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-[#0a0a0a] border border-[#404040] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ff3b30]"
                />
              </div>
              <p className="text-[#5a5a5a] text-xs">
                Sans date cible, tu pourras toujours créer ton plan plus tard depuis la Configuration.
              </p>
            </div>
            <div className="p-5 border-t border-[#262626] flex justify-between">
              <button onClick={() => setStep(2)} className="text-[#a3a3a3] hover:text-white text-sm transition-colors">← Retour</button>
              <button onClick={() => setStep(4)} className="px-5 py-2 bg-[#ff3b30] hover:bg-[#ff5a52] text-white font-semibold rounded-lg transition-colors text-sm">
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Availability */}
        {step === 4 && (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-[#262626]">
              <StepDots total={4} current={3} />
              <h2 className="text-white font-bold text-xl mt-3">Tes disponibilités</h2>
              <p className="text-[#a3a3a3] text-sm mt-1">Quels jours et quels sports ?</p>
            </div>
            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              {DAYS.map(({ idx, label }) => {
                const dayData = availDays.find(d => d.day === idx)
                const isActive = !!dayData
                return (
                  <div key={idx} className={`border rounded-xl transition-colors ${isActive ? 'border-[#ff3b30]/30 bg-[#0f0f0f]' : 'border-[#262626]'}`}>
                    <div className="flex items-center gap-3 p-3">
                      <button
                        onClick={() => toggleDay(idx)}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-semibold transition-colors flex-shrink-0 ${isActive ? 'border-[#ff3b30]/50 bg-[#ff3b30]/10 text-[#ff3b30]' : 'border-[#333] text-[#5a5a5a] hover:text-white hover:border-[#404040]'}`}
                      >
                        {label}
                      </button>
                      {isActive && sports.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {sports.map(sp => {
                            const hasIt = dayData.activities.includes(sp.sport)
                            return (
                              <button
                                key={sp.sport}
                                onClick={() => setDaySports(idx, sp.sport)}
                                className={`text-xs px-2 py-1 rounded-lg border transition-colors ${hasIt ? 'border-[#ff3b30]/40 bg-[#ff3b30]/10 text-white' : 'border-[#333] text-[#5a5a5a] hover:text-white'}`}
                              >
                                {SPORT_ICONS[sp.sport]} {SPORT_LABELS[sp.sport].split(' ')[0]}
                              </button>
                            )
                          })}
                        </div>
                      )}
                      {!isActive && <span className="text-[#404040] text-xs">Repos</span>}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="p-5 border-t border-[#262626] flex justify-between">
              <button onClick={() => setStep(3)} className="text-[#a3a3a3] hover:text-white text-sm transition-colors">← Retour</button>
              <button
                onClick={handleFinish}
                disabled={generating}
                className="px-5 py-2 bg-[#ff3b30] hover:bg-[#ff5a52] disabled:opacity-60 text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                {generating ? (
                  <><span className="animate-spin">⚙️</span> Génération...</>
                ) : (
                  <>{objDate ? '🚀 Générer mon plan' : '✓ Créer mon profil'}</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
