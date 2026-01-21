import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { mockUsers, mockTeams } from '@/data/mock-users';

// GET /api/team-members - Get all team members with their workload
export async function GET() {
  const folders = store.getFolders();
  const signals = store.getSignals();

  // Calculate workload for each user
  const teamMembersWithWorkload = mockUsers.map((user) => {
    const ownedFolders = folders.filter((f) => f.ownerId === user.id);
    const assignedSignals = signals.filter((s) =>
      s.folderRelations.some((fr) => {
        const folder = folders.find((f) => f.id === fr.folderId);
        return folder?.ownerId === user.id;
      })
    );

    // Get folder breakdown by status
    const foldersByStatus = {
      application: ownedFolders.filter((f) => f.status === 'application').length,
      research: ownedFolders.filter((f) => f.status === 'research').length,
      national_office: ownedFolders.filter((f) => f.status === 'national_office').length,
      decision: ownedFolders.filter((f) => f.status === 'decision').length,
      archive: ownedFolders.filter((f) => f.status === 'archive').length,
    };

    // Calculate active cases (non-archived)
    const activeCases = ownedFolders.filter((f) => f.status !== 'archive').length;

    return {
      id: user.id,
      employeeId: user.employeeId,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      department: user.department,
      title: user.title,
      isActive: user.isActive,
      workload: {
        totalFolders: ownedFolders.length,
        activeCases,
        foldersByStatus,
        relatedSignals: assignedSignals.length,
      },
    };
  });

  // Get team info
  const teams = mockTeams.map((team) => ({
    id: team.id,
    name: team.name,
    description: team.description,
    leader: mockUsers.find((u) => u.id === team.leaderId),
    memberCount: team.memberIds.length,
  }));

  return NextResponse.json({
    teamMembers: teamMembersWithWorkload,
    teams,
    summary: {
      totalMembers: mockUsers.length,
      activeMembers: mockUsers.filter((u) => u.isActive).length,
      totalTeams: mockTeams.length,
    },
  });
}
