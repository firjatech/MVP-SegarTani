'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, MapPin, ShoppingCart, LogOut, Heart, ShoppingBag, Package, User as UserIcon, Store, PackageSearch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

const navLinks = [
  { name: 'Beranda', href: '/' },
  { name: 'Tentang Kami', href: '/about' },
  { name: 'Layanan', href: '/service' },
  { name: 'Kontak', href: '/contact' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { setIsCartOpen, totalItems } = useCart();
  const { totalWishlistItems } = useWishlist();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

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
      if (session?.user) checkAdmin(session.user.id);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) checkAdmin(session.user.id);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
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
          {/* Hamburger Icon - Show on all pages */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-gray-50 rounded-lg text-gray-700 transition-colors"
          >
            <Menu size={24} />
          </button>

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
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-700 hover:text-[#00AA13] transition-colors bg-gray-50 rounded-full"
              >
                <ShoppingCart size={22} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FF9F1C] text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm border-2 border-white">
                    {totalItems}
                  </span>
                )}
              </button>
            )}

            {user ? (
              <button
                onClick={handleLogout}
                className="bg-[#00AA13] text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-[#008810] transition-all flex items-center gap-2 shadow-lg shadow-[#00AA13]/10"
              >
                <LogOut size={16} /> Logout
              </button>
            ) : (
              <Link
                href="/register"
                className="bg-primary text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-primary-dark transition-all transform hover:scale-105 inline-block"
              >
                Daftar
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary transition-colors focus:outline-none"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="container mx-auto px-6 py-6 flex flex-col space-y-4">
              {!user && navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`text-lg font-medium transition-colors ${pathname === link.href ? 'text-primary-dark' : 'text-gray-700'
                    }`}
                >
                  {link.name}
                </Link>
              ))}

              {!user && pathname.startsWith('/ecommerce') && (
                <Link
                  href="/wishlist"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-lg font-medium text-gray-700 hover:text-red-500 transition-colors border-t border-gray-50 pt-4"
                >
                  <Heart size={20} className="text-red-500" />
                  Wishlist ({totalWishlistItems})
                </Link>
              )}

              {!user && (
                <Link
                  href="/location"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-lg font-medium text-gray-700 hover:text-primary transition-colors border-t border-gray-50 pt-4"
                >
                  <MapPin size={20} className="text-primary" />
                  Cari Lokasi
                </Link>
              )}

              {user && (
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-lg font-medium text-gray-700 hover:text-[#00AA13] transition-colors border-t border-gray-50 pt-4"
                >
                  <UserIcon size={20} className="text-[#00AA13]" />
                  Profil
                </Link>
              )}
              
              {user && isSeller && (
                <>
                  <Link
                    href="/admin/store-profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 text-lg font-medium text-gray-700 hover:text-[#00AA13] transition-colors border-t border-gray-50 pt-4"
                  >
                    <Store size={20} className="text-[#00AA13]" />
                    Profil Penjual
                  </Link>
                  <Link
                    href="/admin/products"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 text-lg font-medium text-gray-700 hover:text-[#00AA13] transition-colors border-t border-gray-50 pt-4"
                  >
                    <PackageSearch size={20} className="text-[#00AA13]" />
                    Manajemen Produk
                  </Link>
                </>
              )}

              {user && (
                <Link
                  href="/orders"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-lg font-medium text-gray-700 hover:text-[#00AA13] transition-colors border-t border-gray-50 pt-4"
                >
                  <ShoppingBag size={20} className="text-[#00AA13]" />
                  Pesanan Saya
                </Link>
              )}

              {user ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="bg-red-500 text-white text-center px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 mt-4"
                >
                  <LogOut size={20} /> Logout
                </button>
              ) : (
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="bg-primary text-white text-center px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
                >
                  Daftar
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Drawer (Placeholder) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-64 bg-[#00AA13] shadow-2xl z-[70] p-6"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <Image src="/images/logo.jpg" alt="Logo" width={32} height={32} className="rounded-lg" />
                  <span className="text-white font-black text-xl">SegarTani</span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-white/80 hover:text-white bg-white/10 p-2 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              {/* Sidebar Menu Items */}
              <div className="space-y-1.5">
                {/* General Links for All */}
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold ${
                      pathname === link.href 
                        ? 'bg-white text-[#00AA13] shadow-lg' 
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {link.name === 'Beranda' && <Package size={20} />}
                    {link.name === 'Tentang Kami' && <UserIcon size={20} />}
                    {link.name === 'Layanan' && <Store size={20} />}
                    {link.name === 'Kontak' && <MapPin size={20} />}
                    {link.name}
                  </Link>
                ))}

                <div className="h-px bg-white/10 my-4"></div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-3 mb-2">E-Commerce</p>

                <Link
                  href="/ecommerce"
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold ${
                    pathname.startsWith('/ecommerce') 
                      ? 'bg-white text-[#00AA13] shadow-lg' 
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <ShoppingBag size={20} /> Katalog Produk
                </Link>
                <Link
                  href="/location"
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold ${
                    pathname === '/location' 
                      ? 'bg-white text-[#00AA13] shadow-lg' 
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <MapPin size={20} /> Cari Lokasi
                </Link>
                {isAdmin && (
                  <>
                    <div className="h-px bg-white/20 my-4"></div>
                    <Link
                      href="/admin"
                      onClick={() => setIsSidebarOpen(false)}
                      className="flex items-center gap-3 text-yellow-300 hover:text-white hover:bg-white/10 p-3 rounded-xl transition-all font-bold"
                    >
                      <Package size={20} /> Admin Panel
                    </Link>
                  </>
                )}
                <div className="h-px bg-white/20 my-4"></div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 text-white/90 hover:text-white hover:bg-red-500 p-3 rounded-xl transition-all font-bold"
                >
                  <LogOut size={20} /> Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
