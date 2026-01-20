import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { Folder, CreateFolderInput, APPLICATION_CRITERIA } from '@/types/folder';
import { currentUser } from '@/data/mock-users';
import { generateFolderId } from '@/lib/utils';

// GET /api/folders - Get all folders
export async function GET() {
  const folders = store.getFolders();
  return NextResponse.json(folders);
}

// POST /api/folders - Create a new folder
export async function POST(request: NextRequest) {
  try {
    const data: CreateFolderInput = await request.json();
    const now = new Date().toISOString();

    const newFolder: Folder = {
      id: generateFolderId(),
      name: data.name,
      description: data.description,
      createdById: currentUser.id,
      createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
      createdAt: now,
      updatedAt: now,
      ownerId: data.ownerId || null,
      ownerName: null,
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
      location: '',
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

    const created = store.createFolder(newFolder);

    // If signalIds provided, add signals to folder
    if (data.signalIds && data.signalIds.length > 0) {
      for (const signalId of data.signalIds) {
        const signal = store.getSignalById(signalId);
        if (signal && !signal.folderRelations.some(fr => fr.folderId === newFolder.id)) {
          store.updateSignal(signalId, {
            folderRelations: [...signal.folderRelations, { folderId: newFolder.id }],
            updatedAt: now,
          });
        }
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 400 }
    );
  }
}
