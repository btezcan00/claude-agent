'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { ChatDrawer } from '@/components/chat/chat-drawer';
import { SignalProvider } from '@/context/signal-context';
import { CaseProvider } from '@/context/case-context';
import { UserProvider } from '@/context/user-context';
import { OrganizationProvider } from '@/context/organization-context';
import { AddressProvider } from '@/context/address-context';
import { PersonProvider } from '@/context/person-context';
import { ChatDrawerProvider } from '@/context/chat-drawer-context';
import { UIHighlightProvider } from '@/context/ui-highlight-context';

function DashboardContentInner({ children }: { children: React.ReactNode }) {
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
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Main Content - flexes to fill remaining space */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden transition-all duration-300">
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* Push Drawer - part of flex layout */}
      <ChatDrawer />
    </div>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <ChatDrawerProvider>
      <UIHighlightProvider>
        <DashboardContentInner>{children}</DashboardContentInner>
      </UIHighlightProvider>
    </ChatDrawerProvider>
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
        <CaseProvider>
          <OrganizationProvider>
            <AddressProvider>
              <PersonProvider>
                <DashboardContent>{children}</DashboardContent>
              </PersonProvider>
            </AddressProvider>
          </OrganizationProvider>
        </CaseProvider>
      </SignalProvider>
    </UserProvider>
  );
}
