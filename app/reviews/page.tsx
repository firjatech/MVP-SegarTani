'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Star,
  ShoppingBag,
  ArrowLeft,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductInfo {
  id: number;
  name: string;
  image: string;
  price: number;
  seller_id?: string;
}

interface ReviewItem {
  id: number;
  product_id: number;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  products?: ProductInfo | null;
}

interface PendingItem {
  order_id: string;
  product_id: number;
  product_name: string;
  price_at_purchase: number;
  image_url: string;
  order_date: string;
}

export default function BuyerReviewsPage() {
  const [activeTab, setActiveTab] = useState<'reviewed' | 'pending'>('reviewed');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Pembeli');

  // Modal State for Writing/Editing Review
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [modalProduct, setModalProduct] = useState<{ id: number; name: string; image: string } | null>(null);
  const [formRating, setFormRating] = useState<number>(5);
  const [formHoverRating, setFormHoverRating] = useState<number>(0);
  const [formComment, setFormComment] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  useEffect(() => {
    let ignore = false;

    // Safety timeout: jika Supabase tidak merespons dalam 8 detik
    const safetyTimer = setTimeout(() => {
      if (!ignore) {
        setLoading(false);
        setLoadError('Koneksi lambat atau gagal. Coba refresh halaman.');
      }
    }, 8000);

    async function loadData() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          if (!ignore) {
            setLoading(false);
            if (authError) setLoadError('Sesi Anda telah berakhir. Silakan login kembali.');
          }
          return;
        }

        if (!ignore) {
          setUserId(user.id);
          const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pembeli';
          setUserName(name);
        }

        // 1. Fetch user's reviews
        const { data: reviewsData, error: reviewsErr } = await supabase
          .from('reviews')
          .select('*, products(id, name, image, price)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!reviewsErr && !ignore) {
          setReviews((reviewsData as unknown as ReviewItem[]) || []);
        }

        // 2. Fetch completed orders to find pending review items
        const { data: ordersData, error: ordersErr } = await supabase
          .from('orders')
          .select('id, created_at, status, order_items(product_id, product_name, price_at_purchase, image_url)')
          .eq('user_id', user.id);

        if (!ordersErr && ordersData && !ignore) {
          const reviewedProductIds = new Set((reviewsData || []).map((r: { product_id: number }) => r.product_id));
          const pending: PendingItem[] = [];

          ordersData.forEach((order: { id: string; created_at: string; order_items?: Array<{ product_id: number; product_name: string; price_at_purchase: number; image_url: string }> }) => {
            if (order.order_items) {
              order.order_items.forEach(item => {
                if (item.product_id && !reviewedProductIds.has(item.product_id)) {
                  if (!pending.some(p => p.product_id === item.product_id)) {
                    pending.push({
                      order_id: order.id,
                      product_id: item.product_id,
                      product_name: item.product_name,
                      price_at_purchase: item.price_at_purchase,
                      image_url: item.image_url || '/placeholder.png',
                      order_date: order.created_at,
                    });
                  }
                }
              });
            }
          });

          setPendingItems(pending);
        }
      } catch (err) {
        console.error('Unexpected error loading reviews:', err);
        if (!ignore) setLoadError('Terjadi kesalahan. Silakan coba lagi.');
      } finally {
        clearTimeout(safetyTimer);
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
      clearTimeout(safetyTimer);
    };
  }, [refreshKey]);

  // Open modal to create a new review for a product
  const handleOpenCreateModal = (product: { id: number; name: string; image: string }) => {
    setEditingReviewId(null);
    setModalProduct(product);
    setFormRating(5);
    setFormComment('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Open modal to edit existing review
  const handleOpenEditModal = (review: ReviewItem) => {
    setEditingReviewId(review.id);
    setModalProduct({
      id: review.product_id,
      name: review.products?.name || 'Produk',
      image: review.products?.image || '/placeholder.png',
    });
    setFormRating(review.rating);
    setFormComment(review.comment || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Submit Review Form
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !modalProduct) return;

    if (!formComment.trim()) {
      setErrorMsg('Mohon tuliskan ulasan Anda mengenai produk ini.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingReviewId) {
        // Update existing review
        const { error } = await supabase
          .from('reviews')
          .update({
            rating: formRating,
            comment: formComment.trim(),
          })
          .eq('id', editingReviewId)
          .eq('user_id', userId);

        if (error) throw error;
        showToast('Ulasan berhasil diperbarui!');
      } else {
        // Insert new review
        const { error } = await supabase
          .from('reviews')
          .insert({
            product_id: modalProduct.id,
            user_id: userId,
            user_name: userName,
            rating: formRating,
            comment: formComment.trim(),
          });

        if (error) throw error;
        showToast('Terima kasih! Ulasan berhasil dikirim.');
      }

      setIsModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Gagal menyimpan ulasan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Review
  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus ulasan ini?')) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', userId);

      if (error) throw error;
      showToast('Ulasan telah dihapus.');
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      const error = err as Error;
      alert('Gagal menghapus ulasan: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold text-sm">Memuat Ulasan Anda...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4 text-center p-6 max-w-sm">
          <AlertCircle size={48} className="text-red-400" />
          <h2 className="text-lg font-black text-gray-800">Gagal Memuat Ulasan</h2>
          <p className="text-sm text-gray-500 font-medium">{loadError}</p>
          <button
            onClick={() => { setLoadError(null); setLoading(true); setRefreshKey(k => k + 1); }}
            className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-sm shadow-md hover:bg-primary-dark transition-all cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-8 pb-20 font-sans">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        {/* Toast Notification */}
        <AnimatePresence>
          {successToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm"
            >
              <CheckCircle2 size={18} />
              {successToast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back Link & Title */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-primary font-bold text-sm transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Kembali ke Profil
          </Link>
          <Link
            href="/orders"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5"
          >
            <ShoppingBag size={14} /> Pesanan Saya
          </Link>
        </div>

        {/* Header Hero */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner">
              <Star size={28} className="fill-amber-400 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Ulasan Saya</h1>
              <p className="text-xs font-bold text-gray-400 mt-0.5">
                Bagikan pengalaman belanja Anda untuk membantu pembeli lain
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('reviewed')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                activeTab === 'reviewed'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Sudah Diulas ({reviews.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer relative ${
                activeTab === 'pending'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Menunggu Ulasan ({pendingItems.length})
              {pendingItems.length > 0 && (
                <span className="w-2 h-2 bg-amber-500 rounded-full absolute top-2 right-2"></span>
              )}
            </button>
          </div>
        </div>

        {/* TAB 1: SUDAH DIULAS */}
        {activeTab === 'reviewed' && (
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Star size={32} />
                </div>
                <h3 className="text-lg font-black text-gray-800 mb-1">Belum Ada Ulasan</h3>
                <p className="text-xs font-bold text-gray-400 max-w-sm mx-auto mb-6">
                  Anda belum pernah memberikan ulasan produk. Belanja produk organik segar dan bagikan pengalaman Anda!
                </p>
                <Link
                  href="/ecommerce"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black text-xs shadow-lg transition-all"
                >
                  <ShoppingBag size={16} /> Mulai Belanja
                </Link>
              </div>
            ) : (
              reviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-50">
                    {/* Product Preview */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 relative shrink-0">
                        {review.products?.image ? (
                          <Image
                            src={review.products.image}
                            alt={review.products.name || 'Produk'}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ShoppingBag size={20} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-gray-900 leading-snug">
                          {review.products?.name || `Produk #${review.product_id}`}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-bold text-gray-400">
                            {new Date(review.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                          {review.products?.id && (
                            <Link
                              href={`/ecommerce/${review.products.id}`}
                              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                            >
                              Lihat Produk <ExternalLink size={10} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(review)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-primary/10 text-gray-600 hover:text-primary rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="Edit Ulasan"
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(review.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="Hapus Ulasan"
                      >
                        <Trash2 size={14} /> Hapus
                      </button>
                    </div>
                  </div>

                  {/* Rating Stars & Comment */}
                  <div className="pt-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={
                            star <= review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-200 fill-gray-100'
                          }
                        />
                      ))}
                      <span className="text-xs font-black text-gray-700 ml-1.5">
                        {review.rating}.0 / 5.0
                      </span>
                    </div>

                    <p className="text-sm font-medium text-gray-700 leading-relaxed bg-gray-50/60 p-4 rounded-2xl border border-gray-50">
                      {review.comment}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: MENUNGGU ULASAN */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingItems.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-black text-gray-800 mb-1">Semua Produk Sudah Diulas!</h3>
                <p className="text-xs font-bold text-gray-400 max-w-sm mx-auto mb-6">
                  Hebat! Anda tidak memiliki produk yang menunggu ulasan saat ini.
                </p>
                <Link
                  href="/ecommerce"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black text-xs shadow-lg transition-all"
                >
                  <ShoppingBag size={16} /> Belanja Produk Lainnya
                </Link>
              </div>
            ) : (
              pendingItems.map((item) => (
                <motion.div
                  key={`${item.order_id}-${item.product_id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 relative shrink-0">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.product_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ShoppingBag size={24} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-gray-900 leading-snug">
                        {item.product_name}
                      </h4>
                      <p className="text-xs font-bold text-primary mt-1">
                        Rp {item.price_at_purchase.toLocaleString('id-ID')}
                      </p>
                      <span className="text-[11px] font-bold text-gray-400 mt-1 flex items-center gap-1">
                        <Clock size={12} />
                        Dipesan pada {new Date(item.order_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleOpenCreateModal({
                        id: item.product_id,
                        name: item.product_name,
                        image: item.image_url,
                      })
                    }
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Star size={16} className="fill-white" /> Tulis Ulasan
                  </button>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* MODAL: FORM TULIS / EDIT ULASAN */}
        <AnimatePresence>
          {isModalOpen && modalProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-xl transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>

                {/* Modal Title */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                  <h3 className="text-lg font-black text-gray-900">
                    {editingReviewId ? 'Edit Ulasan Anda' : 'Tulis Ulasan Produk'}
                  </h3>
                </div>

                {/* Product Summary */}
                <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white relative border border-gray-200 shrink-0">
                    {modalProduct.image ? (
                      <Image
                        src={modalProduct.image}
                        alt={modalProduct.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ShoppingBag size={18} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h5 className="font-black text-sm text-gray-900 leading-tight">
                      {modalProduct.name}
                    </h5>
                    <span className="text-[11px] font-bold text-gray-400">
                      Kualitas Produk Organik
                    </span>
                  </div>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3.5 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitReview} className="space-y-6">
                  {/* Rating Selector */}
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 text-center">
                      Beri Nilai Produk
                    </label>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setFormHoverRating(star)}
                          onMouseLeave={() => setFormHoverRating(0)}
                          onClick={() => setFormRating(star)}
                          className="p-1.5 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                        >
                          <Star
                            size={32}
                            className={
                              star <= (formHoverRating || formRating)
                                ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                                : 'text-gray-200 fill-gray-100'
                            }
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-center text-xs font-black text-amber-600 mt-2">
                      {formRating === 5 && '🌟 Sangat Puas! Kualitas Terbaik'}
                      {formRating === 4 && '👍 Puas, Sesuai Harapan'}
                      {formRating === 3 && '👌 Cukup Baik'}
                      {formRating === 2 && '👎 Kurang Memuaskan'}
                      {formRating === 1 && '⚠️ Sangat Kecewa'}
                    </p>
                  </div>

                  {/* Comment Textarea */}
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                      Ulasan & Komentar
                    </label>
                    <textarea
                      rows={4}
                      value={formComment}
                      onChange={(e) => setFormComment(e.target.value)}
                      placeholder="Ceritakan kesegaran sayur/buah, kecepatan pengemasan, atau kepuasan Anda..."
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-primary text-sm font-medium text-gray-800 placeholder-gray-400 transition-colors resize-none"
                    />
                  </div>

                  {/* Submit Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black text-xs rounded-2xl transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-3.5 bg-primary hover:bg-primary-dark text-white font-black text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Menyimpan...
                        </>
                      ) : editingReviewId ? (
                        'Perbarui Ulasan'
                      ) : (
                        'Kirim Ulasan'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
