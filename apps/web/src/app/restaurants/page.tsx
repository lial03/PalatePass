"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Restaurant } from "../../lib/api";

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null)
    return <span className="text-xs text-muted">No ratings yet</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
      {"★".repeat(Math.round(score))}
      {"☆".repeat(5 - Math.round(score))}
      <span className="ml-1 text-xs font-normal text-muted">
        {score.toFixed(1)}
      </span>
    </span>
  );
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [total, setTotal] = useState(0);
  const [cuisine, setCuisine] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchRestaurants(c?: string, ci?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.restaurants.list({
        cuisine: c || undefined,
        city: ci || undefined,
        limit: 24,
      });
      setRestaurants(res.data);
      setTotal(res.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load restaurants",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchRestaurants();
  }, []);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    void fetchRestaurants(cuisine, city);
  }

  function handleReset() {
    setCuisine("");
    setCity("");
    void fetchRestaurants();
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 sm:px-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl">Restaurants</h1>
          {!loading && (
            <p className="mt-1 text-sm text-muted">{total} places found</p>
          )}
        </div>

        <form
          onSubmit={handleFilter}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            type="text"
            placeholder="Cuisine"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            className="rounded-full border border-border bg-white/70 px-4 py-2 text-sm outline-none ring-accent focus:ring-2"
          />
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-full border border-border bg-white/70 px-4 py-2 text-sm outline-none ring-accent focus:ring-2"
          />
          <button
            type="submit"
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong"
          >
            Filter
          </button>
          {(cuisine || city) && (
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-border px-4 py-2 text-sm transition hover:bg-white/60"
            >
              Clear
            </button>
          )}
        </form>
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
              className="h-40 animate-pulse rounded-3xl border border-border bg-surface-strong"
            />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="rounded-4xl border border-border bg-surface p-12 text-center">
          <p className="font-serif text-2xl">No restaurants yet</p>
          <p className="mt-2 text-sm text-muted">
            Be the first to add a place — use the API directly for now.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((r) => (
            <Link
              key={r.id}
              href={`/restaurants/${r.id}`}
              className="group block rounded-3xl border border-border bg-surface p-5 transition hover:border-accent/30 hover:shadow-[0_8px_30px_rgba(70,32,13,0.09)]"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="rounded-full border border-border bg-white/80 px-3 py-0.5 text-xs font-medium text-muted">
                  {r.cuisine}
                </span>
                <span className="text-xs text-muted">{r.city}</span>
              </div>
              <h2 className="mt-3 font-serif text-xl font-semibold group-hover:text-accent">
                {r.name}
              </h2>
              <p className="mt-1 text-sm text-muted">{r.address}</p>
              <div className="mt-3 flex items-center justify-between">
                <ScoreBadge score={r.averageScore} />
                <span className="text-xs text-muted">
                  {r.ratingCount} {r.ratingCount === 1 ? "rating" : "ratings"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
