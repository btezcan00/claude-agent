import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

// POST /api/people/brp - Search BRP (Dutch civil registry)
export async function POST(request: NextRequest) {
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
