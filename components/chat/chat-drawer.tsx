'use client';

import { X, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PushDrawer } from '@/components/ui/push-drawer';
import { useChatDrawer } from '@/context/chat-drawer-context';
import { ChatContent } from './chat-bot';

export function ChatDrawer() {
  const { isOpen, isExpanded, toggleExpanded, close } = useChatDrawer();

  return (
    <PushDrawer
      open={isOpen}
      width={400}
      expandedWidth={600}
      isExpanded={isExpanded}
    >
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleExpanded}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label={isExpanded ? 'Collapse chat' : 'Expand chat'}
            >
              {isExpanded ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
            <h2 className="font-semibold text-base">Atlas AI</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={close}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <ChatContent />
      </div>
    </PushDrawer>
  );
}
