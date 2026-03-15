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
    <nav className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 sm:px-10">
        <Link
          href="/"
          className="font-serif text-xl font-semibold tracking-tight"
        >
          PalatePass
        </Link>

        <div className="flex items-center gap-5 text-sm font-medium">
          <Link
            href="/restaurants"
            className="text-muted transition hover:text-foreground"
          >
            Restaurants
          </Link>

          {ready && user && (
            <Link
              href="/feed"
              className="text-muted transition hover:text-foreground"
            >
              Feed
            </Link>
          )}

          {!ready ? null : user ? (
            <>
              <span className="text-muted">{user.displayName}</span>
              <button
                onClick={handleLogout}
                className="rounded-full border border-border px-4 py-1.5 transition hover:bg-white/60"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-muted transition hover:text-foreground"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-accent px-4 py-1.5 text-white transition hover:bg-accent-strong"
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
