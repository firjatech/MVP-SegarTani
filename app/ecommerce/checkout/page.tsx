'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MapPin, Phone, User, Home, CreditCard, ShoppingBag, Loader2, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/\s/g, '');
};

export default function CheckoutPage() {
  const { 
    cart, totalPrice, totalSelectedItems, clearCart, 
    appliedVoucher, applyVoucher, removeVoucher, discountAmount 
  } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postal_code: ''
  });

  const [voucherInput, setVoucherInput] = useState('');
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState('');

  const selectedItems = cart.filter(item => item.selected);
  const finalPrice = totalPrice - discountAmount;

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          province: data.province || '',
          postal_code: data.postal_code || ''
        });
      }
      setFetchingProfile(false);
    }

    loadProfile();
  }, [router]);

  const handleApplyVoucher = async () => {
    if (!voucherInput) return;
    setIsApplyingVoucher(true);
    setVoucherError('');

    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', voucherInput.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setVoucherError('Kode voucher tidak valid atau sudah tidak aktif.');
        return;
      }

      // Check expiry
      if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
        setVoucherError('Kode voucher sudah kedaluwarsa.');
        return;
      }

      // Check min purchase
      if (totalPrice < data.min_purchase) {
        setVoucherError(`Minimal belanja ${formatIDR(data.min_purchase)} untuk menggunakan voucher ini.`);
        return;
      }

      applyVoucher(data);
      setVoucherInput('');
    } catch (err) {
      setVoucherError('Terjadi kesalahan saat mengecek voucher.');
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User tidak ditemukan. Silakan login kembali.');

      // 0. Check stock for all items
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

      // 1. Update profile address
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...formData,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // 2. Create Order record
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          postal_code: formData.postal_code,
          total_price: finalPrice,
          status: 'pending',
          voucher_code: appliedVoucher?.code || null,
          discount_amount: discountAmount
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Create Order Items records
      const orderItems = selectedItems.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price_at_purchase: item.price,
        image_url: item.image
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 4. Decrease Stock in database
      for (const item of selectedItems) {
        const { error: decreaseError } = await supabase.rpc('decrease_stock', { 
          p_id: item.id, 
          p_qty: item.quantity 
        });
        if (decreaseError) console.error(`Gagal mengurangi stok ${item.name}:`, decreaseError);
      }

      // 5. Bersihkan keranjang
      clearCart();

      // 6. Tampilkan sukses
      setOrderSuccess(true);
      return;
    } catch (err: unknown) {
      // Log full error details for debugging
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('Checkout Error Full:', { message: errMsg, raw: err });
      alert(`Gagal memproses pesanan:\nPesan: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Hooks HARUS dipanggil sebelum semua conditional return
  useEffect(() => {
    if (selectedItems.length === 0 && !fetchingProfile && !orderSuccess) {
      router.push('/ecommerce');
    }
  }, [selectedItems.length, fetchingProfile, orderSuccess, router]);

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-[#00AA13]/10 text-[#00AA13] rounded-full flex items-center justify-center mb-8"
        >
          <CheckCircle2 size={60} strokeWidth={2.5} />
        </motion.div>
        <h1 className="text-4xl font-black text-gray-900 mb-4">Pesanan Berhasil!</h1>
        <p className="text-gray-500 max-w-sm mb-12 font-medium">
          Terima kasih telah berbelanja di SegarTani. Pesanan Anda sedang kami siapkan dan akan segera dikirim.
        </p>
        <button 
          onClick={() => router.push('/ecommerce')}
          className="bg-[#00AA13] text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-[#00AA13]/20 hover:scale-105 transition-transform"
        >
          Kembali ke Katalog
        </button>
      </div>
    );
  }

  if (fetchingProfile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin text-[#00AA13]" size={40} />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-16 pb-20 font-sans">
      <div className="container mx-auto px-6 max-w-6xl">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 font-bold hover:text-[#00AA13] transition-colors mb-2 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Kembali
        </button>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Left: Form */}
          <div className="lg:w-2/3 w-full">
            <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-gray-100">
              <div className="flex items-center gap-4 mb-10">
                <div className="bg-[#00AA13] p-3 rounded-2xl text-white">
                  <MapPin size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Alamat Pengiriman</h2>
                  <p className="text-sm font-bold text-gray-400">Pastikan alamat Anda sudah benar.</p>
                </div>
              </div>

              {fetchingProfile ? (
                <div className="py-20 flex justify-center">
                  <Loader2 className="animate-spin text-[#00AA13]" size={40} />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">NAMA PENERIMA</label>
                      <div className="relative">
                        <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input 
                          type="text" 
                          required
                          value={formData.full_name}
                          onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                          placeholder="Nama lengkap Anda" 
                          className="w-full bg-gray-50 border-none rounded-2xl px-14 py-4 focus:ring-4 focus:ring-[#00AA13]/5 text-gray-700 font-medium transition-all" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">NOMOR TELEPON / WA</label>
                      <div className="relative">
                        <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input 
                          type="tel" 
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                          placeholder="0812xxxx" 
                          className="w-full bg-gray-50 border-none rounded-2xl px-14 py-4 focus:ring-4 focus:ring-[#00AA13]/5 text-gray-700 font-medium transition-all" 
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">ALAMAT LENGKAP</label>
                    <div className="relative">
                      <Home size={18} className="absolute left-5 top-6 text-gray-300" />
                      <textarea 
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan..." 
                        rows={3}
                        className="w-full bg-gray-50 border-none rounded-2xl px-14 py-4 focus:ring-4 focus:ring-[#00AA13]/5 text-gray-700 font-medium transition-all" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">KOTA</label>
                      <input 
                        type="text" 
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        placeholder="Contoh: Batu" 
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-4 focus:ring-[#00AA13]/5 text-gray-700 font-medium transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">PROVINSI</label>
                      <input 
                        type="text" 
                        required
                        value={formData.province}
                        onChange={(e) => setFormData({...formData, province: e.target.value})}
                        placeholder="Jawa Timur" 
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-4 focus:ring-[#00AA13]/5 text-gray-700 font-medium transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">KODE POS</label>
                      <input 
                        type="text" 
                        required
                        value={formData.postal_code}
                        onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                        placeholder="65311" 
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-4 focus:ring-[#00AA13]/5 text-gray-700 font-medium transition-all" 
                      />
                    </div>
                  </div>

                  <div className="pt-6">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#00AA13] hover:bg-[#008810] disabled:bg-gray-300 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-[#00AA13]/20 flex items-center justify-center gap-3 text-lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={24} className="animate-spin" /> Sedang Memproses...
                        </>
                      ) : (
                        <>
                          Buat Pesanan ({formatIDR(finalPrice)})
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right: Summary */}
          <div className="lg:w-1/3 w-full">
            {/* Voucher Section */}
            <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-gray-100 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard size={20} className="text-[#00AA13]" />
                <h3 className="text-xl font-black text-gray-900">Kode Promo</h3>
              </div>
              
              {appliedVoucher ? (
                <div className="bg-[#00AA13]/10 p-4 rounded-2xl border border-[#00AA13]/20 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-[#00AA13] uppercase tracking-widest">VOUCHER DIGUNAKAN</p>
                    <p className="text-sm font-black text-gray-900">{appliedVoucher.code}</p>
                  </div>
                  <button 
                    onClick={removeVoucher}
                    className="text-red-500 font-bold text-xs hover:underline"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Masukkan kode promo..." 
                      value={voucherInput}
                      onChange={(e) => setVoucherInput(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-4 focus:ring-[#00AA13]/5 text-sm font-bold uppercase transition-all"
                    />
                    <button 
                      onClick={handleApplyVoucher}
                      disabled={isApplyingVoucher || !voucherInput}
                      className="absolute right-2 top-2 bottom-2 bg-[#00AA13] text-white px-4 rounded-xl text-xs font-black hover:bg-[#008810] disabled:bg-gray-300 transition-all"
                    >
                      {isApplyingVoucher ? <Loader2 size={16} className="animate-spin" /> : 'PAKAI'}
                    </button>
                  </div>
                  {voucherError && (
                    <p className="text-[10px] font-bold text-red-500 px-2">{voucherError}</p>
                  )}
                  <p className="text-[10px] font-bold text-gray-400 px-2 uppercase tracking-wider">
                    Gunakan <span className="text-[#00AA13]">SEGAR10</span> untuk diskon 10%
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-8">
                <ShoppingBag size={20} className="text-[#00AA13]" />
                <h3 className="text-xl font-black text-gray-900">Ringkasan Pesanan</h3>
              </div>

              <div className="space-y-6 mb-8 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-100">
                {selectedItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 relative">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{item.name}</h4>
                      <p className="text-xs font-bold text-gray-400 mb-1">{item.quantity} x {formatIDR(item.price)}</p>
                      <p className="text-sm font-black text-[#00AA13]">{formatIDR(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center text-sm font-bold text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatIDR(totalPrice)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-gray-400">
                  <span>Biaya Pengiriman</span>
                  <span className="text-[#00AA13]">GRATIS</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-sm font-bold text-red-500">
                    <span>Potongan Voucher</span>
                    <span>-{formatIDR(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 text-gray-900">
                  <span className="text-base font-black">Total Pembayaran</span>
                  <span className="text-2xl font-black text-[#00AA13]">{formatIDR(finalPrice)}</span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-yellow-50 rounded-2xl flex items-start gap-3 border border-yellow-100">
                <CreditCard className="text-[#FF9F1C] flex-shrink-0" size={20} />
                <p className="text-[10px] font-bold text-yellow-800 leading-relaxed uppercase tracking-wider">
                  Metode pembayaran saat ini hanya tersedia via <span className="font-black underline">WhatsApp / COD</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
