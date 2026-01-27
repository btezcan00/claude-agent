'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSignals } from '@/context/signal-context';
import { useFolders } from '@/context/folder-context';
import { useUsers } from '@/context/user-context';
import { useOrganizations } from '@/context/organization-context';
import { useAddresses } from '@/context/address-context';
import { usePeople } from '@/context/person-context';
import { CreateSignalInput, UpdateSignalInput, SignalType } from '@/types/signal';
import { APPLICATION_CRITERIA, ApplicationCriterion, FolderStatus, Folder } from '@/types/folder';
import { AgentLog, AgentPhase, LogEntry, createLogEntry, PlanData, PlanDisplay } from './agent-log';
import { BotIcon } from './animations/avatar-expressions';

// Generate unique message IDs
let messageIdCounter = 0;
const generateMessageId = () => `msg-${Date.now()}-${++messageIdCounter}`;

// Validate ISO date strings
const isValidDate = (dateStr: unknown): boolean => {
  if (typeof dateStr !== 'string' || !dateStr) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isNew?: boolean;
}

function ChatBotInner() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentPhase, setAgentPhase] = useState<AgentPhase>('idle');
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [lastCreatedSignalId, setLastCreatedSignalId] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<PlanData | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Track folders created during the current execution cycle to handle race conditions
  // when subsequent tools reference folders before React state updates
  const pendingFoldersRef = useRef<Map<string, Folder>>(new Map());

  const { signals, createSignal, updateSignal, getSignalById, addNote, deleteSignal, signalStats } = useSignals();
  const { folders, getSignalCountForFolder, updateApplicationData, completeApplication, assignFolderOwner, updateFolder, updateFolderStatus, updateLocation, addTag, removeTag, createFolder, addPractitioner, shareFolder, addOrganizationToFolder, addAddressToFolder, addPersonToFolder, addFinding, addLetter, updateLetter, addCommunication, addChatMessage, addVisualization, addActivity } = useFolders();
  const { users, getUserFullName } = useUsers();
  const { organizations } = useOrganizations();
  const { addresses } = useAddresses();
  const { people } = usePeople();

  // Initialize greeting message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: "Hi! I'm your GCMP assistant. I can help you manage signals and folders - just tell me what you need and I'll take care of it.",
          isNew: true,
        },
      ]);
    }
  }, [messages.length]);

  const findSignal = useCallback((identifier: string) => {
    return getSignalById(identifier) || signals.find(s =>
      s.signalNumber.toLowerCase() === identifier.toLowerCase() ||
      s.signalNumber.toLowerCase().includes(identifier.toLowerCase()) ||
      s.description.toLowerCase().includes(identifier.toLowerCase()) ||
      s.placeOfObservation.toLowerCase().includes(identifier.toLowerCase())
    );
  }, [getSignalById, signals]);

  const findFolder = useCallback((identifier: string) => {
    return folders.find(f =>
      f.id === identifier ||
      f.name.toLowerCase().includes(identifier.toLowerCase())
    );
  }, [folders]);

  // Async version that falls back to API when folder not found in state
  // This is needed because React state updates are async and may not be
  // available immediately after creating a folder
  const findFolderAsync = useCallback(async (identifier: string) => {
    // First check pending folders created in this execution cycle
    const pendingFolder = pendingFoldersRef.current.get(identifier) ||
      pendingFoldersRef.current.get(identifier.toLowerCase());
    if (pendingFolder) return pendingFolder;

    // Then check local state
    const localFolder = folders.find(f =>
      f.id === identifier ||
      f.name.toLowerCase().includes(identifier.toLowerCase())
    );
    if (localFolder) return localFolder;

    // If not found locally and identifier looks like an ID, try fetching from API
    if (identifier.startsWith('folder-') || identifier.match(/^[a-z0-9-]+$/i)) {
      try {
        const response = await fetch(`/api/folders/${identifier}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('Failed to fetch folder from API:', error);
      }
    }

    return undefined;
  }, [folders]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, logEntries]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const addLogEntry = useCallback((entry: LogEntry) => {
    setLogEntries(prev => [...prev, entry]);
  }, []);

  const updateLogEntry = useCallback((id: string, updates: Partial<LogEntry>) => {
    setLogEntries(prev => prev.map(entry =>
      entry.id === id ? { ...entry, ...updates } : entry
    ));
  }, []);

  const clearLog = useCallback(() => {
    setLogEntries([]);
    setAgentPhase('idle');
    setPendingPlan(null);
  }, []);

  // Execute a tool and return the result
  const executeTool = useCallback(async (toolName: string, input: Record<string, unknown>): Promise<string> => {
    try {
      switch (toolName) {
        case 'create_signal': {
          const timeOfObservation = isValidDate(input.timeOfObservation)
            ? input.timeOfObservation as string
            : new Date().toISOString();

          const signalData = {
            ...input,
            timeOfObservation,
          } as CreateSignalInput;
          const newSignal = await createSignal(signalData);
          setLastCreatedSignalId(newSignal.id);
          return `Signal created: ${newSignal.signalNumber}`;
        }

        case 'edit_signal': {
          const { signal_id, ...updates } = input;
          const targetSignal = findSignal(signal_id as string);
          if (targetSignal) {
            await updateSignal(targetSignal.id, updates as UpdateSignalInput);
            return `Signal ${targetSignal.signalNumber} updated`;
          }
          return `Signal ${signal_id} not found`;
        }

        case 'add_note': {
          const { signal_id, content, is_private } = input;
          const targetSignal = findSignal(signal_id as string);
          if (targetSignal) {
            await addNote(targetSignal.id, content as string, is_private as boolean || false);
            return `Note added to ${targetSignal.signalNumber}`;
          }
          return `Signal ${signal_id} not found`;
        }

        case 'delete_signal': {
          const { signal_id } = input;
          const targetSignal = findSignal(signal_id as string);
          if (targetSignal) {
            await deleteSignal(targetSignal.id);
            return `Signal ${targetSignal.signalNumber} deleted`;
          }
          return `Signal ${signal_id} not found`;
        }

        case 'create_folder': {
          const randomColors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'];
          const randomColor = randomColors[Math.floor(Math.random() * randomColors.length)];

          const rawSignalIds = input.signalIds as string[] | undefined;
          const signalIds = rawSignalIds?.map(id => {
            const signal = signals.find(s => s.id === id || s.signalNumber === id);
            return signal?.id || id;
          }).filter(Boolean);

          let location = '';
          if (signalIds && signalIds.length > 0) {
            const sourceSignal = signals.find(s => s.id === signalIds[0]);
            if (sourceSignal?.placeOfObservation) {
              location = sourceSignal.placeOfObservation;
            }
          }

          const currentUser = users[0];
          const folderData = {
            name: (input.name as string) || 'New folder',
            description: (input.description as string) || '',
            color: (input.color as string) || randomColor,
            location,
            ownerId: currentUser?.id,
            ownerName: currentUser ? getUserFullName(currentUser) : undefined,
            signalIds,
          };
          const newFolder = await createFolder(folderData);
          // Track the folder for subsequent tools in this execution cycle
          pendingFoldersRef.current.set(newFolder.name.toLowerCase(), newFolder);
          pendingFoldersRef.current.set(newFolder.id, newFolder);
          setLastCreatedSignalId(null);
          return `Folder "${newFolder.name}" created with ID: ${newFolder.id}`;
        }

        case 'edit_folder': {
          const { folder_id, name, description, status, location, color, tags } = input;
          const folder = findFolder(folder_id as string);
          if (folder) {
            const updates: Record<string, unknown> = {};
            if (name) updates.name = name;
            if (description) updates.description = description;
            if (color) updates.color = color;
            if (Object.keys(updates).length > 0) {
              await updateFolder(folder.id, updates as { name?: string; description?: string; color?: string });
            }
            if (status) {
              await updateFolderStatus(folder.id, status as FolderStatus);
            }
            if (location) {
              await updateLocation(folder.id, location as string);
            }
            if (tags && Array.isArray(tags)) {
              for (const tag of folder.tags) {
                await removeTag(folder.id, tag);
              }
              for (const tag of (tags as string[])) {
                await addTag(folder.id, tag);
              }
            }
            return `Folder "${name || folder.name}" updated`;
          }
          return `Folder "${folder_id}" not found`;
        }

        case 'assign_folder_owner': {
          const { folder_id, user_id, user_name } = input;
          const folder = findFolder(folder_id as string);
          if (folder) {
            await assignFolderOwner(folder.id, user_id as string, user_name as string);
            return `${user_name} assigned as owner of "${folder.name}"`;
          }
          return `Folder "${folder_id}" not found`;
        }

        case 'add_folder_practitioner': {
          const { folder_id, user_id, user_name } = input;
          const folder = findFolder(folder_id as string);
          if (folder) {
            await addPractitioner(folder.id, user_id as string, user_name as string);
            return `Added ${user_name} as practitioner to "${folder.name}"`;
          }
          return `Folder "${folder_id}" not found`;
        }

        case 'share_folder': {
          const { folder_id, user_id, user_name, access_level } = input;
          const folder = findFolder(folder_id as string);
          if (folder) {
            await shareFolder(folder.id, user_id as string, user_name as string, (access_level as 'view' | 'edit' | 'admin') || 'view');
            return `Shared "${folder.name}" with ${user_name}`;
          }
          return `Folder "${folder_id}" not found`;
        }

        case 'complete_bibob_application': {
          const { folder_id, explanation, criteria } = input;
          // Use async version to handle race condition when folder was just created
          const folder = await findFolderAsync(folder_id as string);
          if (folder) {
            const incomingCriteria = criteria as Array<{ id: string; isMet: boolean; explanation: string }>;
            const fullCriteria: ApplicationCriterion[] = APPLICATION_CRITERIA.map(baseCrit => {
              const incoming = incomingCriteria.find(c => c.id === baseCrit.id);
              return {
                ...baseCrit,
                isMet: incoming?.isMet ?? false,
                explanation: incoming?.explanation ?? '',
              };
            });
            await updateApplicationData(folder.id, { explanation: explanation as string, criteria: fullCriteria });
            await completeApplication(folder.id);
            return `Bibob application completed for "${folder.name}"`;
          }
          return `Folder "${folder_id}" not found`;
        }

        case 'save_bibob_application_draft': {
          const { folder_id, explanation, criteria } = input;
          // Use async version to handle race condition when folder was just created
          const folder = await findFolderAsync(folder_id as string);
          if (folder) {
            const updatePayload: { explanation?: string; criteria?: ApplicationCriterion[] } = {};
            if (explanation) updatePayload.explanation = explanation as string;
            if (criteria) {
              const incomingCriteria = criteria as Array<{ id: string; isMet: boolean; explanation: string }>;
              updatePayload.criteria = APPLICATION_CRITERIA.map(baseCrit => {
                const incoming = incomingCriteria.find(c => c.id === baseCrit.id);
                return {
                  ...baseCrit,
                  isMet: incoming?.isMet ?? false,
                  explanation: incoming?.explanation ?? '',
                };
              });
            }
            await updateApplicationData(folder.id, updatePayload);
            return `Draft saved for "${folder.name}"`;
          }
          return `Folder "${folder_id}" not found`;
        }

        case 'add_folder_organization': {
          const { folder_id, name: orgName, kvk_number, address, type } = input;
          const folder = findFolder(folder_id as string);
          if (folder) {
            const org = {
              id: `org-${Date.now()}`,
              name: orgName as string,
              kvkNumber: (kvk_number as string) || '',
              address: (address as string) || '',
              type: (type as string) || 'company',
              createdAt: new Date().toISOString(),
            };
            await addOrganizationToFolder(folder.id, org);
            return `Added organization "${orgName}" to "${folder.name}"`;
          }
          return `Folder "${folder_id}" not found`;
        }

        case 'add_folder_address': {
          const { folder_id, street, city, postal_code, country, description } = input;
          const folder = findFolder(folder_id as string);
          if (folder) {
            const fullAddress = `${street}, ${postal_code ? postal_code + ' ' : ''}${city}, ${country || 'Netherlands'}`;
            const addr = {
              id: `addr-${Date.now()}`,
              street: fullAddress,
              buildingType: 'Commercial',
              isActive: true,
              description: (description as string) || '',
              createdAt: new Date().toISOString(),
            };
            await addAddressToFolder(folder.id, addr);
            return `Added address "${street}, ${city}" to "${folder.name}"`;
          }
          return `Folder "${folder_id}" not found`;
        }

        case 'add_folder_person': {
          const { folder_id, first_name, last_name, date_of_birth, role, notes } = input;
          const folder = findFolder(folder_id as string);
          if (folder) {
            const person = {
              id: `person-${Date.now()}`,
              firstName: first_name as string,
              surname: last_name as string,
              dateOfBirth: (date_of_birth as string) || '',
              address: '',
              description: `${(role as string) || ''} ${(notes as string) || ''}`.trim() || '',
              createdAt: new Date().toISOString(),
            };
            await addPersonToFolder(folder.id, person);
            return `Added "${first_name} ${last_name}" to "${folder.name}"`;
          }
          return `Folder "${folder_id}" not found`;
        }

        case 'add_folder_finding': {
          const { folder_id, label, severity, assigned_to } = input;
          const folder = findFolder(folder_id as string);
          if (folder) {
            const finding = {
              date: new Date().toISOString(),
              phase: folder.status,
              label: label as string,
              description: '',
              isCompleted: false,
              severity: (severity as 'none' | 'low' | 'serious' | 'critical') || 'none',
              assignedTo: (assigned_to as string) || '',
            };
            await addFinding(folder.id, finding);
            return `Added finding "${label}" to "${folder.name}"`;
          }
          return `Folder "${folder_id}" not found`;
        }

        case 'add_folder_letter': {
          const { folder_id, letter_name, template, date, municipal_province, ...fields } = input;
          const folder = findFolder(folder_id as string);
          if (folder) {
            const templateType = (template as string) || 'lbb_notification';
            const letterName = (letter_name as string) || `Letter - ${new Date().toLocaleDateString()}`;
            const letter = {
              name: letterName,
              template: templateType,
              description: '',
              tags: [] as string[],
            };
            const newLetter = await addLetter(folder.id, letter);
            if (newLetter) {
              const fieldData: Record<string, string | boolean> = {
                date: (date as string) || '',
                municipal_province: (municipal_province as string) || '',
                ...fields as Record<string, string | boolean>,
              };
              await updateLetter(folder.id, newLetter.id, { fieldData });
            }
            return `Added letter "${letterName}" to "${folder.name}"`;
          }
          return `Folder "${folder_id}" not found`;
        }

        case 'add_folder_communication': {
          const { folder_id, label, description: commDesc, date } = input;
          const folder = findFolder(folder_id as string);
          if (folder) {
            const communication = {
              date: (date as string) || new Date().toISOString(),
              phase: folder.status,
              label: label as string,
              description: (commDesc as string) || '',
            };
            await addCommunication(folder.id, communication);
            return `Added communication "${label}" to "${folder.name}"`;
          }
          return `Folder "${folder_id}" not found`;
        }

        case 'add_folder_visualization': {
          const { folder_id, label, description: vizDesc } = input;
          const folder = findFolder(folder_id as string);
          if (folder) {
            const visualization = {
              date: new Date().toISOString(),
              phase: folder.status,
              label: label as string,
              description: (vizDesc as string) || '',
            };
            await addVisualization(folder.id, visualization);
            return `Added visualization "${label}" to "${folder.name}"`;
          }
          return `Folder "${folder_id}" not found`;
        }

        case 'add_folder_activity': {
          const { folder_id, label, description: actDesc, assigned_to, date } = input;
          const folder = findFolder(folder_id as string);
          if (folder) {
            const activity = {
              date: (date as string) || new Date().toISOString(),
              phase: folder.status,
              label: label as string,
              description: (actDesc as string) || '',
              assignedTo: (assigned_to as string) || '',
            };
            await addActivity(folder.id, activity);
            return `Added activity "${label}" to "${folder.name}"`;
          }
          return `Folder "${folder_id}" not found`;
        }

        case 'get_folder_messages': {
          const { folder_id, contact_id, contact_name, contact_type, limit: msgLimit } = input;
          const folder = findFolder(folder_id as string);
          if (folder) {
            let conversationId = contact_id as string;
            switch (contact_type) {
              case 'practitioner': conversationId = `practitioner-${contact_id}`; break;
              case 'shared': conversationId = `shared-${contact_id}`; break;
              case 'organization': conversationId = `org-${contact_id}`; break;
              case 'person': conversationId = `person-${contact_id}`; break;
            }
            const msgs = (folder.chatMessages || [])
              .filter(m => m.conversationId === conversationId)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, (msgLimit as number) || 5);
            if (msgs.length === 0) {
              return `No messages with ${contact_name}`;
            }
            return `Messages with ${contact_name}: ${msgs.map(m => `${m.senderName}: ${m.content}`).join('; ')}`;
          }
          return `Folder "${folder_id}" not found`;
        }

        case 'send_folder_message': {
          const { folder_id, contact_id, contact_name, contact_type, message } = input;
          const folder = findFolder(folder_id as string);
          if (folder) {
            let conversationId = contact_id as string;
            switch (contact_type) {
              case 'practitioner': conversationId = `practitioner-${contact_id}`; break;
              case 'shared': conversationId = `shared-${contact_id}`; break;
              case 'organization': conversationId = `org-${contact_id}`; break;
              case 'person': conversationId = `person-${contact_id}`; break;
            }
            const currentUser = users[0];
            const chatMessage = {
              conversationId,
              senderId: currentUser?.id || 'unknown',
              senderName: currentUser ? getUserFullName(currentUser) : 'Unknown',
              content: message as string,
            };
            await addChatMessage(folder.id, chatMessage);
            return `Message sent to ${contact_name}`;
          }
          return `Folder "${folder_id}" not found`;
        }

        // Read-only tools return data summaries
        case 'summarize_signals': {
          const signalId = input.signal_id as string | undefined;
          if (signalId) {
            const s = findSignal(signalId);
            if (s) {
              return `${s.signalNumber}: ${s.description.substring(0, 100)}... at ${s.placeOfObservation}`;
            }
            return `Signal ${signalId} not found`;
          }
          return `${signals.length} signals in system`;
        }

        case 'list_folders':
          return folders.length > 0
            ? folders.map(f => `${f.name} (${f.status}, ${getSignalCountForFolder(f.id)} signals)`).join('; ')
            : 'No folders';

        case 'list_team_members':
          return users.map(u => `${getUserFullName(u)} (${u.title})`).join('; ');

        case 'get_signal_stats':
          return `Total signals: ${signalStats.total}`;

        case 'get_folder_stats':
          return `Total folders: ${folders.length}`;

        case 'search_signals': {
          let results = [...signals];
          const { keyword, type, receivedBy } = input;
          if (keyword) {
            const kw = (keyword as string).toLowerCase();
            results = results.filter(s =>
              s.description.toLowerCase().includes(kw) ||
              s.signalNumber.toLowerCase().includes(kw) ||
              s.placeOfObservation.toLowerCase().includes(kw)
            );
          }
          if (type) results = results.filter(s => s.types.includes(type as SignalType));
          if (receivedBy) results = results.filter(s => s.receivedBy === receivedBy);
          return results.length > 0
            ? `Found ${results.length}: ${results.map(s => s.signalNumber).join(', ')}`
            : 'No signals found';
        }

        case 'get_signal_activity': {
          const s = findSignal(input.signal_id as string);
          if (s) {
            const activities = s.activities.slice(0, 5);
            return activities.length > 0
              ? activities.map(a => `${a.details} by ${a.userName}`).join('; ')
              : 'No activity';
          }
          return 'Signal not found';
        }

        case 'get_signal_notes': {
          const s = findSignal(input.signal_id as string);
          if (s) {
            return s.notes.length > 0
              ? s.notes.map(n => `${n.authorName}: ${n.content.substring(0, 50)}`).join('; ')
              : 'No notes';
          }
          return 'Signal not found';
        }

        default:
          return `Tool ${toolName} executed`;
      }
    } catch (error) {
      console.error(`Tool ${toolName} error:`, error);
      return `Error executing ${toolName}`;
    }
  }, [signals, folders, users, findSignal, findFolder, createSignal, updateSignal, addNote, deleteSignal, createFolder, updateFolder, updateFolderStatus, updateLocation, addTag, removeTag, assignFolderOwner, addPractitioner, shareFolder, updateApplicationData, completeApplication, addOrganizationToFolder, addAddressToFolder, addPersonToFolder, addFinding, addLetter, updateLetter, addCommunication, addChatMessage, addVisualization, addActivity, getSignalCountForFolder, getUserFullName, signalStats]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Clear pending folders from previous execution cycle
    pendingFoldersRef.current.clear();

    const userMessage: Message = {
      id: generateMessageId(),
      role: 'user',
      content: input,
      isNew: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    clearLog();

    try {
      // Prepare context data
      const signalData = signals.map((s) => ({
        id: s.id,
        signalNumber: s.signalNumber,
        description: s.description,
        types: s.types,
        placeOfObservation: s.placeOfObservation,
        timeOfObservation: s.timeOfObservation,
        receivedBy: s.receivedBy,
        attachments: s.attachments.map((a) => ({
          id: a.id,
          fileName: a.fileName,
          fileType: a.fileType,
          content: a.content,
          textContent: a.textContent,
        })),
      }));

      const folderData = folders.map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        status: f.status,
        ownerId: f.ownerId,
        ownerName: f.ownerName,
        signalCount: getSignalCountForFolder(f.id),
        tags: f.tags,
        practitioners: (f.practitioners || []).map(p => ({ userId: p.userId, userName: p.userName })),
        sharedWith: (f.sharedWith || []).map(s => ({ userId: s.userId, userName: s.userName, accessLevel: s.accessLevel })),
        organizations: (f.organizations || []).map(o => ({ id: o.id, name: o.name })),
        peopleInvolved: (f.peopleInvolved || []).map(p => ({ id: p.id, firstName: p.firstName, surname: p.surname })),
      }));

      const teamMembersData = users.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        title: u.title,
        role: u.role,
        ownedFolderCount: folders.filter((f) => f.ownerId === u.id).length,
      }));

      const currentUser = users[0];
      const currentUserData = currentUser ? {
        id: currentUser.id,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        fullName: getUserFullName(currentUser),
        title: currentUser.title,
        role: currentUser.role,
      } : null;

      const conversationHistory = messages
        .filter((m) => !m.isNew || m.role === 'user')
        .map((m) => ({ role: m.role, content: m.content }));
      conversationHistory.push({ role: 'user', content: input });

      // Make streaming API request
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          signals: signalData,
          folders: folderData,
          teamMembers: teamMembersData,
          currentUser: currentUserData,
          lastCreatedSignalId,
          organizations: organizations.map((o) => ({
            id: o.id,
            name: o.name,
            type: o.type,
            address: o.address,
            chamberOfCommerce: o.chamberOfCommerce,
          })),
          addresses: addresses.map((a) => ({
            id: a.id,
            street: a.street,
            buildingType: a.buildingType,
            isActive: a.isActive,
            description: a.description,
          })),
          people: people.map((p) => ({
            id: p.id,
            firstName: p.firstName,
            surname: p.surname,
            dateOfBirth: p.dateOfBirth,
            address: p.address,
            description: p.description,
          })),
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Process streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let finalResponse = '';
      const executedTools: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);

              switch (event.type) {
                case 'phase':
                  setAgentPhase(event.phase);
                  break;

                case 'thinking':
                  addLogEntry(createLogEntry('thinking', event.text));
                  break;

                case 'tool_call':
                  // Skip execution for plan_proposal - it's handled by the plan_proposal event
                  if (event.tool === 'plan_proposal') {
                    addLogEntry(createLogEntry('plan', `Planning: ${event.tool}`, { status: 'success', toolName: event.tool }));
                    break;
                  }
                  // Create the tool_call entry and store its ID
                  const toolCallEntry = createLogEntry('tool_call', `Calling ${event.tool}...`, { status: 'pending', toolName: event.tool, toolInput: event.input });
                  addLogEntry(toolCallEntry);
                  // Execute the tool
                  const result = await executeTool(event.tool, event.input);
                  executedTools.push(`${event.tool}: ${result}`);
                  // Update the tool_call entry status to success (stop spinner)
                  updateLogEntry(toolCallEntry.id, { status: 'success' });
                  // Add the result entry
                  addLogEntry(createLogEntry('tool_result', result, { status: 'success', toolName: event.tool }));
                  break;

                case 'tool_result':
                  // Server-side tool result (like summarize_attachments)
                  if (event.tool === 'summarize_attachments') {
                    addLogEntry(createLogEntry('tool_result', event.result.substring(0, 100) + '...', { status: 'success', toolName: event.tool }));
                  }
                  break;

                case 'plan_proposal':
                  setPendingPlan(event as PlanData);
                  addLogEntry(createLogEntry('plan', `Plan: ${event.summary}`, { planData: event as PlanData }));
                  setIsLoading(false);
                  break;

                case 'response':
                  finalResponse = event.text;
                  // If awaiting approval, don't add a message yet
                  if (event.awaitingApproval) {
                    // The plan is already set via plan_proposal event
                    return;
                  }
                  // If the response is empty but we have tool results, create a summary
                  if (!finalResponse && executedTools.length > 0) {
                    finalResponse = `Done! ${executedTools.join('. ')}`;
                  }
                  break;
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      // Add the final assistant message
      if (finalResponse) {
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            role: 'assistant',
            content: finalResponse,
            isNew: true,
          },
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setAgentPhase('idle');
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          isNew: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePlan = useCallback(async () => {
    if (!pendingPlan) return;

    // Clear pending folders from previous execution cycle
    pendingFoldersRef.current.clear();

    // Store the plan before clearing it
    const planToExecute = pendingPlan;

    // Send approval message to continue execution
    const approvalMessage = "Approved. Please proceed with the plan.";

    // Add user approval message
    const userMessage: Message = {
      id: generateMessageId(),
      role: 'user',
      content: approvalMessage,
      isNew: true,
    };
    setMessages((prev) => [...prev, userMessage]);
    setPendingPlan(null);
    setIsLoading(true);
    setAgentPhase('executing');

    // Clear only plan-related log entries, keep others
    setLogEntries((prev) => prev.filter((e) => e.type !== 'plan'));

    // Continue with the same conversation
    try {
      const signalData = signals.map((s) => ({
        id: s.id,
        signalNumber: s.signalNumber,
        description: s.description,
        types: s.types,
        placeOfObservation: s.placeOfObservation,
        timeOfObservation: s.timeOfObservation,
        receivedBy: s.receivedBy,
        attachments: s.attachments.map((a) => ({
          id: a.id,
          fileName: a.fileName,
          fileType: a.fileType,
          content: a.content,
          textContent: a.textContent,
        })),
      }));

      const folderData = folders.map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        status: f.status,
        ownerId: f.ownerId,
        ownerName: f.ownerName,
        signalCount: getSignalCountForFolder(f.id),
        tags: f.tags,
        practitioners: (f.practitioners || []).map(p => ({ userId: p.userId, userName: p.userName })),
        sharedWith: (f.sharedWith || []).map(s => ({ userId: s.userId, userName: s.userName, accessLevel: s.accessLevel })),
        organizations: (f.organizations || []).map(o => ({ id: o.id, name: o.name })),
        peopleInvolved: (f.peopleInvolved || []).map(p => ({ id: p.id, firstName: p.firstName, surname: p.surname })),
      }));

      const teamMembersData = users.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        title: u.title,
        role: u.role,
        ownedFolderCount: folders.filter((f) => f.ownerId === u.id).length,
      }));

      const currentUser = users[0];
      const currentUserData = currentUser ? {
        id: currentUser.id,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        fullName: getUserFullName(currentUser),
        title: currentUser.title,
        role: currentUser.role,
      } : null;

      // Build conversation history including the approval
      const conversationHistory = messages
        .filter((m) => !m.isNew || m.role === 'user')
        .map((m) => ({ role: m.role, content: m.content }));
      conversationHistory.push({ role: 'user', content: approvalMessage });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          signals: signalData,
          folders: folderData,
          teamMembers: teamMembersData,
          currentUser: currentUserData,
          lastCreatedSignalId,
          organizations: organizations.map((o) => ({
            id: o.id,
            name: o.name,
            type: o.type,
            address: o.address,
            chamberOfCommerce: o.chamberOfCommerce,
          })),
          addresses: addresses.map((a) => ({
            id: a.id,
            street: a.street,
            buildingType: a.buildingType,
            isActive: a.isActive,
            description: a.description,
          })),
          people: people.map((p) => ({
            id: p.id,
            firstName: p.firstName,
            surname: p.surname,
            dateOfBirth: p.dateOfBirth,
            address: p.address,
            description: p.description,
          })),
          stream: true,
          // Pass the approved plan to skip plan_proposal generation
          approvedPlan: planToExecute,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let finalResponse = '';
      const executedTools: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);

              switch (event.type) {
                case 'phase':
                  setAgentPhase(event.phase);
                  break;

                case 'thinking':
                  addLogEntry(createLogEntry('thinking', event.text));
                  break;

                case 'tool_call':
                  // Skip execution for plan_proposal - it's handled by the plan_proposal event
                  if (event.tool === 'plan_proposal') {
                    addLogEntry(createLogEntry('plan', `Planning: ${event.tool}`, { status: 'success', toolName: event.tool }));
                    break;
                  }
                  // Create the tool_call entry and store its ID
                  const toolCallEntry2 = createLogEntry('tool_call', `Calling ${event.tool}...`, { status: 'pending', toolName: event.tool, toolInput: event.input });
                  addLogEntry(toolCallEntry2);
                  // Execute the tool
                  const result = await executeTool(event.tool, event.input);
                  executedTools.push(`${event.tool}: ${result}`);
                  // Update the tool_call entry status to success (stop spinner)
                  updateLogEntry(toolCallEntry2.id, { status: 'success' });
                  // Add the result entry
                  addLogEntry(createLogEntry('tool_result', result, { status: 'success', toolName: event.tool }));
                  break;

                case 'tool_result':
                  if (event.tool === 'summarize_attachments') {
                    addLogEntry(createLogEntry('tool_result', event.result.substring(0, 100) + '...', { status: 'success', toolName: event.tool }));
                  }
                  break;

                case 'response':
                  finalResponse = event.text;
                  if (!finalResponse && executedTools.length > 0) {
                    finalResponse = `Done! ${executedTools.join('. ')}`;
                  }
                  break;
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      if (finalResponse) {
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            role: 'assistant',
            content: finalResponse,
            isNew: true,
          },
        ]);
      }
    } catch (error) {
      console.error('Approval execution error:', error);
      setAgentPhase('idle');
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          role: 'assistant',
          content: 'Sorry, I encountered an error executing the plan. Please try again.',
          isNew: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [pendingPlan, messages, signals, folders, users, organizations, addresses, people, lastCreatedSignalId, executeTool, addLogEntry, updateLogEntry, getSignalCountForFolder, getUserFullName]);

  const handleRejectPlan = useCallback(() => {
    setPendingPlan(null);
    setAgentPhase('idle');
    // User can type feedback naturally in the input
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <BotIcon size="sm" className="bg-primary/20" />
          <p className="text-xs text-muted-foreground">GCMP Assistant</p>
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
                'rounded-lg px-3 py-2 text-sm max-w-[85%]',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              )}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}

        {/* Agent Log */}
        {(isLoading || agentPhase !== 'idle') && (
          <AgentLog
            entries={logEntries}
            currentPhase={agentPhase}
            className="mx-auto max-w-[90%]"
          />
        )}

        {/* Plan Display for Approval */}
        {pendingPlan && agentPhase === 'awaiting_approval' && (
          <div className="mx-auto max-w-[90%]">
            <PlanDisplay
              plan={pendingPlan}
              onApprove={handleApprovePlan}
              onReject={handleRejectPlan}
              isAwaitingApproval={true}
            />
          </div>
        )}

        {/* Loading indicator when no log entries yet */}
        {isLoading && logEntries.length === 0 && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
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
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </>
  );
}

// ChatContent wraps ChatBotInner for use in ChatDrawer
export function ChatContent() {
  return <ChatBotInner />;
}

// Export ChatBot for backwards compatibility
export function ChatBot() {
  return <ChatContent />;
}
