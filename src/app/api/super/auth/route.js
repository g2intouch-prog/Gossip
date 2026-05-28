import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSessionToken, verifySessionToken } from '@/lib/session';

const SUPER_ADMIN_USERNAME = process.env.SUPER_ADMIN_USERNAME || 'superadmin';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'superadmin123';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('super_session')?.value;
  const session = await verifySessionToken(token);

  if (!session || session.role !== 'super-admin') {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      username: session.username,
      role: 'super-admin'
    }
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, username, password } = body;

    // Handle logout action
    if (action === 'logout') {
      const cookieStore = await cookies();
      cookieStore.delete('super_session');
      return NextResponse.json({ success: true, message: 'Logged out successfully' });
    }

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (username !== SUPER_ADMIN_USERNAME || password !== SUPER_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid Super Admin credentials' }, { status: 401 });
    }

    const token = await createSessionToken({
      username: SUPER_ADMIN_USERNAME,
      role: 'super-admin'
    });

    const host = request.headers.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const isSecure = process.env.NODE_ENV === 'production' && !isLocalhost;

    const cookieStore = await cookies();
    cookieStore.set('super_session', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict',
      path: '/'
    });

    return NextResponse.json({
      success: true,
      user: { username: SUPER_ADMIN_USERNAME, role: 'super-admin' }
    });
  } catch (e) {
    console.error('Super Admin login error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('super_session');
  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}
