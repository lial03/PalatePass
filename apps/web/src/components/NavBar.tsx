"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export function NavBar() {
  const { user, logout, ready } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <nav className="fixed left-0 right-0 top-6 z-50 mx-auto max-w-5xl px-4">
      <div className="flex items-center justify-between rounded-full border border-glass-border bg-glass-bg px-6 py-3 shadow-premium backdrop-blur-md transition-all hover:bg-white/80">
        <Link
          href="/"
          className="font-serif text-2xl font-bold tracking-tight text-foreground transition-colors duration-300 hover:text-accent focus-gentle rounded-lg px-2 py-1"
        >
          PalatePass
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/restaurants"
            className="text-muted transition-colors duration-200 hover:text-foreground focus-gentle rounded-md px-1"
          >
            Restaurants
          </Link>

          {ready && user && (
            <Link
              href="/feed"
              className="text-muted transition-colors duration-200 hover:text-foreground focus-gentle rounded-md px-1"
            >
              Feed
            </Link>
          )}

          {!ready ? null : user ? (
            <>
                <Link
                  href={`/users/${user.id}`}
                  className="text-muted transition-colors duration-200 hover:text-foreground focus-gentle rounded-md px-1"
                >
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="text-muted transition-colors duration-200 hover:text-foreground focus-gentle rounded-md px-1"
                >
                  Settings
                </Link>
              <button
                onClick={handleLogout}
                className="rounded-full border border-border px-4 py-1.5 transition-colors duration-200 hover:bg-surface-strong/80 hover:text-accent focus-gentle cursor-pointer"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-muted transition-colors duration-200 hover:text-foreground focus-gentle rounded-md px-1"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-accent px-5 py-2 text-white shadow-md shadow-accent/20 transition-all duration-300 hover:bg-accent-strong hover:shadow-lg hover:shadow-accent/30 focus-gentle cursor-pointer"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
