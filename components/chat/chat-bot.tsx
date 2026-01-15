'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSignals } from '@/context/signal-context';
import { useFolders } from '@/context/folder-context';
import { useUsers } from '@/context/user-context';
import { CreateSignalInput, UpdateSignalInput, SignalType } from '@/types/signal';

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
      content: 'Hello! I\'m your GCMP assistant. I can help you summarize signals, create new signals, edit existing ones, assign signals to team members, and more. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingActions, setPendingActions] = useState<{
    type: 'create' | 'edit' | 'add_note' | 'delete';
    data: Record<string, unknown>;
  }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { signals, createSignal, updateSignal, getSignalById, addNote, deleteSignal, signalStats } = useSignals();
  const { folders, folderStats, getSignalCountForFolder } = useFolders();
  const { users, getUserFullName } = useUsers();

  const findSignal = (identifier: string) => {
    // Search by ID first, then by signal number or description
    return getSignalById(identifier) || signals.find(s =>
      s.signalNumber.toLowerCase() === identifier.toLowerCase() ||
      s.signalNumber.toLowerCase().includes(identifier.toLowerCase()) ||
      s.description.toLowerCase().includes(identifier.toLowerCase()) ||
      s.placeOfObservation.toLowerCase().includes(identifier.toLowerCase())
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
    if (pendingActions.length > 0) {
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes('yes') || lowerInput.includes('confirm') || lowerInput.includes('ok')) {
        const results: string[] = [];

        for (const pendingAction of pendingActions) {
          if (pendingAction.type === 'create') {
            const newSignal = createSignal(pendingAction.data as unknown as CreateSignalInput);
            results.push(`Signal created: ${newSignal.signalNumber}`);
          } else if (pendingAction.type === 'edit') {
            const { signal_id, ...updates } = pendingAction.data;
            const targetSignal = findSignal(signal_id as string);
            if (targetSignal) {
              updateSignal(targetSignal.id, updates as UpdateSignalInput);
              results.push(`Signal ${targetSignal.signalNumber} updated`);
            } else {
              results.push(`Signal ${signal_id} not found`);
            }
          } else if (pendingAction.type === 'add_note') {
            const { signal_id, content, is_private } = pendingAction.data;
            const targetSignal = findSignal(signal_id as string);
            if (targetSignal) {
              addNote(targetSignal.id, content as string, is_private as boolean || false);
              results.push(`Note added to ${targetSignal.signalNumber}`);
            } else {
              results.push(`Signal ${signal_id} not found`);
            }
          } else if (pendingAction.type === 'delete') {
            const { signal_id } = pendingAction.data;
            const targetSignal = findSignal(signal_id as string);
            if (targetSignal) {
              deleteSignal(targetSignal.id);
              results.push(`Signal ${targetSignal.signalNumber} deleted`);
            } else {
              results.push(`Signal ${signal_id} not found`);
            }
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: results.length === 1
              ? `${results[0]}!`
              : `**Completed ${results.length} actions:**\n\n${results.map(r => `- ${r}`).join('\n')}`,
          },
        ]);
        setPendingActions([]);
        setIsLoading(false);
        return;
      } else if (lowerInput.includes('no') || lowerInput.includes('cancel')) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: pendingActions.length === 1
              ? 'Action cancelled. Is there anything else I can help you with?'
              : `${pendingActions.length} actions cancelled. Is there anything else I can help you with?`,
          },
        ]);
        setPendingActions([]);
        setIsLoading(false);
        return;
      }
    }

    try {
      // Prepare signal data for the API (including attachments for AI summarization)
      const signalData = signals.map((s) => ({
        id: s.id,
        signalNumber: s.signalNumber,
        description: s.description,
        types: s.types,
        placeOfObservation: s.placeOfObservation,
        locationDescription: s.locationDescription,
        timeOfObservation: s.timeOfObservation,
        receivedBy: s.receivedBy,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        notesCount: s.notes.length,
        activitiesCount: s.activities.length,
        photosCount: s.photos.length,
        attachments: s.attachments.map((a) => ({
          id: a.id,
          fileName: a.fileName,
          fileType: a.fileType,
          fileSize: a.fileSize,
          content: a.content,
          textContent: a.textContent,
        })),
      }));

      // Prepare team members data for the API
      const teamMembersData = users.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        title: u.title,
        role: u.role,
        ownedFolderCount: folders.filter((f) => f.ownerId === u.id).length,
      }));

      // Prepare folder data for the API
      const folderData = folders.map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        status: f.status,
        ownerName: f.ownerName,
        signalCount: getSignalCountForFolder(f.id),
        createdAt: f.createdAt,
        tags: f.tags,
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
          signals: signalData,
          folders: folderData,
          teamMembers: teamMembersData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Handle tool uses (array of tool calls)
      if (data.toolUses && data.toolUses.length > 0) {
        const newPendingActions: typeof pendingActions = [];
        const readResults: string[] = [];

        // Process each tool call
        for (const toolUse of data.toolUses) {
          const { name, input: toolInput } = toolUse;

          if (name === 'summarize_signals') {
            readResults.push(generateSignalSummary(toolInput.signal_id as string | undefined));
          } else if (name === 'create_signal') {
            newPendingActions.push({ type: 'create', data: toolInput });
          } else if (name === 'edit_signal') {
            newPendingActions.push({ type: 'edit', data: toolInput });
          } else if (name === 'add_note') {
            newPendingActions.push({ type: 'add_note', data: toolInput });
          } else if (name === 'delete_signal') {
            newPendingActions.push({ type: 'delete', data: toolInput });
          } else if (name === 'list_team_members') {
            const teamList = users.map(u => {
              const ownedCount = folders.filter(f => f.ownerId === u.id).length;
              return `- **${getUserFullName(u)}** (${u.title}): owns ${ownedCount} folder(s)`;
            }).join('\n');
            readResults.push(`**Team Members:**\n\n${teamList}`);
          } else if (name === 'get_signal_stats') {
            const statsContent = `**Signal Statistics:**\n\n` +
              `- **Total Signals:** ${signalStats.total}`;
            readResults.push(statsContent);
          } else if (name === 'search_signals') {
            let results = [...signals];
            const { keyword, type, receivedBy } = toolInput;

            if (keyword) {
              const kw = (keyword as string).toLowerCase();
              results = results.filter(s =>
                s.description.toLowerCase().includes(kw) ||
                s.signalNumber.toLowerCase().includes(kw) ||
                s.placeOfObservation.toLowerCase().includes(kw)
              );
            }
            if (type) {
              results = results.filter(s => s.types.includes(type as SignalType));
            }
            if (receivedBy) {
              results = results.filter(s => s.receivedBy === receivedBy);
            }

            const resultsList = results.length > 0
              ? results.map(s =>
                `- **${s.signalNumber}**: ${s.placeOfObservation} (${s.types.join(', ')})`
              ).join('\n')
              : 'No signals found matching your criteria.';
            readResults.push(`**Search Results (${results.length} signals):**\n\n${resultsList}`);
          } else if (name === 'get_signal_activity') {
            const targetSignal = findSignal(toolInput.signal_id as string);
            if (!targetSignal) {
              readResults.push(`Signal not found.`);
            } else {
              const activities = targetSignal.activities.slice(0, 10).map(a =>
                `- **${new Date(a.timestamp).toLocaleString()}**: ${a.details} (by ${a.userName})`
              ).join('\n');
              readResults.push(`**Activity History for ${targetSignal.signalNumber}:**\n\n${activities || 'No activity recorded.'}`);
            }
          } else if (name === 'get_signal_notes') {
            const targetSignal = findSignal(toolInput.signal_id as string);
            if (!targetSignal) {
              readResults.push(`Signal not found.`);
            } else {
              const notes = targetSignal.notes.length > 0
                ? targetSignal.notes.map(n =>
                  `**${new Date(n.createdAt).toLocaleString()}** (${n.authorName})${n.isPrivate ? ' [Private]' : ''}:\n${n.content}`
                ).join('\n\n---\n\n')
                : 'No notes on this signal.';
              readResults.push(`**Notes for ${targetSignal.signalNumber}:**\n\n${notes}`);
            }
          } else if (name === 'summarize_attachments') {
            // The result comes from the server-side processing
            if (toolUse.result) {
              readResults.push(`**Attachment Analysis:**\n\n${toolUse.result}`);
            } else {
              const targetSignal = findSignal(toolInput.signal_id as string);
              readResults.push(`Could not analyze attachments for ${targetSignal?.signalNumber || toolInput.signal_id}.`);
            }
          } else if (name === 'list_folders') {
            const folderList = folders.length > 0
              ? folders.map(f =>
                `- **${f.name}**: ${f.description.substring(0, 50)}${f.description.length > 50 ? '...' : ''} (${f.status}, ${getSignalCountForFolder(f.id)} signals)`
              ).join('\n')
              : 'No folders found.';
            readResults.push(`**Folders (${folders.length}):**\n\n${folderList}`);
          } else if (name === 'get_folder_stats') {
            const statsContent = `**Folder Statistics:**\n\n` +
              `- **Total Folders:** ${folderStats.total}\n` +
              `- **With Signals:** ${folderStats.withSignals}\n` +
              `- **Empty:** ${folderStats.empty}`;
            readResults.push(statsContent);
          }
        }

        // Build the response message
        let responseContent = data.content || '';

        // Add read results if any
        if (readResults.length > 0) {
          if (responseContent) responseContent += '\n\n';
          responseContent += readResults.join('\n\n---\n\n');
        }

        // Handle pending actions
        if (newPendingActions.length > 0) {
          setPendingActions(newPendingActions);

          // Build confirmation message for all pending actions
          const confirmationItems = newPendingActions.map(action => {
            if (action.type === 'create') {
              const types = Array.isArray(action.data.types) ? action.data.types.join(', ') : action.data.types;
              return `**Create signal:** at "${action.data.placeOfObservation}" (${types})`;
            } else if (action.type === 'edit') {
              const targetSignal = findSignal(action.data.signal_id as string);
              const updates = Object.entries(action.data)
                .filter(([key]) => key !== 'signal_id')
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
              return `**Edit ${targetSignal?.signalNumber || action.data.signal_id}:** ${updates}`;
            } else if (action.type === 'add_note') {
              const targetSignal = findSignal(action.data.signal_id as string);
              return `**Add note to ${targetSignal?.signalNumber || action.data.signal_id}:** "${(action.data.content as string).substring(0, 50)}..."`;
            } else if (action.type === 'delete') {
              const targetSignal = findSignal(action.data.signal_id as string);
              return `**Delete ${targetSignal?.signalNumber || action.data.signal_id}**`;
            }
            return '';
          }).filter(Boolean);

          if (responseContent) responseContent += '\n\n';
          responseContent += newPendingActions.length === 1
            ? `I'll perform the following action:\n\n${confirmationItems[0]}\n\nShould I proceed? (Yes/No)`
            : `I'll perform the following ${newPendingActions.length} actions:\n\n${confirmationItems.map(item => `- ${item}`).join('\n')}\n\nShould I proceed with all? (Yes/No)`;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: responseContent || 'I apologize, but I couldn\'t process that request. Please try again.',
          },
        ]);
      } else {
        // Regular text response (no tool calls)
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

  const generateSignalSummary = (signalId?: string) => {
    if (signalId) {
      const targetSignal = findSignal(signalId);
      if (!targetSignal) return `Signal "${signalId}" not found. Try asking about a specific signal by name or number.`;
      return `**${targetSignal.signalNumber}**\n\n**Location:** ${targetSignal.placeOfObservation}\n**Type(s):** ${targetSignal.types.join(', ')}\n**Received By:** ${targetSignal.receivedBy}\n**Time of Observation:** ${new Date(targetSignal.timeOfObservation).toLocaleString()}\n**Created:** ${new Date(targetSignal.createdAt).toLocaleDateString()}\n\n**Description:**\n${targetSignal.description}`;
    }

    return `**Signal Summary (${signals.length} total signals)**`;
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
