import { NextResponse } from 'next/server';
import { getGroups } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const groups = await getGroups();
    const activeGroups = groups
      .filter(g => g.status === 'active')
      .map(g => ({
        id: g.id,
        name: g.name
      }));

    return NextResponse.json(activeGroups);
  } catch (e) {
    console.error('Error fetching public groups:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
