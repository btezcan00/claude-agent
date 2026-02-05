import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { Address } from '@/types/address';
import { getServerUserId } from '@/lib/auth-server';
import { generateId } from '@/lib/utils';

// GET /api/addresses - Get all addresses or search
export async function GET(request: NextRequest) {
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (query) {
    const results = store.searchAddresses(query);
    return NextResponse.json(results);
  }

  const addresses = store.getAddresses();
  return NextResponse.json(addresses);
}

// POST /api/addresses - Create a new address
export async function POST(request: NextRequest) {
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data: Omit<Address, 'id' | 'createdAt'> = await request.json();
    const now = new Date().toISOString();

    const newAddress: Address = {
      id: generateId(),
      street: data.street,
      buildingType: data.buildingType,
      isActive: data.isActive,
      description: data.description,
      createdAt: now,
    };

    const created = store.createAddress(newAddress);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 400 }
    );
  }
}
