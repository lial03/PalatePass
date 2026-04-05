"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.auth.register({ email, password, displayName: name });
      const { user, expiresAt } = await api.auth.login({ email, password });
      login(user, expiresAt);
      router.push("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  // Absolute full screen completely covering global layout
  return (
    <main className="absolute inset-0 z-[100] flex min-h-screen overflow-hidden bg-surface flex-row-reverse">
      {/* Visual Right pane */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative hidden w-[45%] lg:block"
      >
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1600&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60" />
        <div className="absolute inset-0 p-12 flex flex-col justify-end">
           <div>
             <h2 className="font-serif text-5xl text-white">Join the Network.</h2>
             <p className="mt-4 max-w-md text-lg text-white/80">Connect with local gourmands, track your favorite spots, and unlock city secrets.</p>
           </div>
        </div>
      </motion.div>

      {/* Left pane - The Action Form */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12 relative"
      >
        <Link href="/" className="absolute left-6 top-6 sm:left-12 sm:top-12 inline-flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-foreground">
           ← Home
        </Link>
        <div className="w-full max-w-md mt-10">
          
          <h1 className="font-serif text-4xl text-foreground">Create Account</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Establish your identity to begin discovering.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted ml-2" htmlFor="name">Display Name</label>
              <div className="group relative flex items-center rounded-2xl border border-border/80 bg-white px-4 transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 shadow-sm">
                <User className="h-5 w-5 text-muted transition-colors group-focus-within:text-accent" />
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full bg-transparent px-3 py-3.5 text-sm outline-none placeholder-muted/60"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted ml-2" htmlFor="email">Email</label>
              <div className="group relative flex items-center rounded-2xl border border-border/80 bg-white px-4 transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 shadow-sm">
                <Mail className="h-5 w-5 text-muted transition-colors group-focus-within:text-accent" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-transparent px-3 py-3.5 text-sm outline-none placeholder-muted/60"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted ml-2" htmlFor="password">Password</label>
              <div className="group relative flex items-center rounded-2xl border border-border/80 bg-white px-4 transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 shadow-sm">
                <Lock className="h-5 w-5 text-muted transition-colors group-focus-within:text-accent" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent px-3 py-3.5 text-sm outline-none placeholder-muted/60"
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
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-accent-strong py-4 text-base font-bold tracking-wide text-white transition hover:bg-black/90 disabled:opacity-70 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Account
                </>
              ) : (
                <>Join Free <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-muted">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-accent underline transition hover:text-accent-strong"
            >
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
