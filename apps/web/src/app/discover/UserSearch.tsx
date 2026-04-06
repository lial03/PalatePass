"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Flame, Loader2, Search, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

function getAvatarUrl(name: string) {
  const cleanName = encodeURIComponent(name.trim() || "Foodie");
  return `https://api.dicebear.com/7.x/initials/svg?seed=${cleanName}&backgroundColor=46200D,e7ecef,1e1e24&textColor=ffffff`;
}

export function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{
      id: string;
      displayName: string;
      avatarUrl: string;
      bio: string | null;
    }>
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length === 0) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await api.users.search(query);
        setResults(res.data);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-8">
      <div className="relative group max-w-2xl mx-auto">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted group-focus-within:text-accent transition-colors" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search community by name or bio..."
          className="w-full rounded-ui border border-border bg-surface pl-16 pr-8 py-6 text-xl text-foreground outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/5 transition-all placeholder:text-muted/40 shadow-sm"
        />
        {loading && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {results.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-section border border-border bg-surface p-8 transition-all hover:border-accent/20 hover:-translate-y-1 hover:shadow-2xl"
            >
              <Link
                href={`/users/${user.id}`}
                className="absolute inset-0 z-0"
              />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="relative h-24 w-24 overflow-hidden rounded-card border border-border bg-surface-strong mb-4 shadow-md">
                  <Image
                    src={user.avatarUrl || getAvatarUrl(user.displayName)}
                    alt={user.displayName}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>

                <h3 className="font-serif text-2xl font-bold text-foreground group-hover:text-accent transition-colors">
                  {user.displayName}
                </h3>

                {user.bio ? (
                  <p className="mt-2 text-sm text-muted line-clamp-2 italic min-h-10">
                    &ldquo;{user.bio}&rdquo;
                  </p>
                ) : (
                  <p className="mt-2 text-xs font-bold uppercase tracking-widest text-muted/30 min-h-10">
                    No bio shared
                  </p>
                )}

                <div className="mt-6 flex items-center gap-6">
                  <span className="text-xs font-bold text-accent tracking-widest uppercase opacity-60 group-hover:opacity-100 transition-opacity">
                    Visit Profile →
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!loading && query && results.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-20 text-center"
        >
          <Users className="mx-auto h-16 w-16 text-muted/20 mb-4" />
          <p className="font-serif text-2xl text-muted">
            No matching community members found.
          </p>
        </motion.div>
      )}

      {!query && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-20 text-center"
        >
          <Flame className="mx-auto h-16 w-16 text-accent/20 mb-4" />
          <h3 className="font-serif text-4xl text-foreground">
            Discover Your Circle
          </h3>
          <p className="mt-3 text-muted text-lg font-medium max-w-md mx-auto">
            Explore world-class culinary curators and expand your palate lens.
          </p>
        </motion.div>
      )}
    </div>
  );
}
