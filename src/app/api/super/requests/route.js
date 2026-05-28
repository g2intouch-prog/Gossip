import { NextResponse } from 'next/server';
import { 
  getGroupRequests, 
  updateGroupRequest, 
  addGroup, 
  addMember, 
  getGroups, 
  getMembers,
  addGroupRequest
} from '@/lib/db';

export async function GET() {
  try {
    const requests = await getGroupRequests();
    return NextResponse.json(requests);
  } catch (e) {
    console.error('Error fetching group requests:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, status } = body; // 'approved' | 'rejected'

    if (!id || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'ID and status (approved/rejected) are required' }, { status: 400 });
    }

    const requests = await getGroupRequests();
    const req = requests.find(r => r.id === id);

    if (!req) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (req.status !== 'pending') {
      return NextResponse.json({ error: 'Request has already been processed' }, { status: 400 });
    }

    if (status === 'rejected') {
      const updated = await updateGroupRequest(id, 'rejected');
      return NextResponse.json({ success: true, request: updated });
    }

    // Process approval
    // Check if group name is already taken
    const groups = await getGroups();
    if (groups.some(g => g.name.toLowerCase() === req.groupName.toLowerCase())) {
      return NextResponse.json({ error: 'A group with this name already exists' }, { status: 400 });
    }

    // Check if adminUsername is taken globally
    const members = await getMembers();
    if (members.some(m => m.username && m.username.toLowerCase() === req.adminUsername.toLowerCase())) {
      return NextResponse.json({ error: 'Admin username is already taken' }, { status: 400 });
    }

    // Auto-generate 6-digit numeric passcode for the group admin
    const adminPasscode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create the group
    const newGroup = await addGroup({
      name: req.groupName,
      adminUsername: req.adminUsername,
      adminPasscode,
      aadharNumber: req.aadharNumber,
      aadharName: req.aadharName,
      paymentStatus: 'paid',
      status: 'active'
    });

    // Create the group admin user profile
    const newAdminMember = await addMember({
      name: req.adminName,
      username: req.adminUsername,
      phone: req.phone,
      passcode: adminPasscode,
      role: 'admin',
      groupId: newGroup.id
    });

    const updated = await updateGroupRequest(id, 'approved');

    return NextResponse.json({
      success: true,
      request: updated,
      group: newGroup,
      admin: newAdminMember,
      passcode: adminPasscode
    });
  } catch (e) {
    console.error('Error processing group request:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { groupName, adminName, adminUsername, phone, aadharNumber, aadharName, paymentTxnId } = body;

    if (!groupName || !adminName || !adminUsername || !phone || !aadharNumber || !aadharName || !paymentTxnId) {
      return NextResponse.json({ error: 'All fields including Aadhar, Payment Txn ID, and Admin details are required' }, { status: 400 });
    }

    const groups = await getGroups();
    if (groups.some(g => g.name.toLowerCase() === groupName.toLowerCase())) {
      return NextResponse.json({ error: 'A group with this name already exists' }, { status: 400 });
    }

    const members = await getMembers();
    if (members.some(m => m.username.toLowerCase() === adminUsername.toLowerCase())) {
      return NextResponse.json({ error: 'This Admin Username is already taken' }, { status: 400 });
    }

    const newRequest = await addGroupRequest({
      groupName,
      adminName,
      adminUsername,
      phone,
      aadharNumber,
      aadharName,
      paymentTxnId
    });

    return NextResponse.json({ success: true, request: newRequest }, { status: 201 });
  } catch (e) {
    console.error('Error submitting group request:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
