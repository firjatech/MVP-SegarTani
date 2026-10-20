'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Star,
  ArrowLeft,
  Search,
  CheckCircle2,
  Package,
  Store,
  ExternalLink,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface ProductInfo {
  id: number;
  name: string;
  image: string;
  price: number;
  seller_id?: string;
}

interface SellerReview {
  id: number;
  product_id: number;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  products?: ProductInfo | null;
}

export default function SellerReviewsPage() {
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState('Toko Saya');
  const [selectedFilter, setSelectedFilter] = useState<'all' | '5' | '4' | '3' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadSellerReviews() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (!ignore) setLoading(false);
          return;
        }

        // Fetch store name
        const { data: storeData } = await supabase
          .from('store_profiles')
          .select('store_name')
          .eq('id', user.id)
          .maybeSingle();

        if (storeData?.store_name && !ignore) {
          setStoreName(storeData.store_name);
        }

        // Fetch reviews for products belonging to this seller
        // Using products!inner join to filter by seller_id
        const { data: sellerReviewsData, error: reviewsErr } = await supabase
          .from('reviews')
          .select('*, products!inner(id, name, image, price, seller_id)')
          .eq('products.seller_id', user.id)
          .order('created_at', { ascending: false });

        if (reviewsErr) {
          console.error('Error fetching seller reviews:', reviewsErr);
        } else if (!ignore) {
          setReviews((sellerReviewsData as unknown as SellerReview[]) || []);
        }
      } catch (err) {
        console.error('Unexpected error loading seller reviews:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadSellerReviews();

    return () => {
      ignore = true;
    };
  }, []);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return {
        avgRating: 0,
        totalReviews: 0,
        starCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        starPercentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        positivePercentage: 0,
      };
    }

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    reviews.forEach((r) => {
      sum += r.rating;
      if (r.rating in counts) {
        counts[r.rating as keyof typeof counts] += 1;
      }
    });

    const avg = Number((sum / total).toFixed(1));
    const positiveCount = counts[5] + counts[4];
    const positivePct = Math.round((positiveCount / total) * 100);

    const percentages = {
      5: Math.round((counts[5] / total) * 100),
      4: Math.round((counts[4] / total) * 100),
      3: Math.round((counts[3] / total) * 100),
      2: Math.round((counts[2] / total) * 100),
      1: Math.round((counts[1] / total) * 100),
    };

    return {
      avgRating: avg,
      totalReviews: total,
      starCounts: counts,
      starPercentages: percentages,
      positivePercentage: positivePct,
    };
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Star Filter
      if (selectedFilter === '5' && r.rating !== 5) return false;
      if (selectedFilter === '4' && r.rating !== 4) return false;
      if (selectedFilter === '3' && r.rating !== 3) return false;
      if (selectedFilter === 'low' && r.rating > 2) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesUser = r.user_name.toLowerCase().includes(query);
        const matchesProduct = r.products?.name?.toLowerCase().includes(query);
        const matchesComment = r.comment?.toLowerCase().includes(query);
        if (!matchesUser && !matchesProduct && !matchesComment) return false;
      }

      return true;
    });
  }, [reviews, selectedFilter, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold text-sm">Memuat Ulasan Toko...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-8 pb-20 font-sans">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Top Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-primary font-bold text-sm transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Kembali ke Dashboard
          </Link>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5">
            <Store size={14} /> {storeName}
          </span>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3">
            <span>⭐</span> Ulasan & Penilaian Pelanggan
          </h1>
          <p className="text-sm font-bold text-gray-400 mt-1">
            Pantau kepuasan pelanggan, ulasan produk, dan feedback kualitas dari pembeli toko Anda
          </p>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Rata-Rata Rating */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Kepuasan Pelanggan
            </span>
            <div className="flex items-baseline gap-3 my-4">
              <span className="text-5xl font-black text-gray-900">
                {stats.avgRating > 0 ? stats.avgRating : '0.0'}
              </span>
              <span className="text-lg font-bold text-gray-400">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={20}
                  className={
                    star <= Math.round(stats.avgRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-200 fill-gray-100'
                  }
                />
              ))}
            </div>
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> {stats.positivePercentage}% ulasan positif (Bintang 4 & 5)
            </p>
          </div>

          {/* Card 2: Total Ulasan & Ringkasan */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Total Ulasan Masuk
            </span>
            <div className="my-4">
              <span className="text-5xl font-black text-primary">
                {stats.totalReviews}
              </span>
              <span className="text-sm font-bold text-gray-500 ml-2">Ulasan Diterima</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-600 font-medium leading-relaxed">
              💡 <span className="font-bold">Tips Penjual:</span> Ulasan bintang 5 meningkatkan kepercayaan pembeli dan menaikkan peluang transaksi hingga 80%.
            </div>
          </div>

          {/* Card 3: Distribusi Bintang (Bar Chart) */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">
              Distribusi Bintang
            </span>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const pct = stats.starPercentages[star as keyof typeof stats.starPercentages] || 0;
                const count = stats.starCounts[star as keyof typeof stats.starCounts] || 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs font-bold">
                    <span className="w-6 text-gray-600 text-right flex items-center gap-0.5 justify-end">
                      {star} <Star size={10} className="fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                    <span className="w-10 text-gray-400 text-right">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CONTROLS: FILTERS & SEARCH */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Star Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Semua ({stats.totalReviews})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('5')}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                selectedFilter === '5'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              5 Bintang ({stats.starCounts[5]})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('4')}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                selectedFilter === '4'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              4 Bintang ({stats.starCounts[4]})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('3')}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                selectedFilter === '3'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              3 Bintang ({stats.starCounts[3]})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('low')}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                selectedFilter === 'low'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              1-2 Bintang ({stats.starCounts[1] + stats.starCounts[2]})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pembeli / produk..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* REVIEWS LIST */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star size={32} />
              </div>
              <h3 className="text-lg font-black text-gray-800 mb-1">
                {reviews.length === 0 ? 'Belum Ada Ulasan Diterima' : 'Tidak Ada Ulasan yang Cocok'}
              </h3>
              <p className="text-xs font-bold text-gray-400 max-w-sm mx-auto mb-6">
                {reviews.length === 0
                  ? 'Produk Anda belum memiliki ulasan dari pembeli. Tingkatkan kualitas produk dan pengiriman untuk mendapat ulasan bintang 5!'
                  : 'Coba ubah filter bintang atau kata kunci pencarian Anda.'}
              </p>
              {reviews.length === 0 && (
                <Link
                  href="/admin/products"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black text-xs shadow-lg transition-all"
                >
                  <Package size={16} /> Kelola Produk Anda
                </Link>
              )}
            </div>
          ) : (
            filteredReviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header: User & Rating */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-black text-sm flex items-center justify-center">
                      {review.user_name ? review.user_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-gray-900 leading-tight">
                        {review.user_name || 'Pembeli SegarTani'}
                      </h4>
                      <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock size={12} />
                        {new Date(review.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Rating Stars Badge */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={
                            star <= review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-200 fill-gray-100'
                          }
                        />
                      ))}
                      <span className="text-xs font-black text-amber-700 ml-1">
                        {review.rating}.0
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body: Product Info & Comment */}
                <div className="pt-4 space-y-3">
                  {/* Product Mini Bar */}
                  {review.products && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-2xl border border-gray-100">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-white relative border border-gray-200 shrink-0">
                        {review.products.image ? (
                          <Image
                            src={review.products.image}
                            alt={review.products.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Package size={16} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-gray-900 truncate">
                          {review.products.name}
                        </p>
                        <p className="text-[11px] font-bold text-primary">
                          Rp {review.products.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <Link
                        href={`/ecommerce/${review.products.id}`}
                        className="text-xs font-bold text-gray-400 hover:text-primary p-2 transition-colors"
                        title="Buka Produk di Toko"
                      >
                        <ExternalLink size={16} />
                      </Link>
                    </div>
                  )}

                  {/* Comment */}
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                    <p className="text-sm font-medium text-gray-800 leading-relaxed">
                      &quot;{review.comment}&quot;
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
