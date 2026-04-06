"use client";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import { motion } from "framer-motion";
import {
  Building,
  Camera,
  DollarSign,
  Globe,
  Loader2,
  MapPin,
  MessageSquare,
  Navigation,
  Plus,
  Star,
  Utensils,
  Wallet,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "../../../lib/api";
import { COUNTRIES } from "../../../lib/countries";

function SearchableNameInput({
  value,
  onChange,
  onPlaceSelected,
}: {
  value: string;
  onChange: (val: string) => void;
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
}) {
  const placesLib = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;

    const options = {
      fields: [
        "geometry",
        "name",
        "formatted_address",
        "address_components",
        "place_id",
      ],
    };

    const newAutocomplete = new placesLib.Autocomplete(
      inputRef.current,
      options,
    );
    setAutocomplete(newAutocomplete);
  }, [placesLib]);

  useEffect(() => {
    if (!autocomplete) return;

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      onPlaceSelected(place);
    });

    return () => {
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [autocomplete, onPlaceSelected]);

  return (
    <div className="relative group">
      <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted group-focus-within:text-accent transition-colors" />
      <input
        id="input-name"
        ref={inputRef}
        type="text"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Restaurant Name (Search or Type)"
        className="w-full rounded-ui border border-border bg-background pl-12 pr-4 py-4 text-foreground outline-none transition-all focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/5 placeholder:text-muted/50 focus-gentle"
      />
    </div>
  );
}

const BUDGET_TIERS = [
  { id: "budget", label: "Budget", icon: Wallet },
  { id: "mid", label: "Mid-Range", icon: Wallet },
  { id: "premium", label: "Premium", icon: DollarSign },
  { id: "luxury", label: "Luxury", icon: DollarSign },
];

export default function AddRestaurant() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [googlePlaceId, setGooglePlaceId] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // Lend Your Lens Integration
  const [score, setScore] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [budgetTier, setBudgetTier] = useState<string>("");
  const [budgetAmount, setBudgetAmount] = useState<string>("");
  const [budgetCurrency, setBudgetCurrency] = useState("USD");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const onPlaceSelected = (place: google.maps.places.PlaceResult) => {
    if (place.name) setName(place.name);
    if (place.formatted_address) setAddress(place.formatted_address);
    if (place.place_id) setGooglePlaceId(place.place_id);
    if (place.geometry?.location) {
      setLat(place.geometry.location.lat());
      setLng(place.geometry.location.lng());
    }

    // Extract city and country
    const cityComp = place.address_components?.find(
      (c) =>
        c.types.includes("locality") ||
        c.types.includes("administrative_area_level_1"),
    );
    if (cityComp) setCity(cityComp.long_name);

    const countryComp = place.address_components?.find((c) =>
      c.types.includes("country"),
    );
    if (countryComp) setCountryCode(countryComp.short_name);
  };

  const handleRealUpload = () => {
    if (!window.cloudinary) return;

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo",
        uploadPreset:
          process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
          "palatepass_unsigned",
        multiple: true,
        resourceType: "image",
        maxFiles: 5,
        cropping: true,
        showSkipCropButton: true,
        styles: { palette: { theme: "black" } },
      },
      (error, result) => {
        if (!error && result && result.event === "success") {
          setPhotoUrls((prev) => [...prev, result.info.secure_url]);
        }
      },
    );
    widget.open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create the base restaurant spot
      const res = await api.restaurants.create({
        name,
        cuisine,
        address,
        city,
        countryCode,
        countryName: COUNTRIES.find((c) => c.code === countryCode)?.name || "",
        googlePlaceId,
        lat: lat || 0,
        lng: lng || 0,
      });

      // 2. Automatically submit the "Lend Your Lens" if a score is provided
      if (score !== null) {
        await api.restaurants.rate(res.restaurant.id, {
          score,
          notes: notes.trim() || undefined,
          budgetTier:
            (budgetTier as "budget" | "mid" | "premium" | "luxury") ||
            undefined,
          budgetAmount: budgetAmount ? parseInt(budgetAmount) : undefined,
          budgetCurrency: budgetAmount ? budgetCurrency : undefined,
          photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
        });
      }

      router.push(`/restaurants/${res.restaurant.id}`);
    } catch (err) {
      console.error("Failed to add spot:", err);
      alert("Failed to add spot. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
      libraries={["places"]}
    >
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-background pb-20 pt-24"
      >
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-12 text-center">
            <span className="rounded-full bg-accent/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-accent">
              Contribution Portal
            </span>
            <h1 className="mt-6 font-serif text-5xl font-bold tracking-tight text-foreground md:text-6xl">
              Expand the Map
            </h1>
            <p className="mt-4 text-lg text-muted">
              Add a new culinary destination to the PalatePass treasury.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Base Spot Info */}
            <div className="rounded-section border border-border bg-surface p-8 shadow-sm md:p-12">
              <h2 className="mb-10 font-serif text-3xl font-bold border-b border-border pb-6">
                Spot Details
              </h2>

              <div className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <SearchableNameInput
                    value={name}
                    onChange={setName}
                    onPlaceSelected={onPlaceSelected}
                  />
                  <div className="relative group">
                    <Utensils className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted group-focus-within:text-accent transition-colors" />
                    <input
                      id="input-cuisine"
                      aria-label="Cuisine Type"
                      type="text"
                      required
                      value={cuisine}
                      onChange={(e) => setCuisine(e.target.value)}
                      placeholder="Cuisine Type (e.g. Italian)"
                      className="w-full rounded-ui border border-border bg-background pl-12 pr-4 py-4 text-foreground outline-none transition-all focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/5 placeholder:text-muted/50 focus-gentle"
                    />
                  </div>
                </div>

                <div className="relative group">
                  <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted group-focus-within:text-accent transition-colors" />
                  <input
                    id="input-address"
                    aria-label="Physical Address"
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Physical Address"
                    className="w-full rounded-ui border border-border bg-background pl-12 pr-4 py-4 text-foreground outline-none transition-all focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/5 placeholder:text-muted/50 focus-gentle"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted group-focus-within:text-accent transition-colors" />
                    <input
                      id="input-city"
                      aria-label="City"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="w-full rounded-ui border border-border bg-background pl-12 pr-4 py-4 text-foreground outline-none transition-all focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/5 placeholder:text-muted/50 focus-gentle"
                    />
                  </div>
                  <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted group-focus-within:text-accent transition-colors" />
                    <select
                      id="select-country"
                      aria-label="Select Country"
                      required
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full rounded-ui border border-border bg-background pl-12 pr-4 py-4 text-foreground outline-none transition-all focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/5 appearance-none cursor-pointer"
                    >
                      <option value="">Select Country</option>
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Immersive Lens Integration */}
            <div className="rounded-section border border-border bg-surface-strong p-8 shadow-premium md:p-14">
              <span className="text-xs font-black uppercase tracking-[0.3em] text-accent">
                Premium Contribution
              </span>
              <h2 className="my-6 font-serif text-5xl font-bold tracking-tight text-foreground">
                Lend Your Lens
              </h2>
              <p className="mb-14 text-lg text-muted leading-relaxed font-medium">
                Capture the inaugural experience for this spot. Your score,
                spend, and visual evidence define the baseline for our
                community.
              </p>

              <div className="grid gap-14 lg:grid-cols-2">
                <div className="space-y-12">
                  <div className="space-y-5">
                    <label className="flex items-center gap-2.5 text-xs font-black uppercase tracking-[0.2em] text-muted">
                      <Star className="h-4 w-4" /> Baseline Score (1-10)
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setScore(num)}
                          className={`h-12 w-12 rounded-2xl font-serif text-lg font-black transition-all ${score === num ? "bg-accent text-white shadow-2xl shadow-accent/20 scale-110 ring-4 ring-accent/10" : "bg-surface border border-border text-muted hover:border-accent/50 hover:text-foreground"}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <label className="flex items-center gap-2.5 text-xs font-black uppercase tracking-[0.2em] text-muted">
                      <Wallet className="h-4 w-4" /> Spend & Budget
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {BUDGET_TIERS.map((tier) => (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setBudgetTier(tier.id)}
                          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border px-6 py-5 transition-all ${budgetTier === tier.id ? "bg-accent border-accent text-white shadow-2xl shadow-accent/20" : "bg-surface border-border text-muted hover:border-accent/40 hover:text-foreground"}`}
                        >
                          <tier.icon
                            className={`h-6 w-6 mb-1 ${budgetTier === tier.id ? "text-white" : "text-accent/30"}`}
                          />
                          <span className="text-xs font-black uppercase tracking-[0.15em]">
                            {tier.label}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1 relative group">
                        <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted transition-colors group-focus-within:text-accent" />
                        <input
                          type="number"
                          value={budgetAmount}
                          onChange={(e) => setBudgetAmount(e.target.value)}
                          placeholder="Amount"
                          className="w-full rounded-3xl border border-border bg-background pl-14 pr-6 py-5 text-lg font-bold text-foreground outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/5 transition-all placeholder:text-muted/20"
                        />
                      </div>
                      <select
                        value={budgetCurrency}
                        onChange={(e) => setBudgetCurrency(e.target.value)}
                        className="rounded-3xl border border-border bg-background px-8 py-5 text-lg font-bold text-foreground outline-none focus:border-accent/50 transition-all appearance-none cursor-pointer"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-12">
                  <div className="space-y-5">
                    <label className="flex items-center gap-2.5 text-xs font-black uppercase tracking-[0.2em] text-muted">
                      <MessageSquare className="h-4 w-4" /> Culinary Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Share the standout dish or atmosphere..."
                      className="min-h-50 w-full rounded-3xl border border-border bg-background p-8 text-lg font-serif italic text-foreground outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/5 transition-all placeholder:text-muted/20 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="space-y-5">
                    <label className="flex items-center gap-2.5 text-xs font-black uppercase tracking-[0.2em] text-muted">
                      <Camera className="h-4 w-4" /> Visual Evidence
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {photoUrls.map((url, i) => (
                        <div
                          key={i}
                          className="group relative h-24 w-24 overflow-hidden rounded-3xl border border-border shadow-2xl"
                        >
                          <Image
                            src={url}
                            alt="Review"
                            fill
                            unoptimized
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setPhotoUrls((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              )
                            }
                            className="absolute hidden group-hover:flex inset-0 items-center justify-center bg-black/60 text-white transition-all"
                          >
                            <X className="h-6 w-6" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleRealUpload}
                        className="flex h-24 w-24 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border bg-surface text-muted hover:border-accent/50 hover:bg-surface-strong hover:text-accent transition-all duration-300"
                      >
                        <Plus className="h-7 w-7" />
                        <span className="text-xs font-black tracking-widest uppercase">
                          ADD
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              id="btn-submit-spot"
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-accent py-8 text-xl font-black uppercase tracking-[0.3em] text-white shadow-2xl shadow-accent/20 transition-all hover:bg-accent-strong hover:-translate-y-1 hover:shadow-accent/40 active:translate-y-0 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
              ) : (
                "Deploy Spot to Treasury"
              )}
            </button>
          </form>
        </div>
      </motion.main>
    </APIProvider>
  );
}
