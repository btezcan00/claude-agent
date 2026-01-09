'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCases } from '@/context/case-context';
import { CreateCaseInput, UpdateCaseInput } from '@/types/case';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolUse?: {
    name: string;
    input: Record<string, unknown>;
  };
  pending?: boolean;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your GCMP assistant. I can help you summarize cases, create new cases, or edit existing ones. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'create' | 'edit';
    data: Record<string, unknown>;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { cases, createCase, updateCase, getCaseById } = useCases();

  const findCase = (identifier: string) => {
    // Search by ID first, then by case number or title
    return getCaseById(identifier) || cases.find(c =>
      c.caseNumber.toLowerCase() === identifier.toLowerCase() ||
      c.caseNumber.toLowerCase().includes(identifier.toLowerCase()) ||
      c.title.toLowerCase().includes(identifier.toLowerCase())
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Handle pending confirmations
    if (pendingAction) {
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes('yes') || lowerInput.includes('confirm') || lowerInput.includes('ok')) {
        if (pendingAction.type === 'create') {
          const newCase = createCase(pendingAction.data as unknown as CreateCaseInput);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: `Case created successfully! Case number: ${newCase.caseNumber}. You can view it in the cases list.`,
            },
          ]);
        } else if (pendingAction.type === 'edit') {
          const { case_id, ...updates } = pendingAction.data;
          const targetCase = findCase(case_id as string);
          if (targetCase) {
            updateCase(targetCase.id, updates as UpdateCaseInput);
          }
          const editedCase = targetCase;
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: `Case ${editedCase?.caseNumber || case_id} has been updated successfully!`,
            },
          ]);
        }
        setPendingAction(null);
        setIsLoading(false);
        return;
      } else if (lowerInput.includes('no') || lowerInput.includes('cancel')) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Action cancelled. Is there anything else I can help you with?',
          },
        ]);
        setPendingAction(null);
        setIsLoading(false);
        return;
      }
    }

    try {
      // Prepare case data for the API
      const caseData = cases.map((c) => ({
        id: c.id,
        caseNumber: c.caseNumber,
        title: c.title,
        description: c.description,
        type: c.type,
        status: c.status,
        priority: c.priority,
        assigneeName: c.assigneeName,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));

      // Get conversation history (excluding system messages)
      const conversationHistory = messages
        .filter((m) => !m.pending)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      conversationHistory.push({ role: 'user', content: input });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          cases: caseData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Handle tool use
      if (data.toolUse) {
        const { name, input: toolInput } = data.toolUse;

        if (name === 'summarize_cases') {
          // Just add the assistant's response - the summary is in the text
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: data.content || generateCaseSummary(toolInput.case_id as string | undefined),
            },
          ]);
        } else if (name === 'create_case') {
          // Store pending action and ask for confirmation
          setPendingAction({ type: 'create', data: toolInput });
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content:
                data.content ||
                `I'll create a new case with these details:\n\n**Title:** ${toolInput.title}\n**Type:** ${toolInput.type}\n**Priority:** ${toolInput.priority}\n**Description:** ${toolInput.description}${toolInput.location ? `\n**Location:** ${toolInput.location}` : ''}\n\nShould I proceed? (Yes/No)`,
            },
          ]);
        } else if (name === 'edit_case') {
          // Store pending action and ask for confirmation
          const targetCase = findCase(toolInput.case_id as string);
          setPendingAction({ type: 'edit', data: toolInput });

          const updatesList = Object.entries(toolInput)
            .filter(([key]) => key !== 'case_id')
            .map(([key, value]) => `**${key}:** ${value}`)
            .join('\n');

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content:
                data.content ||
                `I'll update case ${targetCase?.caseNumber || toolInput.case_id} with:\n\n${updatesList}\n\nShould I proceed? (Yes/No)`,
            },
          ]);
        }
      } else {
        // Regular text response
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: data.content || 'I apologize, but I couldn\'t generate a response. Please try again.',
          },
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please make sure your API key is configured in .env.local and try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCaseSummary = (caseId?: string) => {
    if (caseId) {
      const targetCase = findCase(caseId);
      if (!targetCase) return `Case "${caseId}" not found. Try asking about a specific case by name or number.`;
      return `**${targetCase.caseNumber}: ${targetCase.title}**\n\n**Type:** ${targetCase.type}\n**Status:** ${targetCase.status}\n**Priority:** ${targetCase.priority}\n**Assigned to:** ${targetCase.assigneeName || 'Unassigned'}\n**Created:** ${new Date(targetCase.createdAt).toLocaleDateString()}\n\n**Description:**\n${targetCase.description}`;
    }

    const statusCounts = {
      open: cases.filter((c) => c.status === 'open').length,
      'in-progress': cases.filter((c) => c.status === 'in-progress').length,
      closed: cases.filter((c) => c.status === 'closed').length,
    };

    const priorityCounts = {
      critical: cases.filter((c) => c.priority === 'critical').length,
      high: cases.filter((c) => c.priority === 'high').length,
      medium: cases.filter((c) => c.priority === 'medium').length,
      low: cases.filter((c) => c.priority === 'low').length,
    };

    return `**Case Summary (${cases.length} total cases)**\n\n**By Status:**\n- Open: ${statusCounts.open}\n- In Progress: ${statusCounts['in-progress']}\n- Closed: ${statusCounts.closed}\n\n**By Priority:**\n- Critical: ${priorityCounts.critical}\n- High: ${priorityCounts.high}\n- Medium: ${priorityCounts.medium}\n- Low: ${priorityCounts.low}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-200',
          isOpen
            ? 'bg-muted text-muted-foreground hover:bg-muted/80'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-card border border-border rounded-lg shadow-xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground">
            <MessageCircle className="w-5 h-5" />
            <div>
              <h3 className="font-semibold text-sm">GCMP Assistant</h3>
              <p className="text-xs opacity-90">Powered by Claude</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  )}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
