
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const protectedRoutes = ['/', '/settings'];
const publicRoutes = ['/login'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getSession = async () => {
        if (!supabase) {
            console.warn("Supabase client not initialized. Skipping session check.");
            setLoading(false);
            if (protectedRoutes.includes(pathname)) {
                router.push('/login');
            }
            return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase?.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
             router.push('/');
        }
        if (event === 'SIGNED_OUT') {
            router.push('/login');
        }
      }
    ) as { data: { subscription: any } };

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, pathname]);

  useEffect(() => {
    if (loading) return;

    const isProtectedRoute = protectedRoutes.includes(pathname);
    const isPublicRoute = publicRoutes.includes(pathname);

    if (isProtectedRoute && !user) {
        router.push('/login');
    }

    if (isPublicRoute && user) {
        router.push('/');
    }
  }, [user, loading, pathname, router]);

  const value = {
    user,
    loading,
    signIn: async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    signUp: async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/login');
    },
  };
  
  if (loading) {
      return (
        <div className="flex justify-center items-center h-screen w-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
