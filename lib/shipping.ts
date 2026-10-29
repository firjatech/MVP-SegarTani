/**
 * Konfigurasi Titik Gudang Distribusi SegarTani & Utilitas Pengiriman
 * 
 * Sumber Koordinat:
 * - Data Pokok Pendidikan Kemendikdasmen RI (SMK Darul Falach Klombeyan, Candiroto, Temanggung)
 * - OpenStreetMap Geocoding (Klombeyan, Desa Muntung, Kec. Candiroto, Kab. Temanggung)
 * Koordinat Terverifikasi: Lintang (Lat) -7.2179, Bujur (Lng) 110.0456
 */

export const WAREHOUSE_CONFIG = {
  name: 'Gudang Klombeyan, Temanggung',
  address: 'Jl. Sibajag KM 01 Klombeyan, Desa Muntung, Kec. Candiroto',
  district: 'Candiroto',
  city: 'Temanggung',
  province: 'Jawa Tengah',
  postalCode: '56257',
  coordinates: {
    lat: -7.2179,
    lng: 110.0456,
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
