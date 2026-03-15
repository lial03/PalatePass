"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api, type UserProfile } from "../../../lib/api";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-border bg-white/70 p-4 text-center">
      <p className="text-xl font-semibold">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
    </div>
  );
}

export default function UserProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { ready, token, user } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followPending, setFollowPending] = useState(false);

  const isOwnProfile = Boolean(user && user.id === id);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api.users
      .profile(id)
      .then((res) => setProfile(res.profile))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleFollow() {
    if (!token || !profile || followPending) {
      if (!token) router.push("/login");
      return;
    }

    setFollowPending(true);
    try {
      if (isFollowing) {
        await api.users.unfollow(profile.id, token);
        setIsFollowing(false);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                stats: {
                  ...prev.stats,
                  followersCount: Math.max(prev.stats.followersCount - 1, 0),
                },
              }
            : prev,
        );
      } else {
        await api.users.follow(profile.id, token);
        setIsFollowing(true);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                stats: {
                  ...prev.stats,
                  followersCount: prev.stats.followersCount + 1,
                },
              }
            : prev,
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update follow state",
      );
    } finally {
      setFollowPending(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
        <div className="h-56 animate-pulse rounded-4xl border border-border bg-surface-strong" />
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10 text-center sm:px-10">
        <p className="font-serif text-3xl">{error ?? "User not found"}</p>
        <Link
          href="/restaurants"
          className="mt-4 inline-block text-sm text-accent hover:underline"
        >
          Explore restaurants
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
      <section className="rounded-4xl border border-border bg-surface p-8 shadow-[0_20px_60px_rgba(70,32,13,0.07)] sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-white/80 text-2xl font-semibold text-muted">
              {profile.displayName.slice(0, 1).toUpperCase()}
            </div>

            <div>
              <p className="text-sm uppercase tracking-[0.16em] text-muted">
                Profile
              </p>
              <h1 className="mt-1 font-serif text-4xl">
                {profile.displayName}
              </h1>
              <p className="mt-2 text-sm text-muted">
                Joined {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {!ready ? null : isOwnProfile ? (
            <button
              onClick={() => router.push("/feed")}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-white/70"
            >
              View your feed
            </button>
          ) : (
            <button
              onClick={handleFollow}
              disabled={followPending}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                isFollowing
                  ? "border border-border bg-white/70 hover:bg-white"
                  : "bg-accent text-white hover:bg-accent-strong"
              } disabled:opacity-60`}
            >
              {followPending
                ? "Updating..."
                : isFollowing
                  ? "Following"
                  : "Follow"}
            </button>
          )}
        </div>

        {profile.bio && (
          <p className="mt-5 max-w-3xl text-sm leading-7 text-muted">
            {profile.bio}
          </p>
        )}
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Followers" value={profile.stats.followersCount} />
        <Stat label="Following" value={profile.stats.followingCount} />
        <Stat label="Ratings" value={profile.stats.ratingsCount} />
        <Stat label="Avg rating" value={profile.stats.averageRating ?? "n/a"} />
      </section>

      <section className="mt-6 rounded-4xl border border-border bg-white/70 p-6">
        <h2 className="font-serif text-2xl">Favorite cuisines</h2>
        {profile.stats.favoriteCuisines.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No cuisine signals yet.</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.stats.favoriteCuisines.map((cuisine) => (
              <span
                key={cuisine}
                className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm"
              >
                {cuisine}
              </span>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
