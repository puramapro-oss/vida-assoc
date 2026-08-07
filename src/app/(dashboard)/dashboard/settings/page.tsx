'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon, Moon, Sun, Monitor, Zap,
  Bell, Globe2, Accessibility, Save, CheckCircle2,
  LogOut, ShieldAlert, CreditCard, Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import type { AccessibilityMode, NotificationMode, Theme } from '@/types'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'

type LangCode = 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt' | 'ar' | 'zh' | 'ja' | 'ko' | 'hi' | 'ru' | 'tr' | 'nl' | 'pl' | 'sv'

const LANGS: Array<{ code: LangCode; label: string; flag: string }> = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
]

const THEMES: Array<{ id: Theme; label: string; icon: React.ReactNode; hint: string }> = [
  { id: 'dark', label: 'Sombre', icon: <Moon className="h-4 w-4" />, hint: 'Par défaut' },
  { id: 'oled', label: 'OLED', icon: <Zap className="h-4 w-4" />, hint: 'Noir absolu, économe' },
  { id: 'light', label: 'Clair', icon: <Sun className="h-4 w-4" />, hint: 'Mode jour' },
  { id: 'auto', label: 'Auto', icon: <Monitor className="h-4 w-4" />, hint: 'Suit le système' },
]

const NOTIF_MODES: Array<{ id: NotificationMode; label: string; description: string }> = [
  { id: 'zen',        label: 'Zen',        description: 'Uniquement l’essentiel (rituels, gains importants).' },
  { id: 'normal',     label: 'Normal',     description: 'Rythme équilibré, recommandations IA adaptées.' },
  { id: 'actif',      label: 'Actif',      description: 'Nouvelles missions, communauté, rituels, concours.' },
  { id: 'silencieux', label: 'Silencieux', description: 'Aucune notification push — retour manuel uniquement.' },
]

const ACCESS_MODES: Array<{ id: AccessibilityMode; label: string; description: string }> = [
  { id: 'standard', label: 'Standard',   description: 'Interface classique.' },
  { id: 'visuel',   label: 'Visuel',     description: 'Texte agrandi, contraste renforcé, narration.' },
  { id: 'auditif',  label: 'Auditif',    description: 'Sous-titres, retours visuels, vibrations.' },
  { id: 'moteur',   label: 'Moteur',     description: 'Boutons larges, zones de touche étendues.' },
  { id: 'enfant',   label: 'Enfant',     description: 'Vocabulaire simple, récompenses visuelles.' },
  { id: 'senior',   label: 'Senior',     description: 'Texte XXL, contrastes forts, 1 action/écran.' },
]

export default function SettingsPage() {
  const { user, profile, loading: authLoading, signOut, refetch } = useAuth()

  const [theme, setTheme] = useState<Theme>('dark')
  const [lang, setLang] = useState<LangCode>('fr')
  const [notifMode, setNotifMode] = useState<NotificationMode>('normal')
  const [accessMode, setAccessMode] = useState<AccessibilityMode>('standard')
  const [multisensorial, setMultisensorial] = useState<boolean>(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    if (!profile) return
    queueMicrotask(() => {
      setTheme(profile.theme ?? 'dark')
      setLang(((profile.lang as LangCode) ?? 'fr'))
      setNotifMode(profile.notification_mode ?? 'normal')
      setAccessMode(profile.accessibility_mode ?? 'standard')
      setMultisensorial(Boolean(profile.multisensorial_enabled))
      try {
        window.localStorage.setItem(
          'vida-multisensorial',
          profile.multisensorial_enabled ? '1' : '0'
        )
      } catch {}
    })
  }, [profile])

  const dirty = useMemo(() => {
    if (!profile) return false
    return (
      (profile.theme ?? 'dark') !== theme ||
      ((profile.lang as LangCode) ?? 'fr') !== lang ||
      (profile.notification_mode ?? 'normal') !== notifMode ||
      (profile.accessibility_mode ?? 'standard') !== accessMode ||
      Boolean(profile.multisensorial_enabled) !== multisensorial
    )
  }, [profile, theme, lang, notifMode, accessMode, multisensorial])

  async function save() {
    setError(null)
    setSuccess(false)
    setSaving(true)
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          lang,
          notification_mode: notifMode,
          accessibility_mode: accessMode,
          multisensorial_enabled: multisensorial,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Enregistrement impossible.')
      setSuccess(true)
      try {
        window.localStorage.setItem('vida-multisensorial', multisensorial ? '1' : '0')
      } catch {}
      await refetch()
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.')
    } finally {
      setSaving(false)
    }
  }

  async function openBillingPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const json = await res.json()
      if (res.ok && json.url) {
        window.location.href = json.url
        return
      }
      setError(json.error ?? 'Portail indisponible.')
    } catch {
      setError('Portail indisponible.')
    } finally {
      setPortalLoading(false)
    }
  }

  if (authLoading) {
    return <div className="mx-auto max-w-4xl py-12 text-center text-[var(--text-muted)]">Chargement des paramètres…</div>
  }

  if (!user || !profile) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <EmptyState icon="🔒" title="Connecte-toi" description="Accède à tes paramètres Sangha après connexion." />
        <Button className="mt-4" onClick={() => (window.location.href = '/login?next=/dashboard/settings')}>
          Se connecter
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-12" data-testid="settings-page">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--cyan)]/10 text-[var(--cyan)]">
          <SettingsIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold">Paramètres</h1>
          <p className="text-sm text-[var(--text-secondary)]">Apparence, langue, accessibilité, notifications et compte.</p>
        </div>
      </header>

      {/* Theme */}
      <Section title="Apparence" hint="Choisis le mode qui te fait du bien. Sangha est 100 % dark par défaut.">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {THEMES.map((t) => {
            const active = theme === t.id
            return (
              <button
                type="button"
                key={t.id}
                onClick={() => setTheme(t.id)}
                data-testid={`theme-${t.id}`}
                className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all ${
                  active
                    ? 'border-[var(--cyan)] bg-[var(--cyan)]/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${active ? 'bg-[var(--cyan)]/20 text-[var(--cyan)]' : 'bg-white/5 text-[var(--text-secondary)]'}`}>
                  {t.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{t.label}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{t.hint}</p>
                </div>
              </button>
            )
          })}
        </div>
      </Section>

      {/* Language */}
      <Section title="Langue" hint="Sangha parle 16 langues. Choisis la tienne.">
        <div className="flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-[var(--text-muted)]" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as LangCode)}
            className="w-full max-w-xs rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--cyan)] focus:outline-none"
            data-testid="lang-select"
            aria-label="Langue de l'interface"
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.label}
              </option>
            ))}
          </select>
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" hint="Sangha respecte ton rythme. Jamais entre 20 h et 9 h.">
        <div className="grid gap-3 md:grid-cols-2">
          {NOTIF_MODES.map((n) => {
            const active = notifMode === n.id
            return (
              <button
                type="button"
                key={n.id}
                onClick={() => setNotifMode(n.id)}
                data-testid={`notif-${n.id}`}
                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                  active ? 'border-[var(--cyan)] bg-[var(--cyan)]/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <Bell className={`mt-0.5 h-4 w-4 shrink-0 ${active ? 'text-[var(--cyan)]' : 'text-[var(--text-muted)]'}`} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{n.label}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{n.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </Section>

      {/* Accessibility */}
      <Section title="Accessibilité" hint="Sangha s’adapte à ta vie. Choisis le mode le plus confortable.">
        <div className="grid gap-3 md:grid-cols-2">
          {ACCESS_MODES.map((a) => {
            const active = accessMode === a.id
            return (
              <button
                type="button"
                key={a.id}
                onClick={() => setAccessMode(a.id)}
                data-testid={`access-${a.id}`}
                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                  active ? 'border-[var(--cyan)] bg-[var(--cyan)]/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <Accessibility className={`mt-0.5 h-4 w-4 shrink-0 ${active ? 'text-[var(--cyan)]' : 'text-[var(--text-muted)]'}`} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{a.label}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{a.description}</p>
                </div>
              </button>
            )
          })}
        </div>

        <label className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={multisensorial}
            onChange={(e) => setMultisensorial(e.target.checked)}
            className="mt-1 h-4 w-4 accent-[var(--cyan)]"
            data-testid="multisensorial-toggle"
          />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Expérience multisensorielle</p>
            <p className="text-xs text-[var(--text-secondary)]">Sons binauraux, vibrations douces, fréquences 432 Hz pendant les rituels.</p>
          </div>
        </label>
      </Section>

      {/* Save bar */}
      <motion.div
        initial={false}
        animate={{ opacity: dirty ? 1 : 0, y: dirty ? 0 : 8, pointerEvents: dirty ? 'auto' : 'none' }}
        className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[var(--bg-nebula)]/90 p-3 backdrop-blur-xl"
      >
        <div className="text-xs text-[var(--text-secondary)]">
          {error ? <span className="text-red-300">{error}</span> : success ? <span className="flex items-center gap-1 text-[var(--green)]"><CheckCircle2 className="h-3.5 w-3.5" /> Enregistré</span> : 'Tu as des changements non enregistrés.'}
        </div>
        <Button onClick={save} loading={saving} disabled={!dirty || saving} icon={<Save className="h-4 w-4" />} data-testid="settings-save">
          Enregistrer
        </Button>
      </motion.div>

      {/* Account */}
      <Section title="Compte" hint="Gère ton abonnement et ta session.">
        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={openBillingPortal}
            disabled={portalLoading || profile.plan === 'free'}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-[var(--cyan)]/50 disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="billing-portal"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-[var(--cyan)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Abonnement</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {profile.plan === 'free' ? 'Aucun abo actif — active Sangha One dès 3 €/mois.' : `Gérer ton abonnement ${profile.plan.toUpperCase()}`}
                </p>
              </div>
            </div>
            {portalLoading && <Loader2 className="h-4 w-4 animate-spin text-[var(--cyan)]" />}
          </button>

          <Link href="/pricing" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:border-[var(--cyan)]/50">
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-[#D4AF37]" />
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Changer d’offre</p>
                <p className="text-xs text-[var(--text-secondary)]">Free · Sangha One · Sangha Premium</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="ghost" icon={<LogOut className="h-4 w-4" />} onClick={signOut} data-testid="logout-btn">
            Déconnexion
          </Button>
        </div>
      </Section>

      {/* Danger zone */}
      <Section title="Zone sensible" hint="Tes données t’appartiennent.">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-300" />
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Exporter ou supprimer mes données</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Écris à <a href="mailto:matiss.frasne@gmail.com?subject=Sangha%20-%20Droit%20RGPD" className="underline decoration-red-300/60 hover:text-red-300">matiss.frasne@gmail.com</a> avec l’objet « Sangha - Droit RGPD ». Ton profil et toutes tes données sont retirés sous 30 jours, conformément à l’article 17 du RGPD.
              </p>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">{title}</h2>
        {hint && <p className="text-xs text-[var(--text-muted)] md:max-w-sm md:text-right">{hint}</p>}
      </div>
      {children}
    </section>
  )
}
