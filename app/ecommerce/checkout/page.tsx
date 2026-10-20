'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  MapPin,
  ShoppingBag,
  Loader2,
  CheckCircle2,
  Banknote,
  Building2,
  QrCode,
  MessageCircle,
  Truck,
  ShieldCheck,
  Edit3,
  Copy,
  Check,
  Tag,
  Lock,
  Sparkles,
  X,
  FileText
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/\s/g, '');
};

const DEFAULT_ADDRESS = {
  full_name: 'Pelanggan SegarTani',
  phone: '081234567890',
  address: 'Jl. Raya Oro-Oro Ombo No. 12',
  city: 'Batu',
  province: 'Jawa Timur',
  postal_code: '65311',
};

type PaymentMethod = 'cod' | 'transfer' | 'qris' | 'whatsapp';

interface PaymentOption {
  id: PaymentMethod;
  title: string;
  subtitle: string;
  badge?: string;
  icon: typeof Banknote;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'cod',
    title: 'COD (Bayar di Tempat)',
    subtitle: 'Bayar tunai kepada kurir saat pesanan Anda tiba di rumah.',
    badge: 'Paling Populer',
    icon: Banknote,
  },
  {
    id: 'transfer',
    title: 'Transfer Bank (Virtual Account)',
    subtitle: 'Transfer via BCA atau Mandiri dengan konfirmasi instan.',
    badge: 'Bebas Biaya',
    icon: Building2,
  },
  {
    id: 'qris',
    title: 'QRIS (E-Wallet & Mobile Banking)',
    subtitle: 'Scan QR instan dengan GoPay, OVO, DANA, ShopeePay & m-Banking.',
    badge: 'Instan',
    icon: QrCode,
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp Admin',
    subtitle: 'Konfirmasi dan bantuan pembayaran langsung lewat chat tim admin.',
    icon: MessageCircle,
  },
];

export default function CheckoutPage() {
  const {
    cart, totalPrice, clearCart,
    appliedVoucher, applyVoucher, removeVoucher, discountAmount,
  } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  const [shippingAddress, setShippingAddress] = useState(DEFAULT_ADDRESS);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState(DEFAULT_ADDRESS);

  const [orderNotes, setOrderNotes] = useState('');

  const [voucherInput, setVoucherInput] = useState('');
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState('');

  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  const selectedItems = cart.filter(item => item.selected);
  const finalPrice = Math.max(0, totalPrice - discountAmount);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .maybeSingle();

      const initialAddr = {
        ...DEFAULT_ADDRESS,
        full_name: data?.full_name || user.email?.split('@')[0] || DEFAULT_ADDRESS.full_name,
        phone: data?.phone || DEFAULT_ADDRESS.phone,
      };

      setShippingAddress(initialAddr);
      setTempAddress(initialAddr);
      setFetchingProfile(false);
    }

    loadProfile();
  }, [router]);

  const handleCopy = (text: string, bank: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(bank);
    setTimeout(() => setCopiedBank(null), 2000);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setShippingAddress(tempAddress);
    setIsEditingAddress(false);
  };

  const handleApplyVoucher = async () => {
    if (!voucherInput.trim()) return;
    setIsApplyingVoucher(true);
    setVoucherError('');

    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', voucherInput.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setVoucherError('Kode voucher tidak valid atau sudah tidak aktif.');
        return;
      }

      if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
        setVoucherError('Kode voucher sudah kedaluwarsa.');
        return;
      }

      if (totalPrice < data.min_purchase) {
        setVoucherError(`Minimal belanja ${formatIDR(data.min_purchase)} untuk menggunakan voucher ini.`);
        return;
      }

      applyVoucher(data);
      setVoucherInput('');
    } catch {
      setVoucherError('Terjadi kesalahan saat mengecek voucher.');
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesi Anda berakhir. Silakan login kembali.');

      for (const item of selectedItems) {
        const { data: product, error: stockCheckError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.id)
          .single();

        if (stockCheckError) throw new Error(`Gagal mengecek stok untuk ${item.name}`);
        if (product && product.stock < item.quantity) {
          throw new Error(`Stok produk ${item.name} tidak mencukupi (Tersisa: ${product.stock})`);
        }
      }

      const fullAddressNote = orderNotes.trim()
        ? `${shippingAddress.address} (Catatan: ${orderNotes.trim()})`
        : shippingAddress.address;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          full_name: shippingAddress.full_name,
          phone: shippingAddress.phone,
          address: fullAddressNote,
          city: shippingAddress.city,
          province: shippingAddress.province,
          postal_code: shippingAddress.postal_code,
          total_price: finalPrice,
          status: 'pending',
          voucher_code: appliedVoucher?.code || null,
          discount_amount: discountAmount,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = selectedItems.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price_at_purchase: item.price,
        image_url: item.image,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      for (const item of selectedItems) {
        const { error: decreaseError } = await supabase.rpc('decrease_stock', {
          p_id: item.id,
          p_qty: item.quantity,
        });
        if (decreaseError) console.error(`Gagal mengurangi stok ${item.name}:`, decreaseError);
      }

      setCreatedOrderId(orderData.id);
      clearCart();
      setOrderSuccess(true);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('Checkout Error Full:', { message: errMsg, raw: err });
      alert(`Gagal memproses pesanan:\n${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedItems.length === 0 && !fetchingProfile && !orderSuccess) {
      router.push('/ecommerce');
    }
  }, [selectedItems.length, fetchingProfile, orderSuccess, router]);

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 max-w-lg w-full text-center"
        >
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} strokeWidth={2.5} />
          </div>

          <span className="inline-block px-3 py-1 bg-green-50 text-primary text-xs font-black uppercase tracking-wider rounded-full mb-3">
            Pesanan Berhasil
          </span>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Terima Kasih!</h1>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Pesanan Anda telah kami terima dengan nomor{' '}
            <span className="font-bold text-gray-900">#{createdOrderId || '10293'}</span> dan sedang dipersiapkan oleh tim SegarTani.
          </p>

          <div className="bg-gray-50 rounded-2xl p-4 text-left mb-6 border border-gray-100 text-xs space-y-2">
            <div className="flex justify-between text-gray-500">
              <span>Metode Pembayaran:</span>
              <span className="font-bold text-gray-900 uppercase">{paymentMethod}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Total Dibayar:</span>
              <span className="font-bold text-primary text-sm">{formatIDR(finalPrice)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Alamat Pengiriman:</span>
              <span className="font-medium text-gray-900 text-right truncate max-w-[200px]">{shippingAddress.address}, {shippingAddress.city}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={createdOrderId ? `/orders/${createdOrderId}` : '/orders'}
              className="flex-1 bg-primary text-white py-3.5 px-6 rounded-xl font-black text-sm hover:bg-[#008810] transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <FileText size={16} />
              Lihat Detail Pesanan
            </Link>
            <Link
              href="/ecommerce"
              className="flex-1 bg-gray-100 text-gray-700 py-3.5 px-6 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
            >
              Lanjut Belanja
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (fetchingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-sm font-bold text-gray-500">Menyiapkan data checkout...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-28 lg:pb-16 font-sans text-gray-900">
      {/* Container Utama (Header ganda / duplikat 🌱 SegarTani sudah dihapus) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        
        {/* Tombol Kembali & Judul */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-500 font-bold hover:text-primary transition-colors mb-3 group cursor-pointer text-sm"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Kembali
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Checkout Pesanan</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Selesaikan rincian pengiriman dan pilih metode pembayaran</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* KOLOM KIRI: Customer Flow (Step 1: Address, Step 2: Payment, Step 3: Order Notes) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* STEP 1: ALAMAT PENGIRIMAN */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-gray-200 transition-all hover:shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                    1
                  </div>
                  <div>
                    <h2 className="font-black text-base sm:text-lg text-gray-900">Alamat Pengiriman</h2>
                    <p className="text-xs text-gray-400">Pesanan akan dikirim ke lokasi ini</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTempAddress(shippingAddress);
                    setIsEditingAddress(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:text-[#008810] px-3 py-1.5 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  <Edit3 size={14} />
                  Ubah Alamat
                </button>
              </div>

              {/* Address Preview Card */}
              <div className="bg-gray-50/80 rounded-2xl p-4 sm:p-5 border border-gray-100 flex items-start gap-4">
                <div className="p-2.5 bg-white text-primary rounded-xl shadow-xs shrink-0 border border-gray-100">
                  <MapPin size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Alamat Default
                    </span>
                    <span className="font-black text-gray-900 text-sm">{shippingAddress.full_name}</span>
                    <span className="text-gray-400 text-xs font-medium">({shippingAddress.phone})</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed mt-1">
                    {shippingAddress.address}, {shippingAddress.city}, {shippingAddress.province} {shippingAddress.postal_code}
                  </p>
                </div>
              </div>

              {/* Shipping Method Banner */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <Truck size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">SegarTani Express (1 Hari Tiba)</p>
                    <p className="text-gray-400 text-[11px]">Dikemas khusus dengan ice gel higienis</p>
                  </div>
                </div>
                <span className="font-black text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-md">
                  GRATIS
                </span>
              </div>
            </div>

            {/* STEP 2: METODE PEMBAYARAN */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-gray-200 transition-all hover:shadow-sm">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-5">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                  2
                </div>
                <div>
                  <h2 className="font-black text-base sm:text-lg text-gray-900">Metode Pembayaran</h2>
                  <p className="text-xs text-gray-400">Pilih salah satu opsi pembayaran terpercaya</p>
                </div>
              </div>

              <div className="space-y-3">
                {PAYMENT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const selected = paymentMethod === option.id;

                  return (
                    <label
                      key={option.id}
                      className={`relative flex items-start gap-4 p-4 sm:p-4.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        selected
                          ? 'border-primary bg-primary/5 shadow-xs'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={option.id}
                        checked={selected}
                        onChange={() => setPaymentMethod(option.id)}
                        className="sr-only"
                      />

                      <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                        selected ? 'bg-primary text-white shadow-xs' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Icon size={20} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black text-sm text-gray-900">{option.title}</p>
                          {option.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {option.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{option.subtitle}</p>
                      </div>

                      <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        selected ? 'border-primary' : 'border-gray-300'
                      }`}>
                        {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Dynamic Payment Details */}
              <AnimatePresence mode="wait">
                {paymentMethod === 'transfer' && (
                  <motion.div
                    key="transfer"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-5 p-4 sm:p-5 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-3"
                  >
                    <div className="flex items-center gap-2 text-gray-900 font-bold">
                      <Building2 size={16} className="text-primary" />
                      <span>Nomor Rekening Resmi SegarTani Batu:</span>
                    </div>

                    {/* BCA */}
                    <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between">
                      <div>
                        <p className="font-black text-gray-900">BCA: <span className="font-mono text-sm tracking-wider">1234567890</span></p>
                        <p className="text-[11px] text-gray-400">a.n. SegarTani Batu Sejahtera</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('1234567890', 'BCA')}
                        className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        {copiedBank === 'BCA' ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                        {copiedBank === 'BCA' ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>

                    {/* Mandiri */}
                    <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between">
                      <div>
                        <p className="font-black text-gray-900">Mandiri: <span className="font-mono text-sm tracking-wider">1400012345678</span></p>
                        <p className="text-[11px] text-gray-400">a.n. SegarTani Batu Sejahtera</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('1400012345678', 'Mandiri')}
                        className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        {copiedBank === 'Mandiri' ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                        {copiedBank === 'Mandiri' ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>

                    <p className="text-[11px] text-gray-400 italic">
                      * Silakan transfer sesuai total tagihan. Konfirmasi akan diverifikasi otomatis setelah Anda menyelesaikan pesanan.
                    </p>
                  </motion.div>
                )}

                {paymentMethod === 'qris' && (
                  <motion.div
                    key="qris"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-5 p-4 sm:p-5 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-2.5"
                  >
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                      <QrCode size={16} className="text-primary" />
                      <span>Instruksi Pembayaran QRIS Nasional:</span>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      Setelah menekan tombol <strong className="text-gray-900">Bayar Sekarang</strong>, kode QRIS resmi akan ditampilkan di layar dan dikirimkan untuk Anda scan melalui e-wallet (GoPay, OVO, DANA, LinkAja, ShopeePay) maupun seluruh aplikasi mobile banking.
                    </p>
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-700 font-bold">
                      <CheckCircle2 size={14} /> Terverifikasi instan tanpa perlu unggah bukti struk manual.
                    </div>
                  </motion.div>
                )}

                {paymentMethod === 'whatsapp' && (
                  <motion.div
                    key="whatsapp"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-5 p-4 sm:p-5 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-2"
                  >
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                      <MessageCircle size={16} className="text-emerald-600" />
                      <span>Layanan Pembayaran Lewat CS:</span>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      Tim customer care SegarTani akan segera menyapa nomor WhatsApp Anda ({shippingAddress.phone}) untuk mengirimkan invoice dan panduan pelunasan dengan respon kilat.
                    </p>
                  </motion.div>
                )}

                {paymentMethod === 'cod' && (
                  <motion.div
                    key="cod"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-5 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1"
                  >
                    <p className="font-bold flex items-center gap-1.5">
                      <Banknote size={15} /> Bayar Tunai Saat Sampai
                    </p>
                    <p className="text-amber-800 leading-relaxed">
                      Siapkan uang pas sebesar <strong className="text-amber-950">{formatIDR(finalPrice)}</strong> untuk diserahkan langsung ke kurir saat paket diterima.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* STEP 3: CATATAN PENGIRIMAN (OPSIONAL) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-gray-200">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-black text-sm">
                  3
                </div>
                <div>
                  <h2 className="font-black text-base text-gray-900">Catatan untuk Kurir & Penjual <span className="text-gray-400 font-normal text-xs">(Opsional)</span></h2>
                  <p className="text-xs text-gray-400">Instruksi pengantaran atau preferensi produk</p>
                </div>
              </div>

              <input
                type="text"
                placeholder="Misal: Titip di pos satpam / Rumah pagar abu-abu / Pilih buah yang matang..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                maxLength={150}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
              />
            </div>
          </div>

          {/* KOLOM KANAN: Sticky Order Summary & Payment Terminal */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 space-y-5">
              
              {/* Order Summary Box */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag size={20} className="text-primary" />
                    <h3 className="font-black text-lg text-gray-900">Ringkasan Pesanan</h3>
                  </div>
                  <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                    {selectedItems.reduce((acc, i) => acc + i.quantity, 0)} Produk
                  </span>
                </div>

                {/* Items preview list */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-1 no-scrollbar">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex gap-3 items-center">
                      <div className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100 relative">
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">{item.name}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.quantity} x {formatIDR(item.price)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs sm:text-sm font-black text-gray-900">
                          {formatIDR(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Code Box Integrated into Summary */}
                <div className="pt-4 border-t border-gray-100 mb-5">
                  <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Tag size={14} className="text-primary" /> Kode Promo / Voucher
                  </p>

                  {appliedVoucher ? (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-primary" />
                        <div>
                          <p className="text-[10px] font-black text-primary uppercase tracking-wider">Voucher Digunakan</p>
                          <p className="text-xs font-black text-gray-900">{appliedVoucher.code}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeVoucher}
                        className="text-xs font-bold text-red-500 hover:text-red-700 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Masukkan kode promo..."
                          value={voucherInput}
                          onChange={(e) => setVoucherInput(e.target.value)}
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold uppercase placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleApplyVoucher}
                          disabled={isApplyingVoucher || !voucherInput.trim()}
                          className="bg-gray-900 text-white px-4 rounded-xl text-xs font-black hover:bg-primary disabled:bg-gray-200 disabled:text-gray-400 transition-all shrink-0 flex items-center justify-center min-w-[70px] cursor-pointer"
                        >
                          {isApplyingVoucher ? <Loader2 size={16} className="animate-spin" /> : 'PAKAI'}
                        </button>
                      </div>

                      {voucherError && (
                        <p className="text-[11px] font-semibold text-red-500 px-1">{voucherError}</p>
                      )}

                      <div className="flex items-center justify-between text-[11px] px-1 text-gray-400">
                        <span>Punya kode promo?</span>
                        <button
                          type="button"
                          onClick={() => setVoucherInput('SEGAR10')}
                          className="font-bold text-primary hover:underline cursor-pointer"
                        >
                          Gunakan SEGAR10 (Diskon 10%)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 pt-4 border-t border-gray-100 text-xs">
                  <div className="flex justify-between items-center text-gray-500">
                    <span>Subtotal Produk</span>
                    <span className="font-bold text-gray-800">{formatIDR(totalPrice)}</span>
                  </div>

                  <div className="flex justify-between items-center text-gray-500">
                    <span>Biaya Pengiriman</span>
                    <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      GRATIS
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 font-bold">
                      <span>Diskon Voucher</span>
                      <span>-{formatIDR(discountAmount)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                    <div>
                      <span className="text-sm font-black text-gray-900">Total Pembayaran</span>
                      <p className="text-[10px] text-gray-400">Termasuk pajak & pengemasan</p>
                    </div>
                    <span className="text-2xl font-black text-primary">
                      {formatIDR(finalPrice)}
                    </span>
                  </div>
                </div>

                {/* Primary CTA Button: BAYAR SEKARANG */}
                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-[#008810] disabled:bg-gray-300 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 flex items-center justify-center gap-2.5 text-base cursor-pointer disabled:cursor-not-allowed group active:scale-[0.99]"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Sedang Memproses...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={18} className="opacity-90 group-hover:scale-110 transition-transform" />
                        <span>Bayar Sekarang ({formatIDR(finalPrice)})</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Guarantee & Trust Footer */}
                <div className="mt-5 pt-4 border-t border-gray-100 space-y-2 text-[11px] text-gray-400 font-medium">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                    <span>Pembayaran 100% aman & terlindungi enkripsi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>Garansi kesegaran produk atau uang kembali</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </form>
      </main>

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 z-40 shadow-2xl flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Pembayaran</span>
          <span className="text-lg font-black text-primary leading-tight">{formatIDR(finalPrice)}</span>
        </div>

        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={loading}
          className="bg-primary hover:bg-[#008810] disabled:bg-gray-300 text-white px-6 py-3 rounded-xl font-black text-sm shadow-md shadow-primary/20 flex items-center gap-2 transition-transform active:scale-95 shrink-0 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <Lock size={15} />
              <span>Bayar Sekarang</span>
            </>
          )}
        </button>
      </div>

      {/* EDIT ADDRESS MODAL */}
      <AnimatePresence>
        {isEditingAddress && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                <div className="flex items-center gap-2.5">
                  <MapPin size={20} className="text-primary" />
                  <h3 className="font-black text-lg text-gray-900">Ubah Alamat Pengiriman</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nama Penerima</label>
                  <input
                    type="text"
                    required
                    value={tempAddress.full_name}
                    onChange={(e) => setTempAddress({ ...tempAddress, full_name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nomor Telepon / WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={tempAddress.phone}
                    onChange={(e) => setTempAddress({ ...tempAddress, phone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Alamat Lengkap (Jalan, No. Rumah, RT/RW)</label>
                  <textarea
                    required
                    rows={3}
                    value={tempAddress.address}
                    onChange={(e) => setTempAddress({ ...tempAddress, address: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Kota / Kabupaten</label>
                    <input
                      type="text"
                      required
                      value={tempAddress.city}
                      onChange={(e) => setTempAddress({ ...tempAddress, city: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Kode Pos</label>
                    <input
                      type="text"
                      required
                      value={tempAddress.postal_code}
                      onChange={(e) => setTempAddress({ ...tempAddress, postal_code: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Provinsi</label>
                  <input
                    type="text"
                    required
                    value={tempAddress.province}
                    onChange={(e) => setTempAddress({ ...tempAddress, province: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-primary text-white font-black hover:bg-[#008810] transition-colors shadow-md shadow-primary/20 cursor-pointer"
                  >
                    Simpan Alamat
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
