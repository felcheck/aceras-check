import { GeocodedLocation } from "@/types/location";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const REQUEST_INTERVAL_MS = 1100; // free tier guideline: max 1 req/sec

type RawSearchResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox?: [string, string, string, string];
  address?: Record<string, string>;
};

type RawReverseResult = {
  display_name: string;
  address?: Record<string, string>;
};

export interface SearchSuggestion extends GeocodedLocation {
  id: string;
  boundingBox?: [number, number, number, number];
  raw: RawSearchResult;
}

export interface ReverseGeocodeResult extends GeocodedLocation {
  raw: RawReverseResult;
}

const searchCache = new Map<string, SearchSuggestion[]>();
const reverseCache = new Map<string, ReverseGeocodeResult>();

let lastRequestTimestamp = 0;

async function waitForQuota() {
  const now = Date.now();
  const elapsed = now - lastRequestTimestamp;
  if (elapsed < REQUEST_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, REQUEST_INTERVAL_MS - elapsed));
  }
  lastRequestTimestamp = Date.now();
}

function getEmailParam() {
  const email = process.env.NEXT_PUBLIC_NOMINATIM_EMAIL;
  return email ? email.trim() : "";
}

function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

function formatAddress(
  displayName: string | undefined,
  address: Record<string, string> | undefined
) {
  if (!address) {
    return displayName ?? "";
  }

  const streetLike =
    address.road ||
    address.pedestrian ||
    address.path ||
    address.cycleway ||
    address.footway ||
    address.highway;

  const house = address.house_number;
  const lineOne = streetLike
    ? house
      ? `${streetLike} ${house}`
      : streetLike
    : address.neighbourhood || address.suburb || "";

  const locality =
    address.neighbourhood ||
    address.suburb ||
    address.village ||
    address.town ||
    address.city ||
    address.state ||
    "";

  const parts = [lineOne, locality].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(", ");
  }

  return displayName ?? "";
}

function parseBoundingBox(
  bbox: [string, string, string, string] | undefined
): [number, number, number, number] | undefined {
  if (!bbox) return undefined;
  const [south, north, west, east] = bbox.map((value) => parseFloat(value));
  if ([south, north, west, east].some((num) => Number.isNaN(num))) {
    return undefined;
  }
  return [south, north, west, east];
}

async function nominatimFetch<T>(url: URL): Promise<T> {
  await waitForQuota();
  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Language": "es",
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim error (${response.status})`);
  }

  return (await response.json()) as T;
}

export async function searchPlaces(query: string): Promise<SearchSuggestion[]> {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return [];
  }

  const cached = searchCache.get(normalized);
  if (cached) {
    return cached;
  }

  const url = new URL(`${NOMINATIM_BASE_URL}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");
  url.searchParams.set("accept-language", "es");
  const email = getEmailParam();
  if (email) {
    url.searchParams.set("email", email);
  }

  const results = await nominatimFetch<RawSearchResult[]>(url);

  const formatted: SearchSuggestion[] = results.map((item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    return {
      id: item.place_id?.toString() ?? `${item.lat},${item.lon}`,
      lat,
      lng,
      addressLabel: formatAddress(item.display_name, item.address),
      roadName:
        item.address?.road ||
        item.address?.pedestrian ||
        item.address?.path ||
        null,
      boundingBox: parseBoundingBox(item.boundingbox),
      raw: item,
    };
  });

  searchCache.set(normalized, formatted);
  return formatted;
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult | null> {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = reverseCache.get(key);
  if (cached) {
    return cached;
  }

  const url = new URL(`${NOMINATIM_BASE_URL}/reverse`);
  url.searchParams.set("lat", lat.toString());
  url.searchParams.set("lon", lng.toString());
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "es");
  const email = getEmailParam();
  if (email) {
    url.searchParams.set("email", email);
  }

  try {
    const result = await nominatimFetch<RawReverseResult>(url);
    const addressLabel = formatAddress(result.display_name, result.address);
    const formatted: ReverseGeocodeResult = {
      lat,
      lng,
      addressLabel,
      roadName:
        result.address?.road ||
        result.address?.pedestrian ||
        result.address?.path ||
        null,
      raw: result,
    };
    reverseCache.set(key, formatted);
    return formatted;
  } catch (error) {
    console.warn("Reverse geocode failed", error);
    return null;
  }
}
