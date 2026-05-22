'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import type { UserProfile } from '@/types'
import { v4 as uuidv4 } from 'uuid'

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-[#a3a3a3] text-xs uppercase tracking-wide mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[#5a5a5a] text-xs mt-1">{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }: { value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-[#404040] focus:outline-none focus:border-[#ff3b30] transition-colors"
    />
  )
}

export function ProfileSection() {
  const { profile, setProfile, updateProfile } = useAppStore()
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    firstName: profile?.firstName ?? '',
    age: profile?.age?.toString() ?? '',
    gender: profile?.gender ?? 'male',
    height: profile?.height?.toString() ?? '',
    weight: profile?.weight?.toString() ?? '',
    restHR: profile?.restHR?.toString() ?? '',
    maxHR: profile?.maxHR?.toString() ?? '',
    ftp: profile?.ftp?.toString() ?? '',
    css: profile?.css?.toString() ?? '',
    injuries: profile?.injuries ?? '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  function handleSave() {
    const p: UserProfile = {
      id: profile?.id ?? uuidv4(),
      email: profile?.email ?? '',
      firstName: form.firstName,
      age: parseInt(form.age) || 0,
      gender: form.gender as 'male' | 'female' | 'other',
      height: parseFloat(form.height) || 0,
      weight: parseFloat(form.weight) || 0,
      restHR: parseInt(form.restHR) || 0,
      maxHR: parseInt(form.maxHR) || 0,
      ftp: form.ftp ? parseInt(form.ftp) : undefined,
      css: form.css ? form.css : undefined,
      injuries: form.injuries || undefined,
      sports: profile?.sports ?? [],
      objectives: profile?.objectives ?? [],
      availableDays: profile?.availableDays ?? [],
      equipment: profile?.equipment ?? [],
      offPeriods: profile?.offPeriods ?? [],
      createdAt: profile?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setProfile(p)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white font-semibold text-lg mb-1">Profil athlète</h2>
        <p className="text-[#a3a3a3] text-sm">Vos informations personnelles pour personnaliser les calculs.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Prénom">
          <Input value={form.firstName} onChange={v => set('firstName', v)} placeholder="ex: Thomas" />
        </Field>
        <Field label="Âge">
          <Input value={form.age} onChange={v => set('age', v)} placeholder="ex: 28" type="number" />
        </Field>
        <Field label="Sexe">
          <select
            value={form.gender}
            onChange={e => set('gender', e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#ff3b30]"
          >
            <option value="male">Homme</option>
            <option value="female">Femme</option>
            <option value="other">Non précisé</option>
          </select>
        </Field>
        <Field label="Taille (cm)">
          <Input value={form.height} onChange={v => set('height', v)} placeholder="ex: 178" type="number" />
        </Field>
        <Field label="Poids (kg)">
          <Input value={form.weight} onChange={v => set('weight', v)} placeholder="ex: 72" type="number" />
        </Field>
        <Field label="FC repos (bpm)" hint="Mesurée au réveil">
          <Input value={form.restHR} onChange={v => set('restHR', v)} placeholder="ex: 52" type="number" />
        </Field>
        <Field label="FC max (bpm)" hint="Mesurée à l'effort max">
          <Input value={form.maxHR} onChange={v => set('maxHR', v)} placeholder="ex: 190" type="number" />
        </Field>
        <Field label="FTP cycliste (W)" hint="Puissance sur 1h soutenue">
          <Input value={form.ftp} onChange={v => set('ftp', v)} placeholder="ex: 250" type="number" />
        </Field>
        <Field label="CSS natation (mm:ss/100m)" hint="Critical Swim Speed">
          <Input value={form.css} onChange={v => set('css', v)} placeholder="ex: 1:45" />
        </Field>
      </div>

      <Field label="Antécédents blessures / Précautions">
        <textarea
          value={form.injuries}
          onChange={e => set('injuries', e.target.value)}
          rows={3}
          placeholder="ex: Tendinite rotule droite, à éviter les descentes prolongées..."
          className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-[#404040] focus:outline-none focus:border-[#ff3b30] resize-none"
        />
      </Field>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-[#ff3b30] hover:bg-[#ff5a52] text-white font-semibold text-sm rounded-lg transition-colors"
        >
          Sauvegarder le profil
        </button>
        {saved && <span className="text-green-400 text-sm">✓ Profil sauvegardé</span>}
      </div>
    </div>
  )
}
