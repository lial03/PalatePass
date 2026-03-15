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
/** Log out after 15 minutes of inactivity. */
const INACTIVITY_MS = 15 * 60 * 1000;

/** Decode the JWT payload and return the expiry as a ms timestamp, or null. */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, user: null });
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
    setState({ token: null, user: null });
    localStorage.removeItem(STORAGE_KEY);
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
    (token: string): boolean => {
      clearTimers();

      const expiry = getTokenExpiry(token);
      if (expiry !== null) {
        const ms = expiry - Date.now();
        if (ms <= 0) {
          logout();
          return false;
        }
        expiryTimer.current = setTimeout(logout, ms);
      }

      inactivityTimer.current = setTimeout(logout, INACTIVITY_MS);
      return true;
    },
    [clearTimers, logout],
  );

  // Reset inactivity timer on any user interaction while logged in.
  useEffect(() => {
    if (!state.token) return;
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
  }, [state.token, resetInactivityTimer]);

  // Hydrate from localStorage, discarding tokens that are already expired.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthState;
        if (parsed.token && parsed.user) {
          const valid = startTimers(parsed.token);
          if (valid) setState(parsed);
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
    (token: string, user: ApiUser) => {
      const valid = startTimers(token);
      if (!valid) return;
      const next = { token, user };
      setState(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    },
    [startTimers],
  );

  return (
    <AuthContext.Provider value={{ ...state, login, logout, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
