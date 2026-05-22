import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile, TrainingSession, TrainingPlan } from '@/types'

interface AppState {
  profile: UserProfile | null
  sessions: TrainingSession[]
  plan: TrainingPlan | null
  currentWeekOffset: number
  setProfile: (profile: UserProfile) => void
  updateProfile: (partial: Partial<UserProfile>) => void
  setSessions: (sessions: TrainingSession[]) => void
  addSession: (session: TrainingSession) => void
  updateSession: (id: string, updates: Partial<TrainingSession>) => void
  removeSession: (id: string) => void
  setPlan: (plan: TrainingPlan | null) => void
  setWeekOffset: (offset: number) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: null,
      sessions: [],
      plan: null,
      currentWeekOffset: 0,
      setProfile: (profile) => set({ profile }),
      updateProfile: (partial) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...partial } : null,
        })),
      setSessions: (sessions) => set({ sessions }),
      addSession: (session) =>
        set((state) => ({ sessions: [...state.sessions, session] })),
      updateSession: (id, updates) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),
      removeSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        })),
      setPlan: (plan) => set({ plan }),
      setWeekOffset: (offset) => set({ currentWeekOffset: offset }),
    }),
    {
      name: 'athletex-store',
      partialize: (state) => ({
        profile: state.profile,
        sessions: state.sessions,
        plan: state.plan,
      }),
    }
  )
)
