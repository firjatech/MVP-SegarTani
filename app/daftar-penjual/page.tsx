'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Mail, Lock, User, ArrowRight, Loader2, AlertCircle,
  CheckCircle2, Store, Phone, MapPin, Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function SellerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        setStep(2); // Langsung ke info toko jika sudah login
        setEmail(session.user.email || '');
      }
    });
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }

    setLoading(true);
    setError(null);

    try {
      if (session?.user) {
        // User sudah login, cukup update profile dan tambah store_profile
        const { error: updateError } = await supabase.from('profiles').update({
          is_seller: true,
          phone: phone,
          city: city,
          updated_at: new Date().toISOString()
        }).eq('id', session.user.id);
        
        if (updateError) throw updateError;

        const { error: storeError } = await supabase.from('store_profiles').upsert({
          id: session.user.id,
          store_name: storeName,
          updated_at: new Date().toISOString()
        });
        
        if (storeError) throw storeError;

        setSuccess(true);
        setTimeout(() => router.push('/admin/store-profile'), 2000);
      } else {
        // 1. Sign Up user baru (tanpa verifikasi email)
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

        if (data.session) {
          // Langsung login, redirect ke profil toko
          setSuccess(true);
          setTimeout(() => router.push('/admin/store-profile'), 1500);
        } else if (data.user) {
          // Fallback
          setSuccess(true);
          setTimeout(() => router.push('/login'), 1500);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mendaftar. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-white border border-gray-100 rounded-2xl px-14 py-5 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 text-gray-700 font-medium transition-all';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8">
      <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[700px]">

        {/* Left: Form */}
        <div className="flex-1 p-8 md:p-16 flex flex-col justify-center relative bg-white">
          <div className="mb-10 flex flex-col items-center lg:items-start w-full">
            <div className="mb-4 flex items-center gap-2">
              <Image src="/images/logo.jpg" alt="Logo" width={50} height={50} priority className="h-10 w-auto" />
              <span className="text-2xl font-black text-primary">Segar<span className="text-secondary">Tani</span></span>
            </div>
            <div className="w-full text-left">
              <Link href="/login" className="flex items-center gap-2 text-sm font-bold text-primary hover:opacity-80 transition-opacity">
                <ArrowRight size={16} className="rotate-180" /> Sudah punya akun? Login
              </Link>
            </div>
          </div>

          <div className="max-w-md w-full mx-auto">
            {/* Step indicator (hanya tampil jika belum login) */}
            {!session && (
              <div className="flex items-center gap-3 mb-8">
                {[1, 2].map((s) => (
                  <React.Fragment key={s}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all
                      ${step >= s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {s}
                    </div>
                    {s < 2 && <div className={`flex-1 h-1 rounded-full transition-all ${step > s ? 'bg-primary' : 'bg-gray-100'}`} />}
                  </React.Fragment>
                ))}
              </div>
            )}

            <h1 className="text-3xl font-black text-gray-900 mb-1">
              {session ? 'Lengkapi Profil Toko' : (step === 1 ? 'Daftar Sebagai Penjual' : 'Info Toko Kamu')}
            </h1>
            <p className="text-gray-400 font-medium mb-8 text-sm">
              {session ? 'Anda sudah login. Lengkapi info toko untuk mulai berjualan.' : (step === 1 ? 'Isi data akun kamu untuk mulai berjualan.' : 'Lengkapi informasi toko kamu.')}
            </p>

            {/* Error & Success */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
                  <AlertCircle size={18} className="shrink-0" /><span>{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-700 text-sm font-bold">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <span>Akun penjual berhasil dibuat! Mengalihkan ke halaman toko...</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleRegister} className="space-y-5 text-left">
              <AnimatePresence mode="wait">

                {/* Step 1: Akun */}
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">NAMA LENGKAP</label>
                      <div className="relative">
                        <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                          placeholder="Nama lengkap kamu" className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">EMAIL</label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                          placeholder="email@kamu.com" className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">PASSWORD</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                          placeholder="Minimal 6 karakter" minLength={6} className={inputCls} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Info Toko */}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">NAMA TOKO *</label>
                      <div className="relative">
                        <Store size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input type="text" required value={storeName} onChange={e => setStoreName(e.target.value)}
                          placeholder="Contoh: Tani Segar Store" className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">NOMOR TELEPON</label>
                      <div className="relative">
                        <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                          placeholder="08xxxxxxxxxx" className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">KOTA / KABUPATEN</label>
                      <div className="relative">
                        <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input type="text" value={city} onChange={e => setCity(e.target.value)}
                          placeholder="Bandung" className={inputCls} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 pt-2">
                {step === 2 && !session && (
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-none px-6 py-5 rounded-2xl border border-gray-200 text-gray-500 font-black hover:bg-gray-50 transition-all">
                    Kembali
                  </button>
                )}
                <button type="submit" disabled={loading || success}
                  className="flex-1 bg-primary hover:bg-[#008810] disabled:bg-gray-300 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group text-base">
                  {loading ? (
                    <><Loader2 size={22} className="animate-spin" /> Memproses...</>
                  ) : session ? (
                    <>Buka Profil Penjual <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                  ) : step === 1 ? (
                    <>Lanjut <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                  ) : (
                    <>Daftar Sebagai Penjual <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>
              </div>
            </form>

            <p className="mt-8 text-center text-sm font-medium text-gray-400">
              Mau belanja aja?{' '}
              <Link href="/register" className="text-primary font-black hover:underline">Daftar Akun Pembeli</Link>
            </p>
          </div>
        </div>

        {/* Right: Visual */}
        <div className="hidden lg:flex flex-1 bg-linear-to-br from-primary to-emerald-700 p-16 flex-col justify-center relative overflow-hidden">
          <div className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full" />

          <div className="relative z-10 max-w-lg">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8">
              <Store size={32} className="text-white" />
            </div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-black text-white mb-4 leading-tight">
              Mulai Jualan di SegarTani!
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-lg font-bold text-white/90 mb-8">
              Platform terpercaya untuk penjual produk segar Indonesia
            </motion.p>

            <div className="space-y-4">
              {[
                { icon: <Building2 size={18} />, text: 'Buka toko online dalam hitungan menit' },
                { icon: <CheckCircle2 size={18} />, text: 'Kelola produk & pesanan dengan mudah' },
                { icon: <Store size={18} />, text: 'Jangkau pelanggan lebih luas' },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3 text-white/90 font-bold text-sm">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  {item.text}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
