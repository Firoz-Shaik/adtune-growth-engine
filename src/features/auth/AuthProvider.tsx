import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { isStaffRole, type AppRole } from "@/lib/supabase/types";

interface AuthState {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function getRole(userId?: string) {
  if (!userId) return null;
  const { data, error } = await supabase.from("profiles").select("role, deleted_at").eq("id", userId).maybeSingle();
  if (error || !data || data.deleted_at) return null;
  return isStaffRole(data.role) ? data.role : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      setRole(await getRole(data.session?.user.id));
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(true);
      getRole(nextSession?.user.id).then((nextRole) => {
        if (!active) return;
        setRole(nextRole);
        setLoading(false);
      });
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(() => ({
    session,
    user: session?.user ?? null,
    role,
    loading,
    signIn: async (email, password) => {
      if (!isSupabaseConfigured) throw new Error("Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.");
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const nextRole = await getRole(data.session?.user.id);
      if (!nextRole) {
        await supabase.auth.signOut();
        throw new Error("This account does not have permission to manage the blog.");
      }
      setSession(data.session);
      setRole(nextRole);
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  }), [loading, role, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
