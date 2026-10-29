'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Package,
  MessageSquare,
  Star,
  Sparkles,
  Info,
  CheckCheck,
  Trash2,
  ArrowLeft,
  Search,
  Check,
  RefreshCw,
  BellOff,
  ExternalLink,
} from 'lucide-react';
import { useNotifications, NotificationItem } from '@/context/NotificationContext';

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshNotifications();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'order':
        return {
          icon: Package,
          label: 'Pesanan',
          color: 'text-primary bg-primary/10 border-primary/20',
        };
      case 'chat':
        return {
          icon: MessageSquare,
          label: 'Pesan Chat',
          color: 'text-blue-600 bg-blue-50 border-blue-200',
        };
      case 'review':
        return {
          icon: Star,
          label: 'Ulasan',
          color: 'text-amber-600 bg-amber-50 border-amber-200',
        };
      case 'promo':
        return {
          icon: Sparkles,
          label: 'Promo Panen',
          color: 'text-purple-600 bg-purple-50 border-purple-200',
        };
      default:
        return {
          icon: Info,
          label: 'Sistem',
          color: 'text-gray-600 bg-gray-100 border-gray-200',
        };
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    // Filter kategori
    if (activeCategory !== 'all' && notif.type !== activeCategory) {
      return false;
    }
    // Filter status baca
    if (filterRead === 'unread' && notif.is_read) return false;
    if (filterRead === 'read' && !notif.is_read) return false;
    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        notif.title.toLowerCase().includes(q) ||
        notif.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const categories = [
    { id: 'all', label: 'Semua' },
    { id: 'order', label: 'Pesanan' },
    { id: 'chat', label: 'Chat' },
    { id: 'promo', label: 'Promo' },
    { id: 'system', label: 'Info Sistem' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pt-12 pb-24 font-sans">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
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
            Kembali ke Katalog
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-4">
              <div className="bg-primary p-3 rounded-2xl text-white shadow-lg shadow-primary/20">
                <Bell size={28} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black text-gray-900">
                    Pusat Notifikasi
                  </h1>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-sm animate-pulse">
                      {unreadCount} Baru
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-500 mt-1">
                  Pantau status transaksi, info produk panen segar, dan pesan terbaru
                </p>
              </div>
            </div>

            {/* Top Quick Actions */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:text-primary rounded-xl transition-all shadow-sm hover:shadow"
                title="Segarkan Notifikasi"
              >
                <RefreshCw
                  size={16}
                  className={isRefreshing ? 'animate-spin' : ''}
                />
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-emerald-700 transition-all"
                >
                  <CheckCheck size={16} />
                  <span>Tandai Semua Dibaca</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Filters & Search Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari notifikasi..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>

            {/* Read / Unread Status Filter */}
            <div className="flex items-center gap-1.5 self-start md:self-auto w-full md:w-auto">
              <button
                type="button"
                onClick={() => setFilterRead('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterRead === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterRead('unread')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterRead === 'unread'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Belum Dibaca ({unreadCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterRead('read')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterRead === 'read'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Sudah Dibaca
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-emerald-50 text-primary border border-primary/30'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <RefreshCw size={24} className="animate-spin mx-auto text-primary mb-3" />
            <p className="text-sm font-semibold text-gray-500">Memuat notifikasi...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
              <BellOff size={32} />
            </div>
            <h3 className="font-bold text-gray-800 text-base mb-1">
              Tidak ada notifikasi yang sesuai
            </h3>
            <p className="text-xs text-gray-400 max-w-sm mb-6">
              {searchQuery || activeCategory !== 'all' || filterRead !== 'all'
                ? 'Coba ganti filter atau kata kunci pencarian Anda.'
                : 'Saat ini belum ada pemberitahuan baru untuk akun Anda.'}
            </p>
            {(searchQuery || activeCategory !== 'all' || filterRead !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                  setFilterRead('all');
                }}
                className="text-xs font-bold text-primary hover:underline"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredNotifications.map((notif) => {
                const { icon: IconComp, label: catLabel, color: iconStyle } =
                  getNotificationIcon(notif.type);

                return (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`group relative bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-sm hover:shadow-md ${
                      notif.is_read
                        ? 'border-gray-100'
                        : 'border-emerald-200 bg-emerald-50/20'
                    }`}
                  >
                    {!notif.is_read && (
                      <span className="absolute left-0 top-4 bottom-4 w-1 bg-primary rounded-r-full" />
                    )}

                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`p-3 rounded-2xl border flex-shrink-0 ${iconStyle}`}
                      >
                        <IconComp size={22} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                              {catLabel}
                            </span>
                            {!notif.is_read && (
                              <span className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <span className="text-xs text-gray-400 font-medium">
                            {new Date(notif.created_at).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <h3
                          className={`text-sm sm:text-base mb-1 ${
                            notif.is_read
                              ? 'font-semibold text-gray-800'
                              : 'font-bold text-gray-950'
                          }`}
                        >
                          {notif.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
                          {notif.message}
                        </p>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
                          {notif.link && (
                            <Link
                              href={notif.link}
                              onClick={() => markAsRead(notif.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-emerald-700 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <span>Lihat Detail</span>
                              <ExternalLink size={12} />
                            </Link>
                          )}

                          {!notif.is_read && (
                            <button
                              type="button"
                              onClick={() => markAsRead(notif.id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <Check size={14} />
                              <span>Tandai sudah dibaca</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => deleteNotification(notif.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-500 ml-auto px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={13} />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

