-- ============================================================
-- 1. Pastikan kolom is_seller ada di tabel profiles
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_seller BOOLEAN DEFAULT FALSE;

-- ============================================================
-- 2. Buat tabel store_profiles jika belum ada
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

-- Aktifkan RLS di store_profiles
ALTER TABLE store_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Semua orang bisa melihat profil toko
DROP POLICY IF EXISTS "Public can view store profiles" ON store_profiles;
CREATE POLICY "Public can view store profiles"
  ON store_profiles FOR SELECT USING (true);

-- Policy: Penjual bisa mengelola profil tokonya sendiri
DROP POLICY IF EXISTS "Seller can manage own store profile" ON store_profiles;
CREATE POLICY "Seller can manage own store profile"
  ON store_profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 4. Trigger Otomatis Pembuatan Profil
-- ============================================================

-- Fungsi untuk menangani user baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert ke public.profiles
  INSERT INTO public.profiles (id, full_name, phone, city, is_seller)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'city',
    (new.raw_user_meta_data->>'is_seller')::boolean
  );

  -- Jika is_seller true, insert ke store_profiles
  IF (new.raw_user_meta_data->>'is_seller')::boolean = true THEN
    INSERT INTO public.store_profiles (id, store_name)
    VALUES (new.id, new.raw_user_meta_data->>'store_name');
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger setelah user terdaftar di auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
