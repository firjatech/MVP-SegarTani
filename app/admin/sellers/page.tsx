'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Store, AlertCircle, Loader2, ArrowLeft, Search,
  Shield, Phone, MapPin, Users, Package,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface SellerProfile {
  id: string;
  full_name: string;
  phone: string;
  city: string;
  province: string;
  is_admin: boolean;
  is_seller: boolean;
  updated_at: string;
}

function AdminSellersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    async function checkAdminAndFetch() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', user.id).single();

      if (profile?.is_admin) {
        setIsAdmin(true);
        fetchSellers();
      } else {
        setLoading(false);
      }
    }

    async function fetchSellers() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_seller', true)
        .order('updated_at', { ascending: false });

      if (data) setSellers(data);
      setLoading(false);
    }

    checkAdminAndFetch();
  }, []);

  const filtered = sellers.filter(s =>
    (s.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (s.city?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (s.province?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      params.set('q', searchQuery);
    } else {
      params.delete('q');
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchQuery, pathname, router, searchParams]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-[#00AA13]" size={40} />
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <AlertCircle size={60} className="text-red-500 mb-4" />
      <h1 className="text-2xl font-black text-gray-900 mb-2">Akses Ditolak</h1>
      <p className="text-gray-500">Halaman ini hanya untuk Administrator SegarTani.</p>
      <Link href="/ecommerce"
        className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#00AA13] text-white font-black rounded-2xl hover:bg-[#008810] transition-colors">
        <ArrowLeft size={18} /> Kembali ke Ecommerce
      </Link>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen pt-16 pb-20 font-sans">
      <div className="container mx-auto px-6 max-w-5xl">

        {/* Header */}
        <header className="mb-10">
          <Link href="/ecommerce"
            className="flex items-center gap-2 text-gray-500 font-bold hover:text-[#00AA13] transition-colors mb-6 group w-fit">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Kembali ke Ecommerce
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-[#00AA13] to-emerald-600 p-3 rounded-2xl text-white shadow-lg shadow-[#00AA13]/30">
                <Store size={28} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900">Daftar Akun Penjual</h1>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">
                  {sellers.length} PENJUAL TERDAFTAR
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#00AA13] to-emerald-600 rounded-[1.5rem] shadow-xl shadow-[#00AA13]/20 p-6 flex items-center gap-4 text-white">
            <Shield size={24} className="opacity-80" />
            <div>
              <p className="text-3xl font-black">{sellers.length}</p>
              <p className="text-xs font-bold uppercase tracking-widest opacity-70 mt-0.5">Total Penjual</p>
            </div>
          </div>
          <div className="bg-white rounded-[1.5rem] shadow-xl border border-gray-100 p-6 flex items-center gap-4">
            <Package size={24} className="text-gray-400" />
            <div>
              <p className="text-3xl font-black text-gray-900">{filtered.length}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-0.5">Hasil Pencarian</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Cari nama, kota, atau provinsi..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-white rounded-2xl border border-gray-100 shadow-sm focus:ring-4 focus:ring-[#00AA13]/10 transition-all text-sm font-bold" />
        </div>

        {/* List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="py-24 text-center bg-white rounded-[2rem] shadow-xl border border-gray-100">
                <Users size={64} className="mx-auto text-gray-100 mb-4" />
                <h3 className="text-xl font-black text-gray-900 mb-2">Belum Ada Penjual</h3>
                <p className="text-gray-400 font-bold mb-6">Belum ada penjual yang mendaftar.</p>
                <Link href="/daftar-penjual"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#00AA13] text-white font-black rounded-2xl hover:bg-[#008810] transition-colors text-sm">
                  <Store size={16} /> Undang Penjual
                </Link>
              </motion.div>
            ) : (
              filtered.map((seller, i) => (
                <motion.div key={seller.id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ delay: i * 0.04, duration: 0.25 }}
                  className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-6 flex items-center gap-5">

                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-2xl bg-[#00AA13]/10 flex items-center justify-center font-black text-xl text-[#00AA13] shrink-0 shadow-inner">
                    {seller.full_name ? seller.full_name.charAt(0).toUpperCase() : '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <h3 className="text-base font-black text-gray-900 truncate">
                        {seller.full_name || 'Nama belum diisi'}
                      </h3>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#00AA13]/10 text-[#00AA13]">
                        <Shield size={11} /> Penjual
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-bold text-gray-400">
                      {seller.phone && (
                        <span className="flex items-center gap-1.5"><Phone size={11} /> {seller.phone}</span>
                      )}
                      {seller.city && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={11} /> {seller.city}{seller.province && `, ${seller.province}`}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function AdminSellersPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-[#00AA13]" size={40} />
      </div>
    }>
      <AdminSellersContent />
    </React.Suspense>
  );
}
