import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { Person } from '@/types/person';
import { getServerUserId } from '@/lib/auth-server';
import { generateId } from '@/lib/utils';

// GET /api/people - Get all people or search
export async function GET(request: NextRequest) {
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (query) {
    const results = store.searchPeople(query);
    return NextResponse.json(results);
  }

  const people = store.getPeople();
  return NextResponse.json(people);
}

// POST /api/people - Create a new person
export async function POST(request: NextRequest) {
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data: Omit<Person, 'id' | 'createdAt'> = await request.json();
    const now = new Date().toISOString();

    const newPerson: Person = {
      id: generateId(),
      firstName: data.firstName,
      surname: data.surname,
      dateOfBirth: data.dateOfBirth,
      address: data.address,
      description: data.description,
      bsn: data.bsn,
      gender: data.gender,
      createdAt: now,
    };

    const created = store.createPerson(newPerson);
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Persoon aanmaken mislukt' },
      { status: 400 }
    );
  }
}
