import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const maskToken = (token?: string) => (token ? `${token.slice(0, 8)}…` : '(no token)');

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        console.log('Front: session loaded', {
          user: data.session?.user?.email,
          token: maskToken(data.session?.access_token),
        });
        setSession(data.session);
        setLoading(false);
      })
      .catch((error: unknown) => {
        console.error('Front: getSession error', error);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log('Front: auth state changed', {
        event,
        user: nextSession?.user?.email,
        token: maskToken(nextSession?.access_token),
      });
      setSession(nextSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signIn: async (email, password) => {
        console.log('Front: signIn attempt', { email });
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          console.error('Front: signIn error', error);
          throw error;
        }
      },
      signOut: async () => {
        console.log('Front: signOut attempt', {
          user: session?.user?.email,
          token: maskToken(session?.access_token),
        });
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Front: signOut error', error);
          throw error;
        }
      },
    }),
    [loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
