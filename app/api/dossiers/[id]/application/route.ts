import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { ApplicationData } from '@/types/case';
import { requireAuth } from '@/lib/auth-server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/dossiers/:id/application - Submit/update application form data
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const user = await requireAuth();
    const data: {
      applicationData?: Partial<ApplicationData>;
      complete?: boolean;
      assignTo?: { userId: string; userName: string };
    } = await request.json();

    const caseItem = store.getCaseById(id);
    if (!caseItem) {
      return NextResponse.json(
        { error: 'Dossier niet gevonden' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      updatedAt: now,
    };

    // Update application data if provided
    if (data.applicationData) {
      updateData.applicationData = {
        ...caseItem.applicationData,
        ...data.applicationData,
      };
    }

    // Complete application if requested
    if (data.complete) {
      updateData.applicationData = {
        ...(updateData.applicationData || caseItem.applicationData),
        isCompleted: true,
        completedAt: now,
        completedBy: `${user.firstName} ${user.lastName}`,
      };
      updateData.status = 'research';
      updateData.statusDates = {
        ...caseItem.statusDates,
        research: now,
      };
    }

    // Assign case owner if requested
    if (data.assignTo) {
      updateData.ownerId = data.assignTo.userId;
      updateData.ownerName = data.assignTo.userName;
    }

    const updated = store.updateCase(id, updateData);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'User not found')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Aanvraag bijwerken mislukt' },
      { status: 400 }
    );
  }
}
