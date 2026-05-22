'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import type { UserProfile, TrainingSession, TrainingPlan } from '@/types'

export function useSupabaseSync() {
  const supabase = createClient()
  const store = useAppStore()
  const userId = useRef<string | null>(null)
  // Track last-synced JSON to avoid saving data we just loaded from DB
  const lastSynced = useRef({ profile: '', sessions: '', plan: '' })

  // Load all data from Supabase on mount
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      userId.current = user.id

      const [profileRes, sessionsRes, planRes] = await Promise.all([
        supabase.from('profiles').select('data').eq('id', user.id).maybeSingle(),
        supabase.from('training_sessions').select('data').eq('user_id', user.id),
        supabase
          .from('training_plans')
          .select('data')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1),
      ])

      if (profileRes.data) {
        lastSynced.current.profile = JSON.stringify(profileRes.data.data)
        store.setProfile(profileRes.data.data as UserProfile)
      }

      if (sessionsRes.data) {
        const sessions = sessionsRes.data.map(r => r.data as TrainingSession)
        lastSynced.current.sessions = JSON.stringify(sessions)
        store.setSessions(sessions)
      }

      if (planRes.data && planRes.data.length > 0) {
        lastSynced.current.plan = JSON.stringify(planRes.data[0].data)
        store.setPlan(planRes.data[0].data as TrainingPlan)
      }
    }

    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync profile → Supabase (debounced 800ms)
  useEffect(() => {
    if (!userId.current || !store.profile) return
    const json = JSON.stringify(store.profile)
    if (json === lastSynced.current.profile) return
    lastSynced.current.profile = json

    const uid = userId.current
    const snapshot = store.profile
    const timer = setTimeout(async () => {
      await supabase.from('profiles').upsert({
        id: uid,
        data: snapshot,
        updated_at: new Date().toISOString(),
      })
    }, 800)
    return () => clearTimeout(timer)
  }, [store.profile]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync sessions → Supabase (debounced 800ms)
  useEffect(() => {
    if (!userId.current) return
    const json = JSON.stringify(store.sessions)
    if (json === lastSynced.current.sessions) return
    lastSynced.current.sessions = json

    const uid = userId.current
    const snapshot = [...store.sessions]
    const timer = setTimeout(async () => {
      // Upsert all current sessions, then delete any removed ones
      if (snapshot.length > 0) {
        await supabase.from('training_sessions').upsert(
          snapshot.map(s => ({
            id: s.id,
            user_id: uid,
            data: s,
            date: s.date,
            updated_at: new Date().toISOString(),
          }))
        )
      }
      // Delete sessions no longer in the store
      const currentIds = snapshot.map(s => s.id)
      const { data: dbRows } = await supabase
        .from('training_sessions')
        .select('id')
        .eq('user_id', uid)
      if (dbRows) {
        const toDelete = dbRows.map(r => r.id).filter(id => !currentIds.includes(id))
        if (toDelete.length > 0) {
          await supabase.from('training_sessions').delete().in('id', toDelete)
        }
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [store.sessions]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync plan → Supabase (debounced 800ms)
  useEffect(() => {
    if (!userId.current) return
    const json = JSON.stringify(store.plan)
    if (json === lastSynced.current.plan) return
    lastSynced.current.plan = json

    const uid = userId.current
    const snapshot = store.plan
    const timer = setTimeout(async () => {
      if (snapshot) {
        await supabase.from('training_plans').upsert({
          id: snapshot.id,
          user_id: uid,
          data: snapshot,
          updated_at: new Date().toISOString(),
        })
      } else {
        await supabase.from('training_plans').delete().eq('user_id', uid)
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [store.plan]) // eslint-disable-line react-hooks/exhaustive-deps
}
