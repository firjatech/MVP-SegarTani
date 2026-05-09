'use client';

import React, { useOptimistic, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { useWishlist, WishlistItem } from '@/context/WishlistContext';

interface WishlistButtonProps {
  product: WishlistItem;
}

export default function WishlistButton({ product }: WishlistButtonProps) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isPending, startTransition] = useTransition();
  
  // Status saat ini dari context
  const currentlyInWishlist = isInWishlist(product.id);

  // useOptimistic untuk state visual instan
  const [optimisticLiked, addOptimisticLiked] = useOptimistic(
    currentlyInWishlist,
    (state, newState: boolean) => newState
  );

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Jalankan dalam transition untuk mengaktifkan state optimistik
    startTransition(async () => {
      // Update UI secara instan
      addOptimisticLiked(!optimisticLiked);
      
      try {
        await toggleWishlist(product);
      } catch (error) {
        console.error('Gagal memperbarui wishlist:', error);
        // State akan otomatis kembali ke nilai 'currentlyInWishlist' 
        // setelah transition selesai jika context tidak berubah.
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md transition-all shadow-md ${
        optimisticLiked 
          ? 'bg-red-500 text-white shadow-red-200 scale-110' 
          : 'bg-white/80 text-gray-400 hover:text-red-500 hover:scale-110'
      } ${isPending ? 'opacity-80' : 'active:scale-95'}`}
      title={optimisticLiked ? "Hapus dari Wishlist" : "Tambah ke Wishlist"}
    >
      <Heart 
        size={18} 
        className={`${optimisticLiked ? "fill-current" : ""} transition-transform duration-300`} 
      />
    </button>
  );
}
