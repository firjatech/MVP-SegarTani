'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Check } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/\s/g, '');
};

export default function CartDrawer() {
  const router = useRouter();
  const { 
    cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, 
    toggleSelect, toggleSelectAll, totalPrice, totalSelectedItems, totalItems 
  } = useCart();

  const allSelected = cart.length > 0 && cart.every(item => item.selected);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-60"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-70 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-xl text-primary">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900">Keranjang Belanja</h2>
                  <p className="text-xs font-bold text-gray-400">{totalItems} Item Produk</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            {/* Select All Bar */}
            {cart.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-100">
                <button 
                  type="button"
                  onClick={() => toggleSelectAll(!allSelected)}
                  className="flex items-center gap-3 group"
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${allSelected ? 'bg-primary border-primary' : 'bg-white border-gray-200 group-hover:border-primary'}`}>
                    {allSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                  </div>
                  <span className="text-xs font-black text-gray-600 uppercase tracking-wider">Pilih Semua</span>
                </button>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{cart.filter(i => i.selected).length} terpilih</span>
              </div>
            )}

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4 group items-center">
                    {/* Checkbox */}
                    <button 
                      type="button"
                      onClick={() => toggleSelect(item.id)}
                      className={`w-6 h-6 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all ${item.selected ? 'bg-primary border-primary shadow-md shadow-primary/20' : 'bg-white border-gray-100 hover:border-primary'}`}
                    >
                      {item.selected && <Check size={14} className="text-white" strokeWidth={4} />}
                    </button>

                    <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100 relative">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">{item.name}</h3>
                        <button 
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-xs font-black text-primary mb-3">{formatIDR(item.price)}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100">
                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm hover:text-primary"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-bold text-xs">{item.quantity}</span>
                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm hover:text-primary"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <p className={`font-black text-sm transition-colors ${item.selected ? 'text-gray-900' : 'text-gray-300'}`}>
                          {formatIDR(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center pb-20">
                  <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag size={48} className="text-gray-200" />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-2">Keranjang Kosong</h3>
                  <p className="text-sm text-gray-400 max-w-[200px] mx-auto mb-8">
                    Wah, belum ada bahan masakan di keranjangmu nih.
                  </p>
                  <button 
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="bg-primary text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-primary/20"
                  >
                    Mulai Belanja
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-8 border-t border-gray-100 bg-gray-50/50">
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-gray-400 text-sm font-bold">
                    <span>Barang Terpilih</span>
                    <span>{totalSelectedItems} Item</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <span className="text-lg font-black text-gray-900">Total Harga</span>
                    <span className="text-2xl font-black text-primary">{formatIDR(totalPrice)}</span>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    router.push('/ecommerce/checkout');
                  }}
                  disabled={totalSelectedItems === 0}
                  className={`w-full font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg group shadow-xl ${totalSelectedItems > 0 ? 'bg-primary hover:bg-[#008810] text-white shadow-primary/20' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
                >
                  {totalSelectedItems > 0 ? (
                    <>
                      Checkout ({totalSelectedItems}) <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  ) : (
                    'Pilih Barang Dulu'
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
