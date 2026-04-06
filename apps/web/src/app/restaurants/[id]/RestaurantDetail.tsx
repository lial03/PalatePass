"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronLeft,
  Clock,
  DollarSign,
  Edit3,
  Flame,
  Heart,
  Info,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  Share2,
  ShieldCheck,
  Star,
  Trash2,
  UserCheck,
  Wallet,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  api,
  type List,
  type RatingSummary,
  type Restaurant,
} from "../../../lib/api";
import { getRestaurantImage } from "../../../lib/images";

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null)
    return (
      <span className="text-xs font-semibold text-muted">No ratings yet</span>
    );
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
          <Star
            key={s}
            className={`h-3 w-3 ${s <= Math.round(score || 0) ? "fill-accent text-accent" : "fill-muted/20 text-muted/20"}`}
          />
        ))}
      </div>
      <span className="text-sm font-bold text-accent">{score.toFixed(1)}</span>
    </div>
  );
}

const BUDGET_TIERS = [
  { id: "budget", label: "Budget", icon: Wallet },
  { id: "mid", label: "Mid-Range", icon: Wallet },
  { id: "premium", label: "Premium", icon: DollarSign },
  { id: "luxury", label: "Luxury", icon: DollarSign },
];

export default function RestaurantDetail() {
  const { id } = useParams() as { id: string };
  const { user, ready } = useAuth();
  const router = useRouter();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [ratings, setRatings] = useState<RatingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showListSelector, setShowListSelector] = useState(false);
  const [userLists, setUserLists] = useState<List[]>([]);
  const [savingToList, setSavingToList] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Rating State
  const [ratingScore, setRatingScore] = useState<number | null>(null);
  const [ratingNotes, setRatingNotes] = useState("");
  const [budgetTier, setBudgetTier] = useState<string>("");
  const [budgetAmount, setBudgetAmount] = useState<string>("");
  const [budgetCurrency, setBudgetCurrency] = useState("USD");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [submittingRating, setSubmittingRating] = useState(false);

  // Edit State
  const [editName, setEditName] = useState("");
  const [editCuisine, setEditCuisine] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.restaurants.get(id);
      setRestaurant(res.restaurant);
      setRatings(res.ratings);
      setEditName(res.restaurant.name);
      setEditCuisine(res.restaurant.cuisine);
      setEditAddress(res.restaurant.address);
    } catch {
      setError("Restaurant not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadLists = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.lists.mine();
      setUserLists(res.data);
    } catch {
      console.error("Failed to load user lists");
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (ready && user) {
      void loadLists();
    }
  }, [user, ready, loadLists]);

  const handleSaveToList = async (listId: string) => {
    setSavingToList(listId);
    try {
      await api.lists.addItem(listId, { restaurantId: id });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      setShowListSelector(false);
      void loadLists();
    } catch {
      alert("Failed to save to list");
    } finally {
      setSavingToList(null);
    }
  };

  const handleEditRating = (rating: RatingSummary) => {
    setRatingScore(rating.score);
    setRatingNotes(rating.notes || "");
    setBudgetTier(rating.budgetTier || "");
    setBudgetAmount(rating.budgetAmount?.toString() || "");
    setBudgetCurrency(rating.budgetCurrency || "USD");
    setPhotoUrls(rating.photoUrls || []);
    setShowRatingModal(true);
  };

  const handleDeleteRating = async () => {
    if (!confirm("Are you sure you want to retract your lens?")) return;
    try {
      await api.restaurants.unrate(id);
      void load();
    } catch {
      alert("Failed to retract rating");
    }
  };

  const handleSubmitRating = async () => {
    if (ratingScore === null) return;
    setSubmittingRating(true);
    try {
      await api.restaurants.rate(id, {
        score: ratingScore,
        notes: ratingNotes,
        budgetTier:
          (budgetTier as "budget" | "mid" | "premium" | "luxury") || undefined,
        budgetAmount: budgetAmount ? parseInt(budgetAmount) : undefined,
        budgetCurrency: budgetAmount ? budgetCurrency : undefined,
        photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
      });
      setShowRatingModal(false);
      // Reset
      setRatingScore(null);
      setRatingNotes("");
      setBudgetTier("");
      setBudgetAmount("");
      setPhotoUrls([]);
      void load();
    } catch {
      alert("Failed to submit rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleUpdateSpot = async () => {
    setSubmittingEdit(true);
    try {
      await api.restaurants.update(id, {
        name: editName,
        cuisine: editCuisine,
        address: editAddress,
      });
      setShowEditModal(false);
      void load();
    } catch {
      alert("Failed to update spot");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteSpot = async () => {
    try {
      await api.restaurants.delete(id);
      router.push("/restaurants");
    } catch {
      alert("Failed to delete spot");
    }
  };

  const handleRealUpload = () => {
    if (!window.cloudinary) return;

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo",
        uploadPreset:
          process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
          "palatepass_unsigned",
        multiple: true,
        resourceType: "image",
        maxFiles: 5,
        cropping: true,
        showSkipCropButton: true,
        styles: { palette: { theme: "black" } },
      },
      (error, result) => {
        if (!error && result && result.event === "success") {
          setPhotoUrls((prev) => [...prev, result.info.secure_url]);
        }
      },
    );
    widget.open();
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </main>
    );
  }

  if (error || !restaurant) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-4">
          {error}
        </h1>
        <Link
          href="/restaurants"
          className="text-accent font-bold hover:underline"
        >
          ← Back to Explorer
        </Link>
      </main>
    );
  }

  const isCreator = user?.id === restaurant.createdBy;

  return (
    <>
      <Script
        src="https://upload-widget.cloudinary.com/global/all.js"
        strategy="lazyOnload"
      />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-background pb-20 pt-32"
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <button
            onClick={() => router.back()}
            className="mb-8 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted transition hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Back to spots
          </button>

          <div className="flex flex-col gap-12 lg:flex-row">
            {/* Header Content */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent uppercase tracking-widest">
                  {restaurant.cuisine}
                </span>
                <ScoreBadge score={restaurant.averageScore} />
              </div>

              <div className="flex items-start gap-4">
                <h1 className="font-serif text-5xl md:text-7xl font-bold leading-tight text-foreground">
                  {restaurant.name}
                </h1>
                {isCreator && (
                  <div className="mt-4 flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-accent">
                    <ShieldCheck className="h-3 w-3" /> Creator
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-6 text-muted">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {restaurant.address}, {restaurant.city}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Open until 11:00 PM
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {ratings.length} Reviews
                  </span>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <div className="relative">
                  <button
                    id="btn-save-to-list"
                    onClick={() => setShowListSelector(!showListSelector)}
                    className="flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-sm font-bold tracking-wide text-white shadow-xl shadow-accent/20 transition hover:bg-accent-strong hover:-translate-y-0.5"
                  >
                    <Plus className="h-5 w-5" /> Save to Collection
                  </button>

                  <AnimatePresence>
                    {showListSelector && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 top-full z-50 mt-4 w-72 rounded-ui border border-glass-border bg-glass-bg p-4 shadow-premium backdrop-blur-xl"
                      >
                        <h4 className="mb-3 px-2 text-xs font-bold uppercase tracking-widest text-muted">
                          Your Collections
                        </h4>
                        <div className="max-h-60 overflow-y-auto space-y-1">
                          {userLists.length === 0 ? (
                            <p className="px-2 py-4 text-center text-xs text-muted italic">
                              You haven&apos;t created any collections yet.
                            </p>
                          ) : (
                            userLists.map((list) => (
                              <button
                                key={list.id}
                                onClick={() => handleSaveToList(list.id)}
                                disabled={!!savingToList}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition hover:bg-surface"
                              >
                                <span className="truncate">{list.name}</span>
                                {savingToList === list.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                                ) : (
                                  <span className="text-xs text-muted">
                                    {list._count.items}
                                  </span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                        <Link
                          href={`/users/${user?.id}`}
                          className="mt-2 block rounded-xl border border-dashed border-border p-2 text-center text-xs font-bold uppercase tracking-widest text-accent hover:bg-surface"
                        >
                          + Create New Collection
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {saveSuccess && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="absolute left-full top-0 ml-4 flex items-center gap-2 whitespace-nowrap rounded-full bg-green-500 px-4 py-3 text-sm font-bold text-white shadow-lg"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Saved!
                    </motion.div>
                  )}
                </div>
                <button className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-white text-muted transition hover:border-accent hover:text-accent group">
                  <Heart className="h-6 w-6 group-hover:fill-accent" />
                </button>
                <button className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-white text-muted transition hover:border-foreground hover:text-foreground">
                  <Share2 className="h-6 w-6" />
                </button>

                {isCreator && (
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      id="btn-edit-spot"
                      onClick={() => setShowEditModal(true)}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-white text-muted transition hover:border-accent hover:text-accent"
                    >
                      <Edit3 className="h-5 w-5" />
                    </button>
                    <button
                      id="btn-delete-spot"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-white text-muted transition hover:border-red-500 hover:text-red-500"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Hero Section Placeholder */}
            <div className="relative flex-1 lg:max-w-xl">
              <div className="aspect-4/5 w-full overflow-hidden rounded-section border border-border shadow-premium relative">
                <Image
                  src={getRestaurantImage(restaurant)}
                  alt={restaurant.name}
                  fill
                  priority
                  unoptimized
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
              </div>
            </div>
          </div>

          {/* Community Ratings Section */}
          <section className="mt-32">
            <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                  The Community Lens
                </p>
                <h2 className="mt-2 font-serif text-4xl md:text-5xl font-bold">
                  What Trust Looks Like
                </h2>
              </div>
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-foreground text-background shadow-xl">
                <Flame className="h-10 w-10" />
              </div>
            </div>

            {ratings.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-section border-2 border-dashed border-border py-24 text-center">
                <Info className="mb-4 h-12 w-12 text-muted/20" />
                <p className="font-serif text-2xl text-muted">
                  No ratings yet &mdash; be the first to lend your lens.
                </p>
                <button
                  id="btn-lend-lens-empty"
                  onClick={() => setShowRatingModal(true)}
                  className="mt-8 rounded-full bg-accent px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-accent-strong"
                >
                  Lend Your Lens
                </button>
              </div>
            ) : (
              <div className="space-y-16">
                <div className="flex justify-center">
                  <button
                    id="btn-lend-lens"
                    onClick={() => setShowRatingModal(true)}
                    className="group relative flex items-center gap-3 rounded-full bg-foreground px-10 py-5 text-sm font-bold tracking-wide text-background transition hover:-translate-y-1 hover:shadow-premium"
                  >
                    <Plus className="h-5 w-5 transition group-hover:rotate-90" />{" "}
                    Lend Your Lens
                  </button>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {ratings.map((rating) => (
                    <div
                      key={rating.id}
                      className="group relative flex flex-col rounded-card border border-border bg-white p-8 shadow-sm transition hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1"
                    >
                      <div className="mb-6 flex items-center justify-between">
                        <Link
                          href={`/users/${rating.userId}`}
                          className="flex items-center gap-3"
                        >
                          <div className="h-10 w-10 rounded-full bg-surface-strong shadow-inner" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-bold text-foreground">
                                {rating.displayName}
                              </p>
                              {rating.userId === user?.id && (
                                <UserCheck className="h-3 w-3 text-accent" />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs uppercase font-bold text-muted tracking-widest">
                                Matched Taste
                              </p>
                              {rating.budgetTier && (
                                <span className="text-xs bg-accent/5 text-accent px-1.5 py-0.5 rounded font-black italic uppercase tracking-tighter">
                                  {rating.budgetTier}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                        <div className="flex items-center gap-3">
                          {rating.userId === user?.id && (
                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditRating(rating)}
                                className="h-8 w-8 flex items-center justify-center rounded-full bg-surface hover:bg-accent/10 hover:text-accent transition"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleDeleteRating}
                                className="h-8 w-8 flex items-center justify-center rounded-full bg-surface hover:bg-red-50 hover:text-red-500 transition"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/20">
                            <span className="font-serif text-sm font-black">
                              {rating.score}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="font-serif text-lg leading-relaxed text-foreground italic line-clamp-3">
                        &ldquo;{rating.notes}&rdquo;
                      </p>

                      {rating.photoUrls && rating.photoUrls.length > 0 && (
                        <div className="mt-6 flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                          {rating.photoUrls.map((url, idx) => (
                            <div
                              key={idx}
                              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border shadow-sm"
                            >
                              <Image
                                src={url}
                                alt={`Review photo ${idx + 1}`}
                                fill
                                unoptimized
                                className="object-cover transition duration-300 hover:scale-110"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-6">
                        <div className="text-xs font-bold uppercase tracking-widest text-muted">
                          {new Date(rating.createdAt).toLocaleDateString()}
                        </div>
                        {rating.budgetAmount && (
                          <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                            <Wallet className="h-3 w-3 text-muted" />{" "}
                            {rating.budgetCurrency} {rating.budgetAmount}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </motion.main>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && (
          <div className="fixed inset-0 z-200 flex items-center justify-center p-6 sm:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-foreground/90 backdrop-blur-md"
              onClick={() => setShowRatingModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl overflow-y-auto max-h-[90vh] rounded-section border border-white/10 bg-surface-strong p-8 shadow-2xl backdrop-blur-xl sm:p-14 custom-scrollbar"
            >
              <button
                onClick={() => setShowRatingModal(false)}
                className="absolute right-10 top-10 rounded-full bg-black/5 p-3 text-muted/40 hover:bg-black/10 hover:text-foreground transition-all"
              >
                <X className="h-6 w-6" />
              </button>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-accent">
                Submit Review
              </p>
              <h2 className="mb-12 font-serif text-5xl md:text-6xl font-bold tracking-tight text-foreground">
                Lend Your Lens
              </h2>

              <div className="grid grid-cols-1 gap-14 lg:grid-cols-2">
                <div className="space-y-12">
                  <div className="space-y-5">
                    <label className="flex items-center gap-2.5 text-xs font-black uppercase tracking-[0.2em] text-muted/60">
                      <Star className="h-4 w-4" /> Your Score (1-10)
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          onClick={() => setRatingScore(num)}
                          className={`h-12 w-12 rounded-2xl font-serif text-lg font-black transition-all ${ratingScore === num ? "bg-accent text-white shadow-2xl shadow-accent/40 scale-110 ring-4 ring-accent/20" : "bg-white border border-border text-foreground/40 hover:border-accent/50 hover:text-accent"}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <label className="flex items-center gap-2.5 text-xs font-black uppercase tracking-[0.2em] text-muted/60">
                      <Wallet className="h-4 w-4" /> Spend & Budget
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {BUDGET_TIERS.map((tier) => (
                        <button
                          key={tier.id}
                          onClick={() => setBudgetTier(tier.id)}
                          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border px-6 py-5 transition-all ${budgetTier === tier.id ? "bg-accent border-accent text-white shadow-2xl shadow-accent/20" : "bg-white border-border text-foreground/40 hover:border-accent/40 hover:text-accent"}`}
                        >
                          <tier.icon
                            className={`h-6 w-6 mb-1 ${budgetTier === tier.id ? "text-white" : "text-accent/30"}`}
                          />
                          <span className="text-xs font-black uppercase tracking-[0.15em]">
                            {tier.label}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1 relative group">
                        <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/20 transition-colors group-focus-within:text-accent" />
                        <input
                          type="number"
                          value={budgetAmount}
                          onChange={(e) => setBudgetAmount(e.target.value)}
                          placeholder="Amount"
                          className="w-full rounded-ui border border-border bg-white/50 pl-14 pr-6 py-5 text-lg font-bold text-foreground outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/5 transition-all placeholder:text-muted/30"
                        />
                      </div>
                      <select
                        value={budgetCurrency}
                        onChange={(e) => setBudgetCurrency(e.target.value)}
                        className="rounded-ui border border-border bg-white/50 px-8 py-5 text-lg font-bold text-foreground outline-none focus:border-accent/50 transition-all appearance-none cursor-pointer"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-12">
                  <div className="space-y-5">
                    <label className="flex items-center gap-2.5 text-xs font-black uppercase tracking-[0.2em] text-muted/60">
                      <MessageSquare className="h-4 w-4" /> Culinary Notes
                    </label>
                    <textarea
                      value={ratingNotes}
                      onChange={(e) => setRatingNotes(e.target.value)}
                      placeholder="Share your experience..."
                      className="min-h-50 w-full rounded-ui border border-border bg-white/50 p-8 text-lg font-serif italic text-foreground outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/5 transition-all placeholder:text-muted/30 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="space-y-5">
                    <label className="flex items-center gap-2.5 text-xs font-black uppercase tracking-[0.2em] text-muted/60">
                      <Camera className="h-4 w-4" /> Visual Evidence
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {photoUrls.map((url, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="group relative h-24 w-24 overflow-hidden rounded-3xl border border-white/20 shadow-2xl"
                        >
                          <Image
                            src={url}
                            alt="Review"
                            fill
                            unoptimized
                            className="object-cover"
                          />
                          <button
                            onClick={() =>
                              setPhotoUrls((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              )
                            }
                            className="absolute hidden group-hover:flex inset-0 items-center justify-center bg-black/60 text-white transition-all"
                          >
                            <X className="h-6 w-6" />
                          </button>
                        </motion.div>
                      ))}
                      <button
                        type="button"
                        onClick={handleRealUpload}
                        className="flex h-24 w-24 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border bg-white text-muted/40 hover:border-accent/50 hover:bg-white hover:text-accent transition-all duration-300"
                      >
                        <Plus className="h-7 w-7" />
                        <span className="text-xs font-black tracking-widest uppercase">
                          ADD
                        </span>
                      </button>
                    </div>
                  </div>

                  <button
                    id="btn-submit-rating"
                    disabled={submittingRating || ratingScore === null}
                    onClick={handleSubmitRating}
                    className="w-full rounded-full bg-accent py-6 text-lg font-black tracking-widest uppercase text-white shadow-2xl shadow-accent/30 transition-all hover:bg-accent-strong hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:grayscale mt-4"
                  >
                    {submittingRating ? (
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-white" />
                    ) : (
                      "Submit Rating"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-200 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-foreground/90 backdrop-blur-md"
              onClick={() => setShowEditModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-xl rounded-section border border-white/10 bg-surface-strong p-8 shadow-2xl backdrop-blur-xl sm:p-12"
            >
              <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-accent">
                Spot Management
              </p>
              <h2 className="mb-8 font-serif text-4xl font-bold tracking-tight text-foreground">
                Edit Spot
              </h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted/60 ml-2">
                    Restaurant Name
                  </label>
                  <input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-ui border border-border bg-white/50 px-8 py-5 text-foreground outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/5 transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted/60 ml-2">
                    Cuisine Type
                  </label>
                  <input
                    id="edit-cuisine"
                    value={editCuisine}
                    onChange={(e) => setEditCuisine(e.target.value)}
                    className="w-full rounded-ui border border-border bg-white/50 px-8 py-5 text-foreground outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/5 transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted/60 ml-2">
                    Physical Address
                  </label>
                  <input
                    id="edit-address"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full rounded-ui border border-border bg-white/50 px-8 py-5 text-foreground outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/5 transition-all font-bold"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 rounded-full border border-border py-5 text-sm font-black uppercase tracking-widest text-muted hover:bg-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-save-edit"
                    onClick={handleUpdateSpot}
                    disabled={submittingEdit}
                    className="flex-1 rounded-full bg-accent py-5 text-sm font-black uppercase tracking-widest text-white shadow-2xl shadow-accent/20 hover:bg-accent-strong disabled:opacity-50 transition-all"
                  >
                    {submittingEdit ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-250 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md rounded-card border border-red-500/20 bg-surface-strong p-8 text-center shadow-2xl backdrop-blur-xl"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                <AlertTriangle className="h-10 w-10" />
              </div>
              <h3 className="mb-2 font-serif text-3xl font-bold text-foreground">
                Permanently Remove?
              </h3>
              <p className="mb-10 text-sm font-medium text-muted">
                This action cannot be undone. All ratings and history associated
                with this spot will be lost.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-full border border-border py-4 text-xs font-black uppercase tracking-widest text-muted hover:bg-surface transition-all"
                >
                  Keep Spot
                </button>
                <button
                  id="btn-confirm-delete"
                  onClick={handleDeleteSpot}
                  className="flex-1 rounded-full bg-red-500 py-4 text-xs font-black uppercase tracking-widest text-white shadow-2xl shadow-red-500/30 hover:bg-red-600 transition-all"
                >
                  Delete Spot
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
