"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api, type Restaurant } from "../../lib/api";

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null)
    return <span className="text-xs text-muted">No ratings yet</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
      {"★".repeat(Math.round(score))}
      {"☆".repeat(5 - Math.round(score))}
      <span className="ml-1 text-xs font-normal text-muted">
        {score.toFixed(1)}
      </span>
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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl">Restaurants</h1>
          {!loading && (
            <p className="mt-1 text-sm text-muted">{total} places found</p>
          )}
        </div>

        <form
          onSubmit={handleFilter}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            type="text"
            placeholder="Cuisine"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            className="rounded-full border border-border bg-white/70 px-4 py-2 text-sm outline-none ring-accent focus:ring-2"
          />
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-full border border-border bg-white/70 px-4 py-2 text-sm outline-none ring-accent focus:ring-2"
          />
          <button
            type="submit"
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong"
          >
            Filter
          </button>
          {(cuisine || city) && (
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-border px-4 py-2 text-sm transition hover:bg-white/60"
            >
              Clear
            </button>
          )}
        </form>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((r) => (
            <Link
              key={r.id}
              href={`/restaurants/${r.id}`}
              className="group block rounded-3xl border border-border bg-surface p-5 transition hover:border-accent/30 hover:shadow-[0_8px_30px_rgba(70,32,13,0.09)]"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-border bg-white/80 px-3 py-0.5 text-xs font-medium text-muted">
                    {r.cuisine}
                  </span>
                  {r.sponsored && (
                    <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-0.5 text-xs font-semibold text-accent">
                      Sponsored
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted">{r.city}</span>
              </div>
              <h2 className="mt-3 font-serif text-xl font-semibold group-hover:text-accent">
                {r.name}
              </h2>
              <p className="mt-1 text-sm text-muted">{r.address}</p>
              <div className="mt-3 flex items-center justify-between">
                <ScoreBadge score={r.averageScore} />
                <span className="text-xs text-muted">
                  {r.ratingCount} {r.ratingCount === 1 ? "rating" : "ratings"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
