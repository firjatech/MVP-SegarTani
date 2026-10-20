-- ============================================================
-- SKRIP HAPUS USER SUPABASE BY EMAIL
-- Ganti 'EMAIL_USER_YANG_INGIN_DIHAPUS@gmail.com' dengan email yang mau dihapus.
-- Lalu jalankan di Supabase SQL Editor.
-- ============================================================

DO $$ 
DECLARE
  target_email TEXT := 'EMAIL_USER_YANG_INGIN_DIHAPUS@gmail.com'; -- <--- Ganti email di sini
  target_user_id UUID;
BEGIN
  -- 1. Cari ID user berdasarkan email
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

  IF target_user_id IS NOT NULL THEN
    -- 2. Hapus data terkait di tabel public terlebih dahulu (mencegah error Foreign Key)
    DELETE FROM public.profiles WHERE id = target_user_id;
    DELETE FROM public.store_profiles WHERE id = target_user_id;
    
    -- Hapus dari tabel pendukung jika ada
    DELETE FROM public.wishlist WHERE user_id = target_user_id;
    DELETE FROM public.orders WHERE user_id = target_user_id;

    -- 3. Hapus akun dari auth.users
    DELETE FROM auth.users WHERE id = target_user_id;

    RAISE NOTICE 'User dengan email % (ID: %) berhasil dihapus.', target_email, target_user_id;
  ELSE
    RAISE NOTICE 'User dengan email % tidak ditemukan.', target_email;
  END IF;
END $$;
