'use client';

import { User } from '@/types/user';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useUsers } from '@/context/user-context';
import { USER_ROLE_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Mail, Phone, Briefcase, Building } from 'lucide-react';

interface TeamMemberCardProps {
  user: User;
}

export function TeamMemberCard({ user }: TeamMemberCardProps) {
  const { getUserFullName, getUserInitials } = useUsers();

  const workloadPercent = Math.round(
    (user.activeCasesCount / user.maxCaseCapacity) * 100
  );

  const getWorkloadColor = (percent: number) => {
    if (percent >= 100) return 'bg-red-500';
    if (percent >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getWorkloadLabel = (percent: number) => {
    if (percent >= 100) return 'At Capacity';
    if (percent >= 75) return 'High';
    if (percent >= 50) return 'Moderate';
    return 'Light';
  };

  const roleConfig = USER_ROLE_CONFIG[user.role];

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-14 h-14">
            <AvatarFallback className="text-lg bg-primary/10 text-primary">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{getUserFullName(user)}</h3>
            <p className="text-sm text-muted-foreground truncate">{user.title}</p>
            <Badge
              variant={roleConfig.variant}
              className={cn('mt-2', roleConfig.className)}
            >
              {roleConfig.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="truncate text-muted-foreground">{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{user.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Building className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground capitalize">
              {user.department.replace('-', ' ')}
            </span>
          </div>
        </div>

        <Separator />

        {/* Workload */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Workload</span>
            </div>
            <span
              className={cn(
                'text-xs font-medium',
                workloadPercent >= 100
                  ? 'text-red-600'
                  : workloadPercent >= 75
                  ? 'text-yellow-600'
                  : 'text-green-600'
              )}
            >
              {getWorkloadLabel(workloadPercent)}
            </span>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  getWorkloadColor(workloadPercent)
                )}
                style={{ width: `${Math.min(workloadPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {user.activeCasesCount} active case
                {user.activeCasesCount !== 1 ? 's' : ''}
              </span>
              <span>Max: {user.maxCaseCapacity}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Employee ID */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Employee ID</span>
          <span className="font-mono">{user.employeeId}</span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge
            variant={user.isActive ? 'default' : 'secondary'}
            className={user.isActive ? 'bg-green-100 text-green-800' : ''}
          >
            {user.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
