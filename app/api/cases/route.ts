import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { Case, CreateCaseInput, APPLICATION_CRITERIA } from '@/types/case';
import { requireAuth, getServerUserId } from '@/lib/auth-server';
import { generateCaseId } from '@/lib/utils';

// GET /api/cases - Get all cases
export async function GET() {
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cases = store.getCases();
  return NextResponse.json(cases);
}

// POST /api/cases - Create a new case
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const data: CreateCaseInput = await request.json();
    const now = new Date().toISOString();

    const newCase: Case = {
      id: generateCaseId(),
      name: data.name,
      description: data.description,
      createdById: user.id,
      createdByName: `${user.firstName} ${user.lastName}`,
      createdAt: now,
      updatedAt: now,
      ownerId: data.ownerId || null,
      ownerName: data.ownerName || null,
      color: data.color,
      icon: data.icon,
      status: 'application',
      statusDates: {
        application: now,
      },
      tags: [],
      signalTypes: [],
      practitioners: [],
      sharedWith: [],
      location: data.location || '',
      notes: [],
      organizations: [],
      addresses: [],
      peopleInvolved: [],
      letters: [],
      findings: [],
      attachments: [],
      records: [],
      communications: [],
      suggestions: [],
      visualizations: [],
      activities: [],
      fileAttachments: [],
      chatMessages: [],
      applicationData: {
        explanation: '',
        criteria: APPLICATION_CRITERIA.map((c) => ({
          id: c.id,
          name: c.name,
          label: c.label,
          isMet: false,
          explanation: '',
        })),
        isCompleted: false,
      },
    };

    const created = store.createCase(newCase);

    // If signalIds provided, add signals to case
    if (data.signalIds && data.signalIds.length > 0) {
      for (const signalId of data.signalIds) {
        const signal = store.getSignalById(signalId);
        if (signal && !signal.caseRelations.some(cr => cr.caseId === newCase.id)) {
          store.updateSignal(signalId, {
            caseRelations: [...signal.caseRelations, { caseId: newCase.id }],
            updatedAt: now,
          });
        }
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'User not found')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to create case' },
      { status: 400 }
    );
  }
}
