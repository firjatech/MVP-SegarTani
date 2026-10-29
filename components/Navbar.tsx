'use client';

import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeftRight,
  Bell,
  CreditCard,
  Heart,
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
  const [currentRole, setCurrentRole] = useState<'buyer' | 'seller'>('buyer');
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [profile, setProfile] = useState<{ full_name: string; is_seller: boolean; is_admin: boolean } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { setIsCartOpen, totalItems } = useCart();
  const { totalWishlistItems } = useWishlist();

  // Sinkronisasi status peran (Role) secara ketat
  useEffect(() => {
    const syncRole = () => {
      const stored = localStorage.getItem('segar-tani-role');
      if (pathname.startsWith('/admin')) {
        setCurrentRole('seller');
      } else if (stored === 'seller' || stored === 'buyer') {
        setCurrentRole(stored);
      } else {
        setCurrentRole('buyer');
      }
    };

    syncRole();
    window.addEventListener('roleChange', syncRole);
    window.addEventListener('storage', syncRole);

    return () => {
      window.removeEventListener('roleChange', syncRole);
      window.removeEventListener('storage', syncRole);
    };
  }, [pathname]);

  // PEMISAHAN KETAT:
  // Jika di halaman admin atau role aktif adalah 'seller', maka sistem penjual murni.
  // Selain itu, sistem pembeli murni.
  const isSeller = pathname.startsWith('/admin') || currentRole === 'seller';

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

    const loadProfile = async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, is_seller, is_admin')
        .eq('id', userId)
        .single();
      if (data) setProfile(data);
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        currentUserId = session.user.id;
        fetchUnreadCount(session.user.id);
        loadProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        currentUserId = session.user.id;
        fetchUnreadCount(session.user.id);
        loadProfile(session.user.id);
      } else {
        currentUserId = null;
        setUnreadChatCount(0);
        setProfile(null);
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
    localStorage.removeItem('segar-tani-role');
    window.dispatchEvent(new Event('roleChange'));
    router.push('/login');
  };

  const handleSwitchMode = () => {
    const newRole = isSeller ? 'buyer' : 'seller';
    localStorage.setItem('segar-tani-role', newRole);
    window.dispatchEvent(new Event('roleChange'));
    setIsSidebarOpen(false);
    if (newRole === 'seller') {
      router.push('/admin/dashboard');
    } else {
      router.push('/ecommerce');
    }
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

          {/* Conditional Logo: Seller -> /admin/dashboard, Buyer on ecommerce -> static, Buyer elsewhere -> /ecommerce, Guest -> / */}
          {user && isSeller ? (
            <Link href="/admin/dashboard" className="flex items-center space-x-2 group">
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
          ) : user && pathname.startsWith('/ecommerce') ? (
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
          ) : user ? (
            <Link href="/ecommerce" className="flex items-center space-x-2 group">
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

        {/* Desktop Buttons and Quick Actions */}
        <div className="flex items-center gap-3">
          {/* Mobile Right Controls: Notifikasi, Chat & Cart (Cart hanya untuk pembeli) */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <button
                type="button"
                className="relative p-2 text-gray-700 bg-gray-50 rounded-full"
                title="Notifikasi"
              >
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              </button>
            )}

            {user && (
              <Link
                href="/chat"
                className={`relative p-2 text-gray-700 bg-gray-50 rounded-full ${pathname === '/chat' ? 'text-primary bg-primary/10' : ''
                  }`}
                title="Pesan & Chat"
              >
                <MessageSquare size={18} />
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full">
                    {unreadChatCount > 9 ? '9+' : unreadChatCount}
                  </span>
                )}
              </Link>
            )}

            {/* Keranjang hanya tampil untuk Pembeli */}
            {user && !isSeller && pathname.startsWith('/ecommerce') && (
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-700 bg-gray-50 rounded-full"
              >
                <ShoppingCart size={18} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-secondary text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full">
                    {totalItems}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Desktop Right Controls */}
          <div className="hidden md:flex items-center gap-3">
            {/* Cari Lokasi - KHUSUS PEMBELI pada katalog ecommerce */}
            {!isSeller && pathname.startsWith('/ecommerce') && (
              <Link
                href="/location"
                className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-primary bg-gray-50 px-4 py-2 rounded-full transition-all"
              >
                <MapPin size={16} className="text-primary" />
                Cari Lokasi
              </Link>
            )}

            {/* Lonceng Notifikasi (Tersedia untuk pembeli & penjual) */}
            {user && (
              <button
                type="button"
                className="relative p-2 text-gray-700 hover:text-primary transition-colors bg-gray-50 rounded-full cursor-pointer"
                title="Notifikasi"
              >
                <Bell size={22} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            )}

            {/* Chat Button (Tersedia untuk pembeli & penjual) */}
            {user && (
              <Link
                href="/chat"
                className={`relative p-2 text-gray-700 hover:text-primary transition-colors bg-gray-50 rounded-full ${pathname === '/chat' ? 'text-primary bg-primary/10' : ''
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

            {/* Wishlist Button - KHUSUS PEMBELI */}
            {user && !isSeller && pathname.startsWith('/ecommerce') && (
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

            {/* Cart Button - KHUSUS PEMBELI */}
            {user && !isSeller && pathname.startsWith('/ecommerce') && (
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
                className="bg-primary text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-[#008810] transition-all flex items-center gap-2 shadow-lg shadow-primary/10 cursor-pointer"
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
              className="fixed left-0 top-0 h-full w-72 bg-primary shadow-2xl z-70 flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-5 pt-5 pb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                    isSeller
                      ? 'bg-orange-400/20 text-orange-200 border border-orange-300/30'
                      : 'bg-white/10 text-white/70 border border-white/20'
                  }`}>
                    {isSeller ? '🏪 Mode Penjual' : '🛍️ Mode Pembeli'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-white/80 hover:text-white bg-white/10 p-2 rounded-xl transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Profile Card */}
              {user && (
                <div className="mx-4 mb-4 bg-white/10 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <UserIcon size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black text-sm truncate">
                        {profile?.full_name || 'Pengguna'}
                      </p>
                      <p className="text-white/50 text-[11px] truncate">{user.email}</p>
                    </div>
                  </div>
                  {/* Switch Mode Button */}
                  {(profile?.is_seller || profile?.is_admin) && (
                    <button
                      type="button"
                      onClick={handleSwitchMode}
                      className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all ${
                        isSeller
                          ? 'bg-white text-primary hover:bg-gray-100'
                          : 'bg-orange-400 text-white hover:bg-orange-500'
                      }`}
                    >
                      <ArrowLeftRight size={15} />
                      {isSeller ? 'Beralih ke Mode Pembeli' : 'Beralih ke Mode Penjual'}
                    </button>
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-white/10 mx-4 mb-3" />
              {/* Sidebar Menu Items - scrollable */}
              <div
                className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6 space-y-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
              >
                {/* ===== MENU PEMBELI (KHUSUS PEMBELI) ===== */}
                {!isSeller && user && (
                  <>
                    {/* Akun Saya */}
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-3 mb-2">Akun Saya</p>
                    {[
                      { name: 'Profil Saya', href: '/profile', icon: UserIcon },
                      { name: 'Rekening / Metode Pembayaran', href: '#', icon: CreditCard, badge: 'Segera' },
                    ].map(item => {
                      const Icon = item.icon;
                      const isActive = item.href !== '#' && pathname === item.href;
                      return (
                        <Link key={item.name} href={item.href} onClick={() => setIsSidebarOpen(false)}
                          className={`flex items-center justify-between p-3 rounded-xl transition-all font-bold text-sm ${
                            isActive ? 'bg-white text-primary shadow-lg' : 'text-white/90 hover:text-white hover:bg-white/10'
                          }`}>
                          <span className="flex items-center gap-3"><Icon size={18} /> {item.name}</span>
                          {item.badge && (
                            <span className="text-[9px] font-black bg-white/10 text-white/60 px-2 py-0.5 rounded-full">{item.badge}</span>
                          )}
                        </Link>
                      );
                    })}

                    <div className="h-px bg-white/10 my-3" />

                    {/* Menu Pembeli */}
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-3 mb-2">Menu Pembeli</p>
                    
                    {/* Dashboard */}
                    <Link
                      href="/ecommerce"
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm ${
                        pathname === '/ecommerce' ? 'bg-white text-primary shadow-lg' : 'text-white/90 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <LayoutDashboard size={18} /> Dashboard
                    </Link>

                    {/* Pesanan Saya */}
                    <Link
                      href="/orders"
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm ${
                        pathname === '/orders' ? 'bg-white text-primary shadow-lg' : 'text-white/90 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <ShoppingBag size={18} /> Pesanan Saya
                    </Link>

                    {/* Chat */}
                    <Link
                      href="/chat"
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all font-bold text-sm ${
                        pathname === '/chat' ? 'bg-white text-primary shadow-lg' : 'text-white/90 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="flex items-center gap-3"><MessageSquare size={18} /> Chat</span>
                      {unreadChatCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-black min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full">
                          {unreadChatCount > 9 ? '9+' : unreadChatCount}
                        </span>
                      )}
                    </Link>

                    {/* Ulasan Saya */}
                    <Link
                      href="/reviews"
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm ${
                        pathname === '/reviews' ? 'bg-white text-primary shadow-lg' : 'text-white/90 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Star size={18} /> Ulasan Saya
                    </Link>

                    {/* Favorit / Wishlist */}
                    <Link
                      href="/wishlist"
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all font-bold text-sm ${
                        pathname === '/wishlist' ? 'bg-white text-primary shadow-lg' : 'text-white/90 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="flex items-center gap-3"><Heart size={18} /> Favorit / Wishlist</span>
                      {totalWishlistItems > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-black min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full">
                          {totalWishlistItems}
                        </span>
                      )}
                    </Link>

                    {/* Keranjang */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSidebarOpen(false);
                        setIsCartOpen(true);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl transition-all font-bold text-sm text-white/90 hover:text-white hover:bg-white/10 cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-3"><ShoppingCart size={18} /> Keranjang</span>
                      {totalItems > 0 && (
                        <span className="bg-secondary text-white text-[10px] font-black min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full">
                          {totalItems}
                        </span>
                      )}
                    </button>

                    {/* Voucher & Promo Saya */}
                    <Link
                      href="#"
                      onClick={() => setIsSidebarOpen(false)}
                      className="flex items-center justify-between p-3 rounded-xl transition-all font-bold text-sm text-white/90 hover:text-white hover:bg-white/10"
                    >
                      <span className="flex items-center gap-3"><Tag size={18} /> Voucher & Promo Saya</span>
                      <span className="text-[9px] font-black bg-white/10 text-white/60 px-2 py-0.5 rounded-full">Segera</span>
                    </Link>

                    {/* Saldo / Dompet */}
                    <Link
                      href="#"
                      onClick={() => setIsSidebarOpen(false)}
                      className="flex items-center justify-between p-3 rounded-xl transition-all font-bold text-sm text-white/90 hover:text-white hover:bg-white/10"
                    >
                      <span className="flex items-center gap-3"><Wallet size={18} /> Saldo / Dompet</span>
                      <span className="text-[9px] font-black bg-white/10 text-white/60 px-2 py-0.5 rounded-full">Segera</span>
                    </Link>

                    {/* Notifikasi */}
                    <Link
                      href="#"
                      onClick={() => setIsSidebarOpen(false)}
                      className="flex items-center justify-between p-3 rounded-xl transition-all font-bold text-sm text-white/90 hover:text-white hover:bg-white/10"
                    >
                      <span className="flex items-center gap-3"><Bell size={18} /> Notifikasi</span>
                      <span className="text-[9px] font-black bg-white/10 text-white/60 px-2 py-0.5 rounded-full">Segera</span>
                    </Link>
                  </>
                )}

                {/* ===== MENU PENJUAL (KHUSUS PENJUAL) ===== */}
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
                      { name: 'Ulasan', href: '/admin/reviews', icon: Star },
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
