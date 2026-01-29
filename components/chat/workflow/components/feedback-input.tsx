'use client';

import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface FeedbackInputProps {
  onSubmit: (feedback: string) => void;
  placeholder?: string;
  buttonLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function FeedbackInput({
  onSubmit,
  placeholder = 'Enter your feedback...',
  buttonLabel = 'Submit',
  disabled = false,
  className = '',
}: FeedbackInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={3}
        className={`
          w-full px-3 py-2 text-sm border rounded-lg resize-none
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:bg-gray-100 disabled:text-gray-500
          ${disabled ? 'cursor-not-allowed' : ''}
        `}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className={`
          self-end flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
          transition-colors duration-200
          ${
            disabled || !value.trim()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }
        `}
      >
        <Send className="w-4 h-4" />
        {buttonLabel}
      </button>
    </div>
  );
}
