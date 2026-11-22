import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { CURRENT_LEGAL_VERSIONS } from '@/lib/legal/versions'

function redirectWithoutCache(destination: URL) {
  const response = NextResponse.redirect(destination)
  response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0')
  response.headers.set('Expires', '0')
  response.headers.set('Pragma', 'no-cache')
  return response
}

function safeRedirectDestination(next: string | null, origin: string): URL {
  const fallback = new URL('/dashboard', origin)
  const hasForbiddenCharacters = (value: string) => /[\\\u0000-\u001F\u007F]/u.test(value)

  if (!next || !next.startsWith('/') || next.startsWith('//') || hasForbiddenCharacters(next)) {
    return fallback
  }

  try {
    const destination = new URL(next, origin)
    // URL normalization can turn dot segments into a leading double slash.
    // Reject encoded separators/controls in the path as well as their raw forms.
    const decodedPath = decodeURIComponent(destination.pathname)
    if (destination.origin !== origin || decodedPath.startsWith('//') || hasForbiddenCharacters(decodedPath)) {
      return fallback
    }
    return destination
  } catch {
    return fallback
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const destination = safeRedirectDestination(searchParams.get('next'), origin)
  const loginUrl = new URL('/login?error=auth_failed', origin)

  if (!code || searchParams.has('error') || searchParams.has('error_code')) {
    return redirectWithoutCache(loginUrl)
  }

  try {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return redirectWithoutCache(loginUrl)

    await recordOAuthLegalAcceptance(supabase, request)
    return redirectWithoutCache(destination)
  } catch {
    return redirectWithoutCache(loginUrl)
  }
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
