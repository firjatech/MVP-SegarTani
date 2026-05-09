'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, ShoppingBag, Clock, CheckCircle2, Truck, AlertCircle,
  Package, MapPin, Phone, User, Tag, Loader2, Receipt
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price_at_purchase: number;
  image_url: string;
}

interface Order {
  id: number;
  created_at: string;
  total_price: number;
  status: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  voucher_code: string | null;
  discount_amount: number;
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
  switch (status?.toLowerCase()) {
    case 'pending':
      return {
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        iconColor: 'text-yellow-600',
        icon: Clock,
        label: 'Menunggu Konfirmasi',
        description: 'Pesanan Anda sedang menunggu konfirmasi dari penjual.'
      };
    case 'processing':
      return {
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        iconColor: 'text-blue-600',
        icon: Package,
        label: 'Sedang Diproses',
        description: 'Pesanan Anda sedang disiapkan oleh penjual.'
      };
    case 'shipped':
      return {
        color: 'text-purple-600 bg-purple-50 border-purple-200',
        iconColor: 'text-purple-600',
        icon: Truck,
        label: 'Dalam Pengiriman',
        description: 'Pesanan Anda sedang dalam perjalanan menuju alamat Anda.'
      };
    case 'completed':
      return {
        color: 'text-[#00AA13] bg-[#00AA13]/10 border-[#00AA13]/30',
        iconColor: 'text-[#00AA13]',
        icon: CheckCircle2,
        label: 'Selesai',
        description: 'Pesanan telah selesai. Terima kasih telah berbelanja!'
      };
    case 'cancelled':
      return {
        color: 'text-red-600 bg-red-50 border-red-200',
        iconColor: 'text-red-600',
        icon: AlertCircle,
        label: 'Dibatalkan',
        description: 'Pesanan ini telah dibatalkan.'
      };
    default:
      return {
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        iconColor: 'text-gray-600',
        icon: Package,
        label: status,
        description: ''
      };
  }
};

const steps = [
  { key: 'pending', label: 'Dikonfirmasi' },
  { key: 'processing', label: 'Diproses' },
  { key: 'shipped', label: 'Dikirim' },
  { key: 'completed', label: 'Selesai' },
];

const getStepIndex = (status: string) => {
  const idx = steps.findIndex(s => s.key === status?.toLowerCase());
  return idx === -1 ? 0 : idx;
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items (*)`)
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setOrder(data);
      }
      setLoading(false);
    }

    fetchOrder();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-[#00AA13]" size={48} />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <AlertCircle size={48} className="text-gray-300" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Pesanan Tidak Ditemukan</h2>
        <p className="text-gray-400 mb-8 font-medium">Pesanan ini tidak ada atau bukan milik Anda.</p>
        <Link href="/orders" className="bg-[#00AA13] text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-[#00AA13]/20">
          Kembali ke Daftar Pesanan
        </Link>
      </div>
    );
  }

  const config = getStatusConfig(order.status);
  const StatusIcon = config.icon;
  const activeStep = getStepIndex(order.status);
  const isCancelled = order.status?.toLowerCase() === 'cancelled';

  const date = new Date(order.created_at).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const time = new Date(order.created_at).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit'
  });

  const subtotal = order.order_items.reduce(
    (sum, item) => sum + item.price_at_purchase * item.quantity, 0
  );

  return (
    <div className="bg-gray-50 min-h-screen pt-16 pb-20 font-sans">
      <div className="mx-auto px-6 max-w-6xl">

        {/* Back Button */}
        <Link
          href="/orders"
          className="flex items-center gap-2 text-gray-500 font-bold hover:text-[#00AA13] transition-colors mb-8 group inline-flex"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Kembali ke Pesanan Saya
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="bg-[#00AA13] p-3 rounded-2xl text-white shadow-lg shadow-[#00AA13]/20">
            <Receipt size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Detail Pesanan</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
              #{String(order.id).padStart(6, '0')} · {date}, {time} WIB
            </p>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`mb-8 p-6 rounded-[2rem] border ${config.color} flex items-center gap-5`}>
          <div className="p-3 rounded-2xl bg-white/60">
            <StatusIcon size={28} className={config.iconColor} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Status Pesanan</p>
            <h2 className="text-xl font-black">{config.label}</h2>
            <p className="text-sm font-medium opacity-80 mt-0.5">{config.description}</p>
          </div>
        </div>

        {/* Progress Tracker */}
        {!isCancelled && (
          <div className="bg-white rounded-[2rem] shadow-lg border border-gray-100 p-8 mb-8">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-8">Progress Pesanan</h3>
            <div className="flex items-center justify-between relative">
              {/* Line background */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-gray-100 z-0 mx-8"></div>
              {/* Line progress */}
              <div
                className="absolute top-5 left-0 h-1 bg-[#00AA13] z-0 transition-all duration-700 mx-8"
                style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
              ></div>

              {steps.map((step, idx) => {
                const isCompleted = idx <= activeStep;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-3 z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 transition-all ${isCompleted
                      ? 'bg-[#00AA13] border-[#00AA13] text-white shadow-lg shadow-[#00AA13]/30'
                      : 'bg-white border-gray-200 text-gray-300'
                      }`}>
                      {isCompleted ? <CheckCircle2 size={18} /> : idx + 1}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider text-center ${isCompleted ? 'text-[#00AA13]' : 'text-gray-300'
                      }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Column */}
          <div className="lg:w-2/3 w-full space-y-8">

            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-[2rem] shadow-lg border border-gray-100 p-8"
            >
              <div className="flex items-center gap-3 mb-8">
                <ShoppingBag size={20} className="text-[#00AA13]" />
                <h3 className="text-xl font-black text-gray-900">Produk yang Dipesan</h3>
              </div>

              <div className="space-y-6">
                {order.order_items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-5 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm relative">
                      <Image src={item.image_url} alt={item.product_name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-gray-900 mb-1">{item.product_name}</h4>
                      <p className="text-xs font-bold text-gray-400">{item.quantity} x {formatIDR(item.price_at_purchase)}</p>
                    </div>
                    <p className="text-base font-black text-[#00AA13] flex-shrink-0">
                      {formatIDR(item.quantity * item.price_at_purchase)}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Shipping Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-[2rem] shadow-lg border border-gray-100 p-8"
            >
              <div className="flex items-center gap-3 mb-8">
                <MapPin size={20} className="text-[#00AA13]" />
                <h3 className="text-xl font-black text-gray-900">Alamat Pengiriman</h3>
              </div>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="bg-gray-50 p-2.5 rounded-xl flex-shrink-0">
                    <User size={16} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nama Penerima</p>
                    <p className="text-sm font-bold text-gray-900">{order.full_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-gray-50 p-2.5 rounded-xl flex-shrink-0">
                    <Phone size={16} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nomor Telepon</p>
                    <p className="text-sm font-bold text-gray-900">{order.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-gray-50 p-2.5 rounded-xl flex-shrink-0">
                    <MapPin size={16} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Alamat Lengkap</p>
                    <p className="text-sm font-bold text-gray-900 leading-relaxed">
                      {order.address}, {order.city}, {order.province} {order.postal_code}
                    </p>
                  </div>
                </div>
              </div>

              {/* Google Maps Embed */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Peta Lokasi</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.address}, ${order.city}, ${order.province} ${order.postal_code}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-black text-[#00AA13] hover:underline uppercase tracking-widest flex items-center gap-1"
                  >
                    Buka di Google Maps ↗
                  </a>
                </div>
                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  <iframe
                    width="100%"
                    height="280"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(`${order.address}, ${order.city}, ${order.province} ${order.postal_code}`)}&output=embed&z=15`}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Payment Summary (Sticky Sidebar) */}
          <div className="lg:w-1/3 w-full">
            <div style={{ position: 'sticky', top: '100px', zIndex: 40 }} className="space-y-8">
              <div className="bg-white rounded-[2rem] shadow-lg border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-8">
                  <Tag size={20} className="text-[#00AA13]" />
                  <h3 className="text-xl font-black text-gray-900">Ringkasan Bayar</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-gray-400">Subtotal ({order.order_items.length} item)</span>
                    <span className="font-bold text-gray-900">{formatIDR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-gray-400">Biaya Pengiriman</span>
                    <span className="font-black text-[#00AA13]">GRATIS</span>
                  </div>
                  {order.voucher_code && (
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-gray-400">Voucher <span className="text-[#00AA13]">{order.voucher_code}</span></span>
                      <span className="font-black text-red-500">-{formatIDR(order.discount_amount || 0)}</span>
                    </div>
                  )}
                  <div className="h-px bg-gray-100 my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-base font-black text-gray-900">Total</span>
                    <span className="text-2xl font-black text-[#00AA13]">{formatIDR(order.total_price)}</span>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Metode Pembayaran</p>
                  <p className="text-sm font-black text-gray-900">COD / WhatsApp</p>
                </div>

                <Link
                  href="/orders"
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-black py-4 rounded-2xl transition-colors text-sm"
                >
                  <ArrowLeft size={16} /> Daftar Pesanan Saya
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
