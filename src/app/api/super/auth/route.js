import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSessionToken, verifySessionToken } from '@/lib/session';
import { getSuperAdmin, updateSuperAdmin } from '@/lib/db';

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
    const { action, username, password_1, password_2 } = body;

    if (action === 'logout') {
      const cookieStore = await cookies();
      cookieStore.delete('super_session');
      return NextResponse.json({ success: true, message: 'Logged out successfully' });
    }

    if (!username || !password_1 || !password_2) {
      return NextResponse.json({ error: 'Username, Password 1, and Password 2 are required' }, { status: 400 });
    }

    const superAdmin = await getSuperAdmin();
    if (!superAdmin || username !== superAdmin.username || password_1 !== superAdmin.password_1 || password_2 !== superAdmin.password_2) {
      return NextResponse.json({ error: 'Invalid Super Admin credentials' }, { status: 401 });
    }

    const token = await createSessionToken({
      username: superAdmin.username,
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
      user: { username: superAdmin.username, role: 'super-admin' }
    });
  } catch (e) {
    console.error('Super Admin login error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('super_session')?.value;
    const session = await verifySessionToken(token);

    if (!session || session.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username, password_1, password_2 } = body;

    if (!username || !password_1 || !password_2) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).+$/;
    if (!passwordRegex.test(password_1) || !passwordRegex.test(password_2)) {
      return NextResponse.json({ error: 'Passwords must contain an alphabet, a number, and a special character' }, { status: 400 });
    }

    const updatedData = {
      username,
      password_1,
      password_2
    };

    await updateSuperAdmin(updatedData);

    return NextResponse.json({ success: true, message: 'Super Admin credentials updated successfully' });
  } catch (e) {
    console.error('Super Admin update error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('super_session');
  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}
