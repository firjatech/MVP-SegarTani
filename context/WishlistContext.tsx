'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { runWhenIdle } from '@/lib/scheduler';

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
  const [loading, setLoading] = useState(false);

  // Load wishlist
  useEffect(() => {
    let isMounted = true;

    // Jalankan pemuatan data secara asinkron agar tidak memblokir render utama
    const cancelIdle = runWhenIdle(async () => {
      setLoading(true);
      // 1. Baca cache lokal terlebih dahulu
      try {
        const savedWishlist = localStorage.getItem('segar-tani-wishlist');
        if (savedWishlist && isMounted) {
          setWishlist(JSON.parse(savedWishlist));
        }
      } catch (e) {
        console.error('Failed to parse cached wishlist', e);
      }

      // 2. Sinkronisasi dengan Supabase jika user sudah login
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;

        if (user && isMounted) {
          const { data: dbData, error } = await supabase
            .from('wishlist')
            .select(`
              product_id,
              products (*)
            `)
            .eq('user_id', user.id);

          if (!error && dbData && isMounted) {
            type WishlistQueryResult = {
              product_id: number;
              products: {
                id: number;
                name: string;
                price: number;
                discount: number;
                image: string;
                category: string;
              };
            };

            const items: WishlistItem[] = (dbData as unknown as WishlistQueryResult[])
              .filter((item) => Boolean(item.products))
              .map((item) => {
                const p = item.products;
                const discountPrice = p.price - (p.price * (p.discount || 0)) / 100;
                return {
                  id: p.id,
                  name: p.name,
                  price: discountPrice,
                  image: p.image,
                  category: p.category,
                };
              });

            setWishlist(items);
          }
        }
      } catch (err) {
        console.error('Error syncing wishlist with Supabase:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }, 1500);

    return () => {
      isMounted = false;
      cancelIdle();
    };
  }, []);

  // Save to localStorage as backup/for guest sessions
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('segar-tani-wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, loading]);

  const addToWishlist = async (item: WishlistItem) => {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (user) {
        const { error } = await supabase
          .from('wishlist')
          .insert({ user_id: user.id, product_id: item.id });
        
        if (error && error.code !== '23505') { // 23505 is unique violation
          throw error;
        }
      }

      setWishlist((prev) => {
        if (prev.find(i => i.id === item.id)) return prev;
        return [...prev, item];
      });
    } catch (err) {
      console.error('Error adding to wishlist:', err);
    }
  };

  const removeFromWishlist = async (id: number) => {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (user) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);
        
        if (error) throw error;
      }

      setWishlist((prev) => prev.filter(i => i.id !== id));
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
