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
      <div className="flex items-center justify-between rounded-full border border-border/40 bg-white/70 px-6 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md transition-all">
        <Link
          href="/"
          className="font-serif text-2xl font-bold tracking-tight text-foreground transition-transform hover:scale-105"
        >
          PalatePass
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium">
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
              <Link
                href={`/users/${user.id}`}
                className="text-muted transition hover:text-foreground"
              >
                Profile
              </Link>
              <Link
                href="/settings"
                className="text-muted transition hover:text-foreground"
              >
                Settings
              </Link>
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
                className="rounded-full bg-accent px-5 py-2 text-white shadow-md shadow-accent/20 transition-all hover:-translate-y-0.5 hover:bg-accent-strong hover:shadow-lg hover:shadow-accent/30"
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
