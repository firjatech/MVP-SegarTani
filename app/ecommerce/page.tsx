'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Star, ShoppingCart, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import WishlistButton from '@/components/WishlistButton';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  discount: number;
  rating: number;
  image: string;
  stock: number;
}

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/\s/g, '');
};

const ProductSkeleton = () => (
  <div className="bg-white rounded-4xl border border-gray-100 overflow-hidden shadow-sm h-full flex flex-col animate-pulse">
    <div className="relative aspect-square w-full bg-gray-100 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
    </div>
    <div className="p-6 flex flex-col grow">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-4 bg-gray-100 rounded-lg w-12"></div>
        <div className="h-4 bg-gray-100 rounded-lg w-16"></div>
      </div>
      <div className="h-6 bg-gray-100 rounded-xl w-full mb-2"></div>
      <div className="h-6 bg-gray-100 rounded-xl w-2/3 mb-4"></div>
      <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
        <div className="flex flex-col gap-2">
          <div className="h-3 bg-gray-100 rounded-lg w-16"></div>
          <div className="h-6 bg-gray-100 rounded-xl w-24"></div>
        </div>
        <div className="h-12 w-12 bg-gray-100 rounded-2xl"></div>
      </div>
    </div>
  </div>
);

function EcommerceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'Semua');

  const categories = ['Semua', 'Sayuran', 'Buah', 'Daging', 'Bumbu Masak'];

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setProducts(data);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'Semua' || product.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory, products]);

  // Sync to URL
  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams.toString());
    const newParams = new URLSearchParams(searchParams.toString());
    
    if (searchQuery) {
      newParams.set('q', searchQuery);
    } else {
      newParams.delete('q');
    }
    
    if (activeCategory && activeCategory !== 'Semua') {
      newParams.set('category', activeCategory);
    } else {
      newParams.delete('category');
    }

    if (currentParams.toString() !== newParams.toString()) {
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    }
  }, [searchQuery, activeCategory, pathname, router, searchParams]);

  return (
    <div className="bg-white min-h-screen pb-20 font-sans pt-10">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Combined Filter Bar */}
        <div className="max-w-6xl mx-auto py-12 px-0 md:px-6">
          <div className="flex flex-col sm:flex-row items-center bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-md focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300">

            {/* Search Input Part */}
            <div className="relative grow w-full border-b sm:border-b-0 sm:border-r border-gray-100">
              <input
                type="text"
                placeholder="Cari bahan masakan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 md:py-5 focus:outline-none bg-transparent text-gray-800 placeholder-gray-400 font-bold"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary h-6 w-6" />
            </div>

            {/* Category Dropdown Part */}
            <div className="relative w-full sm:w-72 bg-white">
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full appearance-none bg-transparent text-gray-700 py-4 md:py-5 px-6 pr-12 focus:outline-none font-black cursor-pointer text-xs uppercase tracking-wider"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="font-sans normal-case">
                    {cat === 'Semua' ? 'Semua Kategori' : cat}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-primary">
                <ChevronDown size={20} strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading ? (
            // Skeleton Loading Grid
            [...Array(8)].map((_, i) => <ProductSkeleton key={i} />)
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product, index) => {
              const discountPrice = product.price - (product.price * product.discount / 100);
              const isOutOfStock = product.stock <= 0;

              return (
                <div 
                  key={product.id} 
                  className="relative"
                  data-aos="fade-up"
                  data-aos-delay={(index % 4) * 100}
                >
                  <Link 
                    href={isOutOfStock ? '#' : `/ecommerce/${product.id}`}
                    className={`group flex flex-col h-full bg-white rounded-4xl border border-gray-100 hover:border-primary transition-all duration-500 overflow-hidden hover:shadow-2xl ${isOutOfStock ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
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
                        src={product.image}
                        alt={product.name}
                        fill
                        className={`object-cover transition-transform duration-700 ease-in-out ${isOutOfStock ? '' : 'group-hover:scale-110'}`}
                      />
                      <div className="absolute top-5 right-5 flex flex-col items-end gap-2 z-10">
                        <span className="bg-white/90 backdrop-blur-sm text-primary text-[10px] font-black px-3 py-1 rounded-lg border border-primary/20">
                          {product.category}
                        </span>
                        <WishlistButton 
                          product={{
                            id: product.id,
                            name: product.name,
                            price: discountPrice,
                            image: product.image,
                            category: product.category
                          }} 
                        />
                      </div>
                    </div>

                    {/* Details Container */}
                    <div className="p-6 flex flex-col grow">
                      <div className="flex items-center gap-1 text-yellow-400 mb-2">
                        <Star size={14} className="fill-current" />
                        <span className="text-xs font-bold text-gray-400 ml-1">{Number(product.rating || 0).toFixed(1)}</span>
                        <span className="text-[10px] text-gray-300 ml-2 font-bold uppercase tracking-wider">
                          Stok: {product.stock}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 leading-tight mb-4 group-hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                      </h3>

                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
                        <div className="flex flex-col">
                          {product.discount > 0 && (
                            <span className="text-xs text-gray-400 line-through font-medium">
                              {formatIDR(product.price)}
                            </span>
                          )}
                          <span className="text-xl font-black text-primary">
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
                              id: product.id,
                              name: product.name,
                              price: discountPrice,
                              image: product.image,
                              quantity: 1,
                              category: product.category
                            });
                          }}
                          className={`p-3.5 rounded-2xl transition-all shadow-sm ${
                            isOutOfStock 
                              ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                              : 'bg-white border border-gray-100 text-gray-900 hover:bg-primary hover:text-white'
                          }`}
                        >
                          <ShoppingCart size={20} />
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
              <p className="text-gray-400 max-w-sm mx-auto mb-10">
                Maaf, bahan masakan yang Anda cari tidak tersedia.
              </p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setActiveCategory('Semua'); }}
                className="bg-primary text-white px-10 py-4 rounded-full font-bold shadow-xl hover:shadow-primary/30 active:scale-95 transition-all"
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

export default function EcommercePage() {
  return (
    <React.Suspense fallback={
      <div className="bg-white min-h-screen pb-20 font-sans pt-10">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="max-w-6xl mx-auto py-12 px-0 md:px-6">
            <div className="h-16 bg-gray-100 rounded-3xl w-full animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-4xl border border-gray-100 overflow-hidden shadow-sm h-[400px] animate-pulse">
                <div className="aspect-square bg-gray-100"></div>
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                  <div className="h-6 bg-gray-100 rounded w-full"></div>
                  <div className="h-6 bg-gray-100 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <EcommerceContent />
    </React.Suspense>
  );
}
