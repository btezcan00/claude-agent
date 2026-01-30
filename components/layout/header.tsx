'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, Search, Menu, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUsers } from '@/context/user-context';
import { useSignals } from '@/context/signal-context';
import { useChatDrawer } from '@/context/chat-drawer-context';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { useEffect, useState } from 'react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { currentUser, getUserInitials, getUserFullName } = useUsers();
  const { setSearchQuery, searchQuery } = useSignals();
  const { isOpen: isChatOpen, toggle: toggleChat } = useChatDrawer();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [mounted, setMounted] = useState(false);
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: { label: string; href: string }[] = [];

    paths.forEach((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');
      let label = path.charAt(0).toUpperCase() + path.slice(1);

      if (path === 'signals') {
        label = 'Signals';
      } else if (path === 'cases') {
        label = 'Cases';
      } else if (path === 'team') {
        label = 'Teams';
      } else if (paths[index - 1] === 'signals') {
        label = 'Signal Details';
      } else if (paths[index - 1] === 'cases') {
        label = 'Case Details';
      }

      breadcrumbs.push({ label, href });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="flex items-center h-16 px-6 bg-card border-b border-border">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden mr-4"
        onClick={onMenuClick}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Breadcrumbs */}
      <nav className="hidden sm:flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-2">
            {index > 0 && (
              <span className="text-muted-foreground">/</span>
            )}
            <Link
              href={crumb.href}
              className={cn(
                'transition-colors',
                index === breadcrumbs.length - 1
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {crumb.label}
            </Link>
          </div>
        ))}
      </nav>

      {/* Search - Only show on signals page */}
      {pathname === '/signals' && (
        <div className="hidden md:flex items-center gap-2 ml-auto mr-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search signals..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-64 pl-9 bg-background"
            />
          </div>
        </div>
      )}

      {/* Right Section */}
      <div className={cn('flex items-center gap-3', pathname !== '/signals' && 'ml-auto')}>
        {/* Chat Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleChat}
          className={cn(
            'relative bg-primary text-primary-foreground hover:bg-primary/90',
            isChatOpen && 'ring-2 ring-primary/50'
          )}
          title="Toggle Chat (Cmd+/)"
        >
          <MessageCircle className="w-5 h-5" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {/* User Menu */}
        {mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {getUserInitials(currentUser)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{getUserFullName(currentUser)}</p>
                  <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {getUserInitials(currentUser)}
              </AvatarFallback>
            </Avatar>
          </Button>
        )}
      </div>
    </header>
  );
}
