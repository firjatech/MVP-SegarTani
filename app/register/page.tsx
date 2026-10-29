'use client';

import React, { useState, useId, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Store,
  ShoppingBag,
  Phone,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'seller' ? 'seller' : 'buyer';

  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller'>(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const storeNameId = useId();
  const phoneId = useId();
  const cityId = useId();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (selectedRole === 'seller') {
        if (!storeName.trim()) {
          setError('Silakan masukkan nama toko Anda.');
          setLoading(false);
          return;
        }
        if (!phone.trim()) {
          setError('Silakan masukkan nomor telepon / WhatsApp Anda.');
          setLoading(false);
          return;
        }

        // Sign Up mitra penjual
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              city: city,
              is_seller: true,
              store_name: storeName,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              full_name: fullName,
              phone: phone,
              city: city,
              is_seller: true,
              updated_at: new Date().toISOString(),
            });

            await supabase.from('store_profiles').upsert({
              id: data.user.id,
              store_name: storeName,
              updated_at: new Date().toISOString(),
            });
          } catch (dbErr) {
            console.warn('Profile/store upsert info:', dbErr);
          }

          setSuccess(true);
          localStorage.setItem('segar-tani-role', 'seller');
          window.dispatchEvent(new Event('roleChange'));

          if (data.session) {
            setTimeout(() => {
              router.push('/admin/dashboard');
            }, 1200);
          } else {
            setTimeout(() => {
              router.push('/login?role=seller');
            }, 1200);
          }
        }
      } else {
        // Sign Up pembeli biasa
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              is_seller: false,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              full_name: fullName,
              is_seller: false,
              updated_at: new Date().toISOString(),
            });
          } catch (dbErr) {
            console.warn('Profile upsert info:', dbErr);
          }

          setSuccess(true);
          localStorage.setItem('segar-tani-role', 'buyer');
          window.dispatchEvent(new Event('roleChange'));

          if (data.session) {
            setTimeout(() => {
              router.push('/ecommerce');
            }, 1200);
          } else {
            setTimeout(() => {
              router.push('/login?role=buyer');
            }, 1200);
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err.message.includes('Failed to fetch') || err.message.includes('fetch'))) {
        setError('Gagal terhubung ke server Supabase. Pastikan koneksi internet aktif.');
      } else {
        setError(err instanceof Error ? err.message : 'Gagal mendaftar. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8">
      <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[720px]">
        {/* Left Side: Form */}
        <div className="flex-1 p-8 md:p-14 flex flex-col justify-center relative bg-white">
          <div className="mb-6 flex flex-col items-center lg:items-start w-full">
            <div className="mb-3 flex items-center gap-2">
              <Image src="/images/logo.jpg" alt="Logo" width={48} height={48} priority className="h-10 w-auto" />
              <span className="text-2xl font-black text-primary">
                Segar<span className="text-secondary">Tani</span>
              </span>
            </div>
            <div className="w-full text-left">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary transition-colors"
              >
                <ArrowRight size={14} className="rotate-180" /> Kembali ke Beranda
              </Link>
            </div>
          </div>

          <div className="max-w-md w-full mx-auto">
            {/* 2 PILIHAN DAFTAR: PEMBELI ATAU PENJUAL */}
            <div className="mb-6">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 text-center">
                PILIH JENIS AKUN ANDA
              </p>
              <div className="bg-gray-100 p-1.5 rounded-2xl flex items-center gap-1.5 border border-gray-200/80">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('buyer');
                    setError(null);
                  }}
                  className={`flex-1 py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedRole === 'buyer'
                      ? 'bg-primary text-white shadow-md shadow-primary/25 scale-[1.02]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                  }`}
                >
                  <ShoppingBag size={18} />
                  <span>Daftar Pembeli</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('seller');
                    setError(null);
                  }}
                  className={`flex-1 py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedRole === 'seller'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25 scale-[1.02]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                  }`}
                >
                  <Store size={18} />
                  <span>Daftar Penjual</span>
                </button>
              </div>
            </div>

            {/* Header Form Berdasarkan Pilihan */}
            <div className="text-center mb-6">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider mb-2"
                style={{
                  backgroundColor: selectedRole === 'seller' ? '#fef3c7' : '#ecfdf5',
                  color: selectedRole === 'seller' ? '#92400e' : '#065f46',
                }}
              >
                {selectedRole === 'seller' ? (
                  <>
                    <Store size={13} /> Registrasi Mitra Penjual
                  </>
                ) : (
                  <>
                    <ShoppingBag size={13} /> Akun Pembeli SegarTani
                  </>
                )}
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                {selectedRole === 'seller' ? 'Buka Toko Mitra Baru' : 'Buat Akun Pembeli Baru'}
              </h1>
              <p className="text-gray-400 font-medium text-xs sm:text-sm mt-1">
                {selectedRole === 'seller'
                  ? 'Jual produk hasil panen Anda langsung ke ribuan pembeli setia.'
                  : 'Bergabunglah dengan SegarTani untuk belanja produk organik lebih mudah.'}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold text-left"
              >
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-700 text-sm font-bold text-left"
              >
                <CheckCircle2 size={18} className="shrink-0" />
                <span>
                  {selectedRole === 'seller'
                    ? 'Pendaftaran toko berhasil! Mengalihkan ke Dashboard Toko...'
                    : 'Pendaftaran berhasil! Mengalihkan ke Katalog Belanja...'}
                </span>
              </motion.div>
            )}

            <form onSubmit={handleRegister} className="space-y-4 text-left">
              {/* Field Khusus Penjual: Nama Toko */}
              {selectedRole === 'seller' && (
                <div>
                  <label
                    htmlFor={storeNameId}
                    className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2"
                  >
                    NAMA TOKO / KEBUN *
                  </label>
                  <div className="relative">
                    <Store size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      id={storeNameId}
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Contoh: Toko Sayur Berkah, Kebun Hijau"
                      className="w-full bg-white border border-gray-100 rounded-2xl px-14 py-4 focus:outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-600/5 text-gray-700 font-medium transition-all text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Nama Lengkap */}
              <div>
                <label
                  htmlFor={nameId}
                  className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2"
                >
                  {selectedRole === 'seller' ? 'NAMA PEMILIK / PENJUAL *' : 'NAMA LENGKAP *'}
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    id={nameId}
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={selectedRole === 'seller' ? 'Nama lengkap pemilik toko' : 'Masukkan nama lengkap kamu'}
                    className={`w-full bg-white border border-gray-100 rounded-2xl px-14 py-4 focus:outline-none focus:ring-4 text-gray-700 font-medium transition-all text-sm ${
                      selectedRole === 'seller'
                        ? 'focus:border-amber-600 focus:ring-amber-600/5'
                        : 'focus:border-primary focus:ring-primary/5'
                    }`}
                  />
                </div>
              </div>

              {/* Field Tambahan Khusus Penjual: No HP & Kota */}
              {selectedRole === 'seller' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor={phoneId}
                      className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2"
                    >
                      NO. WHATSAPP / HP *
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input
                        id={phoneId}
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0812xxxx"
                        className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-600/5 text-gray-700 font-medium transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={cityId}
                      className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2"
                    >
                      KOTA / KABUPATEN
                    </label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input
                        id={cityId}
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Contoh: Bandung"
                        className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-600/5 text-gray-700 font-medium transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label
                  htmlFor={emailId}
                  className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2"
                >
                  EMAIL *
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    id={emailId}
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className={`w-full bg-white border border-gray-100 rounded-2xl px-14 py-4 focus:outline-none focus:ring-4 text-gray-700 font-medium transition-all text-sm ${
                      selectedRole === 'seller'
                        ? 'focus:border-amber-600 focus:ring-amber-600/5'
                        : 'focus:border-primary focus:ring-primary/5'
                    }`}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor={passwordId}
                  className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2"
                >
                  PASSWORD *
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    id={passwordId}
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    minLength={6}
                    autoComplete="new-password"
                    className={`w-full bg-white border border-gray-100 rounded-2xl pl-14 pr-14 py-4 focus:outline-none focus:ring-4 text-gray-700 font-medium transition-all text-sm ${
                      selectedRole === 'seller'
                        ? 'focus:border-amber-600 focus:ring-amber-600/5'
                        : 'focus:border-primary focus:ring-primary/5'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || success}
                className={`w-full font-black py-4.5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 group text-base cursor-pointer mt-6 ${
                  selectedRole === 'seller'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 disabled:bg-gray-300'
                    : 'bg-primary hover:bg-[#008810] text-white shadow-primary/20 disabled:bg-gray-300'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Sedang Mendaftarkan...
                  </>
                ) : (
                  <>
                    <span>{selectedRole === 'seller' ? 'Buka Toko Sekarang' : 'Daftar Akun Pembeli'}</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom link to Login */}
            <div className="mt-8 pt-5 border-t border-gray-100 text-center">
              <p className="text-xs font-medium text-gray-500">
                Sudah punya akun?{' '}
                <Link
                  href={selectedRole === 'seller' ? '/login?role=seller' : '/login?role=buyer'}
                  className={`font-black hover:underline ${
                    selectedRole === 'seller' ? 'text-amber-700' : 'text-primary'
                  }`}
                >
                  Masuk di Sini
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Visual Context per Role */}
        <div
          className={`hidden lg:flex flex-1 p-14 flex-col justify-between relative overflow-hidden transition-all duration-500 ${
            selectedRole === 'seller' ? 'bg-linear-to-br from-[#854d0e] to-[#713f12]' : 'bg-primary'
          }`}
        >
          {/* Decorative Elements */}
          <div className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/15 text-white backdrop-blur-xs mb-4">
              <Sparkles size={14} />
              {selectedRole === 'seller' ? 'Pendaftaran Mitra Penjual' : 'Pasar Sayur Organik Segar'}
            </span>

            <h2 className="text-4xl font-black text-white mb-3 leading-tight">
              {selectedRole === 'seller' ? 'Mulai Jual Panen Anda Bersama SegarTani' : 'Segar, Sehat & Langsung Dari Petani'}
            </h2>

            <p className="text-white/80 text-sm leading-relaxed mb-6 font-medium">
              {selectedRole === 'seller'
                ? 'Daftarkan toko atau kelompok tani Anda sekarang. Dapatkan akses langsung ke ribuan pembeli, sistem pesanan digital, dan pengelolaan stok yang praktis.'
                : 'Penuhi kebutuhan nutrisi keluarga Anda dengan sayuran hijau, buah-buahan, dan rempah terbaik yang dipetik segar setiap hari dengan jaminan kualitas.'}
            </p>

            <div className="space-y-3 pt-4 border-t border-white/10">
              {selectedRole === 'seller' ? (
                <>
                  <div className="flex items-center gap-3 text-white/90 text-xs font-bold">
                    <CheckCircle2 size={16} className="text-amber-300 shrink-0" />
                    <span>Tanpa biaya pendaftaran & langsung aktif</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/90 text-xs font-bold">
                    <CheckCircle2 size={16} className="text-amber-300 shrink-0" />
                    <span>Jangkauan pesanan lokal hingga radius terjauh</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/90 text-xs font-bold">
                    <CheckCircle2 size={16} className="text-amber-300 shrink-0" />
                    <span>Pencairan saldo cepat dan laporan penjualan rapi</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 text-white/90 text-xs font-bold">
                    <CheckCircle2 size={16} className="text-green-300 shrink-0" />
                    <span>100% Produk organik dan terjamin kesegarannya</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/90 text-xs font-bold">
                    <CheckCircle2 size={16} className="text-green-300 shrink-0" />
                    <span>Pengiriman kilat langsung dari kebun terdekat</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/90 text-xs font-bold">
                    <CheckCircle2 size={16} className="text-green-300 shrink-0" />
                    <span>Promo harga petani dan diskon eksklusif member</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
