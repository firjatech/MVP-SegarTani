import { z } from 'zod';

// ==========================================
// Checkout Form Schema
// ==========================================
export const checkoutFormSchema = z.object({
  full_name: z
    .string()
    .min(3, 'Nama minimal 3 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  phone: z
    .string()
    .min(10, 'Nomor telepon minimal 10 digit')
    .max(15, 'Nomor telepon maksimal 15 digit')
    .regex(
      /^(\+62|62|0)8[1-9][0-9]{6,10}$/,
      'Format nomor telepon tidak valid. Contoh: 081234567890'
    ),
  address: z
    .string()
    .min(10, 'Alamat terlalu pendek, minimal 10 karakter')
    .max(500, 'Alamat maksimal 500 karakter'),
  city: z
    .string()
    .min(2, 'Nama kota minimal 2 karakter')
    .max(100, 'Nama kota maksimal 100 karakter'),
  province: z
    .string()
    .min(2, 'Nama provinsi minimal 2 karakter')
    .max(100, 'Nama provinsi maksimal 100 karakter'),
  postal_code: z
    .string()
    .regex(/^[0-9]{5}$/, 'Kode pos harus 5 digit angka'),
});

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

// ==========================================
// Register Form Schema
// ==========================================
export const registerFormSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Nama minimal 3 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  email: z
    .string()
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(6, 'Password minimal 6 karakter'),
});

export type RegisterFormData = z.infer<typeof registerFormSchema>;

// ==========================================
// Login Form Schema
// ==========================================
export const loginFormSchema = z.object({
  email: z
    .string()
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(1, 'Password tidak boleh kosong'),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;
