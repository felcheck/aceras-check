export interface GeocodedLocation {
  lat: number;
  lng: number;
  addressLabel: string;
  roadName?: string | null;
}

export interface SelectedLocation {
  lat: number;
  lng: number;
  addressLabel?: string | null;
  roadName?: string | null;
  isAddressLoading?: boolean;
  source?: "map" | "search";
}
