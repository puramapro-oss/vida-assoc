'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Heart, Sparkles, Send, Loader2, Trophy, HandHeart, MessageCircle, Award,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { getInitials } from '@/lib/utils'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import type { CommunityPost, Profile } from '@/types'

type AuthorLite = Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'level' | 'consciousness_level'>

type PostRow = Omit<CommunityPost, 'author'> & {
  author: AuthorLite | null
  liked: boolean
}

type PostType = 'text' | 'victory' | 'gratitude' | 'question'

const TYPE_META: Record<PostType, { label: string; icon: React.ReactNode; color: string }> = {
  text:      { label: 'Partage',   icon: <Sparkles className="h-3.5 w-3.5" />,     color: 'text-[var(--cyan)]' },
  victory:   { label: 'Victoire',  icon: <Trophy className="h-3.5 w-3.5" />,       color: 'text-amber-300' },
  gratitude: { label: 'Gratitude', icon: <HandHeart className="h-3.5 w-3.5" />,    color: 'text-pink-300' },
  question:  { label: 'Question',  icon: <MessageCircle className="h-3.5 w-3.5" />, color: 'text-sky-300' },
}

function formatAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'à l’instant'
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `il y a ${d} j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function CommunityPage() {
  const { user, profile } = useAuth()
  const [posts, setPosts] = useState<PostRow[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [type, setType] = useState<PostType>('text')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const sb = createClient()
    ;(async () => {
      const { data: raw } = await sb
        .from('community_posts')
        .select('id, user_id, content, type, media_url, mission_id, likes_count, comments_count, hidden, created_at')
        .eq('hidden', false)
        .order('created_at', { ascending: false })
        .limit(50)

      const base = ((raw as CommunityPost[] | null) ?? []).map<PostRow>((p) => ({ ...p, liked: false, author: null }))

      if (base.length > 0) {
        const userIds = Array.from(new Set(base.map((p) => p.user_id)))
        const { data: authors } = await sb
          .from('profiles')
          .select('id, full_name, avatar_url, level, consciousness_level')
          .in('id', userIds)
        const authorMap = new Map(
          ((authors as Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'level' | 'consciousness_level'>[] | null) ?? [])
            .map((a) => [a.id, a]),
        )
        base.forEach((p) => {
          p.author = authorMap.get(p.user_id) ?? null
        })
      }

      if (user && base.length > 0) {
        const ids = base.map((r) => r.id)
        const { data: likes } = await sb
          .from('community_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', ids)
        const likedSet = new Set(((likes as { post_id: string }[] | null) ?? []).map((l) => l.post_id))
        base.forEach((r) => {
          r.liked = likedSet.has(r.id)
        })
      }

      setPosts(base)
      setLoading(false)
    })()
  }, [user])

  const canPost = useMemo(() => !!user && content.trim().length >= 2, [user, content])

  async function submit() {
    if (!canPost || posting) return
    setError(null)
    setPosting(true)
    try {
      const res = await fetch('/api/community/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), type }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Publication impossible.')
      const newPost: PostRow = {
        ...(json.post as CommunityPost),
        liked: false,
        author: profile
          ? {
              id: profile.id,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              level: profile.level,
              consciousness_level: profile.consciousness_level,
            }
          : null,
      }
      setPosts((prev) => [newPost, ...prev])
      setContent('')
      setType('text')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.')
    } finally {
      setPosting(false)
    }
  }

  async function toggleLike(post: PostRow) {
    if (!user) {
      window.location.href = '/login?next=/dashboard/communaute'
      return
    }
    const next = !post.liked
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, liked: next, likes_count: (p.likes_count ?? 0) + (next ? 1 : -1) } : p)),
    )
    try {
      const res = await fetch(`/api/community/${post.id}/like`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur like')
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, liked: json.liked, likes_count: json.likes_count } : p)),
      )
    } catch {
      // rollback
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, liked: post.liked, likes_count: post.likes_count } : p)),
      )
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12" data-testid="community-page">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--cyan)]/10 text-[var(--cyan)]">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold">Communauté</h1>
          <p className="text-sm text-[var(--text-secondary)]">Un espace d’amour — victoires, gratitude, entraide. 0 toxicité.</p>
        </div>
      </header>

      {/* Composer */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        {!user ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[var(--text-secondary)]">Connecte-toi pour partager avec la famille VIDA.</p>
            <Button size="sm" onClick={() => (window.location.href = '/login?next=/dashboard/communaute')}>
              Se connecter
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <Avatar profile={profile} />
              <div className="min-w-0 flex-1">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Partage une victoire, une gratitude, une question…"
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--cyan)] focus:outline-none"
                  data-testid="community-textarea"
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-0.5">
                    {(Object.keys(TYPE_META) as PostType[]).map((t) => {
                      const active = type === t
                      const meta = TYPE_META[t]
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setType(t)}
                          data-testid={`type-${t}`}
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-all ${active ? 'bg-white/10 text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                        >
                          <span className={active ? meta.color : ''}>{meta.icon}</span>
                          {meta.label}
                        </button>
                      )
                    })}
                  </div>
                  <Button
                    size="sm"
                    onClick={submit}
                    disabled={!canPost || posting}
                    loading={posting}
                    icon={<Send className="h-4 w-4" />}
                    data-testid="community-submit"
                  >
                    Publier
                  </Button>
                </div>
                {error && (
                  <p className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300" role="alert">
                    {error}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {/* Feed */}
      {loading ? (
        <div className="py-8 text-center text-sm text-[var(--text-muted)]">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState icon="🌿" title="Sois la première voix" description="Ton message ouvre le champ. Partage une victoire, un merci, une question." />
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {posts.map((p) => {
              const meta = TYPE_META[(p.type as PostType) ?? 'text'] ?? TYPE_META.text
              return (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5"
                  data-testid="community-post"
                >
                  <div className="flex items-start gap-3">
                    <Avatar profile={p.author ?? null} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {p.author?.full_name ?? 'Voyageur·se'}
                        </p>
                        {p.author?.level ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                            <Award className="h-3 w-3" /> Niv. {p.author.level}
                          </span>
                        ) : null}
                        <span className={`inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] ${meta.color}`}>
                          {meta.icon}
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">· {formatAgo(p.created_at)}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">{p.content}</p>
                      {p.media_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.media_url} alt="" className="mt-3 w-full rounded-2xl border border-white/10 object-cover" />
                      )}

                      <div className="mt-3 flex items-center gap-4 text-xs">
                        <button
                          type="button"
                          onClick={() => toggleLike(p)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition-colors ${p.liked ? 'bg-pink-500/10 text-pink-300' : 'text-[var(--text-muted)] hover:text-pink-300'}`}
                          data-testid="like-btn"
                        >
                          <Heart className={`h-4 w-4 ${p.liked ? 'fill-current' : ''}`} />
                          {p.likes_count ?? 0}
                        </button>
                        <span className="inline-flex items-center gap-1.5 text-[var(--text-muted)]">
                          <MessageCircle className="h-4 w-4" />
                          {p.comments_count ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}

function Avatar({
  profile,
}: {
  profile: Pick<Profile, 'full_name' | 'avatar_url'> | null | undefined
}) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--cyan)] to-[var(--purple)] text-sm font-semibold text-white">
      {profile?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.avatar_url} alt={profile.full_name ?? ''} className="h-full w-full object-cover" />
      ) : (
        getInitials(profile?.full_name ?? null)
      )}
    </div>
  )
}
