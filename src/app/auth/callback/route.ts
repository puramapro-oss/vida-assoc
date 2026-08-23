import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { CURRENT_LEGAL_VERSIONS } from '@/lib/legal/versions'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      await recordOAuthLegalAcceptance(supabase, request)
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_failed', origin))
}

/**
 * Preuve d'acceptation CGU/CGV/confidentialité pour un compte créé via Google OAuth (le
 * parcours email le fait déjà, cf signup/page.tsx). Le clic "Continuer avec Google" est
 * l'équivalent du clic "Créer mon compte" côté email (même `LegalAcceptanceNotice`, zéro
 * case à cocher). N'écrit QUE si l'utilisateur n'a encore AUCUNE acceptation enregistrée —
 * une reconnexion OAuth ultérieure ne doit jamais ré-écrire silencieusement une acceptation
 * après un bump de version : c'est le rôle explicite de LegalReacceptanceGate (clic "J'ai
 * lu, je continue"). Best-effort : ne bloque jamais la redirection post-login.
 */
async function recordOAuthLegalAcceptance(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  request: NextRequest
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { count } = await supabase
      .from('legal_acceptances')
      .select('doc_type', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if (count) return

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
    const userAgent = request.headers.get('user-agent')

    await Promise.all(
      (['cgu', 'cgv', 'confidentialite'] as const).map((docType) =>
        supabase.from('legal_acceptances').upsert(
          {
            user_id: user.id,
            doc_type: docType,
            version: CURRENT_LEGAL_VERSIONS[docType],
            accepted_at: new Date().toISOString(),
            ip,
            user_agent: userAgent,
          },
          { onConflict: 'user_id,doc_type' }
        )
      )
    )
  } catch {
    // Table pas encore migrée (CONFORMITE.md point 3/8) ou erreur réseau — jamais bloquant.
  }
}
