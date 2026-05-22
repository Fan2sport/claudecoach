'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import { ConfidenceChip } from '@/components/overview/ConfidenceChip'
import { calculateConfidenceScore } from '@/lib/utils'
import { useSupabaseSync } from '@/hooks/useSupabaseSync'

const NAV_ITEMS = [
  { href: '/calendar', label: 'Calendrier', icon: '📅' },
  { href: '/overview', label: 'Vue d\'ensemble', icon: '📊' },
  { href: '/simulator', label: 'Simulateur', icon: '🧮' },
  { href: '/history', label: 'Historique', icon: '📜' },
  { href: '/config', label: 'Configuration', icon: '⚙️' },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, sessions, plan } = useAppStore()
  useSupabaseSync()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const primaryObjective = profile?.objectives?.find(o => o.isPrimary) ?? profile?.objectives?.[0]
  const now = new Date()

  const plannedSessions = sessions.filter(s => new Date(s.date) <= now).length
  const completedSessions = sessions.filter(s => s.completed && new Date(s.date) <= now).length
  const actualVolume = sessions.filter(s => s.completed).reduce((acc, s) => acc + (s.report?.distance ?? s.plannedDuration ?? 0), 0)
  const targetVolume = sessions.reduce((acc, s) => acc + (s.plannedDistance ?? s.plannedDuration ?? 0), 0)
  const qualitySessions = sessions.filter(s => s.completed && ['intervals', 'vo2max', 'tempo', 'race_sim'].includes(s.type)).length
  const plannedQuality = sessions.filter(s => ['intervals', 'vo2max', 'tempo', 'race_sim'].includes(s.type)).length
  const totalDays = plan ? Math.max(1, Math.round((new Date(plan.endDate).getTime() - new Date(plan.startDate).getTime()) / 86400000)) : 365
  const daysRemaining = primaryObjective ? Math.max(0, Math.round((new Date(primaryObjective.targetDate).getTime() - now.getTime()) / 86400000)) : 365

  const confidence = calculateConfidenceScore({ completedSessions, plannedSessions, actualVolume, targetVolume, qualitySessions, plannedQuality, daysRemaining, totalDays })

  return (
    <div className="flex flex-col min-h-screen gradient-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#262626]">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/calendar" className="font-display text-2xl tracking-wider text-white hover:text-[#ff3b30] transition-colors flex-shrink-0">
            ATHLETEX
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(item.href)
                    ? 'bg-[#ff3b30]/10 text-[#ff3b30]'
                    : 'text-[#a3a3a3] hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {primaryObjective && (
              <div className="hidden sm:block" suppressHydrationWarning>
                <ConfidenceChip score={confidence.overall} status={confidence.status} />
              </div>
            )}
            {profile?.firstName && (
              <span className="hidden md:block text-sm text-[#a3a3a3]" suppressHydrationWarning>
                {profile.firstName}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-xs text-[#a3a3a3] hover:text-white border border-[#262626] hover:border-[#404040] px-3 py-1.5 rounded-lg transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-[#262626]">
        <div className="flex">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
                pathname.startsWith(item.href)
                  ? 'text-[#ff3b30]'
                  : 'text-[#a3a3a3]'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="hidden xs:block">{item.label.split(' ')[0]}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
