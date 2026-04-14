import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

const REDIRECT = Linking.createURL("auth/callback");

export type OAuthResult =
  | { ok: true }
  | { ok: false; error: string; cancelled?: boolean };

export async function signInWithGoogle(): Promise<OAuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: REDIRECT,
        skipBrowserRedirect: true,
      },
    });
    if (error || !data?.url) {
      return { ok: false, error: error?.message ?? "Lien Google indisponible." };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT, {
      showInRecents: false,
    });

    if (result.type === "cancel" || result.type === "dismiss") {
      return { ok: false, error: "Connexion Google annulée.", cancelled: true };
    }

    if (result.type !== "success" || !result.url) {
      return { ok: false, error: "La connexion Google a échoué." };
    }

    const parsed = Linking.parse(result.url);
    const params = (parsed.queryParams ?? {}) as Record<string, string | string[]>;
    const code = readParam(params.code);

    if (code) {
      const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
      if (exErr) return { ok: false, error: exErr.message };
      return { ok: true };
    }

    const fragment = result.url.split("#")[1] ?? "";
    if (fragment) {
      const frag = Object.fromEntries(
        fragment
          .split("&")
          .map((p) => p.split("="))
          .filter((kv) => kv.length === 2)
          .map(([k, v]) => [decodeURIComponent(k), decodeURIComponent(v)])
      );
      const accessToken = frag.access_token;
      const refreshToken = frag.refresh_token;
      if (accessToken && refreshToken) {
        const { error: setErr } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (setErr) return { ok: false, error: setErr.message };
        return { ok: true };
      }
    }

    return { ok: false, error: "Aucun jeton reçu de Google." };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur inattendue Google.",
    };
  }
}

function readParam(value: string | string[] | undefined): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}
