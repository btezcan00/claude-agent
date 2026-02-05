'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { useSignals } from '@/context/signal-context';
import { useCases } from '@/context/case-context';
import { useUsers } from '@/context/user-context';
import { useOrganizations } from '@/context/organization-context';
import { useAddresses } from '@/context/address-context';
import { usePeople } from '@/context/person-context';
import { useUIHighlight } from '@/context/ui-highlight-context';
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Track cases created during the current execution cycle to handle race conditions
  // when subsequent tools reference cases before React state updates
  const pendingCasesRef = useRef<Map<string, Case>>(new Map());
  // Track step outputs for resolving $stepN.fieldName references
  const stepOutputsRef = useRef<Map<number, Record<string, unknown>>>(new Map());
  // Track latest messages for access in async callbacks (avoids stale closure issues)
  const messagesRef = useRef<Message[]>([]);

  const { signals, filteredSignals, createSignal, updateSignal, getSignalById, addNote, deleteSignal, addSignalToCase, signalStats } = useSignals();
  const { cases, getSignalCountForCase, updateApplicationData, completeApplication, assignCaseOwner, updateCase, updateCaseStatus, updateLocation, addTag, removeTag, createCase, deleteCase, addPractitioner, shareCase, addOrganizationToCase, addAddressToCase, addPersonToCase, addFinding, addLetter, updateLetter, addCommunication, addChatMessage, addVisualization, addActivity } = useCases();
  const { users, getUserFullName } = useUsers();
  const { organizations } = useOrganizations();
  const { addresses } = useAddresses();
  const { people } = usePeople();
  const { triggerHighlight, navigateAndHighlight } = useUIHighlight();

  // Create a map of case IDs to names for display in plan proposals
  const casesMap = useMemo(() => {
    const map = new Map<string, string>();
    cases.forEach(c => map.set(c.id, c.name));
    return map;
  }, [cases]);

  // Initialize greeting message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: "Hallo! Ik ben Atlas AI, je AI-assistent. Ik kan je helpen met het beheren van meldingen en dossiers - vertel me gewoon wat je nodig hebt en ik regel het.",
          isNew: true,
        },
      ]);
    }
  }, [messages.length]);

  // Sync messagesRef with messages state for access in async callbacks
  // This avoids stale closure issues when handlers reference messages
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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
        const response = await fetch(`/api/dossiers/${identifier}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('Failed to fetch case from API:', error);
      }
    }

    return undefined;
  }, [cases]);

  // Helper function to filter messages after the last workflow boundary
  // This ensures new requests don't include completed workflow context
  const getMessagesAfterLastBoundary = useCallback((msgs: Message[]): Message[] => {
    // Find the index of the last WORKFLOW_BOUNDARY message
    let lastBoundaryIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].content.includes('[WORKFLOW_BOUNDARY:')) {
        lastBoundaryIndex = i;
        break;
      }
    }

    // If no boundary found, return all messages
    if (lastBoundaryIndex === -1) {
      return msgs;
    }

    // Return only messages after the boundary (excluding the boundary itself)
    return msgs.slice(lastBoundaryIndex + 1);
  }, []);

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

  // Auto-resize textarea up to 10 lines
  const adjustTextareaHeight = useCallback(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Calculate line height (approximately 20px for text-sm)
    const lineHeight = 20;
    const maxLines = 10;
    const maxHeight = lineHeight * maxLines;

    // Set the height to scrollHeight, but cap at maxHeight
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, logEntries]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Adjust textarea height when input changes (including when cleared after send)
  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

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
        case 'maak_melding': {
          const timeOfObservation = isValidDate(input.tijdVanWaarneming)
            ? input.tijdVanWaarneming as string
            : new Date().toISOString();

          const signalData = {
            description: input.beschrijving,
            types: input.soorten,
            placeOfObservation: input.plaatsVanWaarneming,
            receivedBy: input.ontvangenDoor,
            timeOfObservation,
          } as CreateSignalInput;
          const newSignal = await createSignal(signalData);
          setLastCreatedSignalId(newSignal.id);
          navigateAndHighlight('signal', newSignal.id);
          return {
            message: `Signal created: ${newSignal.signalNumber}`,
            output: { signalId: newSignal.id, signalNumber: newSignal.signalNumber }
          };
        }

        case 'bewerk_melding': {
          const { melding_id, beschrijving, soorten, plaatsVanWaarneming } = input;
          const targetSignal = findSignal(melding_id as string);
          if (targetSignal) {
            const updates: UpdateSignalInput = {};
            if (beschrijving) updates.description = beschrijving as string;
            if (soorten) updates.types = soorten as SignalType[];
            if (plaatsVanWaarneming) updates.placeOfObservation = plaatsVanWaarneming as string;
            await updateSignal(targetSignal.id, updates);
            navigateAndHighlight('signal', targetSignal.id);
            return { message: `Signal ${targetSignal.signalNumber} updated` };
          }
          return { message: `Signal ${melding_id} not found` };
        }

        case 'voeg_notitie_toe': {
          const { melding_id, inhoud, is_prive } = input;
          const targetSignal = findSignal(melding_id as string);
          if (targetSignal) {
            await addNote(targetSignal.id, inhoud as string, is_prive as boolean || false);
            navigateAndHighlight('signal', targetSignal.id);
            return { message: `Note added to ${targetSignal.signalNumber}` };
          }
          return { message: `Signal ${melding_id} not found` };
        }

        case 'verwijder_melding': {
          const { melding_id } = input;
          const targetSignal = findSignal(melding_id as string);
          if (targetSignal) {
            await deleteSignal(targetSignal.id);
            return { message: `Signal ${targetSignal.signalNumber} deleted` };
          }
          return { message: `Signal ${melding_id} not found` };
        }

        case 'voeg_melding_toe_aan_dossier': {
          const { melding_id, dossier_id } = input;
          const signal = findSignal(melding_id as string);
          if (!signal) {
            return { message: `Signal "${melding_id}" not found` };
          }
          const caseItem = findCase(dossier_id as string);
          if (!caseItem) {
            return { message: `Dossier "${dossier_id}" niet gevonden` };
          }
          await addSignalToCase(signal.id, caseItem.id);
          // Navigate to signals page since signal is the primary entity being modified
          // Both entities are still highlighted if user navigates to cases page within highlight duration
          navigateAndHighlight('signal', signal.id);
          triggerHighlight('case', caseItem.id);
          return { message: `Melding ${signal.signalNumber} toegevoegd aan dossier "${caseItem.name}"` };
        }

        case 'maak_dossier': {
          const randomColors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'];
          const randomColor = randomColors[Math.floor(Math.random() * randomColors.length)];

          const rawSignalIds = input.meldingIds as string[] | undefined;
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
            name: (input.naam as string) || 'Nieuw dossier',
            description: (input.beschrijving as string) || '',
            color: (input.kleur as string) || randomColor,
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
          navigateAndHighlight('case', newCase.id);
          return {
            message: `Dossier "${newCase.name}" aangemaakt met ID: ${newCase.id}`,
            output: { caseId: newCase.id, caseName: newCase.name }
          };
        }

        case 'bewerk_dossier': {
          const { dossier_id, naam, beschrijving, status, locatie, kleur, tags } = input;
          const caseItem = findCase(dossier_id as string);
          if (caseItem) {
            const updates: Record<string, unknown> = {};
            if (naam) updates.name = naam;
            if (beschrijving) updates.description = beschrijving;
            if (kleur) updates.color = kleur;
            if (Object.keys(updates).length > 0) {
              await updateCase(caseItem.id, updates as { name?: string; description?: string; color?: string });
            }
            if (status) {
              await updateCaseStatus(caseItem.id, status as CaseStatus);
            }
            if (locatie) {
              await updateLocation(caseItem.id, locatie as string);
            }
            if (tags && Array.isArray(tags)) {
              for (const tag of caseItem.tags) {
                await removeTag(caseItem.id, tag);
              }
              for (const tag of (tags as string[])) {
                await addTag(caseItem.id, tag);
              }
            }
            navigateAndHighlight('case', caseItem.id);
            return { message: `Dossier "${naam || caseItem.name}" bijgewerkt` };
          }
          return { message: `Dossier "${dossier_id}" niet gevonden` };
        }

        case 'verwijder_dossier': {
          const { dossier_id } = input;
          const caseItem = findCase(dossier_id as string);
          if (caseItem) {
            await deleteCase(caseItem.id);
            return { message: `Dossier "${caseItem.name}" verwijderd` };
          }
          return { message: `Dossier "${dossier_id}" niet gevonden` };
        }

        case 'wijs_dossier_eigenaar_toe': {
          const { dossier_id, gebruiker_id, gebruiker_naam } = input;
          const caseItem = findCase(dossier_id as string);
          if (caseItem) {
            await assignCaseOwner(caseItem.id, gebruiker_id as string, gebruiker_naam as string);
            navigateAndHighlight('case', caseItem.id);
            return { message: `${gebruiker_naam} toegewezen als eigenaar van "${caseItem.name}"` };
          }
          return { message: `Dossier "${dossier_id}" niet gevonden` };
        }

        case 'voeg_dossier_behandelaar_toe': {
          const { dossier_id, gebruiker_id, gebruiker_naam } = input;
          const caseItem = findCase(dossier_id as string);
          if (caseItem) {
            await addPractitioner(caseItem.id, gebruiker_id as string, gebruiker_naam as string);
            navigateAndHighlight('case', caseItem.id);
            return { message: `${gebruiker_naam} toegevoegd als behandelaar aan "${caseItem.name}"` };
          }
          return { message: `Dossier "${dossier_id}" niet gevonden` };
        }

        case 'deel_dossier': {
          const { dossier_id, gebruiker_id, gebruiker_naam, toegangsniveau } = input;
          const caseItem = findCase(dossier_id as string);
          if (caseItem) {
            await shareCase(caseItem.id, gebruiker_id as string, gebruiker_naam as string, (toegangsniveau as 'view' | 'edit' | 'admin') || 'view');
            navigateAndHighlight('case', caseItem.id);
            return { message: `"${caseItem.name}" gedeeld met ${gebruiker_naam}` };
          }
          return { message: `Dossier "${dossier_id}" niet gevonden` };
        }

        case 'voltooi_bibob_aanvraag': {
          const { dossier_id, toelichting, criteria } = input;
          // Use async version to handle race condition when case was just created
          const caseItem = await findCaseAsync(dossier_id as string);
          if (caseItem) {
            const incomingCriteria = criteria as Array<{ id: string; isMet: boolean; toelichting: string }>;
            const fullCriteria: ApplicationCriterion[] = APPLICATION_CRITERIA.map(baseCrit => {
              const incoming = incomingCriteria.find(c => c.id === baseCrit.id);
              return {
                ...baseCrit,
                isMet: incoming?.isMet ?? false,
                explanation: incoming?.toelichting ?? '',
              };
            });
            await updateApplicationData(caseItem.id, { explanation: toelichting as string, criteria: fullCriteria });
            await completeApplication(caseItem.id);
            navigateAndHighlight('case', caseItem.id);
            return { message: `Bibob-aanvraag voltooid voor "${caseItem.name}"` };
          }
          return { message: `Dossier "${dossier_id}" niet gevonden` };
        }

        case 'sla_bibob_aanvraag_concept_op': {
          const { dossier_id, toelichting, criteria } = input;
          // Use async version to handle race condition when case was just created
          const caseItem = await findCaseAsync(dossier_id as string);
          if (caseItem) {
            const updatePayload: { explanation?: string; criteria?: ApplicationCriterion[] } = {};
            if (toelichting) updatePayload.explanation = toelichting as string;
            if (criteria) {
              const incomingCriteria = criteria as Array<{ id: string; isMet: boolean; toelichting: string }>;
              updatePayload.criteria = APPLICATION_CRITERIA.map(baseCrit => {
                const incoming = incomingCriteria.find(c => c.id === baseCrit.id);
                return {
                  ...baseCrit,
                  isMet: incoming?.isMet ?? false,
                  explanation: incoming?.toelichting ?? '',
                };
              });
            }
            await updateApplicationData(caseItem.id, updatePayload);
            navigateAndHighlight('case', caseItem.id);
            return { message: `Concept opgeslagen voor "${caseItem.name}"` };
          }
          return { message: `Dossier "${dossier_id}" niet gevonden` };
        }

        case 'voeg_dossier_organisatie_toe': {
          const { dossier_id, naam: orgName, kvk_nummer, adres, type } = input;
          const caseItem = findCase(dossier_id as string);
          if (caseItem) {
            const org = {
              id: `org-${Date.now()}`,
              name: orgName as string,
              kvkNumber: (kvk_nummer as string) || '',
              address: (adres as string) || '',
              type: (type as string) || 'company',
              createdAt: new Date().toISOString(),
            };
            await addOrganizationToCase(caseItem.id, org);
            navigateAndHighlight('case', caseItem.id);
            return { message: `Organisatie "${orgName}" toegevoegd aan "${caseItem.name}"` };
          }
          return { message: `Dossier "${dossier_id}" niet gevonden` };
        }

        case 'voeg_dossier_adres_toe': {
          const { dossier_id, straat, plaats, postcode, land, beschrijving } = input;
          const caseItem = findCase(dossier_id as string);
          if (caseItem) {
            const fullAddress = `${straat}, ${postcode ? postcode + ' ' : ''}${plaats}, ${land || 'Netherlands'}`;
            const addr = {
              id: `addr-${Date.now()}`,
              street: fullAddress,
              buildingType: 'Commercial',
              isActive: true,
              description: (beschrijving as string) || '',
              createdAt: new Date().toISOString(),
            };
            await addAddressToCase(caseItem.id, addr);
            navigateAndHighlight('case', caseItem.id);
            return { message: `Adres "${straat}, ${plaats}" toegevoegd aan "${caseItem.name}"` };
          }
          return { message: `Dossier "${dossier_id}" niet gevonden` };
        }

        case 'voeg_dossier_persoon_toe': {
          const { dossier_id, voornaam, achternaam, geboortedatum, rol, notities } = input;
          const caseItem = findCase(dossier_id as string);
          if (caseItem) {
            const person = {
              id: `person-${Date.now()}`,
              firstName: voornaam as string,
              surname: achternaam as string,
              dateOfBirth: (geboortedatum as string) || '',
              address: '',
              description: `${(rol as string) || ''} ${(notities as string) || ''}`.trim() || '',
              createdAt: new Date().toISOString(),
            };
            await addPersonToCase(caseItem.id, person);
            navigateAndHighlight('case', caseItem.id);
            return { message: `"${voornaam} ${achternaam}" toegevoegd aan "${caseItem.name}"` };
          }
          return { message: `Dossier "${dossier_id}" niet gevonden` };
        }

        case 'voeg_dossier_bevinding_toe': {
          const { dossier_id, label, ernst, toegewezen_aan } = input;
          const caseItem = findCase(dossier_id as string);
          if (caseItem) {
            const finding = {
              date: new Date().toISOString(),
              phase: caseItem.status,
              label: label as string,
              description: '',
              isCompleted: false,
              severity: (ernst as 'none' | 'low' | 'serious' | 'critical') || 'none',
              assignedTo: (toegewezen_aan as string) || '',
            };
            await addFinding(caseItem.id, finding);
            navigateAndHighlight('case', caseItem.id);
            return { message: `Bevinding "${label}" toegevoegd aan "${caseItem.name}"` };
          }
          return { message: `Dossier "${dossier_id}" niet gevonden` };
        }

        case 'voeg_dossier_brief_toe': {
          const { dossier_id, brief_naam, sjabloon, datum, gemeente_provincie,
            referentienummer, ontvanger_naam, ontvanger_adres, ontvanger_postcode,
            onderwerp, kennisgeving_inhoud, afzender_naam, afzender_titel,
            aanvrager_naam, aanvrager_telefoon, ontvanger_email,
            wettelijke_bepalingen, boete_informatie, vergunning_soorten, aanvullende_opmerkingen,
            ...otherFields } = input;
          const caseItem = findCase(dossier_id as string);
          if (caseItem) {
            const templateType = (sjabloon as string) || 'lbb_notification';
            const letterName = (brief_naam as string) || `Letter - ${new Date().toLocaleDateString()}`;
            const letter = {
              name: letterName,
              template: templateType,
              description: '',
              tags: [] as string[],
            };
            const newLetter = await addLetter(caseItem.id, letter);
            if (newLetter) {
              const fieldData: Record<string, string | boolean> = {
                date: (datum as string) || '',
                municipal_province: (gemeente_provincie as string) || '',
                reference_number: (referentienummer as string) || '',
                recipient_name: (ontvanger_naam as string) || '',
                recipient_address: (ontvanger_adres as string) || '',
                recipient_postal_code: (ontvanger_postcode as string) || '',
                subject: (onderwerp as string) || '',
                notification_content: (kennisgeving_inhoud as string) || '',
                sender_name: (afzender_naam as string) || '',
                sender_title: (afzender_titel as string) || '',
                applicant_name: (aanvrager_naam as string) || '',
                applicant_phone: (aanvrager_telefoon as string) || '',
                recipient_email: (ontvanger_email as string) || '',
                legal_provisions: (wettelijke_bepalingen as string[] || []).join(','),
                fine_information: (boete_informatie as string[] || []).join(','),
                license_types: (vergunning_soorten as string[] || []).join(','),
                additional_remarks: (aanvullende_opmerkingen as string) || '',
                ...otherFields as Record<string, string | boolean>,
              };
              await updateLetter(caseItem.id, newLetter.id, { fieldData });
            }
            navigateAndHighlight('case', caseItem.id);
            return { message: `Brief "${letterName}" toegevoegd aan "${caseItem.name}"` };
          }
          return { message: `Dossier "${dossier_id}" niet gevonden` };
        }

        case 'voeg_dossier_communicatie_toe': {
          const { dossier_id, label, beschrijving: commDesc, datum } = input;
          const caseItem = findCase(dossier_id as string);
          if (caseItem) {
            const communication = {
              date: (datum as string) || new Date().toISOString(),
              phase: caseItem.status,
              label: label as string,
              description: (commDesc as string) || '',
            };
            await addCommunication(caseItem.id, communication);
            navigateAndHighlight('case', caseItem.id);
            return { message: `Communicatie "${label}" toegevoegd aan "${caseItem.name}"` };
          }
          return { message: `Dossier "${dossier_id}" niet gevonden` };
        }

        case 'voeg_dossier_visualisatie_toe': {
          const { dossier_id, label, beschrijving: vizDesc } = input;
          const caseItem = findCase(dossier_id as string);
          if (caseItem) {
            const visualization = {
              date: new Date().toISOString(),
              phase: caseItem.status,
              label: label as string,
              description: (vizDesc as string) || '',
            };
            await addVisualization(caseItem.id, visualization);
            navigateAndHighlight('case', caseItem.id);
            return { message: `Visualisatie "${label}" toegevoegd aan "${caseItem.name}"` };
          }
          return { message: `Dossier "${dossier_id}" niet gevonden` };
        }

        case 'voeg_dossier_activiteit_toe': {
          const { dossier_id, label, beschrijving: actDesc, toegewezen_aan, datum } = input;
          const caseItem = findCase(dossier_id as string);
          if (caseItem) {
            const activity = {
              date: (datum as string) || new Date().toISOString(),
              phase: caseItem.status,
              label: label as string,
              description: (actDesc as string) || '',
              assignedTo: (toegewezen_aan as string) || '',
            };
            await addActivity(caseItem.id, activity);
            navigateAndHighlight('case', caseItem.id);
            return { message: `Activiteit "${label}" toegevoegd aan "${caseItem.name}"` };
          }
          return { message: `Dossier "${dossier_id}" niet gevonden` };
        }

        case 'haal_dossier_berichten_op': {
          const { dossier_id, contact_id, contact_naam, contact_type, limiet: msgLimit } = input;
          const caseItem = findCase(dossier_id as string);
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
              return { message: `Geen berichten met ${contact_naam}` };
            }
            return { message: `Berichten met ${contact_naam}: ${msgs.map(m => `${m.senderName}: ${m.content}`).join('; ')}` };
          }
          return { message: `Dossier "${dossier_id}" niet gevonden` };
        }

        case 'verstuur_dossier_bericht': {
          const { dossier_id, contact_id, contact_naam, contact_type, bericht } = input;
          const caseItem = findCase(dossier_id as string);
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
              content: bericht as string,
            };
            await addChatMessage(caseItem.id, chatMessage);
            navigateAndHighlight('case', caseItem.id);
            return { message: `Bericht verzonden naar ${contact_naam}` };
          }
          return { message: `Dossier "${dossier_id}" niet gevonden` };
        }

        // Read-only tools return data summaries
        case 'vat_meldingen_samen': {
          const signalId = input.melding_id as string | undefined;
          if (signalId) {
            const s = findSignal(signalId);
            if (s) {
              return { message: `${s.signalNumber}: ${s.description.substring(0, 100)}... at ${s.placeOfObservation}` };
            }
            return { message: `Signal ${signalId} not found` };
          }
          return { message: `${signals.length} signals in system` };
        }

        case 'vat_dossier_samen': {
          const caseId = input.dossier_id as string | undefined;
          if (caseId) {
            const c = findCase(caseId);
            if (c) {
              const signalCount = getSignalCountForCase(c.id);
              return {
                message: `${c.name}: ${c.description.substring(0, 80)}... | Status: ${c.status} | Locatie: ${c.location || 'N/B'} | Meldingen: ${signalCount} | Behandelaars: ${c.practitioners?.length || 0} | Organisaties: ${c.organizations?.length || 0}`
              };
            }
            return { message: `Dossier "${caseId}" niet gevonden` };
          }
          return { message: `${cases.length} dossiers: ${cases.map(c => `${c.name} (${c.status})`).join('; ')}` };
        }

        case 'toon_dossiers':
          return {
            message: cases.length > 0
              ? cases.map(c => `${c.name} (${c.status}, ${getSignalCountForCase(c.id)} meldingen)`).join('; ')
              : 'Geen dossiers'
          };

        case 'toon_teamleden':
          return { message: users.map(u => `${getUserFullName(u)} (${u.title})`).join('; ') };

        case 'haal_melding_statistieken_op':
          return { message: `Totaal meldingen: ${signalStats.total}` };

        case 'haal_dossier_statistieken_op':
          return { message: `Totaal dossiers: ${cases.length}` };

        case 'zoek_meldingen': {
          let results = [...signals];
          const { zoekterm, type, ontvangenDoor } = input;
          if (zoekterm) {
            const kw = (zoekterm as string).toLowerCase();
            results = results.filter(s =>
              s.description.toLowerCase().includes(kw) ||
              s.signalNumber.toLowerCase().includes(kw) ||
              s.placeOfObservation.toLowerCase().includes(kw)
            );
          }
          if (type) results = results.filter(s => s.types.includes(type as SignalType));
          if (ontvangenDoor) results = results.filter(s => s.receivedBy === ontvangenDoor);
          return {
            message: results.length > 0
              ? `${results.length} gevonden: ${results.map(s => s.signalNumber).join(', ')}`
              : 'Geen meldingen gevonden'
          };
        }

        case 'haal_melding_activiteit_op': {
          const s = findSignal(input.melding_id as string);
          if (s) {
            const activities = s.activities.slice(0, 5);
            return {
              message: activities.length > 0
                ? activities.map(a => `${a.details} door ${a.userName}`).join('; ')
                : 'Geen activiteit'
            };
          }
          return { message: 'Melding niet gevonden' };
        }

        case 'haal_melding_notities_op': {
          const s = findSignal(input.melding_id as string);
          if (s) {
            return {
              message: s.notes.length > 0
                ? s.notes.map(n => `${n.authorName}: ${n.content.substring(0, 50)}`).join('; ')
                : 'Geen notities'
            };
          }
          return { message: 'Melding niet gevonden' };
        }

        case 'toon_meldingen':
          return {
            message: signals.length > 0
              ? `${signals.length} meldingen: ${signals.slice(0, 10).map(s => `${s.signalNumber} (${s.types.join(', ')})`).join('; ')}${signals.length > 10 ? '...' : ''}`
              : 'Geen meldingen'
          };

        case 'vat_bijlagen_samen': {
          const s = findSignal(input.melding_id as string);
          if (s) {
            const attachmentCount = s.attachments?.length || 0;
            if (attachmentCount === 0) {
              return { message: `Melding ${s.signalNumber} heeft geen bijlagen` };
            }
            const attachmentSummary = s.attachments?.map(a => `${a.fileName} (${a.fileType})`).join('; ') || '';
            return { message: `${attachmentCount} bijlagen voor ${s.signalNumber}: ${attachmentSummary}` };
          }
          return { message: 'Melding niet gevonden' };
        }

        default:
          return { message: `Tool ${toolName} executed` };
      }
    } catch (error) {
      console.error(`Tool ${toolName} error:`, error);
      return { message: `Error executing ${toolName}` };
    }
  }, [signals, cases, users, findSignal, findCase, findCaseAsync, createSignal, updateSignal, addNote, deleteSignal, addSignalToCase, createCase, deleteCase, updateCase, updateCaseStatus, updateLocation, addTag, removeTag, assignCaseOwner, addPractitioner, shareCase, updateApplicationData, completeApplication, addOrganizationToCase, addAddressToCase, addPersonToCase, addFinding, addLetter, updateLetter, addCommunication, addChatMessage, addVisualization, addActivity, getSignalCountForCase, getUserFullName, signalStats, triggerHighlight, navigateAndHighlight]);

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
        caseRelations: s.caseRelations?.map((cr) => ({ caseId: cr.caseId })),
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

      // Filter messages to only include those after the last workflow boundary
      const relevantMessages = getMessagesAfterLastBoundary(messagesRef.current);
      const conversationHistory = relevantMessages
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
                  // Server-side tool result (like summarize_attachments)
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
                  setIsLoading(false);
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

      // Add the final assistant message and workflow boundary atomically
      if (finalResponse) {
        // Add boundary if any tools were executed (write operations completed)
        const shouldAddBoundary = executedTools.length > 0;

        setMessages((prev) => {
          const newMessages: Message[] = [
            ...prev,
            {
              id: generateMessageId(),
              role: 'assistant',
              content: finalResponse,
              isNew: true,
            },
          ];

          if (shouldAddBoundary) {
            newMessages.push({
              id: generateMessageId(),
              role: 'assistant',
              content: '[WORKFLOW_BOUNDARY: The above workflow is complete. New requests are independent - only include actions explicitly requested.]',
              isNew: false,
            });
          }

          // Sync ref immediately so next submission sees the boundary
          messagesRef.current = newMessages;
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setAgentPhase('idle');
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          role: 'assistant',
          content: 'Sorry, er is een fout opgetreden. Probeer het opnieuw.',
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
        caseRelations: s.caseRelations?.map((cr) => ({ caseId: cr.caseId })),
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

      // Build conversation history including the approval (filter after last boundary)
      const relevantMessages = getMessagesAfterLastBoundary(messagesRef.current);
      const conversationHistory = relevantMessages
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
        const shouldAddBoundary = executedTools.length > 0;

        setMessages((prev) => {
          const newMessages: Message[] = [
            ...prev,
            {
              id: generateMessageId(),
              role: 'assistant',
              content: finalResponse,
              isNew: true,
            },
          ];

          if (shouldAddBoundary) {
            newMessages.push({
              id: generateMessageId(),
              role: 'assistant',
              content: '[WORKFLOW_BOUNDARY: The above workflow is complete. New requests are independent - only include actions explicitly requested.]',
              isNew: false,
            });
          }

          // Sync ref immediately so next submission sees the boundary
          messagesRef.current = newMessages;
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Approval execution error:', error);
      setAgentPhase('idle');
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          role: 'assistant',
          content: 'Sorry, er is een fout opgetreden bij het uitvoeren van het plan. Probeer het opnieuw.',
          isNew: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [pendingPlan, messages, signals, cases, users, organizations, addresses, people, lastCreatedSignalId, executeTool, addLogEntry, updateLogEntry, getSignalCountForCase, getUserFullName, resolveStepReferences, getMessagesAfterLastBoundary]);

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
          caseRelations: s.caseRelations?.map((cr) => ({ caseId: cr.caseId })),
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

        // Build conversation history including the feedback (filter after last boundary)
        const relevantMessages = getMessagesAfterLastBoundary(messagesRef.current);
        const conversationHistory = relevantMessages
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
          const shouldAddBoundary = executedTools.length > 0;

          setMessages((prev) => {
            const newMessages: Message[] = [
              ...prev,
              {
                id: generateMessageId(),
                role: 'assistant',
                content: finalResponse,
                isNew: true,
              },
            ];

            if (shouldAddBoundary) {
              newMessages.push({
                id: generateMessageId(),
                role: 'assistant',
                content: '[WORKFLOW_BOUNDARY: The above workflow is complete. New requests are independent - only include actions explicitly requested.]',
                isNew: false,
              });
            }

            // Sync ref immediately so next submission sees the boundary
            messagesRef.current = newMessages;
            return newMessages;
          });
        }
      } catch (error) {
        console.error('Revision request error:', error);
        setAgentPhase('idle');
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            role: 'assistant',
            content: 'Sorry, er is een fout opgetreden. Probeer het opnieuw.',
            isNew: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [messages, filteredSignals, cases, users, organizations, addresses, people, lastCreatedSignalId, executeTool, addLogEntry, updateLogEntry, getSignalCountForCase, getUserFullName, resolveStepReferences, getMessagesAfterLastBoundary]);

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
        caseRelations: s.caseRelations?.map((cr) => ({ caseId: cr.caseId })),
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

      // Build conversation history including the clarification answers (filter after last boundary)
      const relevantMessages = getMessagesAfterLastBoundary(messagesRef.current);
      const conversationHistory = relevantMessages
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
        const shouldAddBoundary = executedTools.length > 0;

        setMessages((prev) => {
          const newMessages: Message[] = [
            ...prev,
            {
              id: generateMessageId(),
              role: 'assistant',
              content: finalResponse,
              isNew: true,
            },
          ];

          if (shouldAddBoundary) {
            newMessages.push({
              id: generateMessageId(),
              role: 'assistant',
              content: '[WORKFLOW_BOUNDARY: The above workflow is complete. New requests are independent - only include actions explicitly requested.]',
              isNew: false,
            });
          }

          // Sync ref immediately so next submission sees the boundary
          messagesRef.current = newMessages;
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Clarification submission error:', error);
      setAgentPhase('idle');
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          role: 'assistant',
          content: 'Sorry, er is een fout opgetreden. Probeer het opnieuw.',
          isNew: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [pendingClarification, messages, filteredSignals, cases, users, organizations, addresses, people, lastCreatedSignalId, executeTool, addLogEntry, updateLogEntry, getSignalCountForCase, getUserFullName, resolveStepReferences, getMessagesAfterLastBoundary]);

  const handleClarificationCancel = useCallback(() => {
    setPendingClarification(null);
    setAgentPhase('idle');
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
              casesMap={casesMap}
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
          className="flex items-end gap-2"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Antwoord aan Atlas AI..."
            disabled={isLoading}
            rows={1}
            className="flex-1 px-4 py-2.5 text-sm bg-muted/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 resize-none overflow-y-auto leading-5"
            style={{ minHeight: '40px', maxHeight: '200px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-10 w-10 shrink-0 rounded-full bg-claude-coral hover:bg-claude-coral-hover text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
