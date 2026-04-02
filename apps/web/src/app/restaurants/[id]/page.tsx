"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ShareQr } from "../../../components/ShareQr";
import { useAuth } from "../../../context/AuthContext";
import { buildAffiliateUrl, trackAffiliateClick } from "../../../lib/affiliate";
import {
  api,
  type RatingSummary,
  type RestaurantAnalytics,
  type RestaurantDetail,
} from "../../../lib/api";

function Stars({ score }: { score: number }) {
  return (
    <span className="text-accent">
      {"★".repeat(score)}
      <span className="text-muted/40">{"★".repeat(5 - score)}</span>
    </span>
  );
}

function RatingCard({
  rating,
  isHighlighted,
}: {
  rating: RatingSummary;
  isHighlighted: boolean;
}) {
  const [showShare, setShowShare] = useState(false);

  return (
    <div
      id={`review-${rating.id}`}
      className={`rounded-3xl border bg-white/70 p-5 ${isHighlighted ? "border-accent ring-2 ring-accent/20" : "border-border"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{rating.displayName}</p>
          <Stars score={rating.score} />
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">
            {new Date(rating.createdAt).toLocaleDateString()}
          </p>
          <button
            type="button"
            onClick={() => setShowShare((value) => !value)}
            className="mt-2 text-xs font-semibold text-accent hover:underline"
          >
            {showShare ? "Hide QR" : "Share review"}
          </button>
        </div>
      </div>
      {rating.notes && (
        <p className="mt-3 text-sm leading-7 text-muted">{rating.notes}</p>
      )}
      {rating.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {rating.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-surface px-3 py-0.5 text-xs text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {(rating.budgetTier ||
        (rating.budgetAmount !== null && rating.budgetCurrency)) && (
        <p className="mt-3 text-xs text-muted">
          Budget: {rating.budgetTier ?? "custom"}
          {rating.budgetAmount !== null && rating.budgetCurrency
            ? ` (${rating.budgetAmount} ${rating.budgetCurrency})`
            : ""}
        </p>
      )}
      {rating.photoUrls.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {rating.photoUrls.map((url, index) => (
            <a
              key={`${rating.id}-${index}`}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted hover:border-accent/30"
            >
              Photo {index + 1}
            </a>
          ))}
        </div>
      )}
      {showShare && (
        <div className="mt-4">
          <ShareQr
            title="Share this review"
            description="This QR code opens the restaurant page and jumps straight to this review."
            path={`/restaurants/${rating.restaurantId}?review=${rating.id}`}
          />
        </div>
      )}
    </div>
  );
}

function AffiliateActions({ restaurant }: { restaurant: RestaurantDetail }) {
  const deliveryUrl = buildAffiliateUrl(restaurant, "delivery");
  const reservationUrl = buildAffiliateUrl(restaurant, "reservation");

  function handleAffiliateClick(
    partner: "delivery" | "reservation",
    destination: string,
  ) {
    return () => {
      void trackAffiliateClick({
        restaurantId: restaurant.id,
        partner,
        destination,
        context: "restaurant-detail",
      });
    };
  }

  return (
    <section className="mt-6 rounded-4xl border border-border bg-white/70 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.16em] text-muted">
            Affiliate partnerships
          </p>
          <h2 className="mt-1 font-serif text-2xl">Order or reserve</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
            These outbound links take you to partner search pages. PalatePass
            may earn a commission when you complete a booking or order.
          </p>
        </div>
        <span className="rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-xs font-semibold text-accent">
          Clearly labeled
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <a
          href={deliveryUrl}
          target="_blank"
          rel="noreferrer"
          onClick={handleAffiliateClick("delivery", deliveryUrl)}
          className="rounded-3xl border border-border bg-surface px-4 py-4 text-left transition hover:border-accent/30 hover:bg-white/90"
        >
          <p className="text-sm font-semibold">Order delivery</p>
          <p className="mt-1 text-sm text-muted">
            Open a delivery partner search for {restaurant.name}.
          </p>
        </a>

        <a
          href={reservationUrl}
          target="_blank"
          rel="noreferrer"
          onClick={handleAffiliateClick("reservation", reservationUrl)}
          className="rounded-3xl border border-border bg-surface px-4 py-4 text-left transition hover:border-accent/30 hover:bg-white/90"
        >
          <p className="text-sm font-semibold">Reserve a table</p>
          <p className="mt-1 text-sm text-muted">
            Search reservation partners for {restaurant.name}.
          </p>
        </a>
      </div>
    </section>
  );
}

function RateForm({
  restaurantId,
  onSuccess,
}: {
  restaurantId: string;
  onSuccess: () => void;
}) {
  const [score, setScore] = useState(5);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [photoUrls, setPhotoUrls] = useState("");
  const [budgetTier, setBudgetTier] = useState<
    "" | "budget" | "mid" | "premium" | "luxury"
  >("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetCurrency, setBudgetCurrency] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.restaurants.rate(restaurantId, {
        score,
        notes: notes || undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        photoUrls: photoUrls
          .split("\n")
          .map((url) => url.trim())
          .filter(Boolean),
        budgetTier: budgetTier || undefined,
        budgetAmount: budgetAmount ? Number(budgetAmount) : undefined,
        budgetCurrency: budgetCurrency
          ? budgetCurrency.toUpperCase()
          : undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-3xl border border-border bg-surface p-5"
    >
      <h3 className="font-semibold">Leave a rating</h3>
      <div className="mt-4 flex gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScore(s)}
            className={`text-2xl transition ${s <= score ? "text-accent" : "text-muted/30"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        className="mt-3 w-full rounded-2xl border border-border bg-white/70 px-4 py-2.5 text-sm outline-none ring-accent focus:ring-2"
      />
      <input
        type="text"
        placeholder="Tags, comma-separated (cozy, spicy, affordable)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-border bg-white/70 px-4 py-2.5 text-sm outline-none ring-accent focus:ring-2"
      />
      <textarea
        placeholder="Photo URLs, one per line (optional)"
        value={photoUrls}
        onChange={(e) => setPhotoUrls(e.target.value)}
        rows={3}
        className="mt-2 w-full rounded-2xl border border-border bg-white/70 px-4 py-2.5 text-sm outline-none ring-accent focus:ring-2"
      />
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <select
          value={budgetTier}
          onChange={(e) =>
            setBudgetTier(
              e.target.value as "" | "budget" | "mid" | "premium" | "luxury",
            )
          }
          className="rounded-2xl border border-border bg-white/70 px-4 py-2.5 text-sm outline-none ring-accent focus:ring-2"
        >
          <option value="">Budget tier (optional)</option>
          <option value="budget">Budget</option>
          <option value="mid">Mid</option>
          <option value="premium">Premium</option>
          <option value="luxury">Luxury</option>
        </select>
        <input
          type="number"
          min={0}
          placeholder="Amount"
          value={budgetAmount}
          onChange={(e) => setBudgetAmount(e.target.value)}
          className="rounded-2xl border border-border bg-white/70 px-4 py-2.5 text-sm outline-none ring-accent focus:ring-2"
        />
        <input
          type="text"
          maxLength={3}
          placeholder="Currency (USD)"
          value={budgetCurrency}
          onChange={(e) => setBudgetCurrency(e.target.value.toUpperCase())}
          className="rounded-2xl border border-border bg-white/70 px-4 py-2.5 text-sm uppercase outline-none ring-accent focus:ring-2"
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-3 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-60"
      >
        {loading ? "Submitting…" : "Submit rating"}
      </button>
    </form>
  );
}

export default function RestaurantDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const searchParams = useSearchParams();
  const reviewId = searchParams.get("review");
  const { user, ready } = useAuth();
  const router = useRouter();

  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [analytics, setAnalytics] = useState<RestaurantAnalytics | null>(null);
  const [ratings, setRatings] = useState<RatingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [restaurantRes, analyticsRes] = await Promise.all([
        api.restaurants.get(id),
        api.restaurants.analytics(id),
      ]);
      setRestaurant(restaurantRes.restaurant);
      setRatings(restaurantRes.ratings);
      setAnalytics(analyticsRes.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Restaurant not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!reviewId) return;
    const element = document.getElementById(`review-${reviewId}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [reviewId, ratings]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="h-48 animate-pulse rounded-4xl border border-border bg-surface-strong" />
      </main>
    );
  }

  if (error || !restaurant) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10 text-center">
        <p className="font-serif text-2xl text-muted">{error ?? "Not found"}</p>
        <Link
          href="/restaurants"
          className="mt-4 inline-block text-sm text-accent hover:underline"
        >
          ← Back to restaurants
        </Link>
      </main>
    );
  }

  const avg =
    ratings.length > 0
      ? ratings.reduce((s, r) => s + r.score, 0) / ratings.length
      : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
      <Link
        href="/restaurants"
        className="mb-6 inline-block text-sm text-muted transition hover:text-foreground"
      >
        ← Restaurants
      </Link>

      <div className="rounded-4xl border border-border bg-surface p-8 shadow-[0_20px_60px_rgba(70,32,13,0.07)]">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border bg-white/80 px-3 py-0.5 text-xs font-medium text-muted">
            {restaurant.cuisine}
          </span>
          {restaurant.sponsored && (
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-0.5 text-xs font-semibold text-accent">
              Sponsored
            </span>
          )}
        </div>
        <h1 className="mt-3 font-serif text-4xl">{restaurant.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {restaurant.address}, {restaurant.city}
        </p>

        <div className="mt-4 flex items-center gap-4">
          {avg !== null && (
            <span className="text-lg text-accent">
              {"★".repeat(Math.round(avg))}
              <span className="text-muted/40">
                {"★".repeat(5 - Math.round(avg))}
              </span>
              <span className="ml-2 text-sm font-semibold text-foreground">
                {avg.toFixed(1)}
              </span>
            </span>
          )}
          <span className="text-sm text-muted">
            {ratings.length} {ratings.length === 1 ? "rating" : "ratings"}
          </span>
        </div>
      </div>

      {analytics && (
        <section className="mt-6 rounded-4xl border border-border bg-white/70 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.16em] text-muted">
                Restaurant analytics
              </p>
              <h2 className="mt-1 font-serif text-2xl">
                Early metrics snapshot
              </h2>
            </div>
            <span className="rounded-full border border-border bg-surface px-4 py-1 text-xs font-semibold text-muted">
              Groundwork
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-border bg-surface px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                Ratings
              </p>
              <p className="mt-1 text-xl font-semibold">
                {analytics.ratingCount}
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-surface px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                Average score
              </p>
              <p className="mt-1 text-xl font-semibold">
                {analytics.averageScore === null
                  ? "-"
                  : analytics.averageScore.toFixed(1)}
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-surface px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                Recent activity
              </p>
              <p className="mt-1 text-sm text-muted">
                {analytics.recentActivity.last7Days} in 7d,{" "}
                {analytics.recentActivity.last30Days} in 30d
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-border bg-surface px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Top tags
            </p>
            {analytics.topTags.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No tags yet.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {analytics.topTags.map((tag) => (
                  <span
                    key={tag.name}
                    className="rounded-full border border-border bg-white/80 px-3 py-1 text-xs text-muted"
                  >
                    {tag.name} ({tag.count})
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <AffiliateActions restaurant={restaurant} />

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl">Ratings</h2>
          {ready &&
            (user ? (
              <button
                onClick={() => setShowForm((v) => !v)}
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong"
              >
                {showForm ? "Cancel" : "Rate this place"}
              </button>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="rounded-full border border-border px-4 py-2 text-sm transition hover:bg-white/60"
              >
                Log in to rate
              </button>
            ))}
        </div>

        {showForm && user && (
          <RateForm
            restaurantId={id}
            onSuccess={() => {
              setShowForm(false);
              void load();
            }}
          />
        )}

        {ratings.length === 0 ? (
          <p className="mt-6 text-sm text-muted">
            No ratings yet. Be the first!
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {ratings.map((r) => (
              <RatingCard
                key={r.id}
                rating={r}
                isHighlighted={r.id === reviewId}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
