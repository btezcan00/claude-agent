import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { ApplicationData } from '@/types/case';
import { currentUser } from '@/data/mock-users';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/cases/:id/application - Submit/update application form data
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const data: {
      applicationData?: Partial<ApplicationData>;
      complete?: boolean;
      assignTo?: { userId: string; userName: string };
    } = await request.json();

    const caseItem = store.getCaseById(id);
    if (!caseItem) {
      return NextResponse.json(
        { error: 'Case not found' },
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
        completedBy: `${currentUser.firstName} ${currentUser.lastName}`,
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
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 400 }
    );
  }
}
