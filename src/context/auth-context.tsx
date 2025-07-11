
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';

const SUPER_ADMIN_EMAIL = 'admin@gmail.com';
const SUPER_ADMIN_PASSWORD_KEY = 'superAdminPassword';
const DEFAULT_SUPER_ADMIN_PASSWORD = '1234';


interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  changePassword: (oldPass: string, newPass: string) => Promise<{ error: string | null }>;
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
      // Initialize default super admin password if not set
      if (typeof window !== 'undefined' && !localStorage.getItem(SUPER_ADMIN_PASSWORD_KEY)) {
        localStorage.setItem(SUPER_ADMIN_PASSWORD_KEY, DEFAULT_SUPER_ADMIN_PASSWORD);
      }

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

  const getSuperAdminPassword = () => {
    if (typeof window === 'undefined') return DEFAULT_SUPER_ADMIN_PASSWORD;
    return localStorage.getItem(SUPER_ADMIN_PASSWORD_KEY) || DEFAULT_SUPER_ADMIN_PASSWORD;
  };

  const signIn = async (email: string, password: string) => {
    if (email === SUPER_ADMIN_EMAIL && password === getSuperAdminPassword()) {
      const mockUser = {
        id: 'super-admin-id',
        email: SUPER_ADMIN_EMAIL,
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
    
    if (!supabase) {
      return { error: 'Database connection not available.' };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  };

  const signOut = async () => {
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

  const changePassword = async (oldPass: string, newPass: string) => {
    if (user?.email !== SUPER_ADMIN_EMAIL) {
      return { error: "This function is only for the super admin." };
    }
    if (oldPass === getSuperAdminPassword()) {
      localStorage.setItem(SUPER_ADMIN_PASSWORD_KEY, newPass);
      return { error: null };
    }
    return { error: "Incorrect old password." };
  };

  const value = { user, session, isAdmin, signIn, signOut, changePassword };

  useEffect(() => {
    if (!loading && !user && !publicRoutes.includes(pathname)) {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  if (loading || (!user && !publicRoutes.includes(pathname))) {
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
