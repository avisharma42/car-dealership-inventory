import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loginRequest, registerRequest } from '../api/auth';
import { setAuthToken } from '../api/client';
import type { AuthResponse, User } from '../types';

const STORAGE_KEY = 'apex-motors-session';

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const readStoredSession = (): AuthResponse | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthResponse) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthResponse | null>(readStoredSession);

  // Keep the axios client's Authorization header in sync with the active session.
  useEffect(() => {
    setAuthToken(session?.token ?? null);
    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  const login = useCallback(async (email: string, password: string) => {
    setSession(await loginRequest({ email, password }));
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setSession(await registerRequest({ name, email, password }));
  }, []);

  const logout = useCallback(() => setSession(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAdmin: session?.user.role === 'admin',
      login,
      register,
      logout,
    }),
    [session, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
