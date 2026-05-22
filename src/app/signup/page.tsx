'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (password.length < 8) { setError('Le mot de passe doit faire au moins 8 caractères.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-white font-semibold text-xl mb-2">Compte créé !</h2>
          <p className="text-[#a3a3a3] text-sm mb-6">Vérifiez votre email pour confirmer votre inscription.</p>
          <Link href="/login" className="text-[#ff3b30] hover:text-[#ff5a52] font-medium">
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl tracking-wider text-white mb-1">ATHLETEX</h1>
          <p className="text-[#a3a3a3] text-sm">Créez votre compte gratuit</p>
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
          <h2 className="text-white font-semibold text-lg mb-5">Inscription</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-[#a3a3a3] text-xs mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ex: john@example.com"
                required
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-[#404040] focus:outline-none focus:border-[#ff3b30] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[#a3a3a3] text-xs mb-1.5 uppercase tracking-wide">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="min. 8 caractères"
                required
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-[#404040] focus:outline-none focus:border-[#ff3b30] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[#a3a3a3] text-xs mb-1.5 uppercase tracking-wide">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-[#404040] focus:outline-none focus:border-[#ff3b30] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff3b30] hover:bg-[#ff5a52] disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-center text-[#a3a3a3] text-sm mt-4">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-[#ff3b30] hover:text-[#ff5a52] font-medium transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
