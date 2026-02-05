'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface HighlightTarget {
  type: 'signal' | 'case';
  id: string;
  timestamp: number;
}

interface UIHighlightContextValue {
  triggerHighlight: (type: 'signal' | 'case', id: string) => void;
  isHighlighted: (type: 'signal' | 'case', id: string) => boolean;
  navigateAndHighlight: (type: 'signal' | 'case', id: string) => void;
}

const UIHighlightContext = createContext<UIHighlightContextValue | undefined>(undefined);

const HIGHLIGHT_DURATION = 2000; // 2 seconds

interface UIHighlightProviderProps {
  children: ReactNode;
}

export function UIHighlightProvider({ children }: UIHighlightProviderProps) {
  const [activeHighlights, setActiveHighlights] = useState<Map<string, HighlightTarget>>(new Map());
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const router = useRouter();

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  const triggerHighlight = useCallback((type: 'signal' | 'case', id: string) => {
    const key = `${type}-${id}`;
    const timestamp = Date.now();

    // Clear existing timeout for this key if any
    const existingTimeout = timeoutsRef.current.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Add the highlight
    setActiveHighlights((prev) => {
      const next = new Map(prev);
      next.set(key, { type, id, timestamp });
      return next;
    });

    // Set timeout to remove highlight after duration
    const timeout = setTimeout(() => {
      setActiveHighlights((prev) => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
      timeoutsRef.current.delete(key);
    }, HIGHLIGHT_DURATION);

    timeoutsRef.current.set(key, timeout);
  }, []);

  const isHighlighted = useCallback((type: 'signal' | 'case', id: string) => {
    const key = `${type}-${id}`;
    return activeHighlights.has(key);
  }, [activeHighlights]);

  const navigateAndHighlight = useCallback((type: 'signal' | 'case', id: string) => {
    const targetPath = type === 'signal' ? '/meldingen' : '/dossiers';

    // Navigate to the list page
    router.push(targetPath);

    // Trigger highlight after a small delay for page transition
    setTimeout(() => {
      triggerHighlight(type, id);
    }, 100);
  }, [router, triggerHighlight]);

  return (
    <UIHighlightContext.Provider value={{ triggerHighlight, isHighlighted, navigateAndHighlight }}>
      {children}
    </UIHighlightContext.Provider>
  );
}

export function useUIHighlight() {
  const context = useContext(UIHighlightContext);
  if (context === undefined) {
    throw new Error('useUIHighlight must be used within a UIHighlightProvider');
  }
  return context;
}
