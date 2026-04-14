import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: string | null;
  role: string | null;
  vida_credits: number | null;
  wallet_balance_cents: number | null;
  impact_score: number | null;
  total_missions_completed: number | null;
  streak_days: number | null;
  onboarded: boolean | null;
  tutorial_completed: boolean | null;
  consciousness_level: string | null;
  referral_code: string | null;
};

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  hydrated: boolean;
  setSession: (s: Session | null) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useAuth = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: false,
  hydrated: false,
  setSession: (session) => {
    set({ session, user: session?.user ?? null });
    if (session?.user) void get().refreshProfile();
    else set({ profile: null });
  },
  refreshProfile: async () => {
    const user = get().user;
    if (!user) return;
    const { data } = await supabase
      .schema("vida_assoc")
      .from("profiles")
      .select(
        "id,email,full_name,avatar_url,plan,role,vida_credits,wallet_balance_cents,impact_score,total_missions_completed,streak_days,onboarded,tutorial_completed,consciousness_level,referral_code"
      )
      .eq("id", user.id)
      .maybeSingle();
    if (data) set({ profile: data as Profile });
  },
  signOut: async () => {
    set({ loading: true });
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null, loading: false });
  },
  hydrate: async () => {
    set({ loading: true });
    const { data } = await supabase.auth.getSession();
    set({
      session: data.session,
      user: data.session?.user ?? null,
      hydrated: true,
      loading: false,
    });
    if (data.session?.user) void get().refreshProfile();
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
      if (session?.user) void get().refreshProfile();
      else set({ profile: null });
    });
  },
}));
