"use client";

import { useQuery } from "@tanstack/react-query";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import { AnimatePresence, motion } from "framer-motion";
import {
  Flame,
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { LocationMap, type MapMarkerProps } from "../../components/Map";
import { api } from "../../lib/api";
import {
  getRestaurantImage,
  type RestaurantWithRatings,
} from "../../lib/images";
import { UserSearch } from "../discover/UserSearch";

const POPULAR_CUISINES = [
  "Italian",
  "Japanese",
  "Mexican",
  "French",
  "Chinese",
  "Indian",
  "American",
  "Thai",
  "Mediterranean",
  "Greek",
  "Spanish",
  "Vietnamese",
  "Korean",
  "Middle Eastern",
  "Steakhouse",
  "Seafood",
  "Vegan",
  "Bakery",
  "Swahili",
  "West African",
  "Caribbean",
  "Ethiopian",
].sort();

function CuisineAutocomplete({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = value
    ? POPULAR_CUISINES.filter((c) =>
        c.toLowerCase().includes(value.toLowerCase()),
      )
    : POPULAR_CUISINES;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative group flex-1 max-w-50">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted group-focus-within:text-accent transition-colors" />
      <input
        id="search-cuisine"
        type="text"
        placeholder="Cuisine"
        value={value}
        onFocus={() => setShowSuggestions(true)}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-full border border-border bg-background pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20 placeholder:text-muted/50 focus-gentle"
      />
      <AnimatePresence>
        {showSuggestions && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-auto rounded-ui border border-border bg-surface p-2 shadow-premium backdrop-blur-xl"
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

function CityAutocomplete({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const placesLib = useMapsLibrary("places");
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
    <div className="relative group flex-1 max-w-50">
      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted group-focus-within:text-accent transition-colors" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Location"
        defaultValue={value}
        className="w-full rounded-full border border-border bg-background pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20 placeholder:text-muted/50 focus-gentle"
      />
    </div>
  );
}

export default function RestaurantExplorer() {
  const [hoveredRestaurantId, setHoveredRestaurantId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"spots" | "people">("spots");
  const [view, setView] = useState<"grid" | "map">("grid");
  const [cuisine, setCuisine] = useState("");
  const [city, setCity] = useState("");

  const { data: restaurants = [], isLoading: loading } = useQuery({
    queryKey: ['restaurants', cuisine, city],
    queryFn: async () => {
      const res = await api.restaurants.list({ cuisine, city });
      return res.data;
    }
  });

  const markers = useMemo<MapMarkerProps[]>(
    () =>
      restaurants
        .map((r) => ({
          id: r.id,
          lat: r.lat || 0,
          lng: r.lng || 0,
          title: r.name,
        }))
        .filter((m) => m.lat !== 0 && m.lng !== 0),
    [restaurants],
  );

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
      libraries={["places"]}
    >
      <main className="min-h-screen bg-background pb-20 pt-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <header className="mb-14 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="rounded-full bg-accent/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-accent">
                Discovery Hub
              </span>
              <h1 className="mt-6 font-serif text-5xl font-bold tracking-tight text-foreground md:text-7xl leading-[1.1]">
                Find Your <span className="text-accent italic">Pass</span>
              </h1>
              <p className="mt-4 text-lg text-muted font-medium">
                Explore world-class culinary destinations and the people who
                curate them.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface p-1.5 shadow-premium">
                <button
                  onClick={() => setActiveTab("spots")}
                  className={`flex items-center gap-2 rounded-full px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === "spots" ? "bg-foreground text-background shadow-lg" : "text-muted hover:text-foreground"}`}
                >
                  <Flame className="h-4 w-4" /> Spots
                </button>
                <button
                  onClick={() => setActiveTab("people")}
                  className={`flex items-center gap-2 rounded-full px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === "people" ? "bg-foreground text-background shadow-lg" : "text-muted hover:text-foreground"}`}
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
            {activeTab === "spots" ? (
              <motion.div
                key="spots"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-10 flex flex-wrap items-center gap-4">
                  <div className="flex flex-1 flex-wrap items-center gap-3">
                    <CuisineAutocomplete
                      value={cuisine}
                      onChange={setCuisine}
                    />
                    <CityAutocomplete value={city} onChange={setCity} />
                    {(cuisine || city) && (
                      <button
                        onClick={() => {
                          setCuisine("");
                          setCity("");
                        }}
                        aria-label="Clear filters"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:rotate-90 focus-gentle"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex md:hidden rounded-full border border-border bg-surface p-1 shadow-sm">
                    <button
                      onClick={() => setView("grid")}
                      aria-label="Switch to Grid View"
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all focus-gentle ${view === "grid" ? "bg-background text-accent shadow-sm" : "text-muted hover:text-foreground"}`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setView("map")}
                      aria-label="Switch to Map View"
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all focus-gentle ${view === "map" ? "bg-background text-accent shadow-sm" : "text-muted hover:text-foreground"}`}
                    >
                      <MapIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-10">
                  {/* Discovery List */}
                  <div className={`flex-1 md:w-3/5 ${view === "map" ? "hidden md:block" : "block"}`}>
                    <AnimatePresence mode="wait">
                      {restaurants.length > 0 ? (
                        <motion.div
                          key="grid-content"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2"
                        >
                          {restaurants.map((restaurant, i) => (
                            <motion.div
                              key={restaurant.id}
                              onMouseEnter={() => setHoveredRestaurantId(restaurant.id)}
                              onMouseLeave={() => setHoveredRestaurantId(null)}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ 
                                opacity: 1, 
                                y: hoveredRestaurantId === restaurant.id ? -12 : 0,
                                scale: hoveredRestaurantId === restaurant.id ? 1.02 : 1 
                              }}
                              transition={{ delay: i * 0.05 }}
                              className={`spotlight-card relative group overflow-hidden rounded-card border transition-all duration-300 shadow-premium focus-gentle ${hoveredRestaurantId === restaurant.id ? 'border-accent ring-2 ring-accent/20 bg-surface-strong' : 'border-border bg-surface'}`}
                            >
                              <div 
                                className="pointer-events-none absolute -inset-px z-20 rounded-[inherit] opacity-0 transition duration-300 group-hover:opacity-100 mix-blend-overlay"
                                style={{ background: "radial-gradient(400px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(255,255,255,0.6), transparent 40%)" }}
                              />
                              <Link href={`/restaurants/${restaurant.id}`}>
                                <div className="relative aspect-4/3 overflow-hidden">
                                  <Image
                                    src={getRestaurantImage(
                                      restaurant as RestaurantWithRatings,
                                    )}
                                    alt={restaurant.name}
                                    fill
                                    unoptimized
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                                  <div className="absolute left-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-xl">
                                    <span className="font-serif text-sm font-black text-accent">
                                      {restaurant.averageScore?.toFixed(1) || "-"}
                                    </span>
                                  </div>
                                </div>
                                <div className="p-8">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-black uppercase tracking-widest text-accent/80">
                                      {restaurant.cuisine}
                                    </span>
                                    <span className="h-1 w-1 rounded-full bg-border" />
                                    <span className="text-xs font-black uppercase tracking-widest text-muted">
                                      {restaurant.city}
                                    </span>
                                  </div>
                                  <h2 className="font-serif text-3xl font-bold text-foreground group-hover:text-accent transition-colors leading-tight">
                                    {restaurant.name}
                                  </h2>
                                  <p className="mt-2 text-sm text-muted font-medium line-clamp-1">
                                    {restaurant.address}
                                  </p>
                                </div>
                              </Link>
                            </motion.div>
                          ))}
                        </motion.div>
                      ) : !loading ? (
                        <motion.div 
                          key="no-results"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative my-12 overflow-hidden rounded-section border border-border bg-gradient-to-b from-surface to-background py-24 text-center shadow-premium"
                        >
                          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
                          <div className="relative z-10 flex flex-col items-center">
                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/5 text-accent shadow-inner ring-1 ring-accent/10">
                              <Search className="h-8 w-8" />
                            </div>
                            <h3 className="font-serif text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                              No spots found in this realm.
                            </h3>
                            <p className="mt-4 max-w-md text-base text-muted">
                              We couldn&apos;t find any curations matching your precise filters.
                            </p>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>

                  {/* Discovery Map */}
                  <div className={`flex-1 md:w-2/5 ${view === "grid" ? "hidden md:block" : "block"} md:sticky md:top-32 md:h-[calc(100vh-16rem)]`}>
                    <motion.div
                      className="h-[60vh] md:h-full overflow-hidden rounded-section border border-border shadow-2xl overflow-hidden"
                    >
                      <LocationMap 
                        markers={markers} 
                        hoveredMarkerId={hoveredRestaurantId} 
                        onMarkerHover={setHoveredRestaurantId}
                      />
                    </motion.div>
                  </div>
                </div>
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
