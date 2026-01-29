'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface ChatDrawerContextValue {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

const ChatDrawerContext = createContext<ChatDrawerContextValue | undefined>(undefined);

const STORAGE_KEY = 'chat-drawer-open';

interface ChatDrawerProviderProps {
  children: ReactNode;
}

export function ChatDrawerProvider({ children }: ChatDrawerProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load initial state from localStorage after mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsOpen(stored === 'true');
    }
  }, []);

  // Persist state to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, String(isOpen));
    }
  }, [isOpen, mounted]);

  // Keyboard shortcut: Cmd/Ctrl + /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ChatDrawerContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
    </ChatDrawerContext.Provider>
  );
}

export function useChatDrawer() {
  const context = useContext(ChatDrawerContext);
  if (context === undefined) {
    throw new Error('useChatDrawer must be used within a ChatDrawerProvider');
  }
  return context;
}
