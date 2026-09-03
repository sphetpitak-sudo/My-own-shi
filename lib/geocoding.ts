// Simple geocoding via OpenStreetMap Nominatim (free, no key) with local cache.
// Falls back to Thai place DB if network unavailable.

export interface GeoResult {
  lat: number;
  lon: number;
  displayName: string;
  tz?: string;
  tzOffsetMinutes?: number;
}

const CACHE = new Map<string, { at: number; value: GeoResult }>();
const TTL_MS = 1000 * 60 * 60 * 24 * 7; // 1 week

const LOCAL_FALLBACK: Record<string, GeoResult> = {
  bangkok: { lat: 13.7563, lon: 100.5018, displayName: "กรุงเทพมหานคร", tz: "Asia/Bangkok", tzOffsetMinutes: 420 },
  "กรุงเทพ": { lat: 13.7563, lon: 100.5018, displayName: "กรุงเทพมหานคร", tz: "Asia/Bangkok", tzOffsetMinutes: 420 },
  "เชียงใหม่": { lat: 18.7883, lon: 98.9853, displayName: "เชียงใหม่", tz: "Asia/Bangkok", tzOffsetMinutes: 420 },
  "ภูเก็ต": { lat: 7.8861, lon: 98.2964, displayName: "ภูเก็ต", tz: "Asia/Bangkok", tzOffsetMinutes: 420 },
  "พัทยา": { lat: 12.9236, lon: 100.8825, displayName: "พัทยา", tz: "Asia/Bangkok", tzOffsetMinutes: 420 },
  "ขอนแก่น": { lat: 16.4419, lon: 102.835, displayName: "ขอนแก่น", tz: "Asia/Bangkok", tzOffsetMinutes: 420 },
  "เชียงราย": { lat: 19.9072, lon: 99.8309, displayName: "เชียงราย", tz: "Asia/Bangkok", tzOffsetMinutes: 420 },
  tokyo: { lat: 35.6762, lon: 139.6503, displayName: "Tokyo, Japan", tz: "Asia/Tokyo", tzOffsetMinutes: 540 },
  bkk: { lat: 13.7563, lon: 100.5018, displayName: "กรุงเทพมหานคร", tz: "Asia/Bangkok", tzOffsetMinutes: 420 },
};

function localLookup(q: string): GeoResult | null {
  const lower = q.toLowerCase().trim();
  for (const [k, v] of Object.entries(LOCAL_FALLBACK)) {
    if (lower.includes(k.toLowerCase())) return v;
  }
  return null;
}

export async function geocodePlace(place: string): Promise<GeoResult | null> {
  const key = place.trim().toLowerCase();
  if (!key) return null;
  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;

  const local = localLookup(place);
  // Try Nominatim first
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(place)}&accept-language=th,en`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Sealo/1.0 (catarot.love)" },
    } as RequestInit);
    if (res.ok) {
      const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
      if (data[0]) {
        const result: GeoResult = {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          displayName: data[0].display_name,
        };
        CACHE.set(key, { at: Date.now(), value: result });
        return result;
      }
    }
  } catch {
    // fall through to local
  }
  if (local) {
    CACHE.set(key, { at: Date.now(), value: local });
    return local;
  }
  return null;
}

// For client-side quick suggestions without network
export function suggestPlaces(query: string): string[] {
  const q = query.toLowerCase().trim();
  if (q.length < 1) return [];
  const all = ["กรุงเทพมหานคร", "เชียงใหม่", "ภูเก็ต", "พัทยา", "ขอนแก่น", "เชียงราย", "หาดใหญ่", "อุบลราชธานี", "นครราชสีมา", "อุดรธานี", "Bangkok", "Tokyo", "Singapore", "Seoul", "London"];
  return all.filter((p) => p.toLowerCase().includes(q)).slice(0, 5);
}
