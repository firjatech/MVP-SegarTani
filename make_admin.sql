-- ============================================================
-- SKRIP AKTIVASI ADMIN & PENJUAL: contoh123@gmail.com
-- Jalankan skrip ini di Supabase Dashboard > SQL Editor
-- ============================================================

DO $$
DECLARE
  target_email TEXT := 'contoh123@gmail.com';
  u_id UUID;
BEGIN
  -- 1. Konfirmasi email langsung di auth.users (bisa langsung login tanpa verifikasi link email)
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE email = target_email
  RETURNING id INTO u_id;

  IF u_id IS NOT NULL THEN
    -- 2. Pastikan kolom is_admin dan is_seller ada di tabel profiles
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_seller BOOLEAN DEFAULT FALSE;

    -- 3. Angkat akun menjadi Admin & Penjual
    UPDATE public.profiles
    SET is_admin = TRUE, is_seller = TRUE
    WHERE id = u_id;

    -- 4. Daftarkan juga profil tokonya sebagai SegarTani Official
    INSERT INTO public.store_profiles (id, store_name, store_description)
    VALUES (u_id, 'SegarTani Official', 'Toko Resmi Pusat SegarTani')
    ON CONFLICT (id) DO UPDATE 
    SET store_name = 'SegarTani Official';

    RAISE NOTICE 'SUKSES! Akun % (ID: %) resmi aktif sebagai Admin SegarTani Official.', target_email, u_id;
  ELSE
    RAISE NOTICE 'PERINGATAN: Email % belum terdaftar di auth.users! Silakan buat akun terlebih dahulu di /register.', target_email;
  END IF;
END $$;
