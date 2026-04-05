"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { COUNTRIES } from "../../../lib/countries";
import { APIProvider } from "@vis.gl/react-google-maps";
import { motion } from "framer-motion";
import { MapPin, Utensils, Building, Globe, Navigation, Loader2 } from "lucide-react";

function AutocompleteInput({ onPlaceSelected }: { onPlaceSelected: (place: google.maps.places.PlaceResult) => void }) {
  const [placesLib, setPlacesLib] = useState<google.maps.places.PlacesLibrary | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!window.google || !window.google.maps || !window.google.maps.places) return;
    const t = setTimeout(() => setPlacesLib(window.google.maps.places), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;

    const options = {
      fields: ["geometry", "name", "formatted_address", "address_components", "place_id"],
    };

    const newAutocomplete = new placesLib.Autocomplete(inputRef.current, options);
    
    newAutocomplete.addListener("place_changed", () => {
      const place = newAutocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        onPlaceSelected(place);
      }
    });

    return () => {
      google.maps.event.clearInstanceListeners(newAutocomplete);
    };
  }, [placesLib, onPlaceSelected]);

  return (
    <div className="group relative flex items-center rounded-2xl border border-border/80 bg-white px-4 transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 shadow-sm">
      <Navigation className="h-5 w-5 text-muted transition-colors group-focus-within:text-accent" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Type restaurant name or area..."
        className="w-full bg-transparent px-3 py-4 text-sm outline-none placeholder-muted/60"
        required
      />
    </div>
  );
}

function AddRestaurantForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [placeId, setPlaceId] = useState<string>("");

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  function extractComponent(components: google.maps.GeocoderAddressComponent[], type: string) {
    return components.find((c) => c.types.includes(type))?.long_name || "";
  }
  function extractComponentShort(components: google.maps.GeocoderAddressComponent[], type: string) {
    return components.find((c) => c.types.includes(type))?.short_name || "";
  }

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    if (!place.name || !place.geometry?.location) return;
    setName(place.name);
    setLat(place.geometry.location.lat());
    setLng(place.geometry.location.lng());
    setPlaceId(place.place_id || "");
    
    if (place.address_components) {
      setCity(extractComponent(place.address_components, "locality") || extractComponent(place.address_components, "administrative_area_level_1"));
      setCountryCode(extractComponentShort(place.address_components, "country"));
      
      // Basic address fallback
      const streetForm = `${extractComponent(place.address_components, "street_number")} ${extractComponent(place.address_components, "route")}`.trim();
      setAddress(streetForm || place.formatted_address || "");
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const countryName = COUNTRIES.find(c => c.code === countryCode)?.name || "";
      const payload = {
        name,
        address,
        city,
        country: countryName,
        countryCode,
        cuisine,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        placeId: placeId || undefined
      };
      
      const res = await api.restaurants.create(payload);
      router.push(`/restaurants/${res.restaurant.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create restaurant");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="absolute inset-0 z-[100] flex min-h-screen overflow-y-auto bg-black">
      {/* Immersive Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2000&auto=format&fit=crop')" }} 
      />
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Floating Control */}
      <button onClick={() => router.back()} className="fixed left-6 top-6 z-[110] inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white tracking-widest uppercase backdrop-blur hover:bg-white/20 transition">
         ← Go Back
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto w-full max-w-2xl px-6 py-20"
      >
        <h1 className="font-serif text-5xl mb-2 text-center text-white">Add a Spot</h1>
        <p className="text-center text-white/80 mb-8 text-lg">Search for a spot using Google Maps to begin tracking.</p>

        {error && <div className="mb-6 rounded-2xl border border-red-500/50 bg-red-950/80 px-5 py-4 text-sm font-medium text-red-200 shadow-sm backdrop-blur-md">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-8 bg-surface-strong/95 backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] shadow-[0_30px_80px_rgba(0,0,0,0.5)] border border-white/10">
          
          {/* Step 1: Auto Search */}
          <div>
            <label className="mb-2 ml-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted"><MapPin className="h-4 w-4" /> Search Location</label>
            <APIProvider apiKey={apiKey}>
              {apiKey ? <AutocompleteInput onPlaceSelected={handlePlaceSelect} /> : (
                <input type="text" placeholder="Map API Key Missing..." disabled className="w-full rounded-2xl border border-border bg-gray-100 px-5 py-4" />
              )}
            </APIProvider>
          </div>

          <div className="my-6 flex items-center gap-4">
             <div className="h-px w-full bg-border/60" />
             <span className="shrink-0 text-xs font-bold uppercase tracking-widest text-muted">Or Fill Manually</span>
             <div className="h-px w-full bg-border/60" />
          </div>

          {/* Step 2: Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="ml-2 text-xs font-bold uppercase tracking-wider text-muted">Name</label>
              <div className="group relative flex items-center rounded-2xl border border-border/80 bg-white px-4 transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 shadow-sm">
                  <input required value={name} onChange={e => setName(e.target.value)} type="text" placeholder="Gjelina" className="w-full bg-transparent px-2 py-3.5 text-sm outline-none placeholder-muted/60" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
               <label className="ml-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted"><Utensils className="h-4 w-4" /> Cuisine</label>
               <div className="group relative flex items-center rounded-2xl border border-border/80 bg-white px-4 transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 shadow-sm">
                  <input required value={cuisine} onChange={e => setCuisine(e.target.value)} type="text" placeholder="e.g. Italian, Sushi" className="w-full bg-transparent px-2 py-3.5 text-sm outline-none placeholder-muted/60" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 flex flex-col gap-1.5">
               <label className="ml-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted"><MapPin className="h-4 w-4" /> Address</label>
               <div className="group relative flex items-center rounded-2xl border border-border/80 bg-white px-4 transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 shadow-sm">
                  <input required value={address} onChange={e => setAddress(e.target.value)} type="text" placeholder="1429 Abbot Kinney Blvd" className="w-full bg-transparent px-2 py-3.5 text-sm outline-none placeholder-muted/60" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
               <label className="ml-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted"><Building className="h-4 w-4" /> City</label>
               <div className="group relative flex items-center rounded-2xl border border-border/80 bg-white px-4 transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 shadow-sm">
                  <input required value={city} onChange={e => setCity(e.target.value)} type="text" placeholder="Los Angeles" className="w-full bg-transparent px-2 py-3.5 text-sm outline-none placeholder-muted/60" />
               </div>
            </div>
            <div className="flex flex-col gap-1.5">
               <label className="ml-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted"><Globe className="h-4 w-4" /> Country</label>
               <div className="group relative flex items-center rounded-2xl border border-border/80 bg-white px-4 transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 shadow-sm">
                 <select required value={countryCode} onChange={e => setCountryCode(e.target.value)} className="w-full bg-transparent px-2 py-3.5 text-sm outline-none appearance-none cursor-pointer">
                   <option value="">Select country...</option>
                   {COUNTRIES.map(c => (
                     <option key={c.code} value={c.code}>{c.emoji} {c.name}</option>
                   ))}
                 </select>
               </div>
            </div>
          </div>

          <button disabled={loading} type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-4 text-base font-bold tracking-wide text-white transition hover:bg-accent-strong disabled:bg-accent/70 shadow-lg shadow-accent/20 mt-4">
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Publishing Spot</> : "Commit to Database"}
          </button>

        </form>
      </motion.div>
    </main>
  );
}

export default AddRestaurantForm;
