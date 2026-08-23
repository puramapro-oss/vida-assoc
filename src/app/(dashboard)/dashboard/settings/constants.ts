import { Moon, Sun, Monitor, Zap } from 'lucide-react'
import type { AccessibilityMode, NotificationMode, Theme } from '@/types'

export type LangCode = 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt' | 'ar' | 'zh' | 'ja' | 'ko' | 'hi' | 'ru' | 'tr' | 'nl' | 'pl' | 'sv'

export const LANGS: Array<{ code: LangCode; label: string; flag: string }> = [
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

export const THEMES: Array<{ id: Theme; label: string; icon: React.ReactNode; hint: string }> = [
  { id: 'dark', label: 'Sombre', icon: <Moon className="h-4 w-4" />, hint: 'Par défaut' },
  { id: 'oled', label: 'OLED', icon: <Zap className="h-4 w-4" />, hint: 'Noir absolu, économe' },
  { id: 'light', label: 'Clair', icon: <Sun className="h-4 w-4" />, hint: 'Mode jour' },
  { id: 'auto', label: 'Auto', icon: <Monitor className="h-4 w-4" />, hint: 'Suit le système' },
]

export const NOTIF_MODES: Array<{ id: NotificationMode; label: string; description: string }> = [
  { id: 'zen',        label: 'Zen',        description: 'Uniquement l'essentiel (rituels, gains importants).' },
  { id: 'normal',     label: 'Normal',     description: 'Rythme équilibré, recommandations IA adaptées.' },
  { id: 'actif',      label: 'Actif',      description: 'Nouvelles missions, communauté, rituels, concours.' },
  { id: 'silencieux', label: 'Silencieux', description: 'Aucune notification push — retour manuel uniquement.' },
]

export const ACCESS_MODES: Array<{ id: AccessibilityMode; label: string; description: string }> = [
  { id: 'standard', label: 'Standard',   description: 'Interface classique.' },
  { id: 'visuel',   label: 'Visuel',     description: 'Texte agrandi, contraste renforcé, narration.' },
  { id: 'auditif',  label: 'Auditif',    description: 'Sous-titres, retours visuels, vibrations.' },
  { id: 'moteur',   label: 'Moteur',     description: 'Boutons larges, zones de touche étendues.' },
  { id: 'enfant',   label: 'Enfant',     description: 'Vocabulaire simple, récompenses visuelles.' },
  { id: 'senior',   label: 'Senior',     description: 'Texte XXL, contrastes forts, 1 action/écran.' },
]
