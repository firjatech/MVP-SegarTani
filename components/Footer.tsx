'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  if (pathname === '/login') {
    return null;
  }

  return (
    <footer className="w-full bg-[#0b0d17] text-zinc-400 py-16 font-sans border-t border-zinc-800/50">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-3xl font-extrabold text-primary tracking-tight">
                Segar<span className="text-secondary">Tani</span>
              </span>
            </Link>
            <p className="text-zinc-400 leading-relaxed max-w-sm">
              Kami menghadirkan SegarTani untuk Anda. untuk menyambut kedatangan anda dengan suka cita.
            </p>
            <div className="flex gap-4">
              <SocialIcon icon="facebook" />
              <SocialIcon icon="instagram" />
              <SocialIcon icon="twitter" />
              <SocialIcon icon="youtube" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-bold mb-6 text-lg tracking-tight">Pintasan Cepat</h4>
            <ul className="space-y-4">
              <FooterLink href="/">Beranda</FooterLink>
              <FooterLink href="/about">Tentang Kami</FooterLink>
              <FooterLink href="/service">Layanan</FooterLink>
              <FooterLink href="/product">Produk</FooterLink>
              <FooterLink href="/contact">Kontak</FooterLink>
              <FooterLink href="/register">Daftar Sekarang</FooterLink>
            </ul>
          </div>

          {/* Legal & Help */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-bold mb-6 text-lg tracking-tight">Hukum & Bantuan</h4>
            <ul className="space-y-4">
              <FooterLink href="#">Pusat Bantuan & FAQ</FooterLink>
              <FooterLink href="#">Syarat & Ketentuan</FooterLink>
              <FooterLink href="#">Kebijakan Privasi</FooterLink>
              <FooterLink href="#">Hubungi Dukungan</FooterLink>
            </ul>
          </div>

          {/* Download App */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-bold mb-6 text-lg tracking-tight">Unduh Aplikasi</h4>
            <p className="text-sm mb-6 opacity-80 leading-relaxed">
              Nikmati kemudahan berbelanja sayur segar langsung dari ponsel anda!
            </p>
            <div className="flex flex-col gap-3">
              <DownloadButton platform="app-store" />
              <DownloadButton platform="google-play" />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-zinc-800/50 flex flex-col md:flex-row justify-between items-center gap-4 text-sm opacity-80">
          <p>© 2026 SegarTani. Semua Hak Dilindungi.</p>
          <p className="flex items-center gap-1">
            Dikembangkan dengan penuh <span className="text-red-500">❤️</span> untuk ketahanan pangan.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="hover:text-primary transition-colors duration-200 block w-fit"
      >
        {children}
      </Link>
    </li>
  );
}

function SocialIcon({ icon }: { icon: string }) {
  return (
    <a
      href="#"
      className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center hover:bg-primary text-white transition-all duration-300 hover:-translate-y-1"
    >
      <IconMapper name={icon} />
    </a>
  );
}

function DownloadButton({ platform }: { platform: 'app-store' | 'google-play' }) {
  const isAppStore = platform === 'app-store';
  return (
    <a
      href="#"
      className="flex items-center gap-3 px-5 py-3 bg-[#0a0c10] hover:bg-zinc-900 border border-zinc-800/50 rounded-xl text-white transition-all duration-200 group w-fit min-w-[200px]"
    >
      {isAppStore ? (
        <svg className="w-8 h-8 fill-current" viewBox="0 0 384 512">
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
        </svg>
      ) : (
        <svg className="w-8 h-8 fill-current" viewBox="0 0 512 512">
          <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
        </svg>
      )}
      <div className="flex flex-col items-start">
        <span className="text-[10px] uppercase opacity-70 font-bold tracking-wider leading-none mb-1">
          {isAppStore ? 'Download on the' : 'Get it on'}
        </span>
        <strong className="text-lg font-bold tracking-tight leading-none">
          {isAppStore ? 'App Store' : 'Google Play'}
        </strong>
      </div>
    </a>
  );
}

function IconMapper({ name }: { name: string }) {
  if (name === 'facebook') return (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  );
  if (name === 'instagram') return (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c.796 0 1.441.645 1.441 1.44s-.645 1.44-1.441 1.44c-.795 0-1.439-.645-1.439-1.44s.644-1.44 1.439-1.44z"/></svg>
  );
  if (name === 'twitter') return (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
  );
  if (name === 'youtube') return (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  );
  return null;
}
