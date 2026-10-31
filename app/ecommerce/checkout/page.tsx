'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useWallet } from '@/context/WalletContext';
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
  FileText,
  AlertTriangle,
  AlertCircle,
  Store,
  Wallet,
  ExternalLink,
  Navigation,
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

import {
  WAREHOUSE_CONFIG,
  MAX_DELIVERY_DISTANCE,
  calculateHaversineDistance,
  calculateShippingFee,
} from '@/lib/shipping';


export interface ShippingAddressData {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  distance: number; // dalam km — selalu dihitung dari koordinat
  latitude: number;  // wajib ada
  longitude: number; // wajib ada
}

// Koordinat nyata Dusun Klombeyan, Desa Muntung, Candiroto, Temanggung
const DEFAULT_LAT = -7.217896;
const DEFAULT_LNG = 110.109055;

const DEFAULT_ADDRESS: ShippingAddressData = {
  full_name: 'Pelanggan SegarTani',
  phone: '081234567890',
  address: 'Jl. Sibajag KM 01, Dusun Klombeyan, Desa Muntung',
  city: 'Temanggung',
  province: 'Jawa Tengah',
  postal_code: '56257',
  latitude: DEFAULT_LAT,
  longitude: DEFAULT_LNG,
  // Jarak dihitung sekali saat modul dimuat
  distance: parseFloat(
    calculateHaversineDistance(
      WAREHOUSE_CONFIG.coordinates.lat,
      WAREHOUSE_CONFIG.coordinates.lng,
      DEFAULT_LAT,
      DEFAULT_LNG,
    ).toFixed(1)
  ),
};

type PaymentMethod = 'wallet' | 'cod' | 'transfer' | 'qris' | 'whatsapp';

interface PaymentOption {
  id: PaymentMethod;
  title: string;
  subtitle: string;
  badge?: string;
  icon: typeof Banknote;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'wallet',
    title: 'Saldo SegarTani (SegarPay)',
    subtitle: 'Bayar instan dengan saldo digital Anda tanpa perlu transfer.',
    badge: '1-Klik Instan',
    icon: Wallet,
  },
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
  const { balance: walletBalance, payWithWallet } = useWallet();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  const [shippingAddress, setShippingAddress] = useState(DEFAULT_ADDRESS);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState(DEFAULT_ADDRESS);

  // State modal koordinat
  const [tempLat, setTempLat] = useState(String(DEFAULT_LAT));
  const [tempLng, setTempLng] = useState(String(DEFAULT_LNG));
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  const [orderNotes, setOrderNotes] = useState('');

  const [voucherInput, setVoucherInput] = useState('');
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState('');

  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  const selectedItems = cart.filter(item => item.selected);

  // Jarak selalu dihitung dari koordinat (bukan dari field bebas-ketik)
  const hasValidCoords = (
    shippingAddress.latitude != null &&
    shippingAddress.longitude != null &&
    !isNaN(shippingAddress.latitude) &&
    !isNaN(shippingAddress.longitude) &&
    shippingAddress.latitude >= -90 &&
    shippingAddress.latitude <= 90 &&
    shippingAddress.longitude >= -180 &&
    shippingAddress.longitude <= 180
  );
  const distance = hasValidCoords
    ? parseFloat(
        calculateHaversineDistance(
          WAREHOUSE_CONFIG.coordinates.lat,
          WAREHOUSE_CONFIG.coordinates.lng,
          shippingAddress.latitude,
          shippingAddress.longitude,
        ).toFixed(1)
      )
    : 0;
  const isDistanceExceeded = hasValidCoords && distance > MAX_DELIVERY_DISTANCE;
  const shippingFee = hasValidCoords ? calculateShippingFee(distance) : 0;
  const finalPrice = Math.max(0, totalPrice - discountAmount) + (isDistanceExceeded || !hasValidCoords ? 0 : shippingFee);

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
    setGeoError('');

    const lat = parseFloat(tempLat);
    const lng = parseFloat(tempLng);

    if (!tempLat.trim() || !tempLng.trim() || isNaN(lat) || isNaN(lng)) {
      setGeoError('Koordinat latitude dan longitude wajib diisi dengan angka yang valid.');
      return;
    }
    if (lat < -90 || lat > 90) {
      setGeoError('Latitude harus berada di antara -90 dan 90.');
      return;
    }
    if (lng < -180 || lng > 180) {
      setGeoError('Longitude harus berada di antara -180 dan 180.');
      return;
    }

    const calculatedDistance = parseFloat(
      calculateHaversineDistance(
        WAREHOUSE_CONFIG.coordinates.lat,
        WAREHOUSE_CONFIG.coordinates.lng,
        lat,
        lng,
      ).toFixed(1)
    );

    setShippingAddress({
      ...tempAddress,
      latitude: lat,
      longitude: lng,
      distance: calculatedDistance,
    });
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

    if (!hasValidCoords) {
      alert('Koordinat lokasi pengiriman belum ditentukan atau tidak valid. Silakan klik "Ubah Alamat" untuk mengisi atau mendeteksi koordinat Anda.');
      return;
    }

    if (isDistanceExceeded) {
      alert(`Checkout diblokir: Alamat Anda (${distance} km) melebihi batas pengiriman maksimal ${MAX_DELIVERY_DISTANCE} km dari ${WAREHOUSE_CONFIG.name}.`);
      return;
    }

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

      const fullAddressNote = `${shippingAddress.address} [Jarak: ${distance} km, Ongkir: ${formatIDR(shippingFee)}]${
        orderNotes.trim() ? ` (Catatan: ${orderNotes.trim()})` : ''
      }`;

      if (paymentMethod === 'wallet' && walletBalance < finalPrice) {
        alert(`Saldo SegarTani Anda (${formatIDR(walletBalance)}) tidak mencukupi untuk pembayaran ini (${formatIDR(finalPrice)}). Silakan isi saldo terlebih dahulu atau gunakan metode pembayaran lain.`);
        setLoading(false);
        return;
      }

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
          status: paymentMethod === 'wallet' ? 'processing' : 'pending',
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

      if (paymentMethod === 'wallet') {
        await payWithWallet(finalPrice, String(orderData.id));
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
            <div className="bg-white rounded-3xl p-4 sm:p-7 shadow-xs border border-gray-200 transition-all hover:shadow-sm">
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
                    setTempLat(shippingAddress.latitude != null ? String(shippingAddress.latitude) : '');
                    setTempLng(shippingAddress.longitude != null ? String(shippingAddress.longitude) : '');
                    setGeoError('');
                    setIsEditingAddress(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:text-[#008810] px-3 py-1.5 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  <Edit3 size={14} />
                  Ubah Alamat
                </button>
              </div>

              {/* Address Preview Card */}
              <div className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                isDistanceExceeded
                  ? 'bg-red-50/80 border-red-200'
                  : 'bg-gray-50/80 border-gray-100'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl shadow-xs shrink-0 border ${
                    isDistanceExceeded
                      ? 'bg-red-100 text-red-600 border-red-200'
                      : 'bg-white text-primary border-gray-100'
                  }`}>
                    <MapPin size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Alamat Pengiriman
                      </span>
                      <span className="font-black text-gray-900 text-sm">{shippingAddress.full_name}</span>
                      <span className="text-gray-400 text-xs font-medium">({shippingAddress.phone})</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed mt-1">
                      {shippingAddress.address}, {shippingAddress.city}, {shippingAddress.province} {shippingAddress.postal_code}
                    </p>

                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      {!hasValidCoords ? (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertTriangle size={13} />
                          Koordinat belum ditentukan — klik &quot;Ubah Alamat&quot;
                        </span>
                      ) : (
                        <>
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                            isDistanceExceeded
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            <Truck size={13} />
                            Jarak Pengiriman: <strong>{distance} km</strong> dari {WAREHOUSE_CONFIG.name}
                          </span>

                          {!isDistanceExceeded ? (
                            <span className="text-[11px] font-bold text-gray-600 bg-white border border-gray-200 px-2.5 py-1 rounded-lg">
                              Ongkir: <strong>{formatIDR(shippingFee)}</strong> (Rp5.000 + {distance} × Rp2.000/km)
                            </span>
                          ) : (
                            <span className="text-[11px] font-black text-red-600 bg-red-100 px-2.5 py-1 rounded-lg">
                              Melebihi Batas Maksimal {MAX_DELIVERY_DISTANCE} km
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Banner Peringatan jika > 15 km */}
                {isDistanceExceeded && (
                  <div className="mt-3.5 p-3 bg-red-100/90 border border-red-300 rounded-xl text-red-800 text-xs flex items-start gap-2.5">
                    <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-red-900">Pengiriman Ditolak: Di Luar Jangkauan ({distance} km)</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed">
                        Kurir SegarTani Express hanya melayani pengiriman maksimal <strong>{MAX_DELIVERY_DISTANCE} km</strong> dari {WAREHOUSE_CONFIG.name} demi menjaga kesegaran produk sayur & buah. Silakan ganti alamat pengiriman Anda ke lokasi dalam radius {MAX_DELIVERY_DISTANCE} km.
                      </p>
                    </div>
                  </div>
                )}

                {/* Preset Tombol Uji Cepat Skenario Presisi (Inverse Haversine) */}
                {/* Panel ini hanya tampil jika NEXT_PUBLIC_SHOW_TEST_PANEL=true — jangan hapus kode ini */}
                {process.env.NEXT_PUBLIC_SHOW_TEST_PANEL === 'true' && (
                <div className="mt-3 pt-3 border-t border-gray-200/70">
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                      Titik Uji Presisi (Gudang: {WAREHOUSE_CONFIG.coordinates.lat}, {WAREHOUSE_CONFIG.coordinates.lng}):
                    </span>
                    <span className="text-[10px] text-gray-400">Toleransi &plusmn;0,05 km</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                    {[
                      { label: 'Uji 7,0 km • Rp19.000', km: 7.0, lat: -7.217896, lng: 110.109055, name: 'Candiroto Timur (7,0 km)' },
                      { label: 'Uji 14,0 km • Rp33.000', km: 14.0, lat: -7.217882, lng: 110.172511, name: 'Area Temanggung (14,0 km)' },
                      { label: 'Uji 14,9 km • Rp34.800', km: 14.9, lat: -7.217880, lng: 110.180669, name: 'Batas Radius (14,9 km)' },
                      { label: 'Uji 15,1 km • Diblokir', km: 15.1, lat: -7.217880, lng: 110.182482, name: 'Luar Radius (15,1 km)' },
                      { label: 'Uji 16,0 km • Diblokir', km: 16.0, lat: -7.217877, lng: 110.190641, name: 'Luar Radius (16,0 km)' },
                      { label: 'Uji 22,0 km • Diblokir', km: 22.0, lat: -7.217857, lng: 110.245031, name: 'Luar Jangkauan (22,0 km)' },
                      { label: 'Muntung (1,0 km • Nyata)', km: 1.0, lat: -7.213900, lng: 110.053600, name: 'Desa Muntung, Candiroto (1,0 km)' },
                      { label: 'Kota Temanggung (18,2 km)', km: 18.2, lat: -7.315000, lng: 110.175000, name: 'Alun-alun Temanggung (18,2 km)' },
                    ].map((preset) => {
                      const isSelected = Math.abs(distance - preset.km) < 0.05;
                      const isExceed = preset.km > MAX_DELIVERY_DISTANCE;
                      return (
                        <button
                          key={preset.km}
                          type="button"
                          onClick={() => {
                            const exactDistance = calculateHaversineDistance(
                              WAREHOUSE_CONFIG.coordinates.lat,
                              WAREHOUSE_CONFIG.coordinates.lng,
                              preset.lat,
                              preset.lng
                            );
                            const roundedDistance = parseFloat(exactDistance.toFixed(1));
                            const updatedAddr = {
                              ...shippingAddress,
                              address: preset.name,
                              city: 'Temanggung',
                              province: 'Jawa Tengah',
                              distance: roundedDistance,
                              latitude: preset.lat,
                              longitude: preset.lng,
                            };
                            setShippingAddress(updatedAddr);
                            setTempAddress(updatedAddr);
                          }}
                          className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer text-left truncate ${
                            isSelected
                              ? isExceed
                                ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-400'
                                : 'bg-primary text-white shadow-sm ring-2 ring-primary/40'
                              : isExceed
                                ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                )}
              </div>

              {/* Shipping Method Banner */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${
                    isDistanceExceeded ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    <Truck size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">SegarTani Express (1 Hari Tiba)</p>
                    <p className="text-gray-400 text-[11px]">
                      {isDistanceExceeded
                        ? `Alamat ${distance} km tidak dapat diproses`
                        : `Jarak ${distance} km (Dasar Rp5.000 + Rp2.000/km)`}
                    </p>
                  </div>
                </div>
                {isDistanceExceeded ? (
                  <span className="font-black text-red-600 uppercase tracking-wider bg-red-50 px-2 py-1 rounded-md text-[11px]">
                    DIBLOKIR (&gt;15 KM)
                  </span>
                ) : (
                  <span className="font-black text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md text-xs">
                    {formatIDR(shippingFee)}
                  </span>
                )}
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
                {paymentMethod === 'wallet' && (
                  <motion.div
                    key="wallet"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-5 p-4 sm:p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet size={18} className="text-primary" />
                        <span className="font-bold text-gray-900">Saldo SegarPay Anda Saat Ini:</span>
                      </div>
                      <span className="text-base font-black text-emerald-800">{formatIDR(walletBalance)}</span>
                    </div>

                    {walletBalance >= finalPrice ? (
                      <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-emerald-200 text-emerald-800 font-bold">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>Saldo Anda mencukupi! Pesanan akan otomatis berstatus lunas setelah Anda klik tombol buat pesanan.</span>
                      </div>
                    ) : (
                      <div className="p-3 bg-white rounded-xl border border-red-200 text-red-700 space-y-2">
                        <div className="flex items-center gap-2 font-bold">
                          <AlertCircle size={16} className="text-red-600 shrink-0" />
                          <span>Saldo Anda kurang sebesar {formatIDR(finalPrice - walletBalance)}.</span>
                        </div>
                        <p className="text-[11px] text-gray-600 font-medium">
                          Anda dapat mengisi saldo terlebih dahulu atau memilih metode pembayaran lain (COD / Transfer Bank / QRIS).
                        </p>
                        <Link
                          href="/wallet"
                          target="_blank"
                          className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline"
                        >
                          <span>Buka Halaman Dompet & Isi Saldo</span>
                          <ExternalLink size={12} />
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
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
                      <span>Nomor Rekening Resmi SegarTani Temanggung:</span>
                    </div>

                    {/* BCA */}
                    <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between">
                      <div>
                        <p className="font-black text-gray-900">BCA: <span className="font-mono text-sm tracking-wider">1234567890</span></p>
                        <p className="text-[11px] text-gray-400">a.n. SegarTani Temanggung Sejahtera</p>
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
                        <p className="text-[11px] text-gray-400">a.n. SegarTani Temanggung Sejahtera</p>
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
                        <Image src={item.image} alt={item.name} fill unoptimized className="object-cover" sizes="56px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={item.seller_id ? `/seller/${item.seller_id}` : '/seller/official'}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline mb-0.5 w-fit"
                          title="Buka profil penjual di tab baru"
                        >
                          <Store size={10} className="shrink-0" />
                          <span className="truncate">{item.seller_name || 'SegarTani Official'}</span>
                        </Link>
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
                    <div>
                      <span>Biaya Pengiriman</span>
                      <span className="text-[10px] text-gray-400 block font-normal">
                        Jarak {distance} km (Dasar Rp5.000 + Rp2.000/km)
                      </span>
                    </div>
                    {isDistanceExceeded ? (
                      <span className="font-black text-red-600 bg-red-50 px-2 py-0.5 rounded text-[11px]">
                        Di Luar Jangkauan (&gt;15 km)
                      </span>
                    ) : (
                      <span className="font-black text-gray-900 bg-gray-50 px-2 py-0.5 rounded">
                        {formatIDR(shippingFee)}
                      </span>
                    )}
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
                      <p className="text-[10px] text-gray-400">Termasuk ongkir, pajak & pengemasan</p>
                    </div>
                    <span className={`text-2xl font-black ${
                      isDistanceExceeded ? 'text-gray-400 line-through' : 'text-primary'
                    }`}>
                      {formatIDR(finalPrice)}
                    </span>
                  </div>
                </div>

                {/* Primary CTA Button: BAYAR SEKARANG */}
                <div className="pt-6">
                  {!hasValidCoords ? (
                    <div className="mb-3.5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-bold flex items-start gap-2.5">
                      <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-black text-amber-900">Koordinat Lokasi Belum Ditentukan</p>
                        <p className="text-[11px] font-medium text-amber-700 mt-0.5">
                          Silakan klik &quot;Ubah Alamat&quot; untuk mengisi atau mendeteksi koordinat lokasi pengiriman Anda.
                        </p>
                      </div>
                    </div>
                  ) : isDistanceExceeded ? (
                    <div className="mb-3.5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold flex items-start gap-2.5">
                      <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-black text-red-800">Checkout Diblokir Sementara</p>
                        <p className="text-[11px] font-medium text-red-600 mt-0.5">
                          Jarak pengiriman Anda ({distance} km) melebihi batas operasional {MAX_DELIVERY_DISTANCE} km. Silakan pilih atau ubah alamat dalam radius {MAX_DELIVERY_DISTANCE} km dari {WAREHOUSE_CONFIG.name}.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading || isDistanceExceeded || !hasValidCoords}
                    className={`w-full text-white font-black py-4 px-6 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2.5 text-base cursor-pointer disabled:cursor-not-allowed group active:scale-[0.99] ${
                      !hasValidCoords
                        ? 'bg-amber-500/80 hover:bg-amber-500 shadow-amber-200 cursor-not-allowed'
                        : isDistanceExceeded
                        ? 'bg-red-500/80 hover:bg-red-500 shadow-red-200 cursor-not-allowed'
                        : 'bg-primary hover:bg-[#008810] disabled:bg-gray-300 shadow-primary/25 hover:shadow-xl hover:shadow-primary/30'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Sedang Memproses...</span>
                      </>
                    ) : !hasValidCoords ? (
                      <>
                        <AlertTriangle size={18} />
                        <span>Tentukan Koordinat Pengiriman</span>
                      </>
                    ) : isDistanceExceeded ? (
                      <>
                        <AlertTriangle size={18} />
                        <span>Checkout Diblokir (Jarak &gt; 15 km)</span>
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
          <span className={`text-lg font-black leading-tight ${
            !hasValidCoords ? 'text-amber-600 text-xs' : isDistanceExceeded ? 'text-red-500 text-sm' : 'text-primary'
          }`}>
            {!hasValidCoords ? 'Koordinat Belum Ada' : isDistanceExceeded ? 'Di Luar Jangkauan' : formatIDR(finalPrice)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={loading || isDistanceExceeded || !hasValidCoords}
          className={`px-6 py-3 rounded-xl font-black text-sm shadow-md flex items-center gap-2 transition-transform active:scale-95 shrink-0 cursor-pointer disabled:cursor-not-allowed ${
            !hasValidCoords
              ? 'bg-amber-500 text-white'
              : isDistanceExceeded
              ? 'bg-red-500 text-white'
              : 'bg-primary hover:bg-[#008810] disabled:bg-gray-300 text-white shadow-primary/20'
          }`}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Memproses...</span>
            </>
          ) : !hasValidCoords ? (
            <>
              <AlertTriangle size={15} />
              <span>Isi Koordinat</span>
            </>
          ) : isDistanceExceeded ? (
            <>
              <AlertTriangle size={15} />
              <span>Diblokir (&gt;15 km)</span>
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

                {/* ── Koordinat & Jarak Otomatis ── */}
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-gray-900 text-xs flex items-center gap-1.5">
                      <MapPin size={13} className="text-primary" />
                      Koordinat Lokasi Pengiriman
                    </label>
                    {/* Tombol Gunakan Lokasi Saya */}
                    <button
                      type="button"
                      disabled={geoLoading}
                      onClick={() => {
                        if (!navigator.geolocation) {
                          setGeoError('Browser Anda tidak mendukung geolocation.');
                          return;
                        }
                        setGeoLoading(true);
                        setGeoError('');
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setTempLat(String(pos.coords.latitude));
                            setTempLng(String(pos.coords.longitude));
                            setGeoLoading(false);
                          },
                          () => {
                            setGeoError('Tidak dapat mengakses lokasi. Pastikan izin lokasi diaktifkan.');
                            setGeoLoading(false);
                          },
                          { enableHighAccuracy: true, timeout: 10000 }
                        );
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] font-black text-primary hover:text-[#008810] bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {geoLoading
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Navigation size={12} />}
                      {geoLoading ? 'Mendeteksi...' : 'Gunakan lokasi saya'}
                    </button>
                  </div>

                  {/* Input Lat / Lng */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="contoh: -7.2178"
                        value={tempLat}
                        onChange={(e) => { setTempLat(e.target.value); setGeoError(''); }}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="contoh: 110.1090"
                        value={tempLng}
                        onChange={(e) => { setTempLng(e.target.value); setGeoError(''); }}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-gray-300"
                      />
                    </div>
                  </div>

                  {/* Petunjuk salin dari Google Maps */}
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    💡 Cara mudah: buka <strong className="text-gray-600">Google Maps</strong>, klik kanan pada lokasi rumah Anda, lalu salin koordinat (angka pertama = Latitude, angka kedua = Longitude).
                  </p>

                  {/* Jarak Hasil Haversine — read-only */}
                  {(() => {
                    const lat = parseFloat(tempLat);
                    const lng = parseFloat(tempLng);
                    const valid = tempLat.trim() !== '' && tempLng.trim() !== '' && !isNaN(lat) && !isNaN(lng)
                      && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
                    if (!valid) return null;
                    const d = parseFloat(
                      calculateHaversineDistance(
                        WAREHOUSE_CONFIG.coordinates.lat,
                        WAREHOUSE_CONFIG.coordinates.lng,
                        lat, lng,
                      ).toFixed(1)
                    );
                    const exceeded = d > MAX_DELIVERY_DISTANCE;
                    return (
                      <div className={`flex items-center justify-between rounded-xl px-3 py-2 border text-xs font-bold ${
                        exceeded
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}>
                        <span className="flex items-center gap-1.5">
                          <Truck size={13} />
                          Jarak ke Gudang
                        </span>
                        <span>
                          {d} km — {exceeded
                            ? `Di Luar Jangkauan (maks. ${MAX_DELIVERY_DISTANCE} km)`
                            : `Ongkir ${formatIDR(calculateShippingFee(d))}`}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Error geolocation / validasi */}
                  {geoError && (
                    <p className="text-[11px] font-semibold text-red-600 flex items-start gap-1.5">
                      <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                      {geoError}
                    </p>
                  )}

                  {/* Info koordinat gudang */}
                  <div className="text-[10px] text-gray-400 bg-white p-2 rounded-xl border border-gray-100">
                    📍 Gudang: {WAREHOUSE_CONFIG.name} ({WAREHOUSE_CONFIG.coordinates.lat}, {WAREHOUSE_CONFIG.coordinates.lng}) • Maks. {MAX_DELIVERY_DISTANCE} km
                  </div>
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
