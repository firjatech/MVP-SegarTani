'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag,
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Percent,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useCart, Voucher } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';

interface ExtendedVoucher extends Voucher {
  title?: string;
  description?: string;
  category?: 'belanja' | 'ongkir' | 'spesial';
  expiry_date?: string | null;
  is_active?: boolean;
}

const DEFAULT_VOUCHERS: ExtendedVoucher[] = [
  {
    id: 101,
    code: 'SEGAR10',
    discount_type: 'percentage',
    discount_value: 10,
    min_purchase: 50000,
    title: 'Diskon 10% Sayur & Buah Segar',
    description: 'Potongan 10% untuk semua produk organik panen lokal tanpa batas maksimal.',
    category: 'belanja',
    expiry_date: '31 Des 2026',
    is_active: true,
  },
  {
    id: 102,
    code: 'DISKON20K',
    discount_type: 'fixed',
    discount_value: 20000,
    min_purchase: 100000,
    title: 'Potongan Belanja Rp 20.000',
    description: 'Hemat Rp 20.000 untuk transaksi belanja organik minimal Rp 100.000.',
    category: 'belanja',
    expiry_date: '31 Des 2026',
    is_active: true,
  },
  {
    id: 103,
    code: 'ONGKIRSEGAR',
    discount_type: 'fixed',
    discount_value: 15000,
    min_purchase: 75000,
    title: 'Subsidi Ongkos Kirim Rp 15.000',
    description: 'Potongan biaya antar kurir kilat khusus pengiriman area Batu & Malang raya.',
    category: 'ongkir',
    expiry_date: '31 Des 2026',
    is_active: true,
  },
  {
    id: 104,
    code: 'PETANIBATU',
    discount_type: 'percentage',
    discount_value: 15,
    min_purchase: 80000,
    title: 'Diskon 15% Hasil Kebun Petani Batu',
    description: 'Dukungan untuk petani lokal Batu! Nikmati potongan 15% belanja hasil kebun mitra.',
    category: 'spesial',
    expiry_date: '31 Des 2026',
    is_active: true,
  },
  {
    id: 105,
    code: 'COBAHEMAT',
    discount_type: 'percentage',
    discount_value: 5,
    min_purchase: 0,
    title: 'Diskon 5% Pengguna Baru',
    description: 'Voucher sambutan tanpa minimum belanja untuk mencoba kesegaran SegarTani.',
    category: 'spesial',
    expiry_date: '31 Des 2026',
    is_active: true,
  },
];

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/\s/g, '');
};

export default function VouchersPage() {
  const router = useRouter();
  const { appliedVoucher, applyVoucher, removeVoucher } = useCart();

  const [vouchers, setVouchers] = useState<ExtendedVoucher[]>(DEFAULT_VOUCHERS);
  const [activeTab, setActiveTab] = useState<'all' | 'belanja' | 'ongkir' | 'spesial'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [claimInput, setClaimInput] = useState('');
  const [claimMessage, setClaimMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ambil voucher aktif dari database Supabase jika tersedia
  useEffect(() => {
    async function loadDbVouchers() {
      try {
        const { data, error } = await supabase
          .from('vouchers')
          .select('*')
          .eq('is_active', true);

        if (!error && data && data.length > 0) {
          const mapped: ExtendedVoucher[] = data.map((v) => {
            const isPct = v.discount_type === 'percentage';
            return {
              id: Number(v.id),
              code: v.code,
              discount_type: v.discount_type,
              discount_value: Number(v.discount_value),
              min_purchase: Number(v.min_purchase || 0),
              title: isPct
                ? `Diskon ${v.discount_value}% Belanja Segar`
                : `Potongan ${formatIDR(Number(v.discount_value))}`,
              description: `Voucher promo resmi SegarTani dengan minimum belanja ${formatIDR(Number(v.min_purchase || 0))}.`,
              category: v.discount_type === 'fixed' && v.code.toLowerCase().includes('ongkir') ? 'ongkir' : 'belanja',
              expiry_date: v.expiry_date ? new Date(v.expiry_date).toLocaleDateString('id-ID') : 'Berlaku Selamanya',
              is_active: v.is_active,
            };
          });

          // Gabungkan DB vouchers dengan default jika ada kode unik baru
          setVouchers((prev) => {
            const map = new Map<string, ExtendedVoucher>();
            prev.forEach((item) => map.set(item.code, item));
            mapped.forEach((item) => map.set(item.code, item));
            return Array.from(map.values());
          });
        }
      } catch {
        // Fallback default vouchers tetap aktif
      }
    }

    loadDbVouchers();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleApplyVoucher = (voucher: ExtendedVoucher) => {
    applyVoucher({
      id: voucher.id,
      code: voucher.code,
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
      min_purchase: voucher.min_purchase,
    });
  };

  const handleClaimVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimInput.trim()) return;

    setIsSubmitting(true);
    setClaimMessage(null);
    const codeClean = claimInput.trim().toUpperCase();

    try {
      // 1. Cek di daftar lokal yang sudah ada
      const existing = vouchers.find((v) => v.code === codeClean);
      if (existing) {
        handleApplyVoucher(existing);
        setClaimMessage({
          type: 'success',
          text: `Voucher "${codeClean}" berhasil diklaim & langsung dipasangkan ke keranjang!`,
        });
        setClaimInput('');
        setIsSubmitting(false);
        return;
      }

      // 2. Cek di Supabase database
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', codeClean)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setClaimMessage({
          type: 'error',
          text: `Kode voucher "${codeClean}" tidak ditemukan atau masa berlakunya telah berakhir.`,
        });
      } else {
        const newVoucher: ExtendedVoucher = {
          id: Number(data.id),
          code: data.code,
          discount_type: data.discount_type,
          discount_value: Number(data.discount_value),
          min_purchase: Number(data.min_purchase || 0),
          title: `Voucher Diskon ${data.code}`,
          description: `Voucher promo terverifikasi dengan minimal transaksi ${formatIDR(Number(data.min_purchase || 0))}.`,
          category: 'spesial',
          is_active: true,
        };

        setVouchers((prev) => [newVoucher, ...prev]);
        handleApplyVoucher(newVoucher);
        setClaimMessage({
          type: 'success',
          text: `Voucher "${codeClean}" berhasil diklaim & dipasangkan ke pesanan Anda!`,
        });
        setClaimInput('');
      }
    } catch {
      setClaimMessage({
        type: 'error',
        text: 'Terjadi kendala saat memeriksa voucher. Silakan coba kembali.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVouchers = vouchers.filter((v) => {
    if (activeTab === 'all') return true;
    return v.category === activeTab;
  });

  return (
    <div className="bg-gray-50 min-h-screen pt-12 pb-24 font-sans">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        {/* Navigation & Header */}
        <header className="mb-8">
          <Link
            href="/ecommerce"
            className="items-center gap-2 text-gray-500 font-bold hover:text-primary transition-colors mb-6 group inline-flex"
          >
            <ArrowLeft
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Kembali ke Katalog Belanja
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-emerald-800 to-primary p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-primary/20 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute right-1/4 -top-8 w-32 h-32 bg-secondary/20 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase mb-3 backdrop-blur-sm border border-white/20">
                <Sparkles size={14} className="text-secondary" />
                Voucher & Promo Hemat
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                Voucher & Promo Saya
              </h1>
              <p className="text-emerald-100 text-sm sm:text-base font-medium max-w-xl mt-2 leading-relaxed">
                Klaim kode kupon diskon dan potongan ongkos kirim untuk menikmati sayur dan buah segar langsung dari petani dengan harga terbaik.
              </p>
            </div>

            {appliedVoucher && (
              <div className="relative z-10 bg-white/95 backdrop-blur text-gray-900 p-4 sm:p-5 rounded-2xl shadow-lg border border-white flex flex-col justify-between gap-3 min-w-[240px]">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    Voucher Aktif Terpasang
                  </span>
                  <p className="text-xl font-black text-gray-900 mt-1">{appliedVoucher.code}</p>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5">
                    {appliedVoucher.discount_type === 'percentage'
                      ? `Diskon ${appliedVoucher.discount_value}%`
                      : `Potongan ${formatIDR(appliedVoucher.discount_value)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => router.push('/ecommerce/checkout')}
                    className="flex-1 py-1.5 px-3 bg-primary text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors text-center"
                  >
                    Pakai di Checkout
                  </button>
                  <button
                    type="button"
                    onClick={removeVoucher}
                    className="py-1.5 px-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Lepas voucher"
                  >
                    Lepas
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Claim Voucher Box */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-sm font-black uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
            <Tag size={16} className="text-primary" />
            Punya Kode Voucher Khusus?
          </h2>
          <form onSubmit={handleClaimVoucher} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={claimInput}
                onChange={(e) => setClaimInput(e.target.value)}
                placeholder="Masukkan kode voucher (contoh: SEGAR10, ONGKIRSEGAR)..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold tracking-wider uppercase text-gray-900 placeholder:normal-case placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !claimInput.trim()}
              className="px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isSubmitting ? 'Memeriksa...' : 'Klaim & Gunakan'}
            </button>
          </form>

          {claimMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-3 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                claimMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {claimMessage.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
              )}
              <span>{claimMessage.text}</span>
            </motion.div>
          )}
        </div>

        {/* Categories Tab */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'Semua Promo', count: vouchers.length },
            { id: 'belanja', label: 'Diskon Belanja', count: vouchers.filter((v) => v.category === 'belanja').length },
            { id: 'ongkir', label: 'Gratis Ongkir', count: vouchers.filter((v) => v.category === 'ongkir').length },
            { id: 'spesial', label: 'Promo Spesial', count: vouchers.filter((v) => v.category === 'spesial').length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Voucher Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <AnimatePresence>
            {filteredVouchers.map((voucher) => {
              const isApplied = appliedVoucher?.code === voucher.code;
              const isPercentage = voucher.discount_type === 'percentage';

              return (
                <motion.div
                  key={voucher.id || voucher.code}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className={`relative bg-white rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md ${
                    isApplied ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'
                  }`}
                >
                  {/* Coupon Ticket Styling Notch */}
                  <div className="hidden sm:block absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full border-r border-gray-200" />
                  <div className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full border-l border-gray-200" />

                  {/* Main Card Content */}
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                            voucher.category === 'ongkir'
                              ? 'bg-blue-50 text-blue-600'
                              : voucher.category === 'spesial'
                              ? 'bg-purple-50 text-purple-600'
                              : 'bg-emerald-50 text-primary'
                          }`}
                        >
                          {voucher.category === 'ongkir' ? (
                            <Truck size={24} />
                          ) : (
                            <Percent size={24} />
                          )}
                        </div>
                        <div>
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              voucher.category === 'ongkir'
                                ? 'bg-blue-100 text-blue-700'
                                : voucher.category === 'spesial'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {voucher.category === 'ongkir'
                              ? 'Ongkir'
                              : voucher.category === 'spesial'
                              ? 'Spesial'
                              : 'Diskon'}
                          </span>
                          <h3 className="font-black text-gray-900 text-base sm:text-lg mt-0.5">
                            {voucher.title}
                          </h3>
                        </div>
                      </div>

                      {isApplied && (
                        <span className="bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <Check size={12} />
                          Digunakan
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 font-medium leading-relaxed mb-4">
                      {voucher.description}
                    </p>

                    {/* Terms info */}
                    <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-xs text-gray-500 font-semibold mb-4 border border-gray-100">
                      <div className="flex items-center justify-between">
                        <span>Min. Transaksi:</span>
                        <span className="text-gray-900 font-bold">
                          {voucher.min_purchase > 0 ? formatIDR(voucher.min_purchase) : 'Tanpa Minimum'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Potongan:</span>
                        <span className="text-primary font-bold">
                          {isPercentage
                            ? `${voucher.discount_value}%`
                            : formatIDR(voucher.discount_value)}
                        </span>
                      </div>
                      {voucher.expiry_date && (
                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> Berlaku hingga:
                          </span>
                          <span>{voucher.expiry_date}</span>
                        </div>
                      )}
                    </div>

                    {/* Voucher Code Box & Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      {/* Code copy pill */}
                      <button
                        type="button"
                        onClick={() => handleCopy(voucher.code)}
                        className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-black tracking-widest transition-colors group"
                        title="Klik untuk salin kode voucher"
                      >
                        <span className="font-mono text-primary text-sm">{voucher.code}</span>
                        {copiedCode === voucher.code ? (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <Check size={12} /> Tersalin
                          </span>
                        ) : (
                          <Copy size={13} className="text-gray-400 group-hover:text-gray-700" />
                        )}
                      </button>

                      {/* Use or Remove button */}
                      {isApplied ? (
                        <button
                          type="button"
                          onClick={removeVoucher}
                          className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                        >
                          Hapus dari Pesanan
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApplyVoucher(voucher)}
                          className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-emerald-700 shadow-md shadow-primary/20 rounded-xl transition-all"
                        >
                          Gunakan Voucher
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Bottom CTA to shop */}
        <div className="mt-12 text-center bg-white p-8 rounded-3xl border border-gray-100 shadow-sm max-w-2xl mx-auto">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShoppingBag size={24} />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-1">
            Siap Berbelanja Produk Sayur & Buah Segar?
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-5 leading-relaxed">
            Voucher yang Anda pasangkan akan otomatis memotong total tagihan saat pembayaran di halaman checkout.
          </p>
          <Link
            href="/ecommerce"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-emerald-700 transition-all"
          >
            <span>Mulai Belanja Sekarang</span>
            <ExternalLink size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

