import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { getServerUserId } from '@/lib/auth-server';

// POST /api/people/brp - Search BRP (Dutch civil registry)
export async function POST(request: NextRequest) {
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = await request.json();

    const results = store.searchBrp({
      bsn: params.bsn,
      surname: params.surname,
      firstName: params.firstName,
      dateOfBirth: params.dateOfBirth,
      street: params.street,
      houseNumber: params.houseNumber,
      zipCode: params.zipCode,
      municipality: params.municipality,
    });

    return NextResponse.json(results);
  } catch {
    return NextResponse.json(
      { error: 'Failed to search BRP' },
      { status: 400 }
    );
  }
}
