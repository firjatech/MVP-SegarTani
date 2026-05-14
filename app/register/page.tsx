'use client';

import React, { useState, useId } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Sign Up User (tanpa verifikasi email)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.session) {
        // Langsung login, redirect ke halaman utama
        setSuccess(true);
        setTimeout(() => {
          router.push('/ecommerce');
        }, 1500);
      } else if (data.user) {
        // Fallback jika session belum tersedia
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mendaftar. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8">
      <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[700px]">
        {/* Left Side: Form */}
        <div className="flex-1 p-8 md:p-16 flex flex-col justify-center relative bg-white">
          <div className="mb-12 flex flex-col items-center lg:items-start w-full">
             <div className="mb-4 flex items-center gap-2">
                <Image src="/images/logo.jpg" alt="Logo" width={50} height={50} priority className="h-10 w-auto" />
                <span className="text-2xl font-black text-primary">Segar<span className="text-secondary">Tani</span></span>
             </div>
             <div className="w-full text-left">
                <Link href="/login" className="flex items-center gap-2 text-sm font-bold text-primary hover:opacity-80 transition-opacity">
                  <ArrowRight size={16} className="rotate-180" /> Kembali ke Login
                </Link>
             </div>
          </div>

          <div className="max-w-md w-full mx-auto text-center">
            <h1 className="text-4xl font-black text-gray-900 mb-2">Buat Akun Baru</h1>
            <p className="text-gray-400 font-medium mb-8 text-sm">Bergabunglah dengan SegarTani untuk belanja lebih mudah.</p>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold text-left"
              >
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-700 text-sm font-bold text-left"
              >
                <CheckCircle2 size={18} className="shrink-0" />
                <span>Pendaftaran berhasil! Mengalihkan ke halaman utama...</span>
              </motion.div>
            )}

            <form onSubmit={handleRegister} className="space-y-6 text-left">
              <div>
                <label htmlFor={nameId} className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">NAMA LENGKAP</label>
                <div className="relative">
                  <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input 
                    id={nameId}
                    type="text" 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap kamu" 
                    className="w-full bg-white border border-gray-100 rounded-2xl px-14 py-5 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 text-gray-700 font-medium transition-all" 
                  />
                </div>
              </div>

              <div>
                <label htmlFor={emailId} className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">EMAIL</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input 
                    id={emailId}
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email kamu" 
                    className="w-full bg-white border border-gray-100 rounded-2xl px-14 py-5 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 text-gray-700 font-medium transition-all" 
                  />
                </div>
              </div>

              <div>
                <label htmlFor={passwordId} className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">PASSWORD</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input 
                    id={passwordId}
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter" 
                    minLength={6}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-14 py-5 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 text-gray-700 font-medium transition-all" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || success}
                className="w-full bg-primary hover:bg-[#008810] disabled:bg-gray-300 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 size={22} className="animate-spin" /> Sedang Mendaftar...
                  </>
                ) : (
                  <>
                    Daftar Sekarang <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-12 text-center text-sm font-medium text-gray-400">
              Sudah punya akun? <Link href="/login" className="text-primary font-black hover:underline">Masuk di Sini</Link>
            </p>
          </div>
        </div>

        {/* Right Side: Welcome */}
        <div className="hidden lg:flex flex-1 bg-primary p-16 flex-col justify-start pt-32 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full"></div>
          
          <div className="relative z-10 max-w-lg">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-black text-white mb-4 leading-tight"
            >
              Mari Bergabung!
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg font-bold text-white/90 mb-8 tracking-tight"
            >
              #SegarTaniKeluargaAnda
            </motion.p>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base text-white/80 leading-relaxed font-medium"
            >
              Dapatkan akses ke sayuran dan buah organik terbaik langsung dari petani. Sehat untuk Anda, sehat untuk keluarga.
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
}
