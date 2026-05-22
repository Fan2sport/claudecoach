'use client'

import { useAppStore } from '@/lib/store'
import { SPORT_LABELS } from '@/lib/utils'

export function CoachSection() {
  const { profile } = useAppStore()

  function buildContext() {
    if (!profile) return ''
    return `=== PROFIL ATHLETEX ===
Prénom: ${profile.firstName || 'Non renseigné'}
Âge: ${profile.age || '?'} ans | Poids: ${profile.weight || '?'} kg | Taille: ${profile.height || '?'} cm
FC repos: ${profile.restHR || '?'} bpm | FC max: ${profile.maxHR || '?'} bpm
${profile.ftp ? `FTP cycliste: ${profile.ftp}W` : ''}
${profile.css ? `CSS natation: ${profile.css}/100m` : ''}

Sports pratiqués: ${profile.sports?.map(s => `${SPORT_LABELS[s.sport]} (${s.level})`).join(', ') || 'Non renseigné'}

Objectifs:
${profile.objectives?.map(o => `- ${o.name} → ${o.target} (date: ${o.targetDate})${o.isPrimary ? ' ⭐ PRINCIPAL' : ''}`).join('\n') || '- Aucun objectif défini'}

${profile.injuries ? `Précautions / blessures: ${profile.injuries}` : ''}

Ma question: `
  }

  function copyContext() {
    navigator.clipboard.writeText(buildContext()).then(() => {
      window.open('https://claude.ai/new', '_blank')
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white font-semibold text-lg mb-1">Coach IA Claude</h2>
        <p className="text-[#a3a3a3] text-sm">
          Obtenez des conseils personnalisés gratuitement via Claude.ai. Votre profil est copié automatiquement.
        </p>
      </div>

      <div className="p-4 bg-[#0a0a0a] rounded-xl border border-[#262626] space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🤖</span>
          <div>
            <div className="text-white font-medium text-sm">Claude.ai — Gratuit</div>
            <div className="text-[#a3a3a3] text-xs">Aucune clé API requise</div>
          </div>
        </div>

        <div>
          <div className="text-[10px] text-[#a3a3a3] uppercase tracking-wide mb-1.5">Aperçu du contexte envoyé</div>
          <pre className="bg-[#141414] border border-[#262626] rounded-lg p-3 text-xs text-[#a3a3a3] font-data overflow-auto max-h-40 whitespace-pre-wrap">
            {buildContext() || 'Complétez votre profil pour générer le contexte...'}
          </pre>
        </div>

        <button
          onClick={copyContext}
          className="w-full py-3 bg-[#ff3b30] hover:bg-[#ff5a52] text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <span>💬</span>
          Copier le contexte et ouvrir Claude.ai
        </button>
      </div>

      <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#262626] space-y-2">
        <h3 className="text-white font-medium text-sm">Questions suggérées</h3>
        {[
          'Analyse mon profil et propose-moi des ajustements à mon plan',
          'Comment améliorer ma récupération entre les séances ?',
          'Quelles sont les erreurs courantes pour mon objectif ?',
          'Comment gérer la fatigue et la surcharge d\'entraînement ?',
          'Quels suppléments ou nutrition pour mon sport ?',
        ].map(q => (
          <button
            key={q}
            onClick={() => {
              const text = buildContext() + q
              navigator.clipboard.writeText(text).then(() => window.open('https://claude.ai/new', '_blank'))
            }}
            className="w-full text-left px-3 py-2 rounded-lg border border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#ff3b30]/30 hover:bg-[#ff3b30]/5 text-sm transition-colors"
          >
            → {q}
          </button>
        ))}
      </div>
    </div>
  )
}
