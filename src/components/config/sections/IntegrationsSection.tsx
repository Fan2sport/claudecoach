'use client'

type Integration = {
  id: string
  name: string
  description: string
  icon: string
  available: boolean
  oauthUrl?: string
}

const INTEGRATIONS: Integration[] = [
  { id: 'strava', name: 'Strava', description: 'Hub central — API officielle OAuth 2.0', icon: '🏃', available: true },
  { id: 'garmin', name: 'Garmin Connect', description: 'Via webhook Strava ou Connect IQ', icon: '⌚', available: false },
  { id: 'suunto', name: 'Suunto', description: 'Suunto App API OAuth 2.0', icon: '🔵', available: false },
  { id: 'coros', name: 'Coros', description: 'Recommandé via Strava', icon: '⚡', available: false },
  { id: 'polar', name: 'Polar', description: 'Polar AccessLink API OAuth 2.0', icon: '🔴', available: false },
  { id: 'wahoo', name: 'Wahoo', description: 'Wahoo Cloud API', icon: '💨', available: false },
  { id: 'apple_health', name: 'Apple Health', description: 'Via export ou app companion iOS', icon: '🍎', available: false },
  { id: 'google_fit', name: 'Google Fit', description: 'Google Fit API OAuth 2.0', icon: '🟢', available: false },
  { id: 'manual', name: 'Import manuel', description: 'Upload de fichiers .gpx, .tcx, .fit', icon: '📁', available: true },
]

export function IntegrationsSection() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white font-semibold text-lg mb-1">Intégrations appareils sportifs</h2>
        <p className="text-[#a3a3a3] text-sm">Connectez vos montres et applications pour importer automatiquement vos séances.</p>
      </div>

      <div className="space-y-2">
        {INTEGRATIONS.map(integration => (
          <div
            key={integration.id}
            className="flex items-center gap-4 p-4 bg-[#0a0a0a] border border-[#262626] rounded-xl"
          >
            <span className="text-2xl flex-shrink-0">{integration.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium text-sm">{integration.name}</div>
              <div className="text-[#a3a3a3] text-xs">{integration.description}</div>
            </div>
            {integration.available ? (
              <button className="flex-shrink-0 px-3 py-1.5 bg-[#ff3b30]/10 border border-[#ff3b30]/30 text-[#ff3b30] text-xs font-medium rounded-lg hover:bg-[#ff3b30]/20 transition-colors">
                Connecter
              </button>
            ) : (
              <span className="flex-shrink-0 px-3 py-1.5 bg-[#1a1a1a] border border-[#262626] text-[#404040] text-xs rounded-lg">
                Bientôt
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 bg-[#1a1a1a] border border-[#262626] rounded-xl">
        <h3 className="text-white font-medium text-sm mb-2">Import manuel de fichier</h3>
        <p className="text-[#a3a3a3] text-xs mb-3">Glissez-déposez ou sélectionnez un fichier .gpx, .tcx, ou .fit</p>
        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#333] rounded-xl cursor-pointer hover:border-[#ff3b30]/40 hover:bg-[#ff3b30]/5 transition-colors">
          <span className="text-3xl mb-2">📁</span>
          <span className="text-white text-sm font-medium">Choisir un fichier</span>
          <span className="text-[#a3a3a3] text-xs mt-1">.gpx, .tcx, .fit supportés</span>
          <input type="file" accept=".gpx,.tcx,.fit" className="hidden" />
        </label>
      </div>
    </div>
  )
}
