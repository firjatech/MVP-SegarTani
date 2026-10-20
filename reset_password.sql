UPDATE auth.users
SET encrypted_password = crypt('PASSWORD_BARU_DI_SINI', gen_salt('bf'))
WHERE email = 'EMAIL_ANDA@gmail.com';
