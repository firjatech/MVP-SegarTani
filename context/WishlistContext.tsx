'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface WishlistItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => Promise<void>;
  removeFromWishlist: (id: number) => Promise<void>;
  toggleWishlist: (item: WishlistItem) => Promise<void>;
  isInWishlist: (id: number) => boolean;
  totalWishlistItems: number;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isLoaded = useRef(false);

  // Load wishlist
  useEffect(() => {
    async function loadWishlist() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Load from Supabase
          const { data, error } = await supabase
            .from('wishlist')
            .select(`
              product_id,
              products (*)
            `)
            .eq('user_id', user.id);

          if (error) throw error;

          if (data) {
            interface WishlistRecord {
              products: {
                id: number;
                name: string;
                price: number;
                discount: number;
                image: string;
                category: string;
              };
            }
            const items: WishlistItem[] = (data as unknown as WishlistRecord[]).map((item) => {
              const p = item.products;
              const discountPrice = p.price - (p.price * p.discount / 100);
              return {
                id: p.id,
                name: p.name,
                price: discountPrice,
                image: p.image,
                category: p.category
              };
            });
            setWishlist(items);
          }
        } else {
          // Load from localStorage for guest users
          const savedWishlist = localStorage.getItem('segar-tani-wishlist');
          if (savedWishlist) {
            try {
              setWishlist(JSON.parse(savedWishlist));
            } catch (e) {
              console.error('Failed to parse wishlist', e);
            }
          }
        }
      } catch (err) {
        console.error('Error loading wishlist:', err);
      } finally {
        isLoaded.current = true;
        setLoading(false);
      }
    }

    loadWishlist();
  }, []);

  // Save to localStorage as backup/for guest sessions
  // PENTING: Hanya save setelah data awal sudah di-load agar tidak menimpa data lama
  useEffect(() => {
    if (!isLoaded.current) return;
    localStorage.setItem('segar-tani-wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = async (item: WishlistItem) => {
    // Optimistic update: langsung update state
    setWishlist((prev) => {
      if (prev.find(i => i.id === item.id)) return prev;
      return [...prev, item];
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from('wishlist')
          .insert({ user_id: user.id, product_id: item.id });
        
        if (error && error.code !== '23505') { // 23505 is unique violation
          // Rollback on error
          setWishlist((prev) => prev.filter(i => i.id !== item.id));
          throw error;
        }
      }
    } catch (err) {
      console.error('Error adding to wishlist:', err);
    }
  };

  const removeFromWishlist = async (id: number) => {
    // Simpan item untuk rollback
    const removedItem = wishlist.find(i => i.id === id);
    
    // Optimistic update: langsung hapus dari state
    setWishlist((prev) => prev.filter(i => i.id !== id));

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);
        
        if (error) {
          // Rollback on error
          if (removedItem) {
            setWishlist((prev) => [...prev, removedItem]);
          }
          throw error;
        }
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
    }
  };

  const toggleWishlist = async (item: WishlistItem) => {
    if (isInWishlist(item.id)) {
      await removeFromWishlist(item.id);
    } else {
      await addToWishlist(item);
    }
  };

  const isInWishlist = (id: number) => {
    return wishlist.some(item => item.id === id);
  };

  const totalWishlistItems = wishlist.length;

  return (
    <WishlistContext.Provider value={{ 
      wishlist, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist, totalWishlistItems, loading 
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
