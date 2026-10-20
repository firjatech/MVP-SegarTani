'use client';

import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Gift,
  Heart,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Package,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Tag,
  User as UserIcon,
  Wallet,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

const navLinks = [
  { name: 'Beranda', href: '/' },
  { name: 'Tentang Kami', href: '/about' },
  { name: 'Layanan', href: '/service' },
  { name: 'Kontak', href: '/contact' },
];

export default function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const { setIsCartOpen, totalItems } = useCart();
  const { totalWishlistItems } = useWishlist();

  const fetchUnreadCount = useCallback(async (userId: string) => {
    try {
      // Get all chat rooms the user participates in
      const { data: chatsData } = await supabase
        .from('chats')
        .select('id')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

      if (!chatsData || chatsData.length === 0) {
        setUnreadChatCount(0);
        return;
      }

      const chatIds = chatsData.map((c: { id: string }) => c.id);

      // Count unread messages from others
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('chat_id', chatIds)
        .eq('is_read', false)
        .neq('sender_id', userId);

      setUnreadChatCount(count || 0);
    } catch {
      // silently ignore errors
    }
  }, []);

  useEffect(() => {
    let currentUserId: string | null = null;

    async function checkAdmin(userId: string) {
      const { data } = await supabase
        .from('profiles')
        .select('is_admin, is_seller')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setIsSeller(data.is_seller || false);
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        currentUserId = session.user.id;
        checkAdmin(session.user.id);
        fetchUnreadCount(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        currentUserId = session.user.id;
        checkAdmin(session.user.id);
        fetchUnreadCount(session.user.id);
      } else {
        currentUserId = null;
        setUnreadChatCount(0);
      }
    });

    // Realtime subscription for new messages → update unread badge
    const channel = supabase
      .channel('navbar-unread-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          if (currentUserId) fetchUnreadCount(currentUserId);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        () => {
          if (currentUserId) fetchUnreadCount(currentUserId);
        }
      )
      .subscribe();

    // Poll every 30s as fallback
    const pollInterval = setInterval(() => {
      if (currentUserId) fetchUnreadCount(currentUserId);
    }, 30000);

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [fetchUnreadCount]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (pathname === '/login' || pathname === '/register' || pathname === '/daftar-penjual') {
    return null;
  }

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 bg-white shadow-sm py-4`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center relative">
        <div className="flex items-center gap-4">
          {/* Hamburger Icon - Only show when user is logged in */}
          {user && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-gray-50 rounded-lg text-gray-700 transition-colors"
            >
              <Menu size={24} />
            </button>
          )}

          {/* Conditional Logo: Link if not on ecommerce, Static if on ecommerce */}
          {pathname.startsWith('/ecommerce') ? (
            <div className="flex items-center space-x-2">
              <Image
                src="/images/logo.jpg"
                alt="SegarTani Logo"
                width={60}
                height={60}
                priority
                className="h-12 w-auto object-contain"
              />
              <span className={`text-2xl font-bold text-primary tracking-tight`}>
                Segar<span className="text-secondary">Tani</span>
              </span>
            </div>
          ) : (
            <Link href="/" className="flex items-center space-x-2 group">
              <Image
                src="/images/logo.jpg"
                alt="SegarTani Logo"
                width={60}
                height={60}
                priority
                className="h-12 w-auto object-contain"
              />
              <span className={`text-2xl font-bold text-primary tracking-tight`}>
                Segar<span className="text-secondary">Tani</span>
              </span>
            </Link>
          )}
        </div>

        {/* Desktop Menu Links (Centered) - Only show if NOT logged in */}
        {!user && (
          <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${pathname === link.href ? 'text-primary-dark border-b-2 border-primary-dark' : 'text-gray-700'
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        )}

        {/* Desktop Button and Mobile Hamburger */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            {/* Cari Lokasi - Only show on ecommerce */}
            {pathname.startsWith('/ecommerce') && (
              <Link
                href="/location"
                className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-primary bg-gray-50 px-4 py-2 rounded-full transition-all"
              >
                <MapPin size={16} className="text-primary" />
                Cari Lokasi
              </Link>
            )}

            {/* Order History Button - Only show on ecommerce */}

            {/* Chat Button */}
            {user && (
              <Link
                href="/chat"
                className={`relative p-2 text-gray-700 hover:text-primary transition-colors bg-gray-50 rounded-full ${
                  pathname === '/chat' ? 'text-primary bg-primary/10' : ''
                }`}
                title="Pesan & Chat"
              >
                <MessageSquare size={22} />
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm border-2 border-white animate-pulse">
                    {unreadChatCount > 9 ? '9+' : unreadChatCount}
                  </span>
                )}
              </Link>
            )}

            {/* Wishlist Button - Only show on ecommerce */}
            {pathname.startsWith('/ecommerce') && (
              <Link
                href="/wishlist"
                className="relative p-2 text-gray-700 hover:text-red-500 transition-colors bg-gray-50 rounded-full"
              >
                <Heart size={22} className={totalWishlistItems > 0 ? "fill-red-500 text-red-500" : ""} />
                {totalWishlistItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm border-2 border-white">
                    {totalWishlistItems}
                  </span>
                )}
              </Link>
            )}

            {/* Cart Button - Only show on ecommerce */}
            {pathname.startsWith('/ecommerce') && (
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-700 hover:text-primary transition-colors bg-gray-50 rounded-full"
              >
                <ShoppingCart size={22} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-secondary text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm border-2 border-white">
                    {totalItems}
                  </span>
                )}
              </button>
            )}

            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="bg-primary text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-[#008810] transition-all flex items-center gap-2 shadow-lg shadow-primary/10"
              >
                <LogOut size={16} /> Logout
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-5 py-2 rounded-full text-sm font-bold text-primary border border-primary hover:bg-primary/5 transition-all"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="bg-primary text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#008810] transition-all inline-block"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>


        </div>
      </div>



      {/* Sidebar Drawer (Placeholder) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-60"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-64 bg-primary shadow-2xl z-70 flex flex-col"
            >
              {/* Header - fixed */}
              <div className="flex justify-between items-center px-6 pt-6 pb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-black text-lg">Pengaturan</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-white/80 hover:text-white bg-white/10 p-2 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              {/* Sidebar Menu Items - scrollable */}
              <div
                className="flex-1 overflow-y-auto no-scrollbar px-6 pb-6 space-y-1.5"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
              >
                {/* ===== BUYER MENU ===== */}
                {!isSeller && user && (
                  <>
                    {/* Akun Saya */}
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-3 mb-2">👤 Akun Saya</p>
                    {[
                      { name: 'Profil Saya', href: '/profile', icon: UserIcon },
                      { name: 'Alamat Pengiriman', href: '/profile/address', icon: MapPin },
                      { name: 'Ubah Password', href: '/profile/password', icon: KeyRound },
                    ].map(item => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link key={item.name} href={item.href} onClick={() => setIsSidebarOpen(false)}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm ${
                            isActive ? 'bg-white text-primary shadow-lg' : 'text-white/90 hover:text-white hover:bg-white/10'
                          }`}>
                          <Icon size={18} /> {item.name}
                        </Link>
                      );
                    })}

                    <div className="h-px bg-white/10 my-3" />

                    {/* Belanja Saya */}
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-3 mb-2">🛍️ Belanja Saya</p>
                    {[
                      { name: 'Pesanan Saya', href: '/orders', icon: ShoppingBag },
                      { name: 'Keranjang', href: '/ecommerce', icon: ShoppingCart },
                      { name: 'Wishlist', href: '/wishlist', icon: Heart },
                      { name: 'Ulasan Saya', href: '/profile/reviews', icon: Star },
                    ].map(item => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link key={item.name} href={item.href} onClick={() => setIsSidebarOpen(false)}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm ${
                            isActive ? 'bg-white text-primary shadow-lg' : 'text-white/90 hover:text-white hover:bg-white/10'
                          }`}>
                          <Icon size={18} /> {item.name}
                        </Link>
                      );
                    })}

                    <div className="h-px bg-white/10 my-3" />

                    {/* Promo & Voucher */}
                    <Link href="/promo" onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm ${
                        pathname === '/promo' ? 'bg-white text-primary shadow-lg' : 'text-white/90 hover:text-white hover:bg-white/10'
                      }`}>
                      <Gift size={18} /> 🎁 Promo & Voucher
                    </Link>

                    {/* Chat */}
                    <Link href="/chat" onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all font-bold text-sm ${
                        pathname === '/chat' ? 'bg-white text-primary shadow-lg' : 'text-white/90 hover:text-white hover:bg-white/10'
                      }`}>
                      <span className="flex items-center gap-3"><MessageSquare size={18} /> 💬 Chat</span>
                      {unreadChatCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-black min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full">
                          {unreadChatCount > 9 ? '9+' : unreadChatCount}
                        </span>
                      )}
                    </Link>

                  </>
                )}

                {/* ===== SELLER MENU ===== */}
                {isSeller && user && (
                  <>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-3 mb-2">Akun Saya</p>
                    <Link href="/profile" onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm ${
                        pathname === '/profile' ? 'bg-white text-primary shadow-lg' : 'text-white/90 hover:text-white hover:bg-white/10'
                      }`}>
                      <UserIcon size={18} /> Profil Saya
                    </Link>

                    <div className="h-px bg-white/10 my-3" />
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-3 mb-2">Menu Penjual</p>
                    {[
                      { name: 'Profil Toko', href: '/admin/store-profile', icon: Store },
                      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
                      { name: 'Produk', href: '/admin/products', icon: Package },
                      { name: 'Pesanan', href: '/admin/orders', icon: ShoppingBag },
                      { name: 'Chat', href: '/chat', icon: MessageSquare },
                      { name: 'Ulasan', href: '#', icon: Star, badge: 'Segera' },
                      { name: 'Laporan', href: '#', icon: BarChart3, badge: 'Segera' },
                      { name: 'Saldo', href: '#', icon: Wallet, badge: 'Segera' },
                      { name: 'Promo', href: '#', icon: Tag, badge: 'Segera' },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || (item.href !== '#' && pathname.startsWith(item.href));
                      return (
                        <Link key={item.name} href={item.href} onClick={() => setIsSidebarOpen(false)}
                          className={`flex items-center justify-between p-3 rounded-xl transition-all font-bold text-sm ${
                            isActive ? 'bg-white text-primary shadow-lg' : 'text-white/90 hover:text-white hover:bg-white/10'
                          }`}>
                          <span className="flex items-center gap-3"><Icon size={18} />{item.name}</span>
                          {item.badge && (
                            <span className="text-[9px] font-black bg-white/10 text-white/60 px-2 py-0.5 rounded-full">{item.badge}</span>
                          )}
                        </Link>
                      );
                    })}

                    <div className="h-px bg-white/10 my-3" />
                    <button type="button" onClick={handleLogout}
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm text-red-300 hover:text-red-200 hover:bg-white/10">
                      <LogOut size={18} /> 🚪 Keluar
                    </button>
                  </>
                )}

                {/* NOT LOGGED IN */}
                {!user && (
                  <Link href="/register" onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center gap-3 text-white/90 hover:text-white hover:bg-white/10 p-3 rounded-xl transition-all font-bold text-sm">
                    <UserIcon size={20} /> Daftar Sekarang
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
