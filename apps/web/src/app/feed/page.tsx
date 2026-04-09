"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star, MapPin } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api, type Recommendation } from "../../lib/api";

function getPlaceholderImage(id: string) {
  return `https://picsum.photos/seed/${id}/800/600`;
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <Link
      href={`/restaurants/${rec.restaurantId}`}
      className="spotlight-card group relative flex h-[28rem] flex-col justify-end overflow-hidden rounded-[2rem] border border-border/60 bg-surface shadow-md transition-all duration-300 hover:-translate-y-2 hover:border-accent/40 hover:shadow-[0_25px_50px_rgba(192,57,43,0.15)]"
    >
      <div 
        className="pointer-events-none absolute -inset-px z-20 rounded-[inherit] opacity-0 transition duration-300 group-hover:opacity-100 mix-blend-overlay"
        style={{ background: "radial-gradient(400px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(255,255,255,0.8), transparent 40%)" }}
      />
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{ backgroundImage: `url(${getPlaceholderImage(rec.restaurantId)})` }}
      />
      <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-black via-black/50 to-black/10 transition-opacity duration-300 group-hover:opacity-90" />

      {/* Top badges */}
      <div className="absolute right-4 top-4 z-10 flex">
        <div className="flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 shadow-md backdrop-blur">
           <Star className="h-4 w-4 fill-accent text-accent" />
           <span className="text-sm font-bold text-accent">{rec.networkAverageScore.toFixed(1)}</span>
        </div>
      </div>

      <div className="absolute left-4 top-4 z-10 flex gap-2">
        <span className="rounded-full border border-white/30 bg-black/40 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-white shadow-sm backdrop-blur-md">
          {rec.cuisine}
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6">
        <h2 className="font-serif text-3xl font-semibold leading-tight text-white transition-colors group-hover:text-[#fdfbfa]">
          {rec.name}
        </h2>
        <div className="mt-2 flex items-center justify-between text-xs font-medium text-white/80">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {rec.city}</span>
          <span className="shrink-0">{rec.endorsementCount} {rec.endorsementCount === 1 ? "friend" : "friends"}</span>
        </div>

        {rec.endorsedBy.length > 0 && (
          <div className="mt-4 flex -space-x-2">
            {rec.endorsedBy.map((name, i) => (
               <div key={i} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-strong bg-accent text-xs font-bold text-white shadow-sm" title={name}>
                 {name.substring(0, 1).toUpperCase()}
               </div>
            ))}
          </div>
        )}

        {rec.sampleNotes[0] && (
          <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md">
             <p className="line-clamp-2 font-serif text-sm italic text-white/90">
               &ldquo;{rec.sampleNotes[0]}&rdquo;
             </p>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function FeedPage() {
  const { user, ready } = useAuth();
  const { data: feedData, isLoading, error: queryError } = useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      return await api.recommendations.feed();
    },
    enabled: ready && !!user,
  });

  const recs = feedData?.data ?? [];
  const meta = feedData?.meta ?? null;
  const isFallback = (meta as { isDiscoveryFallback?: boolean })?.isDiscoveryFallback === true;
  const loading = isLoading;
  const error = queryError instanceof Error ? queryError.message : null;

  if (!ready || (ready && !user)) return null;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 sm:px-10">
      <header className="mb-14 max-w-2xl">
        <span className="rounded-full bg-accent/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-accent">
          {isFallback ? "Tastemakers' Picks" : "Curated Network"}
        </span>
        <h1 className="mt-6 font-serif text-5xl font-bold tracking-tight text-foreground md:text-6xl leading-[1.1]">
          {isFallback ? "Discover Great Tables" : <>Your Daily <span className="text-accent italic">Feed</span></>}
        </h1>
        {user && (
          <p className="mt-4 text-lg text-muted font-medium">
            {isFallback 
              ? "You aren't following anyone yet! Explore these editor picks and start building your trust graph."
              : `Hi ${user.displayName} — discover world-class tables recommended by the people you trust.`}
          </p>
        )}
      </header>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-3xl border border-border bg-surface-strong"
            />
          ))}
        </div>
      ) : recs.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-section border border-accent/10 bg-white p-12 text-center shadow-premium md:p-20"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-accent ring-8 ring-accent/5">
              <Star className="h-8 w-8" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
              {meta?.followingCount === 0
                ? "Unlock your curated feed"
                : "No high-rated picks yet"}
            </h2>
            <p className="mt-4 max-w-md text-base font-medium text-muted">
              {meta?.followingCount === 0
                ? "Follow friends, chefs, and tastemakers to discover their favorite dining spots right here."
                : "The people you follow haven't endorsed anything yet. Be the first to share a great table!"}
            </p>
            <Link
              href="/restaurants"
              className="mt-8 inline-flex items-center rounded-full bg-accent px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-accent/20 transition-all duration-300 hover:-translate-y-1 hover:bg-accent-strong hover:shadow-lg hover:shadow-accent/40 focus-gentle cursor-pointer"
            >
              Explore Restaurants
            </Link>
          </div>
        </motion.div>
      ) : (
        <>
          {meta && !isFallback && (
            <p className="mb-4 text-xs text-muted">
              {recs.length} picks from {meta.followingCount}{" "}
              {meta.followingCount === 1 ? "person" : "people"} you follow
            </p>
          )}
          {meta && isFallback && (
             <p className="mb-4 text-xs text-muted">
              Showing {recs.length} global top-rated community picks.
            </p>
          )}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
              hidden: {}
            }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {recs.map((rec) => (
              <motion.div
                key={rec.restaurantId}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                }}
              >
                <RecommendationCard rec={rec} />
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </main>
  );
}
