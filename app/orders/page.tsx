'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, ChevronRight, Package, Clock, CheckCircle2, Truck, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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

const getStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return { color: 'text-yellow-600 bg-yellow-50', icon: Clock, label: 'Menunggu Konfirmasi' };
    case 'processing':
      return { color: 'text-blue-600 bg-blue-50', icon: Package, label: 'Sedang Diproses' };
    case 'shipped':
      return { color: 'text-purple-600 bg-purple-50', icon: Truck, label: 'Dalam Pengiriman' };
    case 'completed':
      return { color: 'text-primary bg-primary/10', icon: CheckCircle2, label: 'Selesai' };
    case 'cancelled':
      return { color: 'text-red-600 bg-red-50', icon: AlertCircle, label: 'Dibatalkan' };
    default:
      return { color: 'text-gray-600 bg-gray-50', icon: Package, label: status };
  }
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
      } else {
        setOrders(data || []);
      }
      setLoading(false);
    }

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-16 pb-20 font-sans">
      <div className="container mx-auto px-6 max-w-4xl">
        <header className="mb-12">
          <Link 
            href="/ecommerce"
            className="items-center gap-2 text-gray-500 font-bold hover:text-primary transition-colors mb-6 group inline-flex"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Kembali ke Katalog
          </Link>
          <div className="flex items-center gap-4">
            <div className="bg-primary p-3 rounded-2xl text-white shadow-lg shadow-primary/20">
              <ShoppingBag size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">Pesanan Saya</h1>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">
                DAFTAR TRANSAKSI ANDA
              </p>
            </div>
          </div>
        </header>

        {orders.length === 0 ? (
          <div className="bg-white rounded-5xl p-16 text-center shadow-xl border border-gray-100 flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-8">
              <ShoppingBag size={48} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-4">Belum Ada Pesanan</h2>
            <p className="text-gray-400 max-w-sm mb-12 font-medium leading-relaxed">
              Sepertinya Anda belum pernah berbelanja di sini. Yuk, cari bahan masakan segar untuk dapur Anda!
            </p>
            <Link 
              href="/ecommerce"
              className="bg-primary text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
            >
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => {
              const config = getStatusConfig(order.status);
              const date = new Date(order.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              });

              return (
                <motion.div 
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-4xl shadow-lg border border-gray-100 overflow-hidden group hover:shadow-2xl transition-all duration-500"
                >
                  <div className="p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${config.color}`}>
                          <config.icon size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">STATUS PESANAN</p>
                          <h3 className="text-lg font-black text-gray-900">{config.label}</h3>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TANGGAL TRANSAKSI</p>
                        <p className="text-sm font-bold text-gray-900">{date}</p>
                      </div>
                    </div>

                    <div className="space-y-6 mb-8 bg-gray-50/50 rounded-3xl p-6 border border-gray-50">
                      {order.order_items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shadow-sm shrink-0 border border-gray-100 relative">
                            <Image src={item.image_url} alt={item.product_name} fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 truncate">{item.product_name}</h4>
                            <p className="text-xs font-bold text-gray-400">{item.quantity} x {formatIDR(item.price_at_purchase)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-primary">{formatIDR(item.quantity * item.price_at_purchase)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-100 gap-6">
                      <div className="flex flex-col">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TOTAL PEMBAYARAN</p>
                        <p className="text-3xl font-black text-primary">{formatIDR(order.total_price)}</p>
                      </div>
                      <Link 
                        href={`/orders/${order.id}`}
                        className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-900 font-black px-8 py-4 rounded-2xl transition-colors group"
                      >
                        Lihat Detail <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
