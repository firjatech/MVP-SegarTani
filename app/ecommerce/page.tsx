import React from 'react';
import { unstable_cache } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { cleanImageUrl } from '@/lib/image';
import EcommerceClient, { Product } from './EcommerceClient';

export const metadata = {
  title: 'Katalog Produk Organik | SegarTani',
  description: 'Temukan aneka sayuran, buah-buahan, daging, dan bumbu organik segar langsung dari petani lokal.',
};

// Cache hasil fetch produk selama 60 detik di Next.js Data Cache.
// Route tetap Dynamic (karena searchParams untuk filter URL),
// tapi query Supabase tidak dipanggil ulang pada tiap request — cukup cache hit.
const getCachedProducts = unstable_cache(
  async (): Promise<Product[]> => {
    try {
      const [{ data: productsData, error }, { data: storesData }] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('store_profiles').select('id, store_name, store_city'),
      ]);
      if (error || !productsData) return [];
      const storeMap = new Map((storesData || []).map((s) => [s.id, s]));
      return productsData.map((p) => {
        const store = p.seller_id ? storeMap.get(p.seller_id) : null;
        return {
          ...p,
          image: cleanImageUrl(p.image),
          seller_name: store?.store_name || 'SegarTani Official',
          seller_city: store?.store_city || 'Kantor Pusat',
        };
      });
    } catch (err) {
      console.error('Error fetching products (unstable_cache):', err);
      return [];
    }
  },
  ['ecommerce-products-v1'],
  { revalidate: 60, tags: ['products'] }
);

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EcommercePage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const initialQuery = typeof resolvedParams?.q === 'string' ? resolvedParams.q : '';
  const initialCategory = typeof resolvedParams?.category === 'string' ? resolvedParams.category : 'Semua';

  const initialProducts = await getCachedProducts();

  return (
    <EcommerceClient
      initialProducts={initialProducts}
      initialQuery={initialQuery}
      initialCategory={initialCategory}
    />
  );
}
