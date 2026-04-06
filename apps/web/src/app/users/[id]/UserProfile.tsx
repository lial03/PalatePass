"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Users, Heart, Star, ChevronLeft, UserPlus, UserCheck, Flame, Loader2, List as ListIcon, Settings, Lock, X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { api, type UserProfile, type List } from "../../../lib/api";

function UserListModal({ 
  isOpen, 
  onClose, 
  title, 
  type, 
  userId 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  type: 'followers' | 'following';
  userId: string;
}) {
  const [users, setUsers] = useState<Array<{ id: string; displayName: string; avatarUrl: string; bio: string | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const load = async () => {
        setLoading(true);
        try {
          const res = type === 'followers' 
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg overflow-hidden rounded-[3rem] border border-white/10 bg-[#1c1917] shadow-2xl backdrop-blur-xl flex flex-col max-h-[80vh]"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Social Circle</p>
             <h2 className="mt-1 font-serif text-3xl font-bold text-white">{title}</h2>
           </div>
           <button 
            onClick={onClose}
            className="rounded-full bg-white/5 p-2 text-white/40 hover:bg-white/10 hover:text-white transition"
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
               <Users className="mx-auto h-12 w-12 text-white/10 mb-4" />
               <p className="text-white/40 font-medium italic">Nothing to see here yet.</p>
             </div>
           ) : (
             <div className="space-y-4">
                {users.map(user => (
                  <Link 
                    key={user.id} 
                    href={`/users/${user.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between rounded-2xl bg-white/5 p-4 hover:bg-white/10 transition group"
                  >
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-surface shrink-0">
                           <Image 
                            src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`} 
                            alt={user.displayName}
                            width={48} height={48}
                            className="object-cover"
                           />
                        </div>
                        <div>
                           <p className="font-bold text-white group-hover:text-accent transition-colors">{user.displayName}</p>
                           {user.bio && <p className="text-xs text-white/40 line-clamp-1 italic">{user.bio}</p>}
                        </div>
                     </div>
                     <ChevronLeft className="h-4 w-4 text-white/20 rotate-180 group-hover:text-accent transition-all" />
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

  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; type: 'followers' | 'following' }>({
    isOpen: false,
    title: '',
    type: 'followers'
  });

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
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
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
    <main className="min-h-screen bg-black overflow-x-hidden">
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
                 {profile.bio && <p className="mt-2 max-w-md text-sm text-white/70 italic line-clamp-2 leading-relaxed">&ldquo;{profile.bio}&rdquo;</p>}
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
               <div className="flex gap-3">
                  <button 
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-black tracking-widest uppercase transition shadow-xl ${isFollowing ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20' : 'bg-accent text-white hover:bg-accent-strong shadow-accent/20'}`}
                  >
                    {followLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isFollowing ? <><UserCheck className="h-4 w-4" /> Following</> : <><UserPlus className="h-4 w-4" /> Follow</>}
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
            className="mt-10 overflow-hidden rounded-[2.5rem] border border-accent/20 bg-gradient-to-r from-accent/10 to-transparent p-1 shadow-2xl"
          >
            <div className="rounded-[2.4rem] bg-black/40 backdrop-blur-2xl p-8 flex items-center justify-between relative overflow-hidden">
               <div className="relative z-10">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Epicurean Pulse</p>
                 <h3 className="mt-2 font-serif text-3xl font-bold text-white">Taste Compatibility</h3>
                 <p className="mt-2 text-sm text-white/40 font-medium">Your culinary lenses are highly synchronized.</p>
               </div>
               <div className="relative z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-accent shadow-2xl shadow-accent/40 ring-4 ring-accent/10">
                  <span className="font-serif text-2xl font-black text-white">{Math.round(tasteMatch)}%</span>
               </div>
               <Flame className="absolute -right-8 -bottom-8 h-40 w-40 text-accent/5 pointer-events-none" />
            </div>
          </motion.div>
        )}

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
           {[
             { label: "Followers", value: profile.stats.followersCount, icon: Users, action: () => setModalConfig({ isOpen: true, title: 'Followers', type: 'followers' }) },
             { label: "Following", value: profile.stats.followingCount, icon: Heart, action: () => setModalConfig({ isOpen: true, title: 'Following', type: 'following' }) },
             { label: "Ratings", value: profile.stats.ratingsCount, icon: Star },
             { label: "Average Score", value: profile.stats.averageRating ? profile.stats.averageRating.toFixed(1) : "-", icon: Flame },
           ].map((stat, i) => (
             <button 
              key={i} 
              onClick={stat.action}
              disabled={!stat.action}
              className={`flex flex-col items-center justify-center rounded-[2.5rem] border border-white/5 bg-white/5 p-8 backdrop-blur-md transition-all ${stat.action ? 'hover:bg-white/10 hover:border-accent/20 cursor-pointer group' : 'cursor-default'}`}
             >
                <stat.icon className={`mb-4 h-6 w-6 transition-colors ${stat.action ? 'text-accent/50 group-hover:text-accent' : 'text-accent'}`} />
                <span className="text-3xl font-serif font-black text-white">{stat.value}</span>
                <span className="mt-2 text-[0.65rem] font-black uppercase tracking-[0.2em] text-white/30 group-hover:text-white/60 transition-colors">{stat.label}</span>
             </button>
           ))}
        </div>

        {profile.stats.favoriteCuisines.length > 0 && (
          <div className="mt-12">
            <h2 className="font-serif text-3xl font-bold text-white mb-6">Cuisine Expertise</h2>
            <div className="flex flex-wrap gap-3">
               {profile.stats.favoriteCuisines.map((c, i) => (
                 <span key={i} className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-black uppercase tracking-widest text-white/80 backdrop-blur-md shadow-xl hover:bg-white/10 transition-colors">
                   {c}
                 </span>
               ))}
            </div>
          </div>
        )}

        <div className="mt-16 group/collections">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-4xl font-bold text-white">Collections</h2>
            {isSelf && !showCreateList && (
               <button 
                onClick={() => setShowCreateList(true)}
                className="flex items-center gap-2 rounded-full bg-accent/10 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-accent transition-all hover:bg-accent/20"
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
                  className="mb-10 rounded-[3rem] border border-white/10 bg-white/5 p-10 backdrop-blur-2xl shadow-2xl"
                >
                    <form onSubmit={handleCreateList} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Collection Title</label>
                            <input 
                              required
                              value={newListName}
                              onChange={e => setNewListName(e.target.value)}
                              placeholder="e.g. Kyoto Midnight Gems"
                              className="w-full rounded-[2rem] border border-white/10 bg-black/20 px-8 py-5 text-lg font-bold text-white outline-none focus:border-accent transition-all placeholder:text-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Curatorial Theme</label>
                            <textarea 
                              value={newListDesc}
                              onChange={e => setNewListDesc(e.target.value)}
                              placeholder="Define the identity of this gastronomy circle..."
                              className="w-full rounded-[2.5rem] border border-white/10 bg-black/20 px-8 py-6 text-white outline-none focus:border-accent transition-all min-h-[120px] resize-none leading-relaxed"
                            />
                        </div>
                        <div className="flex items-center gap-4 pt-4">
                            <button 
                              type="submit" 
                              disabled={creatingList}
                              className="flex-1 rounded-full bg-accent py-5 text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-accent/20 hover:bg-accent-strong transition disabled:opacity-50"
                            >
                               {creatingList ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Publish Collection"}
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setShowCreateList(false)}
                              className="flex-1 rounded-full border border-white/10 py-5 text-sm font-black uppercase tracking-[0.2em] text-white/50 hover:bg-white/5 transition"
                            >
                                Discard
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}
          </AnimatePresence>
          
          {lists.length === 0 ? (
            <div className="rounded-[3rem] border border-dashed border-white/10 bg-white/5 py-24 text-center backdrop-blur-sm">
                <ListIcon className="mx-auto h-16 w-16 text-white/5 mb-6" />
                <p className="font-serif text-2xl text-white/20 italic">{isSelf ? "Your curatorial lens is waiting. Start your first collection." : "No public collections shared yet."}</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
                {lists.map((list) => (
                  <Link 
                    key={list.id} 
                    href={`/lists/${list.id}`}
                    className="group/list relative overflow-hidden rounded-[3rem] border border-white/10 bg-white/5 p-10 backdrop-blur-md transition-all hover:bg-white/10 hover:translate-y-[-8px] hover:shadow-2xl"
                  >
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-accent/20 text-accent transition-transform group-hover/list:scale-110">
                                <ListIcon className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="font-serif text-3xl font-bold text-white group-hover/list:text-accent transition-colors">{list.name}</h3>
                                <div className="flex items-center gap-3 mt-1.5">
                                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">{list._count.items} Spots</span>
                                   <span className="h-1 w-1 rounded-full bg-white/20" />
                                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Updated {new Date(list.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        {!list.isPublic && <Lock className="h-5 w-5 text-accent/40" />}
                    </div>
                    {list.description && <p className="mt-8 text-sm text-white/50 italic line-clamp-2 leading-relaxed">&ldquo;{list.description}&rdquo;</p>}
                    
                    <div className="mt-10 flex items-center justify-between">
                        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-accent opacity-0 group-hover/list:opacity-100 transition-all -translate-x-4 group-hover/list:translate-x-0">
                          Discover Treasury <ChevronLeft className="h-3 w-3 rotate-180" />
                        </span>
                    </div>
                  </Link>
                ))}
            </div>
          )}
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
