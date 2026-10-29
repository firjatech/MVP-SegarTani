'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Store, MapPin, MessageSquare, ArrowLeft, Share2, Star,
  ShoppingCart, ShieldCheck, Check, Package, Loader2,
  ExternalLink
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { cleanImageUrl } from '@/lib/image';

interface StoreData {
  id: string;
  store_name: string;
  store_description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  store_address: string | null;
  store_city: string | null;
  store_province: string | null;
  store_maps_url: string | null;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  discount: number;
  rating: number;
  image: string;
  stock: number;
  description?: string;
  seller_id?: string | null;
}

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/\s/g, '');
};

export default function SellerProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Semua');

  const sellerId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
  const isOfficial = !sellerId || sellerId === 'official';

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        if (isOfficial) {
          // Profil Resmi SegarTani Pusat
          if (!cancelled) setStore({
            id: 'official',
            store_name: 'SegarTani Official',
            store_description: 'Toko resmi pusat SegarTani. Menyediakan aneka sayur-mayur, buah segar, daging, dan bumbu dapur langsung dari petani mitra pilihan dengan standar mutu dan kesegaran 100% terjamin.',
            logo_url: '/images/logo.jpg',
            banner_url: null,
            store_address: 'Kecamatan Candiroto',
            store_city: 'Kabupaten Temanggung',
            store_province: 'Jawa Tengah',
            store_maps_url: null,
            created_at: new Date().toISOString(),
          });

          // Ambil produk pusat (seller_id IS NULL)
          const { data: prods } = await supabase
            .from('products')
            .select('*')
            .is('seller_id', null)
            .order('created_at', { ascending: false });

          if (prods && !cancelled) setProducts(prods);
        } else {
          // Ambil data profil toko
          const { data: storeData } = await supabase
            .from('store_profiles')
            .select('*')
            .eq('id', sellerId)
            .single();

          if (storeData) {
            if (!cancelled) setStore(storeData);
          } else {
            // Fallback jika belum mengisi profil toko lengkap
            if (!cancelled) setStore({
              id: sellerId,
              store_name: 'Mitra Penjual SegarTani',
              store_description: 'Mitra petani dan pedagang resmi di platform SegarTani.',
              logo_url: null,
              banner_url: null,
              store_address: null,
              store_city: 'Indonesia',
              store_province: null,
              store_maps_url: null,
              created_at: new Date().toISOString(),
            });
          }

          // Ambil produk milik penjual ini
          const { data: prods } = await supabase
            .from('products')
            .select('*')
            .eq('seller_id', sellerId)
            .order('created_at', { ascending: false });

          if (prods && !cancelled) setProducts(prods);
        }
      } catch (err) {
        console.error('Error fetching seller profile:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [sellerId, isOfficial]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const categories = ['Semua', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    if (activeCategory === 'Semua') return true;
    return p.category === activeCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm font-bold text-gray-500">Memuat profil penjual...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100">
          <Store size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-black text-gray-900 mb-2">Penjual Tidak Ditemukan</h2>
          <p className="text-gray-500 text-sm mb-6">Toko ini mungkin sudah tidak aktif atau tautan tidak valid.</p>
          <Link href="/ecommerce" className="bg-primary text-white font-bold px-6 py-3 rounded-2xl text-sm inline-block shadow-lg shadow-primary/20">
            Kembali ke Belanja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Top Navigation */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-primary transition-colors py-1 px-2 rounded-xl hover:bg-gray-50"
          >
            <ArrowLeft size={18} />
            <span>Kembali</span>
          </button>
          <span className="text-xs font-black uppercase tracking-wider text-gray-400">Profil Toko Penjual</span>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-primary bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl transition-all"
          >
            {copied ? <Check size={14} className="text-primary" /> : <Share2 size={14} />}
            <span>{copied ? 'Tersalin!' : 'Bagikan'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* Banner & Store Header Card */}
        <div className="bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Banner */}
          <div className="relative h-44 sm:h-56 md:h-64 w-full bg-linear-to-r from-emerald-800 via-teal-900 to-emerald-950 overflow-hidden">
            {store.banner_url ? (
              <Image src={cleanImageUrl(store.banner_url)} alt={store.store_name} fill unoptimized className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <Store size={120} className="text-white" />
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Profile Header Info */}
          <div className="p-6 md:p-8 -mt-16 md:-mt-20 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              {/* Logo / Avatar */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white p-1.5 shadow-xl border-2 border-white overflow-hidden shrink-0 relative">
                <div className="w-full h-full rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center overflow-hidden relative">
                  {store.logo_url ? (
                    <Image src={cleanImageUrl(store.logo_url)} alt={store.store_name} fill unoptimized className="object-cover" />
                  ) : (
                    <Store size={40} className="text-primary" />
                  )}
                </div>
              </div>

              {/* Title & Location */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                    {store.store_name}
                  </h1>
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                    <ShieldCheck size={12} /> Terverifikasi
                  </span>
                </div>
                {(store.store_city || store.store_province) && (
                  <p className="text-xs sm:text-sm font-bold text-gray-500 flex items-center gap-1.5">
                    <MapPin size={14} className="text-emerald-600 shrink-0" />
                    <span>{[store.store_address, store.store_city, store.store_province].filter(Boolean).join(', ')}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={`/chat`}
                className="bg-primary hover:bg-[#008810] text-white font-black px-5 py-3 rounded-2xl text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
              >
                <MessageSquare size={16} />
                <span>Chat Penjual</span>
              </Link>
              {store.store_maps_url && (
                <a
                  href={store.store_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-3 rounded-2xl text-sm flex items-center gap-2 transition-colors"
                >
                  <ExternalLink size={16} />
                  <span className="hidden sm:inline">Lokasi Toko</span>
                </a>
              )}
            </div>
          </div>

          {/* Bio / Description */}
          {store.store_description && (
            <div className="px-6 md:px-8 pb-8 pt-2">
              <div className="bg-gray-50 rounded-2xl p-4 md:p-5 border border-gray-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-1">Tentang Toko</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  {store.store_description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-2">
            <Package size={22} className="text-primary" />
            <h2 className="text-xl md:text-2xl font-black text-gray-900">
              Produk dari {store.store_name}
            </h2>
            <span className="bg-gray-200 text-gray-700 text-xs font-black px-2.5 py-0.5 rounded-full">
              {products.length}
            </span>
          </div>

          {/* Category Filter */}
          {categories.length > 2 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((p) => {
              const discountPrice = p.discount > 0 ? Math.round(p.price * (1 - p.discount / 100)) : p.price;
              const isOutOfStock = p.stock === 0;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 group flex flex-col"
                >
                  <Link href={`/ecommerce/${p.id}`} className="block relative aspect-square w-full bg-gray-50 overflow-hidden">
                    <Image
                      src={cleanImageUrl(p.image)}
                      alt={p.name}
                      fill
                      unoptimized
                      className={`object-cover transition-transform duration-500 ${isOutOfStock ? 'opacity-40' : 'group-hover:scale-105'}`}
                    />
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md">
                          HABIS
                        </span>
                      </div>
                    )}
                    {p.discount > 0 && !isOutOfStock && (
                      <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                        -{p.discount}%
                      </span>
                    )}
                  </Link>

                  <div className="p-4 md:p-5 flex flex-col grow">
                    <div className="flex items-center gap-1 text-yellow-400 mb-1.5">
                      <Star size={12} className="fill-current" />
                      <span className="text-[11px] font-bold text-gray-500 ml-0.5">{Number(p.rating || 5).toFixed(1)}</span>
                      <span className="text-[10px] text-gray-300 ml-auto font-bold">Stok: {p.stock}</span>
                    </div>

                    <Link href={`/ecommerce/${p.id}`}>
                      <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 hover:text-primary transition-colors mb-3">
                        {p.name}
                      </h3>
                    </Link>

                    <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex flex-col">
                        {p.discount > 0 && (
                          <span className="text-[10px] text-gray-400 line-through font-medium">
                            {formatIDR(p.price)}
                          </span>
                        )}
                        <span className="text-base font-black text-primary">
                          {formatIDR(discountPrice)}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart({
                            id: p.id,
                            name: p.name,
                            price: discountPrice,
                            image: p.image,
                            quantity: 1,
                            category: p.category,
                            seller_id: p.seller_id || store.id,
                            seller_name: store.store_name,
                          });
                        }}
                        className={`p-2.5 rounded-xl transition-all ${
                          isOutOfStock
                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                            : 'bg-emerald-50 hover:bg-primary text-emerald-800 hover:text-white shadow-xs'
                        }`}
                        title="Tambah ke Keranjang"
                      >
                        <ShoppingCart size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
            <Package size={48} className="text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-700 mb-1">Belum Ada Produk</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Penjual ini belum menambahkan produk atau stok untuk kategori yang dipilih.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
