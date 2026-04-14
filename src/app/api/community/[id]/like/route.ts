import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 10

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: postId } = await params
  if (!/^[0-9a-f-]{36}$/i.test(postId)) {
    return NextResponse.json({ error: 'Identifiant de publication invalide.' }, { status: 400 })
  }

  const sb = await createServerSupabaseClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const admin = createServiceClient()

  const { data: existing } = await admin
    .from('community_likes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle()

  const { data: post, error: postErr } = await admin
    .from('community_posts')
    .select('id, likes_count, hidden')
    .eq('id', postId)
    .single()

  if (postErr || !post || post.hidden) {
    return NextResponse.json({ error: 'Publication introuvable.' }, { status: 404 })
  }

  if (existing) {
    await admin.from('community_likes').delete().eq('user_id', user.id).eq('post_id', postId)
    const next = Math.max(0, (post.likes_count ?? 0) - 1)
    await admin.from('community_posts').update({ likes_count: next }).eq('id', postId)
    return NextResponse.json({ ok: true, liked: false, likes_count: next })
  }

  await admin.from('community_likes').insert({ user_id: user.id, post_id: postId })
  const next = (post.likes_count ?? 0) + 1
  await admin.from('community_posts').update({ likes_count: next }).eq('id', postId)
  return NextResponse.json({ ok: true, liked: true, likes_count: next })
}
