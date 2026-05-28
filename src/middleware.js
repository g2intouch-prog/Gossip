import { NextResponse } from 'next/server';
import { verifySessionToken } from './lib/session';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Bypass public APIs
  if (pathname === '/api/public-groups' || pathname === '/api/password-reset') {
    return NextResponse.next();
  }

  // 2. Super Admin API authorization
  if (pathname.startsWith('/api/super')) {
    // POST /api/super/auth is open so they can log in
    // POST /api/super/requests is open so users can request a new group
    if ((pathname === '/api/super/auth' || pathname === '/api/super/requests') && request.method === 'POST') {
      return NextResponse.next();
    }

    const superSessionCookie = request.cookies.get('super_session')?.value;
    const session = await verifySessionToken(superSessionCookie);

    if (!session || session.role !== 'super-admin') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized. Super Admin access required.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return NextResponse.next();
  }

  // 3. Regular group member APIs authentication & authorization
  if (
    pathname.startsWith('/api/chat') || 
    pathname.startsWith('/api/members') || 
    pathname.startsWith('/api/requests') || 
    pathname.startsWith('/api/admin')
  ) {
    
    // Allow access to POST /api/requests (anyone can request to join)
    if (pathname === '/api/requests' && request.method === 'POST') {
      return NextResponse.next();
    }
    
    // Allow access to POST /api/auth (anyone can try to log in)
    if (pathname === '/api/auth' && request.method === 'POST') {
      return NextResponse.next();
    }

    const sessionCookie = request.cookies.get('gossip_session')?.value;
    const session = await verifySessionToken(sessionCookie);

    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized. Please log in.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Admin authorization checks
    // POST and DELETE /api/members are admin-only
    // GET and PUT /api/requests are admin-only
    // POST /api/admin/clear is admin-only
    const isAdminOnlyRoute = 
      (pathname === '/api/members' && ['POST', 'DELETE'].includes(request.method)) ||
      (pathname === '/api/requests' && ['GET', 'PUT'].includes(request.method)) ||
      pathname.startsWith('/api/admin/clear');

    if (isAdminOnlyRoute && session.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden. Admin privileges required.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
