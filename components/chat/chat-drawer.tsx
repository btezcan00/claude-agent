'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PushDrawer } from '@/components/ui/push-drawer';
import { useChatDrawer } from '@/context/chat-drawer-context';
import { ChatContent } from './chat-bot';

export function ChatDrawer() {
  const { isOpen, close } = useChatDrawer();

  return (
    <PushDrawer open={isOpen} width={400}>
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground shrink-0">
          <h2 className="font-semibold text-sm">GCMP Assistant</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </header>
        <ChatContent />
      </div>
    </PushDrawer>
  );
}
