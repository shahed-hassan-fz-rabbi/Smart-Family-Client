'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { PublicUser, FamilySummary } from '@/lib/types';

interface AuthState {
  user: PublicUser | null;
  family: FamilySummary | null;
  families: FamilySummary[];
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  family: null,
  families: [],
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [families, setFamilies] = useState<FamilySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const { user } = await api.get<{ user: PublicUser }>('/auth/me');
      setUser(user);
      try {
        const { families } = await api.get<{ families: FamilySummary[] }>('/families');
        setFamilies(families);
      } catch {
        setFamilies([]);
      }
    } catch {
      setUser(null);
      setFamilies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // clearing cookie failed server-side; still log out on the client
    }
    setUser(null);
    setFamilies([]);
    router.push('/login');
  }, [router]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider
      value={{
        user,
        family: families[0] ?? null,
        families,
        loading,
        refresh,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
