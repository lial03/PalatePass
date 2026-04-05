"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { COUNTRIES } from "../../../lib/countries";
import { APIProvider } from "@vis.gl/react-google-maps";

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
    <input
      ref={inputRef}
      type="text"
      placeholder="Type restaurant name or area..."
      className="w-full rounded-2xl border border-border bg-white px-5 py-4 text-base outline-none ring-accent focus:ring-2 shadow-[0_4px_12px_rgba(70,32,13,0.05)]"
      required
    />
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
    <div className="max-w-2xl mx-auto py-10 px-6">
      <h1 className="font-serif text-5xl mb-2 text-center text-accent-strong">Add a Restaurant</h1>
      <p className="text-center text-muted mb-8">Search for a spot using Google Maps, or enter details below.</p>

      {error && <div className="mb-6 rounded-2xl bg-red-100 px-5 py-4 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6 bg-surface-strong p-8 rounded-[2rem] border border-border shadow-[0_20px_60px_rgba(31,20,15,0.08)]">
        
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Search Location</label>
          <APIProvider apiKey={apiKey}>
            {apiKey ? <AutocompleteInput onPlaceSelected={handlePlaceSelect} /> : (
              <input type="text" placeholder="Map API Key Missing..." disabled className="w-full rounded-2xl border border-border bg-gray-100 px-5 py-4" />
            )}
          </APIProvider>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full rounded-2xl border border-border px-5 py-3 outline-none focus:ring-2 ring-accent bg-white" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Cuisine</label>
            <input required value={cuisine} onChange={e => setCuisine(e.target.value)} type="text" placeholder="e.g. Italian, Sushi" className="w-full rounded-2xl border border-border px-5 py-3 outline-none focus:ring-2 ring-accent bg-white" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-foreground mb-2">Address</label>
            <input required value={address} onChange={e => setAddress(e.target.value)} type="text" className="w-full rounded-2xl border border-border px-5 py-3 outline-none focus:ring-2 ring-accent bg-white" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">City</label>
            <input required value={city} onChange={e => setCity(e.target.value)} type="text" className="w-full rounded-2xl border border-border px-5 py-3 outline-none focus:ring-2 ring-accent bg-white" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Country</label>
            <select required value={countryCode} onChange={e => setCountryCode(e.target.value)} className="w-full rounded-2xl border border-border px-5 py-3 outline-none focus:ring-2 ring-accent bg-white appearance-none">
              <option value="">Select country...</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button disabled={loading} type="submit" className="w-full rounded-full bg-accent py-4 font-semibold text-white transition hover:bg-accent-strong disabled:opacity-50 text-lg mt-4 shadow-lg shadow-accent/30">
          {loading ? "Adding..." : "Add Restaurant"}
        </button>

      </form>
    </div>
  );
}

export default AddRestaurantForm;
