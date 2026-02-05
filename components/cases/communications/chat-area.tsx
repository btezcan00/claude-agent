'use client';

import { useEffect, useRef } from 'react';
import { CaseChatMessage } from '@/types/case';
import { format } from 'date-fns';

interface ChatAreaProps {
  messages: CaseChatMessage[];
  selectedContactId: string | null;
  selectedContactName: string | null;
}

export function ChatArea({ messages, selectedContactId, selectedContactName }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredMessages = selectedContactId
    ? messages.filter((msg) => msg.conversationId === selectedContactId)
    : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);

  if (!selectedContactId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <p className="text-muted-foreground">Selecteer een contact om te beginnen met berichten</p>
      </div>
    );
  }

  if (filteredMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <p className="text-muted-foreground">
          Nog geen berichten. Start een gesprek met {selectedContactName}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-100 space-y-3">
      {filteredMessages.map((message) => {
        return (
          <div key={message.id} className="flex justify-start">
            <div className="max-w-[70%] rounded-lg px-4 py-3 bg-white text-foreground shadow-sm">
              <p className="text-sm text-foreground">{message.content}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {format(new Date(message.createdAt), 'dd-MM-yyyy')} | {message.senderName}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
