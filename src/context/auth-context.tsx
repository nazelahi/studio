
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';

const SUPER_ADMIN_EMAIL = 'admin@gmail.com';
const SUPER_ADMIN_PASSWORD_KEY = 'superAdminPassword';
const DEFAULT_SUPER_ADMIN_PASSWORD = '1234';
const SUPER_ADMIN_SESSION_KEY = 'superAdminSession';


interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  changePassword: (oldPass: string, newPass: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      // Initialize default super admin password if not set
      if (typeof window !== 'undefined' && !localStorage.getItem(SUPER_ADMIN_PASSWORD_KEY)) {
        localStorage.setItem(SUPER_ADMIN_PASSWORD_KEY, DEFAULT_SUPER_ADMIN_PASSWORD);
      }

      // Check for persisted super admin session
      if (typeof window !== 'undefined') {
        const superAdminSessionData = sessionStorage.getItem(SUPER_ADMIN_SESSION_KEY);
        if (superAdminSessionData) {
          try {
            const superAdminSession = JSON.parse(superAdminSessionData);
            setSession(superAdminSession);
            setUser(superAdminSession.user);
            setIsAdmin(true);
            setLoading(false);
            return;
          } catch (e) {
            console.error("Failed to parse super admin session", e);
            sessionStorage.removeItem(SUPER_ADMIN_SESSION_KEY);
          }
        }
      }

      if (!supabase) {
        setLoading(false);
        return;
      }
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error getting session:", error);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setIsAdmin(session?.user?.user_metadata?.role === 'admin');
      
      setLoading(false);
    };

    getSession();

    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          // If a Supabase event logs us out, ensure super admin is also logged out
          if (event === 'SIGNED_OUT') {
            sessionStorage.removeItem(SUPER_ADMIN_SESSION_KEY);
            setUser(null);
            setSession(null);
            setIsAdmin(false);
          } else if (session && session.user.email !== SUPER_ADMIN_EMAIL) {
             setSession(session);
             setUser(session.user);
             setIsAdmin(session.user.user_metadata?.role === 'admin');
             sessionStorage.removeItem(SUPER_ADMIN_SESSION_KEY);
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
    if (email === SUPER_ADMIN_EMAIL) {
        if (password === getSuperAdminPassword()) {
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
                expires_in: 3600 * 24 * 7, // 1 week
                expires_at: Math.floor(Date.now() / 1000) + (3600 * 24 * 7),
            } as Session;

            if (typeof window !== 'undefined') {
                sessionStorage.setItem(SUPER_ADMIN_SESSION_KEY, JSON.stringify(mockSession));
            }

            setUser(mockUser);
            setSession(mockSession);
            setIsAdmin(true);
            return { error: null };
        } else {
            return { error: "Invalid password for super admin." };
        }
    }
    
    if (!supabase) {
      return { error: 'Database connection not available.' };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
       router.push('/');
    }
    return { error: error?.message || null };
  };

  const signOut = async () => {
    if (user?.id === 'super-admin-id') {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(SUPER_ADMIN_SESSION_KEY);
      }
    }

    if (supabase) {
      await supabase.auth.signOut();
    }

    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  const changePassword = async (oldPass: string, newPass: string) => {
    if (user?.email !== SUPER_ADMIN_EMAIL) {
      return { error: "This function is only for the super admin." };
    }
    if (oldPass === getSuperAdminPassword()) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(SUPER_ADMIN_PASSWORD_KEY, newPass);
      }
      return { error: null };
    }
    return { error: "Incorrect old password." };
  };

  const value = { user, session, isAdmin, signIn, signOut, changePassword };

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
