'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { ProfileSection } from './sections/ProfileSection'
import { SportsSection } from './sections/SportsSection'
import { ObjectivesSection } from './sections/ObjectivesSection'
import { EquipmentSection } from './sections/EquipmentSection'
import { AvailabilitySection } from './sections/AvailabilitySection'
import { CoachSection } from './sections/CoachSection'
import { IntegrationsSection } from './sections/IntegrationsSection'
import { OffPeriodSection } from './sections/OffPeriodSection'

const SECTIONS = [
  { id: 'profile', label: '01 — Profil', icon: '👤' },
  { id: 'sports', label: '02 — Sports & Niveau', icon: '🏅' },
  { id: 'objectives', label: '03 — Objectifs', icon: '🎯' },
  { id: 'equipment', label: '04 — Matériel', icon: '🏋️' },
  { id: 'availability', label: '05 — Disponibilités', icon: '📅' },
  { id: 'coach', label: '06 — Coach IA', icon: '🤖' },
  { id: 'integrations', label: '07 — Intégrations', icon: '🔗' },
  { id: 'offperiod', label: '08 — Indisponibilités', icon: '✈️' },
]

export function ConfigView() {
  const [activeSection, setActiveSection] = useState('profile')
  const { profile } = useAppStore()

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-white">Configuration</h1>
        <p className="text-[#a3a3a3] text-sm mt-1">Personnalisez votre profil et votre plan d&apos;entraînement</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Sidebar */}
        <div className="md:w-56 flex-shrink-0">
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-2 md:sticky md:top-20">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2.5 mb-0.5 ${
                  activeSection === s.id
                    ? 'bg-[#ff3b30]/10 text-[#ff3b30] font-medium'
                    : 'text-[#a3a3a3] hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                <span className="text-base">{s.icon}</span>
                <span className="hidden md:block">{s.label}</span>
                <span className="md:hidden">{s.label.split('—')[1]?.trim()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5">
            {activeSection === 'profile' && <ProfileSection />}
            {activeSection === 'sports' && <SportsSection />}
            {activeSection === 'objectives' && <ObjectivesSection />}
            {activeSection === 'equipment' && <EquipmentSection />}
            {activeSection === 'availability' && <AvailabilitySection />}
            {activeSection === 'coach' && <CoachSection />}
            {activeSection === 'integrations' && <IntegrationsSection />}
            {activeSection === 'offperiod' && <OffPeriodSection />}
          </div>
        </div>
      </div>
    </div>
  )
}
