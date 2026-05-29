import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getMembers, addMember, updateMember, deleteMember } from '@/lib/db';
import { verifySessionToken } from '@/lib/session';

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('gossip_session')?.value;
  return verifySessionToken(token);
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const members = await getMembers();
    // Only return members belonging to the same group
    const groupMembers = members.filter(m => m.groupId === session.groupId);

    // Strip passcodes for regular members for security
    const sanitizedMembers = groupMembers.map(m => {
      if (session.role === 'admin') {
        return m;
      }
      const { passcode, ...rest } = m;
      return rest;
    });

    return NextResponse.json(sanitizedMembers);
  } catch (e) {
    console.error('Error fetching members:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, username, phone, passcode, role, gender, age } = body;

    if (!name || !username || !passcode || !gender || !age) {
      return NextResponse.json({ error: 'Name, Username, Passcode, Gender, and Age are required' }, { status: 400 });
    }

    const members = await getMembers();
    // Enforce globally unique usernames since users log in using only username
    const exists = members.some(m => m.username && m.username.toLowerCase() === username.toLowerCase());
    
    if (exists) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const newMember = await addMember({
      name,
      username,
      phone: phone || '',
      passcode,
      role: role || 'member',
      groupId: session.groupId, // Link member to the group of the admin who created them
      gender,
      age
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (e) {
    console.error('Error adding member:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, username, phone, passcode, role, lunchAvailable, dinnerAvailable, gender, age } = body;

    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    // Security check: non-admins can only update their own status
    if (session.role !== 'admin') {
      if (id !== session.id) {
        return NextResponse.json({ error: 'Forbidden. You can only update your own status.' }, { status: 403 });
      }

      // Restrict fields a regular user can modify
      const updates = {};
      if (lunchAvailable !== undefined) updates.lunchAvailable = !!lunchAvailable;
      if (dinnerAvailable !== undefined) updates.dinnerAvailable = !!dinnerAvailable;

      const updated = await updateMember(id, updates);
      return NextResponse.json(updated);
    }

    // Admin path: can update member details but only within their own group
    const members = await getMembers();
    const targetMember = members.find(m => m.id === id);

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (targetMember.groupId !== session.groupId) {
      return NextResponse.json({ error: 'Forbidden. Member belongs to a different group.' }, { status: 403 });
    }

    // Validate username uniqueness if changed
    if (username && (!targetMember.username || username.toLowerCase() !== targetMember.username.toLowerCase())) {
      if (members.some(m => m.username && m.username.toLowerCase() === username.toLowerCase())) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
      }
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (username !== undefined) updates.username = username;
    if (phone !== undefined) updates.phone = phone;
    if (passcode !== undefined) updates.passcode = passcode;
    if (role !== undefined) updates.role = role;
    if (gender !== undefined) updates.gender = gender;
    if (age !== undefined) updates.age = age;
    if (lunchAvailable !== undefined) updates.lunchAvailable = !!lunchAvailable;
    if (dinnerAvailable !== undefined) updates.dinnerAvailable = !!dinnerAvailable;

    const updated = await updateMember(id, updates);
    return NextResponse.json(updated);
  } catch (e) {
    console.error('Error updating member:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const members = await getMembers();
    const targetMember = members.find(m => m.id === id);

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Admins can only delete members of their own group
    if (targetMember.groupId !== session.groupId) {
      return NextResponse.json({ error: 'Forbidden. Member belongs to a different group.' }, { status: 403 });
    }

    // Don't let an admin delete themselves
    if (id === session.id) {
      return NextResponse.json({ error: 'Forbidden. You cannot delete your own admin account.' }, { status: 400 });
    }

    await deleteMember(id);
    return NextResponse.json({ success: true, message: 'Member deleted successfully' });
  } catch (e) {
    console.error('Error deleting member:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
