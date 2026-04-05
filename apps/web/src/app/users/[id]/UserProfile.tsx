"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Users, Heart, Star, ChevronLeft, UserPlus, UserCheck, Flame, Loader2, List as ListIcon, Settings, Lock } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { api, type UserProfile, type List } from "../../../lib/api";

function getAvatarUrl(name: string) {
  // Deterministic high-quality avatar fallback using DiceBear initials + aesthetic color settings
  const cleanName = encodeURIComponent(name.trim() || 'Foodie');
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
  
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");
  const [creatingList, setCreatingList] = useState(false);

  const isSelf = currentUser?.id === id;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ profile: pData }, matchData, listRes] = await Promise.all([
        api.users.profile(id),
        (ready && currentUser && !isSelf) 
          ? api.users.tasteMatch(id).catch(() => ({ score: 0 })) 
          : Promise.resolve({ score: null }),
        isSelf ? api.lists.mine() : api.lists.userLists(id)
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
        if (profile) setProfile({ ...profile, stats: { ...profile.stats, followersCount: Math.max(0, profile.stats.followersCount - 1) } });
      } else {
        await api.users.follow(id);
        setIsFollowing(true);
        if (profile) setProfile({ ...profile, stats: { ...profile.stats, followersCount: profile.stats.followersCount + 1 } });
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
            isPublic: true
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
      <main className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <p className="font-serif text-3xl text-foreground/80 mb-4">{error ?? "User not found"}</p>
        <button onClick={() => router.back()} className="rounded-full bg-accent px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-accent-strong">
          ← Go Back
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <div className="relative h-[25vh] sm:h-[40vh] w-full overflow-hidden">
         <Image 
           src="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=2000&auto=format&fit=crop"
           alt="Cover"
           fill
           priority
           className="object-cover opacity-60"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
         
         <button onClick={() => router.back()} className="absolute left-6 top-6 z-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white tracking-widest uppercase backdrop-blur hover:bg-white/20 transition">
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
              <div className="relative h-32 w-32 sm:h-40 sm:w-40 shrink-0 overflow-hidden rounded-[2.5rem] border-4 border-black bg-surface shadow-2xl backdrop-blur-sm">
                 <Image 
                    src={profile.avatarUrl || getAvatarUrl(profile.displayName)} 
                    alt={profile.displayName} 
                    fill
                    className="object-cover" 
                 />
              </div>
              
              <div className="mb-2">
                 <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white">{profile.displayName}</h1>
                 {profile.bio && <p className="mt-2 max-w-md text-sm text-white/70 italic line-clamp-2">&ldquo;{profile.bio}&rdquo;</p>}
              </div>
           </div>

           <div className="flex justify-center sm:justify-end pb-2">
             {isSelf ? (
               <button 
                 onClick={() => router.push("/settings")}
                 className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-bold tracking-wide text-white transition hover:bg-white/20 shadow-xl backdrop-blur-md"
               >
                 <Settings className="h-4 w-4" /> Edit Profile
               </button>
             ) : (
               <button 
                 onClick={handleFollowToggle}
                 disabled={followLoading}
                 className={`flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold tracking-wide transition shadow-xl ${isFollowing ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20' : 'bg-accent text-white hover:bg-accent-strong shadow-accent/20'}`}
               >
                  {followLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isFollowing ? <><UserCheck className="h-4 w-4" /> Following</> : <><UserPlus className="h-4 w-4" /> Follow</>}
               </button>
             )}
           </div>
         </div>

        {!isSelf && tasteMatch !== null && tasteMatch > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 overflow-hidden rounded-[2rem] border border-accent/30 bg-gradient-to-r from-accent/20 to-accent/5 p-6 backdrop-blur-md relative"
          >
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-strong">Taste Compatibility</p>
                <h3 className="mt-1 font-serif text-2xl text-white">You and {profile.displayName} matching up</h3>
              </div>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent shadow-lg shadow-accent/40">
                 <span className="font-serif text-xl font-bold text-white">{Math.round(tasteMatch)}%</span>
              </div>
            </div>
            <Flame className="absolute -right-4 -bottom-4 h-32 w-32 text-accent/10 pointer-events-none" />
          </motion.div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
           {[
             { label: "Followers", value: profile.stats.followersCount, icon: Users },
             { label: "Following", value: profile.stats.followingCount, icon: Heart },
             { label: "Ratings", value: profile.stats.ratingsCount, icon: Star },
             { label: "Average Score", value: profile.stats.averageRating ? profile.stats.averageRating.toFixed(1) : "-", icon: Flame },
           ].map((stat, i) => (
             <div key={i} className="flex flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md transition hover:bg-white/10">
                <stat.icon className="mb-3 h-6 w-6 text-accent" />
                <span className="text-2xl font-serif font-bold text-white">{stat.value}</span>
                <span className="mt-1 text-[0.65rem] font-bold uppercase tracking-widest text-white/50">{stat.label}</span>
             </div>
           ))}
        </div>

        {profile.stats.favoriteCuisines.length > 0 && (
          <div className="mt-10">
            <h2 className="font-serif text-2xl text-white mb-4">Top Cuisines</h2>
            <div className="flex flex-wrap gap-2">
               {profile.stats.favoriteCuisines.map((c, i) => (
                 <span key={i} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-md shadow-sm">
                   {c}
                 </span>
               ))}
            </div>
          </div>
        )}

        <div className="mt-12 group/collections">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-3xl text-white">Collections</h2>
            {isSelf && !showCreateList && (
               <button 
                onClick={() => setShowCreateList(true)}
                className="text-xs font-bold uppercase tracking-widest text-accent hover:underline transition-all"
               >
                  + New List
               </button>
            )}
          </div>

          {isSelf && showCreateList && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8 rounded-[2rem] border border-white/20 bg-white/5 p-8 backdrop-blur-md"
              >
                  <form onSubmit={handleCreateList} className="space-y-4">
                      <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-2">Collection Name</label>
                          <input 
                            required
                            value={newListName}
                            onChange={e => setNewListName(e.target.value)}
                            placeholder="e.g. Best Sushi NYC"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent transition-all"
                          />
                      </div>
                      <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-2">Description (Optional)</label>
                          <textarea 
                            value={newListDesc}
                            onChange={e => setNewListDesc(e.target.value)}
                            placeholder="Tell us what this collection is about..."
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent transition-all min-h-[80px]"
                          />
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                          <button 
                            type="submit" 
                            disabled={creatingList}
                            className="rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-white shadow-xl shadow-accent/20 hover:bg-accent-strong transition disabled:opacity-50"
                          >
                             {creatingList ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Collection"}
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setShowCreateList(false)}
                            className="text-sm font-bold text-white/50 hover:text-white transition"
                          >
                              Cancel
                          </button>
                      </div>
                  </form>
              </motion.div>
          )}
          
          {lists.length === 0 ? (
            <div className="rounded-[2.5rem] border border-dashed border-white/20 bg-white/5 p-12 text-center backdrop-blur-sm">
                <ListIcon className="mx-auto h-12 w-12 text-white/20 mb-4" />
                <p className="text-white/50 text-sm">{isSelf ? "You haven't curated any collections yet. Start by saving a restaurant!" : "This user hasn't shared any collections yet."}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
                {lists.map((list) => (
                  <Link 
                    key={list.id} 
                    href={`/lists/${list.id}`}
                    className="group/list relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:bg-white/10 hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-black/20"
                  >
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent">
                                <ListIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white group-hover/list:text-accent transition-colors">{list.name}</h3>
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">{list._count.items} Restaurants</p>
                            </div>
                        </div>
                        {!list.isPublic && <Lock className="h-4 w-4 text-white/30" />}
                    </div>
                    {list.description && <p className="mt-4 text-xs text-white/60 line-clamp-2 leading-relaxed">&ldquo;{list.description}&rdquo;</p>}
                    
                    <div className="mt-6 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-accent/80 opacity-0 group-hover/list:opacity-100 transition-opacity">Discover List →</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Updated {new Date(list.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>

      </motion.div>
    </main>
  );
}
