import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { Organization } from '@/types/organization';
import { getServerUserId } from '@/lib/auth-server';
import { generateId } from '@/lib/utils';

// GET /api/organizations - Get all organizations or search
export async function GET(request: NextRequest) {
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (query) {
    const results = store.searchOrganizations(query);
    return NextResponse.json(results);
  }

  const organizations = store.getOrganizations();
  return NextResponse.json(organizations);
}

// POST /api/organizations - Create a new organization
export async function POST(request: NextRequest) {
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data: Omit<Organization, 'id' | 'createdAt'> = await request.json();
    const now = new Date().toISOString();

    const newOrganization: Organization = {
      id: generateId(),
      name: data.name,
      type: data.type,
      address: data.address,
      description: data.description,
      chamberOfCommerce: data.chamberOfCommerce,
      createdAt: now,
    };

    const created = store.createOrganization(newOrganization);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 400 }
    );
  }
}
