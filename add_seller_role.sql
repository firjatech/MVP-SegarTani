-- ============================================================
-- Migrasi: Tambah kolom is_seller ke tabel profiles
-- Jalankan di Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_seller BOOLEAN DEFAULT FALSE;

-- Set semua yang is_admin=true menjadi is_seller=true juga (opsional)
-- UPDATE profiles SET is_seller = TRUE WHERE is_admin = TRUE;
