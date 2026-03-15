"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api, type Recommendation } from "../../lib/api";

function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <Link
      href={`/restaurants/${rec.restaurantId}`}
      className="group block rounded-3xl border border-border bg-surface p-5 transition hover:border-accent/30 hover:shadow-[0_8px_30px_rgba(70,32,13,0.09)]"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full border border-border bg-white/80 px-3 py-0.5 text-xs font-medium text-muted">
          {rec.cuisine}
        </span>
        <span className="text-xs text-muted">{rec.city}</span>
      </div>

      <h2 className="mt-3 font-serif text-xl font-semibold group-hover:text-accent">
        {rec.name}
      </h2>
      <p className="mt-0.5 text-sm text-muted">{rec.address}</p>

      <div className="mt-3 flex items-center gap-3">
        <span className="text-sm font-semibold text-accent">
          {"★".repeat(Math.round(rec.networkAverageScore))}
          <span className="ml-1 text-xs font-normal text-muted">
            {rec.networkAverageScore.toFixed(1)} avg
          </span>
        </span>
        <span className="text-xs text-muted">
          {rec.endorsementCount}{" "}
          {rec.endorsementCount === 1 ? "endorsement" : "endorsements"}
        </span>
      </div>

      {rec.endorsedBy.length > 0 && (
        <p className="mt-2 text-xs text-muted">
          Loved by{" "}
          <span className="font-medium text-foreground">
            {rec.endorsedBy.join(", ")}
          </span>
        </p>
      )}

      {rec.sampleNotes[0] && (
        <p className="mt-2 line-clamp-2 text-xs italic text-muted">
          &ldquo;{rec.sampleNotes[0]}&rdquo;
        </p>
      )}
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recs.map((rec) => (
              <RecommendationCard key={rec.restaurantId} rec={rec} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
