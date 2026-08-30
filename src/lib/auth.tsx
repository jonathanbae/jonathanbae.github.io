import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { ROLE_EMAILS, type Role } from './roles';

type AuthState = {
  session: Session | null;
  role: Role | null;
  loading: boolean;
  signIn: (role: Role, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // The role lives in public.profiles, not in the client — a signed-in
  // submitter cannot hand themselves the admin UI by editing local state.
  useEffect(() => {
    if (!session) return setRole(null);
    let cancelled = false;
    supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setRole((data?.role as Role) ?? null);
      });
    return () => { cancelled = true; };
  }, [session]);

  const value = useMemo<AuthState>(() => ({
    session,
    role,
    loading,
    async signIn(r, password) {
      const { error } = await supabase.auth.signInWithPassword({
        email: ROLE_EMAILS[r],
        password,
      });
      if (error) throw error;
    },
    async signOut() {
      await supabase.auth.signOut();
    },
  }), [session, role, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}
