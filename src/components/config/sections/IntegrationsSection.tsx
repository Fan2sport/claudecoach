'use client'

import { useState, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { parseGPX, parseTCX } from '@/lib/gpxParser'
import { SPORT_ICONS, SPORT_LABELS } from '@/lib/utils'

type Integration = {
  id: string; name: string; description: string; icon: string; available: boolean
}

const INTEGRATIONS: Integration[] = [
  { id: 'strava', name: 'Strava', description: 'Hub central — API officielle OAuth 2.0', icon: '🏃', available: false },
  { id: 'garmin', name: 'Garmin Connect', description: 'Via webhook Strava ou Connect IQ', icon: '⌚', available: false },
  { id: 'suunto', name: 'Suunto', description: 'Suunto App API OAuth 2.0', icon: '🔵', available: false },
  { id: 'coros', name: 'Coros', description: 'Recommandé via Strava', icon: '⚡', available: false },
  { id: 'polar', name: 'Polar', description: 'Polar AccessLink API OAuth 2.0', icon: '🔴', available: false },
  { id: 'wahoo', name: 'Wahoo', description: 'Wahoo Cloud API', icon: '💨', available: false },
  { id: 'apple_health', name: 'Apple Health', description: 'Via export ou app companion iOS', icon: '🍎', available: false },
  { id: 'google_fit', name: 'Google Fit', description: 'Google Fit API OAuth 2.0', icon: '🟢', available: false },
]

interface ImportResult {
  success: string[]
  errors: string[]
}

export function IntegrationsSection() {
  const { profile, addSessions } = useAppStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setImporting(true)
    setResult(null)
    const userId = profile?.id ?? 'local'
    const success: string[] = []
    const errors: string[] = []
    const sessions = []

    for (const file of Array.from(files)) {
      const text = await file.text()
      const ext = file.name.split('.').pop()?.toLowerCase()
      const res = ext === 'tcx' ? parseTCX(text, userId) : parseGPX(text, userId)
      if ('error' in res) {
        errors.push(`${file.name} : ${res.error}`)
      } else {
        sessions.push(res.session)
        const r = res.session.report
        const dist = r?.distance ? ` · ${r.distance}km` : ''
        const dur = r?.duration ? ` · ${Math.round(r.duration)}min` : ''
        success.push(`${SPORT_ICONS[res.session.sport]} ${res.session.title}${dist}${dur}`)
      }
    }

    if (sessions.length > 0) addSessions(sessions)
    setResult({ success, errors })
    setImporting(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white font-semibold text-lg mb-1">Intégrations appareils sportifs</h2>
        <p className="text-[#a3a3a3] text-sm">Connectez vos montres et applications pour importer automatiquement vos séances.</p>
      </div>

      <div className="space-y-2">
        {INTEGRATIONS.map(integration => (
          <div key={integration.id} className="flex items-center gap-4 p-4 bg-[#0a0a0a] border border-[#262626] rounded-xl">
            <span className="text-2xl flex-shrink-0">{integration.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium text-sm">{integration.name}</div>
              <div className="text-[#a3a3a3] text-xs">{integration.description}</div>
            </div>
            <span className="flex-shrink-0 px-3 py-1.5 bg-[#1a1a1a] border border-[#262626] text-[#404040] text-xs rounded-lg">
              Bientôt
            </span>
          </div>
        ))}
      </div>

      {/* Import fichier */}
      <div className="p-4 bg-[#1a1a1a] border border-[#262626] rounded-xl space-y-3">
        <div>
          <h3 className="text-white font-medium text-sm mb-1">Import de fichier d&apos;activité</h3>
          <p className="text-[#a3a3a3] text-xs">Glissez ou sélectionnez un ou plusieurs fichiers .gpx ou .tcx depuis votre montre.</p>
        </div>

        <label
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#333] rounded-xl cursor-pointer hover:border-[#ff3b30]/40 hover:bg-[#ff3b30]/5 transition-colors"
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        >
          {importing ? (
            <span className="text-[#a3a3a3] text-sm">Import en cours…</span>
          ) : (
            <>
              <span className="text-3xl mb-2">📁</span>
              <span className="text-white text-sm font-medium">Choisir des fichiers</span>
              <span className="text-[#a3a3a3] text-xs mt-1">.gpx et .tcx supportés — plusieurs fichiers à la fois</span>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".gpx,.tcx"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
        </label>

        {result && (
          <div className="space-y-2">
            {result.success.length > 0 && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                <p className="text-green-400 text-xs font-semibold mb-1">
                  {result.success.length} séance{result.success.length > 1 ? 's' : ''} importée{result.success.length > 1 ? 's' : ''} ✓
                </p>
                <ul className="space-y-0.5">
                  {result.success.map((s, i) => (
                    <li key={i} className="text-[#a3a3a3] text-xs">{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.errors.length > 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-xs font-semibold mb-1">Erreurs</p>
                <ul className="space-y-0.5">
                  {result.errors.map((e, i) => (
                    <li key={i} className="text-[#a3a3a3] text-xs">{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
