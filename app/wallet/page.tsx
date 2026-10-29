'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  ArrowLeft,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Building2,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
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

const TOPUP_PRESETS = [25000, 50000, 100000, 200000, 500000];

const BANK_OPTIONS = [
  'BCA (Bank Central Asia)',
  'Bank Mandiri',
  'BRI (Bank Rakyat Indonesia)',
  'BNI (Bank Negara Indonesia)',
  'Bank Jago',
  'GoPay / GoTo Financial',
  'OVO',
  'DANA',
  'ShopeePay',
];

export default function BuyerWalletPage() {
  const { balance, transactions, loading, topUp, withdraw } = useWallet();

  const [activeTab, setActiveTab] = useState<'all' | 'in' | 'out'>('all');
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  // Top Up Form State
  const [topUpAmount, setTopUpAmount] = useState<number>(50000);
  const [topUpMethod, setTopUpMethod] = useState<'qris' | 'va_bca' | 'va_mandiri' | 'transfer'>('qris');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpSuccess, setTopUpSuccess] = useState(false);

  // Withdraw Form State
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bankName: 'BCA (Bank Central Asia)',
    accountNumber: '',
    accountHolder: '',
  });
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topUpAmount <= 0) return;

    setTopUpLoading(true);
    let methodLabel = 'QRIS Instant';
    if (topUpMethod === 'va_bca') methodLabel = 'BCA Virtual Account';
    if (topUpMethod === 'va_mandiri') methodLabel = 'Mandiri Virtual Account';
    if (topUpMethod === 'transfer') methodLabel = 'Transfer Bank';

    await topUp(topUpAmount, methodLabel);
    setTopUpLoading(false);
    setTopUpSuccess(true);

    setTimeout(() => {
      setTopUpSuccess(false);
      setIsTopUpOpen(false);
    }, 1800);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount <= 0 || !bankInfo.accountNumber || !bankInfo.accountHolder) {
      setWithdrawMessage({ type: 'error', text: 'Mohon lengkapi seluruh data rekening dan nominal.' });
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

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === 'in') return tx.type === 'topup' || tx.type === 'refund' || tx.type === 'earning';
    if (activeTab === 'out') return tx.type === 'payment' || tx.type === 'payout';
    return true;
  });

  return (
    <div className="bg-gray-50 min-h-screen pt-12 pb-24 font-sans">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        {/* Navigation */}
        <header className="mb-6">
          <Link
            href="/ecommerce"
            className="items-center gap-2 text-gray-500 font-bold hover:text-primary transition-colors mb-6 group inline-flex"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Kembali ke Belanja
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-gray-900">Saldo & Dompet Saya</h1>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
              SegarPay
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500 mt-1">
            Gunakan saldo untuk pembayaran belanja cepat 1-klik tanpa repot transfer manual
          </p>
        </header>

        {/* Digital Wallet Card */}
        <div className="relative bg-gradient-to-br from-emerald-800 via-primary to-emerald-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-primary/25 overflow-hidden mb-8 border border-emerald-600/30">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-secondary/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-100 text-xs font-black uppercase tracking-widest mb-2">
                <Wallet size={16} className="text-secondary" />
                <span>Saldo Aktif SegarTani</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
                {formatIDR(balance)}
              </h2>
              <div className="flex items-center gap-2 mt-3 text-xs text-emerald-100/90 font-medium">
                <ShieldCheck size={16} className="text-secondary" />
                <span>Tersimpan aman & siap digunakan untuk belanja produk segar</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() => {
                  setTopUpSuccess(false);
                  setIsTopUpOpen(true);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 bg-white text-primary text-sm font-black rounded-2xl shadow-lg shadow-black/10 hover:bg-gray-50 transition-all cursor-pointer"
              >
                <PlusCircle size={18} />
                <span>Isi Saldo (Top Up)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setWithdrawAmount(Math.min(balance, 50000));
                  setIsWithdrawOpen(true);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 bg-white/15 hover:bg-white/20 text-white text-sm font-black rounded-2xl backdrop-blur-sm border border-white/20 transition-all cursor-pointer"
              >
                <ArrowUpRight size={18} />
                <span>Tarik Dana</span>
              </button>
            </div>
          </div>
        </div>

        {/* Benefits banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-primary rounded-xl shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Bayar Instan 1-Klik</h4>
              <p className="text-[11px] text-gray-500">Checkout otomatis tanpa unggah bukti transfer</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Garansi Refund Mudah</h4>
              <p className="text-[11px] text-gray-500">Kompensasi produk rusak langsung kembali ke saldo</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
              <CreditCard size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Bisa Ditarik Kapan Saja</h4>
              <p className="text-[11px] text-gray-500">Cairkan saldo ke semua bank & e-wallet resmi</p>
            </div>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-black text-gray-900">Riwayat Mutasi Saldo</h3>
              <p className="text-xs text-gray-500 font-medium">Catatan pemasukan, belanja, dan penarikan dana</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl text-xs font-bold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('in')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'in' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('out')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'out' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Keluar
              </button>
            </div>
          </div>

          {/* Transaction List */}
          {loading ? (
            <div className="py-12 text-center text-gray-400 font-medium text-xs">
              Memuat riwayat transaksi...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-gray-400 flex flex-col items-center">
              <Clock size={32} className="text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-700">Belum ada riwayat transaksi</p>
              <p className="text-xs text-gray-400 max-w-xs mt-0.5">
                Transaksi isi saldo dan pembayaran belanja Anda akan tercatat rapi di sini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTransactions.map((tx) => {
                const isIncoming = tx.type === 'topup' || tx.type === 'refund' || tx.type === 'earning';

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

        {/* Modal: Isi Saldo (Top Up) */}
        {isTopUpOpen && (
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
                    <PlusCircle size={20} />
                  </div>
                  <h3 className="text-lg font-black text-gray-900">Isi Saldo SegarPay</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTopUpOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {topUpSuccess ? (
                <div className="py-8 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle2 size={36} />
                  </div>
                  <h4 className="text-lg font-black text-gray-900 mb-1">Top Up Berhasil!</h4>
                  <p className="text-xs text-gray-500">
                    Saldo sebesar {formatIDR(topUpAmount)} telah ditambahkan ke dompet Anda.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleTopUpSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Pilih Nominal Cepat
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {TOPUP_PRESETS.map((nominal) => (
                        <button
                          key={nominal}
                          type="button"
                          onClick={() => setTopUpAmount(nominal)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                            topUpAmount === nominal
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {formatIDR(nominal)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Atau Masukkan Nominal Sendiri (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      min={10000}
                      step={5000}
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-primary focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Metode Pembayaran
                    </label>
                    <div className="space-y-2">
                      {[
                        { id: 'qris', label: 'QRIS Instant (GoPay, OVO, Dana, LinkAja)', icon: QrCode },
                        { id: 'va_bca', label: 'BCA Virtual Account', icon: Building2 },
                        { id: 'va_mandiri', label: 'Mandiri Virtual Account', icon: Building2 },
                        { id: 'transfer', label: 'Transfer Bank Manual', icon: CreditCard },
                      ].map((item) => (
                        <label
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            topUpMethod === item.id
                              ? 'border-primary bg-emerald-50/50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="topUpMethod"
                            checked={topUpMethod === item.id}
                            onChange={() => setTopUpMethod(item.id as typeof topUpMethod)}
                            className="text-primary focus:ring-primary"
                          />
                          <item.icon size={16} className="text-gray-500" />
                          <span className="text-xs font-bold text-gray-800">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={topUpLoading || topUpAmount <= 0}
                      className="w-full py-3.5 bg-primary text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-primary/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
                    >
                      {topUpLoading ? 'Memproses Transaksi...' : `Konfirmasi Top Up ${formatIDR(topUpAmount)}`}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}

        {/* Modal: Tarik Dana */}
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
                  <h3 className="text-lg font-black text-gray-900">Tarik Saldo ke Rekening</h3>
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
                    <label className="text-xs font-bold text-gray-700">Nominal Penarikan (Rp)</label>
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
                  <label className="block text-xs font-bold text-gray-700 mb-1">Bank / E-Wallet Tujuan</label>
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
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nomor Rekening / Nomor HP E-Wallet</label>
                  <input
                    type="text"
                    required
                    value={bankInfo.accountNumber}
                    onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                    placeholder="Contoh: 08123456789 atau 8730129381"
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
                    placeholder="Nama sesuai buku rekening / identitas"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-primary focus:bg-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={withdrawLoading || withdrawAmount <= 0 || withdrawAmount > balance}
                    className="w-full py-3.5 bg-primary text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-primary/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    {withdrawLoading ? 'Memproses Penarikan...' : `Kirim Penarikan ${formatIDR(withdrawAmount)}`}
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

