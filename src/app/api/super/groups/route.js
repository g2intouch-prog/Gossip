import { NextResponse } from 'next/server';
import { 
  getGroups, 
  saveGroups, 
  addGroup, 
  updateGroup, 
  deleteGroup, 
  getMembers, 
  saveMembers, 
  getMessages, 
  saveMessages,
  getRequests,
  saveRequests,
  getPasswordResetRequests,
  savePasswordResetRequests
} from '@/lib/db';

export async function GET() {
  try {
    const groups = await getGroups();
    
    // Enrich groups with user counts
    const members = await getMembers();
    const groupsWithStats = groups.map(g => {
      const groupMembers = members.filter(m => m.groupId === g.id);
      return {
        ...g,
        memberCount: groupMembers.length,
        adminCount: groupMembers.filter(m => m.role === 'admin').length
      };
    });

    return NextResponse.json(groupsWithStats);
  } catch (e) {
    console.error('Error fetching groups:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, adminUsername, adminPasscode, aadharNumber, aadharName, paymentStatus } = body;

    if (!name || !adminUsername || !adminPasscode) {
      return NextResponse.json({ error: 'Group Name, Admin Username, and Admin Passcode are required' }, { status: 400 });
    }

    // Check if group name already exists
    const groups = await getGroups();
    if (groups.some(g => g.name.toLowerCase() === name.toLowerCase())) {
      return NextResponse.json({ error: 'A group with this name already exists' }, { status: 400 });
    }

    // Check if adminUsername is already taken globally
    const members = await getMembers();
    if (members.some(m => m.username && m.username.toLowerCase() === adminUsername.toLowerCase())) {
      return NextResponse.json({ error: 'This Admin Username is already taken by a user' }, { status: 400 });
    }

    // Create the group
    const newGroup = await addGroup({
      name,
      adminUsername,
      adminPasscode,
      aadharNumber: aadharNumber || '',
      aadharName: aadharName || '',
      paymentStatus: paymentStatus || 'paid',
      status: 'active'
    });

    // Create the group admin profile in the members collection
    const adminMember = {
      id: 'mem_' + Math.random().toString(36).substring(2, 9),
      name: aadharName || `${name} Admin`,
      username: adminUsername,
      phone: '',
      passcode: adminPasscode,
      role: 'admin',
      groupId: newGroup.id,
      lunchAvailable: false,
      dinnerAvailable: false,
      lastSeen: new Date().toISOString()
    };

    members.push(adminMember);
    await saveMembers(members);

    return NextResponse.json({ success: true, group: newGroup, admin: adminMember }, { status: 201 });
  } catch (e) {
    console.error('Error creating group:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, adminUsername, adminPasscode, aadharNumber, aadharName, paymentStatus, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const groups = await getGroups();
    const group = groups.find(g => g.id === id);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (adminUsername !== undefined) updates.adminUsername = adminUsername;
    if (adminPasscode !== undefined) updates.adminPasscode = adminPasscode;
    if (aadharNumber !== undefined) updates.aadharNumber = aadharNumber;
    if (aadharName !== undefined) updates.aadharName = aadharName;
    if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus;
    if (status !== undefined) updates.status = status;

    // Save old admin username to find the member profile
    const oldAdminUsername = group.adminUsername;

    const updated = await updateGroup(id, updates);

    // Update corresponding group admin user details in members
    let members = await getMembers();
    let adminUpdated = false;

    members = members.map(m => {
      // Find the admin of this group
      if (m.groupId === id && m.role === 'admin' && m.username && m.username === oldAdminUsername) {
        adminUpdated = true;
        return {
          ...m,
          name: aadharName !== undefined ? aadharName : m.name,
          username: adminUsername !== undefined ? adminUsername : m.username,
          passcode: adminPasscode !== undefined ? adminPasscode : m.passcode
        };
      }
      return m;
    });

    if (adminUpdated) {
      await saveMembers(members);
    }

    return NextResponse.json(updated);
  } catch (e) {
    console.error('Error updating group:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const deleted = await deleteGroup(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Clean up all data associated with this group
    // 1. Members
    let members = await getMembers();
    members = members.filter(m => m.groupId !== id);
    await saveMembers(members);

    // 2. Messages
    let messages = await getMessages();
    messages = messages.filter(m => m.groupId !== id);
    await saveMessages(messages);

    // 3. Member join requests
    let requests = await getRequests();
    requests = requests.filter(r => r.groupId !== id);
    await saveRequests(requests);

    // 4. Password reset requests
    let resets = await getPasswordResetRequests();
    resets = resets.filter(r => r.groupId !== id);
    await savePasswordResetRequests(resets);

    return NextResponse.json({ success: true, message: 'Group and all associated data deleted successfully.' });
  } catch (e) {
    console.error('Error deleting group:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
