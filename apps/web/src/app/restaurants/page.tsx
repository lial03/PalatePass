"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api, type Restaurant } from "../../lib/api";

// Let's use a simpler unique seed image from picsum for absolute reliability when testing:
function getPlaceholderImage(id: string) {
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
    return <span className="text-xs font-semibold text-muted">New</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-accent">
      <Star className="h-4 w-4 fill-accent" />
      <span>{score.toFixed(1)}</span>
    </span>
  );
}

type CountryOption = { code: string; name: string };

type PlaceSuggestion = {
  id: string;
  label: string;
  name: string;
  address: string;
  city: string;
  countryCode: string;
  countryName: string;
  lat: number;
  lng: number;
  placeId: string;
};

const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "EG", name: "Egypt" },
  { code: "MA", name: "Morocco" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "PT", name: "Portugal" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "IN", name: "India" },
  { code: "JP", name: "Japan" },
  { code: "SG", name: "Singapore" },
  { code: "AU", name: "Australia" },
  { code: "BR", name: "Brazil" },
];

function buildMapEmbedUrl(lat: number, lng: number) {
  const delta = 0.015;
  const left = lng - delta;
  const right = lng + delta;
  const top = lat + delta;
  const bottom = lat - delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lng}`;
}

function AddRestaurantForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [searchText, setSearchText] = useState("");
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>(
    [],
  );
  const [knownMatches, setKnownMatches] = useState<Restaurant[]>([]);
  const [searching, setSearching] = useState(false);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("NG");
  const [countryName, setCountryName] = useState("Nigeria");
  const [cuisine, setCuisine] = useState("");
  const [googlePlaceId, setGooglePlaceId] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchText.trim().length < 2) {
      setPlaceSuggestions([]);
      setKnownMatches([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const [knownRes, mapRes] = await Promise.all([
          api.restaurants.list({
            query: searchText.trim(),
            countryCode,
            limit: 5,
          }),
          fetch(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(searchText.trim())}${countryCode ? `&countrycodes=${countryCode.toLowerCase()}` : ""}`,
          ),
        ]);

        setKnownMatches(knownRes.data);

        const mapJson = (await mapRes.json()) as Array<{
          place_id: number;
          display_name: string;
          lat: string;
          lon: string;
          address?: {
            road?: string;
            house_number?: string;
            suburb?: string;
            city?: string;
            town?: string;
            village?: string;
            county?: string;
            country?: string;
            country_code?: string;
          };
          name?: string;
        }>;

        const normalized = mapJson.map((item) => {
          const addressLine = [
            item.address?.house_number,
            item.address?.road,
            item.address?.suburb,
          ]
            .filter(Boolean)
            .join(" ");
          const suggestionCity =
            item.address?.city ??
            item.address?.town ??
            item.address?.village ??
            item.address?.county ??
            "";
          const suggestionCountryName = item.address?.country ?? countryName;
          const suggestionCountryCode = (
            item.address?.country_code ?? countryCode
          ).toUpperCase();
          const mainName =
            item.name ?? item.display_name.split(",")[0] ?? searchText.trim();

          return {
            id: String(item.place_id),
            label: item.display_name,
            name: mainName,
            address: addressLine || item.display_name,
            city: suggestionCity,
            countryCode: suggestionCountryCode,
            countryName: suggestionCountryName,
            lat: Number(item.lat),
            lng: Number(item.lon),
            placeId: String(item.place_id),
          } satisfies PlaceSuggestion;
        });

        setPlaceSuggestions(normalized);
      } catch {
        setPlaceSuggestions([]);
        setKnownMatches([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchText, countryCode, countryName]);

  function handleCountryChange(nextCode: string) {
    const selected = COUNTRY_OPTIONS.find(
      (country) => country.code === nextCode,
    );
    setCountryCode(nextCode);
    setCountryName(selected?.name ?? "");
  }

  function applySuggestion(suggestion: PlaceSuggestion) {
    setName(suggestion.name);
    setAddress(suggestion.address);
    setCity(suggestion.city);
    setCountryCode(suggestion.countryCode);
    setCountryName(suggestion.countryName);
    setGooglePlaceId(suggestion.placeId);
    setLat(String(suggestion.lat));
    setLng(String(suggestion.lng));
    setSearchText(suggestion.label);
    setPlaceSuggestions([]);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.restaurants.create({
        name,
        address,
        city,
        countryCode,
        countryName,
        cuisine,
        googlePlaceId: googlePlaceId || undefined,
        submissionNotes: submissionNotes || undefined,
        lat: lat ? Number(lat) : undefined,
        lng: lng ? Number(lng) : undefined,
      });
      setName("");
      setSearchText("");
      setAddress("");
      setCity("");
      setCountryCode("NG");
      setCountryName("Nigeria");
      setCuisine("");
      setGooglePlaceId("");
      setLat("");
      setLng("");
      setSubmissionNotes("");
      setPlaceSuggestions([]);
      setKnownMatches([]);
      onCreated();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to add restaurant",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-4xl border border-border bg-surface p-5"
    >
      <h2 className="font-serif text-2xl">Add A Restaurant</h2>
      <p className="mt-1 text-sm text-muted">
        Type restaurant name or area to find known places and pin on map.
      </p>

      <div className="mt-4 space-y-2">
        <input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search restaurant or area"
          className="w-full rounded-2xl border border-border bg-white/70 px-4 py-2.5 text-sm outline-none ring-accent focus:ring-2"
        />

        {searching && (
          <p className="text-xs text-muted">
            Searching map and known restaurants...
          </p>
        )}

        {knownMatches.length > 0 && (
          <div className="rounded-2xl border border-border bg-white/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Known restaurants
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {knownMatches.map((match) => (
                <Link
                  key={match.id}
                  href={`/restaurants/${match.id}`}
                  className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted hover:border-accent/30"
                >
                  {match.name} ({match.city})
                </Link>
              ))}
            </div>
          </div>
        )}

        {placeSuggestions.length > 0 && (
          <div className="rounded-2xl border border-border bg-white/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Map suggestions
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {placeSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  className="rounded-xl border border-border bg-surface px-3 py-2 text-left text-xs text-muted transition hover:border-accent/30"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Restaurant name"
          required
          className="rounded-2xl border border-border bg-white/70 px-4 py-2.5 text-sm outline-none ring-accent focus:ring-2"
        />
        <input
          value={cuisine}
          onChange={(event) => setCuisine(event.target.value)}
          placeholder="Cuisine"
          required
          className="rounded-2xl border border-border bg-white/70 px-4 py-2.5 text-sm outline-none ring-accent focus:ring-2"
        />
        <input
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Address"
          required
          className="rounded-2xl border border-border bg-white/70 px-4 py-2.5 text-sm outline-none ring-accent focus:ring-2 sm:col-span-2"
        />
        <input
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="City"
          required
          className="rounded-2xl border border-border bg-white/70 px-4 py-2.5 text-sm outline-none ring-accent focus:ring-2"
        />
        <select
          value={countryCode}
          onChange={(event) => handleCountryChange(event.target.value)}
          className="rounded-2xl border border-border bg-white/70 px-4 py-2.5 text-sm outline-none ring-accent focus:ring-2"
        >
          {COUNTRY_OPTIONS.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
        <input
          value={googlePlaceId}
          onChange={(event) => setGooglePlaceId(event.target.value)}
          placeholder="Place reference ID (optional)"
          className="rounded-2xl border border-border bg-white/70 px-4 py-2.5 text-sm outline-none ring-accent focus:ring-2"
        />
        <input
          value={lat}
          onChange={(event) => setLat(event.target.value)}
          placeholder="Latitude (optional)"
          inputMode="decimal"
          className="rounded-2xl border border-border bg-white/70 px-4 py-2.5 text-sm outline-none ring-accent focus:ring-2"
        />
        <input
          value={lng}
          onChange={(event) => setLng(event.target.value)}
          placeholder="Longitude (optional)"
          inputMode="decimal"
          className="rounded-2xl border border-border bg-white/70 px-4 py-2.5 text-sm outline-none ring-accent focus:ring-2"
        />
      </div>

      {lat &&
        lng &&
        !Number.isNaN(Number(lat)) &&
        !Number.isNaN(Number(lng)) && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-white/60">
            <iframe
              title="Location preview"
              src={buildMapEmbedUrl(Number(lat), Number(lng))}
              className="h-56 w-full"
            />
          </div>
        )}

      <textarea
        value={submissionNotes}
        onChange={(event) => setSubmissionNotes(event.target.value)}
        rows={3}
        placeholder="Submission notes (optional)"
        className="mt-3 w-full rounded-2xl border border-border bg-white/70 px-4 py-2.5 text-sm outline-none ring-accent focus:ring-2"
      />

      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-3 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-60"
      >
        {submitting ? "Adding..." : "Add restaurant"}
      </button>
    </form>
  );
}

export default function RestaurantsPage() {
  const { user, ready } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [total, setTotal] = useState(0);
  const [cuisine, setCuisine] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

          <form
            onSubmit={handleFilter}
            className="flex flex-1 items-center justify-end gap-2"
          >
            <div className="relative group">
              <input
                type="text"
                placeholder="Cuisine"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="w-32 sm:w-40 rounded-full border border-border/80 bg-white/70 px-4 py-2.5 text-sm outline-none transition-all focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div className="relative group">
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-32 sm:w-40 rounded-full border border-border/80 bg-white/70 px-4 py-2.5 text-sm outline-none transition-all focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background shadow-md transition hover:bg-black/80"
            >
              Search
            </button>
            {(cuisine || city) && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-muted transition hover:bg-gray-50 hover:text-foreground"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      {ready && user && (
        <AddRestaurantForm
          onCreated={() => void fetchRestaurants(cuisine, city)}
        />
      )}
      {ready && !user && (
        <div className="mt-6 rounded-3xl border border-border bg-surface px-5 py-4 text-sm text-muted">
          Log in to add restaurants, include photos and budget tags in your
          ratings, and grow your taste graph.
        </div>
      )}

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
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
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
                {/* Dynamically mapped Unsplash image placeholder */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${getPlaceholderImage(r.id)})` }}
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
    </main>
  );
}
