'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  User, MapPin, ImageIcon, Save, CheckCircle2, Mail,
  Sparkles, Trophy, Flame, Heart, Share2, Settings,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice, getInitials, levelFromImpactScore } from '@/lib/utils'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'

type FormState = {
  full_name: string
  avatar_url: string
  city: string
  country: string
  region: string
}

export default function ProfilePage() {
  const { user, profile, loading: authLoading, refetch } = useAuth()

  const [form, setForm] = useState<FormState>({
    full_name: '',
    avatar_url: '',
    city: '',
    country: '',
    region: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!profile) return
    setForm({
      full_name: profile.full_name ?? '',
      avatar_url: profile.avatar_url ?? '',
      city: profile.city ?? '',
      country: profile.country ?? '',
      region: profile.region ?? '',
    })
  }, [profile])

  const level = useMemo(() => levelFromImpactScore(profile?.impact_score ?? 0), [profile?.impact_score])

  const initial: FormState = useMemo(
    () => ({
      full_name: profile?.full_name ?? '',
      avatar_url: profile?.avatar_url ?? '',
      city: profile?.city ?? '',
      country: profile?.country ?? '',
      region: profile?.region ?? '',
    }),
    [profile],
  )

  const dirty = useMemo(
    () =>
      form.full_name !== initial.full_name ||
      form.avatar_url !== initial.avatar_url ||
      form.city !== initial.city ||
      form.country !== initial.country ||
      form.region !== initial.region,
    [form, initial],
  )

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (!form.full_name.trim()) {
      setError('Ton nom est requis.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          avatar_url: form.avatar_url.trim(),
          city: form.city.trim(),
          country: form.country.trim(),
          region: form.region.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Enregistrement impossible.')
      setSuccess(true)
      await refetch()
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return <div className="mx-auto max-w-5xl py-12 text-center text-[var(--text-muted)]">Chargement du profil…</div>
  }

  if (!user || !profile) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <EmptyState icon="🔒" title="Connecte-toi" description="Accède à ton profil VIDA après connexion." />
        <Button className="mt-4" onClick={() => (window.location.href = '/login?next=/dashboard/profile')}>
          Se connecter
        </Button>
      </div>
    )
  }

  const stats: Array<{ icon: React.ReactNode; label: string; value: string }> = [
    { icon: <Trophy className="h-4 w-4" />, label: 'Missions', value: String(profile.total_missions_completed ?? 0) },
    { icon: <Heart className="h-4 w-4" />, label: 'Dons', value: formatPrice(profile.total_donated_cents ?? 0) },
    { icon: <Sparkles className="h-4 w-4" />, label: 'Impact', value: String(profile.impact_score ?? 0) },
    { icon: <Flame className="h-4 w-4" />, label: 'Streak', value: `${profile.streak_days ?? 0} j` },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10" data-testid="profile-page">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[var(--cyan)]/10 via-transparent to-[var(--purple)]/10 p-6 md:p-8"
      >
        <div className="absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.25),transparent_60%)]" />
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[var(--cyan)] to-[var(--purple)]">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.full_name ?? 'avatar'} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                {getInitials(profile.full_name ?? profile.email)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold">
              {profile.full_name ?? 'Voyageur'}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
              <Mail className="h-3.5 w-3.5" /> {profile.email}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-[var(--text-primary)]">
                <span>{level.emoji}</span> Niveau {level.id} · {level.name}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs font-medium text-[#D4AF37]">
                ✨ {profile.plan.toUpperCase()}
              </span>
              {profile.city && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-[var(--text-secondary)]">
                  <MapPin className="h-3 w-3" /> {profile.city}
                  {profile.country ? `, ${profile.country}` : ''}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <Link href="/dashboard/settings">
              <Button variant="secondary" size="sm" icon={<Settings className="h-4 w-4" />}>
                Paramètres
              </Button>
            </Link>
            <Link href="/dashboard/referral">
              <Button size="sm" icon={<Share2 className="h-4 w-4" />}>
                Partager
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                {s.icon}
                <span className="text-[10px] uppercase tracking-wide">{s.label}</span>
              </div>
              <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{s.value}</p>
            </div>
          ))}
        </div>
      </motion.header>

      {/* Edit form */}
      <section>
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-xl font-semibold">Informations</h2>
        <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6" noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nom public" icon={<User className="h-3.5 w-3.5" />}>
              <input
                type="text"
                required
                maxLength={80}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="input-field"
                placeholder="Ton prénom ou pseudo"
                data-testid="profile-fullname"
              />
            </Field>

            <Field label="URL avatar (facultatif)" icon={<ImageIcon className="h-3.5 w-3.5" />}>
              <input
                type="url"
                maxLength={500}
                value={form.avatar_url}
                onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                className="input-field"
                placeholder="https://…"
                data-testid="profile-avatar"
              />
            </Field>

            <Field label="Ville" icon={<MapPin className="h-3.5 w-3.5" />}>
              <input
                type="text"
                maxLength={80}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="input-field"
                placeholder="Paris"
                data-testid="profile-city"
              />
            </Field>

            <Field label="Pays" icon={<MapPin className="h-3.5 w-3.5" />}>
              <input
                type="text"
                maxLength={80}
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="input-field"
                placeholder="France"
                data-testid="profile-country"
              />
            </Field>

            <Field label="Région (facultatif)" icon={<MapPin className="h-3.5 w-3.5" />}>
              <input
                type="text"
                maxLength={80}
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="input-field"
                placeholder="Île-de-France"
                data-testid="profile-region"
              />
            </Field>
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="flex items-center gap-2 rounded-lg border border-[var(--green)]/30 bg-[var(--green)]/10 p-2 text-xs text-[var(--green)]" role="status">
              <CheckCircle2 className="h-4 w-4" /> Profil enregistré.
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button type="submit" loading={saving} disabled={!dirty || saving} icon={<Save className="h-4 w-4" />} data-testid="profile-save">
              Enregistrer
            </Button>
          </div>
        </form>
      </section>

      <style jsx>{`
        .input-field {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background-color: rgba(255, 255, 255, 0.04);
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: var(--text-primary);
          outline: none;
          transition: border-color 120ms ease;
        }
        .input-field:focus {
          border-color: var(--cyan);
        }
      `}</style>
    </div>
  )
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
        {icon}
        {label}
      </span>
      {children}
    </label>
  )
}
