'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use ref to track current value for functional updates
  const currentValueRef = useRef<T>(storedValue);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        setStoredValue(parsed);
        currentValueRef.current = parsed;
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
    setIsInitialized(true);
  }, [key]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Use ref for functional updates to get latest value
      const valueToStore = value instanceof Function ? value(currentValueRef.current) : value;
      currentValueRef.current = valueToStore;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [isInitialized ? storedValue : initialValue, setValue];
}
