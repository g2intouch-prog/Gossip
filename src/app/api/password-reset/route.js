import { NextResponse } from 'next/server';
import { getMembers, getPasswordResetRequests, addPasswordResetRequest } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, groupId } = body;

    if (!username || !groupId) {
      return NextResponse.json({ error: 'Username and Group are required' }, { status: 400 });
    }

    // Verify member exists in the group
    const members = await getMembers();
    const memberExists = members.some(m => 
      m.username && m.username.toLowerCase() === username.toLowerCase() && 
      m.groupId === groupId
    );

    if (!memberExists) {
      return NextResponse.json({ error: 'No member with this username exists in the selected group' }, { status: 404 });
    }

    // Check if there is already a pending reset request
    const requests = await getPasswordResetRequests();
    const pendingExists = requests.some(r => 
      r.username && r.username.toLowerCase() === username.toLowerCase() && 
      r.groupId === groupId && 
      r.status === 'pending'
    );

    if (pendingExists) {
      return NextResponse.json({ error: 'A password reset request is already pending. Please contact your group admin.' }, { status: 400 });
    }

    const newRequest = await addPasswordResetRequest({
      username,
      groupId
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset request submitted successfully. Please wait for your group admin to reset it.',
      request: newRequest
    });
  } catch (e) {
    console.error('Error submitting password reset request:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
