import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const category = url.searchParams.get('category')
  const difficulty = url.searchParams.get('difficulty')
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '40'), 100)

  const sb = await createServerSupabaseClient()
  let query = sb
    .from('missions')
    .select('*')
    .eq('status', 'active')
    .eq('is_public', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (category) query = query.eq('category_id', category)
  if (difficulty) query = query.eq('difficulty', difficulty)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ missions: data ?? [] })
}
