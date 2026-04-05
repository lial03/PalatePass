"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Script from "next/script";
import { motion } from "framer-motion";
import { Star, Loader2, MessageSquare, Tag } from "lucide-react";
import { LocationMap } from "../../../components/Map";
import { ShareQr } from "../../../components/ShareQr";
import { useAuth } from "../../../context/AuthContext";
import { buildAffiliateUrl, trackAffiliateClick } from "../../../lib/affiliate";
import {
  api,
  type RatingSummary,
  type RestaurantAnalytics,
  type RestaurantDetail,
} from "../../../lib/api";

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
      className={`group relative overflow-hidden rounded-[2rem] border bg-surface p-8 sm:p-10 transition-all duration-300 ${isHighlighted ? "border-accent ring-1 ring-accent" : "border-border/50 hover:border-border"}`}
    >
      <div className="absolute left-8 top-8 font-serif text-8xl leading-none text-accent/10 pointer-events-none select-none">
        &ldquo;
      </div>
      
      <div className="relative z-10 flex flex-col gap-6">
        {rating.notes && (
          <h3 className="font-serif text-2xl sm:text-3xl font-medium leading-snug text-foreground/90">
            {rating.notes}
          </h3>
        )}

        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border/40 pt-6">
          <div className="flex items-center gap-4">
             <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-strong text-lg font-serif font-bold text-foreground overflow-hidden shadow-inner">
               {rating.displayName.substring(0,1).toUpperCase()}
             </div>
             <div>
               <p className="font-bold text-sm tracking-wide uppercase text-foreground">{rating.displayName}</p>
               <div className="mt-1 flex items-center gap-2">
                 <div className="flex">
                   {[1, 2, 3, 4, 5].map((s) => (
                     <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(rating.score) ? "fill-accent text-accent" : "text-border"}`} />
                   ))}
                 </div>
                 <span className="text-xs font-medium text-muted">
                   {new Date(rating.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                 </span>
               </div>
             </div>
          </div>

          <div className="flex flex-col items-end gap-3 text-right">
             <div className="flex items-center gap-2">
               {rating.budgetTier && (
                 <span className="rounded-full border border-border/60 bg-white/50 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-muted">
                   {rating.budgetTier}
                 </span>
               )}
               <button
                 type="button"
                 onClick={() => setShowShare((value) => !value)}
                 className="text-xs font-bold uppercase tracking-widest text-accent hover:underline transition-colors focus:outline-none"
               >
                 {showShare ? "Hide Link" : "Share"}
               </button>
             </div>
          </div>
        </div>

        {rating.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {rating.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-surface-strong px-3 py-1 text-xs font-medium text-muted"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {rating.images && rating.images.length > 0 && (
           <div className="flex gap-3 overflow-x-auto pb-2 pt-2">
              {rating.images.map(img => (
                 <div key={img} className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-border/40 shadow-sm transition hover:scale-105">
                   <Image src={img} alt="Review" fill sizes="128px" className="object-cover" />
                 </div>
              ))}
           </div>
        )}

        {showShare && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-2xl bg-surface-strong p-4">
              <ShareQr
                title="Share this review"
                description="This code links directly to this specific review."
                path={`/restaurants/${rating.restaurantId}?review=${rating.id}`}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function getPlaceholderImage(id: string) {
  const mockImages = [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1200&auto=format&fit=crop"
  ];
  return mockImages[id.charCodeAt(0) % mockImages.length];
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

function InteractiveStarRating({ score, setScore }: { score: number; setScore: (val: number) => void }) {
  const [hoverScore, setHoverScore] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((idx) => {
        const isFilled = (hoverScore !== null ? idx <= hoverScore : idx <= score);
        return (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onMouseEnter={() => setHoverScore(idx)}
            onMouseLeave={() => setHoverScore(null)}
            onClick={() => setScore(idx)}
            className="cursor-pointer p-1"
          >
            <Star className={`h-8 w-8 transition-colors duration-200 ${isFilled ? "fill-accent text-accent" : "text-border/80"}`} />
          </motion.div>
        );
      })}
    </div>
  );
}

function ReviewForm({
  restaurantId,
  onSuccess,
}: {
  restaurantId: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [score, setScore] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [tagsStr, setTagsStr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score === 0) {
      setError("Please select a star rating first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.restaurants.rate(restaurantId, {
        score,
        notes: notes || undefined,
        tags: tagsStr
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 rounded-[2.5rem] border border-border bg-surface-strong p-8 sm:p-10 shadow-[0_20px_50px_rgba(70,32,13,0.06)]">
      <h3 className="mb-6 font-serif text-3xl text-foreground">Write a Review</h3>
      
      {error && <div className="mb-6 rounded-2xl border border-red-100 bg-red-50/50 px-5 py-4 text-sm font-medium text-red-600 shadow-sm">{error}</div>}

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted ml-2">Rating</label>
          <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-sm">
             <InteractiveStarRating score={score} setScore={setScore} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted ml-2">Notes</label>
          <div className="group relative flex rounded-2xl border border-border/80 bg-white p-4 transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 shadow-sm">
            <MessageSquare className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-muted transition-colors group-focus-within:text-accent" />
            <textarea
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] w-full bg-transparent text-sm outline-none placeholder-muted/60"
              placeholder="What did you love about it? What should we order?"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted ml-2">Tags (comma separated)</label>
          <div className="group relative flex items-center rounded-2xl border border-border/80 bg-white px-4 transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 shadow-sm">
             <Tag className="h-5 w-5 text-muted transition-colors group-focus-within:text-accent" />
             <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              className="w-full bg-transparent px-3 py-4 text-sm outline-none placeholder-muted/60"
              placeholder="e.g. date spot, spicy, patio"
            />
          </div>
        </div>
      </div>

      <button disabled={loading} type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-4 text-base font-bold tracking-wide text-white transition hover:bg-accent-strong disabled:bg-accent/70 shadow-lg shadow-accent/20 mt-8">
        {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting</> : "Publish Review"}
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
    <>
    <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-3xl px-6 py-10 sm:px-10"
    >
      <Link
        href="/restaurants"
        className="mb-6 inline-block text-sm text-muted transition hover:text-foreground"
      >
        ← Restaurants
      </Link>

      <motion.div 
        layoutId={`card-${restaurant.id}`}
        className="relative overflow-hidden rounded-4xl border border-border/60 bg-surface px-8 py-10 shadow-[0_25px_80px_rgba(192,57,43,0.12)]"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-80"
          style={{ backgroundImage: `url(${getPlaceholderImage(restaurant.id)})` }}
        />
        <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-black via-black/80 to-black/20" />
        
        <div className="relative z-10 flex items-center gap-2">
          <span className="rounded-full border border-white/30 bg-black/40 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-widest text-white shadow-sm backdrop-blur-md">
            {restaurant.cuisine}
          </span>
          {restaurant.sponsored && (
            <span className="rounded-full border border-accent/40 bg-accent/30 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-widest text-white backdrop-blur-md">
              Sponsored
            </span>
          )}
        </div>
        <h1 className="relative z-10 mt-5 font-serif text-5xl leading-tight text-white sm:text-6xl">{restaurant.name}</h1>
        <p className="relative z-10 mt-3 text-base font-medium text-white/80">
          {restaurant.address}, {restaurant.city}
        </p>

        {restaurant.lat !== null && restaurant.lng !== null && (
          <div className="relative z-10 mt-8 mb-6 h-[300px] w-full overflow-hidden rounded-3xl border border-white/20 shadow-lg">
             <LocationMap markers={[{ id: restaurant.id, lat: restaurant.lat as number, lng: restaurant.lng as number, title: restaurant.name }]} />
          </div>
        )}

        <div className="relative z-10 mt-6 flex items-center gap-5 border-t border-white/20 pt-6">
          {avg !== null && (
            <div className="flex items-center gap-1.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-md shadow-accent/40">
                <Star className="h-5 w-5 fill-white" />
              </span>
              <span className="text-xl font-bold text-white">
                {avg.toFixed(1)}
              </span>
            </div>
          )}
          <span className="text-sm font-medium uppercase tracking-widest text-white/80">
            {ratings.length} {ratings.length === 1 ? "review" : "reviews"}
          </span>
        </div>
      </motion.div>

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
          <ReviewForm
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
    </motion.main>
    </>
  );
}
