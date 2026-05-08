import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Karena aplikasi menggunakan @supabase/supabase-js standard (bukan @supabase/ssr),
  // session disimpan di localStorage yang tidak bisa dibaca oleh middleware/proxy Edge.
  // Oleh karena itu, proteksi rute ditangani di masing-masing client component (misal: checkout/page.tsx, admin/page.tsx).
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/profile/:path*',
    '/orders/:path*',
    '/ecommerce/checkout/:path*',
    '/login',
    '/register',
  ],
};
