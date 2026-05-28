import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPasswordResetRequests, savePasswordResetRequests, getMembers, updateMember } from '@/lib/db';
import { verifySessionToken } from '@/lib/session';

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('gossip_session')?.value;
  return verifySessionToken(token);
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const resets = await getPasswordResetRequests();
    // Return pending requests for this group
    const groupResets = resets.filter(r => r.groupId === session.groupId && r.status === 'pending');
    
    return NextResponse.json(groupResets);
  } catch (e) {
    console.error('Error fetching password reset requests:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, newPasscode } = body;

    if (!id || !newPasscode) {
      return NextResponse.json({ error: 'Request ID and new passcode are required' }, { status: 400 });
    }

    const resets = await getPasswordResetRequests();
    const resetReq = resets.find(r => r.id === id);

    if (!resetReq) {
      return NextResponse.json({ error: 'Reset request not found' }, { status: 404 });
    }

    if (resetReq.groupId !== session.groupId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find the member to update
    const members = await getMembers();
    const member = members.find(m => 
      m.username.toLowerCase() === resetReq.username.toLowerCase() && 
      m.groupId === session.groupId
    );

    if (!member) {
      return NextResponse.json({ error: 'Corresponding member not found' }, { status: 404 });
    }

    // Update the member's passcode
    await updateMember(member.id, { passcode: newPasscode });

    // Mark the reset request as resolved
    const updatedResets = resets.map(r => {
      if (r.id === id) {
        return { ...r, status: 'resolved' };
      }
      return r;
    });
    await savePasswordResetRequests(updatedResets);

    return NextResponse.json({ success: true, message: 'Password reset and request resolved.' });
  } catch (e) {
    console.error('Error resolving reset request:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
