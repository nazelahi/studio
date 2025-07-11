"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ['/login'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getSession = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error getting session:", error);
        setLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const userRole = session.user.user_metadata?.role;
        setIsAdmin(userRole === 'admin');
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    };

    getSession();

    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            const userRole = session.user.user_metadata?.role;
            setIsAdmin(userRole === 'admin');
          } else {
            setIsAdmin(false);
          }
        }
      );
      
      return () => {
        authListener?.subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    // Super admin check
    if (email === 'admin' && password === '1234') {
      const mockUser = {
        id: 'super-admin-id',
        email: 'admin',
        user_metadata: { role: 'admin' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;

      const mockSession = {
        access_token: 'super-admin-token',
        refresh_token: 'super-admin-refresh-token',
        user: mockUser,
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      } as Session;

      setUser(mockUser);
      setSession(mockSession);
      setIsAdmin(true);
      return { error: null };
    }
    
    // Regular Supabase sign-in
    if (!supabase) {
      return { error: 'Database connection not available.' };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  };

  const signOut = async () => {
     // If it's the super admin, just clear the state
    if (user?.id === 'super-admin-id') {
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      router.push('/login');
      return;
    }

    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/');
  };

  const value = { user, session, isAdmin, signIn, signOut };

  // Handle loading and routing
  if (loading) {
     return (
        <div className="flex justify-center items-center h-screen w-screen">
          <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
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
