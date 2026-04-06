/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '@vis.gl/react-google-maps' {
  export const APIProvider: any;
  export const Map: any;
  export const AdvancedMarker: any;
  export const Pin: any;
  export const useMapsLibrary: any;
}

declare namespace google.maps.places {
  export interface PlaceResult {
    geometry?: {
      location?: { lat: () => number; lng: () => number };
    };
    name?: string;
    place_id?: string;
    address_components?: google.maps.GeocoderAddressComponent[];
    formatted_address?: string;
  }
  export interface Autocomplete {
    addListener(event: string, handler: () => void): google.maps.MapsEventListener;
    getPlace(): PlaceResult;
  }
  export interface PlacesLibrary {
    Autocomplete: new (inputArea: HTMLInputElement, options: any) => Autocomplete;
  }
}

declare namespace google.maps {
  export interface GeocoderAddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
  }
  export interface MapsEventListener {
    remove(): void;
  }
  export namespace event {
    export function clearInstanceListeners(instance: any): void;
  }
}

interface Window {
  google: any;
}
