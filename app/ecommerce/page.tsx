import React, { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { cleanImageUrl } from '@/lib/image';
import EcommerceClient, { Product } from './EcommerceClient';

export const revalidate = 60;

export const metadata = {
  title: 'Katalog Produk Organik | SegarTani',
  description: 'Temukan aneka sayuran, buah-buahan, daging, dan bumbu organik segar langsung dari petani lokal.',
};

export default async function EcommercePage() {
  let initialProducts: Product[] = [];

  try {
    const [{ data: productsData, error }, { data: storesData }] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('store_profiles').select('id, store_name, store_city'),
    ]);

    if (!error && productsData) {
      const storeMap = new Map((storesData || []).map((s) => [s.id, s]));
      initialProducts = productsData.map((p) => {
        const store = p.seller_id ? storeMap.get(p.seller_id) : null;
        return {
          ...p,
          image: cleanImageUrl(p.image),
          seller_name: store?.store_name || 'SegarTani Official',
          seller_city: store?.store_city || 'Kantor Pusat',
        };
      });
    }
  } catch (err) {
    console.error('Error fetching initial products on server:', err);
  }

  return (
    <Suspense fallback={null}>
      <EcommerceClient initialProducts={initialProducts} />
    </Suspense>
  );
}
