-- ============================================================
-- Membuat Storage Bucket untuk Aset Toko (Logo, Banner)
-- ============================================================

-- 1. Buat bucket baru bernama 'store-assets' jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy agar semua orang bisa melihat gambar/aset (Public Read)
DROP POLICY IF EXISTS "Public can view store-assets" ON storage.objects;
CREATE POLICY "Public can view store-assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'store-assets' );

-- 3. Policy agar penjual yang login bisa upload gambar ke bucket ini
DROP POLICY IF EXISTS "Authenticated users can upload store-assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload store-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'store-assets' );

-- 4. Policy agar penjual bisa update/delete gambar mereka sendiri
DROP POLICY IF EXISTS "Users can update their own store-assets" ON storage.objects;
CREATE POLICY "Users can update their own store-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'store-assets' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Users can delete their own store-assets" ON storage.objects;
CREATE POLICY "Users can delete their own store-assets"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'store-assets' AND auth.uid() = owner );
