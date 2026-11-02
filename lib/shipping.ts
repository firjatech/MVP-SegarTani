/**
 * Konfigurasi Titik Gudang Distribusi SegarTani & Utilitas Pengiriman
 *
 * Sumber Koordinat:
 * - OpenStreetMap Geocoding (Alun-Alun Bandung, Kec. Sumur Bandung, Kota Bandung)
 * Koordinat Terverifikasi: Lintang (Lat) -6.9218, Bujur (Lng) 107.6071
 */

export const WAREHOUSE_CONFIG = {
  name: 'Gudang Bandung',
  address: 'Jl. Asia Afrika, Alun-Alun, Kec. Sumur Bandung',
  district: 'Sumur Bandung',
  city: 'Bandung',
  province: 'Jawa Barat',
  postalCode: '40111',
  coordinates: {
    lat: -6.9218,
    lng: 107.6071,
  },
} as const;

export const MAX_DELIVERY_DISTANCE = 15; // Jarak pengiriman maksimal 15 km
export const BASE_SHIPPING_FEE = 5000;   // Biaya dasar Rp5.000
export const PER_KM_FEE = 2000;          // Biaya per km Rp2.000
export const EARTH_RADIUS_KM = 6371.0;   // Radius rata-rata bola bumi (km)

/**
 * Menghitung jarak antara dua koordinat geografis menggunakan rumus Haversine
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Menghitung biaya pengiriman berdasarkan jarak km
 * Rumus: Rp5.000 + (jarak km x Rp2.000)
 */
export function calculateShippingFee(distanceKm: number): number {
  if (distanceKm <= 0) return 0;
  return BASE_SHIPPING_FEE + Math.round(distanceKm * PER_KM_FEE);
}
