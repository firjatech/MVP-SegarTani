'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  PackageSearch, Plus, Edit2, Trash2, Image as ImageIcon,
  Loader2, AlertCircle, CheckCircle2, Search, X, Upload, ArrowLeft
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type Product = {
  id: number;
  seller_id: string;
  name: string;
  category: string;
  price: number;
  discount: number;
  stock: number;
  rating: number;
  image: string;
  description: string;
};

const EMPTY_PRODUCT: Partial<Product> = {
  name: '',
  category: 'Sayuran',
  price: 0,
  discount: 0,
  stock: 100,
  description: '',
  image: '',
};

function AdminProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [userId, setUserId] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>(EMPTY_PRODUCT);
  
  // Upload State
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Action State
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (sellerId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const checkUserAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles').select('is_admin, is_seller').eq('id', user.id).single();
    
    if (!profile?.is_admin && !profile?.is_seller) {
      router.push('/admin/store-profile'); // Redirect if no access
      return;
    }

    setUserId(user.id);
    fetchProducts(user.id);
  };

  useEffect(() => {
    Promise.resolve().then(() => checkUserAndFetch());
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const ext = file.name.split('.').pop();
    const fileName = `${userId}/prod-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('product-assets')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      setError('Gagal mengupload gambar: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('product-assets').getPublicUrl(fileName);
    setCurrentProduct(p => ({ ...p, image: data.publicUrl }));
    setUploading(false);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const previousProducts = [...products];
    const payload = { ...currentProduct, seller_id: userId };

    try {
      if (isEditing && currentProduct.id) {
        // Optimistic UI for Update
        setProducts(products.map(p => p.id === currentProduct.id ? { ...p, ...payload } as Product : p));
        setIsModalOpen(false);

        const { error } = await supabase.from('products').update(payload).eq('id', currentProduct.id);
        if (error) {
          setProducts(previousProducts);
          alert('Gagal mengupdate produk: ' + error.message);
        }
      } else {
        const { data, error } = await supabase.from('products').insert([payload]).select().single();
        if (error) throw error;
        
        if (data) {
          setProducts([data, ...products]);
        }
        setIsModalOpen(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan produk');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    
    // Optimistic UI for Delete
    const previousProducts = [...products];
    setProducts(products.filter(p => p.id !== id));
    
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      setProducts(previousProducts);
      alert('Gagal menghapus: ' + error.message);
    }
  };

  const openModalForNew = () => {
    setCurrentProduct(EMPTY_PRODUCT);
    setIsEditing(false);
    setError(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (p: Product) => {
    setCurrentProduct(p);
    setIsEditing(true);
    setError(null);
    setIsModalOpen(true);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams.toString());
    const newParams = new URLSearchParams(searchParams.toString());
    
    if (search) {
      newParams.set('q', search);
    } else {
      newParams.delete('q');
    }

    if (currentParams.toString() !== newParams.toString()) {
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    }
  }, [search, pathname, router, searchParams]);

  const inputCls = 'w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 focus:ring-4 focus:ring-[#00AA13]/10 focus:border-[#00AA13] text-gray-700 font-bold transition-all text-sm outline-none';
  const labelCls = 'block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 size={40} className="animate-spin text-[#00AA13]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 pb-32">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/admin/store-profile" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#00AA13] transition-colors mb-3">
              <ArrowLeft size={16} /> Kembali ke Profil Penjual
            </Link>
            <h1 className="text-3xl font-black text-gray-900">Manajemen Produk</h1>
            <p className="text-gray-500 font-medium">Atur barang jualan dan etalase tokomu.</p>
          </div>
          <button onClick={openModalForNew}
            className="flex items-center gap-2 bg-[#00AA13] text-white px-6 py-3.5 rounded-2xl font-black hover:bg-[#008810] transition-all shadow-xl shadow-[#00AA13]/20">
            <Plus size={20} /> Tambah Produk
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Cari nama produk..." 
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-[#00AA13]/20 outline-none" />
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-[3rem] border border-gray-100 p-16 flex flex-col items-center text-center shadow-sm">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
              <PackageSearch size={40} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Belum Ada Produk</h3>
            <p className="text-gray-400 font-medium max-w-md">Anda belum memiliki produk, atau produk yang dicari tidak ditemukan. Klik tombol Tambah Produk untuk memulai.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredProducts.map(p => (
                <motion.div key={p.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-[#00AA13]/20 transition-all group flex flex-col">
                  
                  {/* Image */}
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {p.image ? (
                      <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                        <ImageIcon size={32} />
                        <span className="text-xs font-bold mt-2">No Image</span>
                      </div>
                    )}
                    {p.stock <= 5 && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg">Stok Menipis</div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{p.category}</div>
                    <h3 className="text-lg font-black text-gray-900 line-clamp-1 mb-2">{p.name}</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl font-black text-[#00AA13]">Rp {p.price.toLocaleString('id-ID')}</span>
                      {p.discount > 0 && <span className="text-xs font-bold text-gray-400 line-through">Rp {(p.price + (p.price * p.discount / 100)).toLocaleString('id-ID')}</span>}
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                      <div className="text-xs font-bold text-gray-500">Stok: <span className={p.stock > 10 ? 'text-gray-900' : 'text-red-500'}>{p.stock}</span></div>
                      <div className="flex gap-2">
                        <button onClick={() => openModalForEdit(p)} className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white z-10 shrink-0">
                <h2 className="text-2xl font-black text-gray-900">{isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 overflow-y-auto flex-1">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <form id="product-form" onSubmit={handleSaveProduct} className="space-y-6">
                  
                  {/* Image Upload Area */}
                  <div>
                    <label className={labelCls}>Gambar Produk</label>
                    <div className="flex gap-6 items-center">
                      <div className="w-32 h-32 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                        {currentProduct.image ? (
                          <div className="relative w-full h-full">
                            <Image src={currentProduct.image} alt="Preview" fill className="object-cover" />
                          </div>
                        ) : (
                          <ImageIcon size={32} className="text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 space-y-3">
                        <input type="text" placeholder="URL Gambar..." value={currentProduct.image || ''} onChange={e => setCurrentProduct(p => ({ ...p, image: e.target.value }))} className={inputCls} />
                        <div className="flex gap-3">
                          <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors disabled:opacity-50">
                            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                            Upload Foto
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className={labelCls}>Nama Produk *</label>
                      <input type="text" required value={currentProduct.name || ''} onChange={e => setCurrentProduct(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="Contoh: Sayur Bayam Organik" />
                    </div>

                    <div>
                      <label className={labelCls}>Kategori *</label>
                      <select required value={currentProduct.category || ''} onChange={e => setCurrentProduct(p => ({ ...p, category: e.target.value }))} className={inputCls}>
                        <option value="Sayuran">Sayuran</option>
                        <option value="Buah">Buah</option>
                        <option value="Daging">Daging</option>
                        <option value="Bumbu Masak">Bumbu Masak</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelCls}>Stok *</label>
                      <input type="number" required min="0" value={currentProduct.stock ?? ''} onChange={e => setCurrentProduct(p => ({ ...p, stock: parseInt(e.target.value) || 0 }))} className={inputCls} />
                    </div>

                    <div>
                      <label className={labelCls}>Harga Asli (Rp) *</label>
                      <input type="number" required min="0" value={currentProduct.price ?? ''} onChange={e => setCurrentProduct(p => ({ ...p, price: parseInt(e.target.value) || 0 }))} className={inputCls} />
                    </div>

                    <div>
                      <label className={labelCls}>Diskon (%)</label>
                      <input type="number" min="0" max="100" value={currentProduct.discount ?? ''} onChange={e => setCurrentProduct(p => ({ ...p, discount: parseInt(e.target.value) || 0 }))} className={inputCls} />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className={labelCls}>Deskripsi Singkat</label>
                      <textarea rows={3} value={currentProduct.description || ''} onChange={e => setCurrentProduct(p => ({ ...p, description: e.target.value }))} className={inputCls + ' resize-none'} placeholder="Jelaskan keunggulan produk Anda..." />
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors">Batal</button>
                <button type="submit" form="product-form" disabled={saving || uploading}
                  className="px-8 py-3 bg-[#00AA13] hover:bg-[#008810] text-white font-black rounded-xl transition-all shadow-lg shadow-[#00AA13]/20 flex items-center gap-2 disabled:opacity-50">
                  {saving ? <><Loader2 size={18} className="animate-spin" /> Menyimpan...</> : 'Simpan Produk'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={40} className="animate-spin text-[#00AA13]" />
      </div>
    }>
      <AdminProductsContent />
    </React.Suspense>
  );
}
