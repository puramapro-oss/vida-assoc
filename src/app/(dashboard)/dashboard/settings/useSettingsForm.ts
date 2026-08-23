import { useEffect, useMemo, useState } from 'react'
import type { AccessibilityMode, NotificationMode, Theme } from '@/types'
import type { LangCode } from './constants'
import type { Profile } from '@/types'

interface UseSettingsFormProps {
  profile: Profile | null
  refetch: () => Promise<void>
}

export function useSettingsForm({ profile, refetch }: UseSettingsFormProps) {
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
      } catch (err) {
        console.error('localStorage access denied', err)
      }
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
      } catch (err) {
        console.error('localStorage access denied', err)
      }
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

  return {
    state: { theme, lang, notifMode, accessMode, multisensorial },
    setters: { setTheme, setLang, setNotifMode, setAccessMode, setMultisensorial },
    flags: { saving, error, success, portalLoading, dirty },
    actions: { save, openBillingPortal },
  }
}
