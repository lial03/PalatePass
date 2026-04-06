"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Lock, Mail } from "lucide-react";
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

  // Using absolute inset-0 to perfectly escape the global layout and cover the screen
  return (
    <main className="absolute inset-0 z-100 flex min-h-screen overflow-hidden bg-surface">
      {/* Visual Left pane - The Restaurant Vibe */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative hidden w-[45%] lg:block"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=1600&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-black/60" />
        <div className="absolute inset-0 p-12 flex flex-col justify-between">
          <Link
            href="/"
            className="inline-flex max-w-max items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-sm font-semibold tracking-widest text-white backdrop-blur hover:bg-black/60 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <div>
            <h2 className="font-serif text-5xl text-white">
              Your table is waiting.
            </h2>
            <p className="mt-4 max-w-md text-lg text-white/80">
              Log in to discover exclusive curations and high-signal
              recommendations from circles you trust.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Right pane - The Action Form */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12"
      >
        <div className="w-full max-w-md">
          {/* Mobile Back Button since Left Pane is hidden */}
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-foreground lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>

          <h1 className="font-serif text-4xl text-foreground">Welcome back</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Enter your details to access your curated feed and network.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-semibold uppercase tracking-wider text-muted ml-2"
                htmlFor="email"
              >
                Email
              </label>
              <div className="group relative flex items-center rounded-2xl border border-border/80 bg-white px-4 transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 shadow-sm">
                <Mail className="h-5 w-5 text-muted transition-colors group-focus-within:text-accent" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-transparent px-3 py-4 text-sm outline-none placeholder-muted/60"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-semibold uppercase tracking-wider text-muted ml-2"
                htmlFor="password"
              >
                Password
              </label>
              <div className="group relative flex items-center rounded-2xl border border-border/80 bg-white px-4 transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 shadow-sm">
                <Lock className="h-5 w-5 text-muted transition-colors group-focus-within:text-accent" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent px-3 py-4 text-sm outline-none placeholder-muted/60"
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 text-sm font-medium text-red-600 shadow-sm"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-4 text-base font-bold tracking-wide text-white transition hover:bg-accent-strong disabled:bg-accent/70 shadow-lg shadow-accent/20"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Authenticating
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-muted">
            New to PalatePass?{" "}
            <Link
              href="/register"
              className="text-accent underline transition hover:text-accent-strong"
            >
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
