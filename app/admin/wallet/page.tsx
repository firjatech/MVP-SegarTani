'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  ExternalLink,
} from 'lucide-react';
import { useWallet, BankInfo } from '@/context/WalletContext';

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/\s/g, '');
};

const BANK_OPTIONS = [
  'BCA (Bank Central Asia)',
  'Bank Mandiri',
  'BRI (Bank Rakyat Indonesia)',
  'BNI (Bank Negara Indonesia)',
  'BSI (Bank Syariah Indonesia)',
  'Bank Jago',
  'Bank Jatim',
];

export default function AdminWalletPage() {
  const { balance, pendingBalance, transactions, loading, withdraw } = useWallet();

  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bankName: 'BCA (Bank Central Asia)',
    accountNumber: '',
    accountHolder: '',
  });
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount <= 0 || !bankInfo.accountNumber || !bankInfo.accountHolder) {
      setWithdrawMessage({ type: 'error', text: 'Mohon lengkapi seluruh data rekening dan nominal penarikan.' });
      return;
    }

    setWithdrawLoading(true);
    setWithdrawMessage(null);

    const res = await withdraw(withdrawAmount, bankInfo);
    setWithdrawLoading(false);

    if (res.success) {
      setWithdrawMessage({ type: 'success', text: res.message });
      setTimeout(() => {
        setWithdrawMessage(null);
        setIsWithdrawOpen(false);
        setWithdrawAmount(0);
      }, 1800);
    } else {
      setWithdrawMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-8 pb-20 font-sans">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-primary/10 text-primary rounded-xl">
                <Wallet size={20} />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                Saldo & Penghasilan Toko
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Pantau pendapatan penjualan sayur dan buah, kelola pencairan dana hasil panen ke rekening Anda
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setWithdrawAmount(balance);
              setIsWithdrawOpen(true);
            }}
            disabled={balance <= 0}
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <ArrowUpRight size={16} />
            <span>Tarik Penghasilan</span>
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {/* Card 1: Saldo Siap Tarik */}
          <div className="bg-gradient-to-br from-emerald-800 to-primary text-white p-6 rounded-3xl shadow-lg shadow-primary/20 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 text-emerald-100 text-xs font-bold uppercase tracking-wider">
              <span>Saldo Siap Ditarik</span>
              <Wallet size={18} className="text-secondary" />
            </div>
            <h2 className="text-3xl font-black">{formatIDR(balance)}</h2>
            <p className="text-xs text-emerald-100/90 mt-2">
              Dana pesanan yang sudah selesai dan siap dicairkan ke rekening bank Anda.
            </p>
          </div>

          {/* Card 2: Saldo Tertahan (Pending) */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3 text-gray-400 text-xs font-bold uppercase tracking-wider">
              <span>Dana Dalam Pengiriman</span>
              <Clock size={18} className="text-amber-500" />
            </div>
            <h2 className="text-3xl font-black text-gray-900">{formatIDR(pendingBalance)}</h2>
            <p className="text-xs text-gray-500 mt-2">
              Akan otomatis masuk ke saldo siap tarik setelah pembeli menerima pesanan.
            </p>
          </div>

          {/* Card 3: Total Akumulasi */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3 text-gray-400 text-xs font-bold uppercase tracking-wider">
              <span>Total Pemasukan Toko</span>
              <TrendingUp size={18} className="text-blue-500" />
            </div>
            <h2 className="text-3xl font-black text-gray-900">{formatIDR(balance + pendingBalance)}</h2>
            <p className="text-xs text-gray-500 mt-2">
              Akumulasi omzet penjualan hasil kebun Anda di platform SegarTani.
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-4 bg-emerald-50/80 border border-emerald-200/60 rounded-2xl mb-8 flex items-start gap-3">
          <ShieldCheck size={20} className="text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-gray-700 leading-relaxed">
            <span className="font-bold text-gray-900">Kebijakan Pencairan Dana Otomatis:</span> Penarikan dana hasil penjualan diproses setiap hari kerja tanpa potongan biaya admin platform. Dana akan ditransfer langsung ke rekening bank Anda dalam waktu 1x24 jam.
          </div>
        </div>

        {/* Transaction History Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-7">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-gray-900">Riwayat Penghasilan & Pencairan</h3>
              <p className="text-xs text-gray-500 font-medium">Catatan pemasukan dari pesanan dan pengajuan penarikan dana</p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400 font-medium text-xs">
              Memuat riwayat transaksi...
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-gray-400 flex flex-col items-center">
              <ShoppingBag size={32} className="text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-700">Belum ada mutasi saldo</p>
              <p className="text-xs text-gray-400 max-w-xs mt-0.5">
                Setiap pesanan yang diselesaikan oleh pembeli akan otomatis menambah saldo penghasilan Anda di sini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((tx) => {
                const isIncoming = tx.type === 'topup' || tx.type === 'earning' || tx.type === 'refund';

                return (
                  <div key={tx.id} className="py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          isIncoming ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {isIncoming ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900">{tx.description}</h4>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                          {new Date(tx.created_at).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-sm sm:text-base font-black ${
                          isIncoming ? 'text-emerald-700' : 'text-gray-900'
                        }`}
                      >
                        {isIncoming ? `+${formatIDR(tx.amount)}` : `-${formatIDR(tx.amount)}`}
                      </span>
                      <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                        {tx.status === 'completed' ? 'Berhasil' : tx.status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal: Tarik Penghasilan */}
        {isWithdrawOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 text-primary rounded-xl">
                    <ArrowUpRight size={20} />
                  </div>
                  <h3 className="text-lg font-black text-gray-900">Pencairan Dana Penghasilan</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWithdrawOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {withdrawMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold mb-4 flex items-center gap-2 ${
                    withdrawMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {withdrawMessage.type === 'success' ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="text-red-600 shrink-0" />
                  )}
                  <span>{withdrawMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700">Nominal Pencairan (Rp)</label>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(balance)}
                      className="text-[11px] font-bold text-primary hover:underline"
                    >
                      Tarik Semua ({formatIDR(balance)})
                    </button>
                  </div>
                  <input
                    type="number"
                    required
                    max={balance}
                    min={10000}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-primary focus:bg-white"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Saldo tersedia: {formatIDR(balance)}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Bank Tujuan</label>
                  <select
                    value={bankInfo.bankName}
                    onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
                  >
                    {BANK_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nomor Rekening Bank</label>
                  <input
                    type="text"
                    required
                    value={bankInfo.accountNumber}
                    onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                    placeholder="Contoh: 1234567890"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-primary focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Pemilik Rekening</label>
                  <input
                    type="text"
                    required
                    value={bankInfo.accountHolder}
                    onChange={(e) => setBankInfo({ ...bankInfo, accountHolder: e.target.value })}
                    placeholder="Nama sesuai buku rekening"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-primary focus:bg-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={withdrawLoading || withdrawAmount <= 0 || withdrawAmount > balance}
                    className="w-full py-3.5 bg-primary text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-primary/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    {withdrawLoading ? 'Memproses Pengajuan...' : `Konfirmasi Pencairan ${formatIDR(withdrawAmount)}`}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

