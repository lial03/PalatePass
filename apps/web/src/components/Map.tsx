"use client";

import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
// @ts-expect-error - useMap and InfoWindow are shipped in dist but local IDE types haven't synchronized
import { useMap, InfoWindow } from "@vis.gl/react-google-maps";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";

function CameraFlyTo({ hoveredMarkerId, markers }: { hoveredMarkerId: string | null, markers: MapMarkerProps[] }) {
  const map = useMap();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!map || !hoveredMarkerId) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const target = markers.find((m) => m.id === hoveredMarkerId);
      if (target) {
        map.panTo({ lat: target.lat, lng: target.lng });
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [map, hoveredMarkerId, markers]);

  return null;
}

export interface MapMarkerProps {
  id: string;
  lat: number;
  lng: number;
  title?: string;
}

const customMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#1a1614" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#7a7269" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1614" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d26b42" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2e2521" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1614" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9c948b" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#d26b42" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1a1614" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", stylers: [{ visibility: "simplified" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
];

export function LocationMap({ markers, center, hoveredMarkerId, onMarkerHover }: { markers: MapMarkerProps[], center?: { lat: number, lng: number }, hoveredMarkerId?: string | null, onMarkerHover?: (id: string | null) => void }) {
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
        styles={customMapStyles}
      >
        <CameraFlyTo hoveredMarkerId={hoveredMarkerId || null} markers={markers} />
        {hoveredMarkerId && (
          <InfoWindow
            position={markers.find(m => m.id === hoveredMarkerId)}
            pixelOffset={[0, -40]}
            disableAutoPan={true}
            headerDisabled={true}
          >
            <motion.div 
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="px-3 py-1 text-xs font-bold text-foreground"
            >
              {markers.find(m => m.id === hoveredMarkerId)?.title}
            </motion.div>
          </InfoWindow>
        )}
        {markers.map((marker) => {
          const isHovered = marker.id === hoveredMarkerId;
          return (
            <AdvancedMarker 
              key={marker.id} 
              position={{ lat: marker.lat, lng: marker.lng }} 
              zIndex={isHovered ? 50 : 1}
              onMouseEnter={() => onMarkerHover?.(marker.id)}
              onMouseLeave={() => onMarkerHover?.(null)}
            >
              <Pin 
                background={isHovered ? "#ffffff" : "#d26b42"} 
                borderColor={isHovered ? "#d26b42" : "#1f140f"} 
                glyphColor={isHovered ? "#d26b42" : "#ffffff"} 
                scale={isHovered ? 1.5 : 1.2} 
              />
            </AdvancedMarker>
          );
        })}
      </Map>
    </APIProvider>
  );
}
