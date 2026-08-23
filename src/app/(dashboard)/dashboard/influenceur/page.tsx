'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { ApplyForm, InfluencerDashboard } from './components'

interface InfluencerRow {
  id: string
  promo_code: string
  promo_link: string
  bio: string | null
  social_links: Record<string, string>
  approved: boolean
  total_clicks: number
  total_conversions: number
  total_earned_cents: number
  created_at: string
}

export default function InfluencerPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [influencer, setInfluencer] = useState<InfluencerRow | null>(null)
  const [loading, setLoading] = useState(true)

  // Apply form state
  const [code, setCode] = useState('')
  const [bio, setBio] = useState('')
  const [instagram, setInstagram] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [youtube, setYoutube] = useState('')
  const [website, setWebsite] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      queueMicrotask(() => setLoading(false))
      return
    }
    const sb = createClient()
    ;(async () => {
      const { data } = await sb
        .from('influencers')
        .select('id, promo_code, promo_link, bio, social_links, approved, total_clicks, total_conversions, total_earned_cents, created_at')
        .eq('user_id', user.id)
        .maybeSingle()
      setInfluencer((data as InfluencerRow | null) ?? null)
      setLoading(false)
    })()
  }, [user])

  const suggestion = useMemo(() => {
    const base = profile?.full_name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ?? ''
    if (base.length >= 3) return base.slice(0, 20)
    const fromEmail = user?.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ?? ''
    return fromEmail.slice(0, 20) || 'vida-creator'
  }, [profile?.full_name, user?.email])

  useEffect(() => {
    if (!influencer && !code) queueMicrotask(() => setCode(suggestion))
  }, [influencer, suggestion, code])

  async function submitApply() {
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/influencer/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promo_code: code,
          bio,
          instagram,
          tiktok,
          youtube,
          website,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Inscription impossible.')
      setInfluencer(json.influencer as InfluencerRow)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return <div className="mx-auto max-w-5xl py-12 text-center text-[var(--text-muted)]">Chargement…</div>
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <EmptyState icon="🔒" title="Connecte-toi" description="Deviens créateur Sangha après connexion." />
        <Button className="mt-4" onClick={() => (window.location.href = '/login?next=/dashboard/influenceur')}>
          Se connecter
        </Button>
      </div>
    )
  }

  if (!influencer) {
    return (
      <ApplyForm
        code={code}
        setCode={setCode}
        bio={bio}
        setBio={setBio}
        instagram={instagram}
        setInstagram={setInstagram}
        tiktok={tiktok}
        setTiktok={setTiktok}
        youtube={youtube}
        setYoutube={setYoutube}
        website={website}
        setWebsite={setWebsite}
        submitting={submitting}
        error={error}
        onSubmit={submitApply}
      />
    )
  }

  return <InfluencerDashboard influencer={influencer} />
}
