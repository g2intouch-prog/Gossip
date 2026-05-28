import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  getMembers, saveMembers, 
  getMessages, saveMessages, 
  getRequests, saveRequests,
  getPasswordResetRequests, savePasswordResetRequests
} from '@/lib/db';
import { verifySessionToken } from '@/lib/session';

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('gossip_session')?.value;
  return verifySessionToken(token);
}

export async function POST() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const groupId = session.groupId;

    // 1. Clear messages for this group
    let messages = await getMessages();
    messages = messages.filter(m => m.groupId !== groupId);
    await saveMessages(messages);

    // 2. Clear join requests for this group
    let requests = await getRequests();
    requests = requests.filter(r => r.groupId !== groupId);
    await saveRequests(requests);

    // 3. Clear password resets for this group
    let resets = await getPasswordResetRequests();
    resets = resets.filter(r => r.groupId !== groupId);
    await savePasswordResetRequests(resets);

    // 4. Clear all members for this group EXCEPT the admin user themselves
    let members = await getMembers();
    members = members.filter(m => m.groupId !== groupId || m.role === 'admin');
    await saveMembers(members);

    return NextResponse.json({ success: true, message: 'All chat messages, member profiles, and requests for this group have been wiped successfully.' });
  } catch (e) {
    console.error('Error clearing group database:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
