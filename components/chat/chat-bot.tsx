'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCases } from '@/context/case-context';
import { useUsers } from '@/context/user-context';
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
      content: 'Hello! I\'m your GCMP assistant. I can help you summarize cases, create new cases, edit existing ones, assign cases to team members, and more. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'create' | 'edit' | 'add_note' | 'assign' | 'unassign' | 'delete' | 'change_status';
    data: Record<string, unknown>;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { cases, createCase, updateCase, getCaseById, addNote, assignCase, unassignCase, deleteCase, updateStatus, caseStats } = useCases();
  const { users, getUserFullName } = useUsers();

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
        } else if (pendingAction.type === 'add_note') {
          const { case_id, content, is_private } = pendingAction.data;
          const targetCase = findCase(case_id as string);
          if (targetCase) {
            addNote(targetCase.id, content as string, is_private as boolean || false);
          }
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: `Note added successfully to case ${targetCase?.caseNumber || case_id}!`,
            },
          ]);
        } else if (pendingAction.type === 'assign') {
          const { case_id, assignee_name } = pendingAction.data;
          const targetCase = findCase(case_id as string);
          const targetUser = users.find(u =>
            getUserFullName(u).toLowerCase() === (assignee_name as string).toLowerCase() ||
            getUserFullName(u).toLowerCase().includes((assignee_name as string).toLowerCase())
          );
          if (targetCase && targetUser) {
            assignCase(targetCase.id, targetUser.id, getUserFullName(targetUser));
          }
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: targetCase && targetUser
                ? `Case ${targetCase.caseNumber} has been assigned to ${getUserFullName(targetUser)}!`
                : `Could not complete assignment. ${!targetCase ? 'Case not found.' : 'User not found.'}`,
            },
          ]);
        } else if (pendingAction.type === 'unassign') {
          const { case_id } = pendingAction.data;
          const targetCase = findCase(case_id as string);
          if (targetCase) {
            unassignCase(targetCase.id);
          }
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: targetCase
                ? `Case ${targetCase.caseNumber} has been unassigned!`
                : `Could not unassign case. Case not found.`,
            },
          ]);
        } else if (pendingAction.type === 'delete') {
          const { case_id } = pendingAction.data;
          const targetCase = findCase(case_id as string);
          if (targetCase) {
            deleteCase(targetCase.id);
          }
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: targetCase
                ? `Case ${targetCase.caseNumber} has been deleted!`
                : `Could not delete case. Case not found.`,
            },
          ]);
        } else if (pendingAction.type === 'change_status') {
          const { case_id, new_status } = pendingAction.data;
          const targetCase = findCase(case_id as string);
          if (targetCase) {
            updateStatus(targetCase.id, new_status as 'open' | 'in-progress' | 'closed');
          }
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: targetCase
                ? `Case ${targetCase.caseNumber} status changed to ${new_status}!`
                : `Could not change status. Case not found.`,
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
        dueDate: c.dueDate,
        notesCount: c.notes.length,
        activitiesCount: c.activities.length,
      }));

      // Prepare team members data for the API
      const teamMembersData = users.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        title: u.title,
        role: u.role,
        activeCasesCount: u.activeCasesCount,
        maxCaseCapacity: u.maxCaseCapacity,
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
          teamMembers: teamMembersData,
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
        } else if (name === 'add_note') {
          // Store pending action and ask for confirmation
          const targetCase = findCase(toolInput.case_id as string);
          setPendingAction({ type: 'add_note', data: toolInput });

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content:
                data.content ||
                `I'll add the following note to case ${targetCase?.caseNumber || toolInput.case_id}:\n\n"${toolInput.content}"${toolInput.is_private ? '\n\n(This will be a private note)' : ''}\n\nShould I proceed? (Yes/No)`,
            },
          ]);
        } else if (name === 'assign_case') {
          // Store pending action and ask for confirmation
          const targetCase = findCase(toolInput.case_id as string);
          const targetUser = users.find(u =>
            getUserFullName(u).toLowerCase() === (toolInput.assignee_name as string).toLowerCase() ||
            getUserFullName(u).toLowerCase().includes((toolInput.assignee_name as string).toLowerCase())
          );
          setPendingAction({ type: 'assign', data: toolInput });

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content:
                data.content ||
                `I'll assign case ${targetCase?.caseNumber || toolInput.case_id} to ${targetUser ? getUserFullName(targetUser) : toolInput.assignee_name}.\n\nShould I proceed? (Yes/No)`,
            },
          ]);
        } else if (name === 'unassign_case') {
          // Store pending action and ask for confirmation
          const targetCase = findCase(toolInput.case_id as string);
          setPendingAction({ type: 'unassign', data: toolInput });

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content:
                data.content ||
                `I'll remove the current assignee from case ${targetCase?.caseNumber || toolInput.case_id}${targetCase?.assigneeName ? ` (currently assigned to ${targetCase.assigneeName})` : ''}.\n\nShould I proceed? (Yes/No)`,
            },
          ]);
        } else if (name === 'delete_case') {
          // Store pending action and ask for confirmation
          const targetCase = findCase(toolInput.case_id as string);
          setPendingAction({ type: 'delete', data: toolInput });

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content:
                data.content ||
                `⚠️ **Warning:** I'll permanently delete case ${targetCase?.caseNumber || toolInput.case_id}${targetCase ? `: "${targetCase.title}"` : ''}.\n\nThis action cannot be undone. Should I proceed? (Yes/No)`,
            },
          ]);
        } else if (name === 'list_team_members') {
          // Generate team members list
          const teamList = users.map(u =>
            `- **${getUserFullName(u)}** (${u.title}): ${u.activeCasesCount}/${u.maxCaseCapacity} cases`
          ).join('\n');

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content:
                data.content ||
                `**Team Members Available for Assignment:**\n\n${teamList}`,
            },
          ]);
        } else if (name === 'get_case_stats') {
          // Generate case statistics
          const statsContent = `**Case Statistics:**\n\n` +
            `- **Total Cases:** ${caseStats.total}\n` +
            `- **Open:** ${caseStats.open}\n` +
            `- **In Progress:** ${caseStats.inProgress}\n` +
            `- **Closed:** ${caseStats.closed}\n\n` +
            `**Priority Breakdown:**\n` +
            `- **Critical:** ${caseStats.critical}\n` +
            `- **High:** ${caseStats.high}\n\n` +
            `**Unassigned Cases:** ${caseStats.unassigned}`;

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: data.content || statsContent,
            },
          ]);
        } else if (name === 'search_cases') {
          // Filter cases based on criteria
          let results = [...cases];
          const { keyword, status, priority, type, assignee_name } = toolInput;

          if (keyword) {
            const kw = (keyword as string).toLowerCase();
            results = results.filter(c =>
              c.title.toLowerCase().includes(kw) ||
              c.description.toLowerCase().includes(kw) ||
              c.caseNumber.toLowerCase().includes(kw)
            );
          }
          if (status) {
            results = results.filter(c => c.status === status);
          }
          if (priority) {
            results = results.filter(c => c.priority === priority);
          }
          if (type) {
            results = results.filter(c => c.type === type);
          }
          if (assignee_name) {
            const an = (assignee_name as string).toLowerCase();
            results = results.filter(c =>
              c.assigneeName && c.assigneeName.toLowerCase().includes(an)
            );
          }

          const resultsList = results.length > 0
            ? results.map(c =>
                `- **${c.caseNumber}**: ${c.title} (${c.status}, ${c.priority})${c.assigneeName ? ` - ${c.assigneeName}` : ''}`
              ).join('\n')
            : 'No cases found matching your criteria.';

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: data.content || `**Search Results (${results.length} cases):**\n\n${resultsList}`,
            },
          ]);
        } else if (name === 'get_case_activity') {
          // Get activity timeline for a case
          const targetCase = findCase(toolInput.case_id as string);
          if (!targetCase) {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: 'assistant',
                content: `Case not found.`,
              },
            ]);
          } else {
            const activities = targetCase.activities.slice(0, 10).map(a =>
              `- **${new Date(a.timestamp).toLocaleString()}**: ${a.details} (by ${a.userName})`
            ).join('\n');

            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: 'assistant',
                content: data.content || `**Activity History for ${targetCase.caseNumber}:**\n\n${activities || 'No activity recorded.'}`,
              },
            ]);
          }
        } else if (name === 'change_status') {
          // Store pending action and ask for confirmation
          const targetCase = findCase(toolInput.case_id as string);
          setPendingAction({ type: 'change_status', data: toolInput });

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content:
                data.content ||
                `I'll change the status of case ${targetCase?.caseNumber || toolInput.case_id} from **${targetCase?.status || 'unknown'}** to **${toolInput.new_status}**.\n\nShould I proceed? (Yes/No)`,
            },
          ]);
        } else if (name === 'get_case_notes') {
          // Get notes for a case
          const targetCase = findCase(toolInput.case_id as string);
          if (!targetCase) {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: 'assistant',
                content: `Case not found.`,
              },
            ]);
          } else {
            const notes = targetCase.notes.length > 0
              ? targetCase.notes.map(n =>
                  `**${new Date(n.createdAt).toLocaleString()}** (${n.authorName})${n.isPrivate ? ' [Private]' : ''}:\n${n.content}`
                ).join('\n\n---\n\n')
              : 'No notes on this case.';

            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: 'assistant',
                content: data.content || `**Notes for ${targetCase.caseNumber}:**\n\n${notes}`,
              },
            ]);
          }
        } else if (name === 'get_overdue_cases') {
          // Find overdue cases
          const now = new Date();
          const overdueCases = cases.filter(c =>
            c.dueDate &&
            c.status !== 'closed' &&
            new Date(c.dueDate) < now
          );

          const overdueList = overdueCases.length > 0
            ? overdueCases.map(c =>
                `- **${c.caseNumber}**: ${c.title} (Due: ${new Date(c.dueDate!).toLocaleDateString()})${c.assigneeName ? ` - ${c.assigneeName}` : ' - Unassigned'}`
              ).join('\n')
            : 'No overdue cases found.';

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: data.content || `**Overdue Cases (${overdueCases.length}):**\n\n${overdueList}`,
            },
          ]);
        } else if (name === 'get_unassigned_cases') {
          // Find unassigned cases
          const unassignedCases = cases.filter(c => !c.assigneeId);

          const unassignedList = unassignedCases.length > 0
            ? unassignedCases.map(c =>
                `- **${c.caseNumber}**: ${c.title} (${c.status}, ${c.priority} priority)`
              ).join('\n')
            : 'No unassigned cases found.';

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: data.content || `**Unassigned Cases (${unassignedCases.length}):**\n\n${unassignedList}`,
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
