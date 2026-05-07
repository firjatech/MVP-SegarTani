-- ============================================================
-- 1. Update tabel products untuk mendukung multi-penjual
-- ============================================================

-- Tambahkan kolom seller_id yang merujuk ke id tabel profiles (atau auth.users)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS Policy untuk tabel products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: Publik bisa membaca semua produk
DROP POLICY IF EXISTS "Allow public read access" ON public.products;
CREATE POLICY "Allow public read access" ON public.products
  FOR SELECT USING (true);

-- Policy: Penjual hanya bisa insert produk mereka sendiri
DROP POLICY IF EXISTS "Seller can insert own products" ON public.products;
CREATE POLICY "Seller can insert own products" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = seller_id);

-- Policy: Penjual hanya bisa update produk mereka sendiri
DROP POLICY IF EXISTS "Seller can update own products" ON public.products;
CREATE POLICY "Seller can update own products" ON public.products
  FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id);

-- Policy: Penjual hanya bisa delete produk mereka sendiri
DROP POLICY IF EXISTS "Seller can delete own products" ON public.products;
CREATE POLICY "Seller can delete own products" ON public.products
  FOR DELETE TO authenticated
  USING (auth.uid() = seller_id);

-- ============================================================
-- 2. Membuat Storage Bucket untuk Gambar Produk
-- ============================================================

-- Buat bucket baru bernama 'product-assets'
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-assets', 'product-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy agar semua orang bisa melihat gambar produk
DROP POLICY IF EXISTS "Public can view product-assets" ON storage.objects;
CREATE POLICY "Public can view product-assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-assets' );

-- Policy agar penjual bisa upload gambar
DROP POLICY IF EXISTS "Authenticated users can upload product-assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload product-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'product-assets' );

-- Policy agar penjual bisa update/delete gambar mereka sendiri
DROP POLICY IF EXISTS "Users can update their own product-assets" ON storage.objects;
CREATE POLICY "Users can update their own product-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'product-assets' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Users can delete their own product-assets" ON storage.objects;
CREATE POLICY "Users can delete their own product-assets"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'product-assets' AND auth.uid() = owner );
