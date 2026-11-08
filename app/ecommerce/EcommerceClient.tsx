'use client';

import React, { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import { Search, Star, ShoppingCart, ChevronDown, Store } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import WishlistButton from '@/components/WishlistButton';
import { cleanImageUrl } from '@/lib/image';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  discount: number;
  rating: number;
  image: string;
  stock: number;
  seller_id?: string | null;
  seller_name?: string | null;
  seller_city?: string | null;
}

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/\s/g, '');
};

function ProductSkeletonCard() {
  return (
    <div className="flex flex-col h-full bg-white rounded-4xl border border-gray-100 overflow-hidden shadow-xs animate-pulse">
      <div className="aspect-square w-full bg-gray-100" />
      <div className="p-6 flex flex-col grow space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-12 bg-gray-200 rounded" />
          <div className="h-3 w-16 bg-gray-200 rounded" />
        </div>
        <div className="h-4 w-28 bg-gray-200 rounded" />
        <div className="h-5 w-4/5 bg-gray-200 rounded" />
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
          <div className="h-6 w-20 bg-gray-200 rounded" />
          <div className="h-10 w-10 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// Cek sinkron apakah ada sesi login Supabase tersimpan di localStorage browser
function hasSavedAuthSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('-auth-token')) {
        const value = localStorage.getItem(key);
        if (value && value.includes('access_token')) {
          return true;
        }
      }
    }
  } catch {
    return false;
  }
  return false;
}

const emptySubscribe = () => () => {};

interface EcommerceClientProps {
  initialProducts: Product[];
  initialQuery?: string;
  initialCategory?: string;
}

export default function EcommerceClient({
  initialProducts,
  initialQuery = '',
  initialCategory = 'Semua',
}: EcommerceClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const isFirstMount = React.useRef(true);

  // useSyncExternalStore memastikan render pertama di server dan di browser selalu identik (false),
  // sehingga HTML server tetap berisi daftar produk utuh (ISR/LCP) tanpa hydration mismatch.
  // Skeleton hanya muncul setelah hydration jika ada sesi login tersimpan di localStorage.
  const hasStoredSession = useSyncExternalStore(
    emptySubscribe,
    hasSavedAuthSession,
    () => false
  );

  const showSkeleton = hasStoredSession && !authResolved;

  // Ambil user ID yang sedang login untuk menyaring produk toko sendiri
  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    import('@/lib/supabase').then(({ supabase }) => {
      if (!isMounted) return;

      supabase.auth.getSession().then(({ data }) => {
        if (isMounted) {
          setCurrentUserId(data.session?.user?.id ?? null);
          setAuthResolved(true);
        }
      }).catch(() => {
        if (isMounted) {
          setCurrentUserId(null);
          setAuthResolved(true);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (isMounted) {
          setCurrentUserId(session?.user?.id ?? null);
          setAuthResolved(true);
        }
      });

      authSubscription = subscription;
    }).catch(() => {
      if (isMounted) {
        setAuthResolved(true);
      }
    });

    return () => {
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const categories = ['Semua', 'Sayuran', 'Buah', 'Daging', 'Bumbu Masak'];

  // Realtime subscription untuk update produk jika ada perubahan dari penjual.
  // Inisialisasi ditunda 8 detik setelah mount supaya tidak bersaing dengan
  // hidasi awal dan tidak menambah TBT pada window pengukuran Lighthouse.
  useEffect(() => {
    let activeChannel: RealtimeChannel | null = null;
    let isMounted = true;

    const setupRealtime = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        if (!isMounted) return;

        activeChannel = supabase
          .channel('ecommerce-products-realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'products' },
            async () => {
              try {
                const [{ data: productsData }, { data: storesData }] = await Promise.all([
                  supabase.from('products').select('*').order('created_at', { ascending: false }),
                  supabase.from('store_profiles').select('id, store_name, store_city'),
                ]);

                if (productsData && isMounted) {
                  const storeMap = new Map((storesData || []).map((s) => [s.id, s]));
                  const mapped: Product[] = productsData.map((p) => {
                    const store = p.seller_id ? storeMap.get(p.seller_id) : null;
                    return {
                      ...p,
                      image: cleanImageUrl(p.image),
                      seller_name: store?.store_name || 'SegarTani Official',
                      seller_city: store?.store_city || 'Kantor Pusat',
                    };
                  });
                  setProducts(mapped);
                }
              } catch (err) {
                console.error('Realtime sync error:', err);
              }
            }
          )
          .subscribe((status) => {
              if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                // Handled realtime channel status
              }
            });
      } catch (err) {
        console.error('Failed to init realtime channel:', err);
      }
    };

    // Tunda setup realtime 8 detik agar tidak menambah beban JS di awal load
    const realtimeTimer = setTimeout(() => {
      if (isMounted) setupRealtime();
    }, 8000);

    return () => {
      isMounted = false;
      clearTimeout(realtimeTimer);
      if (activeChannel) {
        const channelToClose = activeChannel;
        import('@/lib/supabase').then(({ supabase }) => {
          supabase.removeChannel(channelToClose);
        });
      }
    };
  }, []);

  // Filter Logic: kecualikan produk milik penjual yang sedang login
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'Semua' || product.category === activeCategory;
      const isOwnProduct = Boolean(currentUserId && product.seller_id === currentUserId);
      return matchesSearch && matchesCategory && !isOwnProduct;
    });
  }, [searchQuery, activeCategory, products, currentUserId]);

  // Sync to URL saat filter berubah
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (activeCategory && activeCategory !== 'Semua') params.set('category', activeCategory);

    const qs = params.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    window.history.replaceState(null, '', url);
  }, [searchQuery, activeCategory, pathname]);

  return (
    <div className="bg-white min-h-screen pb-20 font-sans pt-4">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Combined Filter Bar */}
        <div className="max-w-6xl mx-auto pt-3 pb-8 px-0 md:px-6">
          <div className="flex flex-col sm:flex-row items-center bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-md focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300">
            {/* Search Input Part */}
            <div className="relative grow w-full border-b sm:border-b-0 sm:border-r border-gray-100">
              <label htmlFor="search-input" className="sr-only">
                Cari bahan masakan
              </label>
              <input
                id="search-input"
                type="text"
                placeholder="Cari bahan masakan..."
                aria-label="Cari bahan masakan"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 md:py-5 focus:outline-none bg-transparent text-gray-800 placeholder-gray-500 font-bold"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary h-6 w-6" aria-hidden="true" />
            </div>

            {/* Category Dropdown Part */}
            <div className="relative w-full sm:w-72 bg-white">
              <label htmlFor="category-select" className="sr-only">
                Pilih Kategori Produk
              </label>
              <select
                id="category-select"
                aria-label="Pilih Kategori Produk"
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full appearance-none bg-transparent text-gray-800 py-4 md:py-5 px-6 pr-12 focus:outline-none font-black cursor-pointer text-xs uppercase tracking-wider"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="font-sans normal-case">
                    {cat === 'Semua' ? 'Semua Kategori' : cat}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-primary" aria-hidden="true">
                <ChevronDown size={20} strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 min-h-[500px]">
          {showSkeleton ? (
            Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeletonCard key={i} />
            ))
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product, index) => {
              const discountPrice = product.price - (product.price * product.discount) / 100;
              const isOutOfStock = product.stock <= 0;

              return (
                // data-aos hanya untuk kartu ke-5+ (below fold) agar LCP tidak tertunda
                <div
                  key={product.id}
                  className="relative"
                  data-aos={index >= 4 ? 'fade-up' : undefined}
                  data-aos-delay={index >= 4 ? String((index % 4) * 100) : undefined}
                >
                  <Link
                    href={isOutOfStock ? '#' : `/ecommerce/${product.id}`}
                    className={`group flex flex-col h-full bg-white rounded-4xl border border-gray-100 hover:border-primary transition-all duration-500 overflow-hidden hover:shadow-2xl ${
                      isOutOfStock ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                    }`}
                  >
                    {/* Image Container */}
                    <div className="relative aspect-square w-full bg-white flex justify-center items-center overflow-hidden">
                      {product.discount > 0 && (
                        <div className="absolute top-5 left-5 z-10">
                          <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">
                            DISKON {product.discount}%
                          </span>
                        </div>
                      )}

                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                          <span className="bg-red-500 text-white text-xs font-black px-4 py-2 rounded-full shadow-lg transform -rotate-12 border-2 border-white">
                            STOK HABIS
                          </span>
                        </div>
                      )}

                      <Image
                        src={cleanImageUrl(product.image) || '/images/panen-kangkung.png'}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 25vw, 300px"
                        priority={index === 0}
                        loading={index === 0 ? undefined : 'lazy'}
                        fetchPriority={index === 0 ? 'high' : 'auto'}
                        className={`object-cover transition-transform duration-700 ease-in-out ${
                          isOutOfStock ? '' : 'group-hover:scale-110'
                        }`}
                      />
                      <div className="absolute top-5 right-5 flex flex-col items-end gap-2 z-10">
                        <span className="bg-white/90 backdrop-blur-sm text-emerald-850 text-[10px] font-black px-3 py-1 rounded-lg border border-emerald-200 text-emerald-800">
                          {product.category}
                        </span>
                        <WishlistButton
                          product={{
                            id: product.id,
                            name: product.name,
                            price: discountPrice,
                            image: product.image,
                            category: product.category,
                          }}
                        />
                      </div>
                    </div>

                    {/* Details Container */}
                    <div className="p-6 flex flex-col grow">
                      <div className="flex items-center gap-1 text-yellow-500 mb-2">
                        <Star size={14} className="fill-current text-yellow-400" aria-hidden="true" />
                        <span className="text-xs font-bold text-gray-600 ml-1">{Number(product.rating || 0).toFixed(1)}</span>
                        <span className="text-[10px] text-gray-600 ml-2 font-bold uppercase tracking-wider">
                          Stok: {product.stock}
                        </span>
                      </div>

                      {/* Toko / Penjual */}
                      <button
                        type="button"
                        aria-label={`Lihat profil penjual ${product.seller_name || 'SegarTani Official'}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(product.seller_id ? `/seller/${product.seller_id}` : '/seller/official');
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-800 hover:text-emerald-950 font-bold mb-1.5 group/seller text-left w-fit cursor-pointer"
                        title="Klik untuk lihat profil penjual"
                      >
                        <Store size={12} className="shrink-0 text-emerald-600 group-hover/seller:scale-110 transition-transform" aria-hidden="true" />
                        <span className="truncate group-hover/seller:underline decoration-emerald-500 underline-offset-2">
                          {product.seller_name || 'SegarTani Official'}
                        </span>
                      </button>

                      <h3 className="text-lg font-bold text-gray-900 leading-tight mb-4 group-hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                      </h3>

                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
                        <div className="flex flex-col">
                          {product.discount > 0 && (
                            <span className="text-xs text-gray-600 line-through font-medium">
                              {formatIDR(product.price)}
                            </span>
                          )}
                          <span className="text-xl font-black text-primary">{formatIDR(discountPrice)}</span>
                        </div>
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          aria-label={isOutOfStock ? `Stok ${product.name} habis` : `Tambah ${product.name} ke Keranjang`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addToCart({
                              id: product.id,
                              name: product.name,
                              price: discountPrice,
                              image: product.image,
                              quantity: 1,
                              category: product.category,
                              seller_id: product.seller_id,
                              seller_name: product.seller_name || 'SegarTani Official',
                            });
                          }}
                          className={`p-3.5 rounded-2xl transition-all shadow-sm ${
                            isOutOfStock
                              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                              : 'bg-white border border-gray-100 text-gray-900 hover:bg-primary hover:text-white'
                          }`}
                        >
                          <ShoppingCart size={20} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-32 bg-white rounded-5xl border border-dashed border-gray-200">
              <h3 className="text-2xl font-black text-gray-900 mb-2">Produk Tidak Ditemukan</h3>
              <p className="text-gray-600 max-w-sm mx-auto mb-10">
                Maaf, bahan masakan yang Anda cari tidak tersedia.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('Semua');
                }}
                className="bg-primary text-white px-10 py-4 rounded-full font-bold shadow-xl hover:shadow-primary/30 active:scale-95 transition-all cursor-pointer"
              >
                Reset Pencarian
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

