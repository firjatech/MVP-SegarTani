'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { runWhenIdle } from '@/lib/scheduler';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'chat' | 'review' | 'promo' | 'system';
  link?: string;
  is_read: boolean;
  created_at: string;
}

interface NewNotification {
  userId?: string;
  title: string;
  message: string;
  type?: 'order' | 'chat' | 'review' | 'promo' | 'system';
  link?: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (item: NewNotification) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Helper untuk menyimpan ID notifikasi yang sudah dibaca secara lokal
  const getReadLocalIds = useCallback((userId: string): Set<string> => {
    try {
      const data = localStorage.getItem(`segar_read_notifs_${userId}`);
      return data ? new Set(JSON.parse(data)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  }, []);

  const saveReadLocalId = useCallback((userId: string, id: string) => {
    try {
      const set = getReadLocalIds(userId);
      set.add(id);
      localStorage.setItem(`segar_read_notifs_${userId}`, JSON.stringify(Array.from(set)));
    } catch (e) {
      console.error('Failed to save read notif id locally', e);
    }
  }, [getReadLocalIds]);

  const saveAllReadLocalIds = useCallback((userId: string, ids: string[]) => {
    try {
      const set = getReadLocalIds(userId);
      ids.forEach((id) => set.add(id));
      localStorage.setItem(`segar_read_notifs_${userId}`, JSON.stringify(Array.from(set)));
    } catch (e) {
      console.error('Failed to save all read notif ids locally', e);
    }
  }, [getReadLocalIds]);

  const getDeletedLocalIds = useCallback((userId: string): Set<string> => {
    try {
      const data = localStorage.getItem(`segar_deleted_notifs_${userId}`);
      return data ? new Set(JSON.parse(data)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  }, []);

  const saveDeletedLocalId = useCallback((userId: string, id: string) => {
    try {
      const set = getDeletedLocalIds(userId);
      set.add(id);
      localStorage.setItem(`segar_deleted_notifs_${userId}`, JSON.stringify(Array.from(set)));
    } catch (e) {
      console.error('Failed to save deleted notif id locally', e);
    }
  }, [getDeletedLocalIds]);

  // Fetch notifications utama
  const fetchNotifications = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const readLocalIds = getReadLocalIds(userId);
      const deletedLocalIds = getDeletedLocalIds(userId);

      // 1. Coba ambil dari tabel notifications di Supabase
      let dbNotifications: NotificationItem[] = [];
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30);

        if (!error && data) {
          dbNotifications = data.map((item) => ({
            id: String(item.id),
            title: item.title,
            message: item.message,
            type: item.type || 'system',
            link: item.link || undefined,
            is_read: item.is_read || readLocalIds.has(String(item.id)),
            created_at: item.created_at,
          }));
        }
      } catch {
        // Tabel mungkin belum dibuat, kita fallback ke sintetis
      }

      // 2. Ambil update dari orders untuk membuat notifikasi dinamis
      const dynamicNotifs: NotificationItem[] = [];

      try {
        // Cek pesanan sebagai pembeli
        const { data: userOrders } = await supabase
          .from('orders')
          .select('id, status, created_at, total_price')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (userOrders && userOrders.length > 0) {
          userOrders.forEach((ord) => {
            let statusTitle = `Pesanan #${ord.id}`;
            let statusMsg = `Pesanan Anda #${ord.id} telah tercatat dan sedang menunggu konfirmasi.`;

            if (ord.status === 'processing') {
              statusTitle = `Pesanan #${ord.id} Sedang Diproses`;
              statusMsg = `Penjual sedang menyiapkan pesanan segar Anda.`;
            } else if (ord.status === 'shipped') {
              statusTitle = `Pesanan #${ord.id} Dalam Pengiriman`;
              statusMsg = `Pesanan Anda sedang diantar oleh kurir ke alamat tujuan.`;
            } else if (ord.status === 'completed') {
              statusTitle = `Pesanan #${ord.id} Selesai`;
              statusMsg = `Pesanan telah tiba! Yuk berikan ulasan produk agar petani semakin semangat.`;
            } else if (ord.status === 'cancelled') {
              statusTitle = `Pesanan #${ord.id} Dibatalkan`;
              statusMsg = `Pesanan #${ord.id} telah dibatalkan. Hubungi penjual jika ada pertanyaan.`;
            }

            const notifId = `ord-${ord.id}-${ord.status}`;
            dynamicNotifs.push({
              id: notifId,
              title: statusTitle,
              message: statusMsg,
              type: 'order',
              link: `/orders`,
              is_read: readLocalIds.has(notifId),
              created_at: ord.created_at || new Date().toISOString(),
            });
          });
        }
      } catch {
        // Abaikan jika tabel orders error
      }

      // 3. Notifikasi sistem & sambutan default
      const welcomeId = `system-welcome-${userId}`;
      const promoId = `system-promo-organic`;
      
      const systemNotifs: NotificationItem[] = [
        {
          id: promoId,
          title: 'Panen Segar Hari Ini 🥬',
          message: 'Dapatkan sayur & buah organik langsung dari kebun petani lokal dengan harga terbaik!',
          type: 'promo',
          link: '/ecommerce',
          is_read: readLocalIds.has(promoId),
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: welcomeId,
          title: 'Selamat Datang di SegarTani! 🌾',
          message: 'Akun Anda aktif. Mulai belanja produk pertanian organik segar langsung dari petani.',
          type: 'system',
          link: '/ecommerce',
          is_read: readLocalIds.has(welcomeId),
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
      ];

      // Gabungkan semua notifikasi, prioritaskan Supabase DB jika ada
      const allNotifsMap = new Map<string, NotificationItem>();

      // Masukkan sistem notif dulu
      systemNotifs.forEach((n) => allNotifsMap.set(n.id, n));

      // Masukkan notifikasi pesanan
      dynamicNotifs.forEach((n) => allNotifsMap.set(n.id, n));

      // Masukkan database notifikasi (menimpa jika id sama)
      dbNotifications.forEach((n) => allNotifsMap.set(n.id, n));

      // Filter yang sudah dihapus oleh user
      const finalList = Array.from(allNotifsMap.values())
        .filter((n) => !deletedLocalIds.has(n.id))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(finalList);
      setUnreadCount(finalList.filter((n) => !n.is_read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [getReadLocalIds, getDeletedLocalIds]);

  // Auth & Realtime Listener
  useEffect(() => {
    let cancelIdle: (() => void) | undefined;

    supabase.auth.getSession().then(({ data }) => {
      const user = data?.session?.user;
      if (user) {
        setCurrentUserId(user.id);
        cancelIdle = runWhenIdle(() => fetchNotifications(user.id), 1500);
      } else {
        setCurrentUserId(null);
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (user) {
        setCurrentUserId(user.id);
        cancelIdle = runWhenIdle(() => fetchNotifications(user.id), 1500);
      } else {
        setCurrentUserId(null);
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
      }
    });

    // Realtime channel untuk tabel notifications
    const channel = supabase
      .channel('notif-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          if (currentUserId) fetchNotifications(currentUserId);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          if (currentUserId) fetchNotifications(currentUserId);
        }
      )
      .subscribe();

    return () => {
      cancelIdle?.();
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchNotifications]);

  // Tandai satu notifikasi sebagai dibaca
  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    if (currentUserId) {
      saveReadLocalId(currentUserId, id);

      // Coba update ke Supabase jika ID adalah UUID (dari database)
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id)
          .eq('user_id', currentUserId);
      } catch {
        // Fallback lokal sudah ditangani
      }
    }
  };

  // Tandai SEMUA notifikasi sebagai dibaca
  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    if (currentUserId) {
      saveAllReadLocalIds(
        currentUserId,
        notifications.map((n) => n.id)
      );

      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', currentUserId);
      } catch {
        // Fallback lokal sudah ditangani
      }
    }
  };

  // Hapus satu notifikasi
  const deleteNotification = async (id: string) => {
    const itemToDelete = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (itemToDelete && !itemToDelete.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    if (currentUserId) {
      saveDeletedLocalId(currentUserId, id);

      try {
        await supabase
          .from('notifications')
          .delete()
          .eq('id', id)
          .eq('user_id', currentUserId);
      } catch {
        // Fallback lokal sudah ditangani
      }
    }
  };

  // Tambah notifikasi baru secara programatik
  const addNotification = async (item: NewNotification) => {
    const targetUserId = item.userId || currentUserId;
    if (!targetUserId) return;

    const newNotif: NotificationItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title: item.title,
      message: item.message,
      type: item.type || 'system',
      link: item.link,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setUnreadCount((prev) => prev + 1);

    try {
      await supabase.from('notifications').insert({
        id: newNotif.id,
        user_id: targetUserId,
        title: newNotif.title,
        message: newNotif.message,
        type: newNotif.type,
        link: newNotif.link,
        is_read: false,
      });
    } catch {
      // Local state sudah ditambahkan
    }
  };

  const refreshNotifications = async () => {
    if (currentUserId) {
      await fetchNotifications(currentUserId);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        addNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

