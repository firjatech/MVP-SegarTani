-- Jalankan query ini di Supabase SQL Editor jika Anda ingin mengonfirmasi semua email user yang pernah terdaftar agar bisa langsung login tanpa verifikasi email:

UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
