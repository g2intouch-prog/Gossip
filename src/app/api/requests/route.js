import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRequests, addRequest, updateRequest, addMember, getMembers, getGroups } from '@/lib/db';
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

    const requests = await getRequests();
    // Only return pending requests for the admin's group
    const groupRequests = requests.filter(r => r.groupId === session.groupId && r.status === 'pending');
    
    return NextResponse.json(groupRequests);
  } catch (e) {
    console.error('Error fetching requests:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, username, phone, groupId } = body;

    if (!name || !username || !phone || !groupId) {
      return NextResponse.json({ error: 'Name, Username, Phone number, and Group are required' }, { status: 400 });
    }

    // Verify group exists and is active
    const groups = await getGroups();
    const group = groups.find(g => g.id === groupId);
    if (!group || group.status !== 'active') {
      return NextResponse.json({ error: 'Selected group is not active' }, { status: 400 });
    }

    // Check if username is already a registered member globally
    const members = await getMembers();
    const usernameTaken = members.some(m => m.username && m.username.toLowerCase() === username.toLowerCase());
    if (usernameTaken) {
      return NextResponse.json({ error: 'This username is already taken by an active member' }, { status: 400 });
    }

    // Check if there is already a pending request for this username
    const requests = await getRequests();
    const pendingRequestExists = requests.some(r => r.username && r.username.toLowerCase() === username.toLowerCase() && r.status === 'pending');
    if (pendingRequestExists) {
      return NextResponse.json({ error: 'A pending request already exists for this username' }, { status: 400 });
    }

    const newRequest = await addRequest({ 
      name, 
      username, 
      phone, 
      groupId 
    });
    
    return NextResponse.json(newRequest, { status: 201 });
  } catch (e) {
    console.error('Error submitting request:', e);
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
    const { id, status } = body;

    if (!id || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'ID and valid status (approved/rejected) are required' }, { status: 400 });
    }

    const requests = await getRequests();
    const req = requests.find(r => r.id === id);

    if (!req) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (req.groupId !== session.groupId) {
      return NextResponse.json({ error: 'Forbidden. Request belongs to another group.' }, { status: 403 });
    }

    if (req.status !== 'pending') {
      return NextResponse.json({ error: 'Request has already been processed' }, { status: 400 });
    }

    const updatedRequest = await updateRequest(id, status);

    let passcode = '';
    let newMember = null;

    if (status === 'approved') {
      // Auto-generate 4-digit numeric passcode for the new member
      passcode = Math.floor(1000 + Math.random() * 9000).toString();
      
      newMember = await addMember({
        name: req.name,
        username: req.username,
        phone: req.phone,
        passcode,
        role: 'member',
        groupId: session.groupId
      });
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      passcode,
      member: newMember
    });
  } catch (e) {
    console.error('Error updating request:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
