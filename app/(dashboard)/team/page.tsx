'use client';

import { useUsers } from '@/context/user-context';
import { useSignals } from '@/context/signal-context';
import { useFolders } from '@/context/folder-context';
import { TeamMemberCard } from '@/components/team/team-member-card';
import { StatsCard } from '@/components/common/stats-card';
import { Users, Radio, FolderOpen, UserCheck } from 'lucide-react';

export default function TeamPage() {
  const { users } = useUsers();
  const { signalStats } = useSignals();
  const { folders } = useFolders();

  const activeUsers = users.filter((u) => u.isActive);
  const ownedFoldersCount = folders.filter((f) => f.ownerId !== null).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
        <p className="text-muted-foreground">
          View team members and folder ownership
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
          title="Total Folders"
          value={folders.length}
          icon={FolderOpen}
        />
        <StatsCard
          title="Owned Folders"
          value={ownedFoldersCount}
          icon={UserCheck}
        />
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <TeamMemberCard key={user.id} user={user} folders={folders} />
        ))}
      </div>
    </div>
  );
}
