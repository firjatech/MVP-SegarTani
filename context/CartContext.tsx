'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
  selected: boolean;
}

export interface Voucher {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'selected'>) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  toggleSelect: (id: number) => void;
  toggleSelectAll: (selected: boolean) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  totalItems: number;
  totalSelectedItems: number;
  totalPrice: number;
  appliedVoucher: Voucher | null;
  applyVoucher: (voucher: Voucher) => void;
  removeVoucher: () => void;
  discountAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart and voucher from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('segar-tani-cart');
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          Promise.resolve().then(() => setCart(parsed));
        } catch (e) {
          console.error('Failed to parse cart', e);
        }
      }

      const savedVoucher = localStorage.getItem('segar-tani-voucher');
      if (savedVoucher) {
        try {
          const parsed = JSON.parse(savedVoucher);
          Promise.resolve().then(() => setAppliedVoucher(parsed));
        } catch (e) {
          console.error('Failed to parse voucher', e);
        }
      }
      Promise.resolve().then(() => setIsInitialized(true));
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('segar-tani-cart', JSON.stringify(cart));
    }
  }, [cart, isInitialized]);

  // Save voucher to localStorage
  useEffect(() => {
    if (isInitialized) {
      if (appliedVoucher) {
        localStorage.setItem('segar-tani-voucher', JSON.stringify(appliedVoucher));
      } else {
        localStorage.removeItem('segar-tani-voucher');
      }
    }
  }, [appliedVoucher, isInitialized]);

  const addToCart = (item: Omit<CartItem, 'selected'>) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.id === item.id);
      if (existingItem) {
        return prevCart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prevCart, { ...item, selected: true }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: number) => {
    setCart((prevCart) => prevCart.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  };

  const toggleSelect = (id: number) => {
    setCart((prevCart) =>
      prevCart.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i))
    );
  };

  const toggleSelectAll = (selected: boolean) => {
    setCart((prevCart) => prevCart.map((i) => ({ ...i, selected })));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedVoucher(null);
  };

  const applyVoucher = (voucher: Voucher) => {
    setAppliedVoucher(voucher);
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalSelectedItems = cart.filter(i => i.selected).reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.filter(i => i.selected).reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Calculate discount amount
  let discountAmount = 0;
  if (appliedVoucher && totalPrice >= appliedVoucher.min_purchase) {
    if (appliedVoucher.discount_type === 'percentage') {
      discountAmount = (totalPrice * appliedVoucher.discount_value) / 100;
    } else {
      discountAmount = appliedVoucher.discount_value;
    }
  } else if (appliedVoucher && totalPrice < appliedVoucher.min_purchase) {
    // If totalPrice falls below min_purchase, auto-remove voucher (optional)
    // setAppliedVoucher(null); 
    discountAmount = 0;
  }

  return (
    <CartContext.Provider value={{ 
      cart, addToCart, removeFromCart, updateQuantity, toggleSelect, toggleSelectAll, clearCart, 
      isCartOpen, setIsCartOpen, totalItems, totalSelectedItems, totalPrice,
      appliedVoucher, applyVoucher, removeVoucher, discountAmount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
