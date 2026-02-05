'use client';

import { User } from '@/types/user';
import { Case } from '@/types/case';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUsers } from '@/context/user-context';
import { USER_ROLE_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Mail, Phone, FolderOpen, Building } from 'lucide-react';

interface TeamMemberCardProps {
  user: User;
  cases: Case[];
}

export function TeamMemberCard({ user, cases }: TeamMemberCardProps) {
  const { getUserFullName, getUserInitials } = useUsers();

  const ownedCases = cases.filter((c) => c.ownerId === user.id);
  const ownedCaseCount = ownedCases.length;

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

        {/* Case Ownership */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Dossiereigenaarschap</span>
          </div>
          <span className="text-muted-foreground">
            {ownedCaseCount} dossier{ownedCaseCount !== 1 ? 's' : ''}
          </span>
        </div>

        <Separator />

        {/* Employee ID */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Medewerker ID</span>
          <span className="font-mono">{user.employeeId}</span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge
            variant={user.isActive ? 'default' : 'secondary'}
            className={user.isActive ? 'bg-green-100 text-green-800' : ''}
          >
            {user.isActive ? 'Actief' : 'Inactief'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
