'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Package, Clock, CheckCircle2, Truck, AlertCircle, Search, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface OrderItem {
  product_name: string;
  quantity: number;
  price_at_purchase: number;
  image_url: string;
}

interface Order {
  id: string;
  created_at: string;
  total_price: number;
  status: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  order_items: OrderItem[];
}

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/\s/g, '');
};

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'text-yellow-600 bg-yellow-50' },
  { value: 'processing', label: 'Processing', color: 'text-blue-600 bg-blue-50' },
  { value: 'shipped', label: 'Shipped', color: 'text-purple-600 bg-purple-50' },
  { value: 'completed', label: 'Completed', color: 'text-[#00AA13] bg-[#00AA13]/10' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-red-600 bg-red-50' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function checkAdminAndFetch() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (profile?.is_admin) {
        setIsAdmin(true);
        fetchOrders();
      } else {
        setLoading(false);
      }
    }

    async function fetchOrders() {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (data) setOrders(data);
      setLoading(false);
    }

    checkAdminAndFetch();
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    // Simpan status lama untuk rollback
    const oldStatus = orders.find(o => o.id === orderId)?.status;
    
    // Optimistic update: langsung update state
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    setUpdatingId(orderId);

    // Kirim ke server di background
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      // Rollback jika gagal
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: oldStatus || 'pending' } : o));
      alert('Gagal mengupdate status: ' + error.message);
    }
    setUpdatingId(null);
  };

  const filteredOrders = orders.filter(order =>
    (order.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (String(order.id).toLowerCase()).includes(searchQuery.toLowerCase())
  );

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
        <p className="text-gray-500">Halaman ini hanya untuk Administrator SegarTani.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-16 pb-20 font-sans">
      <div className="container mx-auto px-6 max-w-7xl">
        <header className="mb-12">
          <Link
            href="/ecommerce"
            className="flex items-center gap-2 text-gray-500 font-bold hover:text-[#00AA13] transition-colors mb-6 group inline-flex"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Kembali ke Katalog
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-gray-900 p-3 rounded-2xl text-white shadow-lg shadow-gray-200">
                <ShoppingBag size={28} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900">Dashboard Pesanan</h1>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">
                  TOTAL {orders.length} PESANAN MASUK
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Cari Nama Pelanggan / ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm focus:ring-4 focus:ring-[#00AA13]/5 transition-all text-sm font-bold"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">DETAIL PESANAN</th>
                  <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">PELANGGAN</th>
                  <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">PRODUK</th>
                  <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">TOTAL</th>
                  <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">ATUR STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-10 py-8">
                      <p className="text-xs font-black text-gray-900 mb-1 truncate max-w-[120px]">#{String(order.id).toUpperCase()}</p>
                      <p className="text-[10px] font-bold text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </td>
                    <td className="px-10 py-8">
                      <h4 className="text-sm font-black text-gray-900 mb-1">{order.full_name}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{order.city}</p>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex -space-x-4">
                        {order.order_items.slice(0, 3).map((item, i) => (
                          <div key={i} className="w-12 h-12 rounded-2xl border-4 border-white overflow-hidden shadow-sm bg-white group-hover:scale-110 transition-transform">
                            <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {order.order_items.length > 3 && (
                          <div className="w-12 h-12 rounded-2xl border-4 border-white bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500 shadow-sm">
                            +{order.order_items.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className="text-lg font-black text-[#00AA13]">{formatIDR(Number(order.total_price))}</span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-3">
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className={`appearance-none text-[10px] font-black px-6 py-3 rounded-2xl border-none focus:ring-4 focus:ring-offset-0 transition-all cursor-pointer shadow-sm ${statusOptions.find(s => s.value === order.status)?.color
                            }`}
                        >
                          {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label.toUpperCase()}</option>
                          ))}
                        </select>
                        {updatingId === order.id && <Loader2 size={20} className="animate-spin text-[#00AA13]" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="py-32 text-center bg-white">
              <Package size={64} className="mx-auto text-gray-100 mb-6" />
              <h3 className="text-xl font-black text-gray-900 mb-2">Tidak Ada Data</h3>
              <p className="text-gray-400 font-bold">Maaf, pesanan yang Anda cari tidak ditemukan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
