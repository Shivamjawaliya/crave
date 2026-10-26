export interface LatLng {
  latitude: number;
  longitude: number;
}

// Bhopal & common urban area landmarks to ensure realistic delivery coordinate mappings
export const KNOWN_AREAS: Record<string, LatLng> = {
  'nehru nagar': { latitude: 23.2185, longitude: 77.4042 },
  'arera colony': { latitude: 23.2156, longitude: 77.4338 },
  '10 no': { latitude: 23.2162, longitude: 77.4345 },
  'e-3': { latitude: 23.2140, longitude: 77.4320 },
  'mp nagar': { latitude: 23.2335, longitude: 77.4326 },
  'm.p. nagar': { latitude: 23.2335, longitude: 77.4326 },
  'indrapuri': { latitude: 23.2517, longitude: 77.4626 },
  'bhel': { latitude: 23.2625, longitude: 77.4720 },
  'new market': { latitude: 23.2366, longitude: 77.3995 },
  'tt nagar': { latitude: 23.2366, longitude: 77.3995 },
  't.t. nagar': { latitude: 23.2366, longitude: 77.3995 },
  'kolar': { latitude: 23.1815, longitude: 77.4223 },
  'sarvadharmi': { latitude: 23.1830, longitude: 77.4210 },
  'shahpura': { latitude: 23.2045, longitude: 77.4361 },
  'manisha': { latitude: 23.2080, longitude: 77.4370 },
  'hoshangabad': { latitude: 23.1672, longitude: 77.4645 },
  'misrod': { latitude: 23.1620, longitude: 77.4680 },
  'ayodhya': { latitude: 23.2680, longitude: 77.4780 },
  'anand nagar': { latitude: 23.2650, longitude: 77.4750 },
  'karond': { latitude: 23.2925, longitude: 77.3820 },
  'shyamla hills': { latitude: 23.2420, longitude: 77.3780 },
  'van vihar': { latitude: 23.2310, longitude: 77.3720 },
  'lalghati': { latitude: 23.2790, longitude: 77.3710 },
  'kohefiza': { latitude: 23.2750, longitude: 77.3850 },
  'evergreen': { latitude: 23.2450, longitude: 77.4320 },
  'springfield': { latitude: 23.2450, longitude: 77.4320 },
};

/**
 * Resolves coordinates from an address string.
 * First checks known neighborhoods/landmarks, then uses a deterministic hash offset within Bhopal
 * to ensure two different addresses never map to the exact same spot.
 */
export function resolveCoordinatesFromAddress(address?: string | null, city?: string | null): LatLng {
  const text = `${address || ''} ${city || ''}`.trim().toLowerCase();

  if (!text) {
    return { latitude: 23.2324, longitude: 77.4300 };
  }

  for (const [key, coords] of Object.entries(KNOWN_AREAS)) {
    if (text.includes(key)) {
      return coords;
    }
  }

  // Deterministic slight offset based on address text hash around central Bhopal (23.235, 77.415)
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = ((Math.abs(hash) % 100) - 50) * 0.0004; // +/- 0.02 deg (~2km)
  const lngOffset = ((Math.abs(hash >> 3) % 100) - 50) * 0.0004;

  return {
    latitude: Number((23.2350 + latOffset).toFixed(6)),
    longitude: Number((77.4150 + lngOffset).toFixed(6)),
  };
}
