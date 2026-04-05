"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Loader2, Flame, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../lib/api";

function getAvatarUrl(name: string) {
  const cleanName = encodeURIComponent(name.trim() || 'Foodie');
  return `https://api.dicebear.com/7.x/initials/svg?seed=${cleanName}&backgroundColor=46200D,e7ecef,1e1e24&textColor=ffffff`;
}

export function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ id: string; displayName: string; avatarUrl: string; bio: string | null }>>([]);
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
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-white/30 group-focus-within:text-accent transition-colors" />
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search community by name or bio..."
          className="w-full rounded-[2rem] border border-white/10 bg-white/5 pl-16 pr-8 py-6 text-xl text-white outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/5 transition-all placeholder:text-white/20 backdrop-blur-xl"
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
              className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-8 backdrop-blur-md transition-all hover:bg-white/10 hover:-translate-y-1 hover:shadow-2xl"
            >
              <Link href={`/users/${user.id}`} className="absolute inset-0 z-0" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="relative h-24 w-24 overflow-hidden rounded-[2rem] border-2 border-white/10 bg-surface mb-4 shadow-xl">
                  <Image 
                    src={user.avatarUrl || getAvatarUrl(user.displayName)} 
                    alt={user.displayName}
                    fill
                    className="object-cover"
                  />
                </div>
                
                <h3 className="font-serif text-2xl font-bold text-white group-hover:text-accent transition-colors">
                  {user.displayName}
                </h3>
                
                {user.bio ? (
                  <p className="mt-2 text-sm text-white/50 line-clamp-2 italic min-h-[40px]">
                    &ldquo;{user.bio}&rdquo;
                  </p>
                ) : (
                  <p className="mt-2 text-xs font-bold uppercase tracking-widest text-white/20 min-h-[40px]">
                    No bio shared
                  </p>
                )}

                <div className="mt-6 flex items-center gap-6">
                   <div className="flex flex-col items-center">
                      <Users className="h-4 w-4 text-accent/50 mb-1" />
                      <span className="text-xs font-bold text-white/40 tracking-widest uppercase">Visit Profile →</span>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!loading && query && results.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="py-20 text-center"
        >
           <Users className="mx-auto h-16 w-16 text-white/10 mb-4" />
           <p className="font-serif text-2xl text-white/40">No matching community members found.</p>
        </motion.div>
      )}

      {!query && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="py-20 text-center"
        >
           <Flame className="mx-auto h-16 w-16 text-accent/20 mb-4" />
           <h3 className="font-serif text-3xl text-white/60">Discover Your Circle</h3>
           <p className="mt-2 text-white/30 font-medium">Search for friends and curators to expand your culinary lens.</p>
        </motion.div>
      )}
    </div>
  );
}
