"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user, expiresAt } = await api.auth.login({ email, password });
      login(user, expiresAt);
      router.push("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-56px)] max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-4xl border border-border bg-surface p-8 shadow-[0_20px_60px_rgba(70,32,13,0.07)] sm:p-10">
        <h1 className="font-serif text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">
          Log in to see recommendations from your trusted circle.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-2xl border border-border bg-white/70 px-4 py-2.5 text-sm outline-none ring-accent focus:ring-2"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-2xl border border-border bg-white/70 px-4 py-2.5 text-sm outline-none ring-accent focus:ring-2"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          No account?{" "}
          <Link
            href="/register"
            className="font-medium text-accent hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
