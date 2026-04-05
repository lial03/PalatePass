"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, List as ListIcon, Map as MapIcon, LayoutGrid, Trash2, Loader2, Globe, User, Clock, Share2 } from "lucide-react";
import { LocationMap } from "../../../components/Map";
import { ShareQr } from "../../../components/ShareQr";
import { useAuth } from "../../../context/AuthContext";
import { api, type ListDetail } from "../../../lib/api";

function getPlaceholderImage(id?: string) {
  if (!id) return "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800&auto=format&fit=crop";
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

export default function ListDetailComponent() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const router = useRouter();

  const [list, setList] = useState<ListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.lists.get(id);
      setList(res.list);
    } catch {
      setError("Failed to load collection");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRemove = async (restaurantId: string) => {
    if (!list) return;
    setRemovingId(restaurantId);
    try {
        await api.lists.removeItem(list.id, restaurantId);
        setList({
            ...list,
            items: list.items.filter(item => item.restaurantId !== restaurantId)
        });
        void load();
    } catch {
        alert("Failed to remove item");
    } finally {
        setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="mb-6 rounded-full bg-red-50 p-4 text-red-500">
            <Globe className="h-12 w-12" />
        </div>
        <h1 className="font-serif text-3xl font-bold">{error || "Collection not found"}</h1>
        <button onClick={() => router.back()} className="mt-8 rounded-full bg-foreground px-8 py-3 font-bold text-background transition hover:bg-black/80">
            Go Back
        </button>
      </div>
    );
  }

  const isOwner = user?.id === list.userId;
  const markers = list.items
    .filter(item => item.restaurant?.lat && item.restaurant?.lng)
    .map(item => ({
        id: item.restaurant!.id,
        lat: item.restaurant!.lat!,
        lng: item.restaurant!.lng!,
        title: item.restaurant!.name
    }));

  return (
    <main className="min-h-screen bg-background pb-20 pt-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <button 
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted transition hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/20">
                        <ListIcon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent-strong">Discovery Collection</span>
                </div>
                <h1 className="font-serif text-5xl md:text-6xl text-foreground max-w-2xl">{list.name}</h1>
                {list.description && (
                    <p className="mt-6 text-xl text-muted font-serif italic max-w-3xl leading-relaxed">
                        &ldquo;{list.description}&rdquo;
                    </p>
                )}
                
                <div className="mt-8 flex flex-wrap items-center gap-6">
                    <Link href={`/users/${list.user.id}`} className="flex items-center gap-2 group">
                        <div className="h-8 w-8 rounded-full bg-surface-strong flex items-center justify-center overflow-hidden border border-border group-hover:border-accent transition-colors">
                            <User className="h-4 w-4 text-muted group-hover:text-accent" />
                        </div>
                        <span className="text-sm font-bold text-muted group-hover:text-foreground transition-colors">Curated by {list.user.displayName}</span>
                    </Link>
                    <div className="flex items-center gap-2 text-muted">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">Updated {new Date(list.updatedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted">
                        <LayoutGrid className="h-4 w-4" />
                        <span className="text-sm font-medium">{list.items.length} Restaurants</span>
                    </div>
                </div>
            </div>

            <div className="flex rounded-full border border-border bg-white p-1.5 shadow-sm self-start md:self-end">
                <button 
                    onClick={() => setViewMode("grid")}
                    className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-all ${viewMode === "grid" ? 'bg-foreground text-background shadow-md' : 'text-muted hover:text-foreground'}`}
                >
                    <LayoutGrid className="h-4 w-4" /> Grid
                </button>
                <button 
                    onClick={() => setViewMode("map")}
                    className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-all ${viewMode === "map" ? 'bg-foreground text-background shadow-md' : 'text-muted hover:text-foreground'}`}
                >
                    <MapIcon className="h-4 w-4" /> Map
                </button>
            </div>
        </div>

        <section className="mt-12 rounded-[2.5rem] border border-border bg-white/50 p-8 shadow-sm backdrop-blur-sm lg:p-12">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-md">
                    <h2 className="mb-4 flex items-center gap-2 font-serif text-3xl">
                        <Share2 className="h-6 w-6 text-accent" /> Share this collection
                    </h2>
                    <p className="text-muted leading-relaxed">
                        Let others experience your curated culinary lens. Share this entire collection with a single link or QR code.
                    </p>
                </div>
                <div className="flex-1 lg:max-w-lg">
                    <ShareQr 
                        title={`Share "${list.name}"`}
                        description="Let others browse and save your favorite spots."
                        path={`/lists/${list.id}`}
                    />
                </div>
            </div>
        </section>

        <div className="mt-12">
            {viewMode === "map" ? (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-[60vh] w-full rounded-[3rem] overflow-hidden shadow-2xl border border-border"
                >
                    <LocationMap markers={markers} />
                </motion.div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {list.items.map((item, idx) => {
                        const r = item.restaurant;
                        if (!r) return null;
                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group relative"
                            >
                                {isOwner && (
                                    <button 
                                        onClick={() => handleRemove(r.id)}
                                        disabled={removingId === r.id}
                                        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-md backdrop-blur transition hover:bg-red-500 hover:text-white"
                                    >
                                        {removingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </button>
                                )}
                                <Link
                                    href={`/restaurants/${r.id}`}
                                    className="flex h-[28rem] flex-col overflow-hidden rounded-[2.5rem] border border-border/40 bg-surface shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/10 relative"
                                >
                                    <div className="relative h-2/3 overflow-hidden">
                                        <Image 
                                            src={getPlaceholderImage(r.id)} 
                                            alt={r.name}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="flex flex-1 flex-col p-6 bg-white relative">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="rounded-full bg-surface-strong px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-[0.15em] text-muted">
                                                {r.cuisine}
                                            </span>
                                        </div>
                                        <h3 className="font-serif text-2xl font-bold leading-tight line-clamp-1">{r.name}</h3>
                                        <p className="mt-2 text-sm text-muted line-clamp-1">{r.address}, {r.city}</p>
                                        
                                        {item.notes && (
                                            <div className="mt-4 border-t border-border/50 pt-4">
                                                <p className="text-xs text-muted italic line-clamp-2 leading-relaxed font-serif">&ldquo;{item.notes}&rdquo;</p>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                    
                    {list.items.length === 0 && (
                        <div className="col-span-full py-32 text-center rounded-[3rem] border border-dashed border-border bg-surface/50">
                            <ListIcon className="mx-auto h-16 w-16 text-muted/20 mb-6" />
                            <p className="font-serif text-2xl text-muted">This list is empty</p>
                            {isOwner && (
                                <Link href="/restaurants" className="mt-4 inline-block text-accent font-bold hover:underline">
                                    Browse restaurants to add some!
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </main>
  );
}
