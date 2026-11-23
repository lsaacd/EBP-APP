export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface MapViewportRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export type MapPinEntry<T extends LatLngPoint & { id: string }> =
  | {
      type: "church";
      id: string;
      lat: number;
      lng: number;
      church: T;
    }
  | {
      type: "cluster";
      id: string;
      lat: number;
      lng: number;
      count: number;
      churches: T[];
      expansionDelta: { latitudeDelta: number; longitudeDelta: number };
    };

function isValidCoordPair(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false;
  return true;
}

/**
 * Parses direct coordinate strings ("37.3812, -121.8975") or Google Maps / Apple Maps URLs
 * into validated { lat, lng } coordinates.
 */
/**
 * The public link for a church, used by the QR code on its card. The app's
 * scanner recognises this shape, and on a phone without the app installed it
 * opens the church on the website.
 */
export function churchShareUrl(id: string): string {
  return `https://himnarioebp.com/churches?id=${encodeURIComponent(id)}`;
}

/**
 * Distances are shown in both units, miles first: the directory spans the
 * United States and Latin America, and many members think in one or the other.
 * "38 mi (61 km)".
 */
export function formatDistance(miles: number): string {
  const km = miles * 1.60934;
  if (miles < 0.2) return "< 0.2 mi (< 0.3 km)";
  const one = (value: number) => (value < 10 ? value.toFixed(1) : String(Math.round(value)));
  return `${one(miles)} mi (${one(km)} km)`;
}

/** Index of the point nearest to `from`, or -1 for an empty list. */
export function nearestIndex(from: LatLngPoint, points: LatLngPoint[]): number {
  let best = -1;
  let bestScore = Infinity;
  const cosLat = Math.cos((from.lat * Math.PI) / 180);
  for (let i = 0; i < points.length; i++) {
    // Equirectangular approximation: enough to rank by distance.
    const dLat = points[i].lat - from.lat;
    let dLng = Math.abs(points[i].lng - from.lng);
    if (dLng > 180) dLng = 360 - dLng;
    const score = dLat * dLat + dLng * cosLat * (dLng * cosLat);
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

export function parseCoordsOrMapsInput(raw: string): LatLngPoint | null {
  if (typeof raw !== "string") return null;
  let text = raw.trim();
  if (!text) return null;
  try {
    text = decodeURIComponent(text);
  } catch {
    // Keep raw text if percent-decoding fails
  }

  // 1. Google Maps exact pin data parameters: !3d<lat>!4d<lng>
  const exactPinMatches = [...text.matchAll(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g)];
  if (exactPinMatches.length > 0) {
    const last = exactPinMatches[exactPinMatches.length - 1];
    const lat = Number(last[1]);
    const lng = Number(last[2]);
    if (isValidCoordPair(lat, lng)) return { lat, lng };
  }

  // 2. Query / URL parameters: ll=, sll=, q=, query=, coordinate=, destination=, daddr=, center=
  const paramMatch = text.match(
    /(?:[?&](?:ll|sll|q|query|coordinate|destination|daddr|center)=)(-?\d{1,2}(?:\.\d+)?)\s*[,\s]\s*(-?\d{1,3}(?:\.\d+)?)/i,
  );
  if (paramMatch) {
    const lat = Number(paramMatch[1]);
    const lng = Number(paramMatch[2]);
    if (isValidCoordPair(lat, lng)) return { lat, lng };
  }

  // 3. Google Maps viewport/@lat,lng
  const atMatch = text.match(/@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
  if (atMatch) {
    const lat = Number(atMatch[1]);
    const lng = Number(atMatch[2]);
    if (isValidCoordPair(lat, lng)) return { lat, lng };
  }

  // 4. Direct decimal coordinate pair: "37.3812, -121.8975" or "(37.3812 -121.8975)"
  const directMatch = text.match(
    /^\s*\(?\s*(-?\d{1,2}\.\d{2,})\s*(?:,|\s)\s*(-?\d{1,3}\.\d{2,})\s*\)?\s*$/,
  );
  if (directMatch) {
    const lat = Number(directMatch[1]);
    const lng = Number(directMatch[2]);
    if (isValidCoordPair(lat, lng)) return { lat, lng };
  }

  return null;
}

/**
 * Pure-JS viewport clusterer tailored for the Localize-style church house map:
 * - At city/regional zoom (latitudeDelta < 0.35), always renders individual church house icons.
 * - At broad country/continental zoom, only merges tightly stacked pins (4+ in the same micro-cell)
 *   so regional groups still fan out as charming individual church buildings.
 */
export function buildChurchMapPins<T extends LatLngPoint & { id: string }>(
  churches: T[],
  region: MapViewportRegion,
  selectedId?: string | null,
): MapPinEntry<T>[] {
  if (!Array.isArray(churches) || churches.length === 0) return [];
  const latDelta = Math.max(0.005, Number(region?.latitudeDelta) || 10);
  const lngDelta = Math.max(0.005, Number(region?.longitudeDelta) || 10);

  if (latDelta < 0.35 || churches.length <= 4) {
    return churches.map((church) => ({
      type: "church",
      id: church.id,
      lat: church.lat,
      lng: church.lng,
      church,
    }));
  }

  const cellLat = latDelta / 22;
  const cellLng = lngDelta / 20;
  const buckets = new Map<string, T[]>();
  const pinnedIndividual: T[] = [];

  for (const church of churches) {
    if (selectedId && church.id === selectedId) {
      pinnedIndividual.push(church);
      continue;
    }
    const gy = Math.floor((church.lat + 90) / cellLat);
    const gx = Math.floor((church.lng + 180) / cellLng);
    const key = `${gy}:${gx}`;
    const list = buckets.get(key);
    if (list) list.push(church);
    else buckets.set(key, [church]);
  }

  const entries: MapPinEntry<T>[] = pinnedIndividual.map((church) => ({
    type: "church",
    id: church.id,
    lat: church.lat,
    lng: church.lng,
    church,
  }));

  for (const [key, group] of buckets.entries()) {
    if (group.length < 4) {
      for (const church of group) {
        entries.push({
          type: "church",
          id: church.id,
          lat: church.lat,
          lng: church.lng,
          church,
        });
      }
      continue;
    }
    let sumLat = 0;
    let sumLng = 0;
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;
    for (const c of group) {
      sumLat += c.lat;
      sumLng += c.lng;
      if (c.lat < minLat) minLat = c.lat;
      if (c.lat > maxLat) maxLat = c.lat;
      if (c.lng < minLng) minLng = c.lng;
      if (c.lng > maxLng) maxLng = c.lng;
    }
    const centerLat = sumLat / group.length;
    const centerLng = sumLng / group.length;
    const spanLat = Math.max(0.06, (maxLat - minLat) * 1.8);
    const spanLng = Math.max(0.06, (maxLng - minLng) * 1.8);
    entries.push({
      type: "cluster",
      id: `cluster-${key}-${group.length}`,
      lat: centerLat,
      lng: centerLng,
      count: group.length,
      churches: group,
      expansionDelta: {
        latitudeDelta: Math.min(latDelta * 0.45, spanLat),
        longitudeDelta: Math.min(lngDelta * 0.45, spanLng),
      },
    });
  }

  return entries;
}
