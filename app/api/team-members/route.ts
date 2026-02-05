import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { mockUsers, mockTeams } from '@/data/mock-users';
import { getServerUserId } from '@/lib/auth-server';

// GET /api/team-members - Get all team members with their workload
export async function GET() {
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cases = store.getCases();
  const signals = store.getSignals();

  // Calculate workload for each user
  const teamMembersWithWorkload = mockUsers.map((user) => {
    const ownedCases = cases.filter((c) => c.ownerId === user.id);
    const assignedSignals = signals.filter((s) =>
      s.caseRelations.some((cr) => {
        const caseItem = cases.find((c) => c.id === cr.caseId);
        return caseItem?.ownerId === user.id;
      })
    );

    // Get case breakdown by status
    const casesByStatus = {
      application: ownedCases.filter((c) => c.status === 'application').length,
      research: ownedCases.filter((c) => c.status === 'research').length,
      national_office: ownedCases.filter((c) => c.status === 'national_office').length,
      decision: ownedCases.filter((c) => c.status === 'decision').length,
      archive: ownedCases.filter((c) => c.status === 'archive').length,
    };

    // Calculate active cases (non-archived)
    const activeCases = ownedCases.filter((c) => c.status !== 'archive').length;

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
        totalCases: ownedCases.length,
        activeCases,
        casesByStatus,
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
