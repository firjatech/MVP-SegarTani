'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Percent,
  Search,
  ExternalLink,
  Loader2,
  Calendar,
  AlertCircle,
  Truck,
} from 'lucide-react';
import Link from 'next/link';

interface VoucherData {
  id: number | string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  is_active: boolean;
  expiry_date?: string | null;
  created_at?: string;
}

const DEFAULT_ADMIN_VOUCHERS: VoucherData[] = [
  {
    id: 1,
    code: 'SEGAR10',
    discount_type: 'percentage',
    discount_value: 10,
    min_purchase: 50000,
    is_active: true,
    expiry_date: '2026-12-31T23:59:59Z',
  },
  {
    id: 2,
    code: 'DISKON20K',
    discount_type: 'fixed',
    discount_value: 20000,
    min_purchase: 100000,
    is_active: true,
    expiry_date: '2026-12-31T23:59:59Z',
  },
  {
    id: 3,
    code: 'ONGKIRSEGAR',
    discount_type: 'fixed',
    discount_value: 15000,
    min_purchase: 75000,
    is_active: true,
    expiry_date: '2026-12-31T23:59:59Z',
  },
  {
    id: 4,
    code: 'PETANIBATU',
    discount_type: 'percentage',
    discount_value: 15,
    min_purchase: 80000,
    is_active: true,
    expiry_date: '2026-12-31T23:59:59Z',
  },
  {
    id: 5,
    code: 'COBAHEMAT',
    discount_type: 'percentage',
    discount_value: 5,
    min_purchase: 0,
    is_active: true,
    expiry_date: '2026-12-31T23:59:59Z',
  },
];

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/\s/g, '');
};

export default function AdminPromosPage() {
  const [vouchers, setVouchers] = useState<VoucherData[]>(DEFAULT_ADMIN_VOUCHERS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 10,
    min_purchase: 50000,
    expiry_date: '2026-12-31',
  });

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .order('id', { ascending: false });

      if (!error && data && data.length > 0) {
        setVouchers(
          data.map((v) => ({
            id: v.id,
            code: v.code,
            discount_type: v.discount_type,
            discount_value: Number(v.discount_value),
            min_purchase: Number(v.min_purchase || 0),
            is_active: v.is_active ?? true,
            expiry_date: v.expiry_date,
            created_at: v.created_at,
          }))
        );
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleToggleStatus = async (voucher: VoucherData) => {
    const updatedStatus = !voucher.is_active;
    setVouchers((prev) =>
      prev.map((v) => (v.id === voucher.id ? { ...v, is_active: updatedStatus } : v))
    );

    try {
      await supabase
        .from('vouchers')
        .update({ is_active: updatedStatus })
        .eq('id', voucher.id);
    } catch {
      // Fallback local state sudah ter-update
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus voucher ini?')) return;

    setVouchers((prev) => prev.filter((v) => v.id !== id));
    try {
      await supabase.from('vouchers').delete().eq('id', id);
    } catch {
      // Local state sudah terhapus
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setErrorMsg('Kode voucher wajib diisi.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    const cleanCode = formData.code.trim().toUpperCase();

    const newVoucherItem: VoucherData = {
      id: Date.now(),
      code: cleanCode,
      discount_type: formData.discount_type,
      discount_value: Number(formData.discount_value),
      min_purchase: Number(formData.min_purchase || 0),
      is_active: true,
      expiry_date: formData.expiry_date ? `${formData.expiry_date}T23:59:59Z` : null,
    };

    try {
      const { data, error } = await supabase
        .from('vouchers')
        .insert({
          code: cleanCode,
          discount_type: formData.discount_type,
          discount_value: formData.discount_value,
          min_purchase: formData.min_purchase,
          expiry_date: newVoucherItem.expiry_date,
          is_active: true,
        })
        .select()
        .single();

      if (!error && data) {
        newVoucherItem.id = data.id;
      }
    } catch {
      // Database optional fallback
    }

    setVouchers((prev) => [newVoucherItem, ...prev]);
    setSaving(false);
    setIsModalOpen(false);
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_purchase: 50000,
      expiry_date: '2026-12-31',
    });
  };

  const filteredVouchers = vouchers.filter((v) =>
    v.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen pt-8 pb-20 font-sans">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-primary/10 text-primary rounded-xl">
                <Tag size={20} />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                Kelola Promo & Voucher
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Atur kupon potongan belanja dan promo gratis ongkir untuk pelanggan SegarTani
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/vouchers"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
            >
              <span>Lihat Tampilan Pembeli</span>
              <ExternalLink size={14} />
            </Link>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-emerald-700 transition-all"
            >
              <Plus size={16} />
              <span>Tambah Voucher Baru</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex items-center gap-3">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode voucher..."
            className="w-full text-xs sm:text-sm font-semibold bg-transparent border-none outline-none text-gray-800 placeholder-gray-400"
          />
        </div>

        {/* Voucher Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-black uppercase text-[10px] tracking-wider">
                  <th className="py-4 px-5">Kode Voucher</th>
                  <th className="py-4 px-5">Tipe Diskon</th>
                  <th className="py-4 px-5">Besaran Potongan</th>
                  <th className="py-4 px-5">Min. Belanja</th>
                  <th className="py-4 px-5">Berlaku Hingga</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      <Loader2 size={24} className="animate-spin mx-auto text-primary mb-2" />
                      Memuat daftar voucher...
                    </td>
                  </tr>
                ) : filteredVouchers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      Tidak ada voucher yang sesuai pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredVouchers.map((v) => {
                    const isPct = v.discount_type === 'percentage';
                    return (
                      <tr key={v.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-4 px-5 font-black text-gray-900 font-mono text-sm">
                          {v.code}
                        </td>
                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              isPct
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {isPct ? <Percent size={11} /> : <Tag size={11} />}
                            {isPct ? 'Persentase' : 'Nominal Tetap'}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-bold text-gray-800">
                          {isPct ? `${v.discount_value}%` : formatIDR(v.discount_value)}
                        </td>
                        <td className="py-4 px-5 font-semibold text-gray-600">
                          {v.min_purchase > 0 ? formatIDR(v.min_purchase) : 'Tanpa Min.'}
                        </td>
                        <td className="py-4 px-5 text-gray-500 font-medium text-xs">
                          {v.expiry_date
                            ? new Date(v.expiry_date).toLocaleDateString('id-ID')
                            : 'Permanen'}
                        </td>
                        <td className="py-4 px-5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(v)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black transition-all ${
                              v.is_active
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {v.is_active ? (
                              <CheckCircle2 size={12} className="text-emerald-600" />
                            ) : (
                              <XCircle size={12} className="text-gray-400" />
                            )}
                            <span>{v.is_active ? 'Aktif' : 'Nonaktif'}</span>
                          </button>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(v.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Hapus Voucher"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Tambah Voucher */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                <h3 className="text-lg font-black text-gray-900">Buat Voucher Promo Baru</h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl mb-4 flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateVoucher} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Kode Voucher (Huruf Besar)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: PANEN20, JUMATBERKAH"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono font-bold text-gray-900 uppercase focus:outline-none focus:border-primary focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Tipe Diskon
                    </label>
                    <select
                      value={formData.discount_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discount_type: e.target.value as 'percentage' | 'fixed',
                        })
                      }
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
                    >
                      <option value="percentage">Persentase (%)</option>
                      <option value="fixed">Nominal Rupiah (Rp)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Nilai Potongan
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.discount_value}
                      onChange={(e) =>
                        setFormData({ ...formData, discount_value: Number(e.target.value) })
                      }
                      placeholder={formData.discount_type === 'percentage' ? '10' : '20000'}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-primary focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Minimal Belanja (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.min_purchase}
                    onChange={(e) =>
                      setFormData({ ...formData, min_purchase: Number(e.target.value) })
                    }
                    placeholder="0 untuk tanpa minimum"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-primary focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Berlaku Hingga
                  </label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-primary focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-emerald-700 transition-all flex items-center gap-2"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                    <span>Simpan Voucher</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

