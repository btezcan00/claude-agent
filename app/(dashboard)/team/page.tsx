'use client';

import { useUsers } from '@/context/user-context';
import { useSignals } from '@/context/signal-context';
import { TeamMemberCard } from '@/components/team/team-member-card';
import { StatsCard } from '@/components/common/stats-card';
import { Users, Radio, TrendingUp, AlertCircle } from 'lucide-react';

export default function TeamPage() {
  const { users } = useUsers();
  const { signalStats } = useSignals();

  const activeUsers = users.filter((u) => u.isActive);
  const totalActiveSignals = users.reduce((acc, u) => acc + u.activeCasesCount, 0);
  const totalCapacity = users.reduce((acc, u) => acc + u.maxCaseCapacity, 0);
  const avgWorkload = Math.round((totalActiveSignals / totalCapacity) * 100);
  const overloadedUsers = users.filter(
    (u) => u.activeCasesCount >= u.maxCaseCapacity
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
        <p className="text-muted-foreground">
          View team members and their workload
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
          title="Active Signals"
          value={signalStats.total - signalStats.closed}
          icon={Radio}
        />
        <StatsCard
          title="Avg Workload"
          value={`${avgWorkload}%`}
          icon={TrendingUp}
          valueClassName={
            avgWorkload >= 80
              ? 'text-red-600'
              : avgWorkload >= 60
              ? 'text-yellow-600'
              : 'text-green-600'
          }
        />
        <StatsCard
          title="At Capacity"
          value={overloadedUsers}
          icon={AlertCircle}
          valueClassName={overloadedUsers > 0 ? 'text-red-600' : 'text-green-600'}
        />
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <TeamMemberCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}
