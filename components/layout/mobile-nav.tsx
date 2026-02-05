'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { useUsers } from '@/context/user-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Radio,
  FolderOpen,
  Users,
  Shield,
  LogOut,
} from 'lucide-react';

const navigation = [
  { name: 'Meldingen', href: '/meldingen', icon: Radio },
  { name: 'Dossiers', href: '/dossiers', icon: FolderOpen },
  { name: 'Team', href: '/team', icon: Users },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { currentUser, getUserInitials, getUserFullName, isLoaded } = useUsers();

  const handleSignOut = () => {
    onClose();
    signOut({ redirectUrl: '/sign-in' });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="text-base font-bold">Atlas AI</h1>
              <p className="text-xs text-muted-foreground font-normal">
                Dossierbeheer
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <nav className="px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive =
              item.href === '/meldingen'
                ? pathname === '/meldingen' || pathname.startsWith('/meldingen/')
                : item.href === '/dossiers'
                ? pathname === '/dossiers' || pathname.startsWith('/dossiers/')
                : pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <Separator />

        <div className="p-4">
          {isLoaded && currentUser ? (
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9 border-2 border-border">
                {currentUser.avatar && (
                  <AvatarImage src={currentUser.avatar} alt={getUserFullName(currentUser)} />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {getUserInitials(currentUser)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {getUserFullName(currentUser)}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentUser.title}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground shrink-0"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9 border-2 border-border">
                <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
                  --
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">
                  Laden...
                </p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
