import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Daftar rute yang memerlukan autentikasi
const protectedRoutes = ['/admin', '/profile', '/orders', '/ecommerce/checkout'];

// Daftar rute yang hanya untuk guest (belum login)
const guestOnlyRoutes = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cek apakah rute ini perlu diproteksi
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isGuestRoute = guestOnlyRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Baca token dari cookies Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

  if (!supabaseUrl) {
    // Jika tidak ada env vars, skip middleware
    return NextResponse.next();
  }

  // Cek semua kemungkinan cookie auth Supabase
  const cookies = request.cookies;
  let hasSession = false;

  // Cek format cookie Supabase
  for (const [name] of cookies) {
    if (name.includes('auth-token') || name.includes('sb-') && name.includes('-auth')) {
      hasSession = true;
      break;
    }
  }

  // Redirect user yang belum login dari protected routes
  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect user yang sudah login dari guest routes ke ecommerce
  if (isGuestRoute && hasSession) {
    return NextResponse.redirect(new URL('/ecommerce', request.url));
  }

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
