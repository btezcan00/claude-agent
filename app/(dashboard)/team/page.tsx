'use client';

import { useUsers } from '@/context/user-context';
import { useSignals } from '@/context/signal-context';
import { useCases } from '@/context/case-context';
import { TeamMemberCard } from '@/components/team/team-member-card';
import { StatsCard } from '@/components/common/stats-card';
import { Users, Radio, FolderOpen, UserCheck } from 'lucide-react';

export default function TeamPage() {
  const { users } = useUsers();
  const { signalStats } = useSignals();
  const { cases } = useCases();

  const activeUsers = users.filter((u) => u.isActive);
  const ownedCasesCount = cases.filter((c) => c.ownerId !== null).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
        <p className="text-muted-foreground">
          View team members and case ownership
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Team Members"
          value={activeUsers.length}
          icon={Users}
        />
        <StatsCard
          title="Total Signals"
          value={signalStats.total}
          icon={Radio}
        />
        <StatsCard
          title="Total Cases"
          value={cases.length}
          icon={FolderOpen}
        />
        <StatsCard
          title="Owned Cases"
          value={ownedCasesCount}
          icon={UserCheck}
        />
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <TeamMemberCard key={user.id} user={user} cases={cases} />
        ))}
      </div>
    </div>
  );
}
