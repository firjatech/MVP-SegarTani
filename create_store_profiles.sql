-- ============================================================
-- Tabel: store_profiles
-- Menyimpan profil toko untuk setiap penjual (is_admin = true)
-- ============================================================

CREATE TABLE IF NOT EXISTS store_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT,
  store_description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  store_address TEXT,
  store_city TEXT,
  store_province TEXT,
  store_postal_code TEXT,
  store_lat DOUBLE PRECISION,
  store_lng DOUBLE PRECISION,
  store_maps_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE store_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: semua orang bisa melihat profil toko
CREATE POLICY "Public can view store profiles"
  ON store_profiles FOR SELECT USING (true);

-- Policy: penjual bisa upsert profil tokonya sendiri
CREATE POLICY "Seller can upsert own store profile"
  ON store_profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- Storage Bucket untuk logo & banner toko
-- Jalankan di Supabase Dashboard > Storage
-- ============================================================

-- Buat bucket "store-assets" (public)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('store-assets', 'store-assets', true)
-- ON CONFLICT DO NOTHING;

-- Policy: siapa saja bisa baca (public)
-- CREATE POLICY "Public read store assets"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'store-assets');

-- Policy: penjual bisa upload ke folder miliknya
-- CREATE POLICY "Seller upload store assets"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'store-assets'
--     AND auth.uid()::text = (storage.foldername(name))[1]
--   );

-- Policy: penjual bisa hapus file miliknya
-- CREATE POLICY "Seller delete store assets"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'store-assets'
--     AND auth.uid()::text = (storage.foldername(name))[1]
--   );
