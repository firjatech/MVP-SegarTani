'use client';

import React, { useState, useId, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Store,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'seller' ? 'seller' : 'buyer';

  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notSellerPrompt, setNotSellerPrompt] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ message: string; role: 'seller' | 'buyer' } | null>(null);

  const emailId = useId();
  const passwordId = useId();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotSellerPrompt(false);
    setSuccessInfo(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        // Cek status penjual di database
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_seller, is_admin')
          .eq('id', data.user.id)
          .maybeSingle();

        const { data: storeProfile } = await supabase
          .from('store_profiles')
          .select('id, store_name')
          .eq('id', data.user.id)
          .maybeSingle();

        const isUserSeller = Boolean(profile?.is_seller || profile?.is_admin || storeProfile);
        const redirectParam = searchParams.get('redirect');

        if (selectedRole === 'seller') {
          // USER MEMILIH LOGIN SEBAGAI PENJUAL
          if (!isUserSeller) {
            // Akun ini bukan penjual
            setNotSellerPrompt(true);
            setError('Akun Anda belum terdaftar sebagai Penjual di SegarTani.');
            setLoading(false);
            return;
          }

          const storeName = storeProfile?.store_name ? ` (${storeProfile.store_name})` : '';
          setSuccessInfo({
            message: `Berhasil masuk sebagai Penjual${storeName}! Mengalihkan ke Dashboard Toko...`,
            role: 'seller',
          });
          setTimeout(() => {
            router.push(redirectParam || '/admin/dashboard');
          }, 800);
        } else {
          // USER MEMILIH LOGIN SEBAGAI PEMBELI
          setSuccessInfo({
            message: 'Berhasil masuk sebagai Pembeli! Mengalihkan ke Katalog Belanja...',
            role: 'buyer',
          });
          setTimeout(() => {
            router.push(redirectParam || '/ecommerce');
          }, 800);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err.message.includes('Failed to fetch') || err.message.includes('fetch'))) {
        setError('Gagal terhubung ke server Supabase. Pastikan koneksi internet aktif.');
      } else {
        setError(err instanceof Error ? err.message : 'Gagal masuk. Silakan periksa kembali email dan password Anda.');
      }
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
              <span className="text-2xl font-black text-primary">Segar<span className="text-secondary">Tani</span></span>
            </div>
            <div className="w-full text-left">
              <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary transition-colors">
                <ArrowRight size={14} className="rotate-180" /> Kembali ke Beranda
              </Link>
            </div>
          </div>

          <div className="max-w-md w-full mx-auto">
            {/* 2 PILIHAN UTAMA: PEMBELI ATAU PENJUAL */}
            <div className="mb-6">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 text-center">
                PILIH CARA MASUK ANDA
              </p>
              <div className="bg-gray-100 p-1.5 rounded-2xl flex items-center gap-1.5 border border-gray-200/80">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('buyer');
                    setError(null);
                    setNotSellerPrompt(false);
                  }}
                  className={`flex-1 py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedRole === 'buyer'
                      ? 'bg-primary text-white shadow-md shadow-primary/25 scale-[1.02]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                  }`}
                >
                  <ShoppingBag size={18} />
                  <span>Sebagai Pembeli</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('seller');
                    setError(null);
                    setNotSellerPrompt(false);
                  }}
                  className={`flex-1 py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedRole === 'seller'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25 scale-[1.02]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                  }`}
                >
                  <Store size={18} />
                  <span>Sebagai Penjual</span>
                </button>
              </div>
            </div>

            {/* Header Form Berdasarkan Pilihan */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider mb-2"
                style={{
                  backgroundColor: selectedRole === 'seller' ? '#fef3c7' : '#ecfdf5',
                  color: selectedRole === 'seller' ? '#92400e' : '#065f46',
                }}
              >
                {selectedRole === 'seller' ? (
                  <>
                    <Store size={13} /> Panel Masuk Penjual
                  </>
                ) : (
                  <>
                    <ShoppingBag size={13} /> Belanja Produk Segar
                  </>
                )}
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                {selectedRole === 'seller' ? 'Masuk ke Toko Anda' : 'Masuk ke Akun Pembeli'}
              </h1>
              <p className="text-gray-400 font-medium text-xs sm:text-sm mt-1">
                {selectedRole === 'seller'
                  ? 'Kelola produk, pantau transaksi & pesanan pelanggan Anda.'
                  : 'Cari dan beli sayuran serta buah organik segar langsung dari kebun.'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col gap-2 text-red-700 text-xs sm:text-sm font-bold"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>

                {notSellerPrompt && (
                  <div className="mt-2 pt-2 border-t border-red-200 flex flex-wrap items-center gap-2">
                    <Link
                      href="/daftar-penjual"
                      className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-xs"
                    >
                      Daftar Jadi Penjual 🏪
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole('buyer');
                        setError(null);
                        setNotSellerPrompt(false);
                      }}
                      className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                    >
                      Masuk Sebagai Pembeli
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Success Message */}
            {successInfo && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-5 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold ${
                  successInfo.role === 'seller' 
                    ? 'bg-amber-50 border border-amber-200 text-amber-900' 
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}
              >
                {successInfo.role === 'seller' ? (
                  <Store size={20} className="text-amber-700 shrink-0" />
                ) : (
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                )}
                <span>{successInfo.message}</span>
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div>
                <label htmlFor={emailId} className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  EMAIL
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    id={emailId}
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com" 
                    className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-gray-800 font-medium text-sm transition-all" 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor={passwordId} className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    PASSWORD
                  </label>
                  <Link href="#" className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">
                    Lupa Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    id={passwordId}
                    type={showPassword ? 'text' : 'password'} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-12 py-3.5 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-gray-800 font-medium text-sm transition-all" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || Boolean(successInfo)}
                className={`w-full text-white font-black py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 group text-base cursor-pointer disabled:cursor-not-allowed ${
                  selectedRole === 'seller'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20 disabled:bg-gray-300'
                    : 'bg-primary hover:bg-[#008810] shadow-primary/20 disabled:bg-gray-300'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Memeriksa Akun...
                  </>
                ) : (
                  <>
                    <span>{selectedRole === 'seller' ? 'Masuk ke Dashboard Toko' : 'Masuk ke Katalog Belanja'}</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-8 pt-5 border-t border-gray-100 text-center space-y-1.5">
              {selectedRole === 'buyer' ? (
                <>
                  <p className="text-xs font-medium text-gray-500">
                    Belum punya akun?{' '}
                    <Link href="/register" className="text-primary font-black hover:underline">
                      Daftar Pembeli Gratis
                    </Link>
                  </p>
                  <p className="text-xs text-gray-400">
                    Punya hasil panen sayur & buah?{' '}
                    <Link href="/daftar-penjual" className="text-amber-700 font-bold hover:underline">
                      Daftar Jadi Penjual 🏪
                    </Link>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-medium text-gray-500">
                    Belum punya toko di SegarTani?{' '}
                    <Link href="/daftar-penjual" className="text-amber-700 font-black hover:underline">
                      Buka Toko Penjual Sekarang
                    </Link>
                  </p>
                  <p className="text-xs text-gray-400">
                    Hanya ingin belanja?{' '}
                    <button
                      type="button"
                      onClick={() => setSelectedRole('buyer')}
                      className="text-primary font-bold hover:underline cursor-pointer"
                    >
                      Beralih ke Akun Pembeli 🛒
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Visual Context per Role */}
        <div className={`hidden lg:flex flex-1 p-14 flex-col justify-between relative overflow-hidden transition-all duration-500 ${
          selectedRole === 'seller' ? 'bg-linear-to-br from-[#854d0e] to-[#713f12]' : 'bg-primary'
        }`}>
          {/* Decorative Elements */}
          <div className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/15 text-white backdrop-blur-xs mb-4">
              <Sparkles size={14} />
              {selectedRole === 'seller' ? 'Portal Mitra Penjual' : 'Pasar Sayur Organik Segar'}
            </span>

            <h2 className="text-4xl font-black text-white mb-3 leading-tight">
              {selectedRole === 'seller' ? 'Kelola Toko & Panen Lebih Mudah' : 'Segar, Sehat & Langsung Dari Petani'}
            </h2>

            <p className="text-white/80 text-sm leading-relaxed mb-6 font-medium">
              {selectedRole === 'seller'
                ? 'Jangkau ribuan pembeli langsung tanpa perantara tengkulak. Pantau pesanan masuk secara real-time, atur stok produk, dan nikmati pencairan dana yang aman.'
                : 'Penuhi kebutuhan nutrisi keluarga Anda dengan sayuran hijau, buah-buahan, dan umbi-umbian terbaik yang dipetik segar setiap hari dengan jaminan kualitas.'}
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-3 pt-6 border-t border-white/15 text-white">
            {selectedRole === 'seller' ? (
              <>
                <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 backdrop-blur-xs">
                  <p className="text-2xl font-black mb-0.5">📦</p>
                  <h4 className="font-bold text-xs">Manajemen Stok</h4>
                  <p className="text-[11px] text-white/70 mt-0.5">Tambah produk dan atur harga dengan fleksibel.</p>
                </div>
                <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 backdrop-blur-xs">
                  <p className="text-2xl font-black mb-0.5">💬</p>
                  <h4 className="font-bold text-xs">Chat Langsung</h4>
                  <p className="text-[11px] text-white/70 mt-0.5">Terhubung langsung dengan pembeli Anda.</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 backdrop-blur-xs">
                  <p className="text-2xl font-black mb-0.5">🌱</p>
                  <h4 className="font-bold text-xs">100% Organik</h4>
                  <p className="text-[11px] text-white/70 mt-0.5">Bebas pestisida kimia berbahaya.</p>
                </div>
                <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 backdrop-blur-xs">
                  <p className="text-2xl font-black mb-0.5">🚚</p>
                  <h4 className="font-bold text-xs">Kirim Cepat</h4>
                  <p className="text-[11px] text-white/70 mt-0.5">Sampai dalam kondisi tetap renyah dan segar.</p>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
