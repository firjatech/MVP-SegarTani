'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ChevronRight,
  BellOff,
  ExternalLink,
} from 'lucide-react';
import { useNotifications, NotificationItem } from '@/context/NotificationContext';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  align?: 'right' | 'left';
}

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Baru saja';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} mnt lalu`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} jam lalu`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Kemarin';
  if (diffInDays < 7) return `${diffInDays} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

const getNotificationIcon = (type: NotificationItem['type']) => {
  switch (type) {
    case 'order':
      return {
        icon: Package,
        color: 'text-primary bg-primary/10 border-primary/20',
      };
    case 'chat':
      return {
        icon: MessageSquare,
        color: 'text-blue-600 bg-blue-50 border-blue-200',
      };
    case 'review':
      return {
        icon: Star,
        color: 'text-amber-600 bg-amber-50 border-amber-200',
      };
    case 'promo':
      return {
        icon: Sparkles,
        color: 'text-purple-600 bg-purple-50 border-purple-200',
      };
    default:
      return {
        icon: Info,
        color: 'text-gray-600 bg-gray-100 border-gray-200',
      };
  }
};

export default function NotificationDropdown({
  isOpen,
  onClose,
  align = 'right',
}: NotificationDropdownProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const displayedNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
    if (notif.link) {
      onClose();
      router.push(notif.link);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={`absolute top-full mt-2 w-[340px] sm:w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          style={{ maxHeight: '85vh' }}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                  <Bell size={18} />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Notifikasi</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-sm">
                    {unreadCount} baru
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-emerald-700 transition-colors bg-primary/5 hover:bg-primary/10 px-2.5 py-1.5 rounded-lg"
                  title="Tandai semua sudah dibaca"
                >
                  <CheckCheck size={14} />
                  <span>Tandai dibaca</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 p-1 bg-gray-100/80 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeTab === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Semua ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeTab === 'unread'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Belum Dibaca ({unreadCount})
              </button>
            </div>
          </div>

          {/* List Notifikasi */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50">
            {displayedNotifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400">
                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-300">
                  <BellOff size={26} />
                </div>
                <p className="font-bold text-gray-700 text-sm mb-1">
                  {activeTab === 'unread'
                    ? 'Semua notifikasi sudah dibaca'
                    : 'Belum ada notifikasi'}
                </p>
                <p className="text-xs text-gray-400 max-w-[220px]">
                  Informasi seputar pesanan, promo panen, dan pesan chat akan muncul di sini.
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => {
                const { icon: IconComponent, color: iconStyle } =
                  getNotificationIcon(notif.type);

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`group relative p-3.5 transition-all flex items-start gap-3 cursor-pointer ${
                      notif.is_read
                        ? 'bg-white hover:bg-gray-50/80 opacity-80'
                        : 'bg-emerald-50/40 hover:bg-emerald-50/70'
                    }`}
                  >
                    {/* Unread indicator bar */}
                    {!notif.is_read && (
                      <span className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full" />
                    )}

                    {/* Icon */}
                    <div
                      className={`p-2 rounded-xl border flex-shrink-0 mt-0.5 ${iconStyle}`}
                    >
                      <IconComponent size={18} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4
                          className={`text-xs truncate ${
                            notif.is_read
                              ? 'font-semibold text-gray-700'
                              : 'font-bold text-gray-900'
                          }`}
                        >
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                          {formatRelativeTime(notif.created_at)}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed mb-1.5">
                        {notif.message}
                      </p>

                      {notif.link && (
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-primary group-hover:underline">
                          <span>Buka halaman</span>
                          <ExternalLink size={10} />
                        </div>
                      )}
                    </div>

                    {/* Delete button on hover */}
                    <button
                      type="button"
                      aria-label="Hapus notifikasi"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all self-center"
                      title="Hapus notifikasi"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-50/80 border-t border-gray-100 text-center">
            <Link
              href="/notifications"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:text-emerald-700 transition-colors w-full py-1.5"
            >
              <span>Buka Pusat Notifikasi Lengkap</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

