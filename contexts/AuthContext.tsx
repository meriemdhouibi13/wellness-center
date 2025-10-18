import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import type { UserProfile, UserRole } from '@/services/types';
import { emailPasswordSignIn, emailPasswordSignUp, signOutUser, subscribeAuth } from '@/services/auth';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string, role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeAuth((s) => {
      setUser(s.user);
      setProfile(s.profile);
      setLoading(s.loading);
    });
    return unsub;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      async signIn(email, password) {
        const { user: u, profile: p } = await emailPasswordSignIn(email, password);
        setUser(u); setProfile(p); setLoading(false);
      },
      async signUp(email, password, name, role) {
        const { user: u, profile: p } = await emailPasswordSignUp(email, password, name, role);
        setUser(u); setProfile(p); setLoading(false);
      },
      async signOut() { await signOutUser(); setUser(null); setProfile(null); },
      hasRole(...roles) { return !!profile && roles.includes(profile.role); },
    }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
