"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { ApiUser } from "../lib/api";

type AuthState = { token: string | null; user: ApiUser | null };

type AuthContextType = AuthState & {
  login: (token: string, user: ApiUser) => void;
  logout: () => void;
  ready: boolean;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  login: () => {},
  logout: () => {},
  ready: false,
});

const STORAGE_KEY = "pp_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, user: null });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthState;
        if (parsed.token && parsed.user) setState(parsed);
      }
    } catch {
      // corrupt storage — ignore
    } finally {
      setReady(true);
    }
  }, []);

  function login(token: string, user: ApiUser) {
    const next = { token, user };
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function logout() {
    setState({ token: null, user: null });
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
