import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { SUPER_ADMIN_EMAIL } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bonjour'
  if (hour < 18) return 'Bon apres-midi'
  return 'Bonsoir'
}

export function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export function isSuperAdmin(email: string | null | undefined): boolean {
  return email === SUPER_ADMIN_EMAIL
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function timeUntil(date: string | Date): string {
  const d = new Date(date).getTime() - Date.now()
  if (d < 0) return 'Terminé'
  const days = Math.floor(d / (1000 * 60 * 60 * 24))
  const hours = Math.floor((d / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((d / (1000 * 60)) % 60)
  if (days > 0) return `dans ${days}j ${hours}h`
  if (hours > 0) return `dans ${hours}h ${minutes}min`
  return `dans ${minutes}min`
}

export function levelFromImpactScore(score: number): { id: number; name: string; emoji: string; progress: number } {
  if (score < 100) return { id: 1, name: 'Graine', emoji: '🌱', progress: score / 100 }
  if (score < 500) return { id: 2, name: 'Bâtisseur', emoji: '🪴', progress: (score - 100) / 400 }
  if (score < 2000) return { id: 3, name: 'Gardien', emoji: '🌳', progress: (score - 500) / 1500 }
  if (score < 10000) return { id: 4, name: 'Source', emoji: '💧', progress: (score - 2000) / 8000 }
  return { id: 5, name: 'Lumière', emoji: '✨', progress: 1 }
}

export function formatCredits(credits: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(credits)} crédits`
}
