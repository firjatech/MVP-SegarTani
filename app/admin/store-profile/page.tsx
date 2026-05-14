'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import {
  Store, ArrowLeft, Loader2, CheckCircle2, AlertCircle,
  Camera, ImageIcon, FileText, MapPin, Building2, Upload,
  Globe,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface StoreProfile {
  store_name: string;
  store_description: string;
  logo_url: string;
  banner_url: string;
  store_address: string;
  store_city: string;
  store_province: string;
  store_postal_code: string;
  store_maps_url: string;
}

const EMPTY: StoreProfile = {
  store_name: '',
  store_description: '',
  logo_url: '',
  banner_url: '',
  store_address: '',
  store_city: '',
  store_province: '',
  store_postal_code: '',
  store_maps_url: '',
};

// Derive embed URL from any Google Maps share/short link
function toEmbedUrl(raw: string): string {
  if (!raw) return '';
  if (raw.includes('/embed')) return raw;
  // Try to extract query from maps URL
  const qMatch = raw.match(/[?&]q=([^&]+)/);
  if (qMatch) return `https://maps.google.com/maps?q=${qMatch[1]}&output=embed`;
  // Fallback: use address search
  return '';
}

export default function StoreProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [success, setSuccess] = useState(false);
  const [store, setStore] = useState<StoreProfile>(EMPTY);
  const [userId, setUserId] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'media' | 'location'>('basic');

  // Upload states
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');

  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles').select('is_admin, is_seller').eq('id', user.id).single();
      if (!profile?.is_admin && !profile?.is_seller) { setLoading(false); return; }
      setIsAdmin(profile.is_admin || false);
      setIsSeller(profile.is_seller || false);

      const { data } = await supabase
        .from('store_profiles').select('*').eq('id', user.id).single();
      if (data) {
        setStore({ ...EMPTY, ...data });
        setLogoPreview(data.logo_url || '');
        setBannerPreview(data.banner_url || '');
      }
      setLoading(false);
    }
    load();
  }, []);

  const uploadImage = async (
    file: File,
    folder: 'logo' | 'banner',
    setUploading: (v: boolean) => void,
    setPreview: (v: string) => void,
    field: 'logo_url' | 'banner_url'
  ) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${userId}/${folder}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('store-assets')
      .upload(path, file, { upsert: true });

    if (upErr) {
      alert('Gagal upload: ' + upErr.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('store-assets').getPublicUrl(path);
    const url = urlData.publicUrl;
    setPreview(url);
    setStore(prev => ({ ...prev, [field]: url }));
    setUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    const { error } = await supabase.from('store_profiles').upsert({
      id: userId, ...store, updated_at: new Date().toISOString(),
    });
    if (error) {
      alert('Gagal menyimpan: ' + error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/ecommerce');
      }, 1500);
    }
    setSaving(false);
  };

  const embedUrl = store.store_maps_url
    ? toEmbedUrl(store.store_maps_url)
    : store.store_address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(
        [store.store_address, store.store_city, store.store_province].filter(Boolean).join(', ')
      )}&output=embed`
    : '';

  const tabs = [
    { id: 'basic', label: 'Informasi Toko', icon: <Building2 size={16} /> },
    { id: 'media', label: 'Logo & Banner', icon: <ImageIcon size={16} /> },
    { id: 'location', label: 'Lokasi & Peta', icon: <MapPin size={16} /> },
  ] as const;

  const inputCls = 'w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 text-gray-700 font-bold transition-all text-sm';
  const labelCls = 'block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  if (!isAdmin && !isSeller) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <AlertCircle size={60} className="text-red-500 mb-4" />
      <h1 className="text-2xl font-black text-gray-900 mb-2">Akses Ditolak</h1>
      <p className="text-gray-500">Halaman ini hanya untuk Penjual SegarTani.</p>
      <Link href="/profile" className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-black rounded-2xl hover:bg-[#008810] transition-colors">
        <ArrowLeft size={18} /> Kembali ke Profil
      </Link>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen pt-16 pb-24 font-sans">
      <div className="container mx-auto px-6 max-w-4xl">

        {/* Header */}
        <header className="mb-8">
          <Link href="/profile" className="flex items-center gap-2 text-gray-500 font-bold hover:text-primary transition-colors mb-5 group w-fit">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Kembali ke Profil
          </Link>
          <div className="flex items-center gap-4">
            <div className="bg-linear-to-br from-primary to-emerald-600 p-3.5 rounded-2xl text-white shadow-lg shadow-primary/30">
              <Store size={26} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">Profil Toko</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                Lengkapi informasi toko Anda
              </p>
            </div>
          </div>
        </header>

        {/* Banner Preview */}
        <div className="relative w-full h-44 rounded-4xl overflow-hidden mb-6 bg-linear-to-br from-primary/20 to-emerald-100 shadow-xl">
          {bannerPreview ? (
            <Image src={bannerPreview} alt="Banner Toko" fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center gap-3 text-primary/40">
              <ImageIcon size={32} />
              <span className="font-black text-sm">Banner Toko Belum Diatur</span>
            </div>
          )}
          {/* Logo overlay */}
          <div className="absolute -bottom-6 left-8 w-20 h-20 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white">
            {logoPreview ? (
              <Image src={logoPreview} alt="Logo Toko" fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                <Store size={28} />
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 mb-6">
          <h2 className="text-lg font-black text-gray-900 truncate">
            {store.store_name || 'Nama Toko Belum Diisi'}
          </h2>
          {store.store_city && (
            <p className="text-sm font-bold text-gray-400 flex items-center gap-1.5 mt-1">
              <MapPin size={13} /> {store.store_city}{store.store_province && `, ${store.store_province}`}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-sm transition-all
                ${activeTab === t.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'text-gray-400 hover:text-gray-700'}`}
            >
              {t.icon} <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSave}>
          <AnimatePresence mode="wait">

            {/* TAB: Informasi Dasar */}
            {activeTab === 'basic' && (
              <motion.div key="basic" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 space-y-6">
                <div>
                  <label className={labelCls}>Nama Toko *</label>
                  <div className="relative">
                    <Store size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input type="text" placeholder="Contoh: SegarTani Official Store"
                      value={store.store_name || ''}
                      onChange={e => setStore(p => ({ ...p, store_name: e.target.value }))}
                      className={inputCls + ' pl-12'} required />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Deskripsi Bisnis</label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-5 top-4 text-gray-300" />
                    <textarea placeholder="Ceritakan tentang toko Anda, produk unggulan, visi misi, dll..."
                      value={store.store_description || ''}
                      onChange={e => setStore(p => ({ ...p, store_description: e.target.value }))}
                      rows={5}
                      className={inputCls + ' pl-12 resize-none'} />
                  </div>
                  <p className="text-[11px] text-gray-400 font-bold mt-2 text-right">
                    {(store.store_description || '').length} karakter
                  </p>
                </div>
              </motion.div>
            )}

            {/* TAB: Logo & Banner */}
            {activeTab === 'media' && (
              <motion.div key="media" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 space-y-8">

                {/* Logo Upload */}
                <div>
                  <label className={labelCls}>Logo Toko</label>
                  <p className="text-xs text-gray-400 font-bold mb-4">Disarankan: 400×400 px, format PNG/JPG/WEBP</p>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0 relative">
                      {logoPreview
                        ? <Image src={logoPreview} alt="Logo" fill className="object-cover" />
                        : <Camera size={28} className="text-gray-300" />}
                    </div>
                    <div className="flex-1 space-y-3">
                      <input type="text" placeholder="Atau tempel URL gambar langsung..."
                        value={store.logo_url || ''}
                        onChange={e => { setStore(p => ({ ...p, logo_url: e.target.value })); setLogoPreview(e.target.value); }}
                        className={inputCls} />
                      <div className="relative">
                        <input ref={logoRef} type="file" accept="image/*" className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) uploadImage(f, 'logo', setLogoUploading, setLogoPreview, 'logo_url');
                          }} />
                        <button type="button" onClick={() => logoRef.current?.click()}
                          disabled={logoUploading}
                          className="flex items-center gap-2 px-5 py-3 bg-primary/10 text-primary font-black text-sm rounded-2xl hover:bg-primary/20 transition-all disabled:opacity-50">
                          {logoUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                          {logoUploading ? 'Mengupload...' : 'Upload dari Perangkat'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Banner Upload */}
                <div>
                  <label className={labelCls}>Banner Toko</label>
                  <p className="text-xs text-gray-400 font-bold mb-4">Disarankan: 1200×400 px, format PNG/JPG/WEBP</p>
                  <div className="w-full h-36 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center mb-4 relative">
                    {bannerPreview
                      ? <Image src={bannerPreview} alt="Banner" fill className="object-cover" />
                      : <div className="flex flex-col items-center gap-2 text-gray-300">
                          <ImageIcon size={32} />
                          <span className="text-xs font-bold">Belum ada banner</span>
                        </div>}
                  </div>
                  <div className="space-y-3">
                    <input type="text" placeholder="Atau tempel URL banner langsung..."
                      value={store.banner_url || ''}
                      onChange={e => { setStore(p => ({ ...p, banner_url: e.target.value })); setBannerPreview(e.target.value); }}
                      className={inputCls} />
                    <div className="relative">
                      <input ref={bannerRef} type="file" accept="image/*" className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) uploadImage(f, 'banner', setBannerUploading, setBannerPreview, 'banner_url');
                        }} />
                      <button type="button" onClick={() => bannerRef.current?.click()}
                        disabled={bannerUploading}
                        className="flex items-center gap-2 px-5 py-3 bg-primary/10 text-primary font-black text-sm rounded-2xl hover:bg-primary/20 transition-all disabled:opacity-50">
                        {bannerUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        {bannerUploading ? 'Mengupload...' : 'Upload dari Perangkat'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: Lokasi & Peta */}
            {activeTab === 'location' && (
              <motion.div key="location" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 space-y-6">

                <div>
                  <label className={labelCls}>Alamat Lengkap Toko</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-5 top-4 text-gray-300" />
                    <textarea placeholder="Jl. Raya Batu No. 12, RT 03/RW 02, Kel. Sisir..."
                      value={store.store_address || ''}
                      onChange={e => setStore(p => ({ ...p, store_address: e.target.value }))}
                      rows={3}
                      className={inputCls + ' pl-12 resize-none'} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Kota / Kabupaten', key: 'store_city', placeholder: 'Batu' },
                    { label: 'Provinsi', key: 'store_province', placeholder: 'Jawa Timur' },
                    { label: 'Kode Pos', key: 'store_postal_code', placeholder: '65311' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className={labelCls}>{f.label}</label>
                      <input type="text" placeholder={f.placeholder}
                        value={store[f.key as keyof StoreProfile] || ''}
                        onChange={e => setStore(p => ({ ...p, [f.key]: e.target.value }))}
                        className={inputCls} />
                    </div>
                  ))}
                </div>

                <div>
                  <label className={labelCls}>Link Google Maps (opsional)</label>
                  <p className="text-xs text-gray-400 font-bold mb-3">
                    Buka Google Maps → Share → Copy Link, lalu tempel di sini
                  </p>
                  <div className="relative">
                    <Globe size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input type="url" placeholder="https://maps.google.com/..."
                      value={store.store_maps_url || ''}
                      onChange={e => setStore(p => ({ ...p, store_maps_url: e.target.value }))}
                      className={inputCls + ' pl-12'} />
                  </div>
                </div>

                {/* Map Preview */}
                {embedUrl ? (
                  <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
                    <div className="bg-gray-50 px-5 py-3 flex items-center gap-2 border-b border-gray-100">
                      <MapPin size={14} className="text-primary" />
                      <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Pratinjau Peta</span>
                    </div>
                    <iframe
                      src={embedUrl}
                      width="100%" height="300"
                      style={{ border: 0 }}
                      allowFullScreen loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Lokasi Toko"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 h-52 flex flex-col items-center justify-center gap-3 text-gray-300">
                    <MapPin size={36} />
                    <p className="text-sm font-black">Isi alamat untuk melihat peta</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Save Bar */}
          <div className="mt-6 flex items-center gap-4">
            <button type="submit" disabled={saving}
              className="flex-1 md:flex-none md:px-12 bg-primary hover:bg-[#008810] disabled:bg-gray-300 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 text-base">
              {saving ? <Loader2 size={22} className="animate-spin" /> : 'Simpan Profil Toko'}
            </button>

            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-primary font-black text-sm">
                  <CheckCircle2 size={20} /> Tersimpan!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </form>
      </div>
    </div>
  );
}
