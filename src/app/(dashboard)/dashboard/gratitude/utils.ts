export interface GratitudeEntry {
  id: string
  content: string
  created_at: string
  user_id: string
}

export const PROMPTS = [
  'Pour quoi es-tu reconnaissant aujourd\'hui ?',
  'Qui veux-tu remercier ?',
  'Quel moment t\'a rendu heureux ?',
  'Quelle petite chose belle as-tu remarquée ?',
  'De quoi ton cœur déborde-t-il en ce moment ?',
]

export function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Aujourd\'hui'
  if (d.toDateString() === yesterday.toDateString()) return 'Hier'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function groupEntriesByDate(entries: GratitudeEntry[]): { label: string; items: GratitudeEntry[] }[] {
  const groups: Record<string, GratitudeEntry[]> = {}
  for (const entry of entries) {
    const key = new Date(entry.created_at).toDateString()
    if (!groups[key]) groups[key] = []
    groups[key].push(entry)
  }
  return Object.entries(groups).map(([, items]) => ({
    label: formatDate(items[0].created_at),
    items,
  }))
}
