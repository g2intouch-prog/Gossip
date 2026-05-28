import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getMessages, addMessage } from '@/lib/db';
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

    const messages = await getMessages();

    // Filter messages:
    // 1. Must belong to the user's group (groupId)
    // 2. Must be a Group broadcast message (receiverId is null or 'group')
    // 3. OR if it is a Direct message, the caller must be the sender OR the receiver.
    const filteredMessages = messages.filter(msg => {
      if (msg.groupId !== session.groupId) return false;
      
      const isGroup = !msg.receiverId || msg.receiverId === 'group';
      const isSender = msg.senderId === session.id;
      const isReceiver = msg.receiverId === session.id;
      
      return isGroup || isSender || isReceiver;
    });

    return NextResponse.json(filteredMessages);
  } catch (e) {
    console.error('Error fetching messages:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { text, receiverId } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Message text cannot be empty' }, { status: 400 });
    }

    const newMessage = await addMessage({
      groupId: session.groupId,
      senderId: session.id,
      senderName: session.name,
      receiverId: receiverId || null, // null means group broadcast
      text: text.trim()
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (e) {
    console.error('Error sending message:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
