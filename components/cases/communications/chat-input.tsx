'use client';

import { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed) {
      onSend(trimmed);
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 border-t bg-white flex gap-2">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Typ een bericht..."
        disabled={disabled}
        className="flex-1"
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        size="icon"
        className="rounded-full bg-[#1e3a5f] hover:bg-[#2a4a6f] text-white h-10 w-10 flex-shrink-0"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
