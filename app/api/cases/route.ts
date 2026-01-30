import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { Case, CreateCaseInput, APPLICATION_CRITERIA } from '@/types/case';
import { currentUser } from '@/data/mock-users';
import { generateCaseId } from '@/lib/utils';

// GET /api/cases - Get all cases
export async function GET() {
  const cases = store.getCases();
  return NextResponse.json(cases);
}

// POST /api/cases - Create a new case
export async function POST(request: NextRequest) {
  try {
    const data: CreateCaseInput = await request.json();
    const now = new Date().toISOString();

    const newCase: Case = {
      id: generateCaseId(),
      name: data.name,
      description: data.description,
      createdById: currentUser.id,
      createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
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
    return NextResponse.json(
      { error: 'Failed to create case' },
      { status: 400 }
    );
  }
}
