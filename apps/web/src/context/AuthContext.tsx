"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, type ApiUser } from "../lib/api";

type AuthState = { user: ApiUser | null };

type AuthContextType = AuthState & {
  login: (user: ApiUser, expiresAt: number) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  ready: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
  ready: false,
});

const STORAGE_KEY = "pp_auth";
/** Log out after 15 minutes of inactivity. */
const INACTIVITY_MS = 15 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null });
  const [ready, setReady] = useState(false);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (expiryTimer.current) {
      clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
    }
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    clearTimers();
    setState({ user: null });
    localStorage.removeItem(STORAGE_KEY);
    api.auth.logout().catch(() => {});
  }, [clearTimers]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(logout, INACTIVITY_MS);
  }, [logout]);

  /**
   * Start the JWT-expiry timer and the inactivity timer for a given token.
   * Returns false if the token is already expired (caller should not store it).
   */
  const startTimers = useCallback(
    (expiresAt: number): boolean => {
      clearTimers();

      const ms = expiresAt - Date.now();
      if (ms <= 0) {
        logout();
        return false;
      }
      expiryTimer.current = setTimeout(logout, ms);
      inactivityTimer.current = setTimeout(logout, INACTIVITY_MS);
      return true;
    },
    [clearTimers, logout],
  );

  // Reset inactivity timer on any user interaction while logged in.
  useEffect(() => {
    if (!state.user) return;
    const events = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ] as const;
    const handler = () => resetInactivityTimer();
    events.forEach((e) =>
      window.addEventListener(e, handler, { passive: true }),
    );
    return () => events.forEach((e) => window.removeEventListener(e, handler));
  }, [state.user, resetInactivityTimer]);

  // Hydrate from localStorage, discarding tokens that are already expired.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { user: ApiUser; expiresAt: number };
        if (parsed.user && parsed.expiresAt) {
          const valid = startTimers(parsed.expiresAt);
          if (valid) setState({ user: parsed.user });
          else localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // corrupt storage — ignore
    } finally {
      setReady(true);
    }
  }, [startTimers]);

  const login = useCallback(
    (user: ApiUser, expiresAt: number) => {
      const valid = startTimers(expiresAt);
      if (!valid) return;
      setState({ user });
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, expiresAt }));
    },
    [startTimers],
  );

  const refreshUser = useCallback(async () => {
    try {
      const { user } = await api.auth.me();
      setState({ user });
      // Update local storage too to keep it in sync
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, user }));
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
