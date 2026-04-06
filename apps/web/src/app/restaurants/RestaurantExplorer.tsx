"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Map as MapIcon, LayoutGrid, Search, X, MapPin, Users, Flame, Plus } from "lucide-react";
import { LocationMap, type MapMarkerProps } from "../../components/Map";
import { api, type Restaurant } from "../../lib/api";
import { getRestaurantImage, type RestaurantWithRatings } from "../../lib/images";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import { UserSearch } from "../discover/UserSearch";

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
        className="w-full rounded-full border border-glass-border bg-glass-bg pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20 placeholder:text-muted/50 focus-gentle"
      />
      <AnimatePresence>
        {showSuggestions && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-auto rounded-ui border border-glass-border bg-glass-bg p-2 shadow-premium backdrop-blur-xl"
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
        ref={inputRef}
        type="text"
        placeholder="Location"
        defaultValue={value}
        className="w-full rounded-full border border-glass-border bg-glass-bg pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20 placeholder:text-muted/50 focus-gentle"
      />
    </div>
  );
}

export default function RestaurantExplorer() {
  const [activeTab, setActiveTab] = useState<'spots' | 'people'>('spots');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "map">("grid");
  const [cuisine, setCuisine] = useState("");
  const [city, setCity] = useState("");

  const markers = useMemo<MapMarkerProps[]>(() => 
    restaurants.map(r => ({
      id: r.id,
      lat: r.lat || 0,
      lng: r.lng || 0,
      title: r.name
    })).filter(m => m.lat !== 0 && m.lng !== 0),
  [restaurants]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const res = await api.restaurants.list({ cuisine, city });
        setRestaurants(res.data);
      } catch (err) {
        console.error("Failed to load restaurants", err);
      } finally {
        setLoading(false);
      }
    };
    void fetchRestaurants();
  }, [cuisine, city]);

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""} libraries={['places']}>
      <main className="min-h-screen bg-background pb-20 pt-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <header className="mb-14 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
               <span className="rounded-full bg-accent/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-accent">Discovery Hub</span>
               <h1 className="mt-6 font-serif text-5xl font-bold tracking-tight text-foreground md:text-7xl leading-[1.1]">
                 Find Your <span className="text-accent italic">Pass</span>
               </h1>
               <p className="mt-4 text-lg text-muted font-medium">Explore world-class culinary destinations and the people who curate them.</p>
            </div>

             <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5 rounded-full border border-glass-border bg-glass-bg p-1.5 shadow-premium backdrop-blur-md">
                 <button 
                   onClick={() => setActiveTab('spots')}
                   className={`flex items-center gap-2 rounded-full px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'spots' ? 'bg-foreground text-background shadow-lg' : 'text-muted hover:text-foreground'}`}
                 >
                   <Flame className="h-4 w-4" /> Spots
                 </button>
                 <button 
                   onClick={() => setActiveTab('people')}
                   className={`flex items-center gap-2 rounded-full px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'people' ? 'bg-foreground text-background shadow-lg' : 'text-muted hover:text-foreground'}`}
                 >
                   <Users className="h-4 w-4" /> People
                 </button>
               </div>
 
               <Link 
                 href="/restaurants/add"
                 className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-premium shadow-accent/20 transition hover:bg-accent-strong hover:-translate-y-1 focus-gentle"
               >
                 <Plus className="h-6 w-6" />
               </Link>
             </div>
           </header>

          <AnimatePresence mode="wait">
            {activeTab === 'spots' ? (
              <motion.div
                key="spots"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-10 flex flex-wrap items-center gap-4">
                  <div className="flex flex-1 flex-wrap items-center gap-3">
                    <CuisineAutocomplete value={cuisine} onChange={setCuisine} />
                    <CityAutocomplete value={city} onChange={setCity} />
                    {(cuisine || city) && (
                      <button 
                        onClick={() => { setCuisine(""); setCity(""); }}
                        aria-label="Clear filters"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:rotate-90 focus-gentle"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex rounded-full border border-glass-border bg-glass-bg p-1 shadow-sm">
                    <button
                      onClick={() => setView("grid")}
                      aria-label="Switch to Grid View"
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all focus-gentle ${view === "grid" ? "bg-white text-accent shadow-sm" : "text-muted hover:text-foreground"}`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setView("map")}
                      aria-label="Switch to Map View"
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all focus-gentle ${view === "map" ? "bg-white text-accent shadow-sm" : "text-muted hover:text-foreground"}`}
                    >
                      <MapIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {view === "grid" ? (
                    <motion.div 
                      key="grid"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
                    >
                      {restaurants.map((restaurant, i) => (
                        <motion.div
                          key={restaurant.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="group overflow-hidden rounded-card border border-border bg-surface transition hover:shadow-premium hover:-translate-y-1 focus-gentle"
                        >
                          <Link href={`/restaurants/${restaurant.id}`}>
                            <div className="relative aspect-[4/3] overflow-hidden">
                              <Image
                                src={getRestaurantImage(restaurant as RestaurantWithRatings)} 
                                alt={restaurant.name}
                                fill
                                unoptimized
                                className="object-cover transition duration-700 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                              <div className="absolute left-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-xl">
                                <span className="font-serif text-sm font-black text-accent">{restaurant.averageScore?.toFixed(1) || "-"}</span>
                              </div>
                            </div>
                            <div className="p-8">
                               <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-black uppercase tracking-widest text-accent/80">{restaurant.cuisine}</span>
                                  <span className="h-1 w-1 rounded-full bg-border" />
                                  <span className="text-xs font-black uppercase tracking-widest text-muted">{restaurant.city}</span>
                               </div>
                               <h2 className="font-serif text-3xl font-bold text-foreground group-hover:text-accent transition-colors leading-tight">
                                 {restaurant.name}
                               </h2>
                               <p className="mt-2 text-sm text-muted font-medium line-clamp-1">{restaurant.address}</p>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="map"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-[60vh] overflow-hidden rounded-section border border-border shadow-2xl"
                    >
                      <LocationMap markers={markers} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {!loading && restaurants.length === 0 && (
                  <div className="py-32 text-center">
                    <Search className="mx-auto h-16 w-16 text-muted/20 mb-4" />
                    <h3 className="font-serif text-3xl text-muted">No spots found in this treasury.</h3>
                    <button onClick={() => { setCuisine(""); setCity(""); }} className="mt-4 text-accent font-bold hover:underline">Clear Filters</button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="people"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <UserSearch />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </APIProvider>
  );
}
