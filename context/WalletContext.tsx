'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useNotifications } from './NotificationContext';

export interface WalletTransaction {
  id: string;
  type: 'topup' | 'payment' | 'payout' | 'refund' | 'earning';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  reference_id?: string;
  created_at: string;
}

export interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface WalletContextType {
  balance: number;
  pendingBalance: number;
  transactions: WalletTransaction[];
  loading: boolean;
  topUp: (amount: number, method?: string) => Promise<boolean>;
  withdraw: (amount: number, bankInfo: BankInfo) => Promise<{ success: boolean; message: string }>;
  payWithWallet: (amount: number, orderId: string) => Promise<{ success: boolean; message: string }>;
  refreshWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/\s/g, '');
};

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<number>(0);
  const [pendingBalance, setPendingBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Helper untuk notifikasi
  const { addNotification } = useNotifications();

  // Load wallet data
  const loadWallet = useCallback(async (userId: string) => {
    try {
      setLoading(true);

      // 1. Coba ambil dari Supabase
      let dbBalance: number | null = null;
      let dbTx: WalletTransaction[] = [];

      try {
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', userId)
          .maybeSingle();

        if (walletData && typeof walletData.balance === 'number') {
          dbBalance = walletData.balance;
        }

        const { data: txData } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30);

        if (txData && txData.length > 0) {
          dbTx = txData.map((t) => ({
            id: String(t.id),
            type: t.type,
            amount: Number(t.amount),
            status: t.status,
            description: t.description,
            reference_id: t.reference_id,
            created_at: t.created_at,
          }));
        }
      } catch {
        // Table fallback
      }

      // 2. Ambil dari LocalStorage jika Supabase belum ada
      const localKey = `segar_wallet_${userId}`;
      const savedLocal = localStorage.getItem(localKey);
      let localBalance = 0;
      let localTx: WalletTransaction[] = [];

      if (savedLocal) {
        try {
          const parsed = JSON.parse(savedLocal);
          localBalance = parsed.balance ?? 0;
          localTx = parsed.transactions ?? [];
        } catch {
          // ignore error
        }
      } else {
        // Berikan saldo sambutan awal Rp 50.000 untuk pengguna baru
        localBalance = 50000;
        localTx = [
          {
            id: `init-${Date.now()}`,
            type: 'topup',
            amount: 50000,
            status: 'completed',
            description: 'Saldo Sambutan Selamat Datang SegarTani 🌾',
            created_at: new Date().toISOString(),
          },
        ];
        localStorage.setItem(localKey, JSON.stringify({ balance: localBalance, transactions: localTx }));
      }

      // Hitung penghasilan pesanan (jika user adalah penjual)
      try {
        const { data: sellerOrders } = await supabase
          .from('orders')
          .select('id, total_price, status, created_at')
          .order('created_at', { ascending: false });

        if (sellerOrders && sellerOrders.length > 0) {
          const completedOrders = sellerOrders.filter((o) => o.status === 'completed');
          const pendingOrders = sellerOrders.filter(
            (o) => o.status === 'processing' || o.status === 'shipped' || o.status === 'pending'
          );

          const pendingSum = pendingOrders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
          setPendingBalance(pendingSum);

          // Jika ada pesanan selesai yang belum tercatat di transaksi dompet penjual
          const role = localStorage.getItem('segar-tani-role');
          if (role === 'seller' && completedOrders.length > 0) {
            const earningsSum = completedOrders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
            if (earningsSum > 0 && localBalance < earningsSum) {
              localBalance = earningsSum;
            }
          }
        }
      } catch {
        // ignore orders error
      }

      const finalBalance = dbBalance !== null ? dbBalance : localBalance;
      const finalTx = dbTx.length > 0 ? dbTx : localTx;

      setBalance(finalBalance);
      setTransactions(finalTx);
    } catch (err) {
      console.error('Error loading wallet:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data?.session?.user;
      if (user) {
        setCurrentUserId(user.id);
        loadWallet(user.id);
      } else {
        setCurrentUserId(null);
        setBalance(0);
        setPendingBalance(0);
        setTransactions([]);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (user) {
        setCurrentUserId(user.id);
        loadWallet(user.id);
      } else {
        setCurrentUserId(null);
        setBalance(0);
        setPendingBalance(0);
        setTransactions([]);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadWallet]);

  // Simpan perubahan ke LocalStorage & Supabase
  const persistWallet = useCallback(
    async (userId: string, newBalance: number, newTx: WalletTransaction[]) => {
      // LocalStorage
      localStorage.setItem(
        `segar_wallet_${userId}`,
        JSON.stringify({ balance: newBalance, transactions: newTx })
      );

      // Supabase
      try {
        await supabase
          .from('wallets')
          .upsert({ user_id: userId, balance: newBalance, updated_at: new Date().toISOString() });
      } catch {
        // Fallback lokal aktif
      }
    },
    []
  );

  // Top Up Saldo
  const topUp = async (amount: number, method: string = 'Virtual Account'): Promise<boolean> => {
    if (!currentUserId || amount <= 0) return false;

    const newBalance = balance + amount;
    const newTxItem: WalletTransaction = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tx-${Date.now()}`,
      type: 'topup',
      amount,
      status: 'completed',
      description: `Isi Saldo (Top Up) via ${method}`,
      created_at: new Date().toISOString(),
    };

    const updatedTx = [newTxItem, ...transactions];
    setBalance(newBalance);
    setTransactions(updatedTx);

    await persistWallet(currentUserId, newBalance, updatedTx);

    // Kirim notifikasi
    try {
      await addNotification({
        title: 'Top Up Saldo Berhasil! 💰',
        message: `Saldo sebesar ${formatIDR(amount)} telah berhasil ditambahkan ke akun Anda. Saldo aktif sekarang: ${formatIDR(newBalance)}.`,
        type: 'order',
        link: '/wallet',
      });
    } catch {
      // notification fallback
    }

    return true;
  };

  // Tarik Saldo / Pencairan Dana ke Rekening Bank
  const withdraw = async (
    amount: number,
    bankInfo: BankInfo
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUserId) {
      return { success: false, message: 'Silakan login terlebih dahulu.' };
    }
    if (amount <= 0) {
      return { success: false, message: 'Nominal penarikan tidak valid.' };
    }
    if (amount > balance) {
      return { success: false, message: 'Saldo Anda tidak mencukupi untuk penarikan ini.' };
    }

    const newBalance = balance - amount;
    const newTxItem: WalletTransaction = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `wd-${Date.now()}`,
      type: 'payout',
      amount,
      status: 'completed',
      description: `Pencairan Saldo ke ${bankInfo.bankName} (${bankInfo.accountNumber} a.n. ${bankInfo.accountHolder})`,
      created_at: new Date().toISOString(),
    };

    const updatedTx = [newTxItem, ...transactions];
    setBalance(newBalance);
    setTransactions(updatedTx);

    await persistWallet(currentUserId, newBalance, updatedTx);

    // Notifikasi
    try {
      await addNotification({
        title: 'Pencairan Dana Berhasil! 🏦',
        message: `Penarikan saldo sebesar ${formatIDR(amount)} ke rekening ${bankInfo.bankName} (${bankInfo.accountNumber}) telah diproses.`,
        type: 'system',
        link: '/wallet',
      });
    } catch {
      // notification fallback
    }

    return {
      success: true,
      message: `Pencairan dana ${formatIDR(amount)} ke rekening ${bankInfo.bankName} berhasil diproses.`,
    };
  };

  // Bayar Transaksi dengan Saldo
  const payWithWallet = async (
    amount: number,
    orderId: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUserId) {
      return { success: false, message: 'Silakan login terlebih dahulu.' };
    }
    if (amount > balance) {
      return { success: false, message: `Saldo Anda (${formatIDR(balance)}) tidak mencukupi.` };
    }

    const newBalance = balance - amount;
    const newTxItem: WalletTransaction = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pay-${Date.now()}`,
      type: 'payment',
      amount,
      status: 'completed',
      description: `Pembayaran Pesanan #${orderId}`,
      reference_id: orderId,
      created_at: new Date().toISOString(),
    };

    const updatedTx = [newTxItem, ...transactions];
    setBalance(newBalance);
    setTransactions(updatedTx);

    await persistWallet(currentUserId, newBalance, updatedTx);

    try {
      await addNotification({
        title: 'Pembayaran Saldo Berhasil! ✅',
        message: `Pembayaran pesanan #${orderId} sebesar ${formatIDR(amount)} berhasil dipotong dari Saldo SegarTani.`,
        type: 'order',
        link: '/orders',
      });
    } catch {
      // notification fallback
    }

    return { success: true, message: 'Pembayaran dengan saldo berhasil!' };
  };

  const refreshWallet = async () => {
    if (currentUserId) {
      await loadWallet(currentUserId);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        balance,
        pendingBalance,
        transactions,
        loading,
        topUp,
        withdraw,
        payWithWallet,
        refreshWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

