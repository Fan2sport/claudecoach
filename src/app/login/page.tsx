'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push('/calendar')
    router.refresh()
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl tracking-wider text-white mb-1">ATHLETEX</h1>
          <p className="text-[#a3a3a3] text-sm">Coaching multi-sports personnalisé</p>
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
          <h2 className="text-white font-semibold text-lg mb-5">Connexion</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="••••••••"
                required
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-[#404040] focus:outline-none focus:border-[#ff3b30] transition-colors"
              />
            </div>
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-[#a3a3a3] hover:text-white transition-colors">
                Mot de passe oublié ?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff3b30] hover:bg-[#ff5a52] disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-[#a3a3a3] text-sm mt-4">
            Pas de compte ?{' '}
            <Link href="/signup" className="text-[#ff3b30] hover:text-[#ff5a52] font-medium transition-colors">
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
