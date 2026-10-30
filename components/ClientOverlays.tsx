'use client';

import dynamic from 'next/dynamic';

const CartDrawer = dynamic(() => import('@/components/CartDrawer'), { ssr: false });
const AOSInit = dynamic(() => import('@/components/AOSInit'), { ssr: false });

export default function ClientOverlays() {
  return (
    <>
      <CartDrawer />
      <AOSInit />
    </>
  );
}

