import type Anthropic from '@anthropic-ai/sdk';
import AnthropicBedrock from '@anthropic-ai/bedrock-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getServerCurrentUser } from '@/lib/auth-server';
import { tools, TOOL_NAMES } from './anthropic-tools';

const anthropic = new AnthropicBedrock({
  awsRegion: 'eu-central-1',
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AttachmentData {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  content?: string; // base64 encoded
  textContent?: string;
}

interface SignalData {
  id: string;
  signalNumber: string;
  description: string;
  types: string[];
  placeOfObservation: string;
  locationDescription?: string;
  timeOfObservation: string;
  receivedBy: string;
  createdAt: string;
  updatedAt: string;
  notesCount: number;
  activitiesCount: number;
  photosCount: number;
  attachments?: AttachmentData[];
  caseRelations?: { caseId: string }[];
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  role: string;
  ownedCaseCount: number;
}

interface CaseStatusDates {
  application?: string;
  research?: string;
  national_office?: string;
  decision?: string;
  archive?: string;
}

interface CasePractitioner {
  userId: string;
  userName: string;
  addedAt: string;
}

interface CaseShare {
  userId: string;
  userName: string;
  accessLevel: string;
  sharedAt: string;
  sharedBy: string;
}

interface CaseNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  isAdminNote: boolean;
}

interface CaseChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

interface ApplicationCriterion {
  id: string;
  name: string;
  label: string;
  isMet: boolean;
  explanation: string;
}

interface ApplicationData {
  explanation: string;
  criteria: ApplicationCriterion[];
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
}

interface CaseItem {
  id: string;
  date: string;
  phase: string;
  label: string;
  description: string;
  assignedTo?: string;
  source?: string;
  sourceTheme?: string;
}

interface FindingItem extends CaseItem {
  isCompleted: boolean;
  totalSteps?: number;
  completedSteps?: number;
  severity?: string;
}

interface LetterItem {
  id: string;
  name: string;
  template: string;
  description: string;
  tags: string[];
  createdBy: string;
  createdByFirstName: string;
  createdBySurname: string;
  createdAt: string;
  updatedAt: string;
  fieldData: Record<string, string | boolean>;
}

interface ActivityItem {
  id: string;
  date: string;
  phase: string;
  label: string;
  description: string;
  assignedTo?: string;
  source?: string;
  sourceTheme?: string;
  createdByName: string;
  updatedAt: string;
}

interface CaseAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  description: string;
  tags: string[];
  content?: string;
  textContent?: string;
}

interface CaseData {
  id: string;
  name: string;
  description: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string | null;
  ownerName: string | null;
  color?: string;
  icon?: string;
  status: string;
  statusDates: CaseStatusDates;
  tags: string[];
  signalTypes: string[];
  practitioners: CasePractitioner[];
  sharedWith: CaseShare[];
  location: string;
  notes: CaseNote[];
  organizations: OrganizationData[];
  addresses: AddressData[];
  peopleInvolved: PersonData[];
  letters: LetterItem[];
  findings: FindingItem[];
  attachments: CaseItem[];
  records: CaseItem[];
  communications: CaseItem[];
  suggestions: CaseItem[];
  visualizations: CaseItem[];
  activities: ActivityItem[];
  fileAttachments: CaseAttachment[];
  chatMessages: CaseChatMessage[];
  applicationData: ApplicationData;
  // Computed field (not in Case type)
  signalCount: number;
}

interface OrganizationData {
  id: string;
  name: string;
  type: string;
  address: string;
  description?: string;
  chamberOfCommerce?: string;
}

interface AddressData {
  id: string;
  street: string;
  buildingType: string;
  isActive: boolean;
  description: string;
}

interface PersonData {
  id: string;
  firstName: string;
  surname: string;
  dateOfBirth?: string;
  address: string;
  description: string;
  bsn?: string;
}

// Helper function to summarize attachments using Claude Vision
async function summarizeAttachmentsForSignal(
  signalId: string,
  signals: SignalData[]
): Promise<string> {
  // Find the signal by ID or signal number
  const targetSignal = signals.find(
    (s) =>
      s.id === signalId ||
      s.signalNumber.toLowerCase() === signalId.toLowerCase() ||
      s.signalNumber.toLowerCase().includes(signalId.toLowerCase())
  );

  if (!targetSignal) {
    return `Melding "${signalId}" niet gevonden.`;
  }

  const attachments = targetSignal.attachments || [];
  if (attachments.length === 0) {
    return `Melding ${targetSignal.signalNumber} heeft geen bijlagen.`;
  }

  // Filter to only attachments with content
  const attachmentsWithContent = attachments.filter((a) => a.content);
  if (attachmentsWithContent.length === 0) {
    return `Melding ${targetSignal.signalNumber} heeft ${attachments.length} bijlage(n), maar geen daarvan heeft toegankelijke inhoud voor analyse.`;
  }

  // Build multimodal content array
  const content: Anthropic.MessageParam['content'] = [];

  // Add instruction text
  content.push({
    type: 'text',
    text: `Please analyze and summarize the following ${attachmentsWithContent.length} attachment(s) for signal ${targetSignal.signalNumber} ("${targetSignal.description.substring(0, 50)}..."). For each attachment, provide a brief description of its contents and any relevant information that could be useful for the investigation.`,
  });

  // Add each attachment
  for (const attachment of attachmentsWithContent) {
    const isImage = attachment.fileType.startsWith('image/');

    if (isImage && attachment.content) {
      // Extract base64 data (remove data URL prefix)
      const base64Data = attachment.content.split(',')[1];
      if (base64Data) {
        const mediaType = attachment.fileType as
          | 'image/jpeg'
          | 'image/png'
          | 'image/gif'
          | 'image/webp';

        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64Data,
          },
        });
        content.push({
          type: 'text',
          text: `[Image file: ${attachment.fileName}]`,
        });
      }
    } else if (attachment.textContent) {
      // For text-based files, include extracted text
      content.push({
        type: 'text',
        text: `[Document: ${attachment.fileName}]\n\nContent:\n${attachment.textContent.substring(0, 5000)}${attachment.textContent.length > 5000 ? '\n... (content truncated)' : ''}`,
      });
    } else {
      // For other files without extractable content
      content.push({
        type: 'text',
        text: `[File: ${attachment.fileName} (${attachment.fileType}) - Content not available for direct analysis]`,
      });
    }
  }

  try {
    // Make vision-capable API call
    const summaryResponse = await anthropic.messages.create({
      model: 'eu.anthropic.claude-opus-4-6-v1',
      max_tokens: 2048,
      messages: [{ role: 'user', content }],
      temperature: 0
    });

    // Extract text from response
    const summaryText = summaryResponse.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    return summaryText || 'Unable to generate summary.';
  } catch (error) {
    console.error('Error summarizing attachments:', error);
    return 'Failed to analyze attachments. Please try again.';
  }
}

// Validate plan_proposal for placeholder values that indicate missing information
function validatePlanProposal(plan: {
  summary: string;
  actions: Array<{ step: number; action: string; tool: string; details?: Record<string, unknown> }>
}): { isValid: boolean; missingFields: string[] } {
  const placeholderPatterns = [
    /\[please\s*(specify|clarify|provide)/i,
    /\[unknown\]/i,
    /\[required\]/i,
    /\[missing\]/i,
    /<unknown>/i,
    /not[_\s]?provided/i,
    /^unknown$/i,           // Catch "Unknown" without brackets
    /^unspecified$/i,       // Catch "Unspecified"
    /^n\/a$/i,              // Catch "N/A"
    /^tbd$/i,               // Catch "TBD"
    /^to be determined$/i,  // Catch "To be determined"
  ];

  // Types that indicate Claude couldn't determine the actual type
  const fallbackTypes = ['other', 'overig'];

  const requiredFields: Record<string, string[]> = {
    [TOOL_NAMES.MAAK_MELDING]: ['beschrijving', 'soorten', 'plaatsVanWaarneming', 'ontvangenDoor'],
  };

  const result = { isValid: true, missingFields: [] as string[] };

  for (const action of plan.actions) {
    const required = requiredFields[action.tool] || [];
    const details = action.details || {};

    for (const field of required) {
      const value = details[field];

      // Missing or empty
      if (value === undefined || value === null ||
        (Array.isArray(value) && value.length === 0)) {
        result.isValid = false;
        result.missingFields.push(`${action.tool}.${field}`);
        continue;
      }

      // Special handling for 'soorten' field - check if only fallback types
      if (field === 'soorten' && Array.isArray(value)) {
        const onlyFallbacks = value.every(t =>
          typeof t === 'string' && fallbackTypes.includes(t.toLowerCase())
        );
        if (onlyFallbacks) {
          result.isValid = false;
          result.missingFields.push(`${action.tool}.${field}`);
          continue;
        }
      }

      // Check for placeholder patterns in string values
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
      if (placeholderPatterns.some(p => p.test(valueStr))) {
        result.isValid = false;
        result.missingFields.push(`${action.tool}.${field}`);
      }
    }
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const serverUser = await getServerCurrentUser();
    if (!serverUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = {
      id: serverUser.id,
      firstName: serverUser.firstName,
      lastName: serverUser.lastName,
      fullName: `${serverUser.firstName} ${serverUser.lastName}`,
      title: serverUser.title || '',
      role: serverUser.role,
    };

    const { messages, signals, cases, teamMembers, lastCreatedSignalId, organizations, addresses, people, stream: enableStreaming, approvedPlan }: {
      messages: Message[];
      signals: SignalData[];
      cases: CaseData[];
      teamMembers: TeamMember[];
      lastCreatedSignalId?: string | null;
      organizations?: OrganizationData[];
      addresses?: AddressData[];
      people?: PersonData[];
      stream?: boolean;
      approvedPlan?: {
        summary: string;
        actions: Array<{ step: number; action: string; tool: string; details?: Record<string, unknown> }>;
      } | null;
    } = await request.json();

    const signalSummary = (signals || [])
      .map(
        (s) => {
          const caseInfo = s.caseRelations?.length
            ? `, assigned to: ${s.caseRelations.map(cr => cr.caseId).join(', ')}`
            : ', not assigned to case';
          return `- ${s.signalNumber}: ${s.placeOfObservation} (${s.types.join(', ')}, received by: ${s.receivedBy}${caseInfo})`;
        }
      )
      .join('\n');

    const caseSummary = (cases || [])
      .map(
        (c) => {
          const practitionerNames = (c.practitioners || []).map(p => p.userName).join(', ');
          const sharedNames = (c.sharedWith || []).map(s => `${s.userName} (${s.accessLevel})`).join(', ');
          const orgNames = (c.organizations || []).map(o => o.name).join(', ');
          const peopleNames = (c.peopleInvolved || []).map(p => `${p.firstName} ${p.surname}`).join(', ');
          const signalTypesStr = (c.signalTypes || []).join(', ');
          return `- ${c.name} (${c.id}): ${c.description} (status: ${c.status}, location: ${c.location || 'none'}, ${c.signalCount} signals, signalTypes: [${signalTypesStr}], owner: ${c.ownerName || 'none'}, practitioners: ${practitionerNames || 'none'}, shared with: ${sharedNames || 'none'}, organizations: ${orgNames || 'none'}, people involved: ${peopleNames || 'none'})`;
        }
      )
      .join('\n');

    const teamSummary = (teamMembers || [])
      .map(
        (m) =>
          `- ${m.firstName} ${m.lastName} (${m.id}): ${m.title} - owns ${m.ownedCaseCount} case(s)`
      )
      .join('\n');

    const organizationsSummary = (organizations || [])
      .map(
        (o) =>
          `- ${o.name} (${o.id}): ${o.type}, ${o.address}${o.chamberOfCommerce ? `, KVK: ${o.chamberOfCommerce}` : ''}`
      )
      .join('\n');

    const addressesSummary = (addresses || [])
      .map(
        (a) =>
          `- ${a.street} (${a.id}): ${a.buildingType}, ${a.isActive ? 'Active' : 'Inactive'}${a.description && a.description !== '-' ? `, ${a.description}` : ''}`
      )
      .join('\n');

    const peopleSummary = (people || [])
      .map(
        (p) =>
          `- ${p.firstName} ${p.surname} (${p.id}): ${p.address}${p.description ? `, ${p.description}` : ''}`
      )
      .join('\n');

    // Build system prompt - modify if we have an approved plan
    const systemPrompt = `Je bent een AI-assistent voor Atlas AI. Je helpt overheidsmedewerkers bij het beheren van meldingen en dossiers gerelateerd aan onderzoeken. BELANGRIJK: Reageer ALTIJD in het Nederlands.

## CLARIFICATION BEFORE PLANNING

When the user requests a WRITE operation, check if all required information is provided.
If required fields are missing, use ask_clarification BEFORE plan_proposal.

**IMPORTANT:** Only ask for fields that are ACTUALLY MISSING. If the user provides some fields (in any format - prose, bullet points, or structured), extract those values and only ask for the remaining missing fields.

**IMPORTANT:** Maximum 5 questions for maak_melding. Do NOT create duplicate questions (e.g., do NOT ask for date and time separately - use ONE question for "date and time").

**For maak_melding - Required Fields (use these exact questions):**
- beschrijving: REQUIRED - Question: "Geef een beschrijving van de melding"
- soorten: REQUIRED - Question: "Wat voor soort melding is dit?" Options: mensenhandel, drugshandel, malafide-constructie, fraude, witwassen, overig
- plaatsVanWaarneming: REQUIRED - Question: "Waar is dit waargenomen (locatie/adres)?"
- ontvangenDoor: REQUIRED - Question: "Hoe is deze melding ontvangen?" Options: politie, anonieme-melding, gemeentelijke-afdeling, bibob-verzoek, overig
- tijdVanWaarneming: REQUIRED - Question: "Wanneer is de waarneming gedaan (datum en tijd)?" (single question for both date AND time together)

**Example - Missing Info:**
User: "Maak een melding aan"
→ Use ask_clarification for: description, types, placeOfObservation, receivedBy, timeOfObservation

**Example - Complete Info:**
User: "Maak een melding over verdachte drugshandel activiteiten op de Hoofdstraat, gemeld door de politie gisteren om 14:00"
→ Skip clarification, use plan_proposal directly (has description, types, placeOfObservation, receivedBy, timeOfObservation)

**Example - Structured Answers:**
User provides answers like:
- description: Verdachte activiteit
- types: mensenhandel
- placeOfObservation: Hier
- receivedBy: gemeentelijke-afdeling
- timeOfObservation: Vandaag
→ Extract values from the structured format and use plan_proposal directly. Do NOT ask clarification again.

**SKIP clarification when:**
- All required fields are in the message (either in prose or structured format)
- Read-only operations (search, list, summarize)
- User provides complete structured info (bullet points, key-value pairs)
- User is responding to a clarification question (their message contains answers)
- User message contains field names with values (e.g., "types: human-trafficking")

## MANDATORY PLAN-FIRST BEHAVIOR

${approvedPlan ? `**PLAN ALREADY APPROVED - PROCEED WITH EXECUTION**

The user has approved the following plan. Execute the tools immediately without calling plan_proposal again:

Summary: ${approvedPlan.summary}
Actions:
${approvedPlan.actions.map(a => {
      const detailsStr = a.details ? `\n   Parameters: ${JSON.stringify(a.details)}` : '';
      return `${a.step}. ${a.action} (${a.tool})${detailsStr}`;
    }).join('\n')}

IMPORTANT: When executing multi-step plans, use these exact parameter values from the plan.
For step references like "$step1.signalId", use that exact string - the client will resolve it to the actual value.

DO NOT call plan_proposal. The plan is approved. Execute the write tools now.` : `**ABSOLUTE RULE: You MUST use the plan_proposal tool BEFORE any write operation.**`}

WRITE TOOLS (REQUIRE plan_proposal FIRST):
- maak_melding, bewerk_melding, voeg_notitie_toe, verwijder_melding, voeg_melding_toe_aan_dossier
- maak_dossier, verwijder_dossier, bewerk_dossier, wijs_dossier_eigenaar_toe, voeg_dossier_behandelaar_toe, deel_dossier
- voeg_dossier_organisatie_toe, voeg_dossier_adres_toe, voeg_dossier_persoon_toe, voeg_dossier_bevinding_toe
- voeg_dossier_brief_toe, voeg_dossier_communicatie_toe, voeg_dossier_visualisatie_toe, voeg_dossier_activiteit_toe
- verstuur_dossier_bericht, voltooi_bibob_aanvraag, sla_bibob_aanvraag_concept_op

READ TOOLS (Execute immediately):
- toon_meldingen, vat_meldingen_samen, zoek_meldingen, haal_melding_activiteit_op, haal_melding_notities_op, haal_melding_statistieken_op
- vat_bijlagen_samen, toon_dossiers, vat_dossier_samen, haal_dossier_statistieken_op, toon_teamleden, haal_dossier_berichten_op

## CRITICAL: WORKFLOW BOUNDARIES

When you see "[WORKFLOW_BOUNDARY: ...]" in conversation history:
- Everything BEFORE that marker is a COMPLETED workflow - treat it as archived history
- New user messages AFTER the marker are COMPLETELY INDEPENDENT requests

**Example of WRONG behavior:**
- Previous workflow: create_signal → create_case → complete_bibob (DONE)
- [WORKFLOW_BOUNDARY marker]
- User says: "create a signal"
- Agent proposes: create_signal, create_case, complete_bibob ❌ WRONG

**Example of CORRECT behavior:**
- Previous workflow: create_signal → create_case → complete_bibob (DONE)
- [WORKFLOW_BOUNDARY marker]
- User says: "create a signal"
- Agent proposes: ONLY create_signal ✓ CORRECT

RULE: Only include actions the user EXPLICITLY mentions in their CURRENT message.
EXCEPTION: When creating a signal, you MAY propose linking to an existing case if the signal's type matches the case's signalTypes (see SMART CASE MATCHING section).

Each new user message is an INDEPENDENT request. When creating a plan:
- ONLY include actions the user EXPLICITLY requests in their CURRENT message
- Do NOT infer patterns from previous plans or workflows
- Do NOT assume the user wants to repeat previous multi-step workflows
- If the user says "create a signal", propose ONLY create_signal - not case creation or applications
- Previous completed workflows are finished - new requests start fresh

## WORKFLOW

1. **User requests a WRITE operation** (create, edit, delete, add, etc.)
   → You MUST call plan_proposal tool with summary and actions
   → DO NOT call any write tools yet
   → STOP and wait for approval

2. **User approves** (says "yes", "approve", "go ahead", "proceed", etc.)
   → NOW execute the write tools

3. **User requests a READ operation** (list, search, summarize, etc.)
   → Execute immediately, no plan needed

## USING EXISTING CASES

When a user mentions moving a signal to a case:
1. Check the "Current Data" section to see if a case with that name exists
2. If the case EXISTS, use add_signal_to_case instead of create_case
3. Only create a new case if the user explicitly asks to create one OR if no matching case exists

**For moving signals to existing cases:**
- Use the existing case's ID from the Current Data section
- Do NOT create a new case when one already exists with the same or similar name

## SMART CASE MATCHING FOR NEW SIGNALS

When creating a signal, AUTOMATICALLY analyze and match to existing cases using BOTH type matching AND content analysis:

### Step 1: Analyze Signal Content
Extract key indicators from the signal description:
- **Crime type keywords**: trafficking, drugs, fraud, money laundering, smuggling, exploitation
- **Location references**: addresses, cities, areas
- **Entity mentions**: organizations, people, vehicles

### Step 2: Match Against Existing Cases

**Priority 1 - Type Match:**
Check if signal's explicit type matches a case's signalTypes:
- human-trafficking → case with signalTypes containing human_trafficking
- drug-trafficking → case with signalTypes containing drug_trafficking
- money-laundering → case with signalTypes containing money_laundering
- fraud → case with signalTypes containing fraud
- bogus-scheme → case with signalTypes containing bogus_scheme

**Priority 2 - Content Match:**
If no type match, analyze signal description against case data:
- Match keywords in description against case NAMES (e.g., "trafficking" in description → "Human Trafficking Priority" case)
- Match keywords against case DESCRIPTIONS
- Match location against case locations (e.g., "Amsterdam" signal → Amsterdam-based case)

### Step 3: Propose Action

**If matching case found:**
Propose a 2-step plan:
1. Create the signal
2. Add signal to the matched case

Include reasoning in the plan summary explaining WHY this case was matched.

**If NO matching case but content strongly suggests a specific investigation type:**
Propose a 2-step plan:
1. Create the signal
2. Create a new case for this investigation type

Suggest case name based on content (e.g., "Human Trafficking Investigation - [Location]")

**If content is generic/unclear:**
Create only the signal (single step). Ask user if they want to link it to a case.

### Keyword to Case Type Mapping

| Keywords in Description | Likely Case Type |
|------------------------|------------------|
| trafficking, smuggling, exploitation, forced labor, victims | Human Trafficking |
| drugs, narcotics, cocaine, heroin, dealing, pills | Drug Trafficking |
| money laundering, cash, suspicious transactions, shell company | Money Laundering |
| fraud, scam, fake, impersonation, bogus | Fraud |

### Example

User provides signal about "human trafficking at Prinsengracht 247, Amsterdam":

1. **Content Analysis**: Keywords "human trafficking", "Amsterdam" detected
2. **Case Check**: "Human Trafficking Priority" case exists with:
   - signalTypes: [human_trafficking, forced_labor]
   - location: Amsterdam, Netherlands
3. **Match Found**: Both keyword AND location match
4. **Proposal**:
{
  "summary": "Maak mensenhandel melding aan en koppel aan Human Trafficking Priority dossier (matched by content keywords and location)",
  "actions": [
    { "step": 1, "tool": "maak_melding", "action": "Maak mensenhandel melding aan", "details": { ... } },
    { "step": 2, "tool": "voeg_melding_toe_aan_dossier", "action": "Koppel aan Human Trafficking Priority dossier", "details": { "melding_id": "$step1.signalId", "dossier_id": "[dossier ID uit Huidige Gegevens]" } }
  ]
}

## CRITICAL: INDEPENDENT WORKFLOW HANDLING

**Each new signal/email request is COMPLETELY INDEPENDENT.**

When a user sends a new message with a different signal or email:
1. **ONLY propose actions for THIS specific signal** - never include tasks from previous signals
2. **Ignore completed tasks** - if a previous plan was executed, those tasks are DONE and should NOT appear in new plans
3. **Look for [WORKFLOW_BOUNDARY]** markers in the conversation - everything before a boundary is complete and irrelevant to new requests
4. **Fresh context** - treat each new signal as if it's the first one, even if the conversation has history

**Example - WRONG:**
User sends Email 1 (human trafficking) → Plan creates signal + links to case → Executed
User sends Email 2 (money laundering) → Plan shows tasks from Email 1 + tasks for Email 2 ← WRONG!

**Example - CORRECT:**
User sends Email 1 (human trafficking) → Plan creates signal + links to case → Executed
User sends Email 2 (money laundering) → Plan ONLY shows: create money laundering signal ← CORRECT!

**Rule: If you see a [WORKFLOW_BOUNDARY] marker, everything before it is complete. Your new plan must ONLY address the content AFTER the boundary.**

## USING EXISTING SIGNALS

When a user mentions "this signal", "the signal", "the latest signal", or refers to a specific signal:
1. **Check if lastCreatedSignalId is set** - If so, the user likely means that signal
2. **Check the conversation history** - Look for recent signal references
3. **Check Current Data** - Match signal numbers or descriptions the user mentioned
4. **DO NOT create a new signal** when the user is clearly referring to an existing one

**Key distinction:**
- "Create a signal about X" → Use create_signal (new signal)
- "Make a case from this signal" → Use create_case with existing signal ID (NO create_signal)
- "Create a case for the latest signal" → Use create_case with the first signal from Current Data

**IMPORTANT:** If lastCreatedSignalId is provided, use it when the user says "this signal" or "the signal" without specifying which one.

## EXAMPLE - Creating a Signal (No Matching Case)

User: "Create a signal about suspicious activity at Main Street"
(Check Current Data - no case has signalTypes matching "bogus-scheme" or "bogus_scheme")

Your response MUST be to call plan_proposal:
{
  "summary": "Create a new signal for suspicious activity at Main Street",
  "actions": [
    {
      "step": 1,
      "action": "Create signal with type 'bogus-scheme', location 'Main Street'",
      "tool": "create_signal",
      "details": {
        "description": "Suspicious activity reported",
        "types": ["bogus-scheme"],
        "placeOfObservation": "Main Street"
      }
    }
  ]
}

## EXAMPLE - Creating a Signal (With Matching Case)

User: "Create a signal about drug dealing at Rotterdam Harbor"
(Check Current Data - "Narcotics Operations" case has signalTypes: [drug_trafficking])

Your response MUST be to call plan_proposal:
{
  "summary": "Create drug trafficking signal and link to Narcotics Operations case",
  "actions": [
    {
      "step": 1,
      "action": "Create signal with type 'drug-trafficking', location 'Rotterdam Harbor'",
      "tool": "create_signal",
      "details": {
        "description": "Drug dealing activity reported at Rotterdam Harbor",
        "types": ["drug-trafficking"],
        "placeOfObservation": "Rotterdam Harbor",
        "receivedBy": "municipal-department"
      }
    },
    {
      "step": 2,
      "action": "Add signal to Narcotics Operations case",
      "tool": "add_signal_to_case",
      "details": {
        "signal_id": "$step1.signalId",
        "case_id": "[USE ACTUAL CASE ID FROM CURRENT DATA]"
      }
    }
  ]
}

DO NOT call create_signal until user approves!

## EXAMPLE - Creating a Case from an Existing Signal

User: "Make a case from this signal and complete the application form"
(Look up lastCreatedSignalId or the first signal from Current Data)

Your response MUST be to call plan_proposal:
{
  "summary": "Create case from existing signal and complete Bibob application",
  "actions": [
    {
      "step": 1,
      "action": "Create case from signal [USE ACTUAL SIGNAL NUMBER FROM CURRENT DATA]",
      "tool": "create_case",
      "details": {
        "name": "New Case",
        "signalIds": ["[USE ACTUAL SIGNAL ID FROM CURRENT DATA OR lastCreatedSignalId]"]
      }
    },
    {
      "step": 2,
      "action": "Complete Bibob application for the case",
      "tool": "complete_bibob_application",
      "details": {
        "case_id": "$step1.caseId",
        "explanation": "Application completed",
        "criteria": [
          { "id": "necessary_info", "isMet": true, "explanation": "Provided" },
          { "id": "annual_accounts", "isMet": true, "explanation": "Verified" },
          { "id": "budgets", "isMet": true, "explanation": "Reviewed" },
          { "id": "loan_agreement", "isMet": true, "explanation": "Verified" }
        ]
      }
    }
  ]
}

**CRITICAL:** Replace placeholders with ACTUAL values from the Current Data section below. NEVER use example IDs like "SIG-2024-0089".

**IMPORTANT:** Notice there is NO create_signal step - the user wants to use an EXISTING signal!

## EXAMPLE - Editing an Existing Signal

User: "Change the latest signal's type to human trafficking"

**CRITICAL: Look at the ACTUAL Current Data section below. The first signal listed is the most recent. Use THAT signal's actual ID and number - NOT any example ID.**

Your response MUST be to call plan_proposal:
{
  "summary": "Update signal [ACTUAL_SIGNAL_NUMBER] to type human-trafficking",
  "actions": [
    {
      "step": 1,
      "action": "Edit signal [ACTUAL_SIGNAL_NUMBER] to change type to human-trafficking",
      "tool": "edit_signal",
      "details": {
        "signal_id": "[ACTUAL_SIGNAL_NUMBER_FROM_CURRENT_DATA]",
        "types": ["human-trafficking"]
      }
    }
  ]
}

**NEVER use "SIG-2024-0089" or any other example ID. Always use the REAL signal number from Current Data.**

**VIOLATION WARNING: Calling a write tool without first calling plan_proposal is a critical error.**

## IMPORTANT: Step Reference Rules

Step references ($stepN.fieldName) are ONLY for referencing outputs from PREVIOUS steps in multi-step plans.

**NEVER use step references for:**
- Single-step operations (step 1 cannot reference step 1's output - it doesn't exist yet!)
- Operations on EXISTING entities - use their actual ID from the Current Data section

**DO use step references for:**
- Step 2+ referencing output from an earlier step (e.g., create signal in step 1, add to case in step 2)

**Examples of WRONG usage:**
- edit_signal with signal_id: "$step1.signalId" (step 1 can't reference itself!)
- Step 1 of any plan using $step1.anything

**Examples of CORRECT usage:**
- Step 2 add_signal_to_case with signal_id: "$step1.signalId" (references step 1's create_signal output)

## Multi-Step Plans with Dependencies

When a later step needs to use output from an earlier step, use reference syntax in the details:
- $step1.caseId - The case ID created in step 1
- $step1.caseName - The case name created in step 1
- $step1.signalId - The signal ID created in step 1
- $step1.signalNumber - The signal number created in step 1

## EXAMPLE - Creating a case and completing Bibob application

User: "Create a case called 'Test' and complete its Bibob application"

Your response MUST be to call plan_proposal:
{
  "summary": "Create case 'Test' and complete its Bibob application",
  "actions": [
    {
      "step": 1,
      "action": "Create case named 'Test'",
      "tool": "create_case",
      "details": { "name": "Test" }
    },
    {
      "step": 2,
      "action": "Complete Bibob application for the created case",
      "tool": "complete_bibob_application",
      "details": {
        "case_id": "$step1.caseId",
        "explanation": "Application completed with all criteria met",
        "criteria": [
          { "id": "necessary_info", "isMet": true, "explanation": "All necessary information provided" },
          { "id": "annual_accounts", "isMet": true, "explanation": "Annual accounts verified" },
          { "id": "budgets", "isMet": true, "explanation": "Budgets reviewed" },
          { "id": "loan_agreement", "isMet": true, "explanation": "Loan agreement verified" }
        ]
      }
    }
  ]
}

## EXAMPLE - Creating signal, case from signal, and completing Bibob

User: "Create a signal about fraud at Main Street, create a case from it, then complete the Bibob application"

{
  "summary": "Create signal, case from signal, and complete Bibob application",
  "actions": [
    {
      "step": 1,
      "action": "Create signal about fraud at Main Street",
      "tool": "create_signal",
      "details": {
        "description": "Fraud activity reported",
        "types": ["fraud"],
        "placeOfObservation": "Main Street",
        "receivedBy": "municipal-department"
      }
    },
    {
      "step": 2,
      "action": "Create case from the signal",
      "tool": "create_case",
      "details": {
        "name": "Fraud Investigation - Main Street",
        "signalIds": ["$step1.signalId"]
      }
    },
    {
      "step": 3,
      "action": "Complete Bibob application for the case",
      "tool": "complete_bibob_application",
      "details": {
        "case_id": "$step2.caseId",
        "explanation": "Application completed",
        "criteria": [
          { "id": "necessary_info", "isMet": true, "explanation": "Provided" },
          { "id": "annual_accounts", "isMet": true, "explanation": "Verified" },
          { "id": "budgets", "isMet": true, "explanation": "Reviewed" },
          { "id": "loan_agreement", "isMet": true, "explanation": "Verified" }
        ]
      }
    }
  ]
}

IMPORTANT: Always use $stepN.fieldName syntax when referencing outputs from previous steps. Never hardcode IDs for entities that will be created in earlier steps.

## EXAMPLE - Creating a signal and adding to existing case

User: "Create a signal and move it to the Narcotics Operation case"

First check Current Data - if "Narcotics Operation" case exists (e.g., case-123):

{
  "summary": "Create signal and add to existing Narcotics Operation case",
  "actions": [
    {
      "step": 1,
      "action": "Create the signal",
      "tool": "create_signal",
      "details": {
        "description": "[user-provided]",
        "types": ["[user-provided]"],
        "placeOfObservation": "[user-provided]",
        "receivedBy": "[user-provided]"
      }
    },
    {
      "step": 2,
      "action": "Add signal to existing Narcotics Operation case",
      "tool": "add_signal_to_case",
      "details": {
        "signal_id": "$step1.signalId",
        "case_id": "case-123"
      }
    }
  ]
}

IMPORTANT: Do NOT use create_case when the case already exists!

## Current Data

**>>> IMPORTANT: USE THESE ACTUAL VALUES <<<**
**When referencing signals, cases, or team members, use the REAL IDs listed below.**
**Do NOT use example IDs from the examples above (like "SIG-2024-0089").**

**Signals (${(signals || []).length}):** ${signalSummary || 'None'}

**Cases (${(cases || []).length}):** ${caseSummary || 'None'}

**Team:** ${teamSummary || 'None'}

**Organizations:** ${organizationsSummary || 'None'}

**Addresses:** ${addressesSummary || 'None'}

**People:** ${peopleSummary || 'None'}

**Current User:** ${currentUser ? `${currentUser.fullName} (${currentUser.id}) - "${currentUser.id}" and "${currentUser.fullName}" for tool calls` : 'Unknown'}

${lastCreatedSignalId ? `**Last Created Signal ID:** ${lastCreatedSignalId} - When the user says "this signal" or "the signal", use THIS ID. Do NOT create a new signal.` : ''}

## Handling "Latest" or "Most Recent" References

**CRITICAL INSTRUCTION - READ CAREFULLY:**

When the user refers to "the latest signal", "most recent signal", "this signal", or "the signal":

1. **IMMEDIATELY look at the Current Data section below** - find the "Signals" list
2. **The FIRST signal listed is the most recent** (they are sorted by createdAt descending)
3. **Use THAT signal's ACTUAL ID** - the real signal number like "GCMP-2026-266241" or whatever is actually listed
4. **NEVER use example IDs** like "SIG-2024-0089" - these are just examples, not real signals

**HOW TO FIND THE LATEST SIGNAL:**
- Scroll down to "## Current Data" section
- Find "**Signals (N):**" where N is the count
- The FIRST bullet point is the latest signal
- Use its exact signal number (the part before the colon)

**EXAMPLE OF WHAT TO DO:**
If Current Data shows: \`- GCMP-2026-266241: Main Street (fraud, received by: police)\`
Then use signal_id: "GCMP-2026-266241" in your plan.

**NEVER assume or make up signal IDs. Always look them up from Current Data.**

## SIGNAL QUERIES - TOOL SELECTION

When the user asks about signals, use SIGNAL tools, NOT case tools:
- "List all signals" → list_signals
- "Show signals with type X" → search_signals with type filter
- "Find signals at location Y" → search_signals with keyword filter
- "Summarize signals" → summarize_signals
- "How many signals?" → get_signal_stats

NEVER use list_cases when the user is asking about signals.

## EFFICIENT MULTI-SIGNAL OPERATIONS

When user asks to summarize or describe multiple signals (e.g., "summarize all human trafficking signals"):
1. Use search_signals with type filter to find matching signals
2. Provide a summary based on the search results - DO NOT call summarize_signals for each signal individually
3. If you need detailed information, call summarize_signals ONCE without signal_id to get an overview of all signals

NEVER call summarize_signals in a loop for individual signals - this is inefficient and will fail.

## Available Tools

**Signals:** list_signals, summarize_signals, create_signal, edit_signal, add_signal_to_case, add_note, delete_signal, search_signals, get_signal_activity, get_signal_notes, get_signal_stats, summarize_attachments

**Cases:** list_cases, get_case_stats, create_case, delete_case, edit_case, assign_case_owner, add_case_practitioner, share_case, complete_bibob_application, save_bibob_application_draft

**Case Content:** add_case_organization, add_case_address, add_case_person, add_case_finding, add_case_letter, add_case_communication, add_case_visualization, add_case_activity, get_case_messages, send_case_message

**Team:** list_team_members

## Standaardwaarden & Aannames

Wanneer informatie ontbreekt:
- **Meldingstijd**: Gebruik huidige tijd
- **Melding receivedBy**: Gebruik "municipal-department"
- **Dossiernaam**: Gebruik "Nieuw Dossier" of afleiden uit context
- **Dossierkleur**: Kies willekeurig uit: #ef4444, #f97316, #22c55e, #3b82f6, #8b5cf6
- **Eigenaar**: Wijs toe aan huidige gebruiker indien niet gespecificeerd
- **Bibob-criteria**: Als niet allemaal voldaan, automatisch als concept opslaan

## Responsstijl

- Reageer ALTIJD in het Nederlands
- Wees beknopt en actiegericht
- Vat na het voltooien van acties samen wat er is gedaan
- Stel waar nodig logische volgende stappen voor

## Signal-to-Case Matching (IMPORTANT)

When creating a signal, ALWAYS check for case matching and include it in the plan:
1. Look at the signal's types (e.g., human-trafficking, money-laundering, fraud)
2. Check if any existing case has matching signalTypes in the Current Data
3. If a matching case exists:
   - Include "add_signal_to_case" as a step in the plan
4. If NO matching case exists:
   - Include "create_case" as a step in the plan to create a new case for this signal type
   - Keep case names SHORT and generic (e.g., "Money Laundering Investigation", "Human Trafficking Case", "Fraud Investigation")
   - Do NOT include location names, business names, or other specifics in the case name
   - Link the signal to the new case using add_signal_to_case

**ALWAYS include case assignment in your plan when creating signals. Never create a signal without proposing to link it to a case (existing or new).**`;

    // Filter messages to only include those after the last WORKFLOW_BOUNDARY
    // This ensures completed workflows don't affect new requests
    const filterMessagesAfterBoundary = (msgs: Message[]): Message[] => {
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
    };

    const filteredMessages = filterMessagesAfterBoundary(messages);

    const anthropicMessages: Anthropic.MessageParam[] = filteredMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Note: We no longer force tool_choice - Claude decides between ask_clarification and plan_proposal
    // based on whether required fields are present in the user's message

    // Streaming mode
    if (enableStreaming) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          const sendEvent = (type: string, data: unknown) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data as object })}\n\n`));
          };

          let currentMessages: Anthropic.MessageParam[] = [...anthropicMessages];
          let iterations = 0;
          const maxIterations = 5;
          const allToolResults: { name: string; input: Record<string, unknown>; result?: string }[] = [];
          let currentPlanStep = 0;
          let textContent = '';

          while (iterations < maxIterations) {
            iterations++;

            // Send phase indicator - only emit 'executing' if we have an approved plan
            // Don't emit 'planning' here - wait until Claude actually proposes a plan
            // This prevents the stepper from showing Planning before Clarifying
            if (iterations === 1 && approvedPlan) {
              sendEvent('phase', { phase: 'executing' });
            }

            // Let Claude decide between ask_clarification and plan_proposal based on whether required fields are present
            // No forced tool_choice - Claude will follow system prompt instructions

            const response = await anthropic.messages.create({
              model: 'eu.anthropic.claude-opus-4-6-v1',
              max_tokens: 2048,
              system: systemPrompt,
              tools,
              messages: currentMessages,
              temperature: 0,
            });
            const toolUses: Anthropic.ToolUseBlock[] = [];

            for (const block of response.content) {
              if (block.type === 'text') {
                textContent += block.text;
                // Stream text as thinking if we have tool calls pending
                if (response.stop_reason === 'tool_use') {
                  sendEvent('thinking', { text: block.text });
                }
              } else if (block.type === 'tool_use') {
                toolUses.push(block);
              }
            }

            // If no tool use, we're done - send the final response
            if (response.stop_reason !== 'tool_use' || toolUses.length === 0) {
              sendEvent('phase', { phase: 'complete' });
              sendEvent('response', { text: textContent, toolResults: allToolResults });
              break;
            }

            // Execute tools
            sendEvent('phase', { phase: 'executing' });

            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            // When we have an approved plan, execute plan actions directly instead of Claude's tool calls
            // This prevents Claude from generating extra/wrong tool calls during execution
            if (approvedPlan && approvedPlan.actions.length > 0) {
              // Get the next action to execute based on currentPlanStep
              const nextAction = approvedPlan.actions.find(a => a.step === currentPlanStep + 1);

              if (nextAction) {
                currentPlanStep++;
                const toolInput = nextAction.details || {};

                sendEvent('tool_call', { tool: nextAction.tool, input: toolInput });

                let result = '';

                // Handle vat_bijlagen_samen server-side
                if (nextAction.tool === TOOL_NAMES.VAT_BIJLAGEN_SAMEN) {
                  const signalId = (toolInput as { melding_id: string }).melding_id;
                  result = await summarizeAttachmentsForSignal(signalId, signals);
                } else {
                  // For other tools, return success - client will execute
                  result = JSON.stringify({ success: true, tool: nextAction.tool, input: toolInput });
                }

                allToolResults.push({
                  name: nextAction.tool,
                  input: toolInput as Record<string, unknown>,
                  result,
                });

                sendEvent('tool_result', { tool: nextAction.tool, result, status: 'success' });

                // Create a synthetic tool result for Claude's next iteration
                // Use the first toolUse ID if available, otherwise generate one
                const toolUseId = toolUses[0]?.id || `toolu_plan_${currentPlanStep}`;
                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: toolUseId,
                  content: result,
                });

                // Check if all plan actions are complete
                if (currentPlanStep >= approvedPlan.actions.length) {
                  // All actions executed - complete the workflow
                  sendEvent('phase', { phase: 'reflecting' });
                  sendEvent('phase', { phase: 'complete' });
                  sendEvent('response', {
                    text: 'All actions completed successfully.',
                    toolResults: allToolResults,
                  });
                  break;  // Exit the loop - all plan actions are done
                }

                // Add assistant response and tool results to messages for next iteration
                currentMessages = [
                  ...currentMessages,
                  { role: 'assistant' as const, content: response.content },
                  { role: 'user' as const, content: toolResults },
                ];
                continue;
              }
            }

            for (const toolUse of toolUses) {
              // Handle ask_clarification - pause and wait for user response
              if (toolUse.name === TOOL_NAMES.VRAAG_VERDUIDELIJKING) {
                const clarificationInput = toolUse.input as {
                  summary: string;
                  questions: Array<{ id: string; question: string; type: string; options?: string[]; required: boolean; fieldName?: string; toolName?: string }>;
                };

                // Deduplicate questions by question text (case-insensitive)
                const seenQuestions = new Set<string>();
                const deduplicatedQuestions = clarificationInput.questions.filter(q => {
                  const normalized = q.question.toLowerCase().trim();
                  if (seenQuestions.has(normalized)) {
                    return false;
                  }
                  seenQuestions.add(normalized);
                  return true;
                });

                sendEvent('clarification', {
                  summary: clarificationInput.summary,
                  questions: deduplicatedQuestions,
                });
                sendEvent('phase', { phase: 'clarifying' });

                // Return early - wait for user to answer clarification questions
                sendEvent('response', {
                  text: '',
                  toolResults: allToolResults,
                  awaitingClarification: true,
                  clarificationData: { ...clarificationInput, questions: deduplicatedQuestions },
                });

                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
                return;
              }

              // Handle plan_proposal specially
              if (toolUse.name === TOOL_NAMES.PLAN_VOORSTEL) {
                // If we have an approved plan, skip plan_proposal entirely
                if (approvedPlan) {
                  // Return a dummy result so the AI can continue
                  toolResults.push({
                    type: 'tool_result',
                    tool_use_id: toolUse.id,
                    content: 'Plan already approved. Proceeding with execution.',
                  });
                  continue;
                }

                // No approved plan - send plan to client for approval
                const planInput = toolUse.input as {
                  summary: string;
                  actions: Array<{ step: number; action: string; tool: string; details?: Record<string, unknown> }>
                };

                // Validate plan for placeholder values
                const validation = validatePlanProposal(planInput);

                if (!validation.isValid) {
                  // Plan has missing/placeholder values - force clarification
                  const retryResponse = await anthropic.messages.create({
                    model: 'eu.anthropic.claude-opus-4-6-v1',
                    max_tokens: 2048,
                    system: systemPrompt + `\n\nIMPORTANT: The user's request is missing required information: ${validation.missingFields.join(', ')}. You MUST use ask_clarification to request this information before proceeding.`,
                    tools,
                    tool_choice: { type: 'tool', name: TOOL_NAMES.VRAAG_VERDUIDELIJKING },
                    messages: currentMessages,
                    temperature: 0,
                  });

                  // Process retry response for ask_clarification
                  for (const block of retryResponse.content) {
                    if (block.type === 'tool_use' && block.name === TOOL_NAMES.VRAAG_VERDUIDELIJKING) {
                      const clarificationInput = block.input as {
                        summary: string;
                        questions: Array<{ id: string; question: string; type: string; options?: string[]; required: boolean; fieldName?: string; toolName?: string }>;
                      };

                      // Deduplicate questions by question text (case-insensitive)
                      const seenQuestions = new Set<string>();
                      const deduplicatedQuestions = clarificationInput.questions.filter(q => {
                        const normalized = q.question.toLowerCase().trim();
                        if (seenQuestions.has(normalized)) {
                          return false;
                        }
                        seenQuestions.add(normalized);
                        return true;
                      });

                      sendEvent('clarification', {
                        summary: clarificationInput.summary,
                        questions: deduplicatedQuestions,
                      });
                      sendEvent('phase', { phase: 'clarifying' });
                      sendEvent('response', {
                        text: '',
                        toolResults: allToolResults,
                        awaitingClarification: true,
                        clarificationData: { ...clarificationInput, questions: deduplicatedQuestions },
                      });

                      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                      controller.close();
                      return;
                    }
                  }
                }

                // Emit 'planning' phase when Claude is actually creating a plan
                sendEvent('phase', { phase: 'planning' });
                sendEvent('plan_proposal', {
                  summary: planInput.summary,
                  actions: planInput.actions,
                });
                sendEvent('phase', { phase: 'awaiting_approval' });

                // Return early - don't execute further until approval
                sendEvent('response', {
                  text: '',
                  toolResults: allToolResults,
                  awaitingApproval: true,
                  plan: planInput,
                });

                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
                return;
              }

              // If we have an approved plan, use the plan's parameters instead of AI's
              let toolInput = toolUse.input as Record<string, unknown>;

              if (approvedPlan) {
                currentPlanStep++;

                const planAction = approvedPlan.actions.find(a => a.step === currentPlanStep);

                if (planAction && planAction.details) {
                  toolInput = planAction.details;
                }

                // Inject step references for known tool patterns
                // This ensures references are used even if AI didn't include them
                if (toolUse.name === TOOL_NAMES.VOEG_MELDING_TOE_AAN_DOSSIER && currentPlanStep > 1) {
                  const createSignalStep = approvedPlan.actions.find(a => a.tool === TOOL_NAMES.MAAK_MELDING);

                  if (createSignalStep && createSignalStep.step < currentPlanStep) {
                    toolInput = {
                      ...toolInput,
                      melding_id: `$step${createSignalStep.step}.signalId`
                    };
                  }
                }

                if (toolUse.name === TOOL_NAMES.VOLTOOI_BIBOB_AANVRAAG || toolUse.name === TOOL_NAMES.SLA_BIBOB_AANVRAAG_CONCEPT_OP) {
                  const createCaseStep = approvedPlan.actions.find(a => a.tool === TOOL_NAMES.MAAK_DOSSIER);

                  if (createCaseStep && createCaseStep.step < currentPlanStep) {
                    // Only inject if dossier_id looks like a fake ID (not an existing case ID)
                    const currentCaseId = (toolInput as Record<string, unknown>).dossier_id as string;
                    if (currentCaseId && !currentCaseId.startsWith('case-') && !currentCaseId.startsWith('$step')) {
                      toolInput = {
                        ...toolInput,
                        dossier_id: `$step${createCaseStep.step}.caseId`
                      };
                    }
                  }
                }

                if (toolUse.name === TOOL_NAMES.MAAK_DOSSIER) {
                  const createSignalStep = approvedPlan.actions.find(a => a.tool === TOOL_NAMES.MAAK_MELDING);

                  if (createSignalStep && createSignalStep.step < currentPlanStep) {
                    // If meldingIds is present but doesn't use reference syntax, inject it
                    const meldingIds = (toolInput as Record<string, unknown>).meldingIds as string[] | undefined;
                    if (meldingIds && meldingIds.length > 0) {
                      const hasReference = meldingIds.some(id => id.startsWith('$step'));
                      if (!hasReference) {
                        toolInput = {
                          ...toolInput,
                          meldingIds: [`$step${createSignalStep.step}.signalId`]
                        };
                      }
                    }
                  }
                }
              }

              sendEvent('tool_call', { tool: toolUse.name, input: toolInput });

              let result = '';

              // Handle summarize_attachments server-side
              if (toolUse.name === TOOL_NAMES.VAT_BIJLAGEN_SAMEN) {
                const signalId = (toolInput as { melding_id: string }).melding_id;
                result = await summarizeAttachmentsForSignal(signalId, signals);
              } else {
                // For other tools, return success - client will execute
                result = JSON.stringify({ success: true, tool: toolUse.name, input: toolInput });
              }

              allToolResults.push({
                name: toolUse.name,
                input: toolInput as Record<string, unknown>,
                result,
              });

              sendEvent('tool_result', { tool: toolUse.name, result, status: 'success' });

              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: result,
              });
            }

            // Add assistant response and tool results to messages for next iteration
            currentMessages = [
              ...currentMessages,
              { role: 'assistant' as const, content: response.content },
              { role: 'user' as const, content: toolResults },
            ];

            // Reflection phase
            sendEvent('phase', { phase: 'reflecting' });

            // Mark workflow as complete
            sendEvent('phase', { phase: 'complete' });
          }

          // Send accumulated tool results back to client after loop completes
          sendEvent('response', {
            text: textContent || 'Completed.',
            toolResults: allToolResults
          });

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming mode (legacy support)
    // Let Claude decide between ask_clarification and plan_proposal based on whether required fields are present
    const response = await anthropic.messages.create({
      model: 'eu.anthropic.claude-opus-4-6-v1',
      max_tokens: 2048,
      system: systemPrompt,
      tools,
      messages: anthropicMessages,
      temperature: 0,
    });

    // Process the response
    let textContent = '';
    const toolUses: { name: string; input: Record<string, unknown>; result?: string }[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        textContent += block.text;
      } else if (block.type === 'tool_use') {
        const toolUse: { name: string; input: Record<string, unknown>; result?: string } = {
          name: block.name,
          input: block.input as Record<string, unknown>,
        };

        // Handle summarize_attachments tool server-side
        if (block.name === TOOL_NAMES.VAT_BIJLAGEN_SAMEN) {
          const signalId = (block.input as { melding_id: string }).melding_id;
          toolUse.result = await summarizeAttachmentsForSignal(signalId, signals);
        }

        toolUses.push(toolUse);
      }
    }

    return NextResponse.json({
      content: textContent,
      toolUses,
      stopReason: response.stop_reason,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
