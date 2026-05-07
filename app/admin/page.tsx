'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, ShoppingBag, Package, ArrowLeft, Loader2, AlertCircle, Users, TrendingUp } from 'lucide-react';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalOrders: 0, totalProducts: 0, totalUsers: 0 });
  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      // Fetch basic stats
      const [ordersRes, productsRes] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalOrders: ordersRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalUsers: 0,
      });

      setLoading(false);
    }

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-[#00AA13]" size={40} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <AlertCircle size={60} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-black text-gray-900 mb-2">Akses Ditolak</h1>
        <p className="text-gray-500 mb-8">Halaman ini hanya untuk Administrator SegarTani.</p>
        <Link
          href="/ecommerce"
          className="bg-[#00AA13] text-white px-8 py-3 rounded-2xl font-black shadow-xl hover:scale-105 transition-transform"
        >
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-16 pb-20 font-sans">
      <div className="container mx-auto px-6 max-w-6xl">
        <header className="mb-12">
          <Link
            href="/ecommerce"
            className="flex items-center gap-2 text-gray-500 font-bold hover:text-[#00AA13] transition-colors mb-6 group inline-flex"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Kembali ke Katalog
          </Link>
          <div className="flex items-center gap-4">
            <div className="bg-gray-900 p-3 rounded-2xl text-white shadow-lg">
              <Shield size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">Admin Panel</h1>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">
                DASHBOARD ADMINISTRATOR SEGARTANI
              </p>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-[#00AA13]/10 p-3 rounded-2xl text-[#00AA13]">
                <ShoppingBag size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TOTAL PESANAN</p>
                <p className="text-3xl font-black text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-[#FF9F1C]/10 p-3 rounded-2xl text-[#FF9F1C]">
                <Package size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TOTAL PRODUK</p>
                <p className="text-3xl font-black text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">STATUS</p>
                <p className="text-lg font-black text-[#00AA13]">Aktif</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-gray-100">
          <h2 className="text-xl font-black text-gray-900 mb-6">Menu Admin</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/admin/orders"
              className="flex items-center gap-4 p-6 bg-gray-50 rounded-2xl hover:bg-[#00AA13]/5 hover:border-[#00AA13]/20 border border-gray-100 transition-all group"
            >
              <div className="bg-white p-3 rounded-xl shadow-sm group-hover:bg-[#00AA13]/10 transition-colors">
                <ShoppingBag size={24} className="text-gray-400 group-hover:text-[#00AA13]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 group-hover:text-[#00AA13] transition-colors">
                  Kelola Pesanan
                </h3>
                <p className="text-xs font-bold text-gray-400">
                  Lihat dan atur status semua pesanan masuk
                </p>
              </div>
            </Link>
            <Link
              href="/ecommerce"
              className="flex items-center gap-4 p-6 bg-gray-50 rounded-2xl hover:bg-[#FF9F1C]/5 hover:border-[#FF9F1C]/20 border border-gray-100 transition-all group"
            >
              <div className="bg-white p-3 rounded-xl shadow-sm group-hover:bg-[#FF9F1C]/10 transition-colors">
                <Package size={24} className="text-gray-400 group-hover:text-[#FF9F1C]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 group-hover:text-[#FF9F1C] transition-colors">
                  Lihat Katalog
                </h3>
                <p className="text-xs font-bold text-gray-400">
                  Lihat semua produk di katalog toko
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
