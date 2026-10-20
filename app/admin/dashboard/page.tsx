'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard, Package, ShoppingBag, MessageSquare, Star,
  BarChart3, Wallet, Tag, Store, Bell, User, LogOut, Plus,
  TrendingUp, ArrowUpRight, Clock, AlertCircle, CheckCircle2, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SellerDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState('Toko Saya');
  const [logoUrl, setLogoUrl] = useState('');
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Verify seller profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin, is_seller')
          .eq('id', user.id)
          .single();

        if (!profile?.is_admin && !profile?.is_seller) {
          router.push('/daftar-penjual');
          return;
        }

        // Fetch store profile
        const { data: storeData } = await supabase
          .from('store_profiles')
          .select('store_name, logo_url')
          .eq('id', user.id)
          .maybeSingle();

        if (storeData) {
          if (storeData.store_name) setStoreName(storeData.store_name);
          if (storeData.logo_url) setLogoUrl(storeData.logo_url);
        }

        // Fetch total products
        const { count: productCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        // Fetch orders
        const { data: ordersData, count: orderCount } = await supabase
          .from('orders')
          .select('id, total_amount, status', { count: 'exact' });

        let salesSum = 0;
        let pendingCount = 0;
        if (ordersData) {
          salesSum = ordersData.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
          pendingCount = ordersData.filter(o => o.status === 'pending' || o.status === 'paid').length;
        }

        setStats({
          totalSales: salesSum,
          totalOrders: orderCount || 0,
          totalProducts: productCount || 0,
          pendingOrders: pendingCount,
        });
      } catch (err) {
        console.error('Error loading seller dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const sidebarNav = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Produk', href: '/admin/products', icon: Package },
    { name: 'Pesanan', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Ulasan', href: '#', icon: Star, badge: 'Segera' },
    { name: 'Laporan', href: '#', icon: BarChart3, badge: 'Segera' },
    { name: 'Saldo', href: '#', icon: Wallet, badge: 'Segera' },
    { name: 'Promo', href: '#', icon: Tag, badge: 'Segera' },
    { name: 'Profil Toko', href: '/admin/store-profile', icon: Store },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold text-sm">Memuat Dashboard Penjual...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <Image src={logoUrl} alt="Logo Toko" width={40} height={40} className="w-10 h-10 rounded-xl object-cover border border-gray-100 shadow-sm" />
            ) : (
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black">
                <Store size={22} />
              </div>
            )}
            <div>
              <h1 className="text-lg font-black text-gray-900 leading-tight">{storeName}</h1>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                ● Toko Aktif (Mode Penjual)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/ecommerce"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all border border-emerald-200"
              title="Beralih ke halaman katalog belanja"
            >
              <ShoppingBag size={15} />
              <span className="hidden sm:inline">Katalog Belanja</span>
            </Link>
            <button type="button" className="relative p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <Link href="/admin/store-profile" className="flex items-center gap-2 p-2 text-gray-700 hover:bg-gray-100 rounded-xl text-sm font-bold transition-all">
              <User size={20} className="text-gray-500" />
              <span className="hidden sm:inline">Profil Toko</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-all cursor-pointer"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto">

        {/* Dashboard Main Content */}
        <main className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto w-full">
          {/* Ringkasan Hari Ini */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <span>📊</span> Ringkasan Penjualan
              </h2>
              <span className="text-xs font-bold text-gray-400">Update Terakhir: Hari ini</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Stat 1: Total Penjualan */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Penjualan</p>
                  <p className="text-2xl font-black text-gray-900">
                    Rp {stats.totalSales.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black">
                  <TrendingUp size={24} />
                </div>
              </div>

              {/* Stat 2: Total Order */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Pesanan</p>
                  <p className="text-2xl font-black text-gray-900">{stats.totalOrders} <span className="text-sm text-gray-400 font-normal">Order</span></p>
                </div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black">
                  <ShoppingBag size={24} />
                </div>
              </div>

              {/* Stat 3: Total Produk */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Produk</p>
                  <p className="text-2xl font-black text-gray-900">{stats.totalProducts} <span className="text-sm text-gray-400 font-normal">Item</span></p>
                </div>
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-black">
                  <Package size={24} />
                </div>
              </div>
            </div>
          </section>

          {/* Grid Layout: Grafik & Perlu Ditindak */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Grafik Penjualan 7 Hari */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <span>📈</span> Grafik Penjualan 7 Hari Terakhir
                </h3>
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">+0% minggu ini</span>
              </div>

              {/* Graphic Chart Placeholder / Visual Bar */}
              <div className="h-48 bg-gradient-to-t from-emerald-50/50 to-transparent rounded-xl border border-dashed border-gray-200 flex items-end justify-between p-6 gap-2">
                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day, idx) => {
                  const heights = ['h-16', 'h-24', 'h-12', 'h-32', 'h-20', 'h-40', 'h-28'];
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                      <div className={`w-full bg-primary/80 hover:bg-primary rounded-t-lg transition-all ${heights[idx]}`}></div>
                      <span className="text-xs font-bold text-gray-400">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Perlu Ditindak */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <span>🔔</span> Perlu Ditindak
              </h3>

              <div className="space-y-3">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock size={20} className="text-amber-600" />
                    <div>
                      <p className="text-sm font-bold text-amber-900">{stats.pendingOrders} Pesanan Baru</p>
                      <p className="text-xs text-amber-700">Perlu diproses segera</p>
                    </div>
                  </div>
                  <Link href="/admin/orders" className="text-xs font-black text-amber-700 hover:underline flex items-center">
                    Cek <ChevronRight size={14} />
                  </Link>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare size={20} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-bold text-gray-700">0 Chat Belum Dibalas</p>
                      <p className="text-xs text-gray-400">Respon pembeli cepat</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-400">0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions / Aksi Cepat */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <span>⚡</span> Aksi Cepat
            </h3>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/admin/products"
                className="bg-primary hover:bg-[#008810] text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-primary/20 flex items-center gap-2"
              >
                <Plus size={18} /> Tambah Produk Baru
              </Link>
              <Link
                href="/admin/orders"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
              >
                <ShoppingBag size={18} /> Lihat Pesanan Masuk
              </Link>
              <Link
                href="/admin/store-profile"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
              >
                <Store size={18} /> Pengaturan Profil Toko
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
