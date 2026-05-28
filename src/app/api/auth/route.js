import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getMembers, updateMember, getGroups } from '@/lib/db';
import { createSessionToken, verifySessionToken } from '@/lib/session';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gossipadmin123';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('gossip_session')?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  // Fetch group name
  const groups = await getGroups();
  const group = groups.find(g => g.id === session.groupId);
  const groupName = group ? group.name : 'Unknown Group';

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.id,
      name: session.name,
      username: session.username,
      groupId: session.groupId,
      groupName: groupName,
      role: session.role
    }
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, type, username, passcode, password } = body;

    // Handle logout action
    if (action === 'logout') {
      const cookieStore = await cookies();
      cookieStore.delete('gossip_session');
      return NextResponse.json({ success: true, message: 'Logged out successfully' });
    }

    // System Fallback Admin login path
    if (type === 'admin') {
      if (!password || password !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
      }

      // Check if default admin exists
      const members = await getMembers();
      let defaultAdmin = members.find(m => m.username === 'admin');
      
      if (!defaultAdmin) {
        // If not found, use default details
        defaultAdmin = {
          id: 'admin-id-default',
          name: 'Admin User',
          username: 'admin',
          role: 'admin',
          groupId: 'group-default-id'
        };
      }

      const token = await createSessionToken({
        id: defaultAdmin.id,
        name: defaultAdmin.name,
        username: defaultAdmin.username,
        groupId: defaultAdmin.groupId,
        role: 'admin'
      });

      const host = request.headers.get('host') || '';
      const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
      const isSecure = process.env.NODE_ENV === 'production' && !isLocalhost;

      const cookieStore = await cookies();
      cookieStore.set('gossip_session', token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'strict',
        path: '/'
      });

      return NextResponse.json({
        success: true,
        user: { 
          id: defaultAdmin.id, 
          name: defaultAdmin.name, 
          username: defaultAdmin.username, 
          groupId: defaultAdmin.groupId,
          role: 'admin' 
        }
      });
    }

    // Regular member & Group admin login path (By Username)
    if (!username || !passcode) {
      return NextResponse.json({ error: 'Username and passcode are required' }, { status: 400 });
    }

    const members = await getMembers();
    const member = members.find(m => 
      m.username && m.username.toLowerCase() === username.toLowerCase() && 
      m.passcode === passcode
    );

    if (!member) {
      return NextResponse.json({ error: 'Invalid username or passcode' }, { status: 401 });
    }

    // Check if their group is active
    const groups = await getGroups();
    const group = groups.find(g => g.id === member.groupId);
    if (!group || group.status !== 'active') {
      return NextResponse.json({ error: 'Your group is currently inactive. Contact Super Admin.' }, { status: 403 });
    }

    const token = await createSessionToken({
      id: member.id,
      name: member.name,
      username: member.username,
      groupId: member.groupId,
      role: member.role || 'member'
    });

    const host = request.headers.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const isSecure = process.env.NODE_ENV === 'production' && !isLocalhost;

    const cookieStore = await cookies();
    cookieStore.set('gossip_session', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict',
      path: '/'
    });

    return NextResponse.json({
      success: true,
      user: {
        id: member.id,
        name: member.name,
        username: member.username,
        groupId: member.groupId,
        role: member.role || 'member'
      }
    });

  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Self-serve password change endpoint
export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('gossip_session')?.value;
    const session = await verifySessionToken(token);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const body = await request.json();
    const { oldPasscode, newPasscode } = body;

    if (!oldPasscode || !newPasscode) {
      return NextResponse.json({ error: 'Old passcode and new passcode are required' }, { status: 400 });
    }

    const members = await getMembers();
    const member = members.find(m => m.id === session.id);

    if (!member) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (member.passcode !== oldPasscode) {
      return NextResponse.json({ error: 'Incorrect current passcode' }, { status: 400 });
    }

    const updatedMember = await updateMember(session.id, { passcode: newPasscode });

    return NextResponse.json({ 
      success: true, 
      message: 'Passcode updated successfully',
      user: {
        id: updatedMember.id,
        name: updatedMember.name,
        username: updatedMember.username,
        groupId: updatedMember.groupId,
        role: updatedMember.role
      }
    });
  } catch (e) {
    console.error('Password change error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('gossip_session');
  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}
