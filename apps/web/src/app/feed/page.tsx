"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, MapPin } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api, type Recommendation } from "../../lib/api";

function getPlaceholderImage(id: string) {
  const mockImages = [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800&auto=format&fit=crop"
  ];
  return mockImages[id.charCodeAt(0) % mockImages.length];
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <Link
      href={`/restaurants/${rec.restaurantId}`}
      className="group relative flex h-[28rem] flex-col justify-end overflow-hidden rounded-[2rem] border border-border/40 bg-surface shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_25px_50px_rgba(192,57,43,0.15)]"
    >
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
  const router = useRouter();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [meta, setMeta] = useState<{
    followingCount: number;
    candidateRatings: number;
    limit: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    api.recommendations
      .feed()
      .then((res) => {
        setRecs(res.data);
        setMeta(res.meta);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load feed");
      })
      .finally(() => setLoading(false));
  }, [user, ready, router]);

  if (!ready || (ready && !user)) return null;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 sm:px-10">
      <div className="mb-8">
        <h1 className="font-serif text-4xl">Your feed</h1>
        {user && (
          <p className="mt-1 text-sm text-muted">
            Hi {user.displayName} — restaurants loved by people you follow.
          </p>
        )}
      </div>

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
        <div className="rounded-4xl border border-border bg-surface p-12 text-center">
          <p className="font-serif text-2xl">
            {meta?.followingCount === 0
              ? "Follow people to unlock your feed"
              : "No high-rated picks from your circle yet"}
          </p>
          <p className="mt-2 text-sm text-muted">
            {meta?.followingCount === 0
              ? "Find people with similar taste and follow them."
              : "The people you follow haven't rated anything yet."}
          </p>
          <Link
            href="/restaurants"
            className="mt-6 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong"
          >
            Browse restaurants
          </Link>
        </div>
      ) : (
        <>
          {meta && (
            <p className="mb-4 text-xs text-muted">
              {recs.length} picks from {meta.followingCount}{" "}
              {meta.followingCount === 1 ? "person" : "people"} you follow
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
