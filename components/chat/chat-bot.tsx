'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { useSignals } from '@/context/signal-context';
import { useCases } from '@/context/case-context';
import { useUsers } from '@/context/user-context';
import { useOrganizations } from '@/context/organization-context';
import { useAddresses } from '@/context/address-context';
import { usePeople } from '@/context/person-context';
import { CreateSignalInput, UpdateSignalInput, SignalType, Signal } from '@/types/signal';
import { APPLICATION_CRITERIA, ApplicationCriterion, CaseStatus, Case } from '@/types/case';
import { AgentPhase, LogEntry, createLogEntry, PlanData, PlanDisplay, ClarificationData, AgentLog } from './agent-log';
import { ClarificationDisplay } from './clarification-display';
import { PhaseStepper } from './workflow/components/phase-stepper';
import { ConversationPhase } from '@/types/conversation-workflow';

// Generate unique message IDs
let messageIdCounter = 0;
const generateMessageId = () => `msg-${Date.now()}-${++messageIdCounter}`;

// Map AgentPhase to ConversationPhase for the stepper display
const mapToConversationPhase = (agentPhase: AgentPhase): ConversationPhase => {
  switch (agentPhase) {
    case 'clarifying':
      return 'clarification';
    case 'planning':
    case 'awaiting_approval':
      return 'planning';
    case 'executing':
      return 'execution';
    case 'reflecting':
      return 'review';
    case 'complete':
      return 'complete';
    default:
      return 'idle';
  }
};

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
  const [pendingClarification, setPendingClarification] = useState<ClarificationData | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Track cases created during the current execution cycle to handle race conditions
  // when subsequent tools reference cases before React state updates
  const pendingCasesRef = useRef<Map<string, Case>>(new Map());
  // Track step outputs for resolving $stepN.fieldName references
  const stepOutputsRef = useRef<Map<number, Record<string, unknown>>>(new Map());

  const { signals, filteredSignals, createSignal, updateSignal, getSignalById, addNote, deleteSignal, addSignalToCase, signalStats, refreshSignals } = useSignals();
  const { cases, getSignalCountForCase, updateApplicationData, completeApplication, assignCaseOwner, updateCase, updateCaseStatus, updateLocation, addTag, removeTag, createCase, deleteCase, addPractitioner, shareCase, addOrganizationToCase, addAddressToCase, addPersonToCase, addFinding, addLetter, updateLetter, addCommunication, addChatMessage, addVisualization, addActivity, refreshCases } = useCases();
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
          content: "Hi! I'm Atlas AI, your AI assistant. I can help you manage signals and cases - just tell me what you need and I'll take care of it.",
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

  const findCase = useCallback((identifier: string) => {
    return cases.find(c =>
      c.id === identifier ||
      c.name.toLowerCase().includes(identifier.toLowerCase())
    );
  }, [cases]);

  // Async version that falls back to API when case not found in state
  // This is needed because React state updates are async and may not be
  // available immediately after creating a case
  const findCaseAsync = useCallback(async (identifier: string) => {
    // First check pending cases created in this execution cycle
    const pendingCase = pendingCasesRef.current.get(identifier) ||
      pendingCasesRef.current.get(identifier.toLowerCase());
    if (pendingCase) return pendingCase;

    // Then check local state
    const localCase = cases.find(c =>
      c.id === identifier ||
      c.name.toLowerCase().includes(identifier.toLowerCase())
    );
    if (localCase) return localCase;

    // If not found locally and identifier looks like an ID, try fetching from API
    if (identifier.startsWith('case-') || identifier.match(/^[a-z0-9-]+$/i)) {
      try {
        const response = await fetch(`/api/cases/${identifier}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('Failed to fetch case from API:', error);
      }
    }

    return undefined;
  }, [cases]);

  // Function to resolve $stepN.fieldName references in tool inputs
  const resolveStepReferences = useCallback((input: Record<string, unknown>, stepOutputs: Map<number, Record<string, unknown>>): Record<string, unknown> => {
    const resolved: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string' && value.startsWith('$step')) {
        // Parse $stepN.fieldName
        const match = value.match(/^\$step(\d+)\.(\w+)$/);
        if (match) {
          const stepNum = parseInt(match[1], 10);
          const fieldName = match[2];
          const stepOutput = stepOutputs.get(stepNum);
          if (stepOutput && stepOutput[fieldName] !== undefined) {
            resolved[key] = stepOutput[fieldName];
          } else {
            resolved[key] = value; // Keep original if not found
          }
        } else {
          resolved[key] = value;
        }
      } else if (Array.isArray(value)) {
        resolved[key] = value.map(item => {
          if (typeof item === 'string' && item.startsWith('$step')) {
            const match = item.match(/^\$step(\d+)\.(\w+)$/);
            if (match) {
              const stepNum = parseInt(match[1], 10);
              const fieldName = match[2];
              const stepOutput = stepOutputs.get(stepNum);
              if (stepOutput && stepOutput[fieldName] !== undefined) {
                return stepOutput[fieldName];
              }
            }
            return item;
          } else if (typeof item === 'object' && item !== null) {
            return resolveStepReferences(item as Record<string, unknown>, stepOutputs);
          }
          return item;
        });
      } else if (typeof value === 'object' && value !== null) {
        resolved[key] = resolveStepReferences(value as Record<string, unknown>, stepOutputs);
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }, []);

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
    setPendingClarification(null);
  }, []);

  // Tool execution result with optional structured output
  interface ToolResult {
    message: string;
    output?: Record<string, unknown>;
  }

  // Execute a tool and return the result with optional structured output
  const executeTool = useCallback(async (toolName: string, input: Record<string, unknown>): Promise<ToolResult> => {
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
          return {
            message: `Signal created: ${newSignal.signalNumber}`,
            output: { signalId: newSignal.id, signalNumber: newSignal.signalNumber }
          };
        }

        case 'edit_signal': {
          const { signal_id, ...updates } = input;
          const targetSignal = findSignal(signal_id as string);
          if (targetSignal) {
            await updateSignal(targetSignal.id, updates as UpdateSignalInput);
            return { message: `Signal ${targetSignal.signalNumber} updated` };
          }
          return { message: `Signal ${signal_id} not found` };
        }

        case 'add_note': {
          const { signal_id, content, is_private } = input;
          const targetSignal = findSignal(signal_id as string);
          if (targetSignal) {
            await addNote(targetSignal.id, content as string, is_private as boolean || false);
            return { message: `Note added to ${targetSignal.signalNumber}` };
          }
          return { message: `Signal ${signal_id} not found` };
        }

        case 'delete_signal': {
          const { signal_id } = input;
          const targetSignal = findSignal(signal_id as string);
          if (targetSignal) {
            await deleteSignal(targetSignal.id);
            return { message: `Signal ${targetSignal.signalNumber} deleted` };
          }
          return { message: `Signal ${signal_id} not found` };
        }

        case 'add_signal_to_case': {
          const { signal_id, case_id } = input;
          const signal = findSignal(signal_id as string);
          if (!signal) {
            return { message: `Signal "${signal_id}" not found` };
          }
          const caseItem = findCase(case_id as string);
          if (!caseItem) {
            return { message: `Case "${case_id}" not found` };
          }
          await addSignalToCase(signal.id, caseItem.id);
          return { message: `Added signal ${signal.signalNumber} to case "${caseItem.name}"` };
        }

        case 'create_case': {
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
          const caseData = {
            name: (input.name as string) || 'New case',
            description: (input.description as string) || '',
            color: (input.color as string) || randomColor,
            location,
            ownerId: currentUser?.id,
            ownerName: currentUser ? getUserFullName(currentUser) : undefined,
            signalIds,
          };
          const newCase = await createCase(caseData);
          // Track the case for subsequent tools in this execution cycle
          pendingCasesRef.current.set(newCase.name.toLowerCase(), newCase);
          pendingCasesRef.current.set(newCase.id, newCase);
          setLastCreatedSignalId(null);
          return {
            message: `Case "${newCase.name}" created with ID: ${newCase.id}`,
            output: { caseId: newCase.id, caseName: newCase.name }
          };
        }

        case 'edit_case': {
          const { case_id, name, description, status, location, color, tags } = input;
          const caseItem = findCase(case_id as string);
          if (caseItem) {
            const updates: Record<string, unknown> = {};
            if (name) updates.name = name;
            if (description) updates.description = description;
            if (color) updates.color = color;
            if (Object.keys(updates).length > 0) {
              await updateCase(caseItem.id, updates as { name?: string; description?: string; color?: string });
            }
            if (status) {
              await updateCaseStatus(caseItem.id, status as CaseStatus);
            }
            if (location) {
              await updateLocation(caseItem.id, location as string);
            }
            if (tags && Array.isArray(tags)) {
              for (const tag of caseItem.tags) {
                await removeTag(caseItem.id, tag);
              }
              for (const tag of (tags as string[])) {
                await addTag(caseItem.id, tag);
              }
            }
            return { message: `Case "${name || caseItem.name}" updated` };
          }
          return { message: `Case "${case_id}" not found` };
        }

        case 'delete_case': {
          const { case_id } = input;
          const caseItem = findCase(case_id as string);
          if (caseItem) {
            await deleteCase(caseItem.id);
            return { message: `Case "${caseItem.name}" deleted` };
          }
          return { message: `Case "${case_id}" not found` };
        }

        case 'assign_case_owner': {
          const { case_id, user_id, user_name } = input;
          const caseItem = findCase(case_id as string);
          if (caseItem) {
            await assignCaseOwner(caseItem.id, user_id as string, user_name as string);
            return { message: `${user_name} assigned as owner of "${caseItem.name}"` };
          }
          return { message: `Case "${case_id}" not found` };
        }

        case 'add_case_practitioner': {
          const { case_id, user_id, user_name } = input;
          const caseItem = findCase(case_id as string);
          if (caseItem) {
            await addPractitioner(caseItem.id, user_id as string, user_name as string);
            return { message: `Added ${user_name} as practitioner to "${caseItem.name}"` };
          }
          return { message: `Case "${case_id}" not found` };
        }

        case 'share_case': {
          const { case_id, user_id, user_name, access_level } = input;
          const caseItem = findCase(case_id as string);
          if (caseItem) {
            await shareCase(caseItem.id, user_id as string, user_name as string, (access_level as 'view' | 'edit' | 'admin') || 'view');
            return { message: `Shared "${caseItem.name}" with ${user_name}` };
          }
          return { message: `Case "${case_id}" not found` };
        }

        case 'complete_bibob_application': {
          const { case_id, explanation, criteria } = input;
          // Use async version to handle race condition when case was just created
          const caseItem = await findCaseAsync(case_id as string);
          if (caseItem) {
            const incomingCriteria = criteria as Array<{ id: string; isMet: boolean; explanation: string }>;
            const fullCriteria: ApplicationCriterion[] = APPLICATION_CRITERIA.map(baseCrit => {
              const incoming = incomingCriteria.find(c => c.id === baseCrit.id);
              return {
                ...baseCrit,
                isMet: incoming?.isMet ?? false,
                explanation: incoming?.explanation ?? '',
              };
            });
            await updateApplicationData(caseItem.id, { explanation: explanation as string, criteria: fullCriteria });
            await completeApplication(caseItem.id);
            return { message: `Bibob application completed for "${caseItem.name}"` };
          }
          return { message: `Case "${case_id}" not found` };
        }

        case 'save_bibob_application_draft': {
          const { case_id, explanation, criteria } = input;
          // Use async version to handle race condition when case was just created
          const caseItem = await findCaseAsync(case_id as string);
          if (caseItem) {
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
            await updateApplicationData(caseItem.id, updatePayload);
            return { message: `Draft saved for "${caseItem.name}"` };
          }
          return { message: `Case "${case_id}" not found` };
        }

        case 'add_case_organization': {
          const { case_id, name: orgName, kvk_number, address, type } = input;
          const caseItem = findCase(case_id as string);
          if (caseItem) {
            const org = {
              id: `org-${Date.now()}`,
              name: orgName as string,
              kvkNumber: (kvk_number as string) || '',
              address: (address as string) || '',
              type: (type as string) || 'company',
              createdAt: new Date().toISOString(),
            };
            await addOrganizationToCase(caseItem.id, org);
            return { message: `Added organization "${orgName}" to "${caseItem.name}"` };
          }
          return { message: `Case "${case_id}" not found` };
        }

        case 'add_case_address': {
          const { case_id, street, city, postal_code, country, description } = input;
          const caseItem = findCase(case_id as string);
          if (caseItem) {
            const fullAddress = `${street}, ${postal_code ? postal_code + ' ' : ''}${city}, ${country || 'Netherlands'}`;
            const addr = {
              id: `addr-${Date.now()}`,
              street: fullAddress,
              buildingType: 'Commercial',
              isActive: true,
              description: (description as string) || '',
              createdAt: new Date().toISOString(),
            };
            await addAddressToCase(caseItem.id, addr);
            return { message: `Added address "${street}, ${city}" to "${caseItem.name}"` };
          }
          return { message: `Case "${case_id}" not found` };
        }

        case 'add_case_person': {
          const { case_id, first_name, last_name, date_of_birth, role, notes } = input;
          const caseItem = findCase(case_id as string);
          if (caseItem) {
            const person = {
              id: `person-${Date.now()}`,
              firstName: first_name as string,
              surname: last_name as string,
              dateOfBirth: (date_of_birth as string) || '',
              address: '',
              description: `${(role as string) || ''} ${(notes as string) || ''}`.trim() || '',
              createdAt: new Date().toISOString(),
            };
            await addPersonToCase(caseItem.id, person);
            return { message: `Added "${first_name} ${last_name}" to "${caseItem.name}"` };
          }
          return { message: `Case "${case_id}" not found` };
        }

        case 'add_case_finding': {
          const { case_id, label, severity, assigned_to } = input;
          const caseItem = findCase(case_id as string);
          if (caseItem) {
            const finding = {
              date: new Date().toISOString(),
              phase: caseItem.status,
              label: label as string,
              description: '',
              isCompleted: false,
              severity: (severity as 'none' | 'low' | 'serious' | 'critical') || 'none',
              assignedTo: (assigned_to as string) || '',
            };
            await addFinding(caseItem.id, finding);
            return { message: `Added finding "${label}" to "${caseItem.name}"` };
          }
          return { message: `Case "${case_id}" not found` };
        }

        case 'add_case_letter': {
          const { case_id, letter_name, template, date, municipal_province, ...fields } = input;
          const caseItem = findCase(case_id as string);
          if (caseItem) {
            const templateType = (template as string) || 'lbb_notification';
            const letterName = (letter_name as string) || `Letter - ${new Date().toLocaleDateString()}`;
            const letter = {
              name: letterName,
              template: templateType,
              description: '',
              tags: [] as string[],
            };
            const newLetter = await addLetter(caseItem.id, letter);
            if (newLetter) {
              const fieldData: Record<string, string | boolean> = {
                date: (date as string) || '',
                municipal_province: (municipal_province as string) || '',
                ...fields as Record<string, string | boolean>,
              };
              await updateLetter(caseItem.id, newLetter.id, { fieldData });
            }
            return { message: `Added letter "${letterName}" to "${caseItem.name}"` };
          }
          return { message: `Case "${case_id}" not found` };
        }

        case 'add_case_communication': {
          const { case_id, label, description: commDesc, date } = input;
          const caseItem = findCase(case_id as string);
          if (caseItem) {
            const communication = {
              date: (date as string) || new Date().toISOString(),
              phase: caseItem.status,
              label: label as string,
              description: (commDesc as string) || '',
            };
            await addCommunication(caseItem.id, communication);
            return { message: `Added communication "${label}" to "${caseItem.name}"` };
          }
          return { message: `Case "${case_id}" not found` };
        }

        case 'add_case_visualization': {
          const { case_id, label, description: vizDesc } = input;
          const caseItem = findCase(case_id as string);
          if (caseItem) {
            const visualization = {
              date: new Date().toISOString(),
              phase: caseItem.status,
              label: label as string,
              description: (vizDesc as string) || '',
            };
            await addVisualization(caseItem.id, visualization);
            return { message: `Added visualization "${label}" to "${caseItem.name}"` };
          }
          return { message: `Case "${case_id}" not found` };
        }

        case 'add_case_activity': {
          const { case_id, label, description: actDesc, assigned_to, date } = input;
          const caseItem = findCase(case_id as string);
          if (caseItem) {
            const activity = {
              date: (date as string) || new Date().toISOString(),
              phase: caseItem.status,
              label: label as string,
              description: (actDesc as string) || '',
              assignedTo: (assigned_to as string) || '',
            };
            await addActivity(caseItem.id, activity);
            return { message: `Added activity "${label}" to "${caseItem.name}"` };
          }
          return { message: `Case "${case_id}" not found` };
        }

        case 'get_case_messages': {
          const { case_id, contact_id, contact_name, contact_type, limit: msgLimit } = input;
          const caseItem = findCase(case_id as string);
          if (caseItem) {
            let conversationId = contact_id as string;
            switch (contact_type) {
              case 'practitioner': conversationId = `practitioner-${contact_id}`; break;
              case 'shared': conversationId = `shared-${contact_id}`; break;
              case 'organization': conversationId = `org-${contact_id}`; break;
              case 'person': conversationId = `person-${contact_id}`; break;
            }
            const msgs = (caseItem.chatMessages || [])
              .filter(m => m.conversationId === conversationId)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, (msgLimit as number) || 5);
            if (msgs.length === 0) {
              return { message: `No messages with ${contact_name}` };
            }
            return { message: `Messages with ${contact_name}: ${msgs.map(m => `${m.senderName}: ${m.content}`).join('; ')}` };
          }
          return { message: `Case "${case_id}" not found` };
        }

        case 'send_case_message': {
          const { case_id, contact_id, contact_name, contact_type, message } = input;
          const caseItem = findCase(case_id as string);
          if (caseItem) {
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
            await addChatMessage(caseItem.id, chatMessage);
            return { message: `Message sent to ${contact_name}` };
          }
          return { message: `Case "${case_id}" not found` };
        }

        // Read-only tools return data summaries
        case 'summarize_signals': {
          const signalId = input.signal_id as string | undefined;
          if (signalId) {
            const s = findSignal(signalId);
            if (s) {
              return { message: `${s.signalNumber}: ${s.description.substring(0, 100)}... at ${s.placeOfObservation}` };
            }
            return { message: `Signal ${signalId} not found` };
          }
          // Return a more detailed summary when no specific signal is requested
          const summary = signals.slice(0, 5).map(s =>
            `• ${s.signalNumber}: ${s.description.substring(0, 50)}... (${s.types.join(', ')})`
          ).join('\n');
          return {
            message: `${signals.length} signals in system:\n${summary}${signals.length > 5 ? `\n... and ${signals.length - 5} more` : ''}`
          };
        }

        case 'summarize_case': {
          const caseId = input.case_id as string | undefined;
          if (caseId) {
            const c = findCase(caseId);
            if (c) {
              const signalCount = getSignalCountForCase(c.id);
              return {
                message: `${c.name}: ${c.description.substring(0, 80)}... | Status: ${c.status} | Location: ${c.location || 'N/A'} | Signals: ${signalCount} | Practitioners: ${c.practitioners?.length || 0} | Organizations: ${c.organizations?.length || 0}`
              };
            }
            return { message: `Case "${caseId}" not found` };
          }
          return { message: `${cases.length} cases: ${cases.map(c => `${c.name} (${c.status})`).join('; ')}` };
        }

        case 'list_cases':
          return {
            message: cases.length > 0
              ? cases.map(c => `${c.name} (${c.status}, ${getSignalCountForCase(c.id)} signals)`).join('; ')
              : 'No cases'
          };

        case 'list_team_members':
          return { message: users.map(u => `${getUserFullName(u)} (${u.title})`).join('; ') };

        case 'get_signal_stats':
          return { message: `Total signals: ${signalStats.total}` };

        case 'get_case_stats':
          return { message: `Total cases: ${cases.length}` };

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
          return {
            message: results.length > 0
              ? `Found ${results.length}: ${results.map(s => s.signalNumber).join(', ')}`
              : 'No signals found'
          };
        }

        case 'get_signal_activity': {
          const s = findSignal(input.signal_id as string);
          if (s) {
            const activities = s.activities.slice(0, 5);
            return {
              message: activities.length > 0
                ? activities.map(a => `${a.details} by ${a.userName}`).join('; ')
                : 'No activity'
            };
          }
          return { message: 'Signal not found' };
        }

        case 'get_signal_notes': {
          const s = findSignal(input.signal_id as string);
          if (s) {
            return {
              message: s.notes.length > 0
                ? s.notes.map(n => `${n.authorName}: ${n.content.substring(0, 50)}`).join('; ')
                : 'No notes'
            };
          }
          return { message: 'Signal not found' };
        }

        default:
          return { message: `Tool ${toolName} executed` };
      }
    } catch (error) {
      console.error(`Tool ${toolName} error:`, error);
      return { message: `Error executing ${toolName}` };
    }
  }, [signals, cases, users, findSignal, findCase, findCaseAsync, createSignal, updateSignal, addNote, deleteSignal, addSignalToCase, createCase, deleteCase, updateCase, updateCaseStatus, updateLocation, addTag, removeTag, assignCaseOwner, addPractitioner, shareCase, updateApplicationData, completeApplication, addOrganizationToCase, addAddressToCase, addPersonToCase, addFinding, addLetter, updateLetter, addCommunication, addChatMessage, addVisualization, addActivity, getSignalCountForCase, getUserFullName, signalStats]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Clear pending cases and step outputs from previous execution cycle
    pendingCasesRef.current.clear();
    stepOutputsRef.current.clear();

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
    setAgentPhase('clarifying'); // Start in first phase immediately to show stepper

    try {
      // Fetch fresh signals to ensure we have the latest data
      let freshSignals = filteredSignals;
      try {
        const signalsResponse = await fetch('/api/signals');
        if (signalsResponse.ok) {
          const fetchedSignals: Signal[] = await signalsResponse.json();
          // Sort by createdAt desc to match expected order (newest first)
          freshSignals = fetchedSignals.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
      } catch (error) {
        console.error('Failed to refresh signals:', error);
        // Fall back to existing filteredSignals
      }

      // Prepare context data - use freshSignals which is sorted by createdAt desc
      const signalData = freshSignals.map((s) => ({
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

      const caseData = cases.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        status: c.status,
        ownerId: c.ownerId,
        ownerName: c.ownerName,
        signalCount: getSignalCountForCase(c.id),
        tags: c.tags,
        practitioners: (c.practitioners || []).map(p => ({ userId: p.userId, userName: p.userName })),
        sharedWith: (c.sharedWith || []).map(s => ({ userId: s.userId, userName: s.userName, accessLevel: s.accessLevel })),
        organizations: (c.organizations || []).map(o => ({ id: o.id, name: o.name })),
        peopleInvolved: (c.peopleInvolved || []).map(p => ({ id: p.id, firstName: p.firstName, surname: p.surname })),
      }));

      const teamMembersData = users.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        title: u.title,
        role: u.role,
        ownedCaseCount: cases.filter((c) => c.ownerId === u.id).length,
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
          cases: caseData,
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
      let currentStep = 0;

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
                  // Increment step counter for each tool call
                  currentStep++;
                  // Resolve any step references in the input
                  const resolvedInput = resolveStepReferences(event.input, stepOutputsRef.current);
                  // Create the tool_call entry and store its ID
                  const toolCallEntry = createLogEntry('tool_call', `Calling ${event.tool}...`, { status: 'pending', toolName: event.tool, toolInput: resolvedInput });
                  addLogEntry(toolCallEntry);
                  // Execute the tool with resolved input
                  const result = await executeTool(event.tool, resolvedInput);
                  executedTools.push(`${event.tool}: ${result.message}`);
                  // Track output for this step
                  if (result.output) {
                    stepOutputsRef.current.set(currentStep, result.output);
                  }
                  // Update the tool_call entry status to success (stop spinner)
                  updateLogEntry(toolCallEntry.id, { status: 'success' });
                  // Add the result entry
                  addLogEntry(createLogEntry('tool_result', result.message, { status: 'success', toolName: event.tool }));
                  break;

                case 'tool_result':
                  // Server-side tool result (MCP executed tools)
                  // Track that a tool was executed so we can refresh state later
                  if (event.tool) {
                    executedTools.push(`${event.tool}: executed`);
                    addLogEntry(createLogEntry('tool_result',
                      typeof event.result === 'string'
                        ? event.result.substring(0, 100) + (event.result.length > 100 ? '...' : '')
                        : `${event.tool} completed`,
                      { status: 'success', toolName: event.tool }
                    ));
                  }
                  break;

                case 'clarification':
                  setPendingClarification({
                    summary: event.summary,
                    questions: event.questions,
                  });
                  addLogEntry(createLogEntry('clarification', `Clarification needed: ${event.summary}`, { clarificationData: event as ClarificationData }));
                  setAgentPhase('clarifying'); // Ensure phase is set
                  setIsLoading(false);
                  break;

                case 'plan_proposal':
                  setPendingPlan(event as PlanData);
                  addLogEntry(createLogEntry('plan', `Plan: ${event.summary}`, { planData: event as PlanData }));
                  setAgentPhase('awaiting_approval');
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

        // Add workflow boundary marker when workflow completes
        if (finalResponse.includes('completed successfully') || finalResponse.startsWith('Done!')) {
          setMessages((prev) => [
            ...prev,
            {
              id: generateMessageId(),
              role: 'assistant',
              content: '[WORKFLOW_BOUNDARY: The above workflow is complete. New requests are independent - only include actions explicitly requested.]',
              isNew: false,
            },
          ]);
        }
      }

      // Refresh frontend state after MCP tool execution
      // This ensures React state is synced with backend after server-side tool calls
      if (executedTools.length > 0) {
        try {
          await Promise.all([refreshSignals(), refreshCases()]);
        } catch (refreshError) {
          console.warn('Failed to refresh state after tool execution:', refreshError);
        }
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

    // Clear pending cases and step outputs from previous execution cycle
    pendingCasesRef.current.clear();
    stepOutputsRef.current.clear();

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
      // Use filteredSignals which is sorted by createdAt desc
      const signalData = filteredSignals.map((s) => ({
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

      const caseData = cases.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        status: c.status,
        ownerId: c.ownerId,
        ownerName: c.ownerName,
        signalCount: getSignalCountForCase(c.id),
        tags: c.tags,
        practitioners: (c.practitioners || []).map(p => ({ userId: p.userId, userName: p.userName })),
        sharedWith: (c.sharedWith || []).map(s => ({ userId: s.userId, userName: s.userName, accessLevel: s.accessLevel })),
        organizations: (c.organizations || []).map(o => ({ id: o.id, name: o.name })),
        peopleInvolved: (c.peopleInvolved || []).map(p => ({ id: p.id, firstName: p.firstName, surname: p.surname })),
      }));

      const teamMembersData = users.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        title: u.title,
        role: u.role,
        ownedCaseCount: cases.filter((c) => c.ownerId === u.id).length,
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
          cases: caseData,
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
      let currentStep = 0;

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
                  // Increment step counter for each tool call
                  currentStep++;
                  // Resolve any step references in the input
                  const resolvedInput2 = resolveStepReferences(event.input, stepOutputsRef.current);
                  // Create the tool_call entry and store its ID
                  const toolCallEntry2 = createLogEntry('tool_call', `Calling ${event.tool}...`, { status: 'pending', toolName: event.tool, toolInput: resolvedInput2 });
                  addLogEntry(toolCallEntry2);
                  // Execute the tool with resolved input
                  const result = await executeTool(event.tool, resolvedInput2);
                  executedTools.push(`${event.tool}: ${result.message}`);
                  // Track output for this step
                  if (result.output) {
                    stepOutputsRef.current.set(currentStep, result.output);
                  }
                  // Update the tool_call entry status to success (stop spinner)
                  updateLogEntry(toolCallEntry2.id, { status: 'success' });
                  // Add the result entry
                  addLogEntry(createLogEntry('tool_result', result.message, { status: 'success', toolName: event.tool }));
                  break;

                case 'tool_result':
                  // Server-side tool result (MCP executed tools)
                  if (event.tool) {
                    executedTools.push(`${event.tool}: executed`);
                    addLogEntry(createLogEntry('tool_result',
                      typeof event.result === 'string'
                        ? event.result.substring(0, 100) + (event.result.length > 100 ? '...' : '')
                        : `${event.tool} completed`,
                      { status: 'success', toolName: event.tool }
                    ));
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

        // Add workflow boundary marker when workflow completes
        if (finalResponse.includes('completed successfully') || finalResponse.startsWith('Done!')) {
          setMessages((prev) => [
            ...prev,
            {
              id: generateMessageId(),
              role: 'assistant',
              content: '[WORKFLOW_BOUNDARY: The above workflow is complete. New requests are independent - only include actions explicitly requested.]',
              isNew: false,
            },
          ]);
        }
      }

      // Refresh frontend state after MCP tool execution
      if (executedTools.length > 0) {
        try {
          await Promise.all([refreshSignals(), refreshCases()]);
        } catch (refreshError) {
          console.warn('Failed to refresh state after tool execution:', refreshError);
        }
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
  }, [pendingPlan, messages, signals, cases, users, organizations, addresses, people, lastCreatedSignalId, executeTool, addLogEntry, updateLogEntry, getSignalCountForCase, getUserFullName, resolveStepReferences, refreshSignals, refreshCases]);

  const handleRejectPlan = useCallback((feedback: string) => {
    if (!feedback.trim()) return;

    // Create a user message with the feedback
    const userMessage: Message = {
      id: generateMessageId(),
      role: 'user',
      content: `Please revise the plan: ${feedback}`,
      isNew: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setPendingPlan(null);
    setAgentPhase('planning');
    setIsLoading(true);

    // Clear pending cases and step outputs
    pendingCasesRef.current.clear();
    stepOutputsRef.current.clear();

    // Trigger API call with the feedback
    (async () => {
      try {
        // Fetch fresh signals
        let freshSignals = filteredSignals;
        try {
          const signalsResponse = await fetch('/api/signals');
          if (signalsResponse.ok) {
            const fetchedSignals: Signal[] = await signalsResponse.json();
            freshSignals = fetchedSignals.sort((a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          }
        } catch (error) {
          console.error('Failed to refresh signals:', error);
        }

        const signalData = freshSignals.map((s) => ({
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

        const caseData = cases.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          status: c.status,
          ownerId: c.ownerId,
          ownerName: c.ownerName,
          signalCount: getSignalCountForCase(c.id),
          tags: c.tags,
          practitioners: (c.practitioners || []).map(p => ({ userId: p.userId, userName: p.userName })),
          sharedWith: (c.sharedWith || []).map(s => ({ userId: s.userId, userName: s.userName, accessLevel: s.accessLevel })),
          organizations: (c.organizations || []).map(o => ({ id: o.id, name: o.name })),
          peopleInvolved: (c.peopleInvolved || []).map(p => ({ id: p.id, firstName: p.firstName, surname: p.surname })),
        }));

        const teamMembersData = users.map((u) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          title: u.title,
          role: u.role,
          ownedCaseCount: cases.filter((c) => c.ownerId === u.id).length,
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

        // Build conversation history including the feedback
        const conversationHistory = messages
          .filter((m) => !m.isNew || m.role === 'user')
          .map((m) => ({ role: m.role, content: m.content }));
        conversationHistory.push({ role: 'user', content: `Please revise the plan: ${feedback}` });

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: conversationHistory,
            signals: signalData,
            cases: caseData,
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

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';
        let finalResponse = '';
        const executedTools: string[] = [];
        let currentStep = 0;

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
                    if (event.tool === 'plan_proposal') {
                      addLogEntry(createLogEntry('plan', `Planning: ${event.tool}`, { status: 'success', toolName: event.tool }));
                      break;
                    }
                    currentStep++;
                    const resolvedInput = resolveStepReferences(event.input, stepOutputsRef.current);
                    const toolCallEntry = createLogEntry('tool_call', `Calling ${event.tool}...`, { status: 'pending', toolName: event.tool, toolInput: resolvedInput });
                    addLogEntry(toolCallEntry);
                    const result = await executeTool(event.tool, resolvedInput);
                    executedTools.push(`${event.tool}: ${result.message}`);
                    if (result.output) {
                      stepOutputsRef.current.set(currentStep, result.output);
                    }
                    updateLogEntry(toolCallEntry.id, { status: 'success' });
                    addLogEntry(createLogEntry('tool_result', result.message, { status: 'success', toolName: event.tool }));
                    break;

                  case 'tool_result':
                    if (event.tool === 'summarize_attachments') {
                      addLogEntry(createLogEntry('tool_result', event.result.substring(0, 100) + '...', { status: 'success', toolName: event.tool }));
                    }
                    break;

                  case 'clarification':
                    setPendingClarification({
                      summary: event.summary,
                      questions: event.questions,
                    });
                    addLogEntry(createLogEntry('clarification', `Clarification needed: ${event.summary}`, { clarificationData: event as ClarificationData }));
                    setAgentPhase('clarifying');
                    setIsLoading(false);
                    break;

                  case 'plan_proposal':
                    setPendingPlan(event as PlanData);
                    addLogEntry(createLogEntry('plan', `Plan: ${event.summary}`, { planData: event as PlanData }));
                    setAgentPhase('awaiting_approval');
                    setIsLoading(false);
                    break;

                  case 'response':
                    finalResponse = event.text;
                    if (event.awaitingApproval) {
                      break;
                    }
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

          if (finalResponse.includes('completed successfully') || finalResponse.startsWith('Done!')) {
            setMessages((prev) => [
              ...prev,
              {
                id: generateMessageId(),
                role: 'assistant',
                content: '[WORKFLOW_BOUNDARY: The above workflow is complete. New requests are independent - only include actions explicitly requested.]',
                isNew: false,
              },
            ]);
          }
        }
      } catch (error) {
        console.error('Revision request error:', error);
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
    })();
  }, [messages, filteredSignals, cases, users, organizations, addresses, people, lastCreatedSignalId, executeTool, addLogEntry, updateLogEntry, getSignalCountForCase, getUserFullName, resolveStepReferences]);

  const handleClarificationSubmit = useCallback(async (answers: Record<string, string | string[]>) => {
    if (!pendingClarification) return;

    // Build answer message from user responses
    const answerText = pendingClarification.questions.map(q => {
      const answer = answers[q.id];
      const answerStr = Array.isArray(answer) ? answer.join(', ') : answer;
      // Use fieldName if available for better recognition by Claude
      const fieldLabel = q.fieldName || q.question.replace('?', '');
      return `- ${fieldLabel}: ${answerStr}`;
    }).join('\n');

    const userMessage: Message = {
      id: generateMessageId(),
      role: 'user',
      content: `Here are the details:\n${answerText}`,
      isNew: true,
    };

    setMessages(prev => [...prev, userMessage]);
    setPendingClarification(null);
    setIsLoading(true);
    setAgentPhase('planning');

    // Clear clarification log entries
    setLogEntries(prev => prev.filter(e => e.type !== 'clarification'));

    // Continue with the conversation
    try {
      // Fetch fresh signals
      let freshSignals = filteredSignals;
      try {
        const signalsResponse = await fetch('/api/signals');
        if (signalsResponse.ok) {
          const fetchedSignals: Signal[] = await signalsResponse.json();
          freshSignals = fetchedSignals.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
      } catch (error) {
        console.error('Failed to refresh signals:', error);
      }

      const signalData = freshSignals.map((s) => ({
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

      const caseData = cases.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        status: c.status,
        ownerId: c.ownerId,
        ownerName: c.ownerName,
        signalCount: getSignalCountForCase(c.id),
        tags: c.tags,
        practitioners: (c.practitioners || []).map(p => ({ userId: p.userId, userName: p.userName })),
        sharedWith: (c.sharedWith || []).map(s => ({ userId: s.userId, userName: s.userName, accessLevel: s.accessLevel })),
        organizations: (c.organizations || []).map(o => ({ id: o.id, name: o.name })),
        peopleInvolved: (c.peopleInvolved || []).map(p => ({ id: p.id, firstName: p.firstName, surname: p.surname })),
      }));

      const teamMembersData = users.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        title: u.title,
        role: u.role,
        ownedCaseCount: cases.filter((c) => c.ownerId === u.id).length,
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

      // Build conversation history including the clarification answers
      const conversationHistory = messages
        .filter((m) => !m.isNew || m.role === 'user')
        .map((m) => ({ role: m.role, content: m.content }));
      conversationHistory.push({ role: 'user', content: `Here are the details:\n${answerText}` });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          signals: signalData,
          cases: caseData,
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

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let finalResponse = '';
      const executedTools: string[] = [];
      let currentStep = 0;

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
                  if (event.tool === 'plan_proposal') {
                    addLogEntry(createLogEntry('plan', `Planning: ${event.tool}`, { status: 'success', toolName: event.tool }));
                    break;
                  }
                  currentStep++;
                  const resolvedInput = resolveStepReferences(event.input, stepOutputsRef.current);
                  const toolCallEntry = createLogEntry('tool_call', `Calling ${event.tool}...`, { status: 'pending', toolName: event.tool, toolInput: resolvedInput });
                  addLogEntry(toolCallEntry);
                  const result = await executeTool(event.tool, resolvedInput);
                  executedTools.push(`${event.tool}: ${result.message}`);
                  if (result.output) {
                    stepOutputsRef.current.set(currentStep, result.output);
                  }
                  updateLogEntry(toolCallEntry.id, { status: 'success' });
                  addLogEntry(createLogEntry('tool_result', result.message, { status: 'success', toolName: event.tool }));
                  break;

                case 'tool_result':
                  // Server-side tool result (MCP executed tools)
                  if (event.tool) {
                    executedTools.push(`${event.tool}: executed`);
                    addLogEntry(createLogEntry('tool_result',
                      typeof event.result === 'string'
                        ? event.result.substring(0, 100) + (event.result.length > 100 ? '...' : '')
                        : `${event.tool} completed`,
                      { status: 'success', toolName: event.tool }
                    ));
                  }
                  break;

                case 'clarification':
                  setPendingClarification({
                    summary: event.summary,
                    questions: event.questions,
                  });
                  addLogEntry(createLogEntry('clarification', `Clarification needed: ${event.summary}`, { clarificationData: event as ClarificationData }));
                  setAgentPhase('clarifying');
                  setIsLoading(false);
                  break; // Continue processing events (not return)

                case 'plan_proposal':
                  setPendingPlan(event as PlanData);
                  addLogEntry(createLogEntry('plan', `Plan: ${event.summary}`, { planData: event as PlanData }));
                  setAgentPhase('awaiting_approval'); // Explicitly set phase
                  setIsLoading(false);
                  break; // Continue processing events (not return)

                case 'response':
                  finalResponse = event.text;
                  if (event.awaitingApproval) {
                    break; // Changed from return - continue processing events
                  }
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

        if (finalResponse.includes('completed successfully') || finalResponse.startsWith('Done!')) {
          setMessages((prev) => [
            ...prev,
            {
              id: generateMessageId(),
              role: 'assistant',
              content: '[WORKFLOW_BOUNDARY: The above workflow is complete. New requests are independent - only include actions explicitly requested.]',
              isNew: false,
            },
          ]);
        }
      }

      // Refresh frontend state after MCP tool execution
      if (executedTools.length > 0) {
        try {
          await Promise.all([refreshSignals(), refreshCases()]);
        } catch (refreshError) {
          console.warn('Failed to refresh state after tool execution:', refreshError);
        }
      }
    } catch (error) {
      console.error('Clarification submission error:', error);
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
  }, [pendingClarification, messages, filteredSignals, cases, users, organizations, addresses, people, lastCreatedSignalId, executeTool, addLogEntry, updateLogEntry, getSignalCountForCase, getUserFullName, resolveStepReferences, refreshSignals, refreshCases]);

  const handleClarificationCancel = useCallback(() => {
    setPendingClarification(null);
    setAgentPhase('idle');
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(() => {
          // When agent is active, split messages to show current turn below phase stepper
          // Current turn = last user message + any assistant response
          const lastUserIndex = agentPhase !== 'idle'
            ? messages.findLastIndex(m => m.role === 'user')
            : -1;

          // Messages before the current turn (historical conversation)
          const messagesAbovePhase = lastUserIndex >= 0
            ? messages.slice(0, lastUserIndex)
            : messages;

          // Current turn messages
          const lastUserMessage = lastUserIndex >= 0
            ? messages[lastUserIndex]
            : null;

          // Find assistant message after the last user message (if any)
          const lastAssistantMessage = lastUserIndex >= 0
            ? messages.slice(lastUserIndex + 1).find(m => m.role === 'assistant') || null
            : null;

          const renderMessage = (message: Message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'rounded-2xl px-4 py-3 text-sm max-w-[85%]',
                  message.role === 'user'
                    ? 'bg-claude-beige text-foreground'
                    : 'bg-transparent text-foreground'
                )}
              >
                <div className="prose prose-sm max-w-none text-inherit [&_*]:text-inherit [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm [&>h1]:font-semibold [&>h2]:font-semibold [&>h3]:font-medium [&>h1]:mt-2 [&>h1]:mb-1 [&>h2]:mt-2 [&>h2]:mb-1 [&>h3]:mt-1 [&>h3]:mb-1">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          );

          return (
            <>
              {/* Render historical messages (or all messages when idle) */}
              {(agentPhase !== 'idle' ? messagesAbovePhase : messages).map(renderMessage)}

              {/* Current turn: user message, then phase stepper, then logs, then assistant response */}
              {agentPhase !== 'idle' && (
                <>
                  {/* Last user message (the one being processed) */}
                  {lastUserMessage && renderMessage(lastUserMessage)}

                  {/* Phase Stepper */}
                  <div className="flex justify-start">
                    <PhaseStepper
                      currentPhase={mapToConversationPhase(agentPhase)}
                      className="inline-flex"
                    />
                  </div>

                  {/* Agent Log - shows tool calls and results */}
                  {logEntries.length > 0 && (
                    <div className="flex justify-start">
                      <AgentLog
                        entries={logEntries}
                        currentPhase={agentPhase}
                        className="max-w-[90%]"
                        defaultExpanded={true}
                      />
                    </div>
                  )}

                  {/* Latest assistant message (response being generated) */}
                  {lastAssistantMessage && renderMessage(lastAssistantMessage)}
                </>
              )}
            </>
          );
        })()}

        {/* Agent Log - shows tool calls and results when idle */}
        {agentPhase === 'idle' && logEntries.length > 0 && (
          <div className="flex justify-start">
            <AgentLog
              entries={logEntries}
              currentPhase={agentPhase}
              className="max-w-[90%]"
              defaultExpanded={true}
            />
          </div>
        )}

        {/* Clarification Display */}
        {pendingClarification && agentPhase === 'clarifying' && (
          <div className="mx-auto max-w-[90%]">
            <ClarificationDisplay
              data={pendingClarification}
              onSubmit={handleClarificationSubmit}
              onCancel={handleClarificationCancel}
            />
          </div>
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
            <div className="bg-claude-beige rounded-2xl px-4 py-3">
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
      <div className="border-t border-border p-3 shrink-0 space-y-2">
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
            placeholder="Reply to Atlas AI..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm bg-muted/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-10 w-10 rounded-full bg-claude-coral hover:bg-claude-coral-hover text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
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
