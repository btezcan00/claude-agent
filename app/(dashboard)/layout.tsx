'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { ChatBot } from '@/components/chat/chat-bot';
import { SignalProvider } from '@/context/signal-context';
import { FolderProvider } from '@/context/folder-context';
import { UserProvider } from '@/context/user-context';
import { OrganizationProvider } from '@/context/organization-context';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show a simple loading state during SSR/hydration
  if (!mounted) {
    return (
      <div className="flex h-screen bg-background">
        <div className="hidden lg:block w-64 bg-card border-r border-border" />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="h-16 bg-card border-b border-border" />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* AI Chat Bot */}
      <ChatBot />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <SignalProvider>
        <FolderProvider>
          <OrganizationProvider>
            <DashboardContent>{children}</DashboardContent>
          </OrganizationProvider>
        </FolderProvider>
      </SignalProvider>
    </UserProvider>
  );
}
