"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Star, Map as MapIcon, LayoutGrid, Search, X, MapPin } from "lucide-react";
import { LocationMap } from "../../components/Map";
import { api, type Restaurant } from "../../lib/api";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";

const POPULAR_CUISINES = [
  "Italian", "Japanese", "Mexican", "French", "Chinese", "Indian", "American", 
  "Thai", "Mediterranean", "Greek", "Spanish", "Vietnamese", "Korean", 
  "Middle Eastern", "Steakhouse", "Seafood", "Vegan", "Bakery" , "Swahili", "West African", "Caribbean", "Ethiopian"
].sort();

function CuisineAutocomplete({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = value 
    ? POPULAR_CUISINES.filter(c => c.toLowerCase().includes(value.toLowerCase()))
    : POPULAR_CUISINES;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative group flex-1 max-w-[200px]">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted group-focus-within:text-accent transition-colors" />
      <input
        id="search-cuisine"
        type="text"
        placeholder="Cuisine"
        value={value}
        onFocus={() => setShowSuggestions(true)}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-full border border-border/80 bg-white/70 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
      />
      <AnimatePresence>
        {showSuggestions && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-auto rounded-2xl border border-border bg-white/95 p-2 shadow-2xl backdrop-blur-xl"
          >
            {filtered.map((cuisine) => (
              <button
                key={cuisine}
                onClick={() => {
                  onChange(cuisine);
                  setShowSuggestions(false);
                }}
                className="w-full rounded-xl px-4 py-2 text-left text-sm hover:bg-accent/10 hover:text-accent transition-colors"
              >
                {cuisine}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CityAutocomplete({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const placesLib = useMapsLibrary('places');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;

    const options = {
      types: ["(cities)"],
      fields: ["name", "formatted_address"],
    };

    const autocomplete = new placesLib.Autocomplete(inputRef.current, options);
    
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.name) {
        onChange(place.name);
      }
    });

    return () => {
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [placesLib, onChange]);

  return (
    <div className="relative group flex-1 max-w-[200px]">
      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted group-focus-within:text-accent transition-colors" />
      <input
        id="search-city"
        ref={inputRef}
        type="text"
        placeholder="City"
        defaultValue={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-full border border-border/80 bg-white/70 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
      />
    </div>
  );
}

// Re-using simplified placeholder logic
function getPlaceholderImage(id?: string) {
  if (!id) return "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800&auto=format&fit=crop";
  // Use a pseudo-random hash of the ID to select a beautiful food image from a curated array
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

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null)
    return <span className="text-[10px] font-black uppercase tracking-tighter text-muted">New</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-black text-accent drop-shadow-sm">
      <Star className="h-3.5 w-3.5 fill-accent" />
      <span>{score.toFixed(1)}</span>
    </span>
  );
}

// Removed inline AddRestaurantForm logic because we now use the immersive /restaurants/add route.

function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [total, setTotal] = useState(0);
  const [cuisine, setCuisine] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

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
      {/* Sticky Glassmorphic Filter Header */}
      <div className="sticky top-24 z-40 mb-10 -mx-6 px-6 py-4 backdrop-blur-xl border-b border-border/40 bg-background/60 shadow-[0_10px_30px_rgba(0,0,0,0.05)] sm:-mx-10 sm:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-3xl font-bold">Discover Spots</h1>
            {!loading && (
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                {total} Places
              </span>
            )}
          </div>

            <div className="hidden sm:flex rounded-full border border-border bg-white p-1 shadow-sm">
                <button 
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${viewMode === "grid" ? 'bg-foreground text-background shadow-md' : 'text-muted hover:text-foreground'}`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" /> Grid
                </button>
                <button 
                  onClick={() => setViewMode("map")}
                  className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${viewMode === "map" ? 'bg-foreground text-background shadow-md' : 'text-muted hover:text-foreground'}`}
                >
                  <MapIcon className="h-3.5 w-3.5" /> Map
                </button>
            </div>

            <form
              onSubmit={handleFilter}
              className="flex flex-[2] items-center justify-end gap-2"
            >
              <CuisineAutocomplete value={cuisine} onChange={setCuisine} />
              <CityAutocomplete value={city} onChange={setCity} />
              <button
                id="btn-search-restaurants"
                type="submit"
                className="rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-white shadow-xl shadow-accent/20 transition hover:bg-accent-strong hover:-translate-y-0.5"
              >
                Search
              </button>
              {(cuisine || city) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-muted hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>
          </div>
        </div>

      <div className="flex justify-between items-center bg-accent/5 border border-accent/20 px-6 py-5 rounded-3xl mt-4 mb-10 shadow-sm backdrop-blur-sm">
         <div>
            <h3 className="font-serif text-lg font-bold">Know a great spot?</h3>
            <p className="text-sm text-muted">Contribute to the PalatePass community.</p>
         </div>
         <Link id="link-add-restaurant" href="/restaurants/add" className="rounded-full bg-accent px-6 py-3 text-sm font-bold tracking-wide text-white transition shadow hover:bg-accent-strong hover:-translate-y-0.5">
           Add Restaurant
         </Link>
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
      <AnimatePresence mode="wait">
        {viewMode === "map" ? (
          <motion.div
            key="map-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="h-[70vh] w-full rounded-[3rem] overflow-hidden shadow-2xl border border-border"
          >
            <LocationMap 
              markers={restaurants
                .filter(r => r.lat && r.lng)
                .map(r => ({ id: r.id, lat: r.lat!, lng: r.lng!, title: r.name }))} 
            />
          </motion.div>
        ) : (
          <motion.div 
            key="grid-view"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.05 } },
              hidden: {}
            }}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {restaurants.map((r) => (
              <motion.div
                key={r.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                }}
              >
                <Link
                  href={`/restaurants/${r.id}`}
                  className="group relative flex h-[24rem] flex-col justify-end overflow-hidden rounded-[2rem] border border-border/40 bg-surface shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_25px_50px_rgba(192,57,43,0.15)]"
                >
                  <Image 
                    src={getPlaceholderImage(r.id)} 
                    alt={r.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={restaurants.indexOf(r) < 6}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 transition-opacity duration-300 group-hover:opacity-90" />
                  
                  <div className="absolute right-4 top-4 z-10 flex">
                    <div className="flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 shadow-md backdrop-blur">
                      <ScoreBadge score={r.averageScore} />
                    </div>
                  </div>
                  
                  <div className="relative z-10 p-6">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                        {r.cuisine}
                      </span>
                      {r.sponsored && (
                        <span className="rounded-full border border-accent/40 bg-accent/30 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                          Sponsored
                        </span>
                      )}
                    </div>
                    <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight text-white transition-colors group-hover:text-[#fdfbfa]">
                      {r.name}
                    </h2>
                    <div className="mt-3 flex items-center justify-between text-xs font-medium text-white/80">
                      <span className="truncate">{r.address}</span>
                      <span className="ml-2 shrink-0 rounded-full bg-white/10 px-2 py-1 backdrop-blur-sm">{r.city}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      )}
    </main>
  );
}

export default function RestaurantsPageWrapper() {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""} libraries={['places']}>
       <RestaurantsPage />
    </APIProvider>
  );
}
