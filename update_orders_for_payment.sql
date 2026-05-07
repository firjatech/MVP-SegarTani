-- ==========================================
-- Update Tabel Orders untuk Midtrans Payment
-- ==========================================

-- Tambahkan kolom payment_url (untuk snap redirect URL)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_url TEXT;

-- Tambahkan kolom payment_token (opsional, jika ingin memanggil snap js)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_token TEXT;
