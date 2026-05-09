'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { loginFormSchema } from '@/lib/validations';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validasi dengan Zod safeParse
    const result = loginFormSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as string;
        if (!errors[field]) errors[field] = err.message;
      });
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        router.push('/ecommerce');
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Gagal masuk. Silakan periksa kembali email dan password Anda.');
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
                <span className="text-2xl font-black text-[#00AA13]">Segar<span className="text-[#FF9F1C]">Tani</span></span>
             </div>
             <div className="w-full text-left">
                <Link href="/" className="flex items-center gap-2 text-sm font-bold text-[#00AA13] hover:opacity-80 transition-opacity">
                  <ArrowRight size={16} className="rotate-180" /> Kembali ke Beranda
                </Link>
             </div>
          </div>

          <div className="max-w-md w-full mx-auto text-center">
            <h1 className="text-4xl font-black text-gray-900 mb-2">Masuk ke Akun</h1>
            <p className="text-gray-400 font-medium mb-8 text-sm">Cari sayuran segar pilihan Anda di sini.</p>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-6 text-left">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">EMAIL</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(prev => ({...prev, email: ''})); }}
                    placeholder="Masukkan email kamu" 
                    className={`w-full bg-white border rounded-2xl px-14 py-5 focus:outline-none focus:border-[#00AA13] focus:ring-4 focus:ring-[#00AA13]/5 text-gray-700 font-medium transition-all ${fieldErrors.email ? 'border-red-400 bg-red-50/30' : 'border-gray-100'}`}
                  />
                </div>
                {fieldErrors.email && <p className="text-xs font-bold text-red-500 mt-2 px-2">{fieldErrors.email}</p>}
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PASSWORD</label>
                  <Link href="#" className="text-[10px] font-black text-[#00AA13] hover:underline uppercase tracking-widest">Lupa Password?</Link>
                </div>
                <div className="relative">
                  <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(prev => ({...prev, password: ''})); }}
                    placeholder="........." 
                    className={`w-full bg-white border rounded-2xl px-14 py-5 focus:outline-none focus:border-[#00AA13] focus:ring-4 focus:ring-[#00AA13]/5 text-gray-700 font-medium transition-all ${fieldErrors.password ? 'border-red-400 bg-red-50/30' : 'border-gray-100'}`}
                  />
                </div>
                {fieldErrors.password && <p className="text-xs font-bold text-red-500 mt-2 px-2">{fieldErrors.password}</p>}
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#00AA13] hover:bg-[#008810] disabled:bg-gray-300 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-[#00AA13]/20 flex items-center justify-center gap-2 group text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 size={22} className="animate-spin" /> Sedang Masuk...
                  </>
                ) : (
                  <>
                    Masuk Sekarang <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 flex items-center gap-4">
              <div className="flex-grow h-px bg-gray-100"></div>
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">ATAU</span>
              <div className="flex-grow h-px bg-gray-100"></div>
            </div>

            <button className="mt-10 w-full bg-white border border-gray-100 py-5 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-3 shadow-sm border border-gray-100">
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="h-6 w-6" />
              Masuk dengan Google
            </button>

            <p className="mt-12 text-center text-sm font-medium text-gray-400">
              Belum punya akun? <Link href="/register" className="text-[#00AA13] font-black hover:underline">Daftar Gratis</Link>
            </p>
          </div>
        </div>

        {/* Right Side: Welcome */}
        <div className="hidden lg:flex flex-1 bg-[#00AA13] p-16 flex-col justify-start pt-32 relative overflow-hidden">
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
              Selamat Datang!!
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg font-bold text-white/90 mb-8 tracking-tight"
            >
              #PasarSegarPilihanAnda
            </motion.p>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base text-white/80 leading-relaxed font-medium"
            >
              Kami menghadirkan SegarTani untuk Anda. untuk menyambut kedatangan anda dengan suka cita.
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
}
