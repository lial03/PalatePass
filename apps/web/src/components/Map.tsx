"use client";

import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";

export interface MapMarkerProps {
  id: string;
  lat: number;
  lng: number;
  title?: string;
}

export function LocationMap({ markers, center }: { markers: MapMarkerProps[], center?: { lat: number, lng: number } }) {
  const [apiKey] = useState(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return <div className="h-full min-h-[300px] w-full animate-pulse bg-surface-strong rounded-4xl" />;

  if (!apiKey) {
    return (
      <div className="flex h-full min-h-[300px] w-full flex-col items-center justify-center rounded-4xl border border-border bg-surface-strong p-6 text-center text-muted shadow-inner">
        <span className="text-3xl mb-2">🗺️</span>
        <p className="font-medium text-foreground">Map Unavailable</p>
        <p className="text-sm">Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</p>
      </div>
    );
  }

  const defaultCenter = center || (markers.length > 0 ? { lat: markers[0].lat, lng: markers[0].lng } : { lat: 40.7128, lng: -74.0060 });

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultZoom={14}
        defaultCenter={defaultCenter}
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID"}
        className="h-full min-h-[300px] w-full rounded-4xl overflow-hidden shadow-lg border border-border"
        gestureHandling="greedy"
        disableDefaultUI={true}
      >
        {markers.map((marker) => (
          <AdvancedMarker key={marker.id} position={{ lat: marker.lat, lng: marker.lng }} title={marker.title}>
            <Pin background={"#d26b42"} borderColor={"#1f140f"} glyphColor={"#fff"} scale={1.2} />
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}
