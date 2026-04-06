"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  Flame,
  Heart,
  List as ListIcon,
  Loader2,
  Lock,
  Settings,
  Star,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api, type List, type UserProfile } from "../../../lib/api";
import {
  getRestaurantImage,
  type RestaurantWithRatings,
} from "../../../lib/images";

function UserListModal({
  isOpen,
  onClose,
  title,
  type,
  userId,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: "followers" | "following";
  userId: string;
}) {
  const [users, setUsers] = useState<
    Array<{
      id: string;
      displayName: string;
      avatarUrl: string;
      bio: string | null;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const load = async () => {
        setLoading(true);
        try {
          const res =
            type === "followers"
              ? await api.users.followers(userId)
              : await api.users.following(userId);
          setUsers(res.data);
        } catch (err) {
          console.error("Failed to load list", err);
        } finally {
          setLoading(false);
        }
      };
      void load();
    }
  }, [isOpen, type, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-6 sm:p-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg overflow-hidden rounded-section border border-border bg-surface shadow-premium backdrop-blur-xl flex flex-col max-h-[80vh]"
      >
        <div className="p-8 border-b border-border flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">
              Social Circle
            </p>
            <h2 className="mt-1 font-serif text-3xl font-bold text-foreground">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-black/5 p-2 text-muted hover:bg-black/10 hover:text-foreground transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center">
              <Users className="mx-auto h-12 w-12 text-muted/20 mb-4" />
              <p className="text-muted font-medium italic">
                Nothing to see here yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/users/${user.id}`}
                  onClick={onClose}
                  className="flex items-center justify-between rounded-ui bg-background p-4 hover:bg-surface transition group border border-border/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 overflow-hidden rounded-xl border border-border bg-surface-strong shrink-0">
                      <Image
                        src={
                          user.avatarUrl ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`
                        }
                        alt={user.displayName}
                        width={48}
                        height={48}
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-foreground group-hover:text-accent transition-colors">
                        {user.displayName}
                      </p>
                      {user.bio && (
                        <p className="text-xs text-muted line-clamp-1 italic">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-muted/20 rotate-180 group-hover:text-accent transition-all" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function getAvatarUrl(name: string) {
  const cleanName = encodeURIComponent(name.trim() || "Foodie");
  return `https://api.dicebear.com/7.x/initials/svg?seed=${cleanName}&backgroundColor=46200D,e7ecef,1e1e24&textColor=ffffff`;
}

export default function UserProfileComponent() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { user: currentUser, ready } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [tasteMatch, setTasteMatch] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<"collections" | "ratings">(
    "collections",
  );
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");
  const [creatingList, setCreatingList] = useState(false);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    type: "followers" | "following";
  }>({
    isOpen: false,
    title: "",
    type: "followers",
  });

  const isSelf = currentUser?.id === id;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ profile: pData }, matchData, listRes] = await Promise.all([
        api.users.profile(id),
        ready && currentUser && !isSelf
          ? api.users.tasteMatch(id).catch(() => ({ score: 0 }))
          : Promise.resolve({ score: null }),
        isSelf ? api.lists.mine() : api.lists.userLists(id),
      ]);
      setProfile(pData);
      setLists(listRes.data || []);
      setTasteMatch(matchData?.score ?? null);
    } catch {
      setError("Profile not found");
    } finally {
      setLoading(false);
    }
  }, [id, currentUser, ready, isSelf]);

  useEffect(() => {
    if (ready) {
      void loadData();
    }
  }, [loadData, ready]);

  const handleFollowToggle = async () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.users.unfollow(id);
        setIsFollowing(false);
        if (profile)
          setProfile({
            ...profile,
            stats: {
              ...profile.stats,
              followersCount: Math.max(0, profile.stats.followersCount - 1),
            },
          });
      } else {
        await api.users.follow(id);
        setIsFollowing(true);
        if (profile)
          setProfile({
            ...profile,
            stats: {
              ...profile.stats,
              followersCount: profile.stats.followersCount + 1,
            },
          });
      }
    } catch {
      console.error("Failed to toggle follow");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    setCreatingList(true);
    try {
      const { list } = await api.lists.create({
        name: newListName,
        description: newListDesc || undefined,
        isPublic: true,
      });
      setLists([list, ...lists]);
      setShowCreateList(false);
      setNewListName("");
      setNewListDesc("");
    } catch {
      alert("Failed to create list");
    } finally {
      setCreatingList(false);
    }
  };

  if (loading || !ready) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <p className="font-serif text-3xl text-foreground/80 mb-4">
          {error ?? "User not found"}
        </p>
        <button
          onClick={() => router.back()}
          className="rounded-full bg-accent px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-accent-strong"
        >
          ← Go Back
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <div className="relative h-[25vh] sm:h-[40vh] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=2000&auto=format&fit=crop"
          alt="Cover"
          fill
          priority
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/80 to-transparent" />

        <button
          onClick={() => router.back()}
          className="absolute left-6 top-32 z-10 inline-flex items-center gap-2 rounded-full border border-border bg-white/10 px-4 py-2 text-xs font-bold text-foreground tracking-widest uppercase backdrop-blur hover:bg-white/20 transition focus-gentle"
        >
          <ChevronLeft className="h-4 w-4" /> Go Back
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto max-w-4xl px-6 sm:px-10 -mt-24 sm:-mt-32 pb-20"
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
            <div className="relative h-32 w-32 sm:h-40 sm:w-40 shrink-0 overflow-hidden rounded-card border-4 border-background bg-surface shadow-premium">
              <Image
                src={profile.avatarUrl || getAvatarUrl(profile.displayName)}
                alt={profile.displayName}
                fill
                unoptimized
                className="object-cover"
              />
            </div>

            <div className="mb-2">
              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground">
                {profile.displayName}
              </h1>
              {profile.bio && (
                <p className="mt-2 max-w-md text-sm text-muted italic line-clamp-2 leading-relaxed">
                  &ldquo;{profile.bio}&rdquo;
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-center sm:justify-end pb-2">
            {isSelf ? (
              <button
                onClick={() => router.push("/settings")}
                className="flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3.5 text-sm font-bold tracking-wide text-foreground transition hover:bg-surface-strong shadow-premium"
              >
                <Settings className="h-4 w-4" /> Edit Profile
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-black tracking-widest uppercase transition shadow-xl ${isFollowing ? "bg-surface text-foreground hover:bg-surface-strong border border-border" : "bg-accent text-white hover:bg-accent-strong shadow-accent/20"}`}
                >
                  {followLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserCheck className="h-4 w-4" /> Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" /> Follow
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {!isSelf && tasteMatch !== null && tasteMatch > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10 overflow-hidden rounded-card border border-accent/20 bg-linear-to-r from-accent/10 to-transparent p-1 shadow-premium"
          >
            <div className="rounded-card bg-surface-strong p-8 flex items-center justify-between relative overflow-hidden ring-1 ring-border">
              <div className="relative z-10">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-accent">
                  Epicurean Pulse
                </p>
                <h3 className="mt-2 font-serif text-3xl font-bold text-foreground">
                  Taste Compatibility
                </h3>
                <p className="mt-2 text-sm text-muted font-medium">
                  Your culinary lenses are highly synchronized.
                </p>
              </div>
              <div className="relative z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-accent shadow-premium shadow-accent/40 ring-4 ring-accent/10">
                <span className="font-serif text-2xl font-black text-white">
                  {Math.round(tasteMatch)}%
                </span>
              </div>
              <Flame className="absolute -right-8 -bottom-8 h-40 w-40 text-accent/5 pointer-events-none" />
            </div>
          </motion.div>
        )}

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              label: "Followers",
              value: profile.stats.followersCount,
              icon: Users,
              action: () =>
                setModalConfig({
                  isOpen: true,
                  title: "Followers",
                  type: "followers",
                }),
            },
            {
              label: "Following",
              value: profile.stats.followingCount,
              icon: Heart,
              action: () =>
                setModalConfig({
                  isOpen: true,
                  title: "Following",
                  type: "following",
                }),
            },
            { label: "Ratings", value: profile.stats.ratingsCount, icon: Star },
            {
              label: "Average Score",
              value: profile.stats.averageRating
                ? profile.stats.averageRating.toFixed(1)
                : "-",
              icon: Flame,
            },
          ].map((stat, i) => (
            <button
              key={i}
              onClick={stat.action}
              disabled={!stat.action}
              className={`flex flex-col items-center justify-center rounded-card border border-border bg-surface p-8 shadow-sm transition-all ${stat.action ? "hover:bg-surface-strong hover:border-accent/20 cursor-pointer group" : "cursor-default"}`}
            >
              <stat.icon
                className={`mb-4 h-6 w-6 transition-colors ${stat.action ? "text-accent/50 group-hover:text-accent" : "text-accent"}`}
              />
              <span className="text-3xl font-serif font-black text-foreground">
                {stat.value}
              </span>
              <span className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-muted group-hover:text-foreground transition-colors">
                {stat.label}
              </span>
            </button>
          ))}
        </div>

        {profile.stats.favoriteCuisines.length > 0 && (
          <div className="mt-12">
            <h2 className="font-serif text-3xl font-bold text-foreground mb-6">
              Cuisine Expertise
            </h2>
            <div className="flex flex-wrap gap-3">
              {profile.stats.favoriteCuisines.map((c, i) => (
                <span
                  key={i}
                  className="rounded-full border border-border bg-surface px-6 py-3 text-sm font-black uppercase tracking-widest text-muted shadow-sm hover:bg-surface-strong transition-colors"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-16 flex items-center justify-center gap-2 rounded-full bg-surface-strong p-1.5 border border-border shadow-inner">
          <button
            onClick={() => setActiveTab("collections")}
            aria-label="View Collections"
            className={`flex-1 flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] transition-all ${activeTab === "collections" ? "bg-foreground text-background shadow-xl" : "text-muted hover:text-foreground"}`}
          >
            <ListIcon className="h-4 w-4" /> Collections
          </button>
          <button
            onClick={() => setActiveTab("ratings")}
            aria-label="View Ratings"
            className={`flex-1 flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] transition-all ${activeTab === "ratings" ? "bg-foreground text-background shadow-xl" : "text-muted hover:text-foreground"}`}
          >
            <Star className="h-4 w-4" /> Ratings
          </button>
        </div>

        <div className="mt-16">
          <AnimatePresence mode="wait">
            {activeTab === "collections" ? (
              <motion.div
                key="collections"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="group/collections"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-serif text-4xl font-bold text-foreground">
                    Curated Collections
                  </h2>
                  {isSelf && !showCreateList && (
                    <button
                      onClick={() => setShowCreateList(true)}
                      className="flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-accent-strong shadow-premium shadow-accent/10"
                    >
                      + Create Collection
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {isSelf && showCreateList && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -20 }}
                      className="mb-10 rounded-section border border-border bg-surface p-10 shadow-premium"
                    >
                      <form onSubmit={handleCreateList} className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted ml-4">
                            Collection Title
                          </label>
                          <input
                            required
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            placeholder="e.g. Kyoto Midnight Gems"
                            className="w-full rounded-ui border border-border bg-background px-8 py-5 text-lg font-bold text-foreground outline-none focus:border-accent transition-all placeholder:text-muted/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted ml-4">
                            Curatorial Theme
                          </label>
                          <textarea
                            value={newListDesc}
                            onChange={(e) => setNewListDesc(e.target.value)}
                            placeholder="Define the identity of this gastronomy circle..."
                            className="w-full rounded-card border border-border bg-background px-8 py-6 text-foreground outline-none focus:border-accent transition-all min-h-30 resize-none leading-relaxed"
                          />
                        </div>
                        <div className="flex items-center gap-4 pt-4">
                          <button
                            type="submit"
                            disabled={creatingList}
                            className="flex-1 rounded-full bg-accent py-5 text-sm font-black uppercase tracking-[0.2em] text-white shadow-premium shadow-accent/20 hover:bg-accent-strong transition disabled:opacity-50"
                          >
                            {creatingList ? (
                              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                            ) : (
                              "Publish Collection"
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCreateList(false)}
                            className="flex-1 rounded-full border border-border py-5 text-sm font-black uppercase tracking-[0.2em] text-muted hover:bg-surface transition"
                          >
                            Discard
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {lists.length === 0 ? (
                  <div className="rounded-section border border-dashed border-border bg-surface py-24 text-center">
                    <ListIcon className="mx-auto h-16 w-16 text-muted/10 mb-6" />
                    <p className="font-serif text-2xl text-muted/40 italic">
                      {isSelf
                        ? "Your curatorial lens is waiting. Start your first collection."
                        : "No public collections shared yet."}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {lists.map((list) => (
                      <Link
                        key={list.id}
                        href={`/lists/${list.id}`}
                        className="group/list relative overflow-hidden rounded-section border border-border bg-surface p-10 transition-all hover:bg-surface-strong hover:-translate-y-2 hover:shadow-premium"
                      >
                        {" "}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-ui bg-accent/10 text-accent transition-transform group-hover/list:scale-110">
                              <ListIcon className="h-8 w-8" />
                            </div>
                            <div>
                              <h3 className="font-serif text-3xl font-bold text-foreground group-hover/list:text-accent transition-colors">
                                {list.name}
                              </h3>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-accent">
                                  {list._count.items} Spots
                                </span>
                                <span className="h-1 w-1 rounded-full bg-border" />
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-muted/40">
                                  Updated{" "}
                                  {new Date(
                                    list.updatedAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          {!list.isPublic && (
                            <Lock className="h-5 w-5 text-accent/40" />
                          )}
                        </div>
                        {list.description && (
                          <p className="mt-8 text-sm text-muted italic line-clamp-2 leading-relaxed">
                            &ldquo;{list.description}&rdquo;
                          </p>
                        )}
                        <div className="mt-10 flex items-center justify-between">
                          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-accent opacity-0 group-hover/list:opacity-100 transition-all -translate-x-4 group-hover/list:translate-x-0">
                            Discover Treasury{" "}
                            <ChevronLeft className="h-3 w-3 rotate-180" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="ratings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-serif text-4xl font-bold text-foreground">
                    Lenz History
                  </h2>
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Flame className="h-5 w-5" />
                  </div>
                </div>

                {!profile.ratings || profile.ratings.length === 0 ? (
                  <div className="rounded-section border border-dashed border-border bg-surface py-24 text-center">
                    <Star className="mx-auto h-16 w-16 text-muted/10 mb-6" />
                    <p className="font-serif text-2xl text-muted/40 italic">
                      {isSelf
                        ? "Your epicurean lens is clear. Submit your first rating."
                        : "No culinary evidence shared yet."}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {profile.ratings.map((rating) => (
                      <div
                        key={rating.id}
                        className="group/rating relative overflow-hidden rounded-card border border-border bg-surface p-8 shadow-sm transition-all hover:shadow-premium hover:-translate-y-1"
                      >
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
                          <div className="relative h-40 w-full sm:h-48 sm:w-48 shrink-0 overflow-hidden rounded-ui border border-border shadow-sm">
                            <Image
                              src={getRestaurantImage(
                                rating.restaurant as RestaurantWithRatings,
                              )}
                              alt={rating.restaurant.name}
                              fill
                              unoptimized
                              className="object-cover transition-transform duration-700 group-hover/rating:scale-110"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xs font-black uppercase tracking-[0.2em] text-accent/80">
                                {rating.restaurant.cuisine}
                              </span>
                              <span className="h-1 w-1 rounded-full bg-border" />
                              <span className="text-xs font-black uppercase tracking-[0.2em] text-muted">
                                {rating.restaurant.city}
                              </span>
                            </div>
                            <Link
                              href={`/restaurants/${rating.restaurant.id}`}
                              aria-label={`View details for ${rating.restaurant.name}`}
                              className="font-serif text-3xl font-bold text-foreground hover:text-accent transition-colors block mb-4"
                            >
                              {rating.restaurant.name}
                            </Link>
                            <p className="text-muted italic leading-relaxed line-clamp-3 font-serif">
                              &ldquo;{rating.notes}&rdquo;
                            </p>

                            {rating.photoUrls &&
                              rating.photoUrls.length > 0 && (
                                <div className="mt-6 flex gap-2">
                                  {rating.photoUrls
                                    .slice(0, 4)
                                    .map((url, idx) => (
                                      <div
                                        key={idx}
                                        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border shadow-sm"
                                      >
                                        <Image
                                          src={url}
                                          alt="Review photo"
                                          fill
                                          unoptimized
                                          className="object-cover"
                                        />
                                      </div>
                                    ))}
                                  {rating.photoUrls.length > 4 && (
                                    <div className="h-14 w-14 flex items-center justify-center rounded-xl bg-surface-strong border border-border text-xs font-black text-muted">
                                      +{rating.photoUrls.length - 4}
                                    </div>
                                  )}
                                </div>
                              )}
                          </div>

                          <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-start gap-4 shrink-0">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-premium shadow-accent/20 border-4 border-background">
                              <span className="font-serif text-xl font-black">
                                {rating.score}
                              </span>
                            </div>
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
                              {new Date(rating.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {modalConfig.isOpen && (
          <UserListModal
            isOpen={modalConfig.isOpen}
            onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
            title={modalConfig.title}
            type={modalConfig.type}
            userId={id}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
